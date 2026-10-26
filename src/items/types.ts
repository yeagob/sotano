// What an item (or a synergy) is. See docs/ITEMS.md for the full picture.
//
// An item never reaches into the game directly. It is a bundle of *effects*:
//   - stat modifiers (layered, recomputed from scratch), and
//   - hooks on game events (mutate or cancel the event's payload),
// plus an optional one-shot `onGain`. Effects are installed under a source id and removed by
// that id, so gaining, losing or restoring items never leaves anything behind.

import type { DamageKind } from '../core/damage';
import type { EventCtx } from '../core/events';
import type { Rng } from '../core/rng';
import type { StatLayer, StatName, Stats } from '../core/stats';
import type { GameBus, GameEvents } from '../game/events';

/** What effects can do to the world. A small facade so items never depend on `Game`. */
export interface ItemApi {
  bus: GameBus;
  stats(): Stats;
  has(itemId: string): boolean;
  hasTag(tag: string): boolean;
  /** Materials in your hand, bottom to top. */
  held(): readonly number[];
  /** Deterministic randomness for item effects (its own stream: never shifts loot or combat). */
  rng(): Rng;
  materialAt(x: number, y: number, z: number): number;
  damageBlock(x: number, y: number, z: number, amount: number, kind: DamageKind, source: string): boolean;
  explode(x: number, y: number, z: number, radius: number, damage: number, source: string): void;
  spawnDebris(material: number, x: number, y: number, z: number, vx: number, vy: number, vz: number): void;
  toast(text: string): void;
  /** Run `fn` at the end of the frame (chain reactions). Owned by the item: dropped if it is lost. */
  defer(fn: () => void): void;
}

export type StatModSpec = { stat: StatName; layer: StatLayer; value: number };

/** One hook on one event. `id` lets a synergy suppress exactly this hook (see `Effect.suppress`). */
export interface HookSpec<K extends keyof GameEvents = keyof GameEvents> {
  event: K;
  id?: string;
  priority?: number;
  fn: (ctx: GameEvents[K] & EventCtx, api: ItemApi) => void;
}

/** Typed helper: `hook('kick', ctx => ...)` infers the payload type from the event name. */
export function hook<K extends keyof GameEvents>(
  event: K,
  fn: HookSpec<K>['fn'],
  opts: { id?: string; priority?: number } = {},
): HookSpec<K> {
  return { event, fn, ...opts };
}

/** The part shared by items and synergies. */
export interface Effect {
  stats?: StatModSpec[];
  hooks?: HookSpec<any>[];
  /** Hooks to switch off while this is active, as "itemId.hookId". This is where exceptions live. */
  suppress?: string[];
}

export type PoolName = 'treasure' | 'boss' | 'vault';

export interface ItemDef extends Effect {
  id: string;
  name: string;
  /** One line, shown on pickup. */
  description: string;
  /** Pools it can drop from, with a weight in each. */
  pools: Partial<Record<PoolName, number>>;
  /** Free-form labels other effects can query with `api.hasTag` (e.g. 'explosive', 'blocks'). */
  tags?: string[];
  /** Colour of the pedestal gem. */
  color: number;
  /** One-shot effect when picked up (heal, spawn something…). Never re-run by rebuilds or restores. */
  onGain?(api: ItemApi): void;
}

/** A synergy requirement: an item id, or "at least `count` (default 1) items tagged `tag`". */
export type Req = string | { tag: string; count?: number };

export interface SynergyDef extends Effect {
  id: string;
  name: string;
  description: string;
  requires: Req[];
}

/** One held copy of an item. `uid` is stable for the life of the copy (sources, logs). */
export interface ItemInstance { uid: number; def: ItemDef }

export const defineItem = (d: ItemDef) => d;
export const defineSynergy = (d: SynergyDef) => d;
