import * as THREE from 'three';

// Utility to build a 16x16 or 32x32 CanvasTexture with NearestFilter for classic pixelated Minecraft look
function createCanvasTexture(
  drawPixel: (x: number, y: number) => string,
  repeatX = 1,
  repeatY = 1,
  size = 16
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = drawPixel(x, y);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

// 1. Mud Bricks Texture (Authentic Minecraft Mud Bricks)
export const mudBrickTexture = createCanvasTexture((x, y) => {
  const isHorizontalMortar = y % 4 === 0;
  const row = Math.floor(y / 4);
  const isVerticalMortar = row % 2 === 0 
    ? (x === 0 || x === 8) 
    : (x === 4 || x === 12);

  if (isHorizontalMortar || isVerticalMortar) {
    return '#3a2418';
  }

  const seed = (x * 7 + y * 13 + row * 5) % 5;
  const shades = ['#7f5741', '#714c38', '#63422e', '#8d634a', '#573826'];
  return shades[seed];
}, 8, 8);

// 2. Cobblestone Texture (Detailed grey stone blocks with dark mortar joints)
export const cobblestoneTexture = createCanvasTexture((x, y) => {
  const isMortar = x === 0 || y === 0 || x === 15 || y === 15 || (x % 7 === 0 && y % 5 === 0);
  if (isMortar) {
    return '#3d3d42';
  }
  const seed = (x * 11 + y * 17) % 6;
  const shades = ['#88888e', '#727278', '#9d9da3', '#5e5e64', '#7c7c82', '#67676d'];
  return shades[seed];
}, 4, 4);

// 3. Stone Bricks Texture (Minecraft Chiseled Stone Bricks)
export const stoneBrickTexture = createCanvasTexture((x, y) => {
  const isHorizontalMortar = y % 4 === 0;
  const row = Math.floor(y / 4);
  const isVerticalMortar = row % 2 === 0 ? (x === 0 || x === 8) : (x === 4 || x === 12);
  if (isHorizontalMortar || isVerticalMortar) {
    return '#333336';
  }
  const seed = (x * 3 + y * 7) % 5;
  const shades = ['#84848a', '#74747a', '#95959c', '#646469', '#7a7a80'];
  return shades[seed];
}, 4, 4);

// 4. Oak Log Bark Texture (Rich brown bark with vertical bark ridges and grain noise)
export const oakLogTexture = createCanvasTexture((x, y) => {
  const isDeepRidge = x === 0 || x === 4 || x === 8 || x === 12;
  const isMidRidge = x === 2 || x === 6 || x === 10 || x === 14;
  
  if (isDeepRidge) {
    return '#3d2512'; // Deep bark fissure
  }
  if (isMidRidge) {
    return '#4e3118'; // Secondary bark shadow
  }
  const noise = (x * 7 + y * 13) % 4;
  const colors = ['#6e4a29', '#5c3d20', '#7b5430', '#634224'];
  return colors[noise];
}, 2, 8);

// 5. Oak Planks Texture (Warm golden-brown wood planks with horizontal joint lines)
export const oakPlankTexture = createCanvasTexture((x, y) => {
  const isJoint = y % 4 === 0 || ((y < 4 && x === 8) || (y >= 4 && y < 8 && x === 0) || (y >= 8 && y < 12 && x === 12) || (y >= 12 && x === 4));
  if (isJoint) {
    return '#5a3d1f';
  }
  const noise = (x * 5 + y * 13) % 4;
  const colors = ['#af8048', '#a0733e', '#be8c52', '#aa7a44'];
  return colors[noise];
}, 2, 2);

// 6. Minecraft Red Brick Texture
export const brickTexture = createCanvasTexture((x, y) => {
  const isMortar = y % 8 === 0 || y % 8 === 7 || (y < 8 && x % 8 === 0) || (y >= 8 && (x + 4) % 8 === 0);
  if (isMortar) {
    return '#a09b96';
  }
  const noise = (x * 7 + y * 3) % 3;
  return noise === 0 ? '#913c30' : noise === 1 ? '#7d3026' : '#a0483a';
}, 4, 4);

// 7. Grass Top Texture (Rich vibrant green meadow)
export const grassTopTexture = createCanvasTexture((x, y) => {
  const seed = (x * 13 + y * 29) % 4;
  const greens = ['#388e3c', '#34913c', '#43a047', '#2e7d32'];
  return greens[seed];
}, 200, 200);

// 8. Minecraft Dirt Texture (Earthy brown dirt block)
export const dirtTexture = createCanvasTexture((x, y) => {
  const seed = (x * 17 + y * 31) % 5;
  const earths = ['#866043', '#77543a', '#956c4c', '#684931', '#7d593e'];
  return earths[seed];
}, 16, 16);

// 8b. Muddy Road Trail Texture (Earthy brown wet mud path with soil texture, damp wheel ruts, and small pebbles)
export const mudPathTexture = createCanvasTexture((x, y) => {
  const isPebble = (x === 3 && y === 5) || (x === 11 && y === 2) || (x === 7 && y === 12) || (x === 14 && y === 9);
  if (isPebble) {
    return '#7a6d60';
  }
  const isRut = x === 4 || x === 5 || x === 10 || x === 11;
  if (isRut && (y % 3 !== 0)) {
    return '#3a2313';
  }
  const seed = (x * 19 + y * 37) % 6;
  const mudShades = ['#5a3a22', '#4e311b', '#68452b', '#422815', '#52341d', '#5f3f27'];
  return mudShades[seed];
}, 8, 8);

// 9. Wooden Crate Texture
export const crateTexture = createCanvasTexture((x, y) => {
  const isBorder = x === 0 || y === 0 || x === 15 || y === 15 || x === 1 || y === 1 || x === 14 || y === 14;
  const isDiagonal = Math.abs(x - y) <= 1 || Math.abs((15 - x) - y) <= 1;

  if (isBorder || isDiagonal) {
    return '#4a301a';
  }
  const seed = (x * 5 + y * 9) % 4;
  const planks = ['#a57548', '#94663c', '#b38252', '#865b32'];
  return planks[seed];
}, 1, 1);

// 10. Wooden Barrel Texture
export const barrelTexture = createCanvasTexture((x, y) => {
  const isIronHoop = y === 3 || y === 4 || y === 11 || y === 12;
  if (isIronHoop) {
    return '#3c3d42';
  }
  const isStaveJoint = x === 0 || x === 4 || x === 8 || x === 12;
  if (isStaveJoint) {
    return '#3f2817';
  }
  const seed = (x * 7 + y * 3) % 3;
  const wood = ['#875932', '#764d29', '#96653c'];
  return wood[seed];
}, 1, 1);

// 11. Cobblestone Path Texture (Cozy stone cobbles with warm mortar joints - Scaled for Wide Road)
export const cobblestonePathTexture = createCanvasTexture((x, y) => {
  // Staggered stone flagstone pattern with distinct stone bounds & color variation
  const isMortar = x % 4 === 0 || y % 4 === 0 || (x + y) % 7 === 0;
  if (isMortar) {
    return '#3e3a36'; // Earthy dark mortar shadow
  }
  const cellX = Math.floor(x / 4);
  const cellY = Math.floor(y / 4);
  const seed = (cellX * 13 + cellY * 29 + x * 7 + y * 11) % 6;
  const stones = [
    '#9e9992', // Slate grey paver
    '#8a857e', // Medium warm stone
    '#b2ac9f', // Light granite highlight
    '#757069', // Dark basalt block
    '#948e87', // Natural river stone
    '#7f7a73', // Weathered stone paver
  ];
  return stones[seed];
}, 4, 16); // Tile 4 times across width, 16 along road length

// 12. Lush Canopy Leaf Texture (Vibrant green forest leaves with leaf details)
export const leafTexture = createCanvasTexture((x, y) => {
  const isEdgeGlint = (x % 3 === 0 && y % 3 === 0);
  const isDarkShadow = (x % 4 === 1 && y % 4 === 2);
  
  if (isEdgeGlint) {
    return '#52b738'; // Light leaf highlight
  }
  if (isDarkShadow) {
    return '#1c5e22'; // Deep shadow between leaves
  }
  const seed = (x * 11 + y * 23) % 5;
  const greens = ['#2e7d32', '#388e3c', '#256d29', '#43a047', '#318535'];
  return greens[seed];
}, 4, 4);

// 13. Stylized Roof Shingles Texture (Scalloped warm timber shingles)
export const roofShingleTexture = createCanvasTexture((x, y) => {
  const row = Math.floor(y / 4);
  const isShingleEdge = y % 4 === 3 || ((row % 2 === 0 && x % 4 === 3) || (row % 2 === 1 && (x + 2) % 4 === 3));
  if (isShingleEdge) {
    return '#3a1f10'; // Shingle shadow groove
  }
  const seed = (x * 7 + y * 13) % 4;
  const colors = ['#7c4826', '#693b1e', '#8c522b', '#5f351a'];
  return colors[seed];
}, 6, 6);

// 14. Premium Cobblestone Paved Village Road Texture (Detailed flagstone paver layout with slate mortar & stone variations)
export const cobblestonePavedRoadTexture = createCanvasTexture((x, y) => {
  // Staggered Cobble Brick Grid (bricks are ~6 pixels wide, 4 pixels tall)
  const row = Math.floor(y / 4);
  const rowOffset = (row % 2 === 0) ? 0 : 3;
  const col = Math.floor((x + rowOffset) / 6);
  
  const isHorizontalMortar = (y % 4 === 0);
  const isVerticalMortar = ((x + rowOffset) % 6 === 0);

  if (isHorizontalMortar || isVerticalMortar) {
    return '#2b2a28'; // Dark slate mortar joint
  }

  // Stone face highlighting & shade variation
  const isHighlight = (y % 4 === 1) && ((x + rowOffset) % 6 === 1);
  const isShadow = (y % 4 === 3) || ((x + rowOffset) % 6 === 5);

  const seed = (col * 17 + row * 31) % 6;
  const stoneBase = [
    '#80828a', // Slate paver
    '#92949e', // Medium stone block
    '#6e7078', // Dark basalt cobblestone
    '#a2a4ae', // Light granite highlight
    '#898b94', // Natural grey stone
    '#797b84', // Weathered cobblestone
  ][seed];

  if (isHighlight) return '#bdc0cc'; // Sunlit stone bevel edge
  if (isShadow) return '#53555c'; // Bevel drop shadow

  return stoneBase;
}, 3, 12, 32);

// 15. Dressed Stone Curbstone Texture (Smooth granite edge trim)
export const curbstoneTexture = createCanvasTexture((x, y) => {
  const isJoint = x % 8 === 0 || y % 8 === 0;
  if (isJoint) return '#3a3b40';
  const seed = (x * 5 + y * 11) % 4;
  const colors = ['#a0a2ac', '#8e909a', '#b2b4be', '#7c7e88'];
  return colors[seed];
}, 2, 8, 16);

// 16. Natural Sandy Dirt Road Texture (Fine sand & loose soil with rich earth tones, quartz grains, and organic soil noise)
export const sandyDirtRoadTexture = (() => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Multi-frequency noise for realistic fine sand & loose soil blending
      const soilNoise = Math.sin(x * 0.08 + y * 0.06) * 0.5 + 0.5; // Loose earth patches
      const rippleNoise = Math.cos(x * 0.22 - y * 0.18 + Math.sin(x * 0.05) * 2.0) * 0.5 + 0.5; // Natural sand ripples
      const grainNoise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1; // Fine sand grain spec
      const grain = Math.abs(grainNoise);

      // Base fine golden sandy dirt (RGB: 188, 148, 98)
      let r = 188;
      let g = 148;
      let b = 98;

      // Blend loose organic soil patches (darker silt earth)
      if (soilNoise > 0.45) {
        const t = (soilNoise - 0.45) / 0.55;
        r -= t * 50; // Shift to warm silt brown (138)
        g -= t * 45; // (103)
        b -= t * 40; // (58)
      }

      // Sand micro ripple light variations
      const ripple = (rippleNoise - 0.5) * 26;
      r += ripple;
      g += ripple * 0.85;
      b += ripple * 0.65;

      // Scattered fine sand grains
      if (grain > 0.84) {
        r += 28; g += 24; b += 18; // Quartz grain highlight
      } else if (grain < 0.16) {
        r -= 24; g -= 20; b -= 16; // Tiny dark soil speck
      }

      r = Math.max(0, Math.min(255, Math.floor(r)));
      g = Math.max(0, Math.min(255, Math.floor(g)));
      b = Math.max(0, Math.min(255, Math.floor(b)));

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
})();






