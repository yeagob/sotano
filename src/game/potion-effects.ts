import type { StatSheet } from '../core/stats';
import { echoStats } from '../content/echo';
import { flaskRooms, POTIONS, type Flask, type PotionId } from '../content/potions';

export interface ActivePotion { potion: PotionId; rooms: number; locks: number; echo?: string }

export const potionSource = (id: PotionId) => `potion:${id}`;

const flaskOf = (a: ActivePotion): Flask => (a.echo ? { potion: a.potion, echo: a.echo } : { potion: a.potion });

export class PotionEffects {
  private live = new Map<PotionId, ActivePotion>();

  constructor(private stats: StatSheet) {}

  get active(): readonly ActivePotion[] { return [...this.live.values()]; }

  has(id: PotionId) { return this.live.has(id); }

  drink(f: Flask): boolean {
    const def = POTIONS[f.potion];
    if (def.duration.kind === 'instant') return false;
    this.remove(f.potion);
    const mods = def.echo ? echoStats(f.echo) : def.stats ?? [];
    for (const m of mods) this.stats.add({ ...m, source: potionSource(f.potion) });
    const a: ActivePotion = { potion: f.potion, rooms: flaskRooms(f), locks: def.locks ?? 0 };
    if (def.echo && f.echo) a.echo = f.echo;
    this.live.set(f.potion, a);
    return true;
  }

  roomCleared(): PotionId[] {
    return this.endRooms().map(f => f.potion);
  }

  floorEntered(): PotionId[] {
    return this.endFloor().map(f => f.potion);
  }

  endRooms(): Flask[] {
    const ended: Flask[] = [];
    for (const a of this.live.values()) {
      if (POTIONS[a.potion].duration.kind !== 'rooms') continue;
      if (--a.rooms <= 0) ended.push(flaskOf(a));
    }
    for (const f of ended) this.remove(f.potion);
    return ended;
  }

  endFloor(): Flask[] {
    const ended = [...this.live.values()].map(flaskOf);
    for (const f of ended) this.remove(f.potion);
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
