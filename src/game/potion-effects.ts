import type { StatSheet } from '../core/stats';
import { flaskRooms, POTIONS, type Flask, type PotionId } from '../content/potions';

export interface ActivePotion { potion: PotionId; rooms: number; locks: number }

export const potionSource = (id: PotionId) => `potion:${id}`;

export class PotionEffects {
  private live = new Map<PotionId, ActivePotion>();

  constructor(private stats: StatSheet) {}

  get active(): readonly ActivePotion[] { return [...this.live.values()]; }

  has(id: PotionId) { return this.live.has(id); }

  drink(f: Flask): boolean {
    const def = POTIONS[f.potion];
    if (def.duration.kind === 'instant') return false;
    this.remove(f.potion);
    for (const m of def.stats ?? []) this.stats.add({ ...m, source: potionSource(f.potion) });
    this.live.set(f.potion, { potion: f.potion, rooms: flaskRooms(f), locks: def.locks ?? 0 });
    return true;
  }

  roomCleared(): PotionId[] {
    const ended: PotionId[] = [];
    for (const a of this.live.values()) {
      if (POTIONS[a.potion].duration.kind !== 'rooms') continue;
      if (--a.rooms <= 0) ended.push(a.potion);
    }
    for (const id of ended) this.remove(id);
    return ended;
  }

  floorEntered(): PotionId[] {
    const ended = [...this.live.keys()];
    for (const id of ended) this.remove(id);
    return ended;
  }

  lockDiscount(): number {
    for (const a of this.live.values()) if (a.locks > 0) return 1;
    return 0;
  }

  spendLock(): PotionId | null {
    for (const a of this.live.values()) {
      if (a.locks <= 0) continue;
      if (--a.locks <= 0) this.remove(a.potion);
      return a.potion;
    }
    return null;
  }

  clear() {
    for (const id of [...this.live.keys()]) this.remove(id);
  }

  private remove(id: PotionId) {
    this.stats.removeSource(potionSource(id));
    this.live.delete(id);
  }
}
