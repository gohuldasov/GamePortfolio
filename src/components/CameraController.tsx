import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  playerRef: React.RefObject<THREE.Group | null>;
  isArcheryMode?: boolean;
}

// Building centers for camera collision avoidance
const collisionBuildings = [
  { x: -22.0, z: -22.0, r: 3.5 }, // House 1
  { x: 2.0, z: -18.0, r: 3.5 },   // House 2
  { x: 24.0, z: -5.0, r: 3.5 },   // House 3
  { x: -22.0, z: -5.0, r: 3.5 },  // House 4
  { x: -22.0, z: 15.0, r: 3.5 },  // House 5
  { x: 20.0, z: 10.0, r: 4.2 },   // Church
  { x: 24.0, z: -32.0, r: 4.8 },  // Barn & Silo
  { x: -24.0, z: -36.0, r: 3.8 }, // Windmill
];

export default function CameraController({ gameState, playerRef, isArcheryMode }: CameraControllerProps) {
  const { camera, gl } = useThree();
  
  // Camera angles (yaw = theta, pitch = phi)
  const anglesRef = useRef({ theta: Math.PI, phi: 0.22 }); // Start behind player looking North
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Camera settings
  const targetDistanceRef = useRef(6.0);
  const currentDistanceRef = useRef(6.0);
  const currentLookAtRef = useRef(new THREE.Vector3(0, 1.25, 25));

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || gameState !== 'explore' || isArcheryMode) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const sensitivity = 0.0035;
      anglesRef.current.theta -= deltaX * sensitivity;
      anglesRef.current.phi += deltaY * sensitivity;

      // Clamp pitch to avoid ground clipping or going overhead
      anglesRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.6, anglesRef.current.phi));

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

      const sensitivity = 0.0055;
      anglesRef.current.theta -= deltaX * sensitivity;
      anglesRef.current.phi += deltaY * sensitivity;

      anglesRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.6, anglesRef.current.phi));

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

    // Look target centered on player height
    const targetLookAt = playerPos.clone().add(new THREE.Vector3(0, 1.25, 0));
    currentLookAtRef.current.lerp(targetLookAt, delta * 12);

    if (isArcheryMode) {
      // First-person over-the-shoulder Archery Firing Line camera
      const archeryCamPos = new THREE.Vector3(18.0, 3.2, -35.2);
      const archeryLookTarget = new THREE.Vector3(18.0, 2.8, -58.0);
      camera.position.lerp(archeryCamPos, delta * 10);
      camera.lookAt(archeryLookTarget);
    } else if (gameState !== 'explore') {
      // Cinematic camera framing player character & village path clearly from front
      const introCamPos = playerPos.clone().add(new THREE.Vector3(0, 1.5, 5.0));
      camera.position.lerp(introCamPos, delta * 8);
      camera.lookAt(currentLookAtRef.current);
    } else {
      // Exploration camera following smooth behind player
      const rigidBody = playerRef.current.parent;
      let speed = 0;
      if (rigidBody && (rigidBody as any).linvel) {
        const vel = (rigidBody as any).linvel();
        speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      }
      
      // Dynamic camera distance zoom when sprinting
      const baseDistance = 5.8;
      const zoomFactor = Math.min(1.4, speed * 0.15);
      targetDistanceRef.current = baseDistance + zoomFactor;
      
      currentDistanceRef.current = THREE.MathUtils.lerp(
        currentDistanceRef.current,
        targetDistanceRef.current,
        delta * 5
      );

      // Spherical coordinate offsets around player position
      const theta = anglesRef.current.theta;
      const phi = anglesRef.current.phi;
      const radius = currentDistanceRef.current;

      const offset = new THREE.Vector3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
      );

      let desiredCamPos = currentLookAtRef.current.clone().add(offset);

      // Clamp height to prevent looking through floor plane
      const minCamHeight = playerPos.y + 0.65;
      if (desiredCamPos.y < minCamHeight) {
        desiredCamPos.y = minCamHeight;
      }

      // Soft collision push with building walls
      collisionBuildings.forEach(b => {
        const dx = desiredCamPos.x - b.x;
        const dz = desiredCamPos.z - b.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < b.r && dist > 0.001) {
          desiredCamPos.x = b.x + (dx / dist) * b.r;
          desiredCamPos.z = b.z + (dz / dist) * b.r;
        }
      });

      // Lerp camera position smoothly to follow player motion
      camera.position.lerp(desiredCamPos, delta * 14);
      camera.lookAt(currentLookAtRef.current);
    }
  });

  return null;
}

