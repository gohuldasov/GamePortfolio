import React from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { oakLogTexture, oakPlankTexture, cobblestoneTexture, stoneBrickTexture, roofShingleTexture } from '../utils/minecraftTextures';
import { getTerrainHeight } from '../utils/terrain';

// Materials for Archery & Village Expansion
const woodMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.7, color: 0x8c5e34 });
const logMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8, color: 0x5c3a21 });
const stoneMat = new THREE.MeshStandardMaterial({ map: stoneBrickTexture, roughness: 0.75 });
const cobbleMat = new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.8 });
const roofRedMat = new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.6, color: 0xb83232 });
const roofBlueMat = new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.6, color: 0x2b5c8f });
const roofDarkMat = new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.6, color: 0x3d2b1f });
const wallWhiteMat = new THREE.MeshStandardMaterial({ map: stoneBrickTexture, roughness: 0.65, color: 0xf5f5f0 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

// Target Board Rings Materials
const targetStandMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8 });
const targetOuterMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }); // Blue Ring
const targetInnerMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }); // Red Ring
const targetCenterMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Yellow Bullseye
const targetBackingMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.8, color: 0xd4a373 }); // Straw/Wood Backing
const targetFrameMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, color: 0x3e2413, roughness: 0.7 });

// Awning Materials for Market Stalls
const awningRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
const awningYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
const awningGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

// 🎯 3D TARGET BOARD COMPONENT
export function TargetBoard({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wooden Legs Support */}
      <mesh castShadow position={[-0.6, 0.9, -0.1]} rotation={[0.2, 0, 0]} material={targetStandMat}>
        <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
      </mesh>
      <mesh castShadow position={[0.6, 0.9, -0.1]} rotation={[0.2, 0, 0]} material={targetStandMat}>
        <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
      </mesh>
      <mesh castShadow position={[0, 0.9, -0.35]} rotation={[-0.3, 0, 0]} material={targetStandMat}>
        <cylinderGeometry args={[0.07, 0.07, 2.1, 8]} />
      </mesh>

      {/* Target Backing Shield */}
      <group position={[0, 1.6, 0]}>
        {/* Octagonal Outer Wooden Frame */}
        <mesh castShadow receiveShadow material={targetFrameMat}>
          <cylinderGeometry args={[1.2, 1.2, 0.22, 16]} />
        </mesh>
        {/* Straw Backing Disc */}
        <mesh position={[0, 0, 0.05]} material={targetBackingMat}>
          <cylinderGeometry args={[1.08, 1.08, 0.16, 32]} />
        </mesh>
        {/* Ring 3: Blue Outer Ring (Radius: 0.9m) */}
        <mesh position={[0, 0, 0.12]} material={targetOuterMat}>
          <cylinderGeometry args={[0.9, 0.9, 0.04, 32]} />
        </mesh>
        {/* Ring 2: Red Inner Ring (Radius: 0.55m) */}
        <mesh position={[0, 0, 0.13]} material={targetInnerMat}>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
        </mesh>
        {/* Ring 1: Yellow Bullseye Center (Radius: 0.25m) */}
        <mesh position={[0, 0, 0.14]} material={targetCenterMat}>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        </mesh>
        {/* Center Spot */}
        <mesh position={[0, 0, 0.15]} material={targetInnerMat}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        </mesh>
      </group>
    </group>
  );
}

// 🏹 COMPLETE ARCHERY RANGE FIELD
export function ArcheryRangeField({ position }: { position: [number, number, number] }) {
  const y = position[1];
  return (
    <group position={position}>
      {/* Wooden Firing Line Deck Platform */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.1, 8.0]} material={woodMat}>
          <boxGeometry args={[10.0, 0.2, 3.5]} />
        </mesh>
        {/* Firing Line Wooden Railings */}
        <mesh castShadow position={[-4.8, 0.6, 8.0]} material={logMat}>
          <boxGeometry args={[0.2, 0.8, 3.5]} />
        </mesh>
        <mesh castShadow position={[4.8, 0.6, 8.0]} material={logMat}>
          <boxGeometry args={[0.2, 0.8, 3.5]} />
        </mesh>
        <mesh castShadow position={[0, 0.6, 9.6]} material={logMat}>
          <boxGeometry args={[9.8, 0.8, 0.2]} />
        </mesh>
      </RigidBody>

      {/* Target Stand Rack & Banners */}
      <group position={[0, 0, 8.0]}>
        {/* Bow Rack Stand */}
        <mesh castShadow position={[-3.5, 0.7, 0]} material={woodMat}>
          <boxGeometry args={[1.2, 1.0, 0.4]} />
        </mesh>
        {/* Quiver of Arrows Container */}
        <mesh castShadow position={[3.5, 0.6, 0]} material={logMat}>
          <cylinderGeometry args={[0.25, 0.2, 0.8, 8]} />
        </mesh>
        {/* Decorative Archery Target Banners */}
        {[-4.2, 4.2].map((x, idx) => (
          <group key={idx} position={[x, 2.2, -1.0]}>
            <mesh material={logMat} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 4.2, 8]} />
            </mesh>
            <mesh position={[0, 1.2, 0.4]} material={targetInnerMat}>
              <boxGeometry args={[0.1, 1.8, 0.8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 🎯 Target Boards set downrange at varying distances */}
      <TargetBoard position={[-3.2, getTerrainHeight(position[0] - 3.2, position[2] - 14) - y, -14.0]} />
      <TargetBoard position={[0, getTerrainHeight(position[0], position[2] - 18) - y, -18.0]} />
      <TargetBoard position={[3.2, getTerrainHeight(position[0] + 3.2, position[2] - 14) - y, -14.0]} />
      <TargetBoard position={[-1.6, getTerrainHeight(position[0] - 1.6, position[2] - 24) - y, -24.0]} />
      <TargetBoard position={[1.6, getTerrainHeight(position[0] + 1.6, position[2] - 24) - y, -24.0]} />

      {/* Earth Backing Embankment Barrier behind targets */}
      <mesh receiveShadow position={[0, 1.5, -28.0]} material={cobbleMat}>
        <boxGeometry args={[16.0, 3.0, 2.0]} />
      </mesh>
    </group>
  );
}

// 🏛️ TOWN HALL MANOR (Grand Village Landmark Building)
export function TownHall({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Stone Foundation Base */}
        <mesh castShadow receiveShadow position={[0, 1.2, 0]} material={stoneMat}>
          <boxGeometry args={[12.0, 2.4, 9.0]} />
        </mesh>
        {/* Main Manor Floor */}
        <mesh castShadow receiveShadow position={[0, 4.2, 0]} material={wallWhiteMat}>
          <boxGeometry args={[11.2, 3.6, 8.2]} />
        </mesh>
        {/* Grand Roof */}
        <mesh castShadow position={[0, 7.2, 0]} material={roofBlueMat}>
          <boxGeometry args={[11.8, 2.4, 8.8]} />
        </mesh>
        {/* Clock Tower / Bell Spire */}
        <group position={[0, 9.5, 0]}>
          <mesh castShadow material={wallWhiteMat}>
            <boxGeometry args={[3.2, 3.2, 3.2]} />
          </mesh>
          {/* Clock Face */}
          <mesh position={[0, 0, 1.62]} material={goldMat}>
            <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
          </mesh>
          <mesh castShadow position={[0, 3.0, 0]} material={roofBlueMat}>
            <coneGeometry args={[2.2, 2.8, 4]} />
          </mesh>
        </group>
        {/* Entrance Pillars */}
        {[-3.5, 3.5].map((x, i) => (
          <mesh key={i} castShadow position={[x, 2.8, 4.8]} material={stoneMat}>
            <cylinderGeometry args={[0.35, 0.4, 3.2, 8]} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

// 🍞 VILLAGE BAKERY & TAVERN
export function BakeryTavern({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Main Building Base */}
        <mesh castShadow receiveShadow position={[0, 2.0, 0]} material={wallWhiteMat}>
          <boxGeometry args={[8.0, 4.0, 6.5]} />
        </mesh>
        {/* Cozy Red Shingle Gabled Roof */}
        <mesh castShadow position={[0, 5.0, 0]} material={roofRedMat}>
          <boxGeometry args={[8.6, 2.0, 7.1]} />
        </mesh>
        {/* Stone Chimney with Chimney Cap */}
        <group position={[2.8, 4.5, 1.5]}>
          <mesh castShadow material={cobbleMat}>
            <boxGeometry args={[1.0, 4.0, 1.0]} />
          </mesh>
        </group>
        {/* Outdoor Tavern Picnic Tables */}
        {[-4.8, 4.8].map((x, i) => (
          <group key={i} position={[x, 0.4, 0]}>
            <mesh castShadow material={woodMat}>
              <boxGeometry args={[1.4, 0.8, 2.2]} />
            </mesh>
          </group>
        ))}
      </group>
    </RigidBody>
  );
}

// 🌿 HERBALIST COTTAGE
export function HerbalistCottage({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Timber Log Cabin Base */}
        <mesh castShadow receiveShadow position={[0, 1.8, 0]} material={logMat}>
          <boxGeometry args={[6.5, 3.6, 5.5]} />
        </mesh>
        {/* Thatched Dark Roof */}
        <mesh castShadow position={[0, 4.2, 0]} material={roofDarkMat}>
          <coneGeometry args={[4.8, 2.2, 4]} />
        </mesh>
        {/* Herb Garden Fence Box */}
        <mesh castShadow position={[0, 0.3, 3.5]} material={woodMat}>
          <boxGeometry args={[4.5, 0.6, 1.2]} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// 🛒 VILLAGE MARKETPLACE STALLS
export function MarketplaceStalls({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const stalls = [
    { x: -3.2, mat: awningRedMat },
    { x: 0, mat: awningYellowMat },
    { x: 3.2, mat: awningGreenMat },
  ];

  return (
    <group position={position} rotation={rotation}>
      {stalls.map((s, i) => (
        <group key={i} position={[s.x, 0, 0]}>
          {/* Wooden Counter Table */}
          <mesh castShadow receiveShadow position={[0, 0.6, 0]} material={woodMat}>
            <boxGeometry args={[2.4, 1.2, 1.4]} />
          </mesh>
          {/* Support Corner Posts */}
          {[-1.0, 1.0].map((px, idx) => (
            <mesh key={idx} position={[px, 1.6, 0.5]} material={logMat}>
              <cylinderGeometry args={[0.06, 0.06, 2.0, 6]} />
            </mesh>
          ))}
          {/* Colorful Striped Canopy Awning */}
          <mesh castShadow position={[0, 2.4, 0]} material={s.mat}>
            <boxGeometry args={[2.6, 0.3, 1.8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function VillageExpansion() {
  return (
    <group>
      {/* 🎯 Archery Range Field (Located East of House 2 Education at X: 18, Z: -44) */}
      <ArcheryRangeField position={[18, getTerrainHeight(18, -44), -44]} />

      {/* 🏛️ Town Hall Manor (North-West Central near Road Junction) */}
      <TownHall position={[-18, getTerrainHeight(-18, -25), -25]} rotation={[0, Math.PI / 6, 0]} />

      {/* 🍞 Bakery & Tavern (South-East near Orchard) */}
      <BakeryTavern position={[28, getTerrainHeight(28, 35), 35]} rotation={[0, -Math.PI / 4, 0]} />

      {/* 🌿 Herbalist Cottage (South-West near River & Bridge) */}
      <HerbalistCottage position={[-24, getTerrainHeight(-24, 42), 42]} rotation={[0, Math.PI / 3, 0]} />

      {/* 🛒 Marketplace Stalls (Plaza Clearing near Center Well) */}
      <MarketplaceStalls position={[-4, getTerrainHeight(-4, 12), 12]} rotation={[0, 0, 0]} />
    </group>
  );
}
