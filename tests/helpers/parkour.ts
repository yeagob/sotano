// A headless parkour runner: the real Player, at base stats (one ground jump, no practices), driven from one target to
// the next. It runs toward the target and jumps when the ground ahead ends or the target is a block up and close; it can
// wait before a hop until the hop's target is ready (a moving or pulsing piece), and it swims up when its head is under
// water. A `tick` runs before every physics step (the branch courses move there), so the world may change as it goes.

import { ELEMENTS, elemKind } from '../../src/content/elements';
import { BASE_STATS } from '../../src/core/stats';
import { Player, type PlayerMedium } from '../../src/entities/player';
import type { Input } from '../../src/input/input';
import type { Body } from '../../src/physics/voxel-collide';

export type Solid = (x: number, y: number, z: number) => boolean;
export interface Point { x: number; y: number; z: number }
/** A target: where to stand (feet), or a live one recomputed each frame; `ready` holds the hop until it says go. */
export interface Target { at: Point | ((t: number) => Point); ready?: (t: number, b: Body) => boolean; swim?: boolean }

export const DT = 1 / 60;
const LEG_TIMEOUT = 20;

export interface ParkourResult { ok: boolean; reached: number; at: Point; time: number }

export function parkour(solid: Solid, from: Point, route: readonly Target[], opts: {
  tick?: (t: number, dt: number, b: Body) => void;
  elem?: (x: number, y: number, z: number) => number;
} = {}): ParkourResult {
  const p = new Player();
  p.spawnAt(from.x, from.y, from.z);
  p.body.onGround = true;
  const pressed = new Set<string>();
  const move = { x: 0, y: 0 };
  const input = { hit: (a: string) => pressed.has(a), held: (a: string) => pressed.has(a), move, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
  const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => v };
  const b = p.body;
  const el = (x: number, y: number, z: number) => {
    const k = opts.elem ? elemKind(opts.elem(Math.floor(x), Math.floor(y), Math.floor(z))) : 0;
    return k ? ELEMENTS[k] : null;
  };
  let t = 0;
  let prev: Point | null = null, stuck = 0;
  for (let i = 0; i < route.length; i++) {
    const r = route[i];
    let leg = 0, committed = false;
    for (;;) {
      const w = typeof r.at === 'function' ? r.at(t) : r.at;
      const dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz);
      // there, or past it a block up (a hop that carried on to the next step)
      if (b.onGround && ((d < 0.35 && Math.abs(b.y - w.y) < 0.3) || (d < 0.8 && b.y > w.y + 0.7 && b.y < w.y + 1.3))) { prev = { x: b.x, y: b.y, z: b.z }; break; }
      if ((leg += DT) > LEG_TIMEOUT) return { ok: false, reached: i, at: { x: b.x, y: b.y, z: b.z }, time: t };
      const medium: PlayerMedium = { feet: el(b.x, b.y + 0.1, b.z), head: el(b.x, b.y + p.eyeHeight, b.z) };
      pressed.clear();
      // once it has left the ground for this target, the hop is made: no more waiting
      if (!b.onGround) committed = true;
      const waiting = b.onGround && !committed && !!r.ready && !r.ready(t, b);
      // while it waits, it keeps to the middle of where it stands, so the hop gets its run-up
      if (waiting && prev) {
        const ex = prev.x - b.x, ez = prev.z - b.z, e = Math.hypot(ex, ez);
        p.yaw = Math.atan2(-ex, -ez);
        move.y = e < 0.15 ? 0 : Math.min(1, e * 2);
      } else {
        p.yaw = Math.atan2(-dx, -dz);
        // full speed through every target but the last, as a player runs a course
        move.y = waiting || d < 0.05 ? 0 : i < route.length - 1 ? 1 : Math.min(1, d * 2);
      }
      if (!waiting) {
        const swimming = !!medium.head?.swim || !!medium.feet?.swim;
        if (r.swim && swimming && b.y < w.y + 0.3) {
          pressed.add('jump');
          // in the column: hold still sideways until the feet are over the step
          if (b.y < w.y + 0.1) move.y = 0;
        } else if (b.onGround) {
          const ux = d > 0 ? dx / d : 0, uz = d > 0 ? dz / d : 0;
          const ahead = (k: number) => solid(Math.floor(b.x + ux * k), Math.floor(b.y - 0.5), Math.floor(b.z + uz * k));
          const step = (k: number) => solid(Math.floor(b.x + ux * k), Math.floor(b.y + 0.5), Math.floor(b.z + uz * k));
          // walking into a step: jump onto it
          stuck = Math.hypot(b.vx, b.vz) < 0.2 && d > 0.4 ? stuck + DT : 0;
          if (stuck > 0.15) pressed.add('jump');
          // jump at the edge (the ground ahead ends), or onto a block just in front at the feet's height
          if ((d > 0.6 && !ahead(0.32) && w.y > b.y - 2.5) || (w.y > b.y + 0.2 && step(0.5))) pressed.add('jump');
        }
      }
      opts.tick?.(t, DT, b);
      p.update(DT, input, BASE_STATS, solid, hooks, medium);
      t += DT;
    }
  }
  return { ok: true, reached: route.length, at: { x: b.x, y: b.y, z: b.z }, time: t };
}
