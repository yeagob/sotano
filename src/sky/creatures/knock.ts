// The tower knock: a warning, the placed cells into loose cubes, a push off (docs/architecture/SKY.md §5.3, laws 3.8
// and 3.9). The warning runs its full length first (law 3.6): the stack shakes in motes and a rising grumble. Then
// the placed cells go top down to air and fall as loose cubes the player can gather again, and a player still on
// the column is pushed off it. Formula cells are never touched (knockTower takes placed cells only). Nothing here
// damages.

import type { SkyActor, SkyEffectsApi, SkyHost, Tower, TowerKnockApi, Vec3 } from '../types';

/** Seconds of warning before the knock. */
export const KNOCK_WARNING = 2;
/** Blocks the player is pushed off the tower. */
export const KNOCK_PUSH = 2;
/** The push's speed for each block of `KNOCK_PUSH` (provisional: about two blocks of slide on the sky's ground). */
const PUSH_PER_BLOCK = 2.5;
/** The push's lift, so the player leaves the column instead of grinding against it. */
const PUSH_UP = 4;
/** Seconds between the warning's motes along the stack. */
const SHAKE_EVERY = 0.25;
/** A player within this horizontal distance of the tower's column is still on it. */
const ON_COLUMN = 1.5;

export class TowerKnock implements TowerKnockApi {
  private by: SkyActor | 'sun' | null = null;
  private tower: Tower | null = null;
  private left = 0;
  private shake = 0;

  constructor(private host: SkyHost, private effects: SkyEffectsApi) {}

  get busy(): boolean { return this.tower !== null; }

  /** Starts the warning. A knock already under way is not restarted. */
  start(by: SkyActor | 'sun', tower: Tower) {
    if (this.tower || tower.cells.length === 0) return;
    this.by = by;
    this.tower = { cells: [...tower.cells], height: tower.height, at: [...tower.at] };
    this.left = KNOCK_WARNING;
    this.shake = 0;
    const [x, y, z] = tower.at;
    this.host.cue('core.grumble', x + 0.5, y, z + 0.5);
  }

  update(dt: number) {
    const t = this.tower;
    if (!t) return;
    this.left -= dt;
    this.shake -= dt;
    if (this.left > 0) {
      if (this.shake <= 0) {
        this.shake += SHAKE_EVERY;
        this.motes(t);
      }
      return;
    }
    this.knock(t);
    this.tower = null;
    this.by = null;
  }

  private motes(t: Tower) {
    const w = this.host.world();
    for (const i of t.cells) {
      const [x, y, z] = w.coords(i);
      this.host.fx('motes', x + 0.5, y + 0.5, z + 0.5, 2);
    }
  }

  private knock(t: Tower) {
    const w = this.host.world();
    // the material is read before the cells go: knockTower leaves air behind
    const mats = new Map<number, number>();
    for (const i of t.cells) mats.set(i, w.getAt(i));
    const gone = w.knockTower(t.cells);
    const debris = this.host.debris();
    for (const i of gone) {
      const [x, y, z] = w.coords(i);
      debris.spawn(mats.get(i) ?? 0, x + 0.5, y + 0.5, z + 0.5);
      this.host.fx('pop', x + 0.5, y + 0.5, z + 0.5);
    }
    const [cx, cy, cz] = t.at;
    this.host.cue('core.pop', cx + 0.5, cy, cz + 0.5);
    const b = this.host.player().body;
    const ox = cx + 0.5, oz = cz + 0.5;
    if (Math.hypot(b.x - ox, b.z - oz) > ON_COLUMN) return;
    const [ux, uz] = this.away(ox, oz, b);
    const k = KNOCK_PUSH * PUSH_PER_BLOCK;
    this.effects.push(ux * k, PUSH_UP, uz * k);
  }

  /** The push's direction: from the knocker through the player, or from the column's centre, or +x. */
  private away(ox: number, oz: number, b: Vec3): [number, number] {
    const from = this.by && this.by !== 'sun' ? this.by.body : { x: ox, z: oz };
    let dx = b.x - from.x, dz = b.z - from.z;
    let d = Math.hypot(dx, dz);
    if (d < 1e-6) { dx = b.x - ox; dz = b.z - oz; d = Math.hypot(dx, dz); }
    return d < 1e-6 ? [1, 0] : [dx / d, dz / d];
  }
}
