// The sealed-room watchdog (issue #301, docs/architecture/ROOMS.md "Sealing and clearing"). A room
// clears when the last of its hostile projections is gone (Game.updateCombat). If one of them can no
// longer be reached, the doors would stay shut for good, with nothing left to shoot. The causes found
// are fixed where they start (a hiding projection that never came out, a body buried in blocks), and
// this is the safety net for any cause still unknown: every few seconds, each sealed room on its last
// wave is recounted from the real state, and the projections nobody can reach are released.

import { boxHits } from '../physics/voxel-collide';
import type { Enemy } from '../enemies/types';

/**
 * Seconds between two recounts. Two seconds is longer than any honest stall the rules make (a body
 * is freed from blocks on the frame it is caught, a hiding Avoidance peeks within half a second of
 * the player coming close), so a living fight is never cut short, and short enough that a player in
 * a room with nothing left barely notices the wait. A recount reads only that room's projections, so
 * nothing scans the world every frame.
 */
export const ROOM_WATCHDOG_INTERVAL = 2;

/** The watchdog's beat: true on the step a recount is due, once every ROOM_WATCHDOG_INTERVAL seconds. */
export class RecountClock {
  private t = 0;
  tick(dt: number): boolean {
    this.t += dt;
    if (this.t < ROOM_WATCHDOG_INTERVAL) return false;
    this.t = 0;
    return true;
  }
}

/** A projection this far under its room's floor (blocks) has fallen out of it, below the slab to the floor beneath. */
export const LOST_BELOW = 8;

type Solid = (x: number, y: number, z: number) => boolean;

/** Why a projection that keeps its room shut cannot be reached, or null when it can. */
export function unreachable(e: Enemy, roomY0: number, solid: Solid): 'buried' | 'fallen' | null {
  const b = e.body;
  if (b.y < roomY0 - LOST_BELOW) return 'fallen';
  // a ghost passes through walls by design: inside one, it is still on its way out
  if (!e.ghost && e.spawning <= 0 && boxHits(solid, b.x, b.y, b.z, b.hw, b.h)) return 'buried';
  return null;
}

/**
 * The projections to release from a room that has nothing else left: every projection still keeping
 * it shut, when none of them can be reached. Empty when the room has none, or when at least one can
 * still be reached (then the fight goes on and nothing is released).
 */
export function strandedIn(blocking: Enemy[], roomY0: number, solid: Solid): { e: Enemy; why: 'buried' | 'fallen' }[] {
  const out: { e: Enemy; why: 'buried' | 'fallen' }[] = [];
  for (const e of blocking) {
    const why = unreachable(e, roomY0, solid);
    if (!why) return [];
    out.push({ e, why });
  }
  return out;
}
