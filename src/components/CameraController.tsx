import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { archeryAimRef } from './ArcheryGame';
import { getTerrainHeight } from '../utils/terrain';

interface CameraControllerProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  playerRef: React.RefObject<THREE.Group | null>;
  isArcheryMode?: boolean;
}

// Building centers for camera collision avoidance
const collisionBuildings = [
  { x: -72.0, z: -45.0, r: 4.5 }, // House 1 About Me
  { x: -20.0, z: -68.0, r: 4.5 }, // House 2 Education
  { x: 75.0,  z: -20.0, r: 4.5 }, // House 3 Skills
  { x: -75.0, z: -10.0, r: 4.5 }, // House 4 Projects
  { x: -75.0, z: 35.0,  r: 4.5 }, // House 5 Experience
  { x: 75.0,  z: 30.0,  r: 5.0 }, // Church Developer Workshop
  { x: 75.0,  z: -70.0, r: 5.5 }, // Barn & Silo Contact Area
  { x: -85.0, z: -78.0, r: 4.5 }, // Windmill
  { x: 50.0,  z: -45.0, r: 6.0 }, // Dedicated Archery Range Arena
  { x: -25.0, z: -35.0, r: 6.0 }, // Town Hall
  { x: 48.0,  z: 45.0,  r: 4.5 }, // Bakery & Tavern
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
      if (isArcheryMode) return;
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
      if (isArcheryMode) return;
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || gameState !== 'explore' || isArcheryMode || e.touches.length !== 1) return;

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
  }, [gl, gameState, isArcheryMode]);

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const playerPos = new THREE.Vector3();
    playerRef.current.getWorldPosition(playerPos);

    // Look target centered on player height
    const targetLookAt = playerPos.clone().add(new THREE.Vector3(0, 1.25, 0));
    currentLookAtRef.current.lerp(targetLookAt, delta * 12);

    if (isArcheryMode) {
      // Static camera position (Zero camera translation/wobble) with smooth aim rotation
      const yaw = archeryAimRef.yaw;
      const pitch = archeryAimRef.pitch;
      const playerY = getTerrainHeight(50.0, -36.5) + 1.2;

      // Fixed over-the-shoulder camera position
      const archeryCamPos = new THREE.Vector3(50.5, playerY + 1.75, -34.2);
      
      // Look target pans smoothly left/right (yaw) and up/down (pitch) to aim crosshair at target boards
      const archeryLookTarget = new THREE.Vector3(
        50.0 + yaw * 18.0,
        playerY + 1.45 + pitch * 14.0,
        -63.0
      );

      camera.position.copy(archeryCamPos);
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

