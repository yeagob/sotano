export interface HurtFrom { readonly x: number; readonly z: number }

export interface HurtKnock { readonly vx: number; readonly vy: number; readonly vz: number }

export interface HurtBody { readonly x: number; readonly z: number; readonly vy: number }

export const HURT_PUSH = 4;
export const HURT_HOP = 4.5;
export const HURT_FLINCH = 1.5;
export const HURT_SWIM = 0.5;
export const HURT_NEAR = 0.2;
export const HURT_PAN = 0.6;

export function hurtAway(body: HurtBody, from: HurtFrom | null): { x: number; z: number } | null {
  if (!from) return null;
  const dx = body.x - from.x, dz = body.z - from.z, d = Math.hypot(dx, dz);
  return d < HURT_NEAR ? null : { x: dx / d, z: dz / d };
}

export function hurtKnock(body: HurtBody, from: HurtFrom | null, wishX: number, wishZ: number, scale = 1, swimming = false): HurtKnock {
  if (!(scale > 0)) return { vx: 0, vy: 0, vz: 0 };
  const k = scale * (swimming ? HURT_SWIM : 1);
  const away = hurtAway(body, from);
  const wish = Math.hypot(wishX, wishZ);
  const hx = away ? away.x * HURT_PUSH : wish > 0 ? -wishX / wish * HURT_FLINCH : 0;
  const hz = away ? away.z * HURT_PUSH : wish > 0 ? -wishZ / wish * HURT_FLINCH : 0;
  return { vx: hx * k, vy: Math.max(0, HURT_HOP * k - body.vy), vz: hz * k };
}

export function hurtAngle(body: HurtBody, yaw: number, from: HurtFrom | null): number | null {
  const away = hurtAway(body, from);
  if (!away) return null;
  const tx = -away.x, tz = -away.z;
  const ahead = -Math.sin(yaw) * tx - Math.cos(yaw) * tz;
  const right = Math.cos(yaw) * tx - Math.sin(yaw) * tz;
  return Math.atan2(right, ahead);
}

export function hurtEdge(angle: number): { x: number; y: number } {
  const s = Math.sin(angle), c = Math.cos(angle);
  const k = 50 / Math.max(Math.abs(s), Math.abs(c));
  return { x: 50 + s * k, y: 50 - c * k };
}

export function hurtPan(angle: number | null): number {
  return angle === null ? 0 : Math.sin(angle) * HURT_PAN;
}

export function hotFrom(x: number, z: number, hot: (cx: number, cz: number) => boolean): HurtFrom | null {
  const fx = Math.floor(x), fz = Math.floor(z);
  let sx = 0, sz = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!hot(fx + dx, fz + dz)) continue;
    sx += dx; sz += dz; n++;
  }
  if (n === 0) return null;
  const ox = sx / n, oz = sz / n;
  return Math.hypot(ox, oz) < HURT_NEAR ? null : { x: x + ox, z: z + oz };
}
