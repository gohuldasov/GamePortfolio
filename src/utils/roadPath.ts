export function getRoadX(z: number): number {
  return 8.0 * Math.sin((28 - z) * 0.08);
}

export function getRoadAngle(z: number): number {
  const dx = -8.0 * 0.08 * Math.cos((28 - z) * 0.08);
  return Math.atan2(dx, -1);
}

// Unit perpendicular vector (nx, nz) pointing to the right side of the road
export function getRoadPerp(z: number): [number, number] {
  const dx = -8.0 * 0.08 * Math.cos((28 - z) * 0.08);
  const len = Math.sqrt(dx * dx + 1.0);
  return [1.0 / len, dx / len];
}
