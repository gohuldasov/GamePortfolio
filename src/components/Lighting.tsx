import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

interface LightingProps {
  isNight: boolean;
}

const daySunPos = new THREE.Vector3(20, 45, 15);
const nightSunPos = new THREE.Vector3(-20, 40, -15);

const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffeb });
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e7ff });

export default function Lighting({ isNight }: LightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const targetSunColor = isNight ? new THREE.Color('#4361ee') : new THREE.Color('#fff0d4');
    const targetSunIntensity = isNight ? 0.35 : 2.6;
    const targetAmbientColor = isNight ? new THREE.Color('#0f172a') : new THREE.Color('#fff6e5');
    const targetAmbientIntensity = isNight ? 0.4 : 1.25;
    const targetHemiSkyColor = isNight ? new THREE.Color('#020617') : new THREE.Color('#70b5f5');
    const targetHemiGroundColor = isNight ? new THREE.Color('#052e16') : new THREE.Color('#4c9e38');

    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(targetSunColor, delta * 3);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, targetSunIntensity, delta * 3);
      const targetPos = isNight ? nightSunPos : daySunPos;
      dirLightRef.current.position.lerp(targetPos, delta * 3);

      if (sunMeshRef.current) {
        sunMeshRef.current.position.copy(dirLightRef.current.position);
        sunMeshRef.current.lookAt(0, 0, 0);
      }
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.lerp(targetAmbientColor, delta * 3);
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, targetAmbientIntensity, delta * 3);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.lerp(targetHemiSkyColor, delta * 3);
      hemiLightRef.current.groundColor.lerp(targetHemiGroundColor, delta * 3);
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} color="#fff6e5" intensity={1.25} />

      <hemisphereLight
        ref={hemiLightRef}
        color="#70b5f5"
        groundColor="#4c9e38"
        intensity={0.65}
      />

      <directionalLight
        ref={dirLightRef}
        color="#fff5e0"
        intensity={2.6}
        position={[20, 45, 15]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={260}
        shadow-camera-left={-125}
        shadow-camera-right={125}
        shadow-camera-top={125}
        shadow-camera-bottom={-125}
        shadow-bias={-0.0005}
      />

      {/* Celestial Sun / Moon in the Sky */}
      <mesh ref={sunMeshRef} position={[20, 45, 15]} material={isNight ? moonMaterial : sunMaterial}>
        <sphereGeometry args={[3.2, 16, 16]} />
      </mesh>

      {isNight && (
        <Stars
          radius={100}
          depth={50}
          count={4000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}
    </>
  );
}
