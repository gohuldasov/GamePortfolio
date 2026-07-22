import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { getRoadX, getRoadAngle, getRoadPerp } from '../utils/roadPath';

interface PlayerProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  playerRef: React.RefObject<THREE.Group | null>;
  setProximityText: (text: string | null) => void;
  currentModal: string | null;
}

// Shared Player Procedural Materials (Module scope to avoid GC churn)
const materials = {
  skin: new THREE.MeshToonMaterial({ color: 0xfcc4b6 }),
  hair: new THREE.MeshToonMaterial({ color: 0x3a1f0a }),  // Dark brown messy hair
  shirt: new THREE.MeshToonMaterial({ color: 0x1a4a8a }),  // Deep ocean blue hoodie
  shirtInner: new THREE.MeshToonMaterial({ color: 0xdde8f8 }),  // Light blue inner collar
  pants: new THREE.MeshToonMaterial({ color: 0x2c3a50 }),  // Dark navy jeans
  shoes: new THREE.MeshToonMaterial({ color: 0x6b3d1e }),  // Warm brown leather boots
  sole: new THREE.MeshToonMaterial({ color: 0x3d2010 }),  // Dark brown sole
  laces: new THREE.MeshToonMaterial({ color: 0xc49a6c }),  // Tan laces
  belt: new THREE.MeshToonMaterial({ color: 0x3a2010 }),  // Dark leather belt
  buckle: new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Gold buckle
  eyes: new THREE.MeshToonMaterial({ color: 0xffffff }),
  iris: new THREE.MeshToonMaterial({ color: 0x5a3010 }),
  pupil: new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
  backpack: new THREE.MeshToonMaterial({ color: 0x7a5230 }),  // Mid-brown leather pack
  backpackDark: new THREE.MeshToonMaterial({ color: 0x4a3020 }),  // Dark brown straps
  backpackGold: new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Gold clasps
};

export default function Player({ gameState, playerRef, setProximityText, currentModal }: PlayerProps) {
  const { camera } = useThree();
  const rbRef = useRef<any>(null);
  
  // Track keys pressed
  const keysRef = useRef({ w: false, a: false, s: false, d: false, shift: false });

  // Animation values
  const walkCycleRef = useRef(0);
  const idleCycleRef = useRef(0);

  // Movement properties
  const speed = useRef(0);
  const acceleration = 12.0;
  const deceleration = 8.0;
  const maxSpeed = useRef(4.0);

  // Mesh pivot groups inside the character model for manual animation
  const torsoGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftArmPivotRef = useRef<THREE.Group>(null);
  const rightArmPivotRef = useRef<THREE.Group>(null);
  const leftLegPivotRef = useRef<THREE.Group>(null);
  const rightLegPivotRef = useRef<THREE.Group>(null);
  const hairGroupRef = useRef<THREE.Group>(null);

  // Setup keyboard input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'explore') return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.w = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.s = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.a = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.d = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.w = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.s = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.a = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.d = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Clean key status when state changes
  useEffect(() => {
    if (gameState !== 'explore') {
      keysRef.current = { w: false, a: false, s: false, d: false, shift: false };
    }
  }, [gameState]);



  useFrame((state, delta) => {
    if (!rbRef.current || !playerRef.current) return;

    // 1. Get Physics Position
    const position = rbRef.current.translation();
    const velocity = rbRef.current.linvel();

    // Reset position if fell off world
    if (position.y < -15) {
      rbRef.current.setTranslation({ x: 0, y: 1, z: 25 }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // 2. Check Proximity to Portfolio Buildings along the curved road
    const buildingConfigs = [
      { name: "Home", z: 20, side: 'left' },
      { name: "School", z: 10, side: 'right' },
      { name: "Computer Center", z: 0, side: 'right' },
      { name: "AI Laboratory", z: -10, side: 'left' },
      { name: "Workshop", z: -20, side: 'left' },
      { name: "Library", z: -30, side: 'right' },
      { name: "Company Headquarters", z: -40, side: 'left' },
    ];

    let nearestBuilding: string | null = null;
    let minDist = 6.0; // Approaching range

    buildingConfigs.forEach(b => {
      const rx = getRoadX(b.z);
      const [nx, nz] = getRoadPerp(b.z);
      const sign = b.side === 'right' ? 1 : -1;

      const bx = rx + sign * nx * 9.0;
      const bz = b.z + sign * nz * 9.0;

      const dist = Math.sqrt((position.x - bx) ** 2 + (position.z - bz) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestBuilding = b.name;
      }
    });

    if (currentModal) {
      setProximityText(null); // Clear prompt while modal is active
    } else {
      setProximityText(nearestBuilding);
    }

    // 3. Movement Logic (Camera Relative for Third Person Exploration)
    const keys = keysRef.current;
    const isWaving = gameState === 'loading' || gameState === 'title' || gameState === 'dialogue';
    
    maxSpeed.current = keys.shift ? 7.2 : 4.2;

    if (gameState === 'explore' && !currentModal && (keys.w || keys.s || keys.a || keys.d)) {
      // Calculate movement vector relative to camera rotation
      const camForward = new THREE.Vector3();
      state.camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      const direction = new THREE.Vector3();
      if (keys.w) direction.add(camForward);
      if (keys.s) direction.sub(camForward);
      if (keys.a) direction.sub(camRight);
      if (keys.d) direction.add(camRight);
      direction.normalize();

      // Smooth acceleration
      speed.current = THREE.MathUtils.lerp(speed.current, maxSpeed.current, delta * acceleration);

      // Rotate player to face movement direction
      const targetAngle = Math.atan2(direction.x, direction.z);
      
      // Interpolate rotation smoothly
      let diff = targetAngle - playerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      playerRef.current.rotation.y += diff * delta * 12;

      // Apply physics velocity
      rbRef.current.setLinvel({
        x: direction.x * speed.current,
        y: velocity.y, // Maintain gravity
        z: direction.z * speed.current
      }, true);
    } else {
      // Smooth deceleration
      speed.current = THREE.MathUtils.lerp(speed.current, 0, delta * deceleration);
      rbRef.current.setLinvel({
        x: 0,
        y: velocity.y,
        z: 0
      }, true);

      // Force player to look at camera when waving on startup
      if (isWaving) {
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          Math.PI, // South, directly facing the camera
          delta * 6
        );
      }
    }

    // 4. Procedural Character Animation
    const isWalking = speed.current > 0.15;
    
    if (isWaving) {
      // startup waving animation
      idleCycleRef.current += delta * 1.5;
      const breathe = Math.sin(idleCycleRef.current);

      // Limbs return to default except right arm waving
      if (leftLegPivotRef.current) leftLegPivotRef.current.rotation.x = THREE.MathUtils.lerp(leftLegPivotRef.current.rotation.x, 0, 0.1);
      if (rightLegPivotRef.current) rightLegPivotRef.current.rotation.x = THREE.MathUtils.lerp(rightLegPivotRef.current.rotation.x, 0, 0.1);
      if (leftArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = THREE.MathUtils.lerp(leftArmPivotRef.current.rotation.x, 0, 0.1);
        leftArmPivotRef.current.rotation.z = THREE.MathUtils.lerp(leftArmPivotRef.current.rotation.z, -0.08 - breathe * 0.02, 0.1);
      }

      // Right arm waving back and forth at head level
      if (rightArmPivotRef.current) {
        rightArmPivotRef.current.rotation.z = THREE.MathUtils.lerp(rightArmPivotRef.current.rotation.z, 2.0, delta * 8);
        rightArmPivotRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 12) * 0.25;
      }

      // Torso breathing
      if (torsoGroupRef.current) torsoGroupRef.current.position.y = 1.25 + breathe * 0.015;
      if (headGroupRef.current) headGroupRef.current.rotation.x = breathe * 0.015;

    } else if (isWalking) {
      // Walking / Running animations
      const runMult = keys.shift ? 1.6 : 1.0;
      walkCycleRef.current += delta * 10 * runMult * (speed.current / maxSpeed.current);

      const wave = Math.sin(walkCycleRef.current);
      const waveDouble = Math.sin(walkCycleRef.current * 2);

      const swingAngle = keys.shift ? 0.65 : 0.42;

      // Legs swing in opposition
      if (leftLegPivotRef.current) leftLegPivotRef.current.rotation.x = wave * swingAngle;
      if (rightLegPivotRef.current) rightLegPivotRef.current.rotation.x = -wave * swingAngle;

      // Arms swing in opposition to legs
      if (leftArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = -wave * swingAngle * 0.85;
        leftArmPivotRef.current.rotation.z = -Math.abs(wave) * 0.12;
      }
      if (rightArmPivotRef.current) {
        rightArmPivotRef.current.rotation.x = wave * swingAngle * 0.85;
        rightArmPivotRef.current.rotation.z = Math.abs(wave) * 0.12;
      }

      // Torso bobs up/down and head tilts
      if (torsoGroupRef.current) torsoGroupRef.current.position.y = 1.25 - Math.abs(waveDouble) * 0.06;
      if (headGroupRef.current) {
        headGroupRef.current.rotation.z = wave * 0.04;
        headGroupRef.current.rotation.x = Math.abs(waveDouble) * 0.03;
      }
      if (hairGroupRef.current) hairGroupRef.current.rotation.z = wave * 0.015;

    } else {
      // Idle Breathing
      idleCycleRef.current += delta * 1.5;
      const breathe = Math.sin(idleCycleRef.current);

      if (leftLegPivotRef.current) leftLegPivotRef.current.rotation.x = THREE.MathUtils.lerp(leftLegPivotRef.current.rotation.x, 0, delta * 8);
      if (rightLegPivotRef.current) rightLegPivotRef.current.rotation.x = THREE.MathUtils.lerp(rightLegPivotRef.current.rotation.x, 0, delta * 8);

      if (leftArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = THREE.MathUtils.lerp(leftArmPivotRef.current.rotation.x, 0, delta * 8);
        leftArmPivotRef.current.rotation.z = THREE.MathUtils.lerp(leftArmPivotRef.current.rotation.z, -0.08 - breathe * 0.02, delta * 6);
      }
      if (rightArmPivotRef.current) {
        rightArmPivotRef.current.rotation.x = THREE.MathUtils.lerp(rightArmPivotRef.current.rotation.x, 0, delta * 8);
        rightArmPivotRef.current.rotation.z = THREE.MathUtils.lerp(rightArmPivotRef.current.rotation.z, 0.08 + breathe * 0.02, delta * 6);
      }

      if (torsoGroupRef.current) torsoGroupRef.current.position.y = THREE.MathUtils.lerp(torsoGroupRef.current.position.y, 1.25 + breathe * 0.015, delta * 8);
      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, breathe * 0.015, delta * 6);
        headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, Math.sin(idleCycleRef.current * 0.5) * 0.02, delta * 4);
      }
      if (hairGroupRef.current) hairGroupRef.current.rotation.z = THREE.MathUtils.lerp(hairGroupRef.current.rotation.z, 0, delta * 6);
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      position={[0, 1.0, 25]} // Start at the beginning of the brick road (z = 25)
      enabledRotations={[false, false, false]} // Lock physical tumbling
      colliders={false}
    >
      {/* Visual Mesh container group */}
      <group ref={playerRef as any}>
        <group scale={0.9}>
          {/* Torso (Pivot center bottom) */}
          <group ref={torsoGroupRef} position={[0, 1.25, 0]}>
            {/* Voxel Hoodie Torso */}
            <mesh castShadow receiveShadow material={materials.shirt}>
              <boxGeometry args={[0.55, 0.75, 0.35]} />
            </mesh>

            {/* Voxel Inner T-Shirt Collar */}
            <mesh position={[0, 0.38, 0]} material={materials.shirtInner}>
              <boxGeometry args={[0.2, 0.05, 0.2]} />
            </mesh>

            {/* Voxel Lapels */}
            <mesh position={[-0.16, 0.25, 0.18]} rotation={[0.1, 0.1, -0.1]} material={materials.shirt}>
              <boxGeometry args={[0.12, 0.18, 0.04]} />
            </mesh>
            <mesh position={[0.16, 0.25, 0.18]} rotation={[0.1, -0.1, 0.1]} material={materials.shirt}>
              <boxGeometry args={[0.12, 0.18, 0.04]} />
            </mesh>

            {/* Voxel Buttons */}
            {[-0.03, 0.15, -0.21].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0.18]} material={materials.shirtInner}>
                <boxGeometry args={[0.03, 0.03, 0.03]} />
              </mesh>
            ))}

            {/* Voxel Belt */}
            <mesh position={[0, -0.36, 0]} material={materials.belt}>
              <boxGeometry args={[0.57, 0.08, 0.37]} />
            </mesh>
            <mesh position={[0, -0.36, 0.19]} material={materials.buckle}>
              <boxGeometry args={[0.12, 0.1, 0.04]} />
            </mesh>

            {/* Voxel Hoodie Hood back */}
            <mesh position={[0, 0.35, -0.2]} material={materials.shirt}>
              <boxGeometry args={[0.45, 0.35, 0.12]} />
            </mesh>

            {/* Voxel Leather Backpack */}
            <group position={[0, 0.08, -0.28]}>
              {/* Main pouch */}
              <mesh castShadow material={materials.backpack}>
                <boxGeometry args={[0.42, 0.52, 0.18]} />
              </mesh>
              {/* Pocket */}
              <mesh castShadow position={[0, -0.12, -0.11]} material={materials.backpack}>
                <boxGeometry args={[0.28, 0.2, 0.05]} />
              </mesh>
              {/* Gold buckle strip */}
              <mesh position={[0, 0, -0.14]} material={materials.backpackGold}>
                <boxGeometry args={[0.24, 0.02, 0.03]} />
              </mesh>
              {/* Handle */}
              <mesh position={[0, 0.28, -0.04]} material={materials.backpackDark}>
                <boxGeometry args={[0.12, 0.04, 0.04]} />
              </mesh>
              {/* Straps */}
              {[-0.15, 0.15].map((sx, idx) => (
                <mesh key={idx} position={[sx, 0, -0.1]} material={materials.backpackDark}>
                  <boxGeometry args={[0.05, 0.48, 0.03]} />
                </mesh>
              ))}
            </group>
            {/* Shoulder straps */}
            {[-0.18, 0.18].map((sx, idx) => (
              <mesh key={idx} position={[sx, 0.04, 0.18]} material={materials.backpackDark}>
                <boxGeometry args={[0.05, 0.65, 0.03]} />
              </mesh>
            ))}
            {/* Gold strap buckles */}
            {[-0.18, 0.18].map((sx, idx) => (
              <mesh key={idx} position={[sx, -0.12, 0.19]} material={materials.backpackGold}>
                <boxGeometry args={[0.06, 0.05, 0.04]} />
              </mesh>
            ))}

            {/* Head (neck joint pivot) */}
            <group ref={headGroupRef} position={[0, 0.48, 0]}>
              <mesh position={[0, -0.075, 0]} material={materials.skin}>
                <boxGeometry args={[0.16, 0.15, 0.16]} />
              </mesh>
              <mesh castShadow position={[0, 0.2, 0]} material={materials.skin}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
              </mesh>

              {/* Eyes Left */}
              <group position={[-0.13, 0.22, 0.26]}>
                <mesh material={materials.eyes}>
                  <boxGeometry args={[0.08, 0.08, 0.01]} />
                </mesh>
                <mesh position={[0, 0, 0.01]} material={materials.iris}>
                  <boxGeometry args={[0.04, 0.04, 0.01]} />
                </mesh>
                <mesh position={[0, 0, 0.02]} material={materials.pupil}>
                  <boxGeometry args={[0.02, 0.02, 0.01]} />
                </mesh>
              </group>

              {/* Eyes Right */}
              <group position={[0.13, 0.22, 0.26]}>
                <mesh material={materials.eyes}>
                  <boxGeometry args={[0.08, 0.08, 0.01]} />
                </mesh>
                <mesh position={[0, 0, 0.01]} material={materials.iris}>
                  <boxGeometry args={[0.04, 0.04, 0.01]} />
                </mesh>
                <mesh position={[0, 0, 0.02]} material={materials.pupil}>
                  <boxGeometry args={[0.02, 0.02, 0.01]} />
                </mesh>
              </group>

              {/* Eyebrows */}
              <mesh position={[-0.13, 0.31, 0.26]} material={materials.hair}>
                <boxGeometry args={[0.1, 0.03, 0.02]} />
              </mesh>
              <mesh position={[0.13, 0.31, 0.26]} material={materials.hair}>
                <boxGeometry args={[0.1, 0.03, 0.02]} />
              </mesh>

              {/* Nose */}
              <mesh position={[0, 0.12, 0.26]} material={materials.skin}>
                <boxGeometry args={[0.06, 0.06, 0.03]} />
              </mesh>

              {/* Voxel Smile */}
              <mesh position={[0, 0.04, 0.26]} material={materials.pupil}>
                <boxGeometry args={[0.12, 0.03, 0.02]} />
              </mesh>

              {/* Ears */}
              <mesh position={[-0.27, 0.2, 0]} material={materials.skin}>
                <boxGeometry args={[0.04, 0.1, 0.08]} />
              </mesh>
              <mesh position={[0.27, 0.2, 0]} material={materials.skin}>
                <boxGeometry args={[0.04, 0.1, 0.08]} />
              </mesh>

              {/* Voxel Hair Blocks */}
              <group ref={hairGroupRef}>
                {/* Top cap */}
                <mesh position={[0, 0.46, 0]} material={materials.hair}>
                  <boxGeometry args={[0.54, 0.1, 0.54]} />
                </mesh>
                {/* Back hair */}
                <mesh position={[0, 0.15, -0.22]} material={materials.hair}>
                  <boxGeometry args={[0.54, 0.3, 0.12]} />
                </mesh>
                {/* Side burns */}
                <mesh position={[-0.27, 0.2, 0.05]} material={materials.hair}>
                  <boxGeometry args={[0.04, 0.2, 0.35]} />
                </mesh>
                <mesh position={[0.27, 0.2, 0.05]} material={materials.hair}>
                  <boxGeometry args={[0.04, 0.2, 0.35]} />
                </mesh>
                {/* Fringe bangs */}
                <mesh position={[0, 0.41, 0.22]} material={materials.hair}>
                  <boxGeometry args={[0.54, 0.1, 0.12]} />
                </mesh>
              </group>
            </group>

            {/* Left Arm (Shoulder Pivot) */}
            <group ref={leftArmPivotRef} position={[-0.42, 0.25, 0]}>
              <mesh position={[0, -0.2, 0]} material={materials.shirt}>
                <boxGeometry args={[0.18, 0.4, 0.18]} />
              </mesh>
              <mesh castShadow position={[0, -0.45, 0]} material={materials.skin}>
                <boxGeometry args={[0.14, 0.3, 0.14]} />
              </mesh>
            </group>

            {/* Right Arm (Shoulder Pivot) */}
            <group ref={rightArmPivotRef} position={[0.42, 0.25, 0]}>
              <mesh position={[0, -0.2, 0]} material={materials.shirt}>
                <boxGeometry args={[0.18, 0.4, 0.18]} />
              </mesh>
              <mesh castShadow position={[0, -0.45, 0]} material={materials.skin}>
                <boxGeometry args={[0.14, 0.3, 0.14]} />
              </mesh>
            </group>

            {/* Left Leg (Hip Pivot) */}
            <group ref={leftLegPivotRef} position={[-0.16, -0.38, 0]}>
              <mesh castShadow receiveShadow position={[0, -0.3, 0]} material={materials.pants}>
                <boxGeometry args={[0.18, 0.55, 0.18]} />
              </mesh>
              {/* Boot */}
              <mesh castShadow position={[0, -0.62, 0.03]} material={materials.shoes}>
                <boxGeometry args={[0.2, 0.12, 0.26]} />
              </mesh>
            </group>

            {/* Right Leg (Hip Pivot) */}
            <group ref={rightLegPivotRef} position={[0.16, -0.38, 0]}>
              <mesh castShadow receiveShadow position={[0, -0.3, 0]} material={materials.pants}>
                <boxGeometry args={[0.18, 0.55, 0.18]} />
              </mesh>
              {/* Boot */}
              <mesh castShadow position={[0, -0.62, 0.03]} material={materials.shoes}>
                <boxGeometry args={[0.2, 0.12, 0.26]} />
              </mesh>
            </group>
            </group>
          </group>
        </group>

      {/* Physics Capsule Collider */}
      <CapsuleCollider args={[0.65, 0.35]} position={[0, 0.85, 0]} />
    </RigidBody>
  );
}
