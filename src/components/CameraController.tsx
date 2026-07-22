import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  playerRef: React.RefObject<THREE.Group | null>;
}

const collisionBuildings = [
  { x: 0.0, z: 20, r: 3.5 },
  { x: 12.5, z: 10, r: 3.5 },
  { x: 10.8, z: 0, r: 3.5 },
  { x: -3.2, z: -10, r: 3.5 },
  { x: -9.2, z: -20, r: 3.5 },
  { x: -3.8, z: -30, r: 3.5 },
  { x: -9.8, z: -40, r: 3.5 },
  { x: 0.9, z: -52, r: 4.5 },
];

export default function CameraController({ gameState, playerRef }: CameraControllerProps) {
  const { camera, gl } = useThree();
  
  // Camera angles (yaw = theta, pitch = phi)
  const anglesRef = useRef({ theta: Math.PI, phi: 0.15 }); // Start behind player (Math.PI looking North)
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Camera settings
  const targetDistanceRef = useRef(5.5);
  const currentDistanceRef = useRef(5.5);
  const currentLookAtRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Rotate camera by dragging
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || gameState !== 'explore') return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const sensitivity = 0.003;
      anglesRef.current.theta -= deltaX * sensitivity;
      anglesRef.current.phi += deltaY * sensitivity;

      // Clamp pitch to avoid ground clipping or going overhead
      anglesRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.8, anglesRef.current.phi));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || gameState !== 'explore' || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      const sensitivity = 0.005;
      anglesRef.current.theta -= deltaX * sensitivity;
      anglesRef.current.phi += deltaY * sensitivity;

      anglesRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.8, anglesRef.current.phi));

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const dom = gl.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleTouchMove, { passive: true });
    dom.addEventListener('touchend', handleMouseUp);

    return () => {
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleMouseUp);
    };
  }, [gl, gameState]);

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const playerPos = new THREE.Vector3();
    playerRef.current.getWorldPosition(playerPos);

    // Height offset representing the player's chest/look target
    const targetLookAt = playerPos.clone().add(new THREE.Vector3(0, 1.25, 0));
    currentLookAtRef.current.lerp(targetLookAt, delta * 8);

    if (gameState !== 'explore') {
      // Dialogue/Start cinematic camera: fixed position facing the player character
      // Character is looking south (towards screen), so camera is positioned south looking north
      const introCamPos = playerPos.clone().add(new THREE.Vector3(0, 1.35, 3.2));
      camera.position.lerp(introCamPos, delta * 3);
      camera.lookAt(currentLookAtRef.current);
    } else {
      // Exploration camera following behind player
      // Fetch user inputs/velocity to adjust target distance (zoom out slightly when moving)
      const rigidBody = playerRef.current.parent;
      let speed = 0;
      if (rigidBody && (rigidBody as any).linvel) {
        const vel = (rigidBody as any).linvel();
        speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      }
      
      // Dynamic camera distance zoom
      const baseDistance = 5.2;
      const zoomFactor = Math.min(1.2, speed * 0.12);
      targetDistanceRef.current = baseDistance + zoomFactor;
      
      currentDistanceRef.current = THREE.MathUtils.lerp(
        currentDistanceRef.current,
        targetDistanceRef.current,
        delta * 4
      );

      // Calculate desired camera position using spherical coordinates centered on currentLookAtRef
      const theta = anglesRef.current.theta;
      const phi = anglesRef.current.phi;
      const radius = currentDistanceRef.current;

      const offset = new THREE.Vector3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
      );

      let desiredCamPos = currentLookAtRef.current.clone().add(offset);

      // Simple, performant collision checks with terrain and buildings
      // 1. Minimum height clamp to prevent looking below ground
      const minCamHeight = playerPos.y + 0.65;
      if (desiredCamPos.y < minCamHeight) {
        desiredCamPos.y = minCamHeight;
      }

      // 2. Collision with Buildings
      collisionBuildings.forEach(b => {
        const dx = desiredCamPos.x - b.x;
        const dz = desiredCamPos.z - b.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < b.r && dist > 0.001) {
          desiredCamPos.x = b.x + (dx / dist) * b.r;
          desiredCamPos.z = b.z + (dz / dist) * b.r;
        }
      });

      // Lerp camera to target position smoothly
      camera.position.lerp(desiredCamPos, delta * 12);
      camera.lookAt(currentLookAtRef.current);
    }
  });

  return null;
}
