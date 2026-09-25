import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getRoadX, getRoadAngle, getRoadPerp } from '../utils/roadPath';
import { getTerrainHeight } from '../utils/terrain';

interface PlayerProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  playerRef: React.RefObject<THREE.Group | null>;
  setProximityText: (text: string | null) => void;
  currentModal: string | null;
  isArcheryMode?: boolean;
}

// Shared Player Procedural Materials (Module scope to avoid GC churn)
const materials = {
  skin: new THREE.MeshToonMaterial({ color: 0xffdbac }),  // Natural warm human skin tone
  hair: new THREE.MeshToonMaterial({ color: 0x2c1d11 }),  // Modern dark brown styled hair
  shirt: new THREE.MeshToonMaterial({ color: 0x1a4a8a }),  // Deep ocean blue hoodie
  shirtInner: new THREE.MeshToonMaterial({ color: 0xdde8f8 }),  // Light blue inner collar
  pants: new THREE.MeshToonMaterial({ color: 0x2c3a50 }),  // Dark navy jeans
  shoes: new THREE.MeshToonMaterial({ color: 0x6b3d1e }),  // Warm brown leather boots
  sole: new THREE.MeshToonMaterial({ color: 0x3d2010 }),  // Dark brown sole
  laces: new THREE.MeshToonMaterial({ color: 0xc49a6c }),  // Tan laces
  belt: new THREE.MeshToonMaterial({ color: 0x3a2010 }),  // Dark leather belt
  buckle: new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Gold buckle
  eyes: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  iris: new THREE.MeshBasicMaterial({ color: 0x2b5c8f }),  // Expressive blue-grey eyes
  pupil: new THREE.MeshBasicMaterial({ color: 0x111111 }),
  backpack: new THREE.MeshToonMaterial({ color: 0x7a5230 }),  // Mid-brown leather pack
  backpackDark: new THREE.MeshToonMaterial({ color: 0x4a3020 }),  // Dark brown straps
  backpackGold: new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Gold clasps
};

export default function Player({ gameState, playerRef, setProximityText, currentModal, isArcheryMode }: PlayerProps) {
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

    // Reset position if fell off world or launched into sky by collision
    const groundY = getTerrainHeight(position.x, position.z);
    if (position.y < groundY - 5 || position.y > groundY + 30 || isNaN(position.y)) {
      rbRef.current.setTranslation({ x: -18, y: getTerrainHeight(-18, 54) + 1.0, z: 54 }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // 2. Check Proximity to Portfolio Buildings & Mini-Games (Blueprint Positions)
    const buildingConfigs = [
      { name: "About Me", bx: -42, bz: -42 },
      { name: "Education", bx: 8, bz: -36 },
      { name: "Skills", bx: 44, bz: -8 },
      { name: "Projects", bx: -42, bz: -10 },
      { name: "Experience", bx: -42, bz: 25 },
      { name: "Developer Workshop", bx: 38, bz: 18 },
      { name: "Contact", bx: 44, bz: -56 },
      { name: "Archery Range", bx: 18, bz: -36 },
    ];

    let nearestBuilding: string | null = null;
    let minDist = 6.5; // Approaching range

    buildingConfigs.forEach(b => {
      const dist = Math.sqrt((position.x - b.bx) ** 2 + (position.z - b.bz) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestBuilding = b.name;
      }
    });

    if (currentModal || isArcheryMode) {
      setProximityText(null); // Clear prompt while modal or archery mode is active
    } else {
      setProximityText(nearestBuilding);
    }

    // 3. Movement Logic (Camera Relative for Third Person Exploration)
    const keys = keysRef.current;
    const isWaving = gameState === 'loading' || gameState === 'title' || gameState === 'dialogue';
    
    maxSpeed.current = keys.shift ? 7.2 : 4.2;

    if (gameState === 'explore' && !currentModal && !isArcheryMode && (keys.w || keys.s || keys.a || keys.d)) {
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
      position={[-18, getTerrainHeight(-18, 54) + 1.0, 54]} // Spawn at South Bridge entrance of enlarged village
      enabledRotations={[false, false, false]} // Lock physical tumbling
      colliders={false}
    >
      {/* Visual Mesh container group */}
      <group ref={playerRef as any}>
        {/* Floating 3D Speech Bubble */}
        {gameState === 'dialogue' && (
          <Html position={[0, 2.2, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="r3f-dialogue-bubble">
              <div className="bubble-text">"Hi, I'm Gohul."</div>
              <div className="bubble-tail" />
            </div>
          </Html>
        )}
        <group scale={0.9}>
          {/* Torso (Pivot center bottom) */}
          <group ref={torsoGroupRef} position={[0, 1.25, 0]}>
            {/* Stylized Hoodie Torso (Chest & Waist) */}
            <mesh castShadow receiveShadow material={materials.shirt}>
              <capsuleGeometry args={[0.26, 0.52, 10, 16]} />
            </mesh>

            {/* Inner Collar & Neck Sleeve Bridge */}
            <mesh position={[0, 0.28, 0]} material={materials.shirtInner}>
              <cylinderGeometry args={[0.11, 0.14, 0.12, 12]} />
            </mesh>

            {/* Pelvis / Hips Base (Bridges Torso seamlessly to Legs) */}
            <mesh position={[0, -0.3, 0]} material={materials.pants}>
              <cylinderGeometry args={[0.25, 0.24, 0.14, 12]} />
            </mesh>

            {/* Belt & Buckle */}
            <mesh position={[0, -0.26, 0]} material={materials.belt}>
              <cylinderGeometry args={[0.27, 0.27, 0.07, 12]} />
            </mesh>
            <mesh position={[0, -0.26, 0.27]} material={materials.buckle}>
              <boxGeometry args={[0.1, 0.09, 0.04]} />
            </mesh>

            {/* Leather Backpack */}
            <group position={[0, 0.06, -0.26]}>
              <mesh castShadow material={materials.backpack}>
                <boxGeometry args={[0.42, 0.48, 0.18]} />
              </mesh>
              <mesh castShadow position={[0, -0.12, -0.11]} material={materials.backpack}>
                <boxGeometry args={[0.28, 0.2, 0.05]} />
              </mesh>
              <mesh position={[0, 0, -0.14]} material={materials.backpackGold}>
                <boxGeometry args={[0.24, 0.02, 0.03]} />
              </mesh>
            </group>

            {/* Head & Face Assembly (Stylized Modern 3D Human) */}
            <group ref={headGroupRef} position={[0, 0.44, 0]}>
              {/* Neck Joint */}
              <mesh position={[0, -0.05, 0]} material={materials.skin}>
                <cylinderGeometry args={[0.08, 0.09, 0.12, 12]} />
              </mesh>
              
              {/* Main Human Head (Smooth rounded contour) */}
              <mesh castShadow position={[0, 0.22, 0]} material={materials.skin} scale={[1.0, 1.1, 0.95]}>
                <sphereGeometry args={[0.22, 24, 24]} />
              </mesh>

              {/* Natural Human Ears */}
              <mesh position={[-0.21, 0.21, 0]} rotation={[0, -0.15, -0.1]} material={materials.skin}>
                <boxGeometry args={[0.03, 0.07, 0.04]} />
              </mesh>
              <mesh position={[0.21, 0.21, 0]} rotation={[0, 0.15, 0.1]} material={materials.skin}>
                <boxGeometry args={[0.03, 0.07, 0.04]} />
              </mesh>

              {/* Left Eye */}
              <group position={[-0.08, 0.23, 0.19]}>
                <mesh material={materials.eyes} scale={[1.0, 1.2, 0.2]}>
                  <sphereGeometry args={[0.038, 12, 12]} />
                </mesh>
                <mesh position={[0, 0, 0.008]} material={materials.iris} scale={[1.0, 1.1, 0.2]}>
                  <sphereGeometry args={[0.024, 10, 10]} />
                </mesh>
                <mesh position={[0, 0, 0.012]} material={materials.pupil} scale={[1.0, 1.0, 0.2]}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                </mesh>
                <mesh position={[0.008, 0.008, 0.015]} material={materials.eyes}>
                  <sphereGeometry args={[0.006, 6, 6]} />
                </mesh>
              </group>

              {/* Right Eye */}
              <group position={[0.08, 0.23, 0.19]}>
                <mesh material={materials.eyes} scale={[1.0, 1.2, 0.2]}>
                  <sphereGeometry args={[0.038, 12, 12]} />
                </mesh>
                <mesh position={[0, 0, 0.008]} material={materials.iris} scale={[1.0, 1.1, 0.2]}>
                  <sphereGeometry args={[0.024, 10, 10]} />
                </mesh>
                <mesh position={[0, 0, 0.012]} material={materials.pupil} scale={[1.0, 1.0, 0.2]}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                </mesh>
                <mesh position={[-0.008, 0.008, 0.015]} material={materials.eyes}>
                  <sphereGeometry args={[0.006, 6, 6]} />
                </mesh>
              </group>

              {/* Eyebrows */}
              <mesh position={[-0.08, 0.285, 0.195]} rotation={[0, 0, 0.06]} material={materials.hair}>
                <boxGeometry args={[0.06, 0.012, 0.015]} />
              </mesh>
              <mesh position={[0.08, 0.285, 0.195]} rotation={[0, 0, -0.06]} material={materials.hair}>
                <boxGeometry args={[0.06, 0.012, 0.015]} />
              </mesh>

              {/* Small Cute Nose */}
              <mesh position={[0, 0.19, 0.21]} material={materials.skin}>
                <boxGeometry args={[0.025, 0.045, 0.025]} />
              </mesh>

              {/* Friendly Mouth */}
              <mesh position={[0, 0.13, 0.20]} material={materials.hair}>
                <boxGeometry args={[0.06, 0.01, 0.01]} />
              </mesh>

              {/* Stylish Modern Layered Haircut */}
              <group ref={hairGroupRef} position={[0, 0.23, -0.01]}>
                {/* Hair Top Cap */}
                <mesh material={materials.hair} position={[0, 0.04, -0.02]}>
                  <sphereGeometry args={[0.235, 16, 16]} />
                </mesh>
                {/* Front Swept Hair Bangs */}
                <mesh position={[-0.05, 0.11, 0.13]} rotation={[0.1, 0.1, -0.15]} material={materials.hair}>
                  <boxGeometry args={[0.18, 0.08, 0.14]} />
                </mesh>
                <mesh position={[0.07, 0.10, 0.13]} rotation={[0.1, -0.1, 0.15]} material={materials.hair}>
                  <boxGeometry args={[0.14, 0.07, 0.12]} />
                </mesh>
                {/* Sideburns */}
                <mesh position={[-0.20, 0.04, 0.04]} material={materials.hair}>
                  <boxGeometry args={[0.025, 0.1, 0.05]} />
                </mesh>
                <mesh position={[0.20, 0.04, 0.04]} material={materials.hair}>
                  <boxGeometry args={[0.025, 0.1, 0.05]} />
                </mesh>
              </group>
            </group>

            {/* Left Arm & Shoulder Joint */}
            <group ref={leftArmPivotRef} position={[-0.27, 0.2, 0]}>
              {/* Shoulder Ball Joint (Connects directly into Torso Seam) */}
              <mesh material={materials.shirt}>
                <sphereGeometry args={[0.11, 10, 10]} />
              </mesh>
              {/* Upper Arm Sleeve */}
              <mesh castShadow position={[0, -0.22, 0]} material={materials.shirt}>
                <capsuleGeometry args={[0.09, 0.36, 8, 12]} />
              </mesh>
              {/* Hand */}
              <mesh castShadow position={[0, -0.46, 0]} material={materials.skin}>
                <sphereGeometry args={[0.08, 10, 10]} />
              </mesh>
            </group>

            {/* Right Arm & Shoulder Joint */}
            <group ref={rightArmPivotRef} position={[0.27, 0.2, 0]}>
              {/* Shoulder Ball Joint (Connects directly into Torso Seam) */}
              <mesh material={materials.shirt}>
                <sphereGeometry args={[0.11, 10, 10]} />
              </mesh>
              {/* Upper Arm Sleeve */}
              <mesh castShadow position={[0, -0.22, 0]} material={materials.shirt}>
                <capsuleGeometry args={[0.09, 0.36, 8, 12]} />
              </mesh>
              {/* Hand */}
              <mesh castShadow position={[0, -0.46, 0]} material={materials.skin}>
                <sphereGeometry args={[0.08, 10, 10]} />
              </mesh>
            </group>

            {/* Left Leg & Hip Joint */}
            <group ref={leftLegPivotRef} position={[-0.13, -0.32, 0]}>
              {/* Hip Ball Joint */}
              <mesh material={materials.pants}>
                <sphereGeometry args={[0.105, 10, 10]} />
              </mesh>
              {/* Thigh & Calves Pants */}
              <mesh castShadow position={[0, -0.24, 0]} material={materials.pants}>
                <capsuleGeometry args={[0.1, 0.42, 8, 12]} />
              </mesh>
              {/* Leather Boot & Sole */}
              <group position={[0, -0.5, 0.04]}>
                <mesh castShadow material={materials.shoes}>
                  <boxGeometry args={[0.17, 0.14, 0.26]} />
                </mesh>
                <mesh position={[0, -0.07, 0]} material={materials.sole}>
                  <boxGeometry args={[0.18, 0.04, 0.28]} />
                </mesh>
              </group>
            </group>

            {/* Right Leg & Hip Joint */}
            <group ref={rightLegPivotRef} position={[0.13, -0.32, 0]}>
              {/* Hip Ball Joint */}
              <mesh material={materials.pants}>
                <sphereGeometry args={[0.105, 10, 10]} />
              </mesh>
              {/* Thigh & Calves Pants */}
              <mesh castShadow position={[0, -0.24, 0]} material={materials.pants}>
                <capsuleGeometry args={[0.1, 0.42, 8, 12]} />
              </mesh>
              {/* Leather Boot & Sole */}
              <group position={[0, -0.5, 0.04]}>
                <mesh castShadow material={materials.shoes}>
                  <boxGeometry args={[0.17, 0.14, 0.26]} />
                </mesh>
                <mesh position={[0, -0.07, 0]} material={materials.sole}>
                  <boxGeometry args={[0.18, 0.04, 0.28]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Physics Capsule Collider */}
      <CapsuleCollider args={[0.65, 0.35]} position={[0, 0.85, 0]} />
    </RigidBody>
  );
}
