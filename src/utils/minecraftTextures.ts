import * as THREE from 'three';

// Utility to build a 16x16 CanvasTexture with NearestFilter for classic pixelated Minecraft look
function createCanvasTexture(
  drawPixel: (x: number, y: number) => string,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = drawPixel(x, y);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

// 1. Cobblestone Texture (Grey stone blocks with dark mortar joints)
export const cobblestoneTexture = createCanvasTexture((x, y) => {
  const isMortar = x === 0 || y === 0 || x === 15 || y === 15 || (x % 7 === 0 && y % 5 === 0);
  if (isMortar) {
    return '#46464b';
  }
  const seed = (x * 11 + y * 17) % 5;
  const shades = ['#828287', '#6e6e73', '#96969b', '#5a5a5f', '#78787d'];
  return shades[seed];
}, 6, 6);

// 2. Oak Log Bark Texture (Dark brown bark with vertical ridges)
export const oakLogTexture = createCanvasTexture((x, y) => {
  const isRidge = x === 0 || x === 4 || x === 8 || x === 12;
  if (isRidge) {
    return '#50341c';
  }
  const noise = (x * 3 + y * 7) % 3;
  if (noise === 0) return '#734e2c';
  if (noise === 1) return '#644224';
  return '#825832';
}, 1, 4);

// 3. Oak Planks Texture (Warm golden-brown wood planks with horizontal joint lines)
export const oakPlankTexture = createCanvasTexture((x, y) => {
  const isJoint = y % 4 === 0 || ((y < 4 && x === 8) || (y >= 4 && y < 8 && x === 0) || (y >= 8 && y < 12 && x === 12) || (y >= 12 && x === 4));
  if (isJoint) {
    return '#694826';
  }
  const noise = (x * 5 + y * 13) % 4;
  const colors = ['#af8048', '#a0733e', '#be8c52', '#aa7a44'];
  return colors[noise];
}, 2, 2);

// 4. Minecraft Red Brick Texture
export const brickTexture = createCanvasTexture((x, y) => {
  const isMortar = y % 8 === 0 || y % 8 === 7 || (y < 8 && x % 8 === 0) || (y >= 8 && (x + 4) % 8 === 0);
  if (isMortar) {
    return '#a09b96';
  }
  const noise = (x * 7 + y * 3) % 3;
  return noise === 0 ? '#913c30' : noise === 1 ? '#7d3026' : '#a0483a';
}, 4, 4);

// 5. Grass Top Pixel Texture (Vibrant green pixel noise)
export const grassTopTexture = createCanvasTexture((x, y) => {
  const noise = (x * 9 + y * 13) % 4;
  const greens = ['#4c9e30', '#418c28', '#5aaf3a', '#52a532'];
  return greens[noise];
}, 30, 30);
