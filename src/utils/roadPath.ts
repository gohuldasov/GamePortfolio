export interface Point2D {
  x: number;
  z: number;
}

// Blueprint Key Locations (Enlarged 3.5x Village Map Footprint)
export const BLUEPRINT_LOCATIONS = {
  bridge: { x: -18, z: 54 },
  house5: { x: -42, z: 25, modal: 'experience', name: 'Experience', icon: '💼' },
  house4: { x: -42, z: -10, modal: 'projects', name: 'Projects', icon: '🚀' },
  house1: { x: -42, z: -42, modal: 'home', name: 'About Me', icon: '🏠' },
  windmill: { x: -48, z: -62 },
  wheatField: { x: -12, z: -58 },
  well: { x: 0, z: 0 },
  house2: { x: 8, z: -36, modal: 'school', name: 'Education', icon: '🎓' },
  northPond: { x: 20, z: -62 },
  barnSilo: { x: 44, z: -56, modal: 'contact', name: 'Contact', icon: '📬' },
  chickenCoop: { x: 44, z: -32 },
  house3: { x: 44, z: -8, modal: 'tech', name: 'Skills', icon: '⚡' },
  church: { x: 38, z: 18, modal: 'workshop', name: 'Developer Workshop', icon: '🛠️' },
  fruitOrchard: { x: 34, z: 40 },
  cartShop: { x: 22, z: 52 },
  recreationPond: { x: -8, z: 32 },
};

// Interactive Portfolio Buildings mapped from blueprint
export const PORTFOLIO_BUILDINGS = [
  BLUEPRINT_LOCATIONS.house1,
  BLUEPRINT_LOCATIONS.house2,
  BLUEPRINT_LOCATIONS.house3,
  BLUEPRINT_LOCATIONS.house4,
  BLUEPRINT_LOCATIONS.house5,
  BLUEPRINT_LOCATIONS.church,
  BLUEPRINT_LOCATIONS.barnSilo,
];

// Helper to check road X for backward compatibility if needed
export function getRoadX(z: number): number {
  if (z > 15) return -10 + (32 - z) * 0.6;
  if (z > 0) return 0;
  if (z > -20) return (z / -20) * 2;
  return -10;
}

export function getRoadAngle(z: number): number {
  return 0;
}

export function getRoadPerp(z: number): [number, number] {
  return [1, 0];
}

