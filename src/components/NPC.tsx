import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRoadX } from '../utils/roadPath';

// Static Shared NPC Materials
const staticSkinMat = new THREE.MeshToonMaterial({ color: 0xfcc4b6 });
const staticHairMat = new THREE.MeshToonMaterial({ color: 0x4a3020 });
const staticGreyHairMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
const staticOldJacketMat = new THREE.MeshToonMaterial({ color: 0x4a5568 });
const staticOldPantsMat = new THREE.MeshToonMaterial({ color: 0x2d3748 });
const staticCatMat = new THREE.MeshToonMaterial({ color: 0xd9a05b });
const staticBirdMat = new THREE.MeshToonMaterial({ color: 0xffffff });
const staticWingMat = new THREE.MeshBasicMaterial({ color: 0xffa500, side: THREE.DoubleSide });

// Reusable simple walking NPC component
function Citizen({ position, pathPoints, speed = 1.0, color = 0xdd6b20 }: { position: [number, number, number]; pathPoints: [number, number][]; speed?: number; color?: number }) {
  const meshRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const pathIdx = useRef(0);
  const currPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  // Memoize cloth material per citizen instance
  const clothMat = useMemo(() => new THREE.MeshToonMaterial({ color }), [color]);

  useFrame((state, delta) => {
    if (!meshRef.current || pathPoints.length === 0) return;

    const target = pathPoints[pathIdx.current];
    const targetVec = new THREE.Vector3(target[0], position[1], target[1]);
    const dir = targetVec.clone().sub(currPos.current);
    const dist = dir.length();

    if (dist < 0.15) {
      pathIdx.current = (pathIdx.current + 1) % pathPoints.length;
    } else {
      dir.normalize();
      currPos.current.add(dir.multiplyScalar(delta * speed));
      meshRef.current.position.copy(currPos.current);

      const angle = Math.atan2(dir.x, dir.z);
      meshRef.current.rotation.y = angle;

      const swing = Math.sin(state.clock.getElapsedTime() * 7 * speed);
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.45;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.45;
      
      meshRef.current.position.y = position[1] + Math.abs(Math.sin(state.clock.getElapsedTime() * 14 * speed)) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={1.25}>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]} material={clothMat}>
        <cylinderGeometry args={[0.22, 0.2, 0.6, 8]} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]} material={staticSkinMat}>
        <sphereGeometry args={[0.2, 10, 10]} />
      </mesh>
      <mesh position={[0, 1.25, -0.04]} scale={[1.1, 1.0, 1.1]} material={staticHairMat}>
        <sphereGeometry args={[0.15, 8, 8]} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.1, 0.25, 0]} material={clothMat}>
        <cylinderGeometry args={[0.07, 0.06, 0.5, 8]} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.1, 0.25, 0]} material={clothMat}>
        <cylinderGeometry args={[0.07, 0.06, 0.5, 8]} />
      </mesh>
    </group>
  );
}

// Butterfly component fluttering around flower beds
function Butterfly({ center }: { center: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 50, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    const wingFlap = Math.sin(time * 28 + seed) * 0.55;
    if (leftWingRef.current) leftWingRef.current.rotation.z = wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -wingFlap;

    const radius = 0.55 + Math.sin(time * 0.5) * 0.15;
    meshRef.current.position.x = center[0] + Math.sin(time * 1.5 + seed) * radius;
    meshRef.current.position.z = center[2] + Math.cos(time * 1.5 + seed) * radius;
    meshRef.current.position.y = center[1] + 0.35 + Math.sin(time * 4.0 + seed) * 0.15;
  });

  return (
    <group ref={meshRef}>
      <mesh ref={leftWingRef} position={[-0.04, 0, 0]} material={staticWingMat}>
        <planeGeometry args={[0.08, 0.08]} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.04, 0, 0]} material={staticWingMat}>
        <planeGeometry args={[0.08, 0.08]} />
      </mesh>
    </group>
  );
}

// Bird component soaring in skies
function SkyBird({ height = 11, seed = 0 }: { height?: number; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    const radius = 22;
    const angle = time * 0.28 + seed;
    groupRef.current.position.set(Math.cos(angle) * radius, height + Math.sin(time * 0.8) * 0.5, Math.sin(angle) * radius);
    groupRef.current.rotation.y = -angle + Math.PI / 2;

    const flap = Math.sin(time * 10) * 0.5;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef} scale={0.45}>
      <mesh material={staticBirdMat}>
        <boxGeometry args={[0.15, 0.1, 0.45]} />
      </mesh>
      <mesh ref={leftWingRef} position={[-0.15, 0, 0]} material={staticBirdMat}>
        <boxGeometry args={[0.28, 0.02, 0.16]} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.15, 0, 0]} material={staticBirdMat}>
        <boxGeometry args={[0.28, 0.02, 0.16]} />
      </mesh>
    </group>
  );
}

// Sleeping Cat on bench
function SleepingCat({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={0.25} rotation={[0.06, 0.25, 0]}>
      <mesh position={[0, 0.3, 0]} scale={[1.4, 0.9, 1.2]} material={staticCatMat}>
        <sphereGeometry args={[0.8, 10, 10]} />
      </mesh>
      <mesh position={[0.8, 0.5, 0.2]} material={staticCatMat}>
        <sphereGeometry args={[0.42, 8, 8]} />
      </mesh>
      {[-0.15, 0.15].map((z, idx) => (
        <mesh key={idx} position={[0.8, 0.9, 0.2 + z]} rotation={[0, 0, -0.4]} material={staticCatMat}>
          <coneGeometry args={[0.1, 0.25, 4]} />
        </mesh>
      ))}
      <mesh position={[-1.0, 0.3, -0.2]} rotation={[0, 0, 0.4]} material={staticCatMat}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 6]} />
      </mesh>
    </group>
  );
}

export default function NPCList() {
  const roadWaypoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (let z = 22; z >= -42; z -= 8) {
      pts.push([getRoadX(z), z]);
    }
    return pts;
  }, []);

  const reverseWaypoints = useMemo(() => {
    return [...roadWaypoints].reverse();
  }, [roadWaypoints]);

  return (
    <group>
      <Citizen position={[getRoadX(20), 0.1, 20]} pathPoints={roadWaypoints} speed={1.15} color={0x06d6a0} />
      <Citizen position={[getRoadX(-40), 0.1, -40]} pathPoints={reverseWaypoints} speed={0.95} color={0xef476f} />
      <Citizen position={[getRoadX(0), 0.1, 0]} pathPoints={roadWaypoints} speed={1.05} color={0xffd166} />
      <Citizen position={[getRoadX(-15), 0.1, -15]} pathPoints={reverseWaypoints} speed={0.8} color={0x118ab2} />
      <Citizen position={[getRoadX(10), 0.1, 10]} pathPoints={roadWaypoints} speed={1.2} color={0x073b4c} />
      <Citizen position={[getRoadX(-25), 0.1, -25]} pathPoints={reverseWaypoints} speed={1.1} color={0xf77f00} />

      {/* Old person sitting on bench */}
      <group position={[-3.8, 0.38, 12.3]} rotation={[0, Math.PI / 8, 0]} scale={0.72}>
        <mesh position={[0, 0.5, 0]} material={staticOldJacketMat}>
          <cylinderGeometry args={[0.22, 0.2, 0.55, 8]} />
        </mesh>
        <mesh position={[0, 0.95, 0]} material={staticSkinMat}>
          <sphereGeometry args={[0.18, 10, 10]} />
        </mesh>
        <mesh position={[0, 1.05, -0.04]} scale={[1.15, 1.0, 1.15]} material={staticGreyHairMat}>
          <sphereGeometry args={[0.14, 8, 8]} />
        </mesh>
        <mesh position={[-0.1, 0.12, 0.22]} rotation={[Math.PI / 2.2, 0, 0]} material={staticOldPantsMat}>
          <cylinderGeometry args={[0.07, 0.06, 0.44, 8]} />
        </mesh>
        <mesh position={[0.1, 0.12, 0.22]} rotation={[Math.PI / 2.2, 0, 0]} material={staticOldPantsMat}>
          <cylinderGeometry args={[0.07, 0.06, 0.44, 8]} />
        </mesh>
      </group>

      {/* Sleeping tabby cat */}
      <SleepingCat position={[4, 0.45, 12.3]} />

      {/* Soaring birds */}
      <SkyBird height={11} seed={0} />
      <SkyBird height={12.5} seed={Math.PI / 2} />
      <SkyBird height={10} seed={Math.PI} />

      {/* Butterflies */}
      <Butterfly center={[-5, 0.2, 6]} />
      <Butterfly center={[5, 0.2, 6]} />
      <Butterfly center={[-7, 0.2, -4]} />
      <Butterfly center={[7, 0.2, -4]} />
    </group>
  );
}
