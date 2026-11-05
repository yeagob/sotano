// The touch router (docs/architecture/SKY.md §5.7): the one way an intention, a weapon stroke, a blast or a
// thrown cube finds an actor that is not a projection. Pure: no three.js and no game state. Each provider
// (SkyCreatures now, the Spiked Entity later) owns its ids; a parked creature is never routed, because a
// provider's targets() leaves it out.

import type { DamageKind } from '../core/damage';
import type { TouchProvider, TouchTarget, Vec3 } from '../sky/types';
import type { Polarity } from './polarity';

/** A blast reaches a body whose centre is this far past its radius (the reach the dungeon's actors get). */
export const BLAST_REACH = 0.4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class TouchRouter {
  private readonly providers: TouchProvider[] = [];

  add(p: TouchProvider) {
    if (!this.providers.includes(p)) this.providers.push(p);
  }

  remove(p: TouchProvider) {
    const i = this.providers.indexOf(p);
    if (i >= 0) this.providers.splice(i, 1);
  }

  /** True when a provider owns the id and the actor is not parked. */
  owns(id: number): boolean {
    return this.box(id) !== null;
  }

  /** The first provider's creature whose box, grown by `r`, holds the point; −1 for none. */
  at(x: number, y: number, z: number, r: number): number {
    for (const p of this.providers) {
      const id = p.at(x, y, z, r);
      if (id >= 0 && this.box(id) !== null) return id;
    }
    return -1;
  }

  /** Every routed box, unparked, in the order the providers were added. */
  targets(): TouchTarget[] {
    const out: TouchTarget[] = [];
    for (const p of this.providers) out.push(...p.targets());
    return out;
  }

  /** The touch goes to the provider that owns the id; an id nobody owns is ignored. */
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void {
    for (const q of this.providers) {
      if (!q.owns(id)) continue;
      q.touch(id, polarity, warm, p, kind);
      return;
    }
  }

  /** A shot or a stroke: the touch lands at the body centre of a routed id. False when the id is not routed. */
  touchBody(id: number, polarity: Polarity, warm: boolean, kind: DamageKind): boolean {
    const b = this.box(id);
    if (!b) return false;
    this.touch(id, polarity, warm, { x: b.x, y: b.y + b.h / 2, z: b.z }, kind);
    return true;
  }

  /** A blast of radius `r` at `c`: each routed body whose centre is within `r + BLAST_REACH` gets one touch, at the nearest point of its box to `c`. */
  blast(c: Vec3, r: number, polarity: Polarity, warm: boolean, kind: DamageKind): void {
    for (const b of this.targets()) {
      if (Math.hypot(b.x - c.x, b.y + b.h / 2 - c.y, b.z - c.z) >= r + BLAST_REACH) continue;
      const p = {
        x: clamp(c.x, b.x - b.hw, b.x + b.hw),
        y: clamp(c.y, b.y, b.y + b.h),
        z: clamp(c.z, b.z - b.hw, b.z + b.hw),
      };
      this.touch(b.id, polarity, warm, p, kind);
    }
  }

  /** The unparked box of a routed id, or null. */
  private box(id: number): TouchTarget | null {
    for (const p of this.providers) {
      if (!p.owns(id)) continue;
      for (const t of p.targets()) if (t.id === id) return t;
    }
    return null;
  }
}
