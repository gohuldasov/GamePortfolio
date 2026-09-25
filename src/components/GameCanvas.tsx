import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import Lighting from './Lighting';
import CameraController from './CameraController';
import Player from './Player';
import World from './World';
import EnvironmentProps from './EnvironmentProps';
import ShopsAndParks from './ShopsAndParks';
import BuildingList from './Building';
import NPCList from './NPC';
import VillageExpansion from './ArcheryRange';
import ArcheryGame from './ArcheryGame';

interface GameCanvasProps {
  gameState: 'loading' | 'title' | 'dialogue' | 'explore';
  isNight: boolean;
  currentModal: string | null;
  setProximityText: (text: string | null) => void;
  isArcheryMode?: boolean;
  onScorePoints?: (points: number, hitType: string) => void;
  onPowerChange?: (power: number) => void;
  onShootArrow?: () => void;
}

// Background Scene Color and Fog Lerp Coordinator
function SceneEnvironmentController({ isNight }: { isNight: boolean }) {
  const { scene } = useThree();

  // Create fog on mount
  useEffect(() => {
    scene.fog = new THREE.Fog('#d4eaf7', 35, 240);
    scene.background = new THREE.Color('#8ac6f0');
  }, [scene]);

  useFrame((_, delta) => {
    const targetSkyColor = isNight ? new THREE.Color('#0b1329') : new THREE.Color('#8ac6f0');
    const targetFogColor = isNight ? new THREE.Color('#0b1329') : new THREE.Color('#d4eaf7');

    if (scene.background) {
      (scene.background as THREE.Color).lerp(targetSkyColor, delta * 3);
    }
    if (scene.fog && 'color' in scene.fog) {
      (scene.fog as THREE.Fog).color.lerp(targetFogColor, delta * 3);
    }
  });

  return null;
}

export default function GameCanvas({
  gameState,
  isNight,
  currentModal,
  setProximityText,
  isArcheryMode = false,
  onScorePoints = () => {},
  onPowerChange = () => {},
  onShootArrow = () => {},
}: GameCanvasProps) {
  // Player mesh reference used by follow camera to track coordinates
  const playerRef = useRef<THREE.Group>(null);

  return (
    <Canvas
      shadows
      camera={{ fov: 48, near: 0.1, far: 350, position: [0, 3, 28.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    >
      {/* Lerps Background and Fog Colors */}
      <SceneEnvironmentController isNight={isNight} />

      {/* Physics World Simulation */}
      <Physics gravity={[0, -9.8, 0]} debug={false}>

        {/* Lights (Sun/Moon nodes) */}
        <Lighting isNight={isNight} />

        {/* Third person follow camera controller */}
        <CameraController gameState={gameState} playerRef={playerRef} isArcheryMode={isArcheryMode} />

        {/* Playable character wrapper */}
        <Player
          gameState={gameState}
          playerRef={playerRef}
          setProximityText={setProximityText}
          currentModal={currentModal}
          isArcheryMode={isArcheryMode}
        />

        {/* Static land mass, mountains, roads, curbstones, fences */}
        <World />

        {/* Interactive Cottage / Laboratory Buildings */}
        <BuildingList
          setProximityText={setProximityText}
          currentModal={currentModal}
          isNight={isNight}
        />

        {/* Village Expansion Buildings & Archery Range Field */}
        <VillageExpansion />

        {/* Interactive Archery Mini-Game Engine */}
        <ArcheryGame
          isArcheryMode={isArcheryMode}
          onScorePoints={onScorePoints}
          onPowerChange={onPowerChange}
          onShootArrow={onShootArrow}
        />

        {/* Dynamic vegetation sways, stream, bridges, lampposts */}
        <EnvironmentProps isNight={isNight} />

        {/* Fountain, benches, decorative stalls, flower boxes */}
        <ShopsAndParks isNight={isNight} />

        {/* Ambient NPC System (Wandering villagers, soaring birds, butterflies) */}
        <NPCList />

      </Physics>
    </Canvas>
  );
}
