import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getRoadX, getRoadAngle, getRoadPerp } from '../utils/roadPath';
import { cobblestoneTexture, oakLogTexture, oakPlankTexture, grassTopTexture } from '../utils/minecraftTextures';

// Static materials using procedural pixel-art Minecraft textures
const grassTopMat = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0xffffff });
const dirtMat = new THREE.MeshToonMaterial({ color: 0x866043 });
const stoneMat = new THREE.MeshToonMaterial({ map: cobblestoneTexture, color: 0xffffff });
const cobbleRoadMat = new THREE.MeshToonMaterial({ map: cobblestoneTexture, color: 0xffffff });
const darkStoneMat = new THREE.MeshToonMaterial({ color: 0x4a4a4a });
const woodLogMat = new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0xffffff });
const oakPlankMat = new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xffffff });
const fenceMat = new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xffffff });
const snowMat = new THREE.MeshToonMaterial({ color: 0xf0f4f8 });

// Torch Flame Material
const torchFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const torchStickMat = new THREE.MeshToonMaterial({ color: 0x5c4033 });

// Flower Materials
const poppyMat = new THREE.MeshToonMaterial({ color: 0xeb3b5a });
const dandelionMat = new THREE.MeshToonMaterial({ color: 0xf7b731 });
const daisyMat = new THREE.MeshToonMaterial({ color: 0xffffff });
const flowerCenterMat = new THREE.MeshToonMaterial({ color: 0xf7b731 });
const stemMat = new THREE.MeshToonMaterial({ color: 0x20bf6b });

// Minecraft Torch Component
function Torch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stick */}
      <mesh position={[0, 0.18, 0]} material={torchStickMat}>
        <boxGeometry args={[0.08, 0.35, 0.08]} />
      </mesh>
      {/* Flame Block */}
      <mesh position={[0, 0.38, 0]} material={torchFlameMat}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
    </group>
  );
}

// Minecraft Flower Group (Poppies, Dandelions, Daisies)
function VoxelFlowerCluster({ position }: { position: [number, number, number] }) {
  const flowers = useMemo(() => [
    { offset: [-0.3, 0, -0.2], type: 'poppy' },
    { offset: [0.2, 0, 0.3], type: 'dandelion' },
    { offset: [-0.1, 0, 0.4], type: 'daisy' },
    { offset: [0.4, 0, -0.1], type: 'poppy' },
    { offset: [-0.4, 0, 0.1], type: 'dandelion' },
  ], []);

  return (
    <group position={position}>
      {flowers.map((f, i) => (
        <group key={i} position={f.offset as [number, number, number]}>
          {/* Stem */}
          <mesh position={[0, 0.15, 0]} material={stemMat}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
          </mesh>
          {/* Flower Head */}
          {f.type === 'poppy' && (
            <mesh position={[0, 0.32, 0]} material={poppyMat}>
              <boxGeometry args={[0.18, 0.14, 0.18]} />
            </mesh>
          )}
          {f.type === 'dandelion' && (
            <mesh position={[0, 0.32, 0]} material={dandelionMat}>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
            </mesh>
          )}
          {f.type === 'daisy' && (
            <group position={[0, 0.32, 0]}>
              <mesh material={daisyMat}>
                <boxGeometry args={[0.2, 0.06, 0.2]} />
              </mesh>
              <mesh position={[0, 0.04, 0]} material={flowerCenterMat}>
                <boxGeometry args={[0.08, 0.06, 0.08]} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

export default function World() {
  const mountains = useMemo(() => [
    { x: -50, z: -30, r: 16, h: 28 },
    { x: -65, z: -10, r: 14, h: 22 },
    { x: -40, z: -60, r: 18, h: 32 },
    { x: 50, z: -30, r: 16, h: 26 },
    { x: 65, z: -10, r: 12, h: 20 },
    { x: 45, z: -60, r: 18, h: 30 },
    { x: 0, z: -80, r: 22, h: 36 },
  ], []);

  const { roadElements, fenceElements, flowerElements } = useMemo(() => {
    const road: React.ReactNode[] = [];
    const fences: React.ReactNode[] = [];
    const flowers: React.ReactNode[] = [];
    const step = 1.2;

    for (let z = 28; z >= -52; z -= step) {
      const rx = getRoadX(z);
      const angle = getRoadAngle(z);
      const [nx, nz] = getRoadPerp(z);

      // Main Cobblestone Road
      road.push(
        <mesh
          key={`cobble-road-${z}`}
          position={[rx, 0.04, z]}
          rotation={[0, angle, 0]}
          receiveShadow
          material={cobbleRoadMat}
        >
          <boxGeometry args={[4.2, 0.08, 1.3]} />
        </mesh>
      );

      // Left & Right Stone Curbs
      road.push(
        <mesh
          key={`curb-l-${z}`}
          position={[rx - nx * 2.25, 0.06, z - nz * 2.25]}
          rotation={[0, angle, 0]}
          receiveShadow
          material={darkStoneMat}
        >
          <boxGeometry args={[0.3, 0.12, 1.25]} />
        </mesh>
      );
      road.push(
        <mesh
          key={`curb-r-${z}`}
          position={[rx + nx * 2.25, 0.06, z + nz * 2.25]}
          rotation={[0, angle, 0]}
          receiveShadow
          material={darkStoneMat}
        >
          <boxGeometry args={[0.3, 0.12, 1.25]} />
        </mesh>
      );

      // Wooden Fences along right side (like in reference image!)
      if (Math.abs(z % 3.6) < 1.0) {
        const fenceX = rx + nx * 2.8;
        const fenceZ = z + nz * 2.8;
        const hasTorch = Math.abs(z % 7.2) < 1.0;

        fences.push(
          <group key={`fence-${z}`} position={[fenceX, 0.06, fenceZ]} rotation={[0, angle, 0]}>
            {/* Post */}
            <mesh position={[0, 0.45, 0]} material={fenceMat} castShadow>
              <boxGeometry args={[0.16, 0.9, 0.16]} />
            </mesh>
            {/* Cross Rails */}
            <mesh position={[0, 0.3, 0.6]} material={fenceMat}>
              <boxGeometry args={[0.08, 0.1, 1.2]} />
            </mesh>
            <mesh position={[0, 0.65, 0.6]} material={fenceMat}>
              <boxGeometry args={[0.08, 0.1, 1.2]} />
            </mesh>
            {/* Mounted Torch on Post */}
            {hasTorch && <Torch position={[0, 0.9, 0]} />}
          </group>
        );
      }

      // Flower Clusters along left side (Poppies, Dandelions, Daisies)
      if (Math.abs(z % 4.8) < 1.0) {
        flowers.push(
          <VoxelFlowerCluster
            key={`flowers-${z}`}
            position={[rx - nx * 3.0, 0.05, z - nz * 3.0]}
          />
        );
      }
    }

    return { roadElements: road, fenceElements: fences, flowerElements: flowers };
  }, []);

  const endGateX = getRoadX(-52);

  return (
    <group>
      {/* 1. Minecraft Grass & Dirt Ground Base */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={grassTopMat}>
          <planeGeometry args={[300, 300]} />
        </mesh>

        <mesh position={[0, -0.6, 0]} material={dirtMat}>
          <boxGeometry args={[300, 1.2, 300]} />
        </mesh>

        <mesh position={[0, -0.5, 0]} visible={false}>
          <boxGeometry args={[300, 1, 300]} />
        </mesh>
      </RigidBody>

      {/* 2. Minecraft Voxel Stepped Mountains */}
      {mountains.map((m, idx) => (
        <group key={idx} position={[m.x, 0, m.z]}>
          <mesh position={[0, m.h * 0.15, 0]} material={dirtMat} castShadow receiveShadow>
            <boxGeometry args={[m.r * 1.5, m.h * 0.3, m.r * 1.5]} />
          </mesh>
          <mesh position={[0, m.h * 0.45, 0]} material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[m.r * 1.0, m.h * 0.3, m.r * 1.0]} />
          </mesh>
          <mesh position={[0, m.h * 0.75, 0]} material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[m.r * 0.6, m.h * 0.3, m.r * 0.6]} />
          </mesh>
          <mesh position={[0, m.h - m.h * 0.05, 0]} material={snowMat} castShadow receiveShadow>
            <boxGeometry args={[m.r * 0.35, m.h * 0.1, m.r * 0.35]} />
          </mesh>
        </group>
      ))}

      {/* 3. Cobblestone Path, Fences & Flowers */}
      <group>{roadElements}</group>
      <group>{fenceElements}</group>
      <group>{flowerElements}</group>

      {/* 4. Minecraft Stone & Wood Gate at Road End */}
      <group position={[endGateX, 0, -52]}>
        <mesh position={[-3.2, 2.5, 0]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[1.0, 5.0, 1.0]} />
        </mesh>
        <mesh position={[3.2, 2.5, 0]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[1.0, 5.0, 1.0]} />
        </mesh>
        <mesh position={[0, 5.3, 0]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.9, 1.0]} />
        </mesh>
        <mesh position={[0, 2.15, -0.3]} material={cobbleRoadMat} castShadow receiveShadow>
          <boxGeometry args={[7.4, 4.3, 0.4]} />
        </mesh>
        <mesh position={[0, 4.2, 0.3]} material={woodLogMat} castShadow>
          <boxGeometry args={[5.4, 0.3, 0.3]} />
        </mesh>
      </group>

      {/* 5. Physical Boundaries */}
      <RigidBody type="fixed">
        <mesh position={[0, 1.5, 29.5]} visible={false}>
          <boxGeometry args={[30.0, 3.0, 0.4]} />
        </mesh>
        <mesh position={[endGateX, 1.5, -53.5]} visible={false}>
          <boxGeometry args={[30.0, 3.0, 0.4]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
