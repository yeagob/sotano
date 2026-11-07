// Block nests, shared term 6.3 (docs/architecture/SKY.md §4). A nest is a hollow from the floor plan
// that holds NEST_CUBES loose cubes of the floor's material, spawned in the sky's DebrisSystem. A cube
// that is gone, or farther than NEST_REACH blocks from the nest's centre, counts as taken; its slot is
// refilled NEST_REFILL seconds later with a soft pop. A nest never holds more than NEST_CUBES: each
// slot tracks one cube, and a taken cube that comes back is not the nest's any more.

import type { Place, NestsApi, SkyHost } from '../types';

export const NEST_CUBES = 3;
/** Seconds until a taken cube is replaced. */
export const NEST_REFILL = 6;
/** A cube farther than this from the nest's centre counts as taken. */
export const NEST_REACH = 1.5;

interface Slot {
  /** The debris slot of the cube it holds, −1 while empty. */
  id: number;
  /** Seconds left before an empty slot is refilled. */
  refill: number;
}
interface Nest { place: Place; slots: Slot[] }

export class Nests implements NestsApi {
  private readonly nests: Nest[];

  constructor(private readonly host: SkyHost, places: readonly Place[], private readonly material: number) {
    this.nests = places.map(place => ({
      place,
      slots: Array.from({ length: NEST_CUBES }, () => ({ id: this.spawn(place), refill: 0 })),
    }));
  }

  update(dt: number) {
    for (const n of this.nests) {
      const c = centre(n.place);
      for (const s of n.slots) {
        if (s.id >= 0) {
          if (this.present(s.id, c)) continue;
          // taken: the slot is empty now and refills after its full time
          s.id = -1;
          s.refill = NEST_REFILL;
          continue;
        }
        s.refill -= dt;
        if (s.refill <= 0) {
          s.id = this.spawn(n.place);
          this.host.fx('pop', c[0], c[1], c[2]);
          this.host.cue('core.pop', c[0], c[1], c[2]);
        }
      }
    }
  }

  /** Loose cubes in the nest now. */
  count(place: number): number {
    const n = this.nests.find(n => n.place.id === place);
    if (!n) return 0;
    const c = centre(n.place);
    return n.slots.filter(s => s.id >= 0 && this.present(s.id, c)).length;
  }

  dispose() {
    const debris = this.host.debris();
    for (const n of this.nests) for (const s of n.slots) {
      if (s.id >= 0) debris.remove(s.id);
      s.id = -1;
    }
    this.nests.length = 0;
  }

  private spawn(place: Place): number {
    const [x, y, z] = centre(place);
    return this.host.debris().spawn(this.material, x, y, z);
  }

  /** The cube in the slot is alive and within reach of the nest's centre. */
  private present(id: number, c: readonly [number, number, number]): boolean {
    const debris = this.host.debris();
    if (!debris.isAlive(id)) return false;
    const i3 = id * 3;
    const dx = debris.pos[i3] - c[0], dy = debris.pos[i3 + 1] - c[1], dz = debris.pos[i3 + 2] - c[2];
    return dx * dx + dy * dy + dz * dz <= NEST_REACH * NEST_REACH;
  }
}

/** The nest's centre: the middle of its walking-surface cell. */
function centre(p: Place): [number, number, number] {
  return [p.x + 0.5, p.y + 0.5, p.z + 0.5];
}
