import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getRoadX, getRoadAngle } from '../utils/roadPath';

// Module-level static materials
const benchWoodMat = new THREE.MeshToonMaterial({ color: 0x8b5a2b });
const benchMetalMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
const flowerBoxMat = new THREE.MeshToonMaterial({ color: 0x5c4033 });

const flowerColorMats: Record<number, THREE.MeshToonMaterial> = {};
function getFlowerMat(colorHex: number): THREE.MeshToonMaterial {
  if (!flowerColorMats[colorHex]) {
    flowerColorMats[colorHex] = new THREE.MeshToonMaterial({ color: colorHex });
  }
  return flowerColorMats[colorHex];
}

// Voxel Minecraft park bench
function Bench({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat slab */}
      <mesh castShadow position={[0, 0.38, 0]} material={benchWoodMat}>
        <boxGeometry args={[1.4, 0.08, 0.48]} />
      </mesh>
      {/* Backrest slab */}
      <mesh castShadow position={[0, 0.72, -0.2]} rotation={[0.1, 0, 0]} material={benchWoodMat}>
        <boxGeometry args={[1.4, 0.32, 0.08]} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.6, 0.2, 0]} material={benchMetalMat}>
        <boxGeometry args={[0.08, 0.4, 0.48]} />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} material={benchMetalMat}>
        <boxGeometry args={[0.08, 0.4, 0.48]} />
      </mesh>
    </group>
  );
}

export default function ShopsAndParks({ isNight }: { isNight: boolean }) {
  const flowerBeds = useMemo(() => {
    const list: { p: [number, number, number]; c: number }[] = [];
    const colors = [0xe63946, 0xffb703, 0x9b5de5, 0xff7096, 0x2a9d8f];

    [15, 5, -5, -15, -25, -35].forEach((z, idx) => {
      const rx = getRoadX(z);
      const angle = getRoadAngle(z);
      const perpX = Math.cos(angle);
      const perpZ = -Math.sin(angle);

      list.push({
        p: [rx - perpX * 3.3, 0.1, z - perpZ * 3.3],
        c: colors[idx % colors.length],
      });
      list.push({
        p: [rx + perpX * 3.3, 0.1, z + perpZ * 3.3],
        c: colors[(idx + 2) % colors.length],
      });
    });
    return list;
  }, []);

  const benches = useMemo(() => {
    const list: { p: [number, number, number]; rot: [number, number, number] }[] = [];

    [16, 4, -8, -18, -28, -38].forEach((z, idx) => {
      const rx = getRoadX(z);
      const angle = getRoadAngle(z);
      const perpX = Math.cos(angle);
      const perpZ = -Math.sin(angle);

      const side = idx % 2 === 0 ? -1 : 1;
      list.push({
        p: [rx + side * perpX * 3.3, 0, z + side * perpZ * 3.3],
        rot: [0, angle + (side === -1 ? Math.PI / 2 : -Math.PI / 2), 0],
      });
    });
    return list;
  }, []);

  return (
    <group>
      {/* Voxel Benches */}
      {benches.map((b, idx) => (
        <Bench key={idx} position={b.p} rotation={b.rot} />
      ))}

      {/* Voxel Flower Bed Boxes */}
      {flowerBeds.map((fb, idx) => (
        <group key={idx} position={fb.p}>
          <mesh castShadow receiveShadow material={flowerBoxMat}>
            <boxGeometry args={[1.2, 0.2, 0.8]} />
          </mesh>
          {[-0.35, 0, 0.35].map((x, fIdx) => (
            <mesh key={fIdx} position={[x, 0.15, 0]} castShadow material={getFlowerMat(fb.c)}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
