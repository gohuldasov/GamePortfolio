import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';

interface ArcheryGameProps {
  isArcheryMode: boolean;
  onScorePoints: (points: number, hitType: string) => void;
  onPowerChange: (power: number) => void;
  onShootArrow: () => void;
}

export interface Arrow {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  isStuck: boolean;
}

// Global mutable aim & draw power reference shared with Camera and Player
export const archeryAimRef = {
  yaw: 0.0,
  pitch: 0.05,
  power: 0.0,
};

// Materials for 3D Bow & Arrows
const bowWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.6 });
const bowGripMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.8 });
const bowStringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const arrowShaftMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
const arrowTipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
const arrowFletchingMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
const hitFlashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8 });

// Target centers relative to Archery Range base at (x: 50, z: -45)
const TARGET_LIST = [
  { id: 't1', x: 50.0 - 3.2, z: -59.0, centerHeight: 1.6 },
  { id: 't2', x: 50.0,       z: -63.0, centerHeight: 1.6 },
  { id: 't3', x: 50.0 + 3.2, z: -59.0, centerHeight: 1.6 },
  { id: 't4', x: 50.0 - 1.6, z: -69.0, centerHeight: 1.6 },
  { id: 't5', x: 50.0 + 1.6, z: -69.0, centerHeight: 1.6 },
];

// Sub-component to ensure 60 FPS smooth position updates of flying arrow meshes in Three.js scene
function FlyingArrow({ arrow }: { arrow: Arrow }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(arrow.pos);
      groupRef.current.rotation.copy(arrow.rot);
    }
  });

  return (
    <group ref={groupRef} position={arrow.pos} rotation={arrow.rot}>
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
  );
}

export default function ArcheryGame({ isArcheryMode, onScorePoints, onPowerChange, onShootArrow }: ArcheryGameProps) {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const isMouseDownRef = useRef(false);
  const powerRef = useRef(0);
  const aimPitchRef = useRef(0.05); // Smooth current pitch
  const aimYawRef = useRef(0.0);    // Smooth current yaw
  const targetPitchRef = useRef(0.05);
  const targetYawRef = useRef(0.0);

  const bowGroupRef = useRef<THREE.Group>(null);
  const nockedArrowRef = useRef<THREE.Group>(null);
  const hitParticlesRef = useRef<{ pos: THREE.Vector3; scale: number; id: number }[]>([]);

  const bowStringRef = useRef<THREE.Mesh>(null);
  const onPowerChangeRef = useRef(onPowerChange);

  useEffect(() => {
    onPowerChangeRef.current = onPowerChange;
  }, [onPowerChange]);

  // Reset aiming when entering Archery Mode
  useEffect(() => {
    if (isArcheryMode) {
      aimPitchRef.current = 0.05;
      aimYawRef.current = 0.0;
      targetPitchRef.current = 0.05;
      targetYawRef.current = 0.0;
      powerRef.current = 0;
      isMouseDownRef.current = false;
      archeryAimRef.yaw = 0.0;
      archeryAimRef.pitch = 0.05;
      archeryAimRef.power = 0.0;
      onPowerChangeRef.current(0);
    }
  }, [isArcheryMode]);

  // Handle Mouse Aiming & Pull-and-Release Controls (Smooth, Zero Camera Shake)
  useEffect(() => {
    if (!isArcheryMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = (e.clientX - centerX) / centerX; // -1 to 1
      const deltaY = (e.clientY - centerY) / centerY; // -1 to 1

      // Set target aim angles based on mouse position relative to screen center
      targetYawRef.current = -deltaX * 0.65;
      targetPitchRef.current = -deltaY * 0.45 + 0.05;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        e.preventDefault();
        isMouseDownRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && isMouseDownRef.current) {
        e.preventDefault();
        isMouseDownRef.current = false;
        shootArrow();
      }
    };

    const handleMouseLeave = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        powerRef.current = 0;
        archeryAimRef.power = 0;
        onPowerChangeRef.current(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isArcheryMode]);

  // Launch Arrow Projectile directly along Crosshair Line-of-Sight
  const shootArrow = () => {
    let power = powerRef.current;

    // Minimum power floor (0.35) so every click fires, while holding charges full power (1.0)
    if (power < 0.08) {
      power = 0.35;
    }

    const yaw = aimYawRef.current;
    const pitch = aimPitchRef.current;
    const initialSpeed = 28.0 + power * 36.0; // 28 to 64 m/s depending on power

    // Firing line position: X: 50.0, Z: -36.5
    const playerBaseY = getTerrainHeight(50.0, -36.5) + 0.2;
    const origin = new THREE.Vector3(50.0, playerBaseY + 1.45, -36.5);

    // Calculate crosshair 3D target point at target plane (Z: -63.0)
    // Includes +0.35m vertical gravity compensation offset so arrow hits EXACTLY on crosshair dot
    const targetPoint = new THREE.Vector3(
      50.0 + yaw * 14.0,
      playerBaseY + 1.5 + pitch * 12.0 + 0.35,
      -63.0
    );

    // Arrow velocity vector calculated directly from origin to crosshair target point
    const dir = targetPoint.clone().sub(origin).normalize();
    const vel = dir.multiplyScalar(initialSpeed);

    // Calculate rotation matching arrow trajectory vector
    const horizSpeed = Math.hypot(dir.x, dir.z);
    const pitchAngle = Math.atan2(dir.y, horizSpeed);
    const yawAngle = Math.atan2(dir.x, -dir.z);
    const rot = new THREE.Euler(pitchAngle, yawAngle, 0);

    const newArrow: Arrow = {
      id: Date.now() + Math.random(),
      pos: origin.clone(),
      vel: vel,
      rot: rot,
      isStuck: false,
    };

    setArrows((prev) => [...prev.slice(-25), newArrow]);
    onShootArrow();

    // Reset draw power
    powerRef.current = 0;
    archeryAimRef.power = 0;
    onPowerChangeRef.current(0);
  };

  // Main Physics & Animation Frame Loop (60 FPS)
  useFrame((_, delta) => {
    // 0. Smoothly interpolate aim angles to prevent any camera shaking or mouse jitter
    const damp = 1 - Math.exp(-14 * delta);
    aimYawRef.current += (targetYawRef.current - aimYawRef.current) * damp;
    aimPitchRef.current += (targetPitchRef.current - aimPitchRef.current) * damp;

    archeryAimRef.yaw = aimYawRef.current;
    archeryAimRef.pitch = aimPitchRef.current;

    // 1. Charge Bow String Power when mouse is held down
    if (isArcheryMode && isMouseDownRef.current) {
      powerRef.current = Math.min(1.0, powerRef.current + delta * 1.5);
      archeryAimRef.power = powerRef.current;
      onPowerChangeRef.current(powerRef.current);
    }

    // 2. Animate Bow Limb Flex & String Pull Back in 3D (Steady aim, zero recoil)
    if (bowGroupRef.current && isArcheryMode) {
      const p = powerRef.current;
      const yaw = aimYawRef.current;
      const pitch = aimPitchRef.current;

      const playerBaseY = getTerrainHeight(50.0, -36.5) + 0.2;
      const bowOrigin = new THREE.Vector3(
        50.0 - 0.15,
        playerBaseY + 1.35,
        -36.8
      );

      bowGroupRef.current.position.copy(bowOrigin);
      bowGroupRef.current.rotation.set(pitch, yaw * 0.4, 0.0); // Aim tilt

      // Draw string pull-back distance
      if (nockedArrowRef.current) {
        nockedArrowRef.current.position.z = 0.2 + p * 0.45;
      }
      if (bowStringRef.current) {
        bowStringRef.current.position.z = 0.35 + p * 0.45;
      }
    }

    // 3. Update Flying Arrow Trajectories & Collision Detection
    setArrows((prevArrows) => {
      let updated = false;

      const nextArrows = prevArrows.map((arrow) => {
        if (arrow.isStuck) return arrow;

        updated = true;
        arrow.pos.addScaledVector(arrow.vel, delta);

        // Light realistic gravity acceleration
        arrow.vel.y -= 9.81 * delta * 0.45;

        // Calculate pitch angle based on velocity vector
        const horizSpeed = Math.hypot(arrow.vel.x, arrow.vel.z);
        const pitchAngle = Math.atan2(arrow.vel.y, horizSpeed);
        const yawAngle = Math.atan2(arrow.vel.x, -arrow.vel.z);
        arrow.rot = new THREE.Euler(pitchAngle, yawAngle, 0);

        // Check Target Board Hits
        for (const target of TARGET_LIST) {
          const targetY = getTerrainHeight(target.x, target.z) + target.centerHeight;
          const distZ = Math.abs(arrow.pos.z - target.z);
          const distX = Math.abs(arrow.pos.x - target.x);
          const distY = Math.abs(arrow.pos.y - targetY);

          if (distZ < 0.7 && distX < 1.2 && distY < 1.2) {
            const r = Math.hypot(arrow.pos.x - target.x, arrow.pos.y - targetY);

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
            hitParticlesRef.current.push({ pos: arrow.pos.clone(), scale: 1.0, id: Date.now() });

            return { ...arrow, vel: new THREE.Vector3(0, 0, 0), isStuck: true };
          }
        }

        // Check Ground Collision
        const groundY = getTerrainHeight(arrow.pos.x, arrow.pos.z);
        if (arrow.pos.y <= groundY + 0.1) {
          arrow.pos.y = groundY + 0.1;
          return { ...arrow, vel: new THREE.Vector3(0, 0, 0), isStuck: true };
        }

        return arrow;
      });

      return updated ? [...nextArrows] : prevArrows;
    });
  });

  const playerBaseY = getTerrainHeight(50.0, -36.5) + 0.2;

  return (
    <group>
      {/* 🏹 3D Bow Model (Rendered in Third Person Mode) */}
      {isArcheryMode && (
        <group ref={bowGroupRef} position={[50, playerBaseY + 1.35, -36.8]}>
          <group position={[0.25, -0.05, -0.2]}>
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
            {/* Bowstring Top to Bottom (Pulls back at center with draw power) */}
            <mesh ref={bowStringRef} position={[0, 0, 0.35]} material={bowStringMat}>
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

      {/* 🚀 Rendered Active & Stuck Flying Arrows in 3D World */}
      {arrows.map((arr) => (
        <FlyingArrow key={arr.id} arrow={arr} />
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
