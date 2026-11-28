// Falling sand (issue #354, docs/design/built/levels/worm-desert/README.md): sand has no hold of its own, as in Minecraft.
// When the cell under a sand block turns to air, the block falls one cell a step until it rests on something, and the
// sand above it follows. The world tells this queue about every changed cell (`changed`); `step` moves a budget of
// blocks a tick, so a collapse never rewrites more than SAND_FALL_BUDGET cells in one frame. Pure: no Game, no THREE.

import { AIR, MAT } from '../content/materials';

/** Blocks moved one cell down per step, at most (two cell writes each). */
export const SAND_FALL_BUDGET = 48;
/** Sand waiting to fall, at most: a bigger collapse finishes as the queue drains. */
export const SAND_FALL_CAP = 4096;

/** What the falling sand needs of the world. */
export interface SandSpace {
  get(x: number, y: number, z: number): number;
  set(x: number, y: number, z: number, m: number): void;
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

export class SandFall {
  private queue: [number, number, number][] = [];
  private queued = new Set<string>();
  /** Blocks moved on the last step (tests, debug). */
  lastMoved = 0;

  get pending(): number { return this.queue.length; }

  clear() { this.queue = []; this.queued.clear(); }

  /** A cell changed: if it is now air and sand sits on it, that sand will fall. */
  changed(w: SandSpace, x: number, y: number, z: number) {
    if (w.get(x, y, z) === AIR && w.get(x, y + 1, z) === MAT.sand) this.push(x, y + 1, z);
  }

  private push(x: number, y: number, z: number) {
    const k = key(x, y, z);
    if (this.queued.has(k) || this.queue.length >= SAND_FALL_CAP) return;
    this.queued.add(k);
    this.queue.push([x, y, z]);
  }

  /**
   * Moves up to `budget` sand blocks one cell down. `blocked` keeps sand out of a cell a body stands in: that block
   * waits for the next step. A move that the world refuses (a cell it cannot change) leaves the sand where it was.
   */
  step(w: SandSpace, budget = SAND_FALL_BUDGET, blocked?: (x: number, y: number, z: number) => boolean): number {
    const work = this.queue;
    this.queue = [];
    this.queued.clear();
    let moved = 0, i = 0;
    for (; i < work.length && moved < budget; i++) {
      const [x, y, z] = work[i];
      if (w.get(x, y, z) !== MAT.sand || w.get(x, y - 1, z) !== AIR) continue;
      if (blocked?.(x, y - 1, z)) { this.push(x, y, z); continue; }
      w.set(x, y - 1, z, MAT.sand);
      if (w.get(x, y - 1, z) !== MAT.sand) continue;
      // the vacated cell wakes the sand above it through the world's change callback (or here, without one)
      w.set(x, y, z, AIR);
      this.push(x, y - 1, z);
      if (w.get(x, y + 1, z) === MAT.sand) this.push(x, y + 1, z);
      moved++;
    }
    for (; i < work.length; i++) this.push(...work[i]);
    this.lastMoved = moved;
    return moved;
  }
}
