import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { oakLogTexture, oakPlankTexture, stoneBrickTexture, cobblestoneTexture, roofShingleTexture } from '../utils/minecraftTextures';
import { getTerrainHeight } from '../utils/terrain';

interface BuildingProps {
  name: string;
  icon?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isOpen: boolean;
  isNight: boolean;
  type: 'cottage' | 'castle' | 'dome' | 'gearhouse' | 'school' | 'ai-lab' | 'library';
}

// Physically-based materials with authentic textures and unique house themes
const materials = {
  log: new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8 }),
  plank: new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.7 }),
  cobble: new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.75, color: 0x909095 }),
  stone: new THREE.MeshStandardMaterial({ map: stoneBrickTexture, roughness: 0.7 }),
  roofShingle: new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.6 }),
  roofRed: new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.6, color: 0xa83232 }),
  roofDark: new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.6, color: 0x4a2e1b }),
  roofSlate: new THREE.MeshStandardMaterial({ map: roofShingleTexture, roughness: 0.5, color: 0x334155 }),
  wallWhite: new THREE.MeshStandardMaterial({ map: stoneBrickTexture, roughness: 0.6, color: 0xf1f5f9 }),
  wallDarkIron: new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.8, color: 0x334155 }),
  woodDark: new THREE.MeshStandardMaterial({ map: oakLogTexture, roughness: 0.8, color: 0x3e2413 }),
  door: new THREE.MeshStandardMaterial({ map: oakPlankTexture, roughness: 0.6, color: 0xaa6c38 }),
  knob: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 }),
  goldTrim: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 }),
  copperMat: new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.3 }),
  crystalMat: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  glassLit: new THREE.MeshBasicMaterial({ color: 0xffdb6d }),
  glassUnlit: new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.2 }),
  lanternFrame: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4 }),
  lanternGlass: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
  siloMat: new THREE.MeshStandardMaterial({ color: 0x5a6578, roughness: 0.5 }),
  siloDome: new THREE.MeshStandardMaterial({ color: 0x95a5b5, roughness: 0.3, metalness: 0.6 }),
};

// Glowing wall lantern
function WallLantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.lanternFrame} castShadow>
        <boxGeometry args={[0.22, 0.35, 0.22]} />
      </mesh>
      <mesh material={materials.lanternGlass}>
        <boxGeometry args={[0.16, 0.26, 0.16]} />
      </mesh>
      <pointLight color={0xffaa00} intensity={0.6} distance={4} decay={2} position={[0, 0, 0]} />
    </group>
  );
}

// Seamless Gabled Roof with Solid Triangular Gable End Walls
function GabledRoof({
  width,
  length,
  pitchHeight,
  yPos,
  material = materials.roofShingle,
  wallMaterial = materials.plank
}: {
  width: number;
  length: number;
  pitchHeight: number;
  yPos: number;
  material?: THREE.Material;
  wallMaterial?: THREE.Material;
}) {
  const roofSlopeAngle = Math.atan2(pitchHeight, width / 2);
  const slopeLength = Math.sqrt((width / 2 + 0.35) ** 2 + pitchHeight ** 2);

  // Triangular Gable End Wall Geometry (Front & Back Attic Closure)
  const gableShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, pitchHeight);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false });
  }, [width, pitchHeight]);

  return (
    <group position={[0, yPos, 0]}>
      {/* Left Sloped Roof Slab */}
      <mesh castShadow receiveShadow position={[-width / 4 - 0.1, pitchHeight / 2, 0]} rotation={[0, 0, roofSlopeAngle]} material={material}>
        <boxGeometry args={[slopeLength, 0.18, length + 0.6]} />
      </mesh>
      {/* Right Sloped Roof Slab */}
      <mesh castShadow receiveShadow position={[width / 4 + 0.1, pitchHeight / 2, 0]} rotation={[0, 0, -roofSlopeAngle]} material={material}>
        <boxGeometry args={[slopeLength, 0.18, length + 0.6]} />
      </mesh>
      {/* Top Ridge Cap Beam */}
      <mesh castShadow position={[0, pitchHeight + 0.05, 0]} material={materials.woodDark}>
        <boxGeometry args={[0.28, 0.28, length + 0.7]} />
      </mesh>

      {/* Solid Front Triangular Gable End Wall */}
      <mesh position={[0, 0, length / 2]} material={wallMaterial} castShadow receiveShadow>
        <primitive object={gableShape} />
      </mesh>
      {/* Solid Rear Triangular Gable End Wall */}
      <mesh position={[0, 0, -length / 2 - 0.16]} material={wallMaterial} castShadow receiveShadow>
        <primitive object={gableShape} />
      </mesh>
    </group>
  );
}

// Windmill Component (Top-Left of Blueprint)
export function Windmill({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Octagonal Stone Base (Subterranean Foundation Skirt) */}
        <mesh castShadow receiveShadow position={[0, 2.4, 0]} material={materials.stone}>
          <cylinderGeometry args={[3.2, 4.8, 8.8, 8]} />
        </mesh>
        {/* Upper Timber Level */}
        <mesh castShadow receiveShadow position={[0, 8.2, 0]} material={materials.plank}>
          <cylinderGeometry args={[2.5, 3.2, 2.8, 8]} />
        </mesh>
        {/* Conical Roof */}
        <mesh castShadow position={[0, 10.9, 0]} material={materials.roofDark}>
          <coneGeometry args={[3.2, 2.6, 8]} />
        </mesh>
        {/* Hub & Rotating Blades */}
        <group position={[0, 8.0, 2.8]}>
          <mesh material={materials.woodDark} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.8, 8]} />
          </mesh>
          <group ref={bladesRef} position={[0, 0, 0.45]}>
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => (
              <group key={idx} rotation={[0, 0, angle]}>
                <mesh position={[0, 3.0, 0]} material={materials.woodDark} castShadow>
                  <boxGeometry args={[0.2, 6.0, 0.1]} />
                </mesh>
                <mesh position={[0.5, 3.3, 0]} material={materials.plank} castShadow>
                  <boxGeometry args={[1.0, 5.0, 0.05]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
        {/* Decorative Door */}
        <mesh position={[0, 1.2, 4.0]} material={materials.door} castShadow>
          <boxGeometry args={[1.4, 2.4, 0.12]} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// Barn & Silo Component (Top-Right of Blueprint - Portfolio Contact)
export function BarnAndSilo({ position, rotation = [0, 0, 0], isOpen, name, icon }: { position: [number, number, number]; rotation?: [number, number, number]; isOpen: boolean; name: string; icon: string }) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const targetAngle = isOpen ? Math.PI / 1.8 : 0;
    if (leftDoorRef.current) leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, targetAngle, delta * 8);
    if (rightDoorRef.current) rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, -targetAngle, delta * 8);
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Subterranean Foundation Base Skirt */}
        <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.stone}>
          <boxGeometry args={[9.4, 2.8, 8.8]} />
        </mesh>
        {/* Main Barn Structure */}
        <mesh castShadow receiveShadow position={[0, 3.0, 0]} material={materials.roofRed}>
          <boxGeometry args={[9.0, 6.0, 8.4]} />
        </mesh>
        <GabledRoof width={9.0} length={8.4} pitchHeight={3.8} yPos={6.0} material={materials.roofDark} wallMaterial={materials.roofRed} />

        {/* Attached Silo Tower */}
        <group position={[5.8, 0, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.siloMat}>
            <cylinderGeometry args={[2.3, 2.5, 2.8, 16]} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 5.2, 0]} material={materials.siloMat}>
            <cylinderGeometry args={[2.2, 2.2, 10.5, 16]} />
          </mesh>
          <mesh castShadow position={[0, 11.2, 0]} material={materials.siloDome}>
            <sphereGeometry args={[2.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>

        {/* Double Doors */}
        <group position={[0, 0.02, 4.22]}>
          <group ref={leftDoorRef} position={[-1.25, 0, 0]}>
            <mesh castShadow position={[0.62, 1.6, 0]} material={materials.door}>
              <boxGeometry args={[1.25, 3.2, 0.12]} />
            </mesh>
          </group>
          <group ref={rightDoorRef} position={[1.25, 0, 0]}>
            <mesh castShadow position={[-0.62, 1.6, 0]} material={materials.door}>
              <boxGeometry args={[1.25, 3.2, 0.12]} />
            </mesh>
          </group>
        </group>

        {/* Interactive Signboard */}
        <group position={[0, 4.8, 4.3]}>
          <mesh material={materials.log} castShadow>
            <boxGeometry args={[3.8, 0.75, 0.12]} />
          </mesh>
          <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">{icon}</span>
              <span className="sign-text">{name.toUpperCase()}</span>
            </div>
          </Html>
        </group>
      </group>
    </RigidBody>
  );
}

// Church Component (Middle-East of Blueprint - Portfolio Developer Workshop)
export function Church({ position, rotation = [0, 0, 0], isOpen, name, icon }: { position: [number, number, number]; rotation?: [number, number, number]; isOpen: boolean; name: string; icon: string }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Subterranean Foundation Base Skirt */}
        <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.stone}>
          <boxGeometry args={[8.2, 2.8, 9.8]} />
        </mesh>
        {/* Main Church Hall */}
        <mesh castShadow receiveShadow position={[0, 2.8, 0]} material={materials.stone}>
          <boxGeometry args={[7.8, 5.6, 9.4]} />
        </mesh>
        <GabledRoof width={7.8} length={9.4} pitchHeight={3.4} yPos={5.6} material={materials.roofShingle} wallMaterial={materials.stone} />

        {/* Steeple Bell Tower */}
        <group position={[0, 5.6, 3.6]}>
          <mesh castShadow material={materials.stone} position={[0, 2.5, 0]}>
            <boxGeometry args={[2.5, 5.0, 2.5]} />
          </mesh>
          <mesh castShadow material={materials.roofDark} position={[0, 6.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.9, 2.8, 4]} />
          </mesh>
          {/* Cross Top */}
          <mesh position={[0, 8.0, 0]} material={materials.knob}>
            <boxGeometry args={[0.16, 1.1, 0.16]} />
          </mesh>
          <mesh position={[0, 8.2, 0]} material={materials.knob}>
            <boxGeometry args={[0.7, 0.16, 0.16]} />
          </mesh>
        </group>

        {/* Arched Entrance Door */}
        <mesh position={[0, 1.5, 4.75]} material={materials.door} castShadow>
          <boxGeometry args={[1.6, 3.0, 0.12]} />
        </mesh>

        {/* Interactive Signboard */}
        <group position={[0, 4.4, 4.85]}>
          <mesh material={materials.log} castShadow>
            <boxGeometry args={[3.8, 0.75, 0.12]} />
          </mesh>
          <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">{icon}</span>
              <span className="sign-text">{name.toUpperCase()}</span>
            </div>
          </Html>
        </group>
      </group>
    </RigidBody>
  );
}

// Handcrafted Cottage Component - Distinct 3D Architecture for Every House
function HandcraftedCottage({ position, rotation = [0, 0, 0], isOpen, isNight, type, name, icon }: BuildingProps) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const targetLeftAngle = isOpen ? Math.PI / 1.8 : 0;
    const targetRightAngle = isOpen ? -Math.PI / 1.8 : 0;

    if (leftDoorRef.current) leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, targetLeftAngle, delta * 8);
    if (rightDoorRef.current) rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetRightAngle, delta * 8);

    if (gearRef.current) {
      gearRef.current.rotation.z += delta * 1.5;
    }
  });

  const winGlassMat = isNight ? materials.glassLit : materials.glassUnlit;

  const w = 7.5;
  const d = 6.6;
  const h = 4.0;

  // ------------------------------------------------------------------------
  // 🏠 HOUSE 1: ABOUT ME (Cozy Tudor Countryside Cottage)
  // ------------------------------------------------------------------------
  if (type === 'cottage') {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
          {/* Cobblestone Subterranean Base Foundation */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.cobble}>
            <boxGeometry args={[w + 0.4, 2.8, d + 0.4]} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.2, d / 2 + 0.45]} material={materials.cobble}>
            <boxGeometry args={[1.8, 0.4, 0.8]} />
          </mesh>

          {/* Timber Plank Main Body */}
          <mesh castShadow receiveShadow position={[0, 0.4 + h / 2, 0]} material={materials.plank}>
            <boxGeometry args={[w, h, d]} />
          </mesh>

          {/* Dark Timber Frame Cross-Hatching */}
          {[
            [-w / 2, 0.4 + h / 2, -d / 2],
            [w / 2, 0.4 + h / 2, -d / 2],
            [-w / 2, 0.4 + h / 2, d / 2],
            [w / 2, 0.4 + h / 2, d / 2],
          ].map((p, idx) => (
            <mesh key={idx} position={p as [number, number, number]} material={materials.log} castShadow>
              <boxGeometry args={[0.38, h + 0.1, 0.38]} />
            </mesh>
          ))}
          <mesh position={[0, 0.4 + h * 0.5, d / 2 + 0.02]} material={materials.woodDark} castShadow>
            <boxGeometry args={[w + 0.1, 0.14, 0.1]} />
          </mesh>

          {/* Front Porch Canopy Supported by Log Pillars */}
          <group position={[0, 0.4 + h * 0.75, d / 2 + 0.6]}>
            <mesh castShadow material={materials.roofRed}>
              <boxGeometry args={[2.2, 0.15, 1.2]} />
            </mesh>
            {[-0.9, 0.9].map((px, pi) => (
              <mesh key={pi} position={[px, -h * 0.38, 0.4]} material={materials.log} castShadow>
                <boxGeometry args={[0.16, h * 0.75, 0.16]} />
              </mesh>
            ))}
          </group>

          {/* Terracotta Red Gabled Roof */}
          <GabledRoof width={w} length={d} pitchHeight={2.4} yPos={0.4 + h} material={materials.roofRed} />

          {/* Roof Dormer Window */}
          <group position={[0, 0.8 + h + 1.1, d * 0.25]}>
            <mesh castShadow material={materials.plank}>
              <boxGeometry args={[1.2, 1.0, 1.2]} />
            </mesh>
            <GabledRoof width={1.2} length={1.2} pitchHeight={0.6} yPos={0.5} material={materials.roofRed} />
            <mesh position={[0, 0, 0.62]} material={winGlassMat}>
              <circleGeometry args={[0.32, 12]} />
            </mesh>
          </group>

          {/* Cozy Brick Chimney */}
          <group position={[w * 0.32, 0.8 + h + 1.4, -d * 0.2]}>
            <mesh castShadow material={materials.stone}>
              <boxGeometry args={[0.7, 2.6, 0.7]} />
            </mesh>
            <mesh position={[0, 1.35, 0]} material={materials.cobble} castShadow>
              <boxGeometry args={[0.85, 0.15, 0.85]} />
            </mesh>
          </group>

          {/* Window Flower Boxes */}
          {[-w * 0.3, w * 0.3].map((x, idx) => (
            <group key={idx} position={[x, 0.8 + h * 0.45, d / 2 + 0.04]}>
              <mesh material={materials.woodDark} castShadow>
                <boxGeometry args={[0.9, 0.9, 0.08]} />
              </mesh>
              <mesh position={[0, 0, 0.02]} material={winGlassMat}>
                <boxGeometry args={[0.76, 0.76, 0.04]} />
              </mesh>
              <mesh position={[0, -0.52, 0.1]} material={materials.woodDark} castShadow>
                <boxGeometry args={[0.95, 0.22, 0.25]} />
              </mesh>
              {[-0.3, 0, 0.3].map((fx, fi) => (
                <mesh key={fi} position={[fx, -0.36, 0.12]}>
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshStandardMaterial color={fi % 2 === 0 ? 0xef476f : 0xffb703} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))}

          <WallLantern position={[-1.2, 1.8, d / 2 + 0.12]} />
          <WallLantern position={[1.2, 1.8, d / 2 + 0.12]} />

          {/* Entrance Doors */}
          <group position={[0, 0.42, d / 2 + 0.04]}>
            <group ref={leftDoorRef} position={[-0.6, 0, 0]}>
              <mesh castShadow position={[0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
            <group ref={rightDoorRef} position={[0.6, 0, 0]}>
              <mesh castShadow position={[-0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
          </group>

          {/* Interactive Signboard */}
          <group position={[0, 2.7, d / 2 + 0.12]}>
            <mesh material={materials.log} castShadow>
              <boxGeometry args={[2.8, 0.55, 0.1]} />
            </mesh>
            <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
              <div className="building-3d-sign">
                <span className="sign-icon">{icon || '🏠'}</span>
                <span className="sign-text">{name.toUpperCase()}</span>
              </div>
            </Html>
          </group>
        </group>
      </RigidBody>
    );
  }

  // ------------------------------------------------------------------------
  // 🎓 HOUSE 2: EDUCATION (Grand Academic Library & Clock Tower)
  // ------------------------------------------------------------------------
  if (type === 'school') {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
          {/* White Stone Subterranean Base Foundation */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.stone}>
            <boxGeometry args={[w + 0.6, 2.8, d + 0.6]} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.2, d / 2 + 0.5]} material={materials.stone}>
            <boxGeometry args={[2.8, 0.4, 1.0]} />
          </mesh>

          {/* White Stone Main Hall Walls */}
          <mesh castShadow receiveShadow position={[0, 0.4 + h / 2, 0]} material={materials.wallWhite}>
            <boxGeometry args={[w, h + 0.4, d]} />
          </mesh>

          {/* Classical Entrance Portico with 4 White Pillars */}
          <group position={[0, 0.4, d / 2 + 0.5]}>
            {[-1.1, -0.4, 0.4, 1.1].map((px, pi) => (
              <mesh key={pi} position={[px, (h + 0.4) / 2, 0]} material={materials.wallWhite} castShadow>
                <cylinderGeometry args={[0.18, 0.22, h + 0.4, 12]} />
              </mesh>
            ))}
            {/* Portico Triangular Pediment with Open Book Emblem */}
            <mesh position={[0, h + 0.8, -0.2]} rotation={[0, Math.PI / 4, 0]} material={materials.wallWhite} castShadow>
              <coneGeometry args={[1.8, 0.9, 4]} />
            </mesh>
            <mesh position={[0, h + 0.6, 0.2]} material={materials.goldTrim}>
              <boxGeometry args={[0.5, 0.4, 0.08]} />
            </mesh>
          </group>

          {/* Slate Blue Roof Shingles */}
          <GabledRoof width={w} length={d} pitchHeight={2.2} yPos={0.4 + h + 0.4} material={materials.roofSlate} wallMaterial={materials.wallWhite} />

          {/* Double-Steepled Clock Tower Spire */}
          <group position={[0, 0.4 + h + 0.4 + 2.2, 0]}>
            <mesh castShadow material={materials.wallWhite} position={[0, 1.0, 0]}>
              <boxGeometry args={[1.6, 2.0, 1.6]} />
            </mesh>
            {/* Gold Clock Face */}
            <mesh position={[0, 1.0, 0.82]} material={materials.goldTrim}>
              <circleGeometry args={[0.42, 16]} />
            </mesh>
            <mesh position={[0, 1.0, 0.84]} material={materials.lanternFrame}>
              <boxGeometry args={[0.04, 0.4, 0.02]} />
            </mesh>
            <mesh position={[0, 1.0, 0.84]} material={materials.lanternFrame}>
              <boxGeometry args={[0.3, 0.04, 0.02]} />
            </mesh>
            {/* Conical Red Clock Spire */}
            <mesh castShadow position={[0, 2.6, 0]} material={materials.roofRed}>
              <coneGeometry args={[1.2, 1.6, 8]} />
            </mesh>
          </group>

          {/* Arched Library Windows */}
          {[-w * 0.3, w * 0.3].map((x, idx) => (
            <group key={idx} position={[x, 0.8 + h * 0.45, d / 2 + 0.04]}>
              <mesh material={materials.stone} castShadow>
                <boxGeometry args={[0.9, 1.4, 0.08]} />
              </mesh>
              <mesh position={[0, 0, 0.02]} material={winGlassMat}>
                <boxGeometry args={[0.76, 1.25, 0.04]} />
              </mesh>
            </group>
          ))}

          <WallLantern position={[-1.6, 1.8, d / 2 + 0.12]} />
          <WallLantern position={[1.6, 1.8, d / 2 + 0.12]} />

          {/* Entrance Doors */}
          <group position={[0, 0.42, d / 2 + 0.04]}>
            <group ref={leftDoorRef} position={[-0.6, 0, 0]}>
              <mesh castShadow position={[0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
            <group ref={rightDoorRef} position={[0.6, 0, 0]}>
              <mesh castShadow position={[-0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
          </group>

          {/* Interactive Signboard */}
          <group position={[0, 3.4, d / 2 + 0.6]}>
            <mesh material={materials.log} castShadow>
              <boxGeometry args={[2.8, 0.55, 0.1]} />
            </mesh>
            <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
              <div className="building-3d-sign">
                <span className="sign-icon">{icon || '🎓'}</span>
                <span className="sign-text">{name.toUpperCase()}</span>
              </div>
            </Html>
          </group>
        </group>
      </RigidBody>
    );
  }

  // ------------------------------------------------------------------------
  // ⚡ HOUSE 3: SKILLS (High-Tech Arcane Observatory & Dome)
  // ------------------------------------------------------------------------
  if (type === 'dome') {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
          {/* Polished Slate Subterranean Base */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.stone}>
            <cylinderGeometry args={[w / 2 + 0.4, w / 2 + 0.7, 2.8, 12]} />
          </mesh>

          {/* Octagonal Polished Slate Walls */}
          <mesh castShadow receiveShadow position={[0, 0.4 + h / 2, 0]} material={materials.stone}>
            <cylinderGeometry args={[w / 2, w / 2 + 0.2, h, 8]} />
          </mesh>

          {/* Brass Decorative Trim Bands */}
          <mesh position={[0, 0.4 + h * 0.9, 0]} material={materials.goldTrim}>
            <cylinderGeometry args={[w / 2 + 0.05, w / 2 + 0.05, 0.15, 8]} />
          </mesh>
          <mesh position={[0, 0.4 + h * 0.1, 0]} material={materials.goldTrim}>
            <cylinderGeometry args={[w / 2 + 0.1, w / 2 + 0.1, 0.15, 8]} />
          </mesh>

          {/* Metallic Copper Observatory Dome Roof */}
          <group position={[0, 0.4 + h, 0]}>
            <mesh castShadow material={materials.copperMat}>
              <sphereGeometry args={[w / 2 + 0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* 3D Brass Telescope Tube */}
            <group position={[0, 1.2, 0.8]} rotation={[-0.7, 0, 0]}>
              <mesh castShadow material={materials.knob}>
                <cylinderGeometry args={[0.3, 0.4, 3.2, 12]} />
              </mesh>
              <mesh position={[0, 1.6, 0]} material={materials.crystalMat}>
                <cylinderGeometry args={[0.32, 0.32, 0.1, 12]} />
              </mesh>
            </group>
          </group>

          {/* 4 Corner Glowing Energy Pyramids */}
          {[
            [-w / 2, 0.4, -d / 2],
            [w / 2, 0.4, -d / 2],
            [-w / 2, 0.4, d / 2],
            [w / 2, 0.4, d / 2],
          ].map((cp, cIdx) => (
            <group key={cIdx} position={cp as [number, number, number]}>
              <mesh castShadow material={materials.goldTrim} position={[0, 1.0, 0]}>
                <boxGeometry args={[0.4, 2.0, 0.4]} />
              </mesh>
              <mesh material={materials.crystalMat} position={[0, 2.3, 0]}>
                <octahedronGeometry args={[0.35, 0]} />
              </mesh>
              <pointLight color={0x38bdf8} intensity={0.8} distance={5} position={[0, 2.3, 0]} />
            </group>
          ))}

          {/* Circular Portal Window */}
          <mesh position={[0, 0.8 + h * 0.5, d / 2 + 0.04]} material={materials.crystalMat}>
            <circleGeometry args={[0.65, 16]} />
          </mesh>

          <WallLantern position={[-1.2, 1.8, d / 2 + 0.12]} />
          <WallLantern position={[1.2, 1.8, d / 2 + 0.12]} />

          {/* Entrance Doors */}
          <group position={[0, 0.42, d / 2 + 0.04]}>
            <group ref={leftDoorRef} position={[-0.6, 0, 0]}>
              <mesh castShadow position={[0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
            <group ref={rightDoorRef} position={[0.6, 0, 0]}>
              <mesh castShadow position={[-0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
            </group>
          </group>

          {/* Interactive Signboard */}
          <group position={[0, 2.8, d / 2 + 0.12]}>
            <mesh material={materials.log} castShadow>
              <boxGeometry args={[2.8, 0.55, 0.1]} />
            </mesh>
            <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
              <div className="building-3d-sign">
                <span className="sign-icon">{icon || '⚡'}</span>
                <span className="sign-text">{name.toUpperCase()}</span>
              </div>
            </Html>
          </group>
        </group>
      </RigidBody>
    );
  }

  // ------------------------------------------------------------------------
  // 🚀 HOUSE 4: PROJECTS (Steampunk Industrial Workshop & Steam Forge)
  // ------------------------------------------------------------------------
  if (type === 'gearhouse') {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
          {/* Dark Basalt Subterranean Base Foundation */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.wallDarkIron}>
            <boxGeometry args={[w + 0.4, 2.8, d + 0.4]} />
          </mesh>

          {/* Dark Basalt & Iron Wall Structure */}
          <mesh castShadow receiveShadow position={[0, 0.4 + h / 2, 0]} material={materials.wallDarkIron}>
            <boxGeometry args={[w, h, d]} />
          </mesh>

          {/* Dark Charcoal Iron Gabled Roof */}
          <GabledRoof width={w} length={d} pitchHeight={2.2} yPos={0.4 + h} material={materials.roofDark} wallMaterial={materials.wallDarkIron} />

          {/* Dual Smoking Metal Chimneys */}
          {[-1.2, 1.2].map((cx, ci) => (
            <group key={ci} position={[cx, 0.8 + h + 1.2, -d * 0.2]}>
              <mesh castShadow material={materials.lanternFrame}>
                <cylinderGeometry args={[0.3, 0.35, 2.2, 8]} />
              </mesh>
              <mesh position={[0, 1.1, 0]} material={materials.copperMat}>
                <torusGeometry args={[0.34, 0.06, 8, 16]} />
              </mesh>
            </group>
          ))}

          {/* ⚙️ Animated Spinning Brass Gear Assembly on Façade */}
          <group ref={gearRef} position={[0, 0.8 + h + 1.1, d / 2 + 0.12]}>
            <mesh material={materials.knob} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.65, 0.65, 0.08, 12]} />
            </mesh>
            {[0, Math.PI / 3, (Math.PI * 2) / 3].map((gAngle, gi) => (
              <mesh key={gi} material={materials.goldTrim} rotation={[0, 0, gAngle]}>
                <boxGeometry args={[1.5, 0.22, 0.09]} />
              </mesh>
            ))}
          </group>

          {/* Side 8-Spoke Industrial Power Turbine Wheel */}
          <group position={[-w / 2 - 0.1, 0.4 + h * 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={materials.copperMat} castShadow>
              <torusGeometry args={[1.2, 0.12, 8, 16]} />
            </mesh>
            {[0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4].map((wAngle, wi) => (
              <mesh key={wi} material={materials.knob} rotation={[0, 0, wAngle]}>
                <boxGeometry args={[2.4, 0.1, 0.08]} />
              </mesh>
            ))}
          </group>

          <WallLantern position={[-1.2, 1.8, d / 2 + 0.12]} />
          <WallLantern position={[1.2, 1.8, d / 2 + 0.12]} />

          {/* Heavy Iron-Riveted Workshop Door */}
          <group position={[0, 0.42, d / 2 + 0.04]}>
            <group ref={leftDoorRef} position={[-0.6, 0, 0]}>
              <mesh castShadow position={[0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
              <mesh position={[0.3, 1.0, 0.05]} material={materials.lanternFrame}>
                <boxGeometry args={[0.55, 0.1, 0.02]} />
              </mesh>
            </group>
            <group ref={rightDoorRef} position={[0.6, 0, 0]}>
              <mesh castShadow position={[-0.3, 1.0, 0]} material={materials.door}>
                <boxGeometry args={[0.6, 2.0, 0.08]} />
              </mesh>
              <mesh position={[-0.3, 1.0, 0.05]} material={materials.lanternFrame}>
                <boxGeometry args={[0.55, 0.1, 0.02]} />
              </mesh>
            </group>
          </group>

          {/* Interactive Signboard */}
          <group position={[0, 2.7, d / 2 + 0.12]}>
            <mesh material={materials.log} castShadow>
              <boxGeometry args={[2.8, 0.55, 0.1]} />
            </mesh>
            <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
              <div className="building-3d-sign">
                <span className="sign-icon">{icon || '🚀'}</span>
                <span className="sign-text">{name.toUpperCase()}</span>
              </div>
            </Html>
          </group>
        </group>
      </RigidBody>
    );
  }

  // ------------------------------------------------------------------------
  // 💼 HOUSE 5: EXPERIENCE (Royal Medieval Fortress Keep & Castle)
  // ------------------------------------------------------------------------
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <group>
        {/* Granite Block Subterranean Plinth */}
        <mesh castShadow receiveShadow position={[0, -0.6, 0]} material={materials.cobble}>
          <boxGeometry args={[w + 0.6, 2.8, d + 0.6]} />
        </mesh>

        {/* Granite Fortress Main Keep Body */}
        <mesh castShadow receiveShadow position={[0, 0.4 + h / 2, 0]} material={materials.stone}>
          <boxGeometry args={[w, h + 0.2, d]} />
        </mesh>

        {/* Crenelated Stone Battlement Parapet around Roof */}
        <group position={[0, 0.4 + h + 0.2, 0]}>
          {[-w / 2 + 0.3, 0, w / 2 - 0.3].map((bx, bi) => (
            <mesh key={`b-front-${bi}`} position={[bx, 0.25, d / 2]} material={materials.stone} castShadow>
              <boxGeometry args={[0.6, 0.5, 0.2]} />
            </mesh>
          ))}
          {[-w / 2 + 0.3, 0, w / 2 - 0.3].map((bx, bi) => (
            <mesh key={`b-back-${bi}`} position={[bx, 0.25, -d / 2]} material={materials.stone} castShadow>
              <boxGeometry args={[0.6, 0.5, 0.2]} />
            </mesh>
          ))}
        </group>

        {/* Deep Crimson Roof Shingles */}
        <GabledRoof width={w - 0.4} length={d - 0.4} pitchHeight={2.0} yPos={0.4 + h + 0.2} material={materials.roofRed} wallMaterial={materials.stone} />

        {/* 4 Corner Stone Turrets with Conical Crimson Spires & Royal Flags */}
        {[
          [-w / 2 - 0.2, d / 2 + 0.2],
          [w / 2 + 0.2, d / 2 + 0.2],
          [-w / 2 - 0.2, -d / 2 - 0.2],
          [w / 2 + 0.2, -d / 2 - 0.2],
        ].map(([tx, tz], ti) => (
          <group key={ti} position={[tx, 0.4, tz]}>
            <mesh castShadow material={materials.stone} position={[0, (h + 0.6) / 2, 0]}>
              <cylinderGeometry args={[0.65, 0.65, h + 0.6, 12]} />
            </mesh>
            <mesh castShadow position={[0, h + 1.4, 0]} material={materials.roofRed}>
              <coneGeometry args={[0.85, 1.4, 12]} />
            </mesh>
            {/* Flying Royal Banner Flag */}
            <mesh position={[0, h + 2.3, 0]} material={materials.goldTrim}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
            </mesh>
            <mesh position={[0.25, h + 2.4, 0]} material={materials.roofRed}>
              <boxGeometry args={[0.45, 0.25, 0.02]} />
            </mesh>
          </group>
        ))}

        {/* Iron Portcullis Entrance Gate Frame */}
        <mesh position={[0, 1.5, d / 2 + 0.08]} material={materials.lanternFrame} castShadow>
          <boxGeometry args={[1.6, 2.4, 0.1]} />
        </mesh>

        <WallLantern position={[-1.2, 1.8, d / 2 + 0.14]} />
        <WallLantern position={[1.2, 1.8, d / 2 + 0.14]} />

        {/* Entrance Doors */}
        <group position={[0, 0.42, d / 2 + 0.04]}>
          <group ref={leftDoorRef} position={[-0.6, 0, 0]}>
            <mesh castShadow position={[0.3, 1.0, 0]} material={materials.door}>
              <boxGeometry args={[0.6, 2.0, 0.08]} />
            </mesh>
          </group>
          <group ref={rightDoorRef} position={[0.6, 0, 0]}>
            <mesh castShadow position={[-0.3, 1.0, 0]} material={materials.door}>
              <boxGeometry args={[0.6, 2.0, 0.08]} />
            </mesh>
          </group>
        </group>

        {/* Interactive Signboard */}
        <group position={[0, 3.2, d / 2 + 0.14]}>
          <mesh material={materials.log} castShadow>
            <boxGeometry args={[2.8, 0.55, 0.1]} />
          </mesh>
          <Html position={[0, 0, 0.08]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="building-3d-sign">
              <span className="sign-icon">{icon || '💼'}</span>
              <span className="sign-text">{name.toUpperCase()}</span>
            </div>
          </Html>
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
  return (
    <group>
      {/* ── WINDMILL (TOP LEFT) ── */}
      <Windmill position={[-48, getTerrainHeight(-48, -62), -62]} rotation={[0, Math.PI / 4, 0]} />

      {/* ── BARN & SILO (TOP RIGHT - CONTACT AREA) ── */}
      <BarnAndSilo
        position={[44, getTerrainHeight(44, -56), -56]}
        rotation={[0, -Math.PI / 2, 0]}
        isOpen={currentModal === 'contact'}
        name="Contact Area"
        icon="📬"
      />

      {/* ── CHURCH (MIDDLE EAST - DEVELOPER WORKSHOP) ── */}
      <Church
        position={[38, getTerrainHeight(38, 18), 18]}
        rotation={[0, -Math.PI / 2, 0]}
        isOpen={currentModal === 'workshop'}
        name="Developer Workshop"
        icon="🛠️"
      />

      {/* ── HOUSE 1: ABOUT ME (NORTH WEST) ── */}
      <HandcraftedCottage
        name="About Me"
        icon="🏠"
        position={[-42, getTerrainHeight(-42, -42), -42]}
        rotation={[0, Math.PI / 2, 0]}
        isOpen={currentModal === 'home'}
        isNight={isNight}
        type="cottage"
      />

      {/* ── HOUSE 2: EDUCATION (NORTH CENTER) ── */}
      <HandcraftedCottage
        name="Education"
        icon="🎓"
        position={[8, getTerrainHeight(8, -36), -36]}
        rotation={[0, 0, 0]}
        isOpen={currentModal === 'school'}
        isNight={isNight}
        type="school"
      />

      {/* ── HOUSE 3: SKILLS (EAST) ── */}
      <HandcraftedCottage
        name="Skills"
        icon="⚡"
        position={[44, getTerrainHeight(44, -8), -8]}
        rotation={[0, -Math.PI / 2, 0]}
        isOpen={currentModal === 'tech'}
        isNight={isNight}
        type="dome"
      />

      {/* ── HOUSE 4: PROJECTS (WEST) ── */}
      <HandcraftedCottage
        name="Projects"
        icon="🚀"
        position={[-42, getTerrainHeight(-42, -10), -10]}
        rotation={[0, Math.PI / 2, 0]}
        isOpen={currentModal === 'projects'}
        isNight={isNight}
        type="gearhouse"
      />

      {/* ── HOUSE 5: EXPERIENCE (SOUTH WEST NEAR RIVER) ── */}
      <HandcraftedCottage
        name="Experience"
        icon="💼"
        position={[-42, getTerrainHeight(-42, 25), 25]}
        rotation={[0, Math.PI / 2, 0]}
        isOpen={currentModal === 'experience'}
        isNight={isNight}
        type="castle"
      />
    </group>
  );
}



