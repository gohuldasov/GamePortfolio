import React from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Html } from '@react-three/drei';
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

// Target Board Rings Materials (Vibrant, high contrast colors visible from distance)
const targetStandMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8 });
const targetOuterMat = new THREE.MeshToonMaterial({ color: 0x2563eb, side: THREE.DoubleSide }); // Bright Royal Blue Ring
const targetInnerMat = new THREE.MeshToonMaterial({ color: 0xef4444, side: THREE.DoubleSide }); // Bright Red Ring
const targetCenterMat = new THREE.MeshToonMaterial({ color: 0xfacc15, side: THREE.DoubleSide }); // Bright Sunburst Yellow Bullseye
const targetWhiteMat = new THREE.MeshToonMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // White Border Ring
const targetBlackMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }); // Center Spot
const targetBackingMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.8, color: 0xfef08a }); // Light Straw Backing
const targetFrameMat = new THREE.MeshStandardMaterial({ map: oakLogTexture, color: 0x3e2413, roughness: 0.7 });

// Awning Materials for Market Stalls
const awningRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
const awningYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
const awningGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

// 🎯 3D TARGET BOARD COMPONENT
export function TargetBoard({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
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

        {/* Upright Target Board Shield facing Player (+Z) */}
        <group position={[0, 1.6, 0]}>
          {/* Octagonal Outer Wooden Backing Frame */}
          <mesh castShadow receiveShadow material={targetFrameMat} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.25, 1.25, 0.18, 16]} />
          </mesh>

          {/* Straw Backing Face Disc */}
          <mesh position={[0, 0, 0.10]} rotation={[Math.PI / 2, 0, 0]} material={targetBackingMat}>
            <cylinderGeometry args={[1.15, 1.15, 0.04, 32]} />
          </mesh>

          {/* Ring 3: Bright White & Blue Outer Ring (Radius: 0.9m) */}
          <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={targetWhiteMat}>
            <cylinderGeometry args={[0.92, 0.92, 0.02, 32]} />
          </mesh>
          <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={targetOuterMat}>
            <cylinderGeometry args={[0.85, 0.85, 0.02, 32]} />
          </mesh>

          {/* Ring 2: Bright Red Inner Ring (Radius: 0.55m) */}
          <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={targetWhiteMat}>
            <cylinderGeometry args={[0.57, 0.57, 0.02, 32]} />
          </mesh>
          <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]} material={targetInnerMat}>
            <cylinderGeometry args={[0.52, 0.52, 0.02, 32]} />
          </mesh>

          {/* Ring 1: Bright Yellow Bullseye Center (Radius: 0.25m) */}
          <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={targetCenterMat}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
          </mesh>

          {/* Center Black Spot */}
          <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} material={targetBlackMat}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}

// 🏹 COMPLETE DEDICATED ARCHERY RANGE & TRAINING ARENA
export function ArcheryRangeField({ position }: { position: [number, number, number] }) {
  const y = position[1];
  return (
    <group position={position}>
      {/* ⛩️ Grand Entrance Wooden Archway & 3D Signboard (Entrance facing path at Z: +10.2) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0, 10.2]}>
        <group>
          {/* Stone Plinth Foundation Bases */}
          <mesh castShadow receiveShadow position={[-4.5, 0.4, 0]} material={stoneMat}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
          </mesh>
          <mesh castShadow receiveShadow position={[4.5, 0.4, 0]} material={stoneMat}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
          </mesh>

          {/* Heavy Timber Pillar Posts */}
          <mesh castShadow position={[-4.5, 2.6, 0]} material={logMat}>
            <cylinderGeometry args={[0.26, 0.32, 4.4, 8]} />
          </mesh>
          <mesh castShadow position={[4.5, 2.6, 0]} material={logMat}>
            <cylinderGeometry args={[0.26, 0.32, 4.4, 8]} />
          </mesh>

          {/* Double Upper Crossbeams */}
          <mesh castShadow position={[0, 4.6, 0]} material={logMat}>
            <boxGeometry args={[9.8, 0.38, 0.38]} />
          </mesh>
          <mesh castShadow position={[0, 4.0, 0]} material={woodMat}>
            <boxGeometry args={[9.4, 0.2, 0.25]} />
          </mesh>

          {/* Gabled Roof Canopy over Arch */}
          <mesh castShadow position={[0, 5.0, 0]} material={roofRedMat}>
            <boxGeometry args={[10.2, 0.25, 1.2]} />
          </mesh>

          {/* Archway Angle Corner Struts */}
          <mesh castShadow position={[-3.8, 4.2, 0]} rotation={[0, 0, -Math.PI / 4]} material={logMat}>
            <boxGeometry args={[1.2, 0.2, 0.2]} />
          </mesh>
          <mesh castShadow position={[3.8, 4.2, 0]} rotation={[0, 0, Math.PI / 4]} material={logMat}>
            <boxGeometry args={[1.2, 0.2, 0.2]} />
          </mesh>

          {/* Entrance Lanterns */}
          {[-4.5, 4.5].map((lx, li) => (
            <group key={li} position={[lx, 3.2, 0.3]}>
              <mesh material={logMat} castShadow>
                <boxGeometry args={[0.15, 0.35, 0.15]} />
              </mesh>
              <pointLight color={0xffaa00} intensity={1.2} distance={6} position={[0, 0, 0.1]} />
            </group>
          ))}

          {/* Decorative Archery Target Banners at Entrance */}
          {[-5.1, 5.1].map((bx, bi) => (
            <group key={bi} position={[bx, 2.2, 0]}>
              <mesh material={targetInnerMat} castShadow>
                <boxGeometry args={[0.6, 1.8, 0.08]} />
              </mesh>
              <mesh position={[0, 0, 0.05]} material={targetCenterMat}>
                <circleGeometry args={[0.2, 12]} />
              </mesh>
            </group>
          ))}

          {/* Wooden Signboard Backing Plate */}
          <mesh castShadow position={[0, 4.0, 0.2]} material={woodMat}>
            <boxGeometry args={[5.8, 0.95, 0.14]} />
          </mesh>

          {/* 3D Interactive Signboard Badge facing path */}
          <Html position={[0, 4.0, 0.3]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">🎯</span>
              <span className="sign-text">ARCHERY RANGE</span>
            </div>
          </Html>
        </group>
      </RigidBody>

      {/* 🪨 Stone Pathway Pavers connecting driveway to firing line deck */}
      {Array.from({ length: 6 }).map((_, pi) => {
        const pz = 10.0 - pi * 0.45;
        return (
          <mesh key={`path-paver-${pi}`} receiveShadow position={[0, 0.04, pz]} material={cobbleMat}>
            <boxGeometry args={[2.4, 0.06, 0.35]} />
          </mesh>
        );
      })}

      {/* 🪵 Spectator Bleachers & Viewing Benches */}
      {[-6.2, 6.2].map((x, i) => (
        <RigidBody key={`bleacher-${i}`} type="fixed" colliders="cuboid" position={[x, 0.4, 8.0]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <group>
            <mesh castShadow material={woodMat}>
              <boxGeometry args={[3.2, 0.12, 0.6]} />
            </mesh>
            {[-1.2, 1.2].map((bx, idx) => (
              <mesh key={idx} position={[bx, -0.2, 0]} material={logMat}>
                <cylinderGeometry args={[0.1, 0.1, 0.4, 6]} />
              </mesh>
            ))}
          </group>
        </RigidBody>
      ))}

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
        {/* Straw Target Practice Bales */}
        <mesh castShadow position={[-2.2, 0.4, -0.5]} material={targetBackingMat}>
          <boxGeometry args={[1.2, 0.8, 0.8]} />
        </mesh>
        <mesh castShadow position={[2.2, 0.4, -0.5]} material={targetBackingMat}>
          <boxGeometry args={[1.2, 0.8, 0.8]} />
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

      {/* Side Safety Perimeter Fence Enclosure */}
      {Array.from({ length: 7 }).map((_, i) => {
        const fz = 6.0 - i * 5.0;
        return (
          <RigidBody key={`range-fence-${i}`} type="fixed" colliders="cuboid">
            <group>
              <mesh castShadow position={[-5.8, 0.7, fz]} material={logMat}>
                <boxGeometry args={[0.12, 1.4, 0.12]} />
              </mesh>
              <mesh castShadow position={[-5.8, 0.9, fz - 2.5]} material={woodMat}>
                <boxGeometry args={[0.08, 0.1, 5.0]} />
              </mesh>
              <mesh castShadow position={[5.8, 0.7, fz]} material={logMat}>
                <boxGeometry args={[0.12, 1.4, 0.12]} />
              </mesh>
              <mesh castShadow position={[5.8, 0.9, fz - 2.5]} material={woodMat}>
                <boxGeometry args={[0.08, 0.1, 5.0]} />
              </mesh>
            </group>
          </RigidBody>
        );
      })}

      {/* Earth Backing Embankment Barrier behind targets */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, -28.0]}>
        <mesh receiveShadow material={cobbleMat}>
          <boxGeometry args={[16.0, 3.0, 2.0]} />
        </mesh>
      </RigidBody>
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
        {/* Entrance Pillars & Grand Entrance Door */}
        {[-3.5, 3.5].map((x, i) => (
          <mesh key={i} castShadow position={[x, 2.8, 4.8]} material={stoneMat}>
            <cylinderGeometry args={[0.35, 0.4, 3.2, 8]} />
          </mesh>
        ))}
        {/* Double Entrance Doors */}
        <mesh position={[0, 2.0, 4.2]} material={woodMat} castShadow>
          <boxGeometry args={[2.0, 3.2, 0.12]} />
        </mesh>
        {/* Signboard */}
        <group position={[0, 4.4, 4.25]}>
          <mesh material={logMat} castShadow>
            <boxGeometry args={[3.6, 0.65, 0.1]} />
          </mesh>
          <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">🏛️</span>
              <span className="sign-text">TOWN HALL</span>
            </div>
          </Html>
        </group>
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
        {/* Entrance Door facing path */}
        <mesh position={[0, 1.4, 3.3]} material={woodMat} castShadow>
          <boxGeometry args={[1.4, 2.4, 0.12]} />
        </mesh>
        {/* Signboard */}
        <group position={[0, 3.2, 3.35]}>
          <mesh material={logMat} castShadow>
            <boxGeometry args={[3.4, 0.6, 0.1]} />
          </mesh>
          <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">🍞</span>
              <span className="sign-text">BAKERY & TAVERN</span>
            </div>
          </Html>
        </group>
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
      {/* 🎯 Dedicated Archery Range Arena & Sports Field (Secluded East Sector at X: 50, Z: -45) */}
      <ArcheryRangeField position={[50, getTerrainHeight(50, -45), -45]} />

      {/* 🍞 Bakery & Tavern (South-East Riverside at X: 48, Z: 45 facing North towards path [50, 25]) */}
      <BakeryTavern position={[48, getTerrainHeight(48, 45), 45]} rotation={[0, Math.atan2(2, -20), 0]} />
    </group>
  );
}
