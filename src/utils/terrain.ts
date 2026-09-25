/**
 * Natural Terrain Height Function with Carved Water Basins
 * Computes elevation for natural rolling terrain with random humps and carved-out pond basins & riverbeds.
 */

// Water Surface Level Constants
export const WATER_SURFACE_Y = 0.35;

// Randomly distributed natural humps / hills across the map footprint (offset away from ponds)
const humps = [
  { cx: -32, cz: -32, height: 2.2, sigmaSq: 420 },
  { cx: 32, cz: -22, height: 1.9, sigmaSq: 380 },
  { cx: -34, cz: 12, height: 2.1, sigmaSq: 450 },
  { cx: 28, cz: 18, height: 1.8, sigmaSq: 360 },
  { cx: -42, cz: -58, height: 2.3, sigmaSq: 480 },
  { cx: 42, cz: -52, height: 1.9, sigmaSq: 400 },
  { cx: 36, cz: -8, height: 2.0, sigmaSq: 390 },
  { cx: -38, cz: -8, height: 1.7, sigmaSq: 350 },
  { cx: 12, cz: -42, height: 1.8, sigmaSq: 370 },
  { cx: -18, cz: -14, height: 1.5, sigmaSq: 300 },
  // Extended humps for wider outer land terrain
  { cx: -75, cz: -45, height: 2.4, sigmaSq: 520 },
  { cx: -80, cz: 20, height: 2.1, sigmaSq: 500 },
  { cx: -70, cz: -78, height: 2.5, sigmaSq: 540 },
  { cx: 75, cz: -45, height: 2.2, sigmaSq: 510 },
  { cx: 80, cz: 25, height: 2.0, sigmaSq: 490 },
  { cx: 70, cz: -78, height: 2.4, sigmaSq: 530 },
  { cx: -85, cz: 60, height: 2.2, sigmaSq: 480 },
  { cx: 85, cz: 60, height: 2.1, sigmaSq: 470 },
];

// Building Foundation Pads for Level Ground under Structures
const BUILDING_PADS = [
  { cx: -48, cz: -62, radius: 5.5 }, // Windmill
  { cx: 44, cz: -56, radius: 8.0 },  // Barn & Silo
  { cx: 38, cz: 18, radius: 6.5 },   // Church / Workshop
  { cx: -42, cz: -42, radius: 6.0 }, // About Me
  { cx: 8, cz: -36, radius: 6.0 },   // Education
  { cx: 44, cz: -8, radius: 6.0 },   // Skills
  { cx: -42, cz: -10, radius: 6.0 }, // Projects
  { cx: -42, cz: 25, radius: 6.0 },  // Experience
  { cx: 0, cz: 0, radius: 3.5 },     // Center Well Plaza
];

export function getRawTerrainHeight(x: number, z: number): number {
  let humpElevation = 0;
  for (let i = 0; i < humps.length; i++) {
    const h = humps[i];
    const dx = x - h.cx;
    const dz = z - h.cz;
    humpElevation += h.height * Math.exp(-(dx * dx + dz * dz) / h.sigmaSq);
  }

  const wave1 = 0.35 * Math.sin(x * 0.06 + 0.8) * Math.cos(z * 0.05 - 0.4);
  const wave2 = 0.22 * Math.sin(x * 0.11 - z * 0.09 + 1.5);
  const wave3 = 0.12 * Math.cos(x * 0.18 + z * 0.14);

  return humpElevation + wave1 + wave2 + wave3;
}

export function getTerrainHeight(x: number, z: number): number {
  const rawH = getRawTerrainHeight(x, z);

  // 1. Flatten terrain under building foundation pads
  for (let i = 0; i < BUILDING_PADS.length; i++) {
    const pad = BUILDING_PADS[i];
    const dist = Math.hypot(x - pad.cx, z - pad.cz);
    const blendWidth = 3.0; // Smooth transition zone around pad
    if (dist < pad.radius + blendWidth) {
      const centerH = getRawTerrainHeight(pad.cx, pad.cz);
      if (dist <= pad.radius) {
        return centerH;
      } else {
        const t = (dist - pad.radius) / blendWidth;
        const smoothT = t * t * (3 - 2 * t);
        return centerH + (rawH - centerH) * smoothT;
      }
    }
  }

  // 2. Carve Recreation Pond Basin (Center: x=-8, z=32, Radius: 11.5)
  const dRec = Math.hypot(x - (-8), z - 32);
  const recRadius = 11.5;
  const recBank = 3.5; // Shore transition width
  if (dRec < recRadius + recBank) {
    const targetY = 0.05; // Underwater basin bed height
    if (dRec <= recRadius - 2.0) {
      return targetY;
    } else {
      const t = (dRec - (recRadius - 2.0)) / (recBank + 2.0);
      const smoothT = t * t * (3 - 2 * t); // Smooth S-curve transition
      return targetY + (rawH - targetY) * smoothT;
    }
  }

  // 3. Carve North Pond Basin (Center: x=20, z=-62, Radius: 8.0)
  const dNorth = Math.hypot(x - 20, z - (-62));
  const northRadius = 8.0;
  const northBank = 3.0;
  if (dNorth < northRadius + northBank) {
    const targetY = 0.05;
    if (dNorth <= northRadius - 1.5) {
      return targetY;
    } else {
      const t = (dNorth - (northRadius - 1.5)) / (northBank + 1.5);
      const smoothT = t * t * (3 - 2 * t);
      return targetY + (rawH - targetY) * smoothT;
    }
  }

  // 4. Carve South River Trench (z > 52.5, x between -115 and 115)
  if (z > 52.0 && x > -115 && x < 115) {
    const targetY = 0.05;
    const edgeDist = Math.min(x - (-115), 115 - x, z - 52.0);
    if (edgeDist > 3.0) {
      return targetY;
    } else {
      const t = Math.max(0, edgeDist) / 3.0;
      const smoothT = t * t * (3 - 2 * t);
      return rawH + (targetY - rawH) * smoothT;
    }
  }

  return rawH;
}

/**
 * Computes terrain surface normal at (x, z) using finite differences
 */
export function getTerrainNormal(x: number, z: number, delta: number = 0.1): [number, number, number] {
  const hL = getTerrainHeight(x - delta, z);
  const hR = getTerrainHeight(x + delta, z);
  const hD = getTerrainHeight(x, z - delta);
  const hU = getTerrainHeight(x, z + delta);

  const dx = (hR - hL) / (2 * delta);
  const dz = (hU - hD) / (2 * delta);

  const len = Math.sqrt(dx * dx + 1 + dz * dz);
  return [-dx / len, 1 / len, -dz / len];
}
