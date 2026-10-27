// The items you hold, and the single place where their effects get installed.
//
// `rebuild()` is the whole trick: whenever the item list changes it removes every effect it
// installed and reinstalls from scratch, in acquisition order — items first, then the
// synergies that are now active, skipping any hook a synergy suppresses. There is no
// incremental state to get wrong, and an exception between two items is one entry in
// content/synergies.ts. Effects from other sources (rooms, curses…) on the same StatSheet
// and bus are left alone: only our own sources are removed.

import { Rng } from '../core/rng';
import { StatSheet, diffStats, type Stats } from '../core/stats';
import type { GameBus, WeaponId } from '../game/events';
import type { HostApi, ItemApi, ItemDef, ItemInstance, Req, SynergyDef } from './types';

export interface GainResult {
  instance: ItemInstance;
  changes: ReturnType<typeof diffStats>;
  newSynergies: SynergyDef[];
}

export class Inventory {
  private held: ItemInstance[] = [];
  private installed = new Set<string>();
  private active: SynergyDef[] = [];
  private nextUid = 1;
  private activeWeapon: WeaponId = 'intent';

  constructor(
    private catalog: ReadonlyMap<string, ItemDef>,
    private synergies: readonly SynergyDef[],
    readonly stats: StatSheet,
    private bus: () => GameBus,
    private api: () => HostApi,
    /** The RNG for one held copy of an item: `fork('item', id, copyIndex)` in the game. */
    private rngFor: (id: string, copy: number) => Rng = (id, copy) => new Rng(id.length * 7919 + copy),
  ) {}

  /** Per-copy RNGs, kept across rebuilds so a pickup doesn't replay another item's rolls. */
  private rngs = new Map<string, Rng>();

  private itemRng(id: string, copy: number) {
    const k = `${id}#${copy}`;
    let r = this.rngs.get(k);
    if (!r) { r = this.rngFor(id, copy); this.rngs.set(k, r); }
    return r;
  }

  get items(): readonly ItemInstance[] { return this.held; }
  get synergiesActive(): readonly SynergyDef[] { return this.active; }
  /** How the player casts now: resolved on every rebuild (docs/architecture/WEAPONS.md §1). */
  get weapon(): WeaponId { return this.activeWeapon; }
  has(id: string) { return this.held.some(i => i.def.id === id); }
  countTag(tag: string) { return this.held.filter(i => i.def.tags?.includes(tag)).length; }
  hasTag(tag: string) { return this.countTag(tag) > 0; }

  meets(r: Req) { return typeof r === 'string' ? this.has(r) : this.countTag(r.tag) >= (r.count ?? 1); }

  gain(id: string): GainResult | null {
    const def = this.catalog.get(id);
    if (!def) { console.warn(`[items] unknown item "${id}"`); return null; }
    const before: Stats = { ...this.stats.all };
    const wasActive = new Set(this.active.map(s => s.id));
    const instance = { uid: this.nextUid++, def };
    this.held.push(instance);
    this.rebuild();
    const copy = this.held.filter(h => h.def.id === id).length - 1;
    def.onGain?.({ ...this.bound(def), defer: fn => this.bus().defer(fn, `item:${instance.uid}`), rng: () => this.itemRng(id, copy) });
    return {
      instance,
      changes: diffStats(before, this.stats.all),
      newSynergies: this.active.filter(s => !wasActive.has(s.id)),
    };
  }

  /** Loses one copy (the most recent) of an item. */
  lose(id: string): boolean {
    const i = this.held.map(h => h.def.id).lastIndexOf(id);
    if (i < 0) return false;
    this.held.splice(i, 1);
    this.rebuild();
    return true;
  }

  /** Item ids in acquisition order: everything needed to restore the inventory today. */
  serialize(): string[] { return this.held.map(i => i.def.id); }

  /** Restores from ids. Does not run `onGain` (those effects already happened). */
  restore(ids: readonly string[]) {
    this.held = [];
    this.rngs.clear();
    for (const id of ids) {
      const def = this.catalog.get(id);
      if (def) this.held.push({ uid: this.nextUid++, def });
      else console.warn(`[items] restore: unknown item "${id}" skipped`);
    }
    this.rebuild();
  }

  /** Remove and reinstall every effect we own. Call after any change to items, or on a new bus. */
  rebuild() {
    const bus = this.bus();
    for (const src of this.installed) { bus.off(null, src); this.stats.removeSource(src); }
    this.installed.clear();

    this.active = this.synergies.filter(s => s.requires.every(r => this.meets(r)));
    const suppressed = new Set(this.active.flatMap(s => s.suppress ?? []));

    const copies = new Map<string, number>();
    for (const it of this.held) {
      const copy = copies.get(it.def.id) ?? 0;
      copies.set(it.def.id, copy + 1);
      this.install(`item:${it.uid}`, it.def.id, it.def, suppressed, this.itemRng(it.def.id, copy));
    }
    for (const s of this.active) this.install(`syn:${s.id}`, s.id, s, suppressed, this.itemRng(`syn:${s.id}`, 0));

    // the active weapon: highest priority wins, ties go to the latest gained (synergies come last)
    let best: { id: WeaponId; priority: number } | null = null;
    for (const e of [...this.held.map(h => h.def), ...this.active]) {
      if (e.weapon && (!best || e.weapon.priority >= best.priority)) best = e.weapon;
    }
    this.activeWeapon = best?.id ?? 'intent';
  }

  /** The game's API with toasts bound to the effect that raises them. */
  private bound(owner: ItemDef | SynergyDef): ItemApi {
    const { message, ...host } = this.api();
    return { ...host, toast: (id, params) => message(owner, id, params) };
  }

  private install(source: string, ownerId: string, e: ItemDef | SynergyDef, suppressed: Set<string>, rng: Rng) {
    const bus = this.bus();
    const api: ItemApi = { ...this.bound(e), defer: fn => bus.defer(fn, source), rng: () => rng };
    for (const m of e.stats ?? []) this.stats.add({ ...m, source });
    for (const h of e.hooks ?? []) {
      if (h.id && suppressed.has(`${ownerId}.${h.id}`)) continue;
      const only = h.target && h.target !== 'any' ? h.target : null;
      bus.on(h.event, {
        priority: h.priority ?? 50, source, id: h.id ? `${ownerId}.${h.id}` : ownerId,
        // actor events: skip actors this hook isn't for (see HookSpec.target)
        fn: only ? ctx => { if ((ctx as { targetKind?: string }).targetKind === only) h.fn(ctx, api); } : ctx => h.fn(ctx, api),
      });
    }
    this.installed.add(source);
  }
}
