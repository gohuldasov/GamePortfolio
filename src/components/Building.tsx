import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { getRoadX, getRoadAngle, getRoadPerp } from '../utils/roadPath';
import { cobblestoneTexture, oakLogTexture, oakPlankTexture } from '../utils/minecraftTextures';

interface BuildingProps {
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isOpen: boolean;
  isNight: boolean;
  type: 'cottage' | 'castle' | 'dome' | 'gearhouse' | 'school' | 'ai-lab' | 'library';
}

// Authentic Minecraft Village House Materials
const materials = {
  log: new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0xffffff }),
  plank: new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xffffff }),
  cobble: new THREE.MeshToonMaterial({ map: cobblestoneTexture, color: 0xffffff }),
  roofDark: new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xa06a38 }),
  woodDark: new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0x6a4020 }),
  stone: new THREE.MeshToonMaterial({ map: cobblestoneTexture, color: 0xd0d0d0 }),
  door: new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xd49b5c }),
  knob: new THREE.MeshToonMaterial({ color: 0x4a3015 }),
  glassLit: new THREE.MeshBasicMaterial({ color: 0xffe699 }),
  glassUnlit: new THREE.MeshToonMaterial({ color: 0x99ccff }),
  cyanGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  torchFlame: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
  torchStick: new THREE.MeshToonMaterial({ color: 0x5c4033 }),
};

// Torch mounted on wall or post
function WallTorch({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.15, 0]} material={materials.torchStick}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
      </mesh>
      <mesh position={[0, 0.32, 0]} material={materials.torchFlame}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
    </group>
  );
}

function SingleBuilding({ position, rotation = [0, 0, 0], isOpen, isNight, type }: BuildingProps) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const targetLeftAngle = isOpen ? Math.PI / 1.8 : 0;
    const targetRightAngle = isOpen ? -Math.PI / 1.8 : 0;

    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, targetLeftAngle, delta * 8);
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetRightAngle, delta * 8);
    }
    if (gearRef.current) {
      gearRef.current.rotation.z += delta * 1.5;
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.y += delta * 2.0;
    }
  });

  const winGlassMat = isNight ? materials.glassLit : materials.glassUnlit;

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Base Cobblestone & Oak Log Village House Structure */}
        {/* Lower Cobblestone Walls */}
        <mesh castShadow receiveShadow position={[0, 1.2, 0]} material={materials.cobble}>
          <boxGeometry args={[4.2, 2.4, 3.4]} />
        </mesh>

        {/* Upper Oak Plank Walls */}
        <mesh castShadow receiveShadow position={[0, 2.8, 0]} material={materials.plank}>
          <boxGeometry args={[4.0, 1.0, 3.2]} />
        </mesh>

        {/* 4 Corner Oak Log Pillars */}
        {[
          [-2.05, 1.8, -1.65],
          [2.05, 1.8, -1.65],
          [-2.05, 1.8, 1.65],
          [2.05, 1.8, 1.65],
        ].map((p, idx) => (
          <mesh key={idx} position={p as [number, number, number]} material={materials.log} castShadow>
            <boxGeometry args={[0.5, 3.6, 0.5]} />
          </mesh>
        ))}

        {/* Sloped Wooden Roof with Overhangs */}
        <group position={[0, 3.3, 0]}>
          <mesh castShadow position={[0, 0.2, 0]} material={materials.roofDark}>
            <boxGeometry args={[4.8, 0.4, 4.0]} />
          </mesh>
          <mesh castShadow position={[0, 0.6, 0]} material={materials.roofDark}>
            <boxGeometry args={[3.8, 0.4, 3.2]} />
          </mesh>
          <mesh castShadow position={[0, 1.0, 0]} material={materials.roofDark}>
            <boxGeometry args={[2.6, 0.4, 2.2]} />
          </mesh>
          <mesh castShadow position={[0, 1.4, 0]} material={materials.roofDark}>
            <boxGeometry args={[1.2, 0.4, 1.0]} />
          </mesh>
        </group>

        {/* Stone Chimney */}
        <mesh castShadow position={[1.4, 3.6, -0.6]} material={materials.cobble}>
          <boxGeometry args={[0.6, 2.0, 0.6]} />
        </mesh>

        {/* Glass Windows with Wooden Frame */}
        {[-1.3, 1.3].map((x, idx) => (
          <group key={idx} position={[x, 1.8, 1.72]}>
            <mesh material={materials.log}>
              <boxGeometry args={[0.85, 0.85, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.02]} material={winGlassMat}>
              <boxGeometry args={[0.7, 0.7, 0.04]} />
            </mesh>
          </group>
        ))}

        {/* Mounted Wall Torches next to Front Entrance */}
        <WallTorch position={[-1.1, 2.0, 1.8]} />
        <WallTorch position={[1.1, 2.0, 1.8]} />

        {/* Double Wooden Doors */}
        <group position={[0, 0.02, 1.72]}>
          <group ref={leftDoorRef} position={[-0.65, 0, 0]}>
            <mesh castShadow position={[0.325, 0.9, 0]} material={materials.door}>
              <boxGeometry args={[0.65, 1.8, 0.06]} />
            </mesh>
            <mesh position={[0.55, 0.9, 0.04]} material={materials.knob}>
              <boxGeometry args={[0.06, 0.06, 0.05]} />
            </mesh>
          </group>
          <group ref={rightDoorRef} position={[0.65, 0, 0]}>
            <mesh castShadow position={[-0.325, 0.9, 0]} material={materials.door}>
              <boxGeometry args={[0.65, 1.8, 0.06]} />
            </mesh>
            <mesh position={[-0.55, 0.9, 0.04]} material={materials.knob}>
              <boxGeometry args={[0.06, 0.06, 0.05]} />
            </mesh>
          </group>
        </group>

        {/* Wooden Sign above Door */}
        <group position={[0, 2.4, 1.75]}>
          <mesh material={materials.log} castShadow>
            <boxGeometry args={[1.8, 0.45, 0.08]} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}

interface BuildingListProps {
  setProximityText: (text: string | null) => void;
  currentModal: string | null;
  isNight: boolean;
}

export default function BuildingList({ currentModal, isNight }: BuildingListProps) {
  const buildingConfigs = [
    { name: "Home", z: 20, side: 'left' as const, type: 'cottage' as const, modal: 'home' },
    { name: "School", z: 10, side: 'right' as const, type: 'school' as const, modal: 'school' },
    { name: "Computer Center", z: 0, side: 'right' as const, type: 'dome' as const, modal: 'tech' },
    { name: "AI Laboratory", z: -10, side: 'left' as const, type: 'ai-lab' as const, modal: 'ai-lab' },
    { name: "Workshop", z: -20, side: 'left' as const, type: 'gearhouse' as const, modal: 'workshop' },
    { name: "Library", z: -30, side: 'right' as const, type: 'library' as const, modal: 'library' },
    { name: "Company Headquarters", z: -40, side: 'left' as const, type: 'castle' as const, modal: 'experience' }
  ];

  return (
    <group>
      {buildingConfigs.map((b, idx) => {
        const isOpen = currentModal === b.modal;
        const rx = getRoadX(b.z);
        const angle = getRoadAngle(b.z);
        const [nx, nz] = getRoadPerp(b.z);

        const sign = b.side === 'right' ? 1 : -1;
        const roadOffset = 9.0;

        const posX = rx + sign * nx * roadOffset;
        const posZ = b.z + sign * nz * roadOffset;
        const rotY = angle + (b.side === 'left' ? Math.PI / 2 : -Math.PI / 2);

        const pathSegments = [];
        for (let i = 2.4; i <= 7.2; i += 1.0) {
          pathSegments.push(
            <mesh 
              key={`path-${idx}-${i}`} 
              position={[rx + sign * nx * i, 0.05, b.z + sign * nz * i]} 
              rotation={[0, angle, 0]}
              receiveShadow 
              material={materials.cobble}
            >
              <boxGeometry args={[1.2, 0.08, 1.0]} />
            </mesh>
          );
        }

        return (
          <group key={idx}>
            {pathSegments}
            <SingleBuilding
              name={b.name}
              position={[posX, 0, posZ]}
              rotation={[0, rotY, 0]}
              isOpen={isOpen}
              isNight={isNight}
              type={b.type}
            />
          </group>
        );
      })}
    </group>
  );
}
