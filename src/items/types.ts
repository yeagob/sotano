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
import type { ActorId, ActorKind, Owner } from '../entities/actors';
import type { GameBus, GameEvents, IntentSpec, PickupKind, WeaponId } from '../game/events';
import type { Polarity } from '../combat/polarity';
import type { Params } from '../i18n';

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
  /** Show one of this item's `messages` (by id, in the player's language) as a toast. */
  toast(messageId: string, params?: Params): void;
  /** Run `fn` at the end of the frame (chain reactions). Owned by the item: dropped if it is lost. */
  defer(fn: () => void): void;
  /** Heal the player by half-hearts (through the `heal` event). */
  heal(halfHearts: number, source?: string): void;
  /** Hurt the player by half-hearts (through `actorDamage`, owned by the player). */
  damagePlayer(halfHearts: number, source?: string): void;
  /** The player's actor id. */
  player(): ActorId;
  /** Is this owner the player? (Compare owners with this, never with raw ids.) */
  isPlayer(owner: Owner): boolean;
  /** Give keys, bombs or hearts (through `pickupCollect`). */
  collect(kind: PickupKind, amount: number): boolean;
  /** Counters; `hp` and `maxHp` in damage points (a heart is 8). */
  counts(): { keys: number; bombs: number; hp: number; maxHp: number };
  /** Drop a key, bomb or heart in the world. */
  spawnPickup(kind: PickupKind, x: number, y: number, z: number): void;
  pulse(x: number, y: number, z: number, radius: number, damage: number, knock: number, color: number, source: string): void;
  arc(x: number, y: number, z: number, to: ActorId, damage: number, source: string, polarity: Polarity): void;
  nearestProjection(x: number, y: number, z: number, radius: number, except: readonly ActorId[]): { id: ActorId; x: number; y: number; z: number } | null;
  actorAt(id: ActorId): { x: number; y: number; z: number } | null;
  shove(id: ActorId, dx: number, dz: number, speed: number): void;
  freeze(id: ActorId, seconds: number): void;
  frighten(id: ActorId, seconds: number): void;
  igniteArea(x: number, y: number, z: number, radius: number): void;
  launch(spec: IntentSpec, x: number, y: number, z: number, dx: number, dy: number, dz: number): void;
  tagFlying(x: number, y: number, z: number, radius: number, tag: string, except: IntentSpec): void;
  tagCube(cube: number, tag: string): void;
}

/** What the game gives the installer: like `ItemApi`, but a toast names the effect it comes from
 *  (the inventory binds it, so items only pass a message id). */
export type HostApi = Omit<ItemApi, 'toast'> & {
  message(owner: ItemDef | SynergyDef, messageId: string, params?: Params): void;
};

export type StatModSpec = { stat: StatName; layer: StatLayer; value: number };

/** Events that cover every actor: hooks on them must set `target`. */
export const ACTOR_EVENTS = ['actorDamage', 'contact', 'actorDeath'] as const satisfies readonly (keyof GameEvents)[];

/** One hook on one event. `id` lets a synergy suppress exactly this hook (see `Effect.suppress`). */
export interface HookSpec<K extends keyof GameEvents = keyof GameEvents> {
  event: K;
  id?: string;
  priority?: number;
  /** Actor events (`actorDamage`, `contact`, `actorDeath`) cover every actor: say which ones this
   *  hook is for. The installer skips the others before calling `fn`. Required on those events. */
  target?: ActorKind | 'any';
  fn: (ctx: GameEvents[K] & EventCtx, api: ItemApi) => void;
}

/** Typed helper: `hook('kick', ctx => ...)` infers the payload type from the event name. */
export function hook<K extends keyof GameEvents>(
  event: K,
  fn: HookSpec<K>['fn'],
  opts: { id?: string; priority?: number; target?: ActorKind | 'any' } = {},
): HookSpec<K> {
  return { event, fn, ...opts };
}

/** The part shared by items and synergies. */
export interface Effect {
  stats?: StatModSpec[];
  hooks?: HookSpec<any>[];
  /** Hooks to switch off while this is active, as "itemId.hookId". This is where exceptions live. */
  suppress?: string[];
  /** Replaces how the player casts (docs/architecture/WEAPONS.md). The highest priority among held
   *  items and active synergies wins (ties: the latest gained); items use 10, synergies 100. */
  weapon?: { id: WeaponId; priority: number };
}

export type PoolName = 'treasure' | 'boss' | 'vault';

export interface ItemDef extends Effect {
  id: string;
  name: string;
  /** One line, shown on pickup: what the practice is about (its meaning, in the story's voice). */
  description: string;
  /** What it does in the game, plainly and with numbers ("Damage ×3, then +2"). Always shown
   *  next to the description so the player knows exactly what they got. */
  effect: string;
  /** The book, course, technique or therapy that inspired it (credited, never used as the name). */
  inspiredBy?: string;
  /** Pools it can drop from, with a weight in each. */
  pools: Partial<Record<PoolName, number>>;
  /** Text the item shows while you hold it (`api.toast(id)`), in English; other languages
   *  translate it by id (docs/architecture/LOCALIZATION.md). Never pass a literal to toast. */
  messages?: Record<string, string>;
  /** Damage source labels this item passes to `explode`/`damagePlayer` besides its own id, so
   *  the death screen can name the practice ("volatile" → Symbolic Act). */
  causes?: string[];
  /** Labels other effects can query with `api.hasTag`. Include the item's path: 'body', 'mind',
   *  'emotion' or 'will' (three of a path give a state of being), plus mechanics ('blocks', 'explosive'…). */
  tags?: string[];
  /** Main colour (glow, particles, HUD accents). */
  color: number;
  /** Isaac-style quality, 0 (weak) to 4 (run-defining). Shown as stars. */
  quality: 0 | 1 | 2 | 3 | 4;
  /** 12×12 pixel-art icon: rows of palette keys ('.' = transparent). */
  icon: ItemIcon;
  /** One-shot effect when picked up (heal, spawn something…). Never re-run by rebuilds or restores. */
  onGain?(api: ItemApi): void;
}

export interface ItemIcon {
  rows: string[];
  palette: Record<string, number>;
}

/** A synergy requirement: an item id, or "at least `count` (default 1) items tagged `tag`". */
export type Req = string | { tag: string; count?: number };

export interface SynergyDef extends Effect {
  id: string;
  name: string;
  description: string;
  /** Like `ItemDef.messages`. */
  messages?: Record<string, string>;
  requires: Req[];
}

/** One held copy of an item. `uid` is stable for the life of the copy (sources, logs). */
export interface ItemInstance { uid: number; def: ItemDef }

export const defineItem = (d: ItemDef) => d;
export const defineSynergy = (d: SynergyDef) => d;
