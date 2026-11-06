// A headless walker: the real Player, driven toward waypoints with its own walk and jump, against any solid test.
// It proves a route is walkable with the game's physics (no air jumps, base stats), not only by a graph.

import { BASE_STATS } from '../../src/core/stats';
import { Player } from '../../src/entities/player';
import type { Input } from '../../src/input/input';

export type Solid = (x: number, y: number, z: number) => boolean;
/** A point to reach: feet height `y` (the top of the block stood on), centre (x, z). */
export interface Waypoint { x: number; y: number; z: number }

const DT = 1 / 60;
/** Seconds the walker may take to reach one waypoint before the route is called unwalkable. */
const LEG_TIMEOUT = 8;

export interface WalkResult { ok: boolean; reached: number; at: { x: number; y: number; z: number } }

/** Spawns a player at `from` and walks it through `route` in order. `ok` is true when every waypoint was stood on. */
export function walkRoute(solid: Solid, from: Waypoint, route: readonly Waypoint[]): WalkResult {
  const p = new Player();
  p.spawnAt(from.x, from.y, from.z);
  p.body.onGround = true;
  const pressed = new Set<string>();
  const move = { x: 0, y: 0 };
  const input = { hit: (a: string) => pressed.has(a), held: (a: string) => pressed.has(a), move, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
  const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => v };
  const stats = { ...BASE_STATS };
  const b = p.body;
  for (let i = 0; i < route.length; i++) {
    const w = route[i];
    let t = 0, stuck = 0;
    for (;;) {
      const dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz);
      if (d < 0.3 && b.onGround && Math.abs(b.y - w.y) < 0.3) break;
      if ((t += DT) > LEG_TIMEOUT) return { ok: false, reached: i, at: { x: b.x, y: b.y, z: b.z } };
      p.yaw = Math.atan2(-dx, -dz);
      move.y = d < 0.05 ? 0 : Math.min(1, d * 1.5);
      pressed.clear();
      const up = w.y > b.y + 0.2;
      const slow = Math.hypot(b.vx, b.vz) < 0.2 && d > 0.3;
      stuck = slow && b.onGround ? stuck + DT : 0;
      if (b.onGround && ((up && d < 1.8) || stuck > 0.15)) pressed.add('jump');
      p.update(DT, input, stats, solid, hooks);
    }
  }
  return { ok: true, reached: route.length, at: { x: b.x, y: b.y, z: b.z } };
}
