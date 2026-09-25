import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, WATER_SURFACE_Y } from '../utils/terrain';

// ── Shared Premium Materials for Villagers and Wildlife ──
const staticSkinMat = new THREE.MeshToonMaterial({ color: 0xfcc4b6 });
const staticHairMat = new THREE.MeshToonMaterial({ color: 0x4a3020 });
const staticOldPantsMat = new THREE.MeshToonMaterial({ color: 0x2d3748 });

// Facial Details & Features
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.1, metalness: 0.8 });
const eyeCatchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Chicken Materials
const chickenFeatherMat = new THREE.MeshToonMaterial({ color: 0xfffdf5 });
const chickenWingMat = new THREE.MeshToonMaterial({ color: 0xf4a261 });
const chickenCombMat = new THREE.MeshToonMaterial({ color: 0xd90429 });
const chickenBeakMat = new THREE.MeshToonMaterial({ color: 0xffb703 });
const chickenLegMat = new THREE.MeshToonMaterial({ color: 0xe76f51 });

// Rabbit Materials
const rabbitFurMat = new THREE.MeshToonMaterial({ color: 0xfefae0 });
const rabbitEarInnerMat = new THREE.MeshToonMaterial({ color: 0xffb6c1 });
const rabbitNoseMat = new THREE.MeshToonMaterial({ color: 0xff85a1 });

// Waterfowl Materials
const duckHeadMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.25, metalness: 0.3 });
const duckRingMat = new THREE.MeshToonMaterial({ color: 0xffffff });
const duckChestMat = new THREE.MeshToonMaterial({ color: 0x6c584c });
const duckBodyMat = new THREE.MeshToonMaterial({ color: 0xa3b18a });
const duckBillMat = new THREE.MeshToonMaterial({ color: 0xf77f00 });

const swanPlumeMat = new THREE.MeshToonMaterial({ color: 0xffffff });
const swanBeakMat = new THREE.MeshToonMaterial({ color: 0xf4a261 });
const swanMaskMat = new THREE.MeshToonMaterial({ color: 0x111115 });


// Fish Materials
const koiOrangeMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.25 });
const koiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
const koiFinMat = new THREE.MeshStandardMaterial({ color: 0xff7733, roughness: 0.3, transparent: true, opacity: 0.85 });

// Bird Materials
const songbirdBodyMat = new THREE.MeshToonMaterial({ color: 0x0077b6 });
const songbirdBellyMat = new THREE.MeshToonMaterial({ color: 0x90e0ef });
const songbirdWingMat = new THREE.MeshToonMaterial({ color: 0x03045e });
const skyBirdBodyMat = new THREE.MeshToonMaterial({ color: 0xf8f9fa });
const skyBirdWingMat = new THREE.MeshToonMaterial({ color: 0x343a40 });

// Butterfly Materials
const butterflyOrangeMat = new THREE.MeshStandardMaterial({ color: 0xff7b00, side: THREE.DoubleSide, roughness: 0.4 });
const butterflyBlueMat = new THREE.MeshStandardMaterial({ color: 0x00b4d8, side: THREE.DoubleSide, roughness: 0.4 });
const butterflyBodyMat = new THREE.MeshToonMaterial({ color: 0x1d3557 });

// Water Effects
const rippleMat = new THREE.MeshBasicMaterial({ color: 0xa2d2ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide });

// 🐔 ANIMATED FARM CHICKEN
function Chicken({ position, seed = 0 }: { position: [number, number, number]; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() + seed;
    const terrainY = getTerrainHeight(position[0], position[2]);

    // Pecking rhythm animation (head dips forward to peck seeds on ground)
    const peckCycle = Math.sin(time * 5.0 + seed);
    const isPecking = peckCycle > 0.3;

    if (headRef.current) {
      headRef.current.rotation.x = isPecking ? 0.6 : Math.sin(time * 2.0) * 0.1;
    }

    // Wing flutter when pecking or walking
    const wingFlap = isPecking ? Math.sin(time * 20.0) * 0.25 : Math.sin(time * 4.0) * 0.05;
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.2 + wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.2 - wingFlap;

    const waddle = Math.sin(time * 6.0) * 0.04;
    groupRef.current.position.set(position[0] + waddle, terrainY + Math.abs(Math.sin(time * 8.0)) * 0.02, position[2]);
    groupRef.current.rotation.y = Math.sin(time * 0.8 + seed) * 0.3;
  });

  return (
    <group ref={groupRef} scale={0.45}>
      {/* Plump Body */}
      <mesh castShadow position={[0, 0.42, 0]} material={chickenFeatherMat}>
        <sphereGeometry args={[0.38, 14, 14]} />
      </mesh>

      {/* Fluffy Tail Feather Fan */}
      <group position={[0, 0.55, -0.32]} rotation={[-0.4, 0, 0]}>
        <mesh castShadow position={[-0.08, 0, 0]} rotation={[0, -0.2, 0]} material={chickenWingMat}>
          <coneGeometry args={[0.08, 0.35, 5]} />
        </mesh>
        <mesh castShadow position={[0, 0.05, 0]} material={chickenFeatherMat}>
          <coneGeometry args={[0.09, 0.4, 5]} />
        </mesh>
        <mesh castShadow position={[0.08, 0, 0]} rotation={[0, 0.2, 0]} material={chickenWingMat}>
          <coneGeometry args={[0.08, 0.35, 5]} />
        </mesh>
      </group>

      {/* Head & Neck Group */}
      <group ref={headRef} position={[0, 0.68, 0.25]}>
        <mesh castShadow position={[0, 0.15, 0]} material={chickenFeatherMat}>
          <sphereGeometry args={[0.22, 12, 12]} />
        </mesh>

        {/* Shiny Black Eyes with Eye Catchlights */}
        {[-0.15, 0.15].map((ex, i) => (
          <group key={i} position={[ex, 0.2, 0.12]}>
            <mesh material={eyeMat}>
              <sphereGeometry args={[0.04, 8, 8]} />
            </mesh>
            <mesh position={[0.01, 0.015, 0.03]} material={eyeCatchMat}>
              <sphereGeometry args={[0.015, 6, 6]} />
            </mesh>
          </group>
        ))}

        {/* Golden Beak */}
        <mesh position={[0, 0.12, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={chickenBeakMat}>
          <coneGeometry args={[0.065, 0.18, 5]} />
        </mesh>

        {/* Bright Crimson Comb (3-pointed scalloped crown) */}
        <group position={[0, 0.38, 0.02]}>
          <mesh material={chickenCombMat}>
            <boxGeometry args={[0.04, 0.14, 0.18]} />
          </mesh>
          <mesh position={[0, 0.05, 0.06]} material={chickenCombMat}>
            <boxGeometry args={[0.04, 0.1, 0.08]} />
          </mesh>
        </group>

        {/* Crimson Wattles under beak */}
        <mesh position={[0, -0.02, 0.22]} material={chickenCombMat}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>

      {/* Tucked Side Wings */}
      <group ref={leftWingRef} position={[-0.35, 0.45, 0]}>
        <mesh castShadow material={chickenWingMat}>
          <capsuleGeometry args={[0.08, 0.28, 6, 8]} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.35, 0.45, 0]}>
        <mesh castShadow material={chickenWingMat}>
          <capsuleGeometry args={[0.08, 0.28, 6, 8]} />
        </mesh>
      </group>

      {/* Yellow Feet & Legs */}
      {[-0.15, 0.15].map((lx, i) => (
        <group key={i} position={[lx, 0, 0]}>
          <mesh castShadow position={[0, 0.12, 0]} material={chickenLegMat}>
            <cylinderGeometry args={[0.03, 0.025, 0.24, 6]} />
          </mesh>
          {/* 3 Front Toes */}
          <mesh position={[0, 0.02, 0.06]} rotation={[0.2, 0, 0]} material={chickenLegMat}>
            <boxGeometry args={[0.02, 0.02, 0.12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 🐰 ANIMATED HOPPING RABBIT WITH SQUASH & STRETCH
function Rabbit({ center, seed = 0 }: { center: [number, number]; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * 1.6 + seed;

    const radius = 2.8;
    const angle = time * 0.35;
    const px = center[0] + Math.cos(angle) * radius;
    const pz = center[1] + Math.sin(angle) * radius;
    const py = getTerrainHeight(px, pz);

    // Realistic hopping arc & impact squash-and-stretch
    const hopSin = Math.sin(time * 5.0);
    const hopArc = Math.max(0, hopSin) * 0.42;

    // Squash on impact (when touching ground hopSin < 0)
    const squash = hopSin < 0 ? 1.0 + hopSin * 0.15 : 1.0 - hopSin * 0.08;
    const stretch = hopSin < 0 ? 1.0 - hopSin * 0.15 : 1.0 + hopSin * 0.08;

    groupRef.current.position.set(px, py + hopArc, pz);
    groupRef.current.rotation.y = -angle + Math.PI / 2;
    groupRef.current.scale.set(0.48 * squash, 0.48 * stretch, 0.48 * squash);

    if (leftEarRef.current && rightEarRef.current) {
      const earWiggle = Math.sin(time * 9.0) * 0.15;
      leftEarRef.current.rotation.z = 0.18 + earWiggle;
      rightEarRef.current.rotation.z = -0.18 - earWiggle;
      leftEarRef.current.rotation.x = Math.cos(time * 5.0) * 0.1;
      rightEarRef.current.rotation.x = Math.cos(time * 5.0) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Plump Rounded Body */}
      <mesh castShadow position={[0, 0.38, 0]} material={rabbitFurMat}>
        <sphereGeometry args={[0.34, 14, 14]} />
      </mesh>

      {/* Cute Head */}
      <group position={[0, 0.65, 0.22]}>
        <mesh castShadow material={rabbitFurMat}>
          <sphereGeometry args={[0.24, 14, 14]} />
        </mesh>

        {/* Shiny Black Eyes + Eye Catchlights */}
        {[-0.15, 0.15].map((ex, i) => (
          <group key={i} position={[ex, 0.06, 0.16]}>
            <mesh material={eyeMat}>
              <sphereGeometry args={[0.045, 8, 8]} />
            </mesh>
            <mesh position={[0.015, 0.018, 0.035]} material={eyeCatchMat}>
              <sphereGeometry args={[0.016, 6, 6]} />
            </mesh>
          </group>
        ))}

        {/* Twitching Pink Nose & Muzzle */}
        <mesh position={[0, -0.02, 0.24]} material={rabbitNoseMat}>
          <sphereGeometry args={[0.035, 8, 8]} />
        </mesh>
        <mesh position={[0, -0.06, 0.2]} material={rabbitFurMat}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
      </group>

      {/* Expressive Inner Pink Ears */}
      <group ref={leftEarRef} position={[-0.1, 0.88, 0.18]}>
        <mesh castShadow material={rabbitFurMat}>
          <capsuleGeometry args={[0.045, 0.38, 6, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.015]} material={rabbitEarInnerMat}>
          <capsuleGeometry args={[0.028, 0.32, 6, 8]} />
        </mesh>
      </group>
      <group ref={rightEarRef} position={[0.1, 0.88, 0.18]}>
        <mesh castShadow material={rabbitFurMat}>
          <capsuleGeometry args={[0.045, 0.38, 6, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.015]} material={rabbitEarInnerMat}>
          <capsuleGeometry args={[0.028, 0.32, 6, 8]} />
        </mesh>
      </group>

      {/* Front Paws & Large Hind Hopping Legs */}
      {[-0.18, 0.18].map((lx, i) => (
        <group key={i}>
          {/* Front Paw */}
          <mesh castShadow position={[lx * 0.7, 0.12, 0.28]} material={rabbitFurMat}>
            <boxGeometry args={[0.08, 0.08, 0.14]} />
          </mesh>
          {/* Big Hind Foot */}
          <mesh castShadow position={[lx, 0.15, -0.1]} material={rabbitFurMat}>
            <boxGeometry args={[0.11, 0.12, 0.32]} />
          </mesh>
        </group>
      ))}

      {/* Fluffy Cotton Ball Tail */}
      <mesh position={[0, 0.32, -0.34]} material={rabbitFurMat}>
        <sphereGeometry args={[0.11, 10, 10]} />
      </mesh>
    </group>
  );
}

// 🦆 FLOATING WATER MALLARD DUCK WITH WATER RIPPLE EFFECTS
function Duck({ center, radius = 3.5, seed = 0 }: { center: [number, number]; radius?: number; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() + seed;
    const angle = time * 0.35;

    const px = center[0] + Math.cos(angle) * radius;
    const pz = center[1] + Math.sin(angle) * radius;
    const surfaceY = WATER_SURFACE_Y + 0.04;
    const bob = Math.sin(time * 3.2) * 0.03;

    groupRef.current.position.set(px, surfaceY + bob, pz);
    groupRef.current.rotation.y = -angle + Math.PI / 2;

    // Head dipping feeding motion
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.12;
    }

    // Animated expanding water ripple ring
    if (rippleRef.current) {
      const rippleScale = 1.0 + (Math.sin(time * 4.0) * 0.5 + 0.5) * 0.4;
      rippleRef.current.scale.set(rippleScale, rippleScale, 1);
    }
  });

  return (
    <group ref={groupRef} scale={0.5}>
      {/* Sleek Duck Body */}
      <mesh castShadow position={[0, 0.28, 0]} material={duckBodyMat}>
        <capsuleGeometry args={[0.26, 0.42, 8, 12]} />
      </mesh>

      {/* Warm Chestnut Chest */}
      <mesh castShadow position={[0, 0.32, 0.22]} material={duckChestMat}>
        <sphereGeometry args={[0.25, 12, 12]} />
      </mesh>

      {/* Upturned Duck Tail Feathers */}
      <mesh castShadow position={[0, 0.42, -0.3]} rotation={[0.4, 0, 0]} material={duckBodyMat}>
        <coneGeometry args={[0.1, 0.3, 5]} />
      </mesh>

      {/* Head & Neck with Iridescent Emerald Mallard Green & White Ring */}
      <group ref={headRef} position={[0, 0.52, 0.28]}>
        {/* White Neck Collar Ring */}
        <mesh position={[0, 0.02, 0]} material={duckRingMat}>
          <cylinderGeometry args={[0.14, 0.15, 0.06, 12]} />
        </mesh>
        {/* Glossy Emerald Head */}
        <mesh castShadow position={[0, 0.2, 0.05]} material={duckHeadMat}>
          <sphereGeometry args={[0.18, 14, 14]} />
        </mesh>

        {/* Eyes */}
        {[-0.13, 0.13].map((ex, i) => (
          <mesh key={i} position={[ex, 0.24, 0.16]} material={eyeMat}>
            <sphereGeometry args={[0.035, 6, 6]} />
          </mesh>
        ))}

        {/* Flat Orange Duck Bill */}
        <mesh position={[0, 0.18, 0.26]} material={duckBillMat}>
          <boxGeometry args={[0.13, 0.05, 0.22]} />
        </mesh>
      </group>

      {/* Water Ripple Ring under Duck */}
      <mesh ref={rippleRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={rippleMat}>
        <ringGeometry args={[0.4, 0.6, 16]} />
      </mesh>
    </group>
  );
}

// 🦢 GRACEFUL WHITE SWAN WITH S-CURVED NECK & WATER WAKE
function Swan({ center, radius = 4.0, seed = 0 }: { center: [number, number]; radius?: number; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() + seed;
    const angle = time * 0.22;

    const px = center[0] + Math.cos(angle) * radius;
    const pz = center[1] + Math.sin(angle) * radius;
    const surfaceY = WATER_SURFACE_Y + 0.06;
    const glide = Math.sin(time * 2.0) * 0.02;

    groupRef.current.position.set(px, surfaceY + glide, pz);
    groupRef.current.rotation.y = -angle + Math.PI / 2;

    // Subtle neck swaying motion
    if (neckRef.current) {
      neckRef.current.rotation.z = Math.sin(time * 1.8) * 0.06;
      neckRef.current.rotation.x = Math.cos(time * 1.2) * 0.05;
    }

    if (rippleRef.current) {
      const s = 1.0 + Math.sin(time * 3.0) * 0.15;
      rippleRef.current.scale.set(s, s * 1.3, 1);
    }
  });

  return (
    <group ref={groupRef} scale={0.6}>
      {/* Pure White Plume Body */}
      <mesh castShadow position={[0, 0.32, 0]} material={swanPlumeMat}>
        <capsuleGeometry args={[0.32, 0.52, 10, 14]} />
      </mesh>

      {/* Fluffy Wing Side Plumes */}
      <mesh castShadow position={[-0.26, 0.45, 0]} rotation={[0, 0, 0.2]} material={swanPlumeMat}>
        <capsuleGeometry args={[0.12, 0.45, 6, 8]} />
      </mesh>
      <mesh castShadow position={[0.26, 0.45, 0]} rotation={[0, 0, -0.2]} material={swanPlumeMat}>
        <capsuleGeometry args={[0.12, 0.45, 6, 8]} />
      </mesh>

      {/* Curved S-Neck & Head Group */}
      <group ref={neckRef} position={[0, 0.45, 0.32]}>
        {/* Base Neck Segment (leaning forward) */}
        <mesh castShadow position={[0, 0.28, 0.1]} rotation={[0.45, 0, 0]} material={swanPlumeMat}>
          <cylinderGeometry args={[0.07, 0.09, 0.55, 8]} />
        </mesh>
        {/* Upper Neck Segment (curving backward) */}
        <mesh castShadow position={[0, 0.65, 0.18]} rotation={[-0.35, 0, 0]} material={swanPlumeMat}>
          <cylinderGeometry args={[0.06, 0.07, 0.45, 8]} />
        </mesh>
        {/* Head */}
        <group position={[0, 0.88, 0.14]}>
          <mesh castShadow material={swanPlumeMat}>
            <sphereGeometry args={[0.13, 12, 12]} />
          </mesh>
          {/* Black Facial Mask around Beak */}
          <mesh position={[0, 0.02, 0.1]} material={swanMaskMat}>
            <boxGeometry args={[0.14, 0.08, 0.08]} />
          </mesh>
          {/* Orange Beak with Black Basal Knob */}
          <mesh position={[0, -0.01, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={swanBeakMat}>
            <coneGeometry args={[0.055, 0.18, 5]} />
          </mesh>
        </group>
      </group>

      {/* Water Wake Ripple underneath */}
      <mesh ref={rippleRef} position={[0, 0.01, -0.1]} rotation={[-Math.PI / 2, 0, 0]} material={rippleMat}>
        <ringGeometry args={[0.5, 0.75, 16]} />
      </mesh>
    </group>
  );
}

// 🐟 LEAPING WATER KOI FISH WITH WATER SPLASH PARTICLES
function LeapingFish({ center, seed = 0 }: { center: [number, number]; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const splashRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * 0.85 + seed;

    const cycle = time % 4.2;
    const isLeaping = cycle < 1.4;

    const px = center[0];
    const pz = center[1];
    const surfaceY = WATER_SURFACE_Y;

    if (isLeaping) {
      const progress = cycle / 1.4;
      const leapHeight = Math.sin(progress * Math.PI) * 1.45;
      groupRef.current.position.set(px, surfaceY + leapHeight - 0.15, pz);

      // Body arch & wriggle animation
      groupRef.current.rotation.z = (progress - 0.5) * -Math.PI;
      groupRef.current.rotation.y = Math.sin(progress * Math.PI * 4) * 0.2;
      groupRef.current.visible = true;

      // Trigger splash ring at entry and exit points
      if (splashRef.current) {
        const splashProgress = progress < 0.2 ? progress / 0.2 : (progress > 0.8 ? (progress - 0.8) / 0.2 : 0);
        splashRef.current.visible = splashProgress > 0;
        splashRef.current.scale.set(splashProgress * 2.2, splashProgress * 2.2, splashProgress * 2.2);
      }
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} scale={0.45}>
      {/* Sleek Koi Fish Body (Orange & White Calico) */}
      <mesh castShadow material={koiOrangeMat}>
        <capsuleGeometry args={[0.14, 0.52, 8, 12]} />
      </mesh>
      {/* White Calico Patch */}
      <mesh position={[0, 0.05, 0.1]} material={koiWhiteMat}>
        <sphereGeometry args={[0.13, 8, 8]} />
      </mesh>

      {/* Eyes */}
      {[-0.1, 0.1].map((ex, i) => (
        <mesh key={i} position={[ex, 0.06, 0.22]} material={eyeMat}>
          <sphereGeometry args={[0.03, 6, 6]} />
        </mesh>
      ))}

      {/* Dorsal Fin */}
      <mesh position={[0, 0.18, -0.05]} rotation={[0.4, 0, 0]} material={koiFinMat}>
        <boxGeometry args={[0.02, 0.18, 0.22]} />
      </mesh>

      {/* Side Pectoral Fins */}
      <mesh position={[-0.18, -0.04, 0.1]} rotation={[0, 0, 0.6]} material={koiFinMat}>
        <boxGeometry args={[0.22, 0.02, 0.14]} />
      </mesh>
      <mesh position={[0.18, -0.04, 0.1]} rotation={[0, 0, -0.6]} material={koiFinMat}>
        <boxGeometry args={[0.22, 0.02, 0.14]} />
      </mesh>

      {/* Split Caudal Tail Fin */}
      <mesh position={[0, 0, -0.32]} rotation={[0, 0, Math.PI / 4]} material={koiFinMat}>
        <boxGeometry args={[0.02, 0.28, 0.24]} />
      </mesh>

      {/* Water Splash Ring */}
      <group ref={splashRef} position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh material={rippleMat}>
          <ringGeometry args={[0.3, 0.6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

// 🐦 TREE SONGBIRD (PERCHED BLUEBIRD)
function Songbird({ position, seed = 0 }: { position: [number, number, number]; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() + seed;

    // Perched head twitching animation
    if (headRef.current) {
      const twitch = Math.sin(time * 3.0 + seed) > 0.6 ? Math.sin(time * 12.0) * 0.4 : 0;
      headRef.current.rotation.y = twitch;
    }

    // Wing flutter
    if (wingsRef.current) {
      const flutter = Math.sin(time * 4.0 + seed) > 0.8 ? Math.sin(time * 25.0) * 0.35 : 0;
      wingsRef.current.rotation.z = flutter;
    }

    groupRef.current.rotation.y = Math.sin(time * 0.5 + seed) * 0.3;
  });

  return (
    <group ref={groupRef} position={position} scale={0.4}>
      {/* Plump Azure Blue Body */}
      <mesh castShadow material={songbirdBodyMat}>
        <sphereGeometry args={[0.24, 12, 12]} />
      </mesh>

      {/* Light Sky Blue Belly */}
      <mesh position={[0, -0.04, 0.08]} material={songbirdBellyMat}>
        <sphereGeometry args={[0.18, 10, 10]} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.16, 0.12]}>
        <mesh castShadow material={songbirdBodyMat}>
          <sphereGeometry args={[0.16, 10, 10]} />
        </mesh>

        {/* Shiny Black Eyes */}
        {[-0.1, 0.1].map((ex, i) => (
          <mesh key={i} position={[ex, 0.04, 0.1]} material={eyeMat}>
            <sphereGeometry args={[0.03, 6, 6]} />
          </mesh>
        ))}

        {/* Golden Beak */}
        <mesh position={[0, 0.02, 0.18]} rotation={[Math.PI / 2, 0, 0]} material={chickenBeakMat}>
          <coneGeometry args={[0.04, 0.14, 4]} />
        </mesh>
      </group>

      {/* Tail Feathers */}
      <mesh position={[0, 0.02, -0.28]} rotation={[-0.3, 0, 0]} material={songbirdWingMat}>
        <boxGeometry args={[0.12, 0.03, 0.3]} />
      </mesh>

      {/* Side Wings */}
      <group ref={wingsRef}>
        <mesh position={[-0.2, 0.02, 0]} material={songbirdWingMat}>
          <boxGeometry args={[0.16, 0.04, 0.28]} />
        </mesh>
        <mesh position={[0.2, 0.02, 0]} material={songbirdWingMat}>
          <boxGeometry args={[0.16, 0.04, 0.28]} />
        </mesh>
      </group>
    </group>
  );
}

// 🕊️ FLOCK BIRD IN SKY (SOARING WITH ARTICULATED WING FLAPPING)
function FlockBird({ orbitRadius = 28, height = 18, speed = 0.35, seed = 0 }: { orbitRadius?: number; height?: number; speed?: number; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const angle = time * speed + seed;

    const px = Math.cos(angle) * orbitRadius;
    const pz = Math.sin(angle) * orbitRadius;
    const py = height + Math.sin(time * 1.4 + seed) * 0.9;

    groupRef.current.position.set(px, py, pz);
    groupRef.current.rotation.y = -angle + Math.PI / 2;
    // Banking roll on turns
    groupRef.current.rotation.z = Math.sin(time * 1.0 + seed) * 0.15;

    const wingFlap = Math.sin(time * 11.0 + seed) * 0.45;
    if (leftWingRef.current) leftWingRef.current.rotation.z = wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -wingFlap;
  });

  return (
    <group ref={groupRef} scale={0.5}>
      {/* Sleek Aerodynamic Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={skyBirdBodyMat}>
        <coneGeometry args={[0.14, 0.7, 6]} />
      </mesh>
      {/* Tail Fan */}
      <mesh position={[0, 0, -0.4]} rotation={[-0.2, 0, 0]} material={skyBirdWingMat}>
        <boxGeometry args={[0.22, 0.02, 0.25]} />
      </mesh>

      {/* Articulated Flapping Wings */}
      <mesh ref={leftWingRef} position={[-0.32, 0, 0]} material={skyBirdWingMat}>
        <boxGeometry args={[0.55, 0.03, 0.22]} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.32, 0, 0]} material={skyBirdWingMat}>
        <boxGeometry args={[0.55, 0.03, 0.22]} />
      </mesh>
    </group>
  );
}

// 🦋 BUTTERFLY COMPONENT (MONARCH & MORPHO PATTERNS)
function Butterfly({ center }: { center: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * 50, []);
  const isBlue = useMemo(() => Math.random() > 0.5, []);

  const wingMat = isBlue ? butterflyBlueMat : butterflyOrangeMat;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    const wingFlap = Math.sin(time * 30 + seed) * 0.65;
    if (leftWingRef.current) leftWingRef.current.rotation.y = wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.y = -wingFlap;

    const radius = 0.6 + Math.sin(time * 0.6) * 0.2;
    const px = center[0] + Math.sin(time * 1.6 + seed) * radius;
    const pz = center[2] + Math.cos(time * 1.6 + seed) * radius;
    const py = getTerrainHeight(px, pz);

    meshRef.current.position.x = px;
    meshRef.current.position.z = pz;
    meshRef.current.position.y = py + 0.4 + Math.sin(time * 4.5 + seed) * 0.18;
  });

  return (
    <group ref={meshRef} scale={1.2}>
      {/* Body */}
      <mesh material={butterflyBodyMat}>
        <capsuleGeometry args={[0.015, 0.08, 4, 6]} />
      </mesh>
      {/* Forewings & Hindwings */}
      <group ref={leftWingRef} position={[-0.01, 0, 0]}>
        <mesh position={[-0.05, 0.03, 0]} rotation={[0, 0, 0.2]} material={wingMat}>
          <planeGeometry args={[0.1, 0.12]} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.01, 0, 0]}>
        <mesh position={[0.05, 0.03, 0]} rotation={[0, 0, -0.2]} material={wingMat}>
          <planeGeometry args={[0.1, 0.12]} />
        </mesh>
      </group>
    </group>
  );
}

// Building & Structure Obstacles for Real-Time NPC Avoidance
const BUILDING_OBSTACLES = [
  { cx: -48, cz: -62, radius: 5.5 }, // Windmill
  { cx: 44, cz: -56, radius: 8.5 },  // Barn & Silo
  { cx: 38, cz: 18, radius: 6.2 },   // Church / Workshop
  { cx: -42, cz: -42, radius: 6.0 }, // About Me
  { cx: 8, cz: -36, radius: 6.0 },   // Education
  { cx: 44, cz: -8, radius: 6.0 },   // Skills
  { cx: -42, cz: -10, radius: 6.0 }, // Projects
  { cx: -42, cz: 25, radius: 6.0 },  // Experience
  { cx: 0, cz: 0, radius: 2.8 },     // Center Well
  { cx: -8, cz: 32, radius: 12.2 },  // Recreation Pond
  { cx: 20, cz: -62, radius: 8.8 },  // North Pond
];

// 🚶 VILLAGER CITIZEN COMPONENT
function Citizen({ position, pathPoints, speed = 1.0, color = 0xdd6b20 }: { position: [number, number, number]; pathPoints: [number, number][]; speed?: number; color?: number }) {
  const meshRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const pathIdx = useRef(0);
  const startY = getTerrainHeight(position[0], position[2]);
  const currPos = useRef(new THREE.Vector3(position[0], startY, position[2]));

  const clothMat = useMemo(() => new THREE.MeshToonMaterial({ color }), [color]);

  useFrame((state, delta) => {
    if (!meshRef.current || pathPoints.length === 0) return;

    const target = pathPoints[pathIdx.current];
    const targetY = getTerrainHeight(target[0], target[1]);
    const targetVec = new THREE.Vector3(target[0], targetY, target[1]);
    const dir = targetVec.clone().sub(currPos.current);
    const dist = Math.hypot(dir.x, dir.z);

    if (dist < 0.3) {
      pathIdx.current = (pathIdx.current + 1) % pathPoints.length;
    } else {
      dir.y = 0;
      dir.normalize();

      let nextX = currPos.current.x + dir.x * delta * speed;
      let nextZ = currPos.current.z + dir.z * delta * speed;

      // Real-time building & obstacle collision avoidance
      for (let i = 0; i < BUILDING_OBSTACLES.length; i++) {
        const obs = BUILDING_OBSTACLES[i];
        const dx = nextX - obs.cx;
        const dz = nextZ - obs.cz;
        const d = Math.hypot(dx, dz);
        if (d < obs.radius && d > 0.001) {
          const overlap = obs.radius - d;
          nextX += (dx / d) * overlap;
          nextZ += (dz / d) * overlap;
        }
      }

      currPos.current.x = nextX;
      currPos.current.z = nextZ;
      currPos.current.y = getTerrainHeight(currPos.current.x, currPos.current.z);

      meshRef.current.position.copy(currPos.current);

      const angle = Math.atan2(dir.x, dir.z);
      meshRef.current.rotation.y = angle;

      const swing = Math.sin(state.clock.getElapsedTime() * 7 * speed);
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.45;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.45;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.45;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.45;
      
      meshRef.current.position.y = currPos.current.y + Math.abs(Math.sin(state.clock.getElapsedTime() * 14 * speed)) * 0.04;
    }
  });

  return (
    <group ref={meshRef} position={[position[0], startY, position[2]]} scale={1.15}>
      <mesh castShadow receiveShadow position={[0, 0.72, 0]} material={clothMat}>
        <capsuleGeometry args={[0.24, 0.5, 8, 12]} />
      </mesh>
      <mesh position={[0, 1.05, 0]} material={staticSkinMat}>
        <cylinderGeometry args={[0.08, 0.09, 0.1, 8]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={staticOldPantsMat}>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 8]} />
      </mesh>

      <group position={[0, 1.25, 0]}>
        <mesh castShadow position={[0, 0.2, 0]} material={staticSkinMat}>
          <sphereGeometry args={[0.24, 14, 14]} />
        </mesh>
        <mesh position={[0, 0.24, 0]} material={staticHairMat}>
          <sphereGeometry args={[0.25, 12, 12]} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.26, 0.88, 0]}>
        <mesh castShadow position={[0, -0.22, 0]} material={clothMat}>
          <capsuleGeometry args={[0.08, 0.34, 6, 8]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.26, 0.88, 0]}>
        <mesh castShadow position={[0, -0.22, 0]} material={clothMat}>
          <capsuleGeometry args={[0.08, 0.34, 6, 8]} />
        </mesh>
      </group>
      <group ref={leftLegRef} position={[-0.12, 0.38, 0]}>
        <mesh castShadow position={[0, -0.22, 0]} material={staticOldPantsMat}>
          <capsuleGeometry args={[0.085, 0.36, 6, 8]} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.12, 0.38, 0]}>
        <mesh castShadow position={[0, -0.22, 0]} material={staticOldPantsMat}>
          <capsuleGeometry args={[0.085, 0.36, 6, 8]} />
        </mesh>
      </group>
    </group>
  );
}

export default function NPCList() {
  const mainRoadLoop: [number, number][] = [
    [-18, 54], [-20, 32], [-10, 10], [0, 0], [14, 6], [24, 14], [28, 42], [22, 50], [28, 28], [14, 6], [0, 0], [-14, -3], [-26, -8], [-36, -20], [-36, -34], [-26, -8], [0, 0]
  ];

  const northRoadLoop: [number, number][] = [
    [0, 0], [0, -14], [-2, -26], [-6, -45], [-8, -55], [6, -55], [20, -52], [38, -52], [36, -42], [36, -20], [28, -8], [14, -3], [0, 0]
  ];

  return (
    <group>
      {/* 🚶 Wandering Villagers */}
      <Citizen position={[-18, 0.1, 54]} pathPoints={mainRoadLoop} speed={1.2} color={0x06d6a0} />
      <Citizen position={[0, 0.1, 0]} pathPoints={northRoadLoop} speed={1.0} color={0xef476f} />

      {/* 🐔 Chickens Roaming inside Chicken Coop */}
      <Chicken position={[42.5, 0.1, -31]} seed={1} />
      <Chicken position={[45, 0.1, -33]} seed={2} />
      <Chicken position={[43.8, 0.1, -30.5]} seed={3} />
      <Chicken position={[45.2, 0.1, -31.8]} seed={4} />

      {/* 🐰 Hopping Rabbits across Grassy Meadows */}
      <Rabbit center={[-28, -25]} seed={10} />
      <Rabbit center={[15, -15]} seed={20} />
      <Rabbit center={[-12, 24]} seed={30} />
      <Rabbit center={[32, 12]} seed={40} />

      {/* 🦆 Floating Ducks & Swans on Ponds */}
      <Duck center={[-8, 32]} radius={3.2} seed={1} />
      <Duck center={[-8, 32]} radius={4.8} seed={2.5} />
      <Swan center={[20, -62]} radius={3.5} seed={3} />
      <Duck center={[20, -62]} radius={4.2} seed={4.5} />

      {/* 🐟 Leaping Koi Fish in Water */}
      <LeapingFish center={[-8, 32]} seed={1} />
      <LeapingFish center={[-8, 30]} seed={2.8} />
      <LeapingFish center={[20, -62]} seed={4} />

      {/* 🐦 Tree Songbirds Perched in Canopies */}
      <Songbird position={[-14, getTerrainHeight(-14, -14) + 11.5, -14]} seed={1} />
      <Songbird position={[14, getTerrainHeight(14, 14) + 11.5, 14]} seed={2} />
      <Songbird position={[-28, getTerrainHeight(-28, -44) + 11.5, -44]} seed={3} />

      {/* 🕊️ Sky Birds Soaring Overhead in Sky Formations */}
      <FlockBird orbitRadius={24} height={16} speed={0.32} seed={0} />
      <FlockBird orbitRadius={28} height={18} speed={0.28} seed={Math.PI / 3} />
      <FlockBird orbitRadius={32} height={20} speed={0.24} seed={(Math.PI * 2) / 3} />
      <FlockBird orbitRadius={36} height={22} speed={0.20} seed={Math.PI} />

      {/* 🦋 Butterflies Fluttering around Orchard & Flowers */}
      <Butterfly center={[34, 0.2, 40]} />
      <Butterfly center={[36, 0.2, 38]} />
      <Butterfly center={[-10, 0.2, -36]} />
    </group>
  );
}
