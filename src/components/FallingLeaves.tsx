import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';

interface FallingLeavesProps {
  treePositions: Array<{ p: [number, number, number]; s: number; seed: number; fruit: boolean }>;
}

const LEAF_COUNT = 600;

// Create a procedurally generated leaf texture with fine leaf vein patterns & smooth alpha borders
function createProceduralLeafTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Leaf Blade Shape Path
  ctx.beginPath();
  ctx.moveTo(32, 2); // Leaf Tip
  ctx.bezierCurveTo(58, 20, 56, 44, 32, 60); // Right curved margin
  ctx.bezierCurveTo(8, 44, 6, 20, 32, 2); // Left curved margin
  ctx.closePath();

  // Leaf Fill with inner-to-outer Radial Gradient
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.7, 'rgba(240, 240, 240, 0.95)');
  grad.addColorStop(1.0, 'rgba(210, 210, 210, 0.7)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Main Central Midrib Stem Line
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(32, 62);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Lateral Secondary Veins
  const veins = [14, 24, 34, 44];
  veins.forEach((y) => {
    // Right side vein
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.quadraticCurveTo(42, y - 4, 48, y - 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Left side vein
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.quadraticCurveTo(22, y - 4, 16, y - 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Generate 3D Folded Leaf Blade Geometry with V-shaped Crease & Curved Tip
function create3DLeafGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();

  // Vertices for a 3D leaf blade folded along the center stem axis (V-shaped crease)
  // X: width (-0.12 to 0.12), Y: stem crease height fold, Z: length (-0.18 to 0.18)
  const vertices = new Float32Array([
    // Central Stem Crease (Y dips down slightly for V-crease)
    0.0, -0.02, -0.18,  // 0: Petiole Base
    0.0, -0.015, -0.06, // 1: Lower Crease
    0.0,  0.0,    0.06, // 2: Mid Crease
    0.0,  0.02,   0.18, // 3: Tip Apex

    // Left Leaf Wing (Angles upward)
   -0.09, 0.035, -0.08, // 4: Left Base
   -0.13, 0.05,   0.02, // 5: Left Mid Wide Point
   -0.07, 0.04,   0.12, // 6: Left Upper Taper

    // Right Leaf Wing (Angles upward)
    0.09, 0.035, -0.08, // 7: Right Base
    0.13, 0.05,   0.02, // 8: Right Mid Wide Point
    0.07, 0.04,   0.12, // 9: Right Upper Taper
  ]);

  const uvs = new Float32Array([
    0.5, 0.0,  0.5, 0.33, 0.5, 0.66, 0.5, 1.0,
    0.15, 0.25, 0.0, 0.55, 0.2, 0.82,
    0.85, 0.25, 1.0, 0.55, 0.8, 0.82
  ]);

  const indices = [
    // Left Wing Triangles
    0, 4, 1,   1, 4, 5,   1, 5, 2,   2, 5, 6,   2, 6, 3,
    // Right Wing Triangles
    0, 1, 7,   1, 8, 7,   1, 2, 8,   2, 9, 8,   2, 3, 9,
  ];

  geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

export default function FallingLeaves({ treePositions }: FallingLeavesProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null!);

  const leafTexture = useMemo(() => createProceduralLeafTexture(), []);
  const leafGeometry = useMemo(() => create3DLeafGeometry(), []);

  const leafMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: leafTexture,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.94,
      alphaTest: 0.15,
      shadowSide: THREE.DoubleSide,
    });
  }, [leafTexture]);

  // Particle initialization
  const particles = useMemo(() => {
    const data = [];
    const colorPalette = [
      new THREE.Color(0x2d6a4f), // Emerald Oak
      new THREE.Color(0x40916c), // Forest Green
      new THREE.Color(0x52b788), // Bright Foliage
      new THREE.Color(0xe9c46a), // Autumn Gold
      new THREE.Color(0xf4a261), // Warm Amber
      new THREE.Color(0xe76f51), // Crimson Coral
      new THREE.Color(0x9b2226), // Deep Scarlet
      new THREE.Color(0x70e000), // Fresh Spring Lime
      new THREE.Color(0xd4a373), // Cedar Bronze
    ];

    const numTrees = treePositions.length || 1;

    for (let i = 0; i < LEAF_COUNT; i++) {
      const tree = treePositions[i % numTrees];
      const tx = tree ? tree.p[0] : (Math.random() - 0.5) * 80;
      const tz = tree ? tree.p[2] : (Math.random() - 0.5) * 80;
      const terrainY = getTerrainHeight(tx, tz);

      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 3.8;
      const x = tx + Math.cos(angle) * radius;
      const z = tz + Math.sin(angle) * radius;
      const y = terrainY + 2.5 + Math.random() * 8.5;

      // Realistic aerodynamical variables
      const fallSpeed = 0.45 + Math.random() * 0.75;
      const swaySpeedX = 0.9 + Math.random() * 1.5;
      const swaySpeedZ = 0.7 + Math.random() * 1.3;
      const swayRadiusX = 0.5 + Math.random() * 1.2;
      const swayRadiusZ = 0.4 + Math.random() * 1.0;

      // Tumbling / Fluttering rotation speeds
      const rotSpeedX = (Math.random() - 0.5) * 2.5;
      const rotSpeedY = 0.8 + Math.random() * 2.2;
      const rotSpeedZ = (Math.random() - 0.5) * 3.2;

      // Spiral vortex offset
      const spiralSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
      const seed = Math.random() * 100;
      const color = colorPalette[i % colorPalette.length];
      const scale = 0.75 + Math.random() * 0.7;

      data.push({
        tx,
        tz,
        x,
        y,
        z,
        terrainY,
        fallSpeed,
        swaySpeedX,
        swaySpeedZ,
        swayRadiusX,
        swayRadiusZ,
        rotSpeedX,
        rotSpeedY,
        rotSpeedZ,
        spiralSpeed,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        seed,
        color,
        scale,
      });
    }

    return data;
  }, [treePositions]);

  useFrame(({ clock }, delta) => {
    if (!instancedMeshRef.current) return;

    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    // Global ambient wind gust drift
    const globalWindX = Math.sin(time * 0.35) * 0.8 + Math.cos(time * 0.8) * 0.3;
    const globalWindZ = Math.cos(time * 0.28) * 0.6;

    for (let i = 0; i < LEAF_COUNT; i++) {
      const p = particles[i];

      // Aerodynamic drag variation: leaves tilt and plunge faster when edge-on
      const edgeFactor = Math.abs(Math.sin(p.rotX));
      const currentFallSpeed = p.fallSpeed * (0.7 + edgeFactor * 0.6);
      p.y -= currentFallSpeed * delta;

      // Swaying wind displacement + global wind vector
      const swayX = Math.sin(time * p.swaySpeedX + p.seed) * p.swayRadiusX + globalWindX * delta * 2.0;
      const swayZ = Math.cos(time * p.swaySpeedZ + p.seed * 1.4) * p.swayRadiusZ + globalWindZ * delta * 2.0;

      // Gentle spiral drift around canopy center
      const spiralAngle = time * p.spiralSpeed + p.seed;
      const spiralX = Math.cos(spiralAngle) * 0.25;
      const spiralZ = Math.sin(spiralAngle) * 0.25;

      // Rotations for fluttering & tumbling
      p.rotX += (p.rotSpeedX + Math.sin(time * 2.0 + p.seed) * 1.5) * delta;
      p.rotY += p.rotSpeedY * delta;
      p.rotZ += (p.rotSpeedZ + Math.cos(time * 1.8 + p.seed) * 1.2) * delta;

      // Ground height check - respawn back in tree canopy
      const currentTerrainY = getTerrainHeight(p.x, p.z);
      if (p.y <= currentTerrainY + 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 + Math.random() * 3.5;
        p.x = p.tx + Math.cos(angle) * radius;
        p.z = p.tz + Math.sin(angle) * radius;
        p.y = currentTerrainY + 6.5 + Math.random() * 4.0;
        p.rotX = Math.random() * Math.PI * 2;
        p.rotZ = Math.random() * Math.PI * 2;
      }

      dummy.position.set(p.x + swayX + spiralX, p.y, p.z + swayZ + spiralZ);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      instancedMeshRef.current.setColorAt(i, p.color);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[leafGeometry, leafMaterial, LEAF_COUNT]}
      castShadow
      receiveShadow={false}
    />
  );
}

