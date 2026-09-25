import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { mudPathTexture, dirtTexture, grassTopTexture, stoneBrickTexture, cobblestoneTexture, sandyDirtRoadTexture } from '../utils/minecraftTextures';
import { getTerrainHeight, WATER_SURFACE_Y } from '../utils/terrain';

// Helper to calculate distance from point (px, pz) to line segment (x1,z1)-(x2,z2)
function distToSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(px - x1, pz - z1);
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.hypot(px - projX, pz - projZ);
}

// High-Performance Leafy 3D Grass Meadow Component (Dense, Thick 3D Grass Blades)
function GrassMeadow() {
  const meshRef = React.useRef<THREE.InstancedMesh>(null!);

  // 1. Build a custom 8-blade grass clump geometry (smaller, neat grass height: 0.26 - 0.38m)
  const grassGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const blades = [
      { angle: 0.0,   h: 0.32, w: 0.08, bend: 0.09 },
      { angle: 0.78,  h: 0.38, w: 0.09, bend: 0.11 },
      { angle: 1.57,  h: 0.28, w: 0.07, bend: 0.08 },
      { angle: 2.35,  h: 0.35, w: 0.08, bend: 0.10 },
      { angle: 3.14,  h: 0.30, w: 0.09, bend: 0.09 },
      { angle: 3.92,  h: 0.36, w: 0.08, bend: 0.11 },
      { angle: 4.71,  h: 0.26, w: 0.07, bend: 0.07 },
      { angle: 5.49,  h: 0.34, w: 0.08, bend: 0.10 },
    ];

    let vertIndex = 0;

    blades.forEach((b) => {
      const cosA = Math.cos(b.angle);
      const sinA = Math.sin(b.angle);

      const baseW = b.w;
      const midW = b.w * 0.65;
      const hMid = b.h * 0.5;
      const bendMid = b.bend * 0.4;
      const bendTip = b.bend;

      const rawVerts = [
        { x: -baseW / 2, y: 0, z: 0, u: 0, v: 0 },
        { x: baseW / 2, y: 0, z: 0, u: 1, v: 0 },
        { x: -midW / 2, y: hMid, z: bendMid, u: 0, v: 0.5 },
        { x: midW / 2, y: hMid, z: bendMid, u: 1, v: 0.5 },
        { x: 0, y: b.h, z: bendTip, u: 0.5, v: 1.0 },
      ];

      rawVerts.forEach((v) => {
        const rx = v.x * cosA + v.z * sinA;
        const rz = -v.x * sinA + v.z * cosA;
        positions.push(rx, v.y, rz);
        normals.push(sinA * 0.5, 0.3, cosA * 0.5);
        uvs.push(v.u, v.v);
      });

      const base = vertIndex;
      indices.push(base, base + 1, base + 3);
      indices.push(base, base + 3, base + 2);
      indices.push(base + 2, base + 3, base + 4);

      vertIndex += 5;
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }, []);

  const grassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      roughness: 0.5,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }, []);

  // Dense step (0.55) across floor mat for grass carpet - height aligned to terrain elevation
  const { count, transforms, colors } = useMemo(() => {
    const pathConnections: [number, number][][] = [
      // Main Arterials
      [[-18, 54], [-20, 42], [-20, 32], [-18, 20], [-10, 10], [0, 0]],
      [[0, 0], [-14, -3], [-26, -8], [-36, -20], [-36, -34], [-38, -48], [-42, -58]],
      [[0, 0], [0, -14], [-2, -26], [-6, -45], [-8, -55], [6, -55], [20, -52]],
      [[0, 0], [14, -3], [28, -8], [36, -20], [36, -42], [38, -52]],
      [[0, 0], [14, 6], [24, 14], [28, 28], [28, 42], [22, 50]],

      // ── SUB-ROADS / DRIVEWAYS ──
      [[-36, -34], [-38.2, -42]],
      [[-26, -8], [-38.2, -10]],
      [[-20, 20], [-32, 22], [-38.2, 25]],
      [[-38, -48], [-48, -58.8]],
      [[-6, -55], [-12, -53.5]],
      [[-2, -26], [8, -32.8]],
      [[20, -52], [20, -55.0]],
      [[38, -52], [40.2, -56]],
      [[36, -42], [40.2, -32]],
      [[36, -20], [40.2, -8]],
      [[24, 14], [33.8, 18]],
      [[22, 50], [22, 49.2]],
      [[-18, 20], [-8, 20.2]],
    ];

    const listTransforms: THREE.Matrix4[] = [];
    const listColors: THREE.Color[] = [];
    const tempObj = new THREE.Object3D();

    const colorPalette = [
      new THREE.Color(0x4caf50),
      new THREE.Color(0x52c437),
      new THREE.Color(0x388e3c),
      new THREE.Color(0x66bb6a),
      new THREE.Color(0x43a047),
      new THREE.Color(0x76ff03),
      new THREE.Color(0x81c784),
    ];

    for (let gx = -104; gx <= 104; gx += 0.65) {
      for (let gz = -96; gz <= 84; gz += 0.65) {
        // Skip Recreation Pond
        const dRecPond = Math.hypot(gx - (-8), gz - 32);
        if (dRecPond < 11.5) continue;

        // Skip North Pond
        const dNorthPond = Math.hypot(gx - 20, gz - (-62));
        if (dNorthPond < 8.0) continue;

        // Skip South River
        if (gz > 52.5 && gx > -110 && gx < 110) continue;

        // Skip Center Well Plaza circle
        if (Math.hypot(gx, gz) < 8.0) continue;

        // Soft natural grass density tapering near sandy road paths
        let minDistToRoad = 999;
        for (const path of pathConnections) {
          for (let i = 0; i < path.length - 1; i++) {
            const [x1, z1] = path[i];
            const [x2, z2] = path[i + 1];
            const d = distToSegment(gx, gz, x1, z1, x2, z2);
            if (d < minDistToRoad) minDistToRoad = d;
          }
        }

        const dPlazaCore = Math.hypot(gx, gz);
        if (dPlazaCore < 5.0) continue; // Pure sandy plaza clearing core
        if (minDistToRoad < 0.9) continue; // Pure sandy road core

        // Soft edge grass density falloff between 0.9m and 2.2m from road center
        if (minDistToRoad < 2.2) {
          const pGrass = (minDistToRoad - 0.9) / 1.3;
          const randVal = Math.abs(Math.sin(gx * 31.7 + gz * 17.3));
          if (randVal > pGrass) continue;
        }

        if (dPlazaCore < 7.5) {
          const pGrass = (dPlazaCore - 5.0) / 2.5;
          const randVal = Math.abs(Math.sin(gx * 19.3 + gz * 43.1));
          if (randVal > pGrass) continue;
        }

        const jx = (Math.sin(gx * 13 + gz * 7) * 0.5 - 0.25) * 0.4;
        const jz = (Math.cos(gx * 7 + gz * 13) * 0.5 - 0.25) * 0.4;
        const scale = 0.55 + Math.abs(Math.sin(gx * 3.7 + gz * 5.3)) * 0.45;
        const rotY = Math.sin(gx * 2.1 + gz * 1.9) * Math.PI;

        const px = gx + jx;
        const pz = gz + jz;
        const py = getTerrainHeight(px, pz);

        tempObj.position.set(px, py + 0.01, pz);
        tempObj.rotation.set(0, rotY, 0);
        tempObj.scale.set(scale, scale, scale);
        tempObj.updateMatrix();

        listTransforms.push(tempObj.matrix.clone());

        const colorIdx = Math.floor(Math.abs(Math.sin(gx * 9 + gz * 17)) * colorPalette.length) % colorPalette.length;
        listColors.push(colorPalette[colorIdx]);
      }
    }

    return { count: listTransforms.length, transforms: listTransforms, colors: listColors };
  }, []);

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, transforms[i]);
      meshRef.current.setColorAt(i, colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, transforms, colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[grassGeometry, grassMaterial, count]}
      castShadow={false}
      receiveShadow={false}
    />
  );
}

export default function World() {
  const materials = useMemo(() => ({
    grassTop: new THREE.MeshStandardMaterial({ color: 0x34913c, map: grassTopTexture, roughness: 0.75 }),
    dirt: new THREE.MeshStandardMaterial({ map: dirtTexture, roughness: 0.9 }),
    mudPath: new THREE.MeshStandardMaterial({ map: mudPathTexture, roughness: 0.9, color: 0x6e4a2e }),
    sandyDirtRoad: new THREE.MeshStandardMaterial({
      map: sandyDirtRoadTexture,
      roughness: 0.92,
      metalness: 0.0,
      color: 0xffffff,
      vertexColors: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    stone: new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.7 }),
    rock: new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.8, color: 0x7c7c82 }),
    snow: new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.5 }),
    water: new THREE.MeshStandardMaterial({ color: 0x2b7da8, roughness: 0.1, transparent: true, opacity: 0.85 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xc2a66e, roughness: 0.9 }),
    pebble: new THREE.MeshStandardMaterial({ map: cobblestoneTexture, roughness: 0.85, color: 0x7a7a80 }),
    stem: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 }),
    woodFence: new THREE.MeshStandardMaterial({ color: 0x8c5e34, roughness: 0.8 }),
  }), []);

  // Custom 3D Natural Uneven Deformed Terrain Geometry (Centered Gentle Hill + Soft Contours)
  const groundGeometry = useMemo(() => {
    const size = 600;
    const segments = 200; // Smooth 200x200 grid resolution
    const halfSize = size / 2;
    const step = size / segments;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const textureRepeat = 60;

    for (let i = 0; i <= segments; i++) {
      const z = -halfSize + i * step;
      for (let j = 0; j <= segments; j++) {
        const x = -halfSize + j * step;
        const y = getTerrainHeight(x, z);

        positions.push(x, y, z);
        uvs.push((j / segments) * textureRepeat, (i / segments) * textureRepeat);
      }
    }

    const stride = segments + 1;
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * stride + j;
        const b = i * stride + (j + 1);
        const c = (i + 1) * stride + j;
        const d = (i + 1) * stride + (j + 1);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Dirt base underneath terrain to provide side depth down to y = -1.2
  const dirtGeometry = useMemo(() => {
    const size = 600;
    const segments = 100;
    const halfSize = size / 2;
    const step = size / segments;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const textureRepeat = 30;

    for (let i = 0; i <= segments; i++) {
      const z = -halfSize + i * step;
      for (let j = 0; j <= segments; j++) {
        const x = -halfSize + j * step;
        const topY = getTerrainHeight(x, z) - 0.05;

        positions.push(x, topY, z);
        uvs.push((j / segments) * textureRepeat, (i / segments) * textureRepeat);
      }
    }

    const stride = segments + 1;
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * stride + j;
        const b = i * stride + (j + 1);
        const c = (i + 1) * stride + j;
        const d = (i + 1) * stride + (j + 1);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const mountains = useMemo(() => [
    { x: -145, z: -50, r: 28, h: 44 },
    { x: -160, z: -20, r: 26, h: 38 },
    { x: -135, z: -105, r: 32, h: 50 },
    { x: 145, z: -50, r: 28, h: 44 },
    { x: 160, z: -20, r: 25, h: 36 },
    { x: 135, z: -105, r: 30, h: 48 },
    { x: 0, z: -145, r: 40, h: 56 },
    { x: -75, z: -135, r: 30, h: 45 },
    { x: 75, z: -135, r: 30, h: 45 },
  ], []);

  // Generate continuous natural sandy dirt road mesh network aligned smoothly to terrain elevation
  const { roadGeometry, plazaGeometry } = useMemo(() => {
    const pathConnections: [number, number][][] = [
      // Main Arterials
      [[-18, 54], [-20, 42], [-20, 32], [-18, 20], [-10, 10], [0, 0]],
      [[0, 0], [-14, -3], [-26, -8], [-36, -20], [-36, -34], [-38, -48], [-42, -58]],
      [[0, 0], [0, -14], [-2, -26], [-6, -45], [-8, -55], [6, -55], [20, -52]],
      [[0, 0], [14, -3], [28, -8], [36, -20], [36, -42], [38, -52]],
      [[0, 0], [14, 6], [24, 14], [28, 28], [28, 42], [22, 50]],

      // ── SUB-ROADS / DRIVEWAYS ──
      [[-36, -34], [-38.2, -42]],
      [[-26, -8], [-38.2, -10]],
      [[-20, 20], [-32, 22], [-38.2, 25]],
      [[-38, -48], [-48, -58.8]],
      [[-6, -55], [-12, -53.5]],
      [[-2, -26], [8, -32.8]],
      [[20, -52], [20, -55.0]],
      [[38, -52], [40.2, -56]],
      [[36, -42], [40.2, -32]],
      [[36, -20], [40.2, -8]],
      [[24, 14], [33.8, 18]],
      [[22, 50], [22, 49.2]],
      [[-18, 20], [-8, 20.2]],
    ];

    const roadPositions: number[] = [];
    const roadNormals: number[] = [];
    const roadUvs: number[] = [];
    const roadColors: number[] = [];
    const roadIndices: number[] = [];

    let vertOffset = 0;
    const ROAD_WIDTH = 3.8;
    const N_COLS = 7;

    // Grass terrain blend color (RGB: 0.20, 0.57, 0.24)
    const gR = 0.20, gG = 0.57, gB = 0.24;

    pathConnections.forEach((path) => {
      // 1. Resample path into fine step points
      const sampledPoints: { x: number; z: number; dist: number }[] = [];
      let totalDist = 0;

      for (let i = 0; i < path.length - 1; i++) {
        const [x1, z1] = path[i];
        const [x2, z2] = path[i + 1];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        if (segLen === 0) continue;

        const numSteps = Math.max(2, Math.ceil(segLen / 0.35));
        const startIdx = (i === 0) ? 0 : 1;
        for (let s = startIdx; s <= numSteps; s++) {
          const t = s / numSteps;
          const px = x1 + dx * t;
          const pz = z1 + dz * t;
          if (sampledPoints.length > 0) {
            const prev = sampledPoints[sampledPoints.length - 1];
            totalDist += Math.hypot(px - prev.x, pz - prev.z);
          }
          sampledPoints.push({ x: px, z: pz, dist: totalDist });
        }
      }

      if (sampledPoints.length < 2) return;

      // 2. Generate continuous cross-sections along sampled points
      const rows = sampledPoints.length;

      for (let r = 0; r < rows; r++) {
        const curr = sampledPoints[r];
        let tx = 0, tz = 0;
        if (r < rows - 1) {
          tx = sampledPoints[r + 1].x - curr.x;
          tz = sampledPoints[r + 1].z - curr.z;
        } else {
          tx = curr.x - sampledPoints[r - 1].x;
          tz = curr.z - sampledPoints[r - 1].z;
        }
        const tLen = Math.hypot(tx, tz) || 1;
        tx /= tLen;
        tz /= tLen;

        // Perpendicular vector
        const nx = -tz;
        const nz = tx;

        for (let c = 0; c < N_COLS; c++) {
          const wRatio = (c / (N_COLS - 1)) * 2 - 1; // -1 to +1
          const w = wRatio * (ROAD_WIDTH / 2);

          const vx = curr.x + nx * w;
          const vz = curr.z + nz * w;

          const baseY = getTerrainHeight(vx, vz);

          // Natural smooth wheel ruts & central crown contouring
          const centerCrown = -0.012 * Math.cos(wRatio * Math.PI);
          
          // Micro organic undulations (smooth continuous gentle unevenness, zero stairs)
          const microUndulation = 0.007 * Math.sin(vx * 3.7 + vz * 2.8) + 0.004 * Math.cos(vx * 6.8 - vz * 5.4);

          // Height offset (0.035m above terrain for crisp visibility)
          const vy = baseY + 0.035 + (centerCrown + microUndulation);

          roadPositions.push(vx, vy, vz);
          roadNormals.push(0, 1, 0);

          // UV mapping
          const u = (wRatio + 1) / 2;
          const v = curr.dist * 0.35;
          roadUvs.push(u, v);

          // Edge color blending into grass terrain
          const absW = Math.abs(wRatio);
          let rCol = 1.0, gCol = 1.0, bCol = 1.0;
          if (absW > 0.55) {
            const blendFactor = (absW - 0.55) / 0.45;
            const t = blendFactor * blendFactor * (3 - 2 * blendFactor);
            rCol = 1.0 * (1 - t) + gR * t;
            gCol = 1.0 * (1 - t) + gG * t;
            bCol = 1.0 * (1 - t) + gB * t;
          }

          roadColors.push(rCol, gCol, bCol); // Item size 3 (RGB)
        }
      }

      // 3. Connect cross-sections into quad mesh triangles
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < N_COLS - 1; c++) {
          const i0 = vertOffset + r * N_COLS + c;
          const i1 = vertOffset + r * N_COLS + (c + 1);
          const i2 = vertOffset + (r + 1) * N_COLS + c;
          const i3 = vertOffset + (r + 1) * N_COLS + (c + 1);

          roadIndices.push(i0, i2, i1);
          roadIndices.push(i1, i2, i3);
        }
      }

      vertOffset += rows * N_COLS;
    });

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    rGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    rGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    rGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
    rGeo.setIndex(roadIndices);
    rGeo.computeVertexNormals();

    // 4. Center Well Sandy Plaza Clearing (Subdivided circular mesh with soft radial terrain blend)
    const plazaPositions: number[] = [];
    const plazaNormals: number[] = [];
    const plazaUvs: number[] = [];
    const plazaColors: number[] = [];
    const plazaIndices: number[] = [];

    const PLAZA_R = 7.5;
    const R_RINGS = 8;
    const SEGS = 36;

    // Center vertex
    const centerY = getTerrainHeight(0, 0) + 0.035;
    plazaPositions.push(0, centerY, 0);
    plazaNormals.push(0, 1, 0);
    plazaUvs.push(0.5, 0.5);
    plazaColors.push(1.0, 1.0, 1.0);

    for (let ring = 1; ring <= R_RINGS; ring++) {
      const rRatio = ring / R_RINGS;
      const rad = rRatio * PLAZA_R;

      for (let s = 0; s < SEGS; s++) {
        const a = (s / SEGS) * Math.PI * 2;
        const px = Math.cos(a) * rad;
        const pz = Math.sin(a) * rad;

        const micro = 0.006 * Math.sin(px * 4.0 + pz * 3.0);
        const py = getTerrainHeight(px, pz) + 0.035 + micro;

        plazaPositions.push(px, py, pz);
        plazaNormals.push(0, 1, 0);
        plazaUvs.push(0.5 + (px / (PLAZA_R * 2)), 0.5 + (pz / (PLAZA_R * 2)));

        let rCol = 1.0, gCol = 1.0, bCol = 1.0;
        if (rRatio > 0.6) {
          const blendFactor = (rRatio - 0.6) / 0.4;
          const t = blendFactor * blendFactor * (3 - 2 * blendFactor);
          rCol = 1.0 * (1 - t) + gR * t;
          gCol = 1.0 * (1 - t) + gG * t;
          bCol = 1.0 * (1 - t) + gB * t;
        }

        plazaColors.push(rCol, gCol, bCol);
      }
    }

    // Plaza indices: Center fan
    for (let s = 0; s < SEGS; s++) {
      const nextS = (s + 1) % SEGS;
      plazaIndices.push(0, 1 + s, 1 + nextS);
    }
    // Ring quads
    for (let ring = 1; ring < R_RINGS; ring++) {
      const currRingOffset = 1 + (ring - 1) * SEGS;
      const nextRingOffset = 1 + ring * SEGS;
      for (let s = 0; s < SEGS; s++) {
        const nextS = (s + 1) % SEGS;
        const i0 = currRingOffset + s;
        const i1 = currRingOffset + nextS;
        const i2 = nextRingOffset + s;
        const i3 = nextRingOffset + nextS;

        plazaIndices.push(i0, i2, i1);
        plazaIndices.push(i1, i2, i3);
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(plazaPositions, 3));
    pGeo.setAttribute('normal', new THREE.Float32BufferAttribute(plazaNormals, 3));
    pGeo.setAttribute('uv', new THREE.Float32BufferAttribute(plazaUvs, 2));
    pGeo.setAttribute('color', new THREE.Float32BufferAttribute(plazaColors, 3));
    pGeo.setIndex(plazaIndices);
    pGeo.computeVertexNormals();

    return { roadGeometry: rGeo, plazaGeometry: pGeo };
  }, []);

  return (
    <group>
      {/* Deformed Natural Terrain Ground Layer */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={groundGeometry} receiveShadow material={materials.grassTop} />
        <mesh geometry={dirtGeometry} position={[0, -0.6, 0]} material={materials.dirt} />
      </RigidBody>

      {/* Stepped Mountain Ridges in Background */}
      {mountains.map((m, idx) => {
        const my = getTerrainHeight(m.x, m.z);
        return (
          <group key={idx} position={[m.x, my, m.z]}>
            <mesh position={[0, m.h * 0.15, 0]} material={materials.dirt} castShadow receiveShadow>
              <boxGeometry args={[m.r * 1.5, m.h * 0.3, m.r * 1.5]} />
            </mesh>
            <mesh position={[0, m.h * 0.45, 0]} material={materials.stone} castShadow receiveShadow>
              <boxGeometry args={[m.r * 1.0, m.h * 0.3, m.r * 1.0]} />
            </mesh>
            <mesh position={[0, m.h * 0.75, 0]} material={materials.stone} castShadow receiveShadow>
              <boxGeometry args={[m.r * 0.6, m.h * 0.3, m.r * 0.6]} />
            </mesh>
            <mesh position={[0, m.h - m.h * 0.05, 0]} material={materials.snow} castShadow receiveShadow>
              <boxGeometry args={[m.r * 0.35, m.h * 0.1, m.r * 0.35]} />
            </mesh>
          </group>
        );
      })}

      {/* Natural Sandy Dirt Road Ribbon Network & Sandy Plaza Clearing */}
      <mesh geometry={roadGeometry} receiveShadow material={materials.sandyDirtRoad} />
      <mesh geometry={plazaGeometry} receiveShadow material={materials.sandyDirtRoad} />

      {/* 3D Grass Meadow Field across the green floor mat */}
      <GrassMeadow />

      {/* ── RECREATION POND (SOUTH WEST CENTER - Carved Basin + Shoreline Pebbles) ── */}
      <group position={[-8, 0, 32]}>
        {/* Underwater Sand Basin Bed */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={materials.sand}>
          <circleGeometry args={[11.2, 32]} />
        </mesh>
        {/* Crisp Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_SURFACE_Y, 0]} receiveShadow material={materials.water}>
          <circleGeometry args={[11.5, 32]} />
        </mesh>
        {/* Decorative Shoreline Stone Ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const rx = Math.cos(angle) * 11.5;
          const rz = Math.sin(angle) * 11.5;
          const ry = getTerrainHeight(-8 + rx, 32 + rz);
          return (
            <mesh key={`rec-stone-${i}`} position={[rx, ry - 0.02, rz]} material={materials.pebble} castShadow>
              <dodecahedronGeometry args={[0.3 + (i % 3) * 0.1, 0]} />
            </mesh>
          );
        })}
      </group>

      {/* ── NORTH POND (TOP RIGHT CENTER - Carved Basin + Shoreline Pebbles) ── */}
      <group position={[20, 0, -62]}>
        {/* Underwater Sand Basin Bed */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={materials.sand}>
          <circleGeometry args={[7.8, 32]} />
        </mesh>
        {/* Crisp Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_SURFACE_Y, 0]} receiveShadow material={materials.water}>
          <circleGeometry args={[8.0, 32]} />
        </mesh>
        {/* Decorative Shoreline Stone Ring */}
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const rx = Math.cos(angle) * 8.0;
          const rz = Math.sin(angle) * 8.0;
          const ry = getTerrainHeight(20 + rx, -62 + rz);
          return (
            <mesh key={`north-stone-${i}`} position={[rx, ry - 0.02, rz]} material={materials.pebble} castShadow>
              <dodecahedronGeometry args={[0.28 + (i % 3) * 0.1, 0]} />
            </mesh>
          );
        })}
      </group>

      {/* ── PERIMETER BOUNDARY WOODEN FENCE ── */}
      <group>
        {/* West Boundary Fence */}
        {Array.from({ length: 39 }).map((_, i) => {
          const fz = 84 - i * 4.8;
          const fy = getTerrainHeight(-105, fz);
          return (
            <group key={`w-fence-${i}`} position={[-105, fy, fz]}>
              <mesh position={[0, 0.75, 0]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.2, 1.5, 0.2]} />
              </mesh>
              <mesh position={[0, 0.5, 2.4]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.1, 0.12, 4.8]} />
              </mesh>
              <mesh position={[0, 1.1, 2.4]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.1, 0.12, 4.8]} />
              </mesh>
            </group>
          );
        })}

        {/* East Boundary Fence */}
        {Array.from({ length: 39 }).map((_, i) => {
          const fz = 84 - i * 4.8;
          const fy = getTerrainHeight(105, fz);
          return (
            <group key={`e-fence-${i}`} position={[105, fy, fz]}>
              <mesh position={[0, 0.75, 0]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.2, 1.5, 0.2]} />
              </mesh>
              <mesh position={[0, 0.5, 2.4]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.1, 0.12, 4.8]} />
              </mesh>
              <mesh position={[0, 1.1, 2.4]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.1, 0.12, 4.8]} />
              </mesh>
            </group>
          );
        })}

        {/* North Boundary Fence */}
        {Array.from({ length: 44 }).map((_, i) => {
          const fx = -103.2 + i * 4.8;
          const fy = getTerrainHeight(fx, -100);
          return (
            <group key={`n-fence-${i}`} position={[fx, fy, -100]}>
              <mesh position={[0, 0.75, 0]} material={materials.woodFence} castShadow>
                <boxGeometry args={[0.2, 1.5, 0.2]} />
              </mesh>
              <mesh position={[2.4, 0.5, 0]} material={materials.woodFence} castShadow>
                <boxGeometry args={[4.8, 0.12, 0.1]} />
              </mesh>
              <mesh position={[2.4, 1.1, 0]} material={materials.woodFence} castShadow>
                <boxGeometry args={[4.8, 0.12, 0.1]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Physical Map Boundary Colliders */}
      <RigidBody type="fixed">
        <mesh position={[-105.5, 2.0, -5]} visible={false}>
          <boxGeometry args={[1.0, 12.0, 200]} />
        </mesh>
        <mesh position={[105.5, 2.0, -5]} visible={false}>
          <boxGeometry args={[1.0, 12.0, 200]} />
        </mesh>
        <mesh position={[0, 2.0, -100.5]} visible={false}>
          <boxGeometry args={[212, 12.0, 1.0]} />
        </mesh>
        <mesh position={[0, 2.0, 88.5]} visible={false}>
          <boxGeometry args={[212, 12.0, 1.0]} />
        </mesh>
      </RigidBody>
    </group>
  );
}




