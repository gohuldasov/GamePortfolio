import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { oakLogTexture, oakPlankTexture, crateTexture, barrelTexture, leafTexture, cobblestoneTexture } from '../utils/minecraftTextures';
import { getTerrainHeight, WATER_SURFACE_Y } from '../utils/terrain';
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
const lanternGlassUnlitMat = new THREE.MeshStandardMaterial({
  color: 0x886633,
  roughness: 0.5,
  metalness: 0.2,
});
const lanternGlassLitMat = new THREE.MeshStandardMaterial({
  color: 0xffbb33,
  emissive: 0xff8800,
  emissiveIntensity: 1.8,
  roughness: 0.3,
});
const lanternBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lanternFrameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });

// Ultra-soft, zero-edge radial light pool texture for seamless terrain blending
const lampLightGlowTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0.0, 'rgba(255, 215, 120, 0.90)');
  grad.addColorStop(0.2, 'rgba(255, 175, 60, 0.50)');
  grad.addColorStop(0.45, 'rgba(255, 130, 30, 0.18)');
  grad.addColorStop(0.7, 'rgba(255, 90, 10, 0.04)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
})();

// Vertical light beam cone texture (soft atmospheric warm light ray shining downward)
const lampLightBeamTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, 'rgba(255, 235, 150, 0.85)');
  grad.addColorStop(0.15, 'rgba(255, 200, 90, 0.60)');
  grad.addColorStop(0.45, 'rgba(255, 160, 50, 0.30)');
  grad.addColorStop(0.75, 'rgba(255, 120, 20, 0.10)');
  grad.addColorStop(1.0, 'rgba(255, 90, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
})();

// Glowing Pure Round Light Mark / Circular Halo Texture for Street Light Tip
const lampTipFlareTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Smooth, pure round radial gradient glow bulb
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');  // Pure bright white center core
  grad.addColorStop(0.20, 'rgba(255, 225, 130, 0.95)'); // Luminous yellow inner ring
  grad.addColorStop(0.45, 'rgba(255, 175, 60, 0.55)');  // Warm amber soft halo
  grad.addColorStop(0.75, 'rgba(255, 120, 20, 0.15)');  // Smooth outer gradient edge
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
})();
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

// Glowing Tall Street Lamp Post
function GlowingLanternPost({ position, rotationY = 0, isNight = false }: { position: [number, number, number]; rotationY?: number; isNight?: boolean }) {
  const targetRef = useRef<THREE.Object3D>(null);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Heavy Stone Pedestal Foundation Base */}
      <mesh castShadow receiveShadow material={rockMat} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.8, 8]} />
      </mesh>

      {/* Main Tall Column Post (Height 4.2m, top reaches 4.6m) */}
      <mesh castShadow receiveShadow material={trunkOakMat} position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 4.2, 8]} />
      </mesh>

      {/* Decorative Wrought Iron Bands */}
      <mesh castShadow material={lanternFrameMat} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.1, 8]} />
      </mesh>
      <mesh castShadow material={lanternFrameMat} position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.1, 8]} />
      </mesh>

      {/* Decorative Top Cap */}
      <mesh castShadow receiveShadow material={lanternFrameMat} position={[0, 4.65, 0]}>
        <coneGeometry args={[0.18, 0.3, 8]} />
      </mesh>

      {/* Extended Horizontal Arm (Reaches 0.85m outward over the road edge) */}
      <mesh castShadow receiveShadow material={fenceMat} position={[0.42, 4.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
      </mesh>

      {/* Diagonal Support Bracket */}
      <mesh castShadow receiveShadow material={fenceMat} position={[0.2, 4.0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.5, 0.07]} />
      </mesh>

      {/* Hanging Chain / Fixture Mount */}
      <mesh material={lanternFrameMat} position={[0.85, 4.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
      </mesh>

      {/* Main Lantern Housing (Hanging at Y = 3.65m) */}
      <group position={[0.85, 3.65, 0]}>
        {/* Metal Frame Cage */}
        <mesh material={lanternFrameMat} castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
        </mesh>

        {/* Glass Panels (Glowing in Dark Mode, Unlit during Day) */}
        <mesh material={isNight ? lanternGlassLitMat : lanternGlassUnlitMat} position={[0, 0, 0]}>
          <boxGeometry args={[0.24, 0.4, 0.24]} />
        </mesh>

        {/* Inner Luminous White Filament Bulb (Active ONLY in Dark Mode) */}
        {isNight && (
          <mesh material={lanternBulbMat} position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
          </mesh>
        )}

        {/* 💡 Radiant Light Mark / Flare Spot directly on the Street Light Fixture */}
        {isNight && (
          <sprite position={[0, 0, 0]} scale={[1.8, 1.8, 1.0]}>
            <spriteMaterial
              map={lampTipFlareTexture}
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        )}

        {/* Warm Ambient Street Light Illumination (Seamless Ultra-Soft Blended Lighting) */}
        {isNight && (
          <>
            <pointLight
              color={0xffb74d}
              intensity={5.8}
              distance={20}
              decay={1.2}
              position={[0, 0, 0]}
            />

            <spotLight
              color={0xffa726}
              intensity={7.5}
              distance={18}
              angle={Math.PI / 2.5}
              penumbra={1.0}
              position={[0, 0, 0]}
              target={targetRef.current || undefined}
            />
          </>
        )}
      </group>

      {/* SpotLight Target on Ground */}
      <object3D ref={targetRef} position={[0.85, 0, 0]} />

      {/* Seamless Golden Light Pool Decal on Ground (100% soft borderless blend) */}
      {isNight && (
        <mesh position={[0.85, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[11.0, 11.0]} />
          <meshBasicMaterial
            map={lampLightGlowTexture}
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
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
    // ── MAIN SOUTH HIGHWAY (Side of Road) ──
    { p: [-3.2, 0, 54.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, 54.0] as [number, number, number], r: Math.PI },
    { p: [-3.2, 0, 42.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, 42.0] as [number, number, number], r: Math.PI },
    { p: [-3.2, 0, 30.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, 30.0] as [number, number, number], r: Math.PI },
    { p: [-3.2, 0, 18.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, 18.0] as [number, number, number], r: Math.PI },
    { p: [-3.2, 0, 6.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, 6.0] as [number, number, number], r: Math.PI },

    // ── CENTRAL PLAZA CIRCLE ──
    { p: [6.5, 0, 6.5] as [number, number, number], r: Math.PI * 1.25 },
    { p: [-6.5, 0, 6.5] as [number, number, number], r: Math.PI * 0.25 },
    { p: [6.5, 0, -6.5] as [number, number, number], r: Math.PI * 1.75 },
    { p: [-6.5, 0, -6.5] as [number, number, number], r: Math.PI * 0.75 },

    // ── HOUSE 4: PROJECTS ROAD (West - Side of Road) ──
    { p: [-19.0, 0, -13.0] as [number, number, number], r: Math.PI / 2 },
    { p: [-26.0, 0, -7.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [-33.0, 0, -13.0] as [number, number, number], r: Math.PI / 2 },
    { p: [-40.0, 0, -7.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [-47.0, 0, -13.0] as [number, number, number], r: Math.PI / 2 },
    { p: [-54.0, 0, -7.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [-61.0, 0, -13.0] as [number, number, number], r: Math.PI / 2 },
    { p: [-68.0, 0, -7.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [-75.0, 0, -13.0] as [number, number, number], r: Math.PI / 2 },

    // ── HOUSE 1: ABOUT ME ROAD (South-West - Side of Road) ──
    { p: [-18.0, 0, -14.5] as [number, number, number], r: Math.PI + 0.5 },
    { p: [-28.0, 0, -13.5] as [number, number, number], r: 0.5 },
    { p: [-35.0, 0, -22.5] as [number, number, number], r: Math.PI + 0.5 },
    { p: [-42.0, 0, -28.0] as [number, number, number], r: 0.5 },
    { p: [-52.0, 0, -32.0] as [number, number, number], r: Math.PI + 0.6 },
    { p: [-60.0, 0, -42.0] as [number, number, number], r: 0.6 },
    { p: [-70.0, 0, -48.0] as [number, number, number], r: Math.PI + 0.6 },

    // ── HOUSE 5: EXPERIENCE ROAD (North-West - Side of Road) ──
    { p: [-12.0, 0, 5.0] as [number, number, number], r: -0.6 },
    { p: [-18.0, 0, 18.0] as [number, number, number], r: Math.PI - 0.6 },
    { p: [-30.0, 0, 16.0] as [number, number, number], r: -0.4 },
    { p: [-38.0, 0, 20.0] as [number, number, number], r: Math.PI - 0.4 },
    { p: [-50.0, 0, 22.0] as [number, number, number], r: -0.3 },
    { p: [-62.0, 0, 34.0] as [number, number, number], r: Math.PI - 0.3 },
    { p: [-72.0, 0, 30.0] as [number, number, number], r: -0.3 },
    { p: [-76.0, 0, 39.0] as [number, number, number], r: Math.PI - 0.3 },

    // ── HOUSE 2 & NORTH ROAD (Education & North Pond - Side of Road) ──
    { p: [-3.2, 0, -10.0] as [number, number, number], r: 0 },
    { p: [3.2, 0, -18.0] as [number, number, number], r: Math.PI },
    { p: [-10.0, 0, -28.0] as [number, number, number], r: 0.6 },
    { p: [-4.0, 0, -34.0] as [number, number, number], r: Math.PI + 0.6 },
    { p: [-18.0, 0, -42.0] as [number, number, number], r: 0.3 },
    { p: [-12.0, 0, -52.0] as [number, number, number], r: Math.PI + 0.3 },
    { p: [-23.0, 0, -62.0] as [number, number, number], r: 0.2 },
    { p: [-17.0, 0, -70.0] as [number, number, number], r: Math.PI + 0.2 },

    // ── HOUSE 3: SKILLS ROAD (South-East - Side of Road) ──
    { p: [12.0, 0, -1.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [18.0, 0, -9.0] as [number, number, number], r: Math.PI / 2 },
    { p: [28.0, 0, -5.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [38.0, 0, -15.0] as [number, number, number], r: Math.PI / 2 },
    { p: [48.0, 0, -11.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [58.0, 0, -20.0] as [number, number, number], r: Math.PI / 2 },
    { p: [68.0, 0, -15.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [74.0, 0, -24.0] as [number, number, number], r: Math.PI / 2 },

    // ── WORKSHOP: CHURCH ROAD (North-East - Side of Road) ──
    { p: [11.0, 0, 9.0] as [number, number, number], r: 0.4 },
    { p: [17.0, 0, 5.0] as [number, number, number], r: Math.PI + 0.4 },
    { p: [26.0, 0, 16.0] as [number, number, number], r: 0.4 },
    { p: [36.0, 0, 14.0] as [number, number, number], r: Math.PI + 0.4 },
    { p: [48.0, 0, 28.0] as [number, number, number], r: 0.4 },
    { p: [58.0, 0, 24.0] as [number, number, number], r: Math.PI + 0.4 },
    { p: [68.0, 0, 33.0] as [number, number, number], r: 0.4 },
    { p: [74.0, 0, 26.0] as [number, number, number], r: Math.PI + 0.4 },

    // ── WINDMILL & FARM DRIVEWAY ──
    { p: [-52.0, 0, -32.0] as [number, number, number], r: 0 },
    { p: [-62.0, 0, -46.0] as [number, number, number], r: Math.PI },
    { p: [-74.0, 0, -60.0] as [number, number, number], r: 0 },
    { p: [-84.0, 0, -74.0] as [number, number, number], r: Math.PI },

    // ── ARCHERY RANGE & BARN/SILO DRIVEWAY ──
    { p: [46.0, 0, -25.0] as [number, number, number], r: 0 },
    { p: [54.0, 0, -32.0] as [number, number, number], r: Math.PI },
    { p: [62.0, 0, -42.0] as [number, number, number], r: 0 },
    { p: [70.0, 0, -54.0] as [number, number, number], r: Math.PI },
    { p: [76.0, 0, -66.0] as [number, number, number], r: 0 },

    // ── BAKERY & TAVERN DECK ──
    { p: [44.0, 0, 32.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [52.0, 0, 42.0] as [number, number, number], r: Math.PI / 2 },
    { p: [46.0, 0, 50.0] as [number, number, number], r: 0 },

    // ── RECREATION DECK / POND DRIVEWAY ──
    { p: [-12.0, 0, 14.0] as [number, number, number], r: -Math.PI / 2 },
    { p: [-14.0, 0, 22.0] as [number, number, number], r: Math.PI / 2 },
    { p: [-14.0, 0, 32.0] as [number, number, number], r: -Math.PI / 2 },
  ], []);

  const trees = useMemo(() => [
    // 🌲 1. WEST OUTER DENSE FOREST WALL (X: -75 to -98, Z: -90 to +85)
    { p: [-98, 0, -90] as [number, number, number], s: 1.35, seed: 1, fruit: false },
    { p: [-98, 0, -80] as [number, number, number], s: 1.25, seed: 2, fruit: false },
    { p: [-98, 0, -70] as [number, number, number], s: 1.4, seed: 3, fruit: false },
    { p: [-98, 0, -60] as [number, number, number], s: 1.3, seed: 4, fruit: false },
    { p: [-98, 0, -50] as [number, number, number], s: 1.35, seed: 5, fruit: false },
    { p: [-98, 0, -40] as [number, number, number], s: 1.2, seed: 6, fruit: false },
    { p: [-98, 0, -30] as [number, number, number], s: 1.4, seed: 7, fruit: false },
    { p: [-98, 0, -20] as [number, number, number], s: 1.25, seed: 8, fruit: false },
    { p: [-98, 0, -10] as [number, number, number], s: 1.3, seed: 9, fruit: false },
    { p: [-98, 0, 0] as [number, number, number], s: 1.35, seed: 10, fruit: false },
    { p: [-98, 0, 10] as [number, number, number], s: 1.2, seed: 11, fruit: false },
    { p: [-98, 0, 20] as [number, number, number], s: 1.4, seed: 12, fruit: false },
    { p: [-98, 0, 30] as [number, number, number], s: 1.25, seed: 13, fruit: false },
    { p: [-98, 0, 40] as [number, number, number], s: 1.3, seed: 14, fruit: false },
    { p: [-98, 0, 50] as [number, number, number], s: 1.35, seed: 15, fruit: false },
    { p: [-98, 0, 66] as [number, number, number], s: 1.2, seed: 16, fruit: false },
    { p: [-98, 0, 70] as [number, number, number], s: 1.4, seed: 17, fruit: false },
    { p: [-98, 0, 80] as [number, number, number], s: 1.3, seed: 18, fruit: false },

    // Middle West Row (X: -90)
    { p: [-90, 0, -85] as [number, number, number], s: 1.3, seed: 19, fruit: false },
    { p: [-90.6, 0, -74.7] as [number, number, number], s: 1.4, seed: 20, fruit: false },
    { p: [-90, 0, -65] as [number, number, number], s: 1.2, seed: 21, fruit: false },
    { p: [-90, 0, -55] as [number, number, number], s: 1.35, seed: 22, fruit: false },
    { p: [-90, 0, -45] as [number, number, number], s: 1.25, seed: 23, fruit: false },
    { p: [-90, 0, -35] as [number, number, number], s: 1.4, seed: 24, fruit: false },
    { p: [-90, 0, -25] as [number, number, number], s: 1.2, seed: 25, fruit: false },
    { p: [-90, 0, -15] as [number, number, number], s: 1.3, seed: 26, fruit: false },
    { p: [-90, 0, -5] as [number, number, number], s: 1.35, seed: 27, fruit: false },
    { p: [-90, 0, 5] as [number, number, number], s: 1.25, seed: 28, fruit: false },
    { p: [-90, 0, 15] as [number, number, number], s: 1.4, seed: 29, fruit: false },
    { p: [-90, 0, 25] as [number, number, number], s: 1.2, seed: 30, fruit: false },
    { p: [-90, 0, 35] as [number, number, number], s: 1.35, seed: 31, fruit: false },
    { p: [-90, 0, 45] as [number, number, number], s: 1.25, seed: 32, fruit: false },
    { p: [-90, 0, 50] as [number, number, number], s: 1.4, seed: 33, fruit: false },
    { p: [-90, 0, 65] as [number, number, number], s: 1.3, seed: 34, fruit: false },
    { p: [-90, 0, 75] as [number, number, number], s: 1.35, seed: 35, fruit: false },
    { p: [-90, 0, 85] as [number, number, number], s: 1.2, seed: 36, fruit: false },

    // Inner West Row (X: -82)
    { p: [-92, 0, -82] as [number, number, number], s: 1.25, seed: 37, fruit: false },
    { p: [-85.9, 0, -65.9] as [number, number, number], s: 1.35, seed: 38, fruit: false },
    { p: [-82, 0, -56] as [number, number, number], s: 1.2, seed: 39, fruit: false },
    { p: [-82, 0, -44] as [number, number, number], s: 1.4, seed: 40, fruit: false },
    { p: [-82, 0, -32] as [number, number, number], s: 1.3, seed: 41, fruit: false },
    { p: [-82, 0, -20] as [number, number, number], s: 1.25, seed: 42, fruit: false },
    { p: [-82, 0, -8] as [number, number, number], s: 1.35, seed: 43, fruit: false },
    { p: [-82, 0, 4] as [number, number, number], s: 1.2, seed: 44, fruit: false },
    { p: [-82, 0, 16] as [number, number, number], s: 1.4, seed: 45, fruit: false },
    { p: [-82, 0, 28] as [number, number, number], s: 1.3, seed: 46, fruit: false },
    { p: [-82, 0, 40] as [number, number, number], s: 1.25, seed: 47, fruit: false },
    { p: [-82, 0, 52] as [number, number, number], s: 1.35, seed: 48, fruit: false },
    { p: [-82, 0, 64] as [number, number, number], s: 1.2, seed: 49, fruit: false },
    { p: [-82, 0, 76] as [number, number, number], s: 1.3, seed: 50, fruit: false },

    // 🌲 2. EAST OUTER DENSE FOREST WALL (X: +75 to +98, Z: -90 to +85)
    { p: [98, 0, -90] as [number, number, number], s: 1.35, seed: 51, fruit: false },
    { p: [98, 0, -80] as [number, number, number], s: 1.25, seed: 52, fruit: false },
    { p: [98, 0, -70] as [number, number, number], s: 1.4, seed: 53, fruit: false },
    { p: [98, 0, -60] as [number, number, number], s: 1.3, seed: 54, fruit: false },
    { p: [98, 0, -50] as [number, number, number], s: 1.35, seed: 55, fruit: false },
    { p: [98, 0, -40] as [number, number, number], s: 1.2, seed: 56, fruit: false },
    { p: [98, 0, -30] as [number, number, number], s: 1.4, seed: 57, fruit: false },
    { p: [98, 0, -20] as [number, number, number], s: 1.25, seed: 58, fruit: false },
    { p: [98, 0, -10] as [number, number, number], s: 1.3, seed: 59, fruit: false },
    { p: [98, 0, 0] as [number, number, number], s: 1.35, seed: 60, fruit: false },
    { p: [98, 0, 10] as [number, number, number], s: 1.2, seed: 61, fruit: false },
    { p: [98, 0, 20] as [number, number, number], s: 1.4, seed: 62, fruit: false },
    { p: [98, 0, 30] as [number, number, number], s: 1.25, seed: 63, fruit: false },
    { p: [98, 0, 40] as [number, number, number], s: 1.3, seed: 64, fruit: false },
    { p: [98, 0, 50] as [number, number, number], s: 1.35, seed: 65, fruit: false },
    { p: [98, 0, 66] as [number, number, number], s: 1.2, seed: 66, fruit: false },
    { p: [98, 0, 70] as [number, number, number], s: 1.4, seed: 67, fruit: false },
    { p: [98, 0, 80] as [number, number, number], s: 1.3, seed: 68, fruit: false },

    // Middle East Row (X: +90)
    { p: [90, 0, -85] as [number, number, number], s: 1.3, seed: 69, fruit: false },
    { p: [90, 0, -75] as [number, number, number], s: 1.4, seed: 70, fruit: false },
    { p: [90, 0, -65] as [number, number, number], s: 1.2, seed: 71, fruit: false },
    { p: [90, 0, -55] as [number, number, number], s: 1.35, seed: 72, fruit: false },
    { p: [90, 0, -45] as [number, number, number], s: 1.25, seed: 73, fruit: false },
    { p: [90, 0, -35] as [number, number, number], s: 1.4, seed: 74, fruit: false },
    { p: [90, 0, -25] as [number, number, number], s: 1.2, seed: 75, fruit: false },
    { p: [90, 0, -15] as [number, number, number], s: 1.3, seed: 76, fruit: false },
    { p: [90, 0, -5] as [number, number, number], s: 1.35, seed: 77, fruit: false },
    { p: [90, 0, 5] as [number, number, number], s: 1.25, seed: 78, fruit: false },
    { p: [90, 0, 15] as [number, number, number], s: 1.4, seed: 79, fruit: false },
    { p: [90, 0, 25] as [number, number, number], s: 1.2, seed: 80, fruit: false },
    { p: [90, 0, 35] as [number, number, number], s: 1.35, seed: 81, fruit: false },
    { p: [90, 0, 45] as [number, number, number], s: 1.25, seed: 82, fruit: false },
    { p: [90, 0, 50] as [number, number, number], s: 1.4, seed: 83, fruit: false },
    { p: [90, 0, 65] as [number, number, number], s: 1.3, seed: 84, fruit: false },
    { p: [90, 0, 75] as [number, number, number], s: 1.35, seed: 85, fruit: false },
    { p: [90, 0, 85] as [number, number, number], s: 1.2, seed: 86, fruit: false },

    // Inner East Row (X: +82)
    { p: [82, 0, -80] as [number, number, number], s: 1.25, seed: 87, fruit: false },
    { p: [82, 0, -68] as [number, number, number], s: 1.35, seed: 88, fruit: false },
    { p: [82, 0, -56] as [number, number, number], s: 1.2, seed: 89, fruit: false },
    { p: [82, 0, -44] as [number, number, number], s: 1.4, seed: 90, fruit: false },
    { p: [82, 0, -32] as [number, number, number], s: 1.3, seed: 91, fruit: false },
    { p: [82, 0, -20] as [number, number, number], s: 1.25, seed: 92, fruit: false },
    { p: [82, 0, -8] as [number, number, number], s: 1.35, seed: 93, fruit: false },
    { p: [82, 0, 4] as [number, number, number], s: 1.2, seed: 94, fruit: false },
    { p: [82, 0, 16] as [number, number, number], s: 1.4, seed: 95, fruit: false },
    { p: [82, 0, 28] as [number, number, number], s: 1.3, seed: 96, fruit: false },
    { p: [82, 0, 40] as [number, number, number], s: 1.25, seed: 97, fruit: false },
    { p: [82, 0, 52] as [number, number, number], s: 1.35, seed: 98, fruit: false },
    { p: [82, 0, 64] as [number, number, number], s: 1.2, seed: 99, fruit: false },
    { p: [82, 0, 76] as [number, number, number], s: 1.3, seed: 100, fruit: false },

    // ⛰️ 3. NORTH MOUNTAIN RIDGE FOREST (Z: -82 to -96, X: -90 to +90)
    { p: [-90, 0, -95] as [number, number, number], s: 1.35, seed: 101, fruit: false },
    { p: [-80, 0, -95] as [number, number, number], s: 1.25, seed: 102, fruit: false },
    { p: [-70, 0, -95] as [number, number, number], s: 1.4, seed: 103, fruit: false },
    { p: [-60, 0, -95] as [number, number, number], s: 1.3, seed: 104, fruit: false },
    { p: [-50, 0, -95] as [number, number, number], s: 1.35, seed: 105, fruit: false },
    { p: [-40, 0, -95] as [number, number, number], s: 1.2, seed: 106, fruit: false },
    { p: [-30, 0, -95] as [number, number, number], s: 1.4, seed: 107, fruit: false },
    { p: [-20, 0, -95] as [number, number, number], s: 1.25, seed: 108, fruit: false },
    { p: [-10, 0, -95] as [number, number, number], s: 1.3, seed: 109, fruit: false },
    { p: [0, 0, -95] as [number, number, number], s: 1.35, seed: 110, fruit: false },
    { p: [10, 0, -95] as [number, number, number], s: 1.2, seed: 111, fruit: false },
    { p: [20, 0, -95] as [number, number, number], s: 1.4, seed: 112, fruit: false },
    { p: [30, 0, -95] as [number, number, number], s: 1.25, seed: 113, fruit: false },
    { p: [40, 0, -95] as [number, number, number], s: 1.3, seed: 114, fruit: false },
    { p: [50, 0, -95] as [number, number, number], s: 1.35, seed: 115, fruit: false },
    { p: [60, 0, -95] as [number, number, number], s: 1.2, seed: 116, fruit: false },
    { p: [70, 0, -95] as [number, number, number], s: 1.4, seed: 117, fruit: false },
    { p: [80, 0, -95] as [number, number, number], s: 1.3, seed: 118, fruit: false },
    { p: [90, 0, -95] as [number, number, number], s: 1.35, seed: 119, fruit: false },

    // Middle North Ridge (Z: -89)
    { p: [-85, 0, -89] as [number, number, number], s: 1.3, seed: 120, fruit: false },
    { p: [-75, 0, -89] as [number, number, number], s: 1.4, seed: 121, fruit: false },
    { p: [-65, 0, -89] as [number, number, number], s: 1.2, seed: 122, fruit: false },
    { p: [-55, 0, -89] as [number, number, number], s: 1.35, seed: 123, fruit: false },
    { p: [-45, 0, -89] as [number, number, number], s: 1.25, seed: 124, fruit: false },
    { p: [-35, 0, -89] as [number, number, number], s: 1.4, seed: 125, fruit: false },
    { p: [-25, 0, -89] as [number, number, number], s: 1.2, seed: 126, fruit: false },
    { p: [-15, 0, -89] as [number, number, number], s: 1.3, seed: 127, fruit: false },
    { p: [-5, 0, -89] as [number, number, number], s: 1.35, seed: 128, fruit: false },
    { p: [5, 0, -89] as [number, number, number], s: 1.25, seed: 129, fruit: false },
    { p: [15, 0, -89] as [number, number, number], s: 1.4, seed: 130, fruit: false },
    { p: [25, 0, -89] as [number, number, number], s: 1.2, seed: 131, fruit: false },
    { p: [35, 0, -89] as [number, number, number], s: 1.35, seed: 132, fruit: false },
    { p: [45, 0, -89] as [number, number, number], s: 1.25, seed: 133, fruit: false },
    { p: [55, 0, -89] as [number, number, number], s: 1.4, seed: 134, fruit: false },
    { p: [65, 0, -89] as [number, number, number], s: 1.3, seed: 135, fruit: false },
    { p: [75, 0, -89] as [number, number, number], s: 1.35, seed: 136, fruit: false },
    { p: [85, 0, -89] as [number, number, number], s: 1.2, seed: 137, fruit: false },

    // Front North Ridge (Z: -83)
    { p: [-78, 0, -83] as [number, number, number], s: 1.25, seed: 138, fruit: false },
    { p: [-66, 0, -83] as [number, number, number], s: 1.35, seed: 139, fruit: false },
    { p: [-54, 0, -83] as [number, number, number], s: 1.2, seed: 140, fruit: false },
    { p: [-42, 0, -83] as [number, number, number], s: 1.4, seed: 141, fruit: false },
    { p: [-30, 0, -83] as [number, number, number], s: 1.3, seed: 142, fruit: false },
    { p: [-18, 0, -83] as [number, number, number], s: 1.25, seed: 143, fruit: false },
    { p: [-6, 0, -83] as [number, number, number], s: 1.35, seed: 144, fruit: false },
    { p: [6, 0, -83] as [number, number, number], s: 1.2, seed: 145, fruit: false },
    { p: [18, 0, -83] as [number, number, number], s: 1.4, seed: 146, fruit: false },
    { p: [30, 0, -83] as [number, number, number], s: 1.3, seed: 147, fruit: false },
    { p: [42, 0, -83] as [number, number, number], s: 1.25, seed: 148, fruit: false },
    { p: [54, 0, -83] as [number, number, number], s: 1.35, seed: 149, fruit: false },
    { p: [66, 0, -83] as [number, number, number], s: 1.2, seed: 150, fruit: false },
    { p: [78, 0, -83] as [number, number, number], s: 1.3, seed: 151, fruit: false },

    // 🌄 4. NORTH-WEST MEADOW FOREST (Behind Education & Certifications)
    { p: [-72, 0, -50] as [number, number, number], s: 1.3, seed: 152, fruit: false },
    { p: [-56, 0, -60] as [number, number, number], s: 1.35, seed: 153, fruit: false },
    { p: [-74, 0, -70] as [number, number, number], s: 1.25, seed: 154, fruit: false },
    { p: [-55, 0, -68] as [number, number, number], s: 1.4, seed: 155, fruit: false },
    { p: [-68, 0, -74] as [number, number, number], s: 1.3, seed: 156, fruit: false },
    { p: [-48, 0, -76] as [number, number, number], s: 1.2, seed: 157, fruit: false },
    { p: [-54, 0, -42] as [number, number, number], s: 1.35, seed: 158, fruit: false },
    { p: [-44, 0, -58] as [number, number, number], s: 1.25, seed: 159, fruit: false },
    { p: [-52, 0, -64] as [number, number, number], s: 1.4, seed: 160, fruit: false },
    { p: [-38, 0, -70] as [number, number, number], s: 1.3, seed: 161, fruit: false },

    // 🌄 5. NORTH-EAST MEADOW FOREST (Behind Projects & Achievements)
    { p: [74.1, 0, -50.3] as [number, number, number], s: 1.3, seed: 162, fruit: false },
    { p: [60, 0, -58] as [number, number, number], s: 1.35, seed: 163, fruit: false },
    { p: [78.8, 0, -62.1] as [number, number, number], s: 1.25, seed: 164, fruit: false },
    { p: [55, 0, -68] as [number, number, number], s: 1.4, seed: 165, fruit: false },
    { p: [68, 0, -74] as [number, number, number], s: 1.3, seed: 166, fruit: false },
    { p: [48, 0, -76] as [number, number, number], s: 1.2, seed: 167, fruit: false },
    { p: [59.6, 0, -48.9] as [number, number, number], s: 1.35, seed: 168, fruit: false },
    { p: [44, 0, -58] as [number, number, number], s: 1.25, seed: 169, fruit: false },
    { p: [52, 0, -64] as [number, number, number], s: 1.4, seed: 170, fruit: false },
    { p: [38, 0, -70] as [number, number, number], s: 1.3, seed: 171, fruit: false },

    // 🍃 6. CENTRAL FAR NORTH WOODS (Between Certifications & Achievements)
    { p: [-20, 0, -74] as [number, number, number], s: 1.3, seed: 172, fruit: false },
    { p: [-10, 0, -80] as [number, number, number], s: 1.35, seed: 173, fruit: false },
    { p: [0, 0, -84] as [number, number, number], s: 1.4, seed: 174, fruit: false },
    { p: [10, 0, -80] as [number, number, number], s: 1.3, seed: 175, fruit: false },
    { p: [20, 0, -74] as [number, number, number], s: 1.25, seed: 176, fruit: false },
    { p: [-5, 0, -72] as [number, number, number], s: 1.35, seed: 177, fruit: false },
    { p: [5, 0, -72] as [number, number, number], s: 1.2, seed: 178, fruit: false },

    // 🌊 7. MID-WEST ARCHERY & RECREATION POND WOODS
    { p: [-84, 0, -14] as [number, number, number], s: 1.3, seed: 179, fruit: false },
    { p: [-80, 0, -2] as [number, number, number], s: 1.35, seed: 180, fruit: false },
    { p: [-86, 0, 12] as [number, number, number], s: 1.25, seed: 181, fruit: false },
    { p: [-82, 0, 24] as [number, number, number], s: 1.4, seed: 182, fruit: false },
    { p: [-85, 0, 36] as [number, number, number], s: 1.3, seed: 183, fruit: false },
    { p: [-58, 0, 16] as [number, number, number], s: 1.2, seed: 184, fruit: false },
    { p: [-48, 0, 18] as [number, number, number], s: 1.35, seed: 185, fruit: false },
    { p: [-63.2, 0, 24.2] as [number, number, number], s: 1.25, seed: 186, fruit: false },
    { p: [-52, 0, 34] as [number, number, number], s: 1.4, seed: 187, fruit: false },
    { p: [-65, 0, 44] as [number, number, number], s: 1.3, seed: 188, fruit: false },
    { p: [-51.5, 0, 46] as [number, number, number], s: 1.2, seed: 189, fruit: false },
    { p: [-38, 0, 48] as [number, number, number], s: 1.35, seed: 190, fruit: false },
    { p: [-42.5, 0, 28.2] as [number, number, number], s: 1.25, seed: 191, fruit: false },
    { p: [-40.3, 0, 40.6] as [number, number, number], s: 1.3, seed: 192, fruit: false },

    // 🍎 8. MID-EAST ORCHARD & EAST WOODS
    { p: [30, 0, 25] as [number, number, number], s: 1.3, seed: 193, fruit: true },
    { p: [39.5, 0, 26.8] as [number, number, number], s: 1.25, seed: 194, fruit: true },
    { p: [35, 0, 35] as [number, number, number], s: 1.35, seed: 195, fruit: true },
    { p: [42.4, 0, 35.6] as [number, number, number], s: 1.2, seed: 196, fruit: true },
    { p: [28, 0, 44] as [number, number, number], s: 1.3, seed: 197, fruit: true },
    { p: [40, 0, 48] as [number, number, number], s: 1.25, seed: 198, fruit: true },
    { p: [55.8, 0, 32.7] as [number, number, number], s: 1.4, seed: 199, fruit: true },
    { p: [58, 0, 40] as [number, number, number], s: 1.3, seed: 200, fruit: true },
    { p: [35.3, 0, -17.6] as [number, number, number], s: 1.35, seed: 201, fruit: false },
    { p: [48.6, 0, -7.9] as [number, number, number], s: 1.2, seed: 202, fruit: false },
    { p: [61.5, 0, -23.5] as [number, number, number], s: 1.4, seed: 203, fruit: false },
    { p: [65, 0, -28] as [number, number, number], s: 1.3, seed: 204, fruit: false },
    { p: [38, 0, -32] as [number, number, number], s: 1.25, seed: 205, fruit: false },
    { p: [54.8, 0, -39.1] as [number, number, number], s: 1.35, seed: 206, fruit: false },
    { p: [68.6, 0, -37.7] as [number, number, number], s: 1.2, seed: 207, fruit: false },
    { p: [14, 0, -62] as [number, number, number], s: 1.25, seed: 208, fruit: false },

    // 🌊 9. SOUTH RIVERBANKS & MEADOWS
    { p: [-16, 0, 50] as [number, number, number], s: 1.35, seed: 209, fruit: false },
    { p: [-28, 0, 64] as [number, number, number], s: 1.3, seed: 210, fruit: false },
    { p: [-39.6, 0, 51.6] as [number, number, number], s: 1.25, seed: 211, fruit: false },
    { p: [-55, 0, 65] as [number, number, number], s: 1.4, seed: 212, fruit: false },
    { p: [-68, 0, 50] as [number, number, number], s: 1.3, seed: 213, fruit: false },
    { p: [-35, 0, 72] as [number, number, number], s: 1.2, seed: 214, fruit: false },
    { p: [-50, 0, 74] as [number, number, number], s: 1.35, seed: 215, fruit: false },
    { p: [-65, 0, 72] as [number, number, number], s: 1.25, seed: 216, fruit: false },
    { p: [16, 0, 50] as [number, number, number], s: 1.35, seed: 217, fruit: false },
    { p: [32, 0, 64] as [number, number, number], s: 1.25, seed: 218, fruit: false },
    { p: [48, 0, 51.5] as [number, number, number], s: 1.3, seed: 219, fruit: false },
    { p: [60, 0, 65] as [number, number, number], s: 1.4, seed: 220, fruit: false },
    { p: [72, 0, 50] as [number, number, number], s: 1.2, seed: 221, fruit: false },
    { p: [35, 0, 72] as [number, number, number], s: 1.3, seed: 222, fruit: false },
    { p: [50, 0, 74] as [number, number, number], s: 1.35, seed: 223, fruit: false },
    { p: [65, 0, 72] as [number, number, number], s: 1.25, seed: 224, fruit: false },

    // 🏡 10. OFF-ROAD VILLAGE FLANK ACCENTS
    { p: [-16.4, 0, 23.6] as [number, number, number], s: 1.2, seed: 225, fruit: false },
    { p: [14, 0, 18] as [number, number, number], s: 1.25, seed: 226, fruit: false },
    { p: [-12, 0, 36] as [number, number, number], s: 1.3, seed: 227, fruit: false },
    { p: [15, 0, 48] as [number, number, number], s: 1.35, seed: 228, fruit: false },

    // 🌳 11. INTER-BUILDING FOREST GROVE (Between Projects, About Me, and Education)
    // West Meadow (Between About Me [-22, 0] and Education [-45, -45])
    { p: [-36.1, 0, -16.5] as [number, number, number], s: 1.35, seed: 233, fruit: false },
    { p: [-38, 0, -18] as [number, number, number], s: 1.3, seed: 234, fruit: false },
    { p: [-26.5, 0, -26.5] as [number, number, number], s: 1.4, seed: 235, fruit: false },
    { p: [-35, 0, -32] as [number, number, number], s: 1.25, seed: 236, fruit: false },
    { p: [-42, 0, -38] as [number, number, number], s: 1.35, seed: 237, fruit: false },
    { p: [-30, 0, -42] as [number, number, number], s: 1.2, seed: 238, fruit: false },
    { p: [-36.7, 0, -17.4] as [number, number, number], s: 1.3, seed: 239, fruit: false },
    { p: [-36, 0, -3.5] as [number, number, number], s: 1.4, seed: 240, fruit: false },

    // East Meadow (Between Highway / About Me and Projects [45, -20])
    { p: [17.3, 0, -12.4] as [number, number, number], s: 1.3, seed: 241, fruit: false },
    { p: [26, 0, -16] as [number, number, number], s: 1.35, seed: 242, fruit: false },
    { p: [34, 0, -22] as [number, number, number], s: 1.25, seed: 243, fruit: false },
    { p: [22, 0, -28] as [number, number, number], s: 1.4, seed: 244, fruit: false },
    { p: [30, 0, -34] as [number, number, number], s: 1.3, seed: 245, fruit: false },
    { p: [25, 0, -42] as [number, number, number], s: 1.3, seed: 246, fruit: false },
    { p: [15, 0, -22] as [number, number, number], s: 1.35, seed: 247, fruit: false },
    { p: [38.8, 0, -5.1] as [number, number, number], s: 1.2, seed: 248, fruit: false },

    // Central Inter-Building Corridor
    { p: [-12, 0, -22] as [number, number, number], s: 1.3, seed: 249, fruit: false },
    { p: [-3.4, 0, -35.4] as [number, number, number], s: 1.25, seed: 250, fruit: false },
    { p: [8, 0, -22] as [number, number, number], s: 1.35, seed: 251, fruit: false },
    { p: [12, 0, -32] as [number, number, number], s: 1.4, seed: 252, fruit: false },
    { p: [-22.3, 0, -43.6] as [number, number, number], s: 1.3, seed: 253, fruit: false },
    { p: [16, 0, -42] as [number, number, number], s: 1.25, seed: 254, fruit: false },

    // 🍞 12. ABOUT ME FRONT FOREST GROVE (In Front of About Me [-22, 0])
    { p: [-18, 0, 5.4] as [number, number, number], s: 1.3, seed: 255, fruit: false },
    { p: [-26, 0, 10] as [number, number, number], s: 1.35, seed: 256, fruit: false },
    { p: [-7.4, 0, 13.7] as [number, number, number], s: 1.25, seed: 257, fruit: false },
    { p: [-25.9, 0, 10.3] as [number, number, number], s: 1.4, seed: 258, fruit: false },
    { p: [-10.4, 0, -15.9] as [number, number, number], s: 1.3, seed: 259, fruit: false },
    { p: [-34, 0, -15.8] as [number, number, number], s: 1.35, seed: 260, fruit: false },
    { p: [-35, 0, -16.4] as [number, number, number], s: 1.2, seed: 261, fruit: false },
    { p: [-28, 0, -3.5] as [number, number, number], s: 1.4, seed: 262, fruit: false },
    { p: [-7.4, 0, 13.2] as [number, number, number], s: 1.3, seed: 263, fruit: false },
    { p: [-22.4, 0, 8.7] as [number, number, number], s: 1.25, seed: 264, fruit: false },

    // 🏞️ 13. ALL OPEN LAND HIGH-DENSITY EXPANSION
    // South-West Open Land (South of Recreation Pond & North of River)
    { p: [-8, 0, 26.5] as [number, number, number], s: 1.3, seed: 265, fruit: false },
    { p: [-10, 0, 32] as [number, number, number], s: 1.25, seed: 266, fruit: false },
    { p: [-12, 0, 42] as [number, number, number], s: 1.35, seed: 267, fruit: false },
    { p: [-16.3, 0, 23.6] as [number, number, number], s: 1.4, seed: 268, fruit: false },
    { p: [-17.4, 0, 42.6] as [number, number, number], s: 1.2, seed: 269, fruit: false },
    { p: [-39.1, 0, 15.6] as [number, number, number], s: 1.35, seed: 270, fruit: false },
    { p: [-43, 0, 32] as [number, number, number], s: 1.3, seed: 271, fruit: false },
    { p: [-38.5, 0, 42] as [number, number, number], s: 1.25, seed: 272, fruit: false },
    { p: [-50.4, 0, 51.7] as [number, number, number], s: 1.4, seed: 273, fruit: false },
    { p: [-54, 0, 36] as [number, number, number], s: 1.3, seed: 274, fruit: false },
    { p: [-62, 0, 48] as [number, number, number], s: 1.35, seed: 275, fruit: false },
    { p: [-69.4, 0, 40] as [number, number, number], s: 1.2, seed: 276, fruit: false },

    // South-East Open Land (East of Highway & North of River)
    { p: [8, 0, 24] as [number, number, number], s: 1.35, seed: 277, fruit: false },
    { p: [10, 0, 32] as [number, number, number], s: 1.25, seed: 278, fruit: false },
    { p: [12, 0, 42] as [number, number, number], s: 1.3, seed: 279, fruit: false },
    { p: [18, 0, 28] as [number, number, number], s: 1.4, seed: 280, fruit: false },
    { p: [22, 0, 36] as [number, number, number], s: 1.2, seed: 281, fruit: false },
    { p: [24, 0, 48] as [number, number, number], s: 1.35, seed: 282, fruit: false },
    { p: [43.3, 0, 28.9] as [number, number, number], s: 1.3, seed: 283, fruit: false },
    { p: [54.6, 0, 44.3] as [number, number, number], s: 1.25, seed: 284, fruit: false },
    { p: [59.7, 0, 33.6] as [number, number, number], s: 1.4, seed: 285, fruit: false },
    { p: [64, 0, 48] as [number, number, number], s: 1.3, seed: 286, fruit: false },
    { p: [70, 0, 36] as [number, number, number], s: 1.35, seed: 287, fruit: false },

    // Central Village Meadow & Flanks
    { p: [-8, 0, 48] as [number, number, number], s: 1.25, seed: 288, fruit: false },
    { p: [8, 0, 48] as [number, number, number], s: 1.35, seed: 289, fruit: false },
    { p: [-12.9, 0, 1.6] as [number, number, number], s: 1.3, seed: 290, fruit: false },
    { p: [16.9, 0, 1.4] as [number, number, number], s: 1.2, seed: 291, fruit: false },
    { p: [-6.5, 0, -12.5] as [number, number, number], s: 1.4, seed: 292, fruit: false },
    { p: [6.2, 0, -8.8] as [number, number, number], s: 1.25, seed: 293, fruit: false },
    { p: [-8, 0, -48] as [number, number, number], s: 1.3, seed: 294, fruit: false },
    { p: [8, 0, -48] as [number, number, number], s: 1.35, seed: 295, fruit: false },
    { p: [-10.7, 0, -52.7] as [number, number, number], s: 1.2, seed: 296, fruit: false },
    { p: [15, 0, -52] as [number, number, number], s: 1.4, seed: 297, fruit: false },

    // Mid-North & North-East Open Land (Around North Pond & Wheat Field)
    { p: [-24, 0, -56] as [number, number, number], s: 1.3, seed: 298, fruit: false },
    { p: [-32, 0, -62] as [number, number, number], s: 1.35, seed: 299, fruit: false },
    { p: [-24.6, 0, -72.6] as [number, number, number], s: 1.25, seed: 300, fruit: false },
    { p: [-28, 0, -74] as [number, number, number], s: 1.4, seed: 301, fruit: false },
    { p: [-4, 0, -62] as [number, number, number], s: 1.2, seed: 302, fruit: false },
    { p: [4, 0, -62] as [number, number, number], s: 1.35, seed: 303, fruit: false },
    { p: [18, 0, -54] as [number, number, number], s: 1.3, seed: 304, fruit: false },
    { p: [19.5, 0, -70.5] as [number, number, number], s: 1.25, seed: 305, fruit: false },
    { p: [39.4, 0, -58.2] as [number, number, number], s: 1.4, seed: 306, fruit: false },
    { p: [42, 0, -72] as [number, number, number], s: 1.3, seed: 307, fruit: false },
    { p: [48, 0, -54] as [number, number, number], s: 1.35, seed: 308, fruit: false },

    // Far High Ridge Land (North-West & North-East)
    { p: [-42, 0, -64] as [number, number, number], s: 1.25, seed: 309, fruit: false },
    { p: [-50, 0, -70] as [number, number, number], s: 1.35, seed: 310, fruit: false },
    { p: [-66, 0, -72] as [number, number, number], s: 1.3, seed: 311, fruit: false },
    { p: [-81.2, 0, -57.2] as [number, number, number], s: 1.4, seed: 312, fruit: false },
    { p: [-87.6, 0, -69] as [number, number, number], s: 1.2, seed: 313, fruit: false },
    { p: [42, 0, -64] as [number, number, number], s: 1.3, seed: 314, fruit: false },
    { p: [50, 0, -70] as [number, number, number], s: 1.35, seed: 315, fruit: false },
    { p: [66, 0, -72] as [number, number, number], s: 1.25, seed: 316, fruit: false },
    { p: [77.7, 0, -59.3] as [number, number, number], s: 1.4, seed: 317, fruit: false },
    { p: [82, 0, -72] as [number, number, number], s: 1.3, seed: 318, fruit: false },

    // Far South River Bank Boundary Land (South of River Z: 64 to 82)
    { p: [-80, 0, 72] as [number, number, number], s: 1.35, seed: 319, fruit: false },
    { p: [-74, 0, 80] as [number, number, number], s: 1.25, seed: 320, fruit: false },
    { p: [-60, 0, 78] as [number, number, number], s: 1.4, seed: 321, fruit: false },
    { p: [-44, 0, 82] as [number, number, number], s: 1.3, seed: 322, fruit: false },
    { p: [-30, 0, 78] as [number, number, number], s: 1.2, seed: 323, fruit: false },
    { p: [-15, 0, 80] as [number, number, number], s: 1.35, seed: 324, fruit: false },
    { p: [15, 0, 80] as [number, number, number], s: 1.3, seed: 325, fruit: false },
    { p: [30, 0, 78] as [number, number, number], s: 1.25, seed: 326, fruit: false },
    { p: [44, 0, 82] as [number, number, number], s: 1.4, seed: 327, fruit: false },
    { p: [60, 0, 78] as [number, number, number], s: 1.3, seed: 328, fruit: false },
    { p: [74, 0, 80] as [number, number, number], s: 1.35, seed: 329, fruit: false },
    { p: [80, 0, 72] as [number, number, number], s: 1.2, seed: 330, fruit: false },

    // 🌾 14. SKILLS BARN RIGHT-SIDE FOREST GROVE (Right of Skills Barn [22, 0])
    { p: [28, 0, 2] as [number, number, number], s: 1.35, seed: 331, fruit: false },
    { p: [32.7, 0, -3.4] as [number, number, number], s: 1.25, seed: 332, fruit: false },
    { p: [36, 0, 5] as [number, number, number], s: 1.4, seed: 333, fruit: false },
    { p: [40, 0, -2] as [number, number, number], s: 1.3, seed: 334, fruit: false },
    { p: [44, 0, 8] as [number, number, number], s: 1.35, seed: 335, fruit: false },
    { p: [48, 0, -5] as [number, number, number], s: 1.2, seed: 336, fruit: false },
    { p: [52, 0, 4] as [number, number, number], s: 1.4, seed: 337, fruit: false },
    { p: [31.9, 0, 8.3] as [number, number, number], s: 1.25, seed: 338, fruit: false },
    { p: [39, 0, 12] as [number, number, number], s: 1.35, seed: 339, fruit: false },
    { p: [46, 0, 16] as [number, number, number], s: 1.3, seed: 340, fruit: false },
    { p: [24.7, 0, -14.7] as [number, number, number], s: 1.2, seed: 341, fruit: false },
    { p: [32.6, 0, -16.9] as [number, number, number], s: 1.4, seed: 342, fruit: false },
    { p: [40.6, 0, -19.1] as [number, number, number], s: 1.25, seed: 343, fruit: false },
    { p: [50.5, 0, -8.4] as [number, number, number], s: 1.35, seed: 344, fruit: false },
    { p: [54, 0, 12] as [number, number, number], s: 1.3, seed: 345, fruit: false },

    // 🏰 15. TOP-LEFT AND TOP-RIGHT CORNERS & PROJECTS BUILDING CORNERS
    // Top-Left Map Corner (Far North-West)
    { p: [-95, 0, -95] as [number, number, number], s: 1.4, seed: 346, fruit: false },
    { p: [-90, 0, -95] as [number, number, number], s: 1.3, seed: 347, fruit: false },
    { p: [-85, 0, -95] as [number, number, number], s: 1.35, seed: 348, fruit: false },
    { p: [-95, 0, -85] as [number, number, number], s: 1.25, seed: 349, fruit: false },
    { p: [-88, 0, -88] as [number, number, number], s: 1.4, seed: 350, fruit: false },
    { p: [-78, 0, -92] as [number, number, number], s: 1.3, seed: 351, fruit: false },
    { p: [-72, 0, -86] as [number, number, number], s: 1.35, seed: 352, fruit: false },
    { p: [-65, 0, -92] as [number, number, number], s: 1.2, seed: 353, fruit: false },
    { p: [-60, 0, -85] as [number, number, number], s: 1.4, seed: 354, fruit: false },
    { p: [-78.6, 0, -88] as [number, number, number], s: 1.25, seed: 355, fruit: false },
    { p: [-70, 0, -82] as [number, number, number], s: 1.35, seed: 356, fruit: false },
    { p: [-88, 0, -68] as [number, number, number], s: 1.3, seed: 357, fruit: false },
    { p: [-95, 0, -72] as [number, number, number], s: 1.4, seed: 358, fruit: false },
    { p: [-68, 0, -62] as [number, number, number], s: 1.25, seed: 359, fruit: false },
    { p: [-58, 0, -64] as [number, number, number], s: 1.3, seed: 360, fruit: false },

    // Top-Right Map Corner (Far North-East)
    { p: [95, 0, -95] as [number, number, number], s: 1.4, seed: 361, fruit: false },
    { p: [90, 0, -95] as [number, number, number], s: 1.3, seed: 362, fruit: false },
    { p: [85, 0, -95] as [number, number, number], s: 1.35, seed: 363, fruit: false },
    { p: [95, 0, -85] as [number, number, number], s: 1.25, seed: 364, fruit: false },
    { p: [88, 0, -88] as [number, number, number], s: 1.4, seed: 365, fruit: false },
    { p: [78, 0, -92] as [number, number, number], s: 1.3, seed: 366, fruit: false },
    { p: [72, 0, -86] as [number, number, number], s: 1.35, seed: 367, fruit: false },
    { p: [65, 0, -92] as [number, number, number], s: 1.2, seed: 368, fruit: false },
    { p: [60, 0, -85] as [number, number, number], s: 1.4, seed: 369, fruit: false },
    { p: [82, 0, -78] as [number, number, number], s: 1.25, seed: 370, fruit: false },
    { p: [73.4, 0, -76.3] as [number, number, number], s: 1.35, seed: 371, fruit: false },
    { p: [88, 0, -68] as [number, number, number], s: 1.3, seed: 372, fruit: false },
    { p: [95, 0, -72] as [number, number, number], s: 1.4, seed: 373, fruit: false },
    { p: [65.2, 0, -63.1] as [number, number, number], s: 1.25, seed: 374, fruit: false },
    { p: [58, 0, -64] as [number, number, number], s: 1.3, seed: 375, fruit: false },

    // Top-Left Corner of Projects Building [45, -20]
    { p: [32, 0, -28] as [number, number, number], s: 1.3, seed: 376, fruit: false },
    { p: [36, 0, -34] as [number, number, number], s: 1.35, seed: 377, fruit: false },
    { p: [28, 0, -38] as [number, number, number], s: 1.25, seed: 378, fruit: false },
    { p: [40, 0, -32] as [number, number, number], s: 1.4, seed: 379, fruit: false },
    { p: [34, 0, -42] as [number, number, number], s: 1.3, seed: 380, fruit: false },

    // Top-Right Corner of Projects Building [45, -20]
    { p: [61.3, 0, -23.9] as [number, number, number], s: 1.35, seed: 381, fruit: false },
    { p: [54.7, 0, -39] as [number, number, number], s: 1.25, seed: 382, fruit: false },
    { p: [62, 0, -24] as [number, number, number], s: 1.4, seed: 383, fruit: false },
    { p: [50, 0, -41.5] as [number, number, number], s: 1.3, seed: 384, fruit: false },
    { p: [56, 0, -42] as [number, number, number], s: 1.35, seed: 385, fruit: false },
    { p: [66.6, 0, -33.7] as [number, number, number], s: 1.2, seed: 386, fruit: false },
  ], []);

  return (
    <group>
      {/* 🌾 Wheat Field (Top-Center) */}
      <WheatField position={[-12, getTerrainHeight(-12, -58), -58]} />

      {/* 🐔 Chicken Coop (East) */}
      <ChickenCoop position={[44, getTerrainHeight(44, -32), -32]} />

      {/* 🛒 Cart & Storage (South-East) */}
      <CartAndStorage position={[22, getTerrainHeight(22, 52), 52]} />

      {/* Trees & Orchard (Archery Range zone cleared of trees) */}
      {trees
        .filter(t => !(t.p[0] >= 34 && t.p[0] <= 66 && t.p[2] <= -28 && t.p[2] >= -78))
        .map((t, idx) => (
          <OverhangingCanopyTree
            key={idx}
            position={[t.p[0], getTerrainHeight(t.p[0], t.p[2]), t.p[2]]}
            scale={t.s * 1.3}
            seed={t.seed}
            hasFruit={t.fruit}
          />
        ))}

      {/* 🍃 Dynamic Falling Leaves Particle System */}
      <FallingLeaves treePositions={trees.filter(t => !(t.p[0] >= 34 && t.p[0] <= 66 && t.p[2] <= -28 && t.p[2] >= -78))} />

      {/* Glowing Lamp Posts */}
      {lanternPosts.map((l, idx) => (
        <GlowingLanternPost key={idx} position={[l.p[0], getTerrainHeight(l.p[0], l.p[2]), l.p[2]]} rotationY={l.r} isNight={isNight} />
      ))}

      {/* ── SOUTH RIVER & SOUTH BRIDGE ── */}
      {/* Sparkling South River Water Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_SURFACE_Y, 58]} receiveShadow material={waterMat}>
        <planeGeometry args={[240, 16.0]} />
      </mesh>

      {/* South Wooden Bridge spanning cleanly across river onto solid land */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.44, 58]}>
        {/* Main Wooden Deck Planks (Length 18m overlapping land on both riverbanks) */}
        <mesh castShadow receiveShadow position={[0, 0, 0]} material={bridgePlankMat}>
          <boxGeometry args={[8.0, 0.08, 18.0]} />
        </mesh>
        <CuboidCollider args={[4.0, 0.04, 9.0]} position={[0, 0, 0]} />

        {/* Heavy Stone Abutment Foundations (Visual landing pads) */}
        <mesh castShadow receiveShadow position={[0, -0.20, -8.2]} material={rockMat}>
          <boxGeometry args={[8.4, 0.4, 1.6]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.20, 8.2]} material={rockMat}>
          <boxGeometry args={[8.4, 0.4, 1.6]} />
        </mesh>

        {/* Wooden Support Pillars extending down to riverbed */}
        <mesh position={[-3.4, -0.22, -4.0]} material={bridgeRailMat} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.45, 8]} />
        </mesh>
        <mesh position={[3.4, -0.22, -4.0]} material={bridgeRailMat} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.45, 8]} />
        </mesh>
        <mesh position={[-3.4, -0.22, 4.0]} material={bridgeRailMat} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.45, 8]} />
        </mesh>
        <mesh position={[3.4, -0.22, 4.0]} material={bridgeRailMat} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.45, 8]} />
        </mesh>

        {/* Handrails */}
        <mesh castShadow position={[-3.85, 0.38, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.3, 0.65, 18.0]} />
        </mesh>
        <CuboidCollider args={[0.15, 0.325, 9.0]} position={[-3.85, 0.38, 0]} />

        <mesh castShadow position={[3.85, 0.38, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.3, 0.65, 18.0]} />
        </mesh>
        <CuboidCollider args={[0.15, 0.325, 9.0]} position={[3.85, 0.38, 0]} />
      </RigidBody>
    </group>
  );
}



