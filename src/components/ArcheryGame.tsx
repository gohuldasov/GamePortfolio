import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';

interface ArcheryGameProps {
  isArcheryMode: boolean;
  onScorePoints: (points: number, hitType: string) => void;
  onPowerChange: (power: number) => void;
  onShootArrow: () => void;
}

interface Arrow {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  isStuck: boolean;
}

// Materials for 3D Bow & Arrows
const bowWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.6 });
const bowGripMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.8 });
const bowStringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const arrowShaftMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
const arrowTipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
const arrowFletchingMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
const hitFlashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8 });

// Target centers relative to Archery Range base at (x: 18, z: -44)
const TARGET_LIST = [
  { id: 't1', x: 18 - 3.2, z: -58.0, centerHeight: 1.6 },
  { id: 't2', x: 18,       z: -62.0, centerHeight: 1.6 },
  { id: 't3', x: 18 + 3.2, z: -58.0, centerHeight: 1.6 },
  { id: 't4', x: 18 - 1.6, z: -68.0, centerHeight: 1.6 },
  { id: 't5', x: 18 + 1.6, z: -68.0, centerHeight: 1.6 },
];

export default function ArcheryGame({ isArcheryMode, onScorePoints, onPowerChange, onShootArrow }: ArcheryGameProps) {
  const { camera } = useThree();
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const isMouseDownRef = useRef(false);
  const powerRef = useRef(0);
  const aimPitchRef = useRef(0.08); // Vertical tilt angle
  const aimYawRef = useRef(0.0);    // Horizontal pan angle

  const bowGroupRef = useRef<THREE.Group>(null);
  const bowStringLeftRef = useRef<THREE.Mesh>(null);
  const bowStringRightRef = useRef<THREE.Mesh>(null);
  const nockedArrowRef = useRef<THREE.Group>(null);
  const hitParticlesRef = useRef<{ pos: THREE.Vector3; scale: number; id: number }[]>([]);

  // Reset aiming when entering Archery Mode
  useEffect(() => {
    if (isArcheryMode) {
      aimPitchRef.current = 0.05;
      aimYawRef.current = 0.0;
      powerRef.current = 0;
      onPowerChange(0);
    }
  }, [isArcheryMode, onPowerChange]);

  // Handle Mouse Aiming & Pull-and-Release Controls
  useEffect(() => {
    if (!isArcheryMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = (e.clientX - centerX) / centerX; // -1 to 1
      const deltaY = (e.clientY - centerY) / centerY; // -1 to 1

      // Smooth Aim Yaw & Pitch bounds
      aimYawRef.current = -deltaX * 0.45;
      aimPitchRef.current = -deltaY * 0.35 + 0.05;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isMouseDownRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && isMouseDownRef.current) {
        isMouseDownRef.current = false;
        shootArrow();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isArcheryMode]);

  // Launch Arrow Projectile
  const shootArrow = () => {
    const power = powerRef.current;
    if (power < 0.08) {
      powerRef.current = 0;
      onPowerChange(0);
      return;
    }

    const yaw = aimYawRef.current;
    const pitch = aimPitchRef.current;
    const initialSpeed = 18.0 + power * 42.0; // 18 to 60 m/s depending on power

    // Arrow spawn origin near bow resting position
    const origin = new THREE.Vector3(18.0, getTerrainHeight(18, -36.0) + 1.6, -36.0);
    const forward = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    ).normalize();

    const vel = forward.multiplyScalar(initialSpeed);
    const rot = new THREE.Euler(pitch, yaw, 0);

    const newArrow: Arrow = {
      id: Date.now() + Math.random(),
      pos: origin.clone(),
      vel: vel,
      rot: rot,
      isStuck: false,
    };

    setArrows((prev) => [...prev.slice(-20), newArrow]); // Keep last 20 arrows
    onShootArrow();

    // Reset draw power
    powerRef.current = 0;
    onPowerChange(0);
  };

  // Main Physics & Animation Frame Loop
  useFrame((_, delta) => {
    // 1. Charge Bow String Power when mouse is held down
    if (isArcheryMode && isMouseDownRef.current) {
      powerRef.current = Math.min(1.0, powerRef.current + delta * 1.1);
      onPowerChange(powerRef.current);
    }

    // 2. Animate Bow Limb Flex & String Pull Back in 3D
    if (bowGroupRef.current && isArcheryMode) {
      const p = powerRef.current;
      // Bow positioning relative to camera
      const yaw = aimYawRef.current;
      const pitch = aimPitchRef.current;

      const origin = new THREE.Vector3(18.0, getTerrainHeight(18, -36.0) + 1.5, -36.0);
      bowGroupRef.current.position.copy(origin);
      bowGroupRef.current.rotation.set(pitch, yaw, -0.1);

      // Draw string pull-back distance
      if (nockedArrowRef.current) {
        nockedArrowRef.current.position.z = 0.2 + p * 0.45;
      }
    }

    // 3. Update Flying Arrow Trajectories & Collision Detection
    setArrows((prevArrows) => {
      let updated = false;
      const nextArrows = prevArrows.map((arrow) => {
        if (arrow.isStuck) return arrow;

        updated = true;
        const nextPos = arrow.pos.clone().addScaledVector(arrow.vel, delta);
        const nextVel = arrow.vel.clone();

        // Gravity acceleration on y-axis
        nextVel.y -= 9.81 * delta * 0.85;

        // Calculate pitch angle based on velocity vector
        const horizSpeed = Math.hypot(nextVel.x, nextVel.z);
        const pitchAngle = Math.atan2(nextVel.y, horizSpeed);
        const yawAngle = Math.atan2(nextVel.x, -nextVel.z);
        const nextRot = new THREE.Euler(pitchAngle, yawAngle, 0);

        // Check Target Board Hits
        for (const target of TARGET_LIST) {
          const targetY = getTerrainHeight(target.x, target.z) + target.centerHeight;
          const distZ = Math.abs(nextPos.z - target.z);
          const distX = Math.abs(nextPos.x - target.x);
          const distY = Math.abs(nextPos.y - targetY);

          if (distZ < 0.6 && distX < 1.2 && distY < 1.2) {
            // Radial distance from target center spot
            const r = Math.hypot(nextPos.x - target.x, nextPos.y - targetY);

            let points = 0;
            let label = 'MISS';
            if (r <= 0.28) {
              points = 100;
              label = '🎯 BULLSEYE! +100';
            } else if (r <= 0.60) {
              points = 50;
              label = '🔴 INNER RING! +50';
            } else if (r <= 0.95) {
              points = 25;
              label = '🔵 OUTER RING! +25';
            } else {
              points = 10;
              label = '🪵 TARGET BOARD! +10';
            }

            onScorePoints(points, label);

            // Add visual hit flash particle
            hitParticlesRef.current.push({ pos: nextPos.clone(), scale: 1.0, id: Date.now() });

            return { ...arrow, pos: nextPos, vel: new THREE.Vector3(0, 0, 0), rot: nextRot, isStuck: true };
          }
        }

        // Check Ground Collision
        const groundY = getTerrainHeight(nextPos.x, nextPos.z);
        if (nextPos.y <= groundY + 0.1) {
          nextPos.y = groundY + 0.1;
          return { ...arrow, pos: nextPos, vel: new THREE.Vector3(0, 0, 0), rot: nextRot, isStuck: true };
        }

        return { ...arrow, pos: nextPos, vel: nextVel, rot: nextRot };
      });

      return updated ? nextArrows : prevArrows;
    });
  });

  return (
    <group>
      {/* 🏹 3D Bow Model (Rendered when in Archery Mode) */}
      {isArcheryMode && (
        <group ref={bowGroupRef} position={[18, getTerrainHeight(18, -36) + 1.5, -36]}>
          <group position={[0.35, -0.15, -0.7]}>
            {/* Wooden Bow Grip Handle */}
            <mesh material={bowGripMat} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.35, 8]} />
            </mesh>
            {/* Upper Bow Limb Arc */}
            <mesh position={[0, 0.5, 0.1]} rotation={[-0.3, 0, 0]} material={bowWoodMat} castShadow>
              <cylinderGeometry args={[0.03, 0.04, 0.8, 8]} />
            </mesh>
            {/* Lower Bow Limb Arc */}
            <mesh position={[0, -0.5, 0.1]} rotation={[0.3, 0, 0]} material={bowWoodMat} castShadow>
              <cylinderGeometry args={[0.03, 0.04, 0.8, 8]} />
            </mesh>
            {/* Bowstring Top to Bottom */}
            <mesh position={[0, 0, 0.35]} material={bowStringMat}>
              <cylinderGeometry args={[0.006, 0.006, 1.6, 4]} />
            </mesh>

            {/* Nocked Arrow ready on bow */}
            <group ref={nockedArrowRef} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh material={arrowShaftMat}>
                <cylinderGeometry args={[0.015, 0.015, 0.85, 8]} />
              </mesh>
              <mesh position={[0, 0.45, 0]} material={arrowTipMat}>
                <coneGeometry args={[0.03, 0.12, 5]} />
              </mesh>
              <mesh position={[0, -0.4, 0]} material={arrowFletchingMat}>
                <boxGeometry args={[0.08, 0.14, 0.01]} />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {/* 🚀 Rendered Active & Stuck Arrows in World */}
      {arrows.map((arr) => (
        <group key={arr.id} position={[arr.pos.x, arr.pos.y, arr.pos.z]} rotation={arr.rot}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            {/* Wooden Shaft */}
            <mesh material={arrowShaftMat} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.9, 8]} />
            </mesh>
            {/* Metal Arrowhead Tip */}
            <mesh position={[0, 0.48, 0]} material={arrowTipMat} castShadow>
              <coneGeometry args={[0.035, 0.14, 6]} />
            </mesh>
            {/* Red Fletching Feathers */}
            <mesh position={[0, -0.42, 0]} material={arrowFletchingMat} castShadow>
              <boxGeometry args={[0.09, 0.15, 0.01]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* ✨ Hit Particle Effect Flashes */}
      {hitParticlesRef.current.map((p) => (
        <mesh key={p.id} position={p.pos} material={hitFlashMat}>
          <sphereGeometry args={[0.4, 8, 8]} />
        </mesh>
      ))}
    </group>
  );
}
