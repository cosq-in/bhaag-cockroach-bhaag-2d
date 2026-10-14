export const Z_FAR = 100;
export const FOCAL = 20;
const HORIZON = 0.36;
const GROUND = 0.86;

export function project(lane, z, w, h) {
  const zc = Math.max(z, -2);
  const scale = 1 / (1 + zc / FOCAL);
  const horizonY = h * HORIZON;
  const groundY = h * GROUND;
  const laneW = Math.min(w * 0.3, h * 0.42);
  return {
    x: w / 2 + (lane - 1) * laneW * scale,
    y: horizonY + (groundY - horizonY) * scale,
    scale,
  };
}
