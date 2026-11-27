import { MAT } from '../content/materials';
import { hash3 } from '../core/rng';

export const RELIEF_RAMP = 96;
export const RELIEF_LOW = -10;
export const RELIEF_HIGH = 13;
export const SEA = 0;
export const LAVA_TOP = -22;
export const LAVA_FLOOR = -30;
export const BEDROCK = LAVA_FLOOR - 1;
export const TRAP_DEPTH = 10;
export const SHAFT_HALF = 4;
export const TREE_CHANCE = 0.012;
export const BUSH_CHANCE = 0.03;
const TRUNK_MIN = 4;
export const TREE_REACH = 2;
export const ROOT_NONE = 0;
export const ROOT_TREE = 1;
export const ROOT_BUSH = 2;

function vnoise(seed: number, x: number, z: number): number {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash3(seed, xi, 0, zi), b = hash3(seed, xi + 1, 0, zi), c = hash3(seed, xi, 0, zi + 1), d = hash3(seed, xi + 1, 0, zi + 1);
  const low = a + (b - a) * u, high = c + (d - c) * u;
  return low + (high - low) * v;
}

function fbm(seed: number, x: number, z: number): number {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { s += amp * vnoise(seed + i * 0x9e37, x * f, z * f); f *= 2.03; amp *= 0.5; }
  return s / 0.9375;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export function reliefRamp(r: number, edge: number): number {
  return smooth(edge, edge + RELIEF_RAMP, r);
}

export function groundHeight(seed: number, x: number, z: number, ramp: number): number {
  const n = fbm(seed, x * 0.012 + 3.1, z * 0.012 - 7.7);
  const m = fbm(seed ^ 0x51, x * 0.045, z * 0.045);
  const h = ramp * ((n - 0.42) * 20 + (m - 0.5) * 3);
  return Math.max(RELIEF_LOW, Math.min(RELIEF_HIGH, Math.round(h)));
}

export function rootRoll(seed: number, x: number, z: number): number {
  return hash3(seed ^ 0x7f1, x, 3, z);
}

export function rootOf(roll: number, top: number, steep: number): number {
  if (top < 1 || steep > 1) return ROOT_NONE;
  if (roll < TREE_CHANCE) return ROOT_TREE;
  if (roll < TREE_CHANCE + BUSH_CHANCE) return ROOT_BUSH;
  return ROOT_NONE;
}

export const ROOT_CHANCE = TREE_CHANCE + BUSH_CHANCE;

export function trunkOf(seed: number, x: number, z: number): number {
  return TRUNK_MIN + Math.floor(hash3(seed ^ 0x3c1, x, 5, z) * 3);
}

export function canopyAt(dx: number, dy: number, dz: number): boolean {
  if (dy < -2 || dy > 1 || Math.abs(dx) > TREE_REACH || Math.abs(dz) > TREE_REACH) return false;
  const r2 = dx * dx + dz * dz;
  if (dy === -2 || dy === 1) return r2 <= 2;
  return r2 <= 5;
}

export function topMaterial(top: number, flat: boolean): number {
  if (top < SEA) return MAT.loam;
  return flat ? MAT.grass : MAT.stone;
}
