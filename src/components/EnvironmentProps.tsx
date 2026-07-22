import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { getRoadX, getRoadAngle, getRoadPerp } from '../utils/roadPath';
import { oakLogTexture, oakPlankTexture, grassTopTexture } from '../utils/minecraftTextures';

interface EnvironmentPropsProps {
  isNight: boolean;
}

// Module-level static materials using pixel-art Minecraft textures
const trunkOakMat = new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0xffffff });
const trunkSpruceMat = new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0x886644 });

const leafOakMain = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x388e3c });
const leafOakHighlight = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x4caf50 });
const leafSpruceMain = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x1e4620 });
const leafSpruceHighlight = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x2e6931 });

const bushMat = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x2e7d32 });
const bushTopMat = new THREE.MeshToonMaterial({ map: grassTopTexture, color: 0x43a047 });
const fenceMat = new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xffffff });
const capMat = new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0x3d2b1f });
const bridgePlankMat = new THREE.MeshToonMaterial({ map: oakPlankTexture, color: 0xffffff });
const bridgeRailMat = new THREE.MeshToonMaterial({ map: oakLogTexture, color: 0xffffff });
const waterMat = new THREE.MeshLambertMaterial({ 
  color: 0x2b6cb0, 
  transparent: true, 
  opacity: 0.85,
});

// Minecraft Oak / Spruce Tree Component
function MinecraftTree({ position, type = 'oak', scale = 1.0, seed = 0 }: { position: [number, number, number]; type?: 'oak' | 'spruce'; scale?: number; seed?: number }) {
  const foliageRef = useRef<THREE.Group>(null);

  const trunkMat = type === 'oak' ? trunkOakMat : trunkSpruceMat;
  const leafMatMain = type === 'oak' ? leafOakMain : leafSpruceMain;
  const leafMatHighlight = type === 'oak' ? leafOakHighlight : leafSpruceHighlight;

  useFrame((state) => {
    if (foliageRef.current) {
      const time = state.clock.getElapsedTime();
      foliageRef.current.rotation.z = Math.sin(time * 0.8 + seed) * 0.015;
      foliageRef.current.rotation.x = Math.cos(time * 0.6 + seed) * 0.012;
    }
  });

  return (
    <RigidBody type="fixed" colliders={false} position={position} scale={scale}>
      <group>
        <mesh castShadow receiveShadow material={trunkMat} position={[0, 1.5, 0]}>
          <boxGeometry args={[0.5, 3.0, 0.5]} />
        </mesh>

        <group ref={foliageRef} position={[0, 3.0, 0]}>
          {type === 'oak' ? (
            <>
              <mesh castShadow material={leafMatMain} position={[0, 0.5, 0]}>
                <boxGeometry args={[2.0, 1.0, 2.0]} />
              </mesh>
              <mesh castShadow material={leafMatMain} position={[0, 1.3, 0]}>
                <boxGeometry args={[1.6, 0.8, 1.6]} />
              </mesh>
              <mesh castShadow material={leafMatHighlight} position={[0, 1.9, 0]}>
                <boxGeometry args={[1.0, 0.6, 1.0]} />
              </mesh>
            </>
          ) : (
            <>
              <mesh castShadow material={leafMatMain} position={[0, 0.4, 0]}>
                <boxGeometry args={[2.2, 0.6, 2.2]} />
              </mesh>
              <mesh castShadow material={leafMatMain} position={[0, 1.0, 0]}>
                <boxGeometry args={[1.7, 0.6, 1.7]} />
              </mesh>
              <mesh castShadow material={leafMatMain} position={[0, 1.6, 0]}>
                <boxGeometry args={[1.2, 0.6, 1.2]} />
              </mesh>
              <mesh castShadow material={leafMatHighlight} position={[0, 2.1, 0]}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
              </mesh>
            </>
          )}
        </group>
        <CuboidCollider args={[0.25, 1.5, 0.25]} position={[0, 1.5, 0]} />
      </group>
    </RigidBody>
  );
}

// Minecraft Voxel Bush Component
function MinecraftBush({ position, scale = 1.0 }: { position: [number, number, number]; scale?: number }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} scale={scale}>
      <group>
        <mesh castShadow position={[0, 0.35, 0]} material={bushMat}>
          <boxGeometry args={[1.0, 0.7, 1.0]} />
        </mesh>
        <mesh castShadow position={[0, 0.75, 0]} material={bushTopMat}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
        </mesh>
        <CuboidCollider args={[0.5, 0.5, 0.5]} position={[0, 0.5, 0]} />
      </group>
    </RigidBody>
  );
}

// Minecraft Street Lamp
function MinecraftStreetLamp({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number]; isNight?: boolean }) {
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffaa00 }), []);

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
      <group>
        <mesh castShadow material={fenceMat} position={[0, 1.4, 0]}>
          <boxGeometry args={[0.2, 2.8, 0.2]} />
        </mesh>
        <mesh castShadow material={fenceMat} position={[0.25, 2.7, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.2]} />
        </mesh>
        <mesh material={bulbMat} position={[0.45, 2.45, 0]} castShadow>
          <boxGeometry args={[0.38, 0.38, 0.38]} />
        </mesh>
        <mesh material={capMat} position={[0.45, 2.68, 0]}>
          <boxGeometry args={[0.44, 0.08, 0.44]} />
        </mesh>
        <CuboidCollider args={[0.1, 1.4, 0.1]} position={[0, 1.4, 0]} />
      </group>
    </RigidBody>
  );
}

// Particle Chimney Smoke using voxel cubes
function ChimneySmoke({ position }: { position: [number, number, number] }) {
  const particleCount = 6;
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      offsetY: i * 0.4,
      speed: 0.5 + Math.random() * 0.3,
      wiggle: Math.random() * 5,
    }));
  }, []);

  const smokeMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.35,
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const data = particles[idx];
      let currY = data.offsetY + (time * data.speed) % 2.2;
      mesh.position.y = currY;
      const progress = currY / 2.2;
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.12, 0.45, progress));
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.35;
      mesh.position.x = Math.sin(time * 1.2 + data.wiggle) * 0.12;
      mesh.position.z = Math.cos(time * 1.0 + data.wiggle) * 0.1;
    });
  });

  return (
    <group position={position}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) meshRefs.current[i] = el; }} 
          material={smokeMat}
        >
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

export default function EnvironmentProps({ isNight }: EnvironmentPropsProps) {
  const streetLamps = useMemo(() => {
    const list: { p: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let z = 24; z >= -48; z -= 12) {
      const rx = getRoadX(z);
      const angle = getRoadAngle(z);
      const perpX = Math.cos(angle);
      const perpZ = -Math.sin(angle);

      list.push({
        p: [rx - perpX * 3.2, 0, z - perpZ * 3.2],
        rot: [0, angle + Math.PI / 2, 0],
      });
    }
    return list;
  }, []);

  const bushes = useMemo(() => {
    const list: { p: [number, number, number]; s: number }[] = [];
    for (let z = 26; z >= -46; z -= 3.0) {
      const rx = getRoadX(z);
      const angle = getRoadAngle(z);
      const perpX = Math.cos(angle);
      const perpZ = -Math.sin(angle);

      list.push({
        p: [rx - perpX * 3.4 + (z % 2 ? 0.3 : -0.3), 0, z - perpZ * 3.4],
        s: 1.0 + (Math.abs(z) % 3) * 0.15,
      });
      list.push({
        p: [rx + perpX * 3.4 + (z % 2 ? -0.3 : 0.3), 0, z + perpZ * 3.4],
        s: 1.05 + (Math.abs(z) % 2) * 0.2,
      });
    }
    return list;
  }, []);

  const trees = useMemo(() => [
    { p: [-10, 0, 24] as [number, number, number], type: 'oak' as const, s: 1.2, seed: 0.1 },
    { p: [12, 0, 25] as [number, number, number], type: 'spruce' as const, s: 1.1, seed: 0.4 },
    { p: [-12, 0, 18] as [number, number, number], type: 'spruce' as const, s: 1.3, seed: 0.9 },
    { p: [14, 0, 15] as [number, number, number], type: 'oak' as const, s: 1.0, seed: 1.3 },
    { p: [-14, 0, 10] as [number, number, number], type: 'oak' as const, s: 1.4, seed: 1.5 },
    { p: [12, 0, 5] as [number, number, number], type: 'spruce' as const, s: 1.2, seed: 1.7 },
    { p: [-11, 0, -2] as [number, number, number], type: 'spruce' as const, s: 1.25, seed: 1.8 },
    { p: [13, 0, -8] as [number, number, number], type: 'oak' as const, s: 1.15, seed: 2.1 },
    { p: [-12, 0, -15] as [number, number, number], type: 'oak' as const, s: 1.1, seed: 2.4 },
    { p: [11, 0, -20] as [number, number, number], type: 'spruce' as const, s: 1.3, seed: 2.6 },
    { p: [-13, 0, -26] as [number, number, number], type: 'spruce' as const, s: 1.35, seed: 2.7 },
    { p: [12, 0, -32] as [number, number, number], type: 'oak' as const, s: 1.1, seed: 3.1 },
    { p: [-11, 0, -38] as [number, number, number], type: 'spruce' as const, s: 1.4, seed: 3.4 },
    { p: [14, 0, -44] as [number, number, number], type: 'oak' as const, s: 1.2, seed: 3.6 },
    { p: [-12, 0, -48] as [number, number, number], type: 'spruce' as const, s: 1.3, seed: 4.2 },
  ], []);

  const riverX = getRoadX(-14);

  return (
    <group>
      {trees.map((t, idx) => (
        <MinecraftTree key={idx} position={t.p} type={t.type} scale={t.s} seed={t.seed} />
      ))}

      {bushes.map((b, idx) => (
        <MinecraftBush key={idx} position={b.p} scale={b.s} />
      ))}

      {streetLamps.map((l, idx) => (
        <MinecraftStreetLamp key={idx} position={l.p} rotation={l.rot} isNight={isNight} />
      ))}

      <ChimneySmoke position={[-5.0 + 1.4, 3.6, 20 - 0.6]} />
      <ChimneySmoke position={[-6.2 + 1.4, 3.6, -10 - 0.6]} />
      <ChimneySmoke position={[-6.8 + 1.4, 3.6, -20 - 0.6]} />

      <group position={[riverX, 0, -14.0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow material={waterMat}>
          <planeGeometry args={[60, 3.6]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.12, 0]} material={bridgePlankMat}>
          <boxGeometry args={[5.2, 0.14, 3.8]} />
        </mesh>
        <mesh castShadow position={[-2.5, 0.5, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.2, 0.6, 3.8]} />
        </mesh>
        <mesh castShadow position={[2.5, 0.5, 0]} material={bridgeRailMat}>
          <boxGeometry args={[0.2, 0.6, 3.8]} />
        </mesh>
      </group>
    </group>
  );
}
