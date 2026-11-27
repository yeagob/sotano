import { EL_WATER, elemKind } from '../../content/elements';

export const WATER_PACE = 0.5;

interface WaterWorld { elemAt?(x: number, y: number, z: number): number }
interface WaterBody { x: number; y: number; z: number; h: number }

const waterAt = (w: WaterWorld, x: number, y: number, z: number): boolean =>
  elemKind(w.elemAt?.(Math.floor(x), Math.floor(y), Math.floor(z)) ?? 0) === EL_WATER;

export function inWater(w: WaterWorld | null | undefined, b: WaterBody): boolean {
  if (!w) return false;
  return waterAt(w, b.x, b.y + 0.1, b.z) || waterAt(w, b.x, b.y + b.h * 0.5, b.z);
}

export function worldOf(host: { world?: () => WaterWorld }): WaterWorld | null {
  try { return host.world?.() ?? null; } catch { return null; }
}

export const waterPace = (w: WaterWorld | null | undefined, b: WaterBody): number => (inWater(w, b) ? WATER_PACE : 1);

export function slowStep(b: { x: number; z: number; vx: number; vz: number }, x0: number, z0: number, pace: number): void {
  if (pace >= 1) return;
  b.x = x0 + (b.x - x0) * pace;
  b.z = z0 + (b.z - z0) * pace;
  b.vx *= pace;
  b.vz *= pace;
}
