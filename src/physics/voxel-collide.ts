// Moves a box (player, enemies) against the grid one axis at a time, like Minecraft.

export interface Body {
  x: number; y: number; z: number;   // centre of the base (feet)
  vx: number; vy: number; vz: number;
  hw: number; h: number;             // half width and height
  onGround: boolean;
}

type Solid = (x: number, y: number, z: number) => boolean;
const EPS = 1e-4;

export function boxHits(solid: Solid, x: number, y: number, z: number, hw: number, h: number): boolean {
  const x0 = Math.floor(x - hw + EPS), x1 = Math.floor(x + hw - EPS);
  const y0 = Math.floor(y + EPS), y1 = Math.floor(y + h - EPS);
  const z0 = Math.floor(z - hw + EPS), z1 = Math.floor(z + hw - EPS);
  for (let zz = z0; zz <= z1; zz++) for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++)
    if (solid(xx, yy, zz)) return true;
  return false;
}

/** How far, in whole blocks, `freeBody` looks sideways and upward for room to stand (issue #301). */
const FREE_SIDE = 2;
const FREE_UP = 3;
/** Every cell offset `freeBody` tries, nearest first; at equal distance, straight up before sideways. */
const FREE_OFFSETS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let dy = 0; dy <= FREE_UP; dy++) for (let dx = -FREE_SIDE; dx <= FREE_SIDE; dx++) for (let dz = -FREE_SIDE; dz <= FREE_SIDE; dz++) {
    if (dx || dy || dz) out.push([dx, dy, dz]);
  }
  const cost = ([dx, dy, dz]: [number, number, number]) => Math.hypot(dx, dy, dz) + (dx || dz ? 0.01 : 0);
  return out.sort((a, b) => cost(a) - cost(b));
})();

/**
 * A body caught inside solid blocks (a block set on it, a stone landing on it, a spawn spot filled
 * while it formed) cannot move: `moveBody` backs off every step. This moves it to the nearest open
 * spot, keeping its offset in the cell, among the spots `allowed` accepts (a projection stays in its
 * room: it is never pushed through a wall). True when the body is free (it already was, or it was
 * moved); false when no open spot is in reach, and the body stays where it is.
 */
export function freeBody(solid: Solid, b: Body, allowed: (x: number, z: number) => boolean = () => true): boolean {
  if (!boxHits(solid, b.x, b.y, b.z, b.hw, b.h)) return true;
  // the lift goes to the top of the cell the feet are in, so a block set over the feet lifts it by one
  const base = Math.floor(b.y + EPS);
  for (const [dx, dy, dz] of FREE_OFFSETS) {
    const x = b.x + dx, y = base + dy, z = b.z + dz;
    if (!allowed(x, z) || boxHits(solid, x, y, z, b.hw, b.h)) continue;
    b.x = x; b.y = y; b.z = z;
    b.vx = 0; b.vy = 0; b.vz = 0;
    return true;
  }
  return false;
}

export function moveBody(solid: Solid, b: Body, dt: number, walls?: Solid) {
  b.onGround = false;
  // small substeps so nothing tunnels through blocks at high speed
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.vx), Math.abs(b.vy), Math.abs(b.vz)) * dt / 0.4));
  const h = dt / steps;
  for (let s = 0; s < steps; s++) {
    axis(solid, b, 'y', b.vy * h);
    axis(solid, b, 'x', b.vx * h, walls);
    axis(solid, b, 'z', b.vz * h, walls);
  }
}

function axis(solid: Solid, b: Body, a: 'x' | 'y' | 'z', d: number, walls?: Solid) {
  if (d === 0) return;
  const prev = b[a];
  b[a] = prev + d;
  const hit = () => boxHits(solid, b.x, b.y, b.z, b.hw, b.h) || (a !== 'y' && !!walls && boxHits(walls, b.x, b.y, b.z, b.hw, b.h));
  if (!hit()) return;
  // back off to the block's edge
  if (a === 'y') {
    b.y = d > 0 ? Math.floor(prev + b.h + d) - b.h - EPS : Math.floor(prev + d) + 1;
    if (d < 0) b.onGround = true;
    b.vy = 0;
  } else {
    const edge = d > 0 ? Math.floor(prev + b.hw + d) - b.hw - EPS : Math.floor(prev - b.hw + d) + 1 + b.hw + EPS;
    b[a] = edge;
    if (hit()) b[a] = prev; // just in case
    if (a === 'x') b.vx = 0; else b.vz = 0;
  }
  if (a === 'y' && hit()) b.y = prev;
}
