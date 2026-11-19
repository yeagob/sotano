// The items you hold, and the single place where their effects get installed.
//
// `rebuild()` is the whole trick: whenever the item list changes it removes every effect it
// installed and reinstalls from scratch, in acquisition order — items first, then the
// synergies that are now active, skipping any hook a synergy suppresses. There is no
// incremental state to get wrong, and an exception between two items is one entry in
// content/synergies.ts. Effects from other sources (rooms, curses…) on the same StatSheet
// and bus are left alone: only our own sources are removed.
//
// Stacks (ItemDef.stack) are the one exception to "rebuild everything": a copy's stat modifiers
// live under their own source (`item:<uid>:stack`), so `addStack` can change them alone, inside
// an event, without reinstalling any hook.

import { Rng } from '../core/rng';
import { StatSheet, diffStats, type Stats } from '../core/stats';
import type { GameBus, WeaponId } from '../game/events';
import type { HostApi, ItemApi, ItemDef, ItemInstance, Req, SynergyDef } from './types';

export interface GainResult {
  instance: ItemInstance;
  changes: ReturnType<typeof diffStats>;
  newSynergies: SynergyDef[];
}

/** One saved item: a plain id (no stacks, the format of every save so far) or an id with its stacks. */
export type SavedItem = string | { id: string; stacks: number };

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

  /** Scratch memory per practice or synergy id, shared by its copies (ItemApi.memory). Dropped in `rebuild`
   *  once no installed effect owns it. */
  private memories = new Map<string, Record<string, number>>();

  private memoryOf(owner: string): Record<string, number> {
    let m = this.memories.get(owner);
    if (!m) { m = {}; this.memories.set(owner, m); }
    return m;
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
    const instance: ItemInstance = { uid: this.nextUid++, def, stacks: 0 };
    this.held.push(instance);
    this.rebuild();
    const copy = this.held.filter(h => h.def.id === id).length - 1;
    def.onGain?.(this.scoped(def, `item:${instance.uid}`, this.itemRng(id, copy), instance));
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

  /** Item ids in acquisition order; a copy with stacks is saved as `{ id, stacks }`. */
  serialize(): SavedItem[] {
    return this.held.map(i => (i.stacks > 0 ? { id: i.def.id, stacks: i.stacks } : i.def.id));
  }

  /** Restores from saved items. Does not run `onGain` (those effects already happened). */
  restore(saved: readonly SavedItem[]) {
    this.held = [];
    this.rngs.clear();
    for (const s of saved) {
      const id = typeof s === 'string' ? s : s.id;
      const def = this.catalog.get(id);
      if (!def) { console.warn(`[items] restore: unknown item "${id}" skipped`); continue; }
      const raw = typeof s === 'string' ? 0 : Math.floor(s.stacks);
      const stacks = Number.isFinite(raw) ? Math.min(def.stack?.max ?? 0, Math.max(0, raw)) : 0;
      this.held.push({ uid: this.nextUid++, def, stacks });
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
      this.install(`item:${it.uid}`, it.def.id, it.def, suppressed, this.itemRng(it.def.id, copy), it);
      this.installStacks(it);
    }
    for (const s of this.active) this.install(`syn:${s.id}`, s.id, s, suppressed, this.itemRng(`syn:${s.id}`, 0));
    // scratch memory lives while any copy (or synergy) that owns it is held
    const owners = new Set([...this.held.map(h => h.def.id), ...this.active.map(s => s.id)]);
    for (const k of [...this.memories.keys()]) if (!owners.has(k)) this.memories.delete(k);

    // the active weapon: highest priority wins, ties go to the latest gained (synergies come last)
    let best: { id: WeaponId; priority: number } | null = null;
    for (const e of [...this.held.map(h => h.def), ...this.active]) {
      if (e.weapon && (!best || e.weapon.priority >= best.priority)) best = e.weapon;
    }
    this.activeWeapon = best?.id ?? 'intent';
  }

  /** The API one held copy (or a synergy) sees: its toasts name it, its deferred calls belong to its source, and
   *  `consumeSelf` removes one copy of its item once the current event has finished (never inside the emit). */
  private scoped(owner: ItemDef | SynergyDef, source: string, rng: Rng, copy?: ItemInstance): ItemApi {
    const bus = this.bus();
    const { message, consumeCopy, ...host } = this.api();
    return {
      ...host,
      toast: (id, params) => message(owner, id, params),
      defer: fn => bus.defer(fn, source),
      rng: () => rng,
      consumeSelf: () => bus.defer(() => consumeCopy(owner.id), source),
      memory: () => this.memoryOf(owner.id),
      addStack: n => (copy ? this.addStack(copy, n) : 0),
    };
  }

  /** Adds stacks to one held copy. Only its stat modifiers change: no hook is reinstalled, so it
   *  is safe inside an emit. Returns the copy's new count (0 for an item without stacks). */
  addStack(copy: ItemInstance, n = 1): number {
    const stack = copy.def.stack;
    if (!stack || !this.held.includes(copy)) return 0;
    const add = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    copy.stacks = Math.min(stack.max, copy.stacks + add);
    this.installStacks(copy);
    return copy.stacks;
  }

  /** The copy's stack modifiers: each stat times its stacks, under the copy's own stack source. */
  private installStacks(copy: ItemInstance) {
    const source = `item:${copy.uid}:stack`;
    this.stats.removeSource(source);
    if (!copy.def.stack || copy.stacks <= 0) return;
    for (const m of copy.def.stack.stats) this.stats.add({ stat: m.stat, layer: 'add', value: m.value * copy.stacks, source });
    this.installed.add(source);
  }

  /** The game's API with toasts bound to the effect that raises them. `copy` binds `addStack` to
   *  one held copy; synergies have none, so their `addStack` does nothing. */

  private install(source: string, ownerId: string, e: ItemDef | SynergyDef, suppressed: Set<string>, rng: Rng, copy?: ItemInstance) {
    const bus = this.bus();
    const api = this.scoped(e, source, rng, copy);
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
