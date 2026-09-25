import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { oakLogTexture, oakPlankTexture, crateTexture, barrelTexture, leafTexture, cobblestoneTexture } from '../utils/minecraftTextures';
import { getTerrainHeight } from '../utils/terrain';
import FallingLeaves from './FallingLeaves';

interface EnvironmentPropsProps {
  isNight: boolean;
}

// Static Materials
const trunkOakMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8, color: 0x6e4a29 });
const leafOakMain = new THREE.MeshStandardMaterial({ map: leafTexture, roughness: 0.45, color: 0x2d6a4f });
const leafOakHighlight = new THREE.MeshStandardMaterial({ map: leafTexture, roughness: 0.35, color: 0x52b788 });
const leafOakDeep = new THREE.MeshStandardMaterial({ map: leafTexture, roughness: 0.6, color: 0x1b4332 });
const rockMat = new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.8, color: 0x7c7c82 });
const crateMat = new THREE.MeshStandardMaterial({ map: crateTexture, roughness: 0.7 });
const barrelMat = new THREE.MeshStandardMaterial({ map: barrelTexture, roughness: 0.7 });
const fenceMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.8, color: 0x8c5e34 });
const lanternGlassMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const lanternFrameMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4 });
const bridgePlankMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.8 });
const bridgeRailMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8 });
const waterMat = new THREE.MeshStandardMaterial({ color: 0x2b7da8, roughness: 0.1, transparent: true, opacity: 0.85 });
const wheatMat = new THREE.MeshStandardMaterial({ color: 0xe6b800, roughness: 0.6 });
const fruitRed = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3 });
const fruitOrange = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 });

// Stylized Canopy Tree with Realistic Mid-Trunk Sprawling Boughs & Branches
function OverhangingCanopyTree({ position, scale = 1.0, seed = 0, hasFruit = false }: { position: [number, number, number]; scale?: number; seed?: number; hasFruit?: boolean }) {
  const foliageRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (foliageRef.current) {
      const time = state.clock.getElapsedTime();
      foliageRef.current.rotation.z = Math.sin(time * 0.7 + seed) * 0.022;
      foliageRef.current.rotation.x = Math.cos(time * 0.5 + seed) * 0.018;
    }
  });

  return (
    <RigidBody type="fixed" colliders={false} position={position} scale={scale}>
      <group>
        {/* Trunk Base Root Flares */}
        <mesh castShadow receiveShadow material={trunkOakMat} position={[0.3, 0.5, 0.2]} rotation={[0.4, 0.3, -0.3]}>
          <cylinderGeometry args={[0.18, 0.5, 1.4, 6]} />
        </mesh>
        <mesh castShadow receiveShadow material={trunkOakMat} position={[-0.3, 0.5, -0.2]} rotation={[-0.4, -0.3, 0.3]}>
          <cylinderGeometry args={[0.18, 0.5, 1.4, 6]} />
        </mesh>

        {/* Main Central Trunk */}
        <mesh castShadow receiveShadow material={trunkOakMat} position={[0, 4.0, 0]}>
          <cylinderGeometry args={[0.42, 0.85, 8.0, 8]} />
        </mesh>

        {/* 🌿 PROMINENT MID-TRUNK BRANCHES & BOUGHS */}

        {/* 1. Low-Mid Right Sprawling Branch */}
        <group position={[0.3, 2.8, 0.1]} rotation={[0.2, 0.4, -1.05]}>
          <mesh castShadow receiveShadow material={trunkOakMat}>
            <cylinderGeometry args={[0.24, 0.40, 3.2, 6]} />
          </mesh>
          {/* Sub-branch splitting upward */}
          <mesh castShadow receiveShadow material={trunkOakMat} position={[0.1, 1.5, 0.2]} rotation={[0.4, -0.2, 0.5]}>
            <cylinderGeometry args={[0.14, 0.22, 1.8, 6]} />
          </mesh>
          {/* Side twig */}
          <mesh castShadow receiveShadow material={trunkOakMat} position={[-0.1, 1.9, -0.2]} rotation={[-0.3, 0.4, -0.4]}>
            <cylinderGeometry args={[0.09, 0.15, 1.3, 6]} />
          </mesh>
          {/* Mid-level Foliage Cluster on right branch */}
          <mesh castShadow material={leafOakMain} position={[0.2, 2.4, 0.3]} scale={[0.85, 0.75, 0.85]}>
            <dodecahedronGeometry args={[2.2, 1]} />
          </mesh>
        </group>

        {/* 2. Low-Mid Left Sprawling Branch */}
        <group position={[-0.3, 3.4, -0.2]} rotation={[-0.3, -0.5, 1.05]}>
          <mesh castShadow receiveShadow material={trunkOakMat}>
            <cylinderGeometry args={[0.23, 0.36, 3.0, 6]} />
          </mesh>
          {/* Sub-branch */}
          <mesh castShadow receiveShadow material={trunkOakMat} position={[-0.1, 1.4, -0.2]} rotation={[-0.4, 0.3, -0.4]}>
            <cylinderGeometry args={[0.12, 0.20, 1.7, 6]} />
          </mesh>
          {/* Mid-level Foliage Cluster on left branch */}
          <mesh castShadow material={leafOakHighlight} position={[-0.2, 2.3, -0.3]} scale={[0.85, 0.75, 0.85]}>
            <dodecahedronGeometry args={[2.1, 1]} />
          </mesh>
        </group>

        {/* 3. Mid-Trunk Front Reaching Branch (pointing towards camera) */}
        <group position={[0.0, 2.4, 0.3]} rotation={[1.0, 0.2, -0.2]}>
          <mesh castShadow receiveShadow material={trunkOakMat}>
            <cylinderGeometry args={[0.22, 0.35, 2.8, 6]} />
          </mesh>
          <mesh castShadow receiveShadow material={trunkOakMat} position={[0.2, 1.3, 0.1]} rotation={[0.3, 0.5, 0.3]}>
            <cylinderGeometry args={[0.11, 0.18, 1.5, 6]} />
          </mesh>
        </group>

        {/* 4. Mid-Trunk Rear Support Branch */}
        <group position={[0.1, 4.0, -0.3]} rotation={[-0.9, 0.3, 0.2]}>
          <mesh castShadow receiveShadow material={trunkOakMat}>
            <cylinderGeometry args={[0.21, 0.33, 2.8, 6]} />
          </mesh>
        </group>

        {/* 5. Upper-Mid Front Left Branch */}
        <group position={[-0.2, 4.6, 0.3]} rotation={[0.6, -0.7, 0.7]}>
          <mesh castShadow receiveShadow material={trunkOakMat}>
            <cylinderGeometry args={[0.19, 0.28, 2.4, 6]} />
          </mesh>
        </group>

        {/* Dynamic Upper Foliage Canopy */}
        <group ref={foliageRef} position={[0, 7.4, 0]}>
          {/* Main Crown */}
          <mesh castShadow material={leafOakMain} position={[0, 0.6, 0]} scale={[1.3, 1.05, 1.3]}>
            <dodecahedronGeometry args={[3.0, 1]} />
          </mesh>
          <mesh castShadow material={leafOakHighlight} position={[1.5, 0.2, 0.5]} scale={[0.9, 0.8, 0.9]}>
            <dodecahedronGeometry args={[2.2, 1]} />
          </mesh>
          <mesh castShadow material={leafOakMain} position={[-1.6, 0.4, -0.6]} scale={[0.95, 0.85, 0.95]}>
            <dodecahedronGeometry args={[2.3, 1]} />
          </mesh>
          <mesh castShadow material={leafOakHighlight} position={[0.3, 2.0, 0.1]} scale={[1.0, 0.9, 1.0]}>
            <dodecahedronGeometry args={[2.4, 1]} />
          </mesh>

          {/* Ripe Fruits */}
          {hasFruit && (
            <>
              {[-1.6, 1.2, 1.8, -0.9, 1.4, -1.2, 1.2, 0.8, 1.2, -1.4, 0.6, 0.5].map((fx, i) => (
                <mesh key={i} position={[fx, -0.5 + (i % 2) * 0.4, (i % 3) * 1.0 - 1.0]} material={i % 2 === 0 ? fruitRed : fruitOrange} castShadow>
                  <sphereGeometry args={[0.38, 8, 8]} />
                </mesh>
              ))}
            </>
          )}
        </group>
        <CuboidCollider args={[0.6, 4.0, 0.6]} position={[0, 4.0, 0]} />
      </group>
    </RigidBody>
  );
}

// Glowing Lantern Post
function GlowingLanternPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow material={trunkOakMat} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 2.8, 8]} />
      </mesh>
      <mesh castShadow receiveShadow material={fenceMat} position={[0.3, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
      </mesh>
      <group position={[0.55, 2.3, 0]}>
        <mesh material={lanternFrameMat} castShadow>
          <boxGeometry args={[0.22, 0.35, 0.22]} />
        </mesh>
        <mesh material={lanternGlassMat}>
          <boxGeometry args={[0.16, 0.26, 0.16]} />
        </mesh>
        <pointLight color={0xffaa00} intensity={1.2} distance={8} decay={2} position={[0, 0, 0]} />
      </group>
    </group>
  );
}

// 🌾 WHEAT FIELD COMPONENT
function WheatField({ position }: { position: [number, number, number] }) {
  const wheatInstances = useMemo(() => {
    const items: React.ReactNode[] = [];
    let idx = 0;
    for (let x = -3.5; x <= 3.5; x += 0.8) {
      for (let z = -2.5; z <= 2.5; z += 0.8) {
        idx++;
        items.push(
          <mesh key={`w-${idx}`} position={[x + (Math.random() - 0.5) * 0.2, 0.4, z + (Math.random() - 0.5) * 0.2]} material={wheatMat} castShadow>
            <cylinderGeometry args={[0.04, 0.02, 0.8, 4]} />
          </mesh>
        );
      }
    }
    return items;
  }, []);

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.02, 0]} material={fenceMat}>
        <boxGeometry args={[8.0, 0.04, 6.0]} />
      </mesh>
      {wheatInstances}
    </group>
  );
}

// 🐔 CHICKEN COOP COMPONENT
function ChickenCoop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]} material={fenceMat}>
        <boxGeometry args={[2.4, 1.8, 2.0]} />
      </mesh>
      <mesh castShadow position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]} material={trunkOakMat}>
        <coneGeometry args={[2.0, 0.8, 4]} />
      </mesh>
    </group>
  );
}

// 🛒 CART & STORAGE COMPONENT
function CartAndStorage({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.4, 0]} material={fenceMat}>
        <boxGeometry args={[3.6, 2.8, 2.8]} />
      </mesh>
      <group position={[-2.8, 0.4, 1.2]} rotation={[0, 0.4, 0]}>
        <mesh castShadow material={fenceMat} position={[0, 0.4, 0]}>
          <boxGeometry args={[1.8, 0.6, 1.2]} />
        </mesh>
        {[-0.65, 0.65].map((z, idx) => (
          <mesh key={idx} position={[0, 0.3, z]} rotation={[Math.PI / 2, 0, 0]} material={trunkOakMat} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.12, 12]} />
          </mesh>
        ))}
      </group>
      <mesh castShadow position={[2.2, 0.4, 0.8]} material={crateMat}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      </mesh>
      <mesh castShadow position={[2.2, 1.2, 0.8]} material={crateMat}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
      </mesh>
    </group>
  );
}

export default function EnvironmentProps({ isNight }: EnvironmentPropsProps) {
  const lanternPosts = useMemo(() => [
    { p: [6.5, 0, 6.5] as [number, number, number] },
    { p: [-22.0, 0, 17.5] as [number, number, number] },
    { p: [18.0, 0, -22.0] as [number, number, number] },
    { p: [-32.5, 0, -20.0] as [number, number, number] },
    { p: [30.5, 0, 20.0] as [number, number, number] },
    { p: [-22.0, 0, 48.0] as [number, number, number] },
  ], []);

  const trees = useMemo(() => [
    // 🌲 1. WEST WOODLAND BORDER (24 Trees - Expanded)
    { p: [-98, 0, -85] as [number, number, number], s: 1.35, seed: 1, fruit: false },
    { p: [-92, 0, -70] as [number, number, number], s: 1.25, seed: 2, fruit: false },
    { p: [-96, 0, -55] as [number, number, number], s: 1.4, seed: 3, fruit: false },
    { p: [-92, 0, -40] as [number, number, number], s: 1.2, seed: 4, fruit: false },
    { p: [-95, 0, -25] as [number, number, number], s: 1.3, seed: 5, fruit: false },
    { p: [-92, 0, -10] as [number, number, number], s: 1.15, seed: 6, fruit: false },
    { p: [-96, 0, 10] as [number, number, number], s: 1.35, seed: 7, fruit: false },
    { p: [-92, 0, 25] as [number, number, number], s: 1.25, seed: 8, fruit: false },
    { p: [-95, 0, 40] as [number, number, number], s: 1.3, seed: 9, fruit: false },
    { p: [-92, 0, 55] as [number, number, number], s: 1.4, seed: 10, fruit: false },
    { p: [-82, 0, 48] as [number, number, number], s: 1.2, seed: 11, fruit: false },
    { p: [-88, 0, -60] as [number, number, number], s: 1.3, seed: 12, fruit: false },
    { p: [-75, 0, -75] as [number, number, number], s: 1.35, seed: 301, fruit: false },
    { p: [-78, 0, -45] as [number, number, number], s: 1.25, seed: 302, fruit: false },
    { p: [-72, 0, -20] as [number, number, number], s: 1.4, seed: 303, fruit: false },
    { p: [-76, 0, 15] as [number, number, number], s: 1.3, seed: 304, fruit: false },
    { p: [-72, 0, 35] as [number, number, number], s: 1.25, seed: 305, fruit: false },
    { p: [-55, 0, -62] as [number, number, number], s: 1.35, seed: 1, fruit: false },
    { p: [-52, 0, -50] as [number, number, number], s: 1.25, seed: 2, fruit: false },
    { p: [-56, 0, -38] as [number, number, number], s: 1.4, seed: 3, fruit: false },
    { p: [-52, 0, -25] as [number, number, number], s: 1.2, seed: 4, fruit: false },
    { p: [-55, 0, -12] as [number, number, number], s: 1.3, seed: 5, fruit: false },
    { p: [-56, 0, 16] as [number, number, number], s: 1.35, seed: 7, fruit: false },
    { p: [-52, 0, 30] as [number, number, number], s: 1.25, seed: 8, fruit: false },

    // 🌲 2. EAST WOODLAND BORDER (24 Trees - Expanded)
    { p: [98, 0, -85] as [number, number, number], s: 1.3, seed: 13, fruit: false },
    { p: [92, 0, -70] as [number, number, number], s: 1.2, seed: 14, fruit: false },
    { p: [96, 0, -55] as [number, number, number], s: 1.35, seed: 15, fruit: false },
    { p: [92, 0, -40] as [number, number, number], s: 1.25, seed: 16, fruit: false },
    { p: [95, 0, -25] as [number, number, number], s: 1.4, seed: 17, fruit: false },
    { p: [92, 0, -10] as [number, number, number], s: 1.2, seed: 18, fruit: false },
    { p: [96, 0, 10] as [number, number, number], s: 1.3, seed: 19, fruit: false },
    { p: [92, 0, 25] as [number, number, number], s: 1.25, seed: 20, fruit: false },
    { p: [95, 0, 40] as [number, number, number], s: 1.35, seed: 21, fruit: false },
    { p: [92, 0, 55] as [number, number, number], s: 1.2, seed: 22, fruit: false },
    { p: [82, 0, 58] as [number, number, number], s: 1.3, seed: 23, fruit: false },
    { p: [88, 0, -60] as [number, number, number], s: 1.25, seed: 24, fruit: false },
    { p: [75, 0, -75] as [number, number, number], s: 1.35, seed: 310, fruit: false },
    { p: [78, 0, -45] as [number, number, number], s: 1.2, seed: 311, fruit: false },
    { p: [72, 0, -20] as [number, number, number], s: 1.4, seed: 312, fruit: false },
    { p: [76, 0, 15] as [number, number, number], s: 1.3, seed: 313, fruit: false },
    { p: [72, 0, 35] as [number, number, number], s: 1.25, seed: 314, fruit: false },
    { p: [55, 0, -62] as [number, number, number], s: 1.3, seed: 13, fruit: false },
    { p: [52, 0, -50] as [number, number, number], s: 1.2, seed: 14, fruit: false },
    { p: [56, 0, -38] as [number, number, number], s: 1.35, seed: 15, fruit: false },
    { p: [52, 0, -24] as [number, number, number], s: 1.25, seed: 16, fruit: false },
    { p: [55, 0, -10] as [number, number, number], s: 1.4, seed: 17, fruit: false },
    { p: [56, 0, 18] as [number, number, number], s: 1.3, seed: 19, fruit: false },
    { p: [52, 0, 32] as [number, number, number], s: 1.25, seed: 20, fruit: false },

    // ⛰️ 3. NORTH MOUNTAIN RIDGE FOREST (20 Trees - Expanded)
    { p: [-85, 0, -92] as [number, number, number], s: 1.35, seed: 320, fruit: false },
    { p: [-70, 0, -90] as [number, number, number], s: 1.25, seed: 321, fruit: false },
    { p: [-55, 0, -94] as [number, number, number], s: 1.4, seed: 322, fruit: false },
    { p: [-38, 0, -92] as [number, number, number], s: 1.3, seed: 25, fruit: false },
    { p: [-26, 0, -90] as [number, number, number], s: 1.25, seed: 26, fruit: false },
    { p: [-14, 0, -94] as [number, number, number], s: 1.35, seed: 27, fruit: false },
    { p: [0, 0, -95] as [number, number, number], s: 1.4, seed: 28, fruit: false },
    { p: [12, 0, -92] as [number, number, number], s: 1.2, seed: 29, fruit: false },
    { p: [26.4, 0, -94.2] as [number, number, number], s: 1.3, seed: 30, fruit: false },
    { p: [38, 0, -92] as [number, number, number], s: 1.35, seed: 31, fruit: false },
    { p: [55, 0, -94] as [number, number, number], s: 1.25, seed: 323, fruit: false },
    { p: [70, 0, -90] as [number, number, number], s: 1.3, seed: 324, fruit: false },
    { p: [85, 0, -92] as [number, number, number], s: 1.35, seed: 325, fruit: false },
    { p: [48, 0, -68] as [number, number, number], s: 1.25, seed: 32, fruit: false },
    { p: [-48, 0, -68] as [number, number, number], s: 1.4, seed: 33, fruit: false },
    { p: [6, 0, -66] as [number, number, number], s: 1.15, seed: 34, fruit: false },
    { p: [-32, 0, -68] as [number, number, number], s: 1.3, seed: 128, fruit: false },
    { p: [-20, 0, -68] as [number, number, number], s: 1.2, seed: 129, fruit: false },
    { p: [-6, 0, -68] as [number, number, number], s: 1.35, seed: 130, fruit: false },
    { p: [17.4, 0, -70.4] as [number, number, number], s: 1.25, seed: 131, fruit: false },
    { p: [32, 0, -68] as [number, number, number], s: 1.4, seed: 132, fruit: false },
    { p: [44, 0, -66] as [number, number, number], s: 1.3, seed: 133, fruit: false },

    // 🌄 4. HILLSIDE PARKLAND GROVES (Central Gentle Hill Slopes - 24 Trees)
    { p: [-14, 0, -14] as [number, number, number], s: 1.35, seed: 140, fruit: false },
    { p: [-18, 0, -10] as [number, number, number], s: 1.25, seed: 141, fruit: true },
    { p: [-10.2, 0, 15.8] as [number, number, number], s: 1.3, seed: 142, fruit: false },
    { p: [-16, 0, 10] as [number, number, number], s: 1.4, seed: 143, fruit: true },
    { p: [14, 0, -14] as [number, number, number], s: 1.2, seed: 144, fruit: false },
    { p: [18, 0, -10] as [number, number, number], s: 1.35, seed: 145, fruit: true },
    { p: [12, 0, 14] as [number, number, number], s: 1.25, seed: 146, fruit: false },
    { p: [14.9, 0, 11.1] as [number, number, number], s: 1.3, seed: 147, fruit: true },
    { p: [-8, 0, -18] as [number, number, number], s: 1.25, seed: 148, fruit: false },
    { p: [8, 0, -18] as [number, number, number], s: 1.3, seed: 149, fruit: false },
    { p: [-8.4, 0, 16.6] as [number, number, number], s: 1.35, seed: 150, fruit: true },
    { p: [8, 0, 18] as [number, number, number], s: 1.2, seed: 151, fruit: false },
    { p: [-22, 0, -2] as [number, number, number], s: 1.4, seed: 152, fruit: true },
    { p: [-22, 0, 6] as [number, number, number], s: 1.25, seed: 153, fruit: false },
    { p: [22, 0, -2] as [number, number, number], s: 1.3, seed: 154, fruit: true },
    { p: [22, 0, 6] as [number, number, number], s: 1.35, seed: 155, fruit: false },
    { p: [-10, 0, -8] as [number, number, number], s: 1.15, seed: 156, fruit: true },
    { p: [10, 0, -8] as [number, number, number], s: 1.25, seed: 157, fruit: false },
    { p: [-12.4, 0, 7.4] as [number, number, number], s: 1.3, seed: 158, fruit: true },
    { p: [10, 0, 8] as [number, number, number], s: 1.2, seed: 159, fruit: false },
    { p: [-15.2, 0, 0.4] as [number, number, number], s: 1.35, seed: 160, fruit: false },
    { p: [14.8, 0, 0.4] as [number, number, number], s: 1.25, seed: 161, fruit: true },
    { p: [3, 0, -18] as [number, number, number], s: 1.3, seed: 162, fruit: false },
    { p: [0, 0, 18] as [number, number, number], s: 1.4, seed: 163, fruit: true },

    // 🌊 5. RECREATION POND LAKESIDE GROVE (14 Trees)
    { p: [-22.5, 0, 26] as [number, number, number], s: 1.25, seed: 35, fruit: false },
    { p: [-23.5, 0, 38] as [number, number, number], s: 1.3, seed: 36, fruit: false },
    { p: [-15, 0, 44] as [number, number, number], s: 1.2, seed: 37, fruit: false },
    { p: [4, 0, 24] as [number, number, number], s: 1.15, seed: 38, fruit: false },
    { p: [4, 0, 36] as [number, number, number], s: 1.25, seed: 39, fruit: false },
    { p: [-4, 0, 46] as [number, number, number], s: 1.3, seed: 40, fruit: false },
    { p: [-10.6, 0, 16.6] as [number, number, number], s: 1.2, seed: 41, fruit: false },
    { p: [2, 0, 18] as [number, number, number], s: 1.1, seed: 42, fruit: false },
    { p: [-16.1, 0, 44.5] as [number, number, number], s: 1.3, seed: 170, fruit: false },
    { p: [-24, 0, 32] as [number, number, number], s: 1.35, seed: 171, fruit: false },
    { p: [-2, 0, 42] as [number, number, number], s: 1.2, seed: 172, fruit: false },
    { p: [6, 0, 42] as [number, number, number], s: 1.25, seed: 173, fruit: false },
    { p: [-24, 0, 17] as [number, number, number], s: 1.4, seed: 174, fruit: false },
    { p: [6, 0, 20] as [number, number, number], s: 1.3, seed: 175, fruit: false },

    // 💧 6. NORTH POND GROVE (8 Trees)
    { p: [10, 0, -62] as [number, number, number], s: 1.2, seed: 43, fruit: false },
    { p: [30, 0, -62] as [number, number, number], s: 1.25, seed: 44, fruit: false },
    { p: [20, 0, -72] as [number, number, number], s: 1.35, seed: 45, fruit: false },
    { p: [30, 0, -54] as [number, number, number], s: 1.15, seed: 46, fruit: false },
    { p: [12, 0, -57.5] as [number, number, number], s: 1.3, seed: 180, fruit: false },
    { p: [26, 0, -52] as [number, number, number], s: 1.25, seed: 181, fruit: false },
    { p: [10, 0, -70] as [number, number, number], s: 1.35, seed: 182, fruit: false },
    { p: [28, 0, -70] as [number, number, number], s: 1.2, seed: 183, fruit: false },

    // 🍎 7. EXPANDED FRUIT ORCHARD GROVE (South East - 12 Fruit Trees)
    { p: [31.5, 0, 35] as [number, number, number], s: 1.15, seed: 47, fruit: true },
    { p: [35, 0, 35] as [number, number, number], s: 1.2, seed: 48, fruit: true },
    { p: [42, 0, 35] as [number, number, number], s: 1.1, seed: 49, fruit: true },
    { p: [30.4, 0, 44.6] as [number, number, number], s: 1.25, seed: 50, fruit: true },
    { p: [35, 0, 44] as [number, number, number], s: 1.15, seed: 51, fruit: true },
    { p: [42, 0, 44] as [number, number, number], s: 1.2, seed: 52, fruit: true },
    { p: [31, 0, 26] as [number, number, number], s: 1.1, seed: 53, fruit: true },
    { p: [36, 0, 26] as [number, number, number], s: 1.25, seed: 54, fruit: true },
    { p: [44, 0, 26] as [number, number, number], s: 1.2, seed: 190, fruit: true },
    { p: [48, 0, 35] as [number, number, number], s: 1.3, seed: 191, fruit: true },
    { p: [48, 0, 44] as [number, number, number], s: 1.15, seed: 192, fruit: true },
    { p: [35, 0, 50] as [number, number, number], s: 1.25, seed: 193, fruit: true },

    // 🏠 8. ABOUT ME & EDUCATION WOODLAND (14 Trees)
    { p: [-30, 0, -44] as [number, number, number], s: 1.3, seed: 60, fruit: false },
    { p: [-24, 0, -46] as [number, number, number], s: 1.25, seed: 61, fruit: true },
    { p: [-18, 0, -42] as [number, number, number], s: 1.35, seed: 62, fruit: false },
    { p: [-12, 0, -44] as [number, number, number], s: 1.2, seed: 63, fruit: true },
    { p: [-28, 0, -36] as [number, number, number], s: 1.3, seed: 64, fruit: false },
    { p: [-22, 0, -38] as [number, number, number], s: 1.4, seed: 65, fruit: true },
    { p: [-15, 0, -35] as [number, number, number], s: 1.25, seed: 66, fruit: false },
    { p: [-8.2, 0, -37.6] as [number, number, number], s: 1.35, seed: 67, fruit: true },
    { p: [-26, 0, -28] as [number, number, number], s: 1.2, seed: 68, fruit: false },
    { p: [-18, 0, -28] as [number, number, number], s: 1.3, seed: 69, fruit: true },
    { p: [-10, 0, -28] as [number, number, number], s: 1.25, seed: 70, fruit: false },
    { p: [-7, 0, -32] as [number, number, number], s: 1.15, seed: 71, fruit: false },
    { p: [-34, 0, -50] as [number, number, number], s: 1.35, seed: 200, fruit: false },
    { p: [-14, 0, -50] as [number, number, number], s: 1.25, seed: 201, fruit: true },

    // 💼 9. EXPERIENCE & PROJECTS WOODLAND (12 Trees)
    { p: [-48, 0, 8] as [number, number, number], s: 1.35, seed: 80, fruit: true },
    { p: [-44, 0, 0] as [number, number, number], s: 1.25, seed: 81, fruit: false },
    { p: [-46, 0, 16] as [number, number, number], s: 1.3, seed: 82, fruit: true },
    { p: [-38, 0, 6] as [number, number, number], s: 1.4, seed: 83, fruit: false },
    { p: [-36, 0, 14] as [number, number, number], s: 1.2, seed: 84, fruit: true },
    { p: [-30, 0, 2] as [number, number, number], s: 1.35, seed: 85, fruit: false },
    { p: [-28, 0, 10] as [number, number, number], s: 1.25, seed: 86, fruit: true },
    { p: [-24.1, 0, -3.5] as [number, number, number], s: 1.3, seed: 87, fruit: false },
    { p: [-32, 0, -5.5] as [number, number, number], s: 1.15, seed: 88, fruit: false },
    { p: [-48, 0, -4] as [number, number, number], s: 1.3, seed: 89, fruit: true },
    { p: [-38, 0, -2] as [number, number, number], s: 1.25, seed: 210, fruit: false },
    { p: [-48, 0, 22] as [number, number, number], s: 1.35, seed: 211, fruit: true },

    // 🎓 10. EDUCATION & SKILLS WOODLAND (12 Trees)
    { p: [16, 0, -32] as [number, number, number], s: 1.3, seed: 90, fruit: true },
    { p: [22, 0, -35] as [number, number, number], s: 1.25, seed: 91, fruit: false },
    { p: [28, 0, -32] as [number, number, number], s: 1.35, seed: 92, fruit: true },
    { p: [32.5, 0, -36] as [number, number, number], s: 1.2, seed: 93, fruit: false },
    { p: [18, 0, -24] as [number, number, number], s: 1.4, seed: 94, fruit: false },
    { p: [24, 0, -25] as [number, number, number], s: 1.3, seed: 95, fruit: true },
    { p: [30, 0, -26] as [number, number, number], s: 1.25, seed: 96, fruit: false },
    { p: [16, 0, -14] as [number, number, number], s: 1.35, seed: 97, fruit: true },
    { p: [22, 0, -15] as [number, number, number], s: 1.2, seed: 98, fruit: false },
    { p: [28, 0, -16] as [number, number, number], s: 1.3, seed: 99, fruit: true },
    { p: [12, 0, -28] as [number, number, number], s: 1.25, seed: 220, fruit: false },
    { p: [32.5, 0, -22] as [number, number, number], s: 1.3, seed: 221, fruit: true },

    // 🛠️ 11. SKILLS & DEVELOPER WORKSHOP GROVE (10 Trees)
    { p: [42, 0, -2] as [number, number, number], s: 1.35, seed: 105, fruit: true },
    { p: [46, 0, 4] as [number, number, number], s: 1.25, seed: 106, fruit: false },
    { p: [40, 0, 8] as [number, number, number], s: 1.4, seed: 107, fruit: true },
    { p: [48, 0, 10] as [number, number, number], s: 1.3, seed: 108, fruit: false },
    { p: [34, 0, 2] as [number, number, number], s: 1.2, seed: 109, fruit: true },
    { p: [36, 0, 10] as [number, number, number], s: 1.35, seed: 110, fruit: false },
    { p: [44, 0, 14] as [number, number, number], s: 1.25, seed: 111, fruit: true },
    { p: [32, 0, -4] as [number, number, number], s: 1.3, seed: 112, fruit: false },
    { p: [48, 0, -4] as [number, number, number], s: 1.25, seed: 230, fruit: false },
    { p: [30, 0, 12] as [number, number, number], s: 1.35, seed: 231, fruit: true },
  ], []);

  return (
    <group>
      {/* 🌾 Wheat Field (Top-Center) */}
      <WheatField position={[-12, getTerrainHeight(-12, -58), -58]} />

      {/* 🐔 Chicken Coop (East) */}
      <ChickenCoop position={[44, getTerrainHeight(44, -32), -32]} />

      {/* 🛒 Cart & Storage (South-East) */}
      <CartAndStorage position={[22, getTerrainHeight(22, 52), 52]} />

      {/* Trees & Orchard */}
      {trees.map((t, idx) => (
        <OverhangingCanopyTree
          key={idx}
          position={[t.p[0], getTerrainHeight(t.p[0], t.p[2]), t.p[2]]}
          scale={t.s * 1.3}
          seed={t.seed}
          hasFruit={t.fruit}
        />
      ))}

      {/* 🍃 Dynamic Falling Leaves Particle System */}
      <FallingLeaves treePositions={trees} />

      {/* Glowing Lamp Posts */}
      {lanternPosts.map((l, idx) => (
        <GlowingLanternPost key={idx} position={[l.p[0], getTerrainHeight(l.p[0], l.p[2]), l.p[2]]} />
      ))}

      {/* ── SOUTH RIVER & SOUTH BRIDGE ── */}
      <group position={[-18, getTerrainHeight(-18, 58), 58]}>
        {/* River Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.02, 0]} receiveShadow material={waterMat}>
          <planeGeometry args={[240, 10.0]} />
        </mesh>

        {/* South Wooden Bridge */}
        <mesh castShadow receiveShadow position={[0, 0.14, 0]} material={bridgePlankMat}>
          <boxGeometry args={[7.5, 0.16, 10.2]} />
        </mesh>
        <mesh castShadow position={[-3.6, 0.5, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.3, 0.6, 10.2]} />
        </mesh>
        <mesh castShadow position={[3.6, 0.5, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.3, 0.6, 10.2]} />
        </mesh>
      </group>
    </group>
  );
}



