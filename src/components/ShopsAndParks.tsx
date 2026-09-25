import React from 'react';
import * as THREE from 'three';
import { oakPlankTexture, stoneBrickTexture, cobblestoneTexture } from '../utils/minecraftTextures';
import { getTerrainHeight, WATER_SURFACE_Y } from '../utils/terrain';

const benchWoodMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.7, color: 0xc49a6c });
const benchMetalMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.5 });
const stoneMat = new THREE.MeshStandardMaterial({ map: stoneBrickTexture, roughness: 0.8, color: 0x6e6055 });
const cobbleMat = new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.8, color: 0x7c7c82 });
const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
const woodPoleMat = new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.8 });

// Voxel Minecraft park bench
function Bench({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.38, 0]} material={benchWoodMat}>
        <boxGeometry args={[1.4, 0.08, 0.48]} />
      </mesh>
      <mesh castShadow position={[0, 0.72, -0.2]} rotation={[0.1, 0, 0]} material={benchWoodMat}>
        <boxGeometry args={[1.4, 0.32, 0.08]} />
      </mesh>
      <mesh position={[-0.6, 0.2, 0]} material={benchMetalMat}>
        <boxGeometry args={[0.08, 0.4, 0.48]} />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} material={benchMetalMat}>
        <boxGeometry args={[0.08, 0.4, 0.48]} />
      </mesh>
    </group>
  );
}

// 🚰 CENTER WELL COMPONENT (Center of Blueprint)
function CenterWell({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Circular Stone Wall Basin */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]} material={stoneMat}>
        <cylinderGeometry args={[1.8, 2.0, 1.2, 16]} />
      </mesh>
      {/* Water Inside Basin */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 16]} />
        <meshStandardMaterial color={0x2b7da8} roughness={0.1} />
      </mesh>
      {/* Wooden Support Posts */}
      {[-1.3, 1.3].map((x, idx) => (
        <mesh key={idx} position={[x, 1.8, 0]} material={woodPoleMat} castShadow>
          <boxGeometry args={[0.22, 2.4, 0.22]} />
        </mesh>
      ))}
      {/* Cross Beam & Pulley */}
      <mesh position={[0, 2.9, 0]} material={woodPoleMat} castShadow>
        <boxGeometry args={[2.8, 0.2, 0.2]} />
      </mesh>
      {/* Wooden Roof Canopy */}
      <mesh position={[0, 3.4, 0]} material={benchWoodMat} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.2, 1.0, 4]} />
      </mesh>
    </group>
  );
}

// 🏖️ RECREATION POND DOCK & UMBRELLA (South Center of Blueprint)
function RecreationPondDeck({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wooden Dock Platform extending into Pond */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]} material={benchWoodMat}>
        <boxGeometry args={[3.2, 0.16, 2.4]} />
      </mesh>
      {/* Deck Pilings */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, -0.4, 1.0]} material={woodPoleMat} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.0, 8]} />
        </mesh>
      ))}
      {/* Sun Umbrella */}
      <group position={[0.8, 0.1, 0]}>
        <mesh position={[0, 1.4, 0]} material={woodPoleMat} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.8, 8]} />
        </mesh>
        <mesh position={[0, 2.6, 0]} material={umbrellaMat} castShadow>
          <coneGeometry args={[1.5, 0.6, 8]} />
        </mesh>
      </group>
    </group>
  );
}

export default function ShopsAndParks({ isNight }: { isNight: boolean }) {
  return (
    <group>
      {/* 🚰 Center Well Plaza Centerpiece (X:0, Z:0) */}
      <CenterWell position={[0, getTerrainHeight(0, 0), 0]} />

      {/* Plaza Park Benches */}
      <Bench position={[-3.2, getTerrainHeight(-3.2, 0), 0]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[3.2, getTerrainHeight(3.2, 0), 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Bench position={[0, getTerrainHeight(0, -3.2), -3.2]} rotation={[0, 0, 0]} />

      {/* 🏖️ Recreation Pond Deck & Umbrella */}
      <RecreationPondDeck position={[-8, WATER_SURFACE_Y, 21.0]} />
    </group>
  );
}


