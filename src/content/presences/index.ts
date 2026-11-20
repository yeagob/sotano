import type { EnemyDef } from '../../enemies/types';
import type { Rng, RunRandom } from '../../core/rng';
import type { MessageKey } from '../../i18n';
import type { Carried } from '../../entities/player';
import { LAST_FLOOR, level, oreOf } from '../levels';
import { GARDEN_MATERIALS, MAT } from '../materials';
import type { PartKind } from '../parts';
import { isFlask } from '../potions';
import echo from './echo';
import gardener from './gardener';
import listener from './listener';
import trickster from './trickster';
import wanderer from './wanderer';
import elder from './elder';
import cartographer from './cartographer';
import child from './child';
import witness from './witness';
import boatman from './boatman';
import mender from './mender';
import starReader from './star-reader';

export type PresenceId = 'gardener' | 'listener' | 'trickster' | 'echo' | 'wanderer' | 'elder' | 'cartographer' | 'child' | 'witness' | 'boatman' | 'mender' | 'star-reader';

export type RoomPresence = PresenceId | 'boundary';

export const PRESENCES: readonly EnemyDef[] = [gardener, listener, trickster, echo, wanderer, elder, cartographer, child, witness, boatman, mender, starReader];
export const PRESENCE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(PRESENCES.map(p => [p.id, p]));

/** What a presence takes: one kind of monster part, any part (the Echo asks for any part in hand), or nothing (the
 *  Wanderer offers a gift, and asks for no part). */
export type PresenceKey = PartKind | 'any' | 'none' | 'block' | 'garden';

export const PRESENCE_KEY: Record<PresenceId, PresenceKey> = {
  gardener: 'garden', listener: 'heart', trickster: 'heart', echo: 'any', wanderer: 'none', elder: 'none', cartographer: 'none', child: 'none',
  witness: 'none', boatman: 'block', mender: 'any', 'star-reader': 'none',
};

/** What the Gardener still asks for, once it holds the materials in `given` (GARDEN_MATERIALS, in order). */
export function gardenerWants(given: readonly number[]): number[] {
  return GARDEN_MATERIALS.filter(m => !given.includes(m));
}

/** The ore the Cartographer charts with: the ore of the zone of the floor it waits on (levels.ts ZONES). One object per
 *  card (README D11): the ore of every zone crossed waits on multi-part cards. */
export function cartographerOre(floor: number): number {
  return MAT[oreOf(floor)];
}

/** The offer of the Cartographer's ore: the hand slot that holds its zone's ore, from the top down, or none. */
export function findCartographerOre(floor: number, hand: readonly Carried[]): { index: number; carried: number } | undefined {
  const ore = cartographerOre(floor);
  for (let index = hand.length - 1; index >= 0; index--) if (hand[index] === ore) return { index, carried: ore };
  return undefined;
}

/** The presences that ask a question on a choice card instead of an offer of a part: the card's options and its question. */
export const PRESENCE_CHOICE: Partial<Record<PresenceId, { question: MessageKey; options: readonly MessageKey[] }>> = {
  elder: { question: 'presence.elder.question', options: ['path.body', 'path.mind', 'path.emotion', 'path.will'] },
  cartographer: { question: 'presence.cartographer.question', options: ['presence.cartographer.opt.vault', 'presence.cartographer.opt.boss'] },
};

export function unlocksPresence(id: PresenceId, carried: Carried | undefined): boolean {
  const key = PRESENCE_KEY[id];
  if (key === 'none') return carried === undefined;
  // the Boatman's toll: one block (a material in hand, a number) is left on the shore
  if (key === 'block') return typeof carried === 'number';
  // the Gardener's agreement: a living root and a tuft of cave moss, one card each (GARDENER.md, README D13)
  if (key === 'garden') return typeof carried === 'number' && GARDEN_MATERIALS.includes(carried);
  if (typeof carried !== 'object' || isFlask(carried)) return false;
  return key === 'any' || carried.kind === key;
}

/** The presences whose agreement names several parts on one card (AGREEMENTS.md, multi-part cards; owner, #228, D11): how
 *  many parts, each of a different kind. The Mender asks for two shards of different kinds, to mend a vessel (the design's
 *  three shards scaled to floors 3 to 5, where an agreement asks for two things). The others ask for one. */
export const PRESENCE_PARTS: Partial<Record<PresenceId, number>> = { mender: 2 };

/** The most objects one card may name (the design's largest agreement: three shards). */
export const MAX_OFFER_PARTS = 3;

/** One object a card names: its hand slot and what is in it. */
export interface OfferPick { index: number; carried: Carried }

/** The offer of a presence: the hand slot it takes and the part, or no slot (index -1) for a presence that takes nothing.
 *  A multi-part agreement (PRESENCE_PARTS) also names the other parts in `rest`, each of a kind not yet named, read from
 *  the interaction item down; with too few kinds in hand there is no offer, and nothing is named. */
export function findPresenceOffer(id: PresenceId, hand: readonly Carried[], given: readonly number[] = []): { index: number; carried?: Carried; rest?: OfferPick[] } | undefined {
  if (PRESENCE_KEY[id] === 'none') return { index: -1 };
  const want = Math.min(MAX_OFFER_PARTS, PRESENCE_PARTS[id] ?? 1);
  const picks: OfferPick[] = [];
  const kinds = new Set<string>();
  for (let index = hand.length - 1; index >= 0 && picks.length < want; index--) {
    const carried = hand[index];
    // the Gardener asks only for what it does not have yet
    if (typeof carried === 'number' && given.includes(carried)) continue;
    if (carried === undefined || !unlocksPresence(id, carried)) continue;
    if (want > 1) {
      const kind = typeof carried === 'object' && !isFlask(carried) ? carried.kind : String(carried);
      if (kinds.has(kind)) continue;
      kinds.add(kind);
    }
    picks.push({ index, carried });
  }
  if (picks.length < want) return undefined;
  const [first, ...rest] = picks;
  return rest.length ? { ...first, rest } : first;
}

/** The question of an offer's card, where the presence says plainly what it gives back. Presences not listed ask the
 *  plain question ("Offer {item} to {presence}?"). */
export const PRESENCE_OFFER_QUESTION: Partial<Record<PresenceId, MessageKey>> = {
  trickster: 'presence.offer.trade.question',
  echo: 'presence.offer.echo.question',
  wanderer: 'presence.offer.wanderer.question',
  gardener: 'presence.offer.gardener.question',
  child: 'presence.offer.child.build',
  witness: 'presence.offer.witness.question',
  boatman: 'presence.offer.boatman.toll',
  mender: 'presence.offer.mender.question',
  'star-reader': 'presence.offer.starreader.question',
};

/** The presences whose offer is a gift to take, not a part to give: the card says Take and Decline, not Give and Keep. */
export const GIFT_OFFER: ReadonlySet<PresenceId> = new Set<PresenceId>(['wanderer', 'child', 'witness', 'star-reader']);

export interface PresenceTalk {
  name: MessageKey;
  lines: readonly MessageKey[];
  silent: MessageKey;
  hint: MessageKey;
  /** Gives a reward when its offer is accepted (the game rolls it from the run's `drops` stream). */
  drops: boolean;
  /** The line a presence says when the player declines its offer, before it leaves (the Trickster laughs; the Wanderer walks on). */
  farewell?: MessageKey;
}

export const PRESENCE_TALK: Record<PresenceId, PresenceTalk> = {
  gardener: { name: 'presence.gardener.name', lines: ['presence.gardener.1', 'presence.gardener.2'], silent: 'presence.gardener.silent', hint: 'presence.gardener.hint', drops: false },
  listener: { name: 'presence.listener.name', lines: ['presence.listener.1', 'presence.listener.2'], silent: 'presence.listener.silent', hint: 'presence.listener.hint', drops: true },
  trickster: {
    name: 'presence.trickster.name', lines: ['presence.trickster.1', 'presence.trickster.2'], silent: 'presence.trickster.silent',
    hint: 'presence.trickster.hint', drops: true, farewell: 'presence.trickster.laugh',
  },
  echo: { name: 'presence.echo.name', lines: ['presence.echo.1', 'presence.echo.2'], silent: 'presence.echo.silent', hint: 'presence.echo.hint', drops: true },
  elder: { name: 'presence.elder.name', lines: ['presence.elder.1', 'presence.elder.2'], silent: 'presence.elder.silent', hint: 'presence.elder.hint', drops: true },
  child: {
    name: 'presence.child.name', lines: ['presence.child.1', 'presence.child.2'], silent: 'presence.child.silent',
    hint: 'presence.child.hint', drops: true,
  },
  cartographer: { name: 'presence.cartographer.name', lines: ['presence.cartographer.1', 'presence.cartographer.2'], silent: 'presence.cartographer.silent', hint: 'presence.cartographer.hint', drops: false },
  witness: {
    name: 'presence.witness.name', lines: ['presence.witness.1', 'presence.witness.2'], silent: 'presence.witness.silent',
    hint: 'presence.witness.hint', drops: true,
  },
  boatman: {
    name: 'presence.boatman.name', lines: ['presence.boatman.1', 'presence.boatman.2'], silent: 'presence.boatman.silent',
    hint: 'presence.boatman.hint', drops: true,
  },
  wanderer: {
    name: 'presence.wanderer.name', lines: ['presence.wanderer.1', 'presence.wanderer.2'], silent: 'presence.wanderer.silent',
    hint: 'presence.wanderer.hint', drops: true, farewell: 'presence.wanderer.walk',
  },
  mender: {
    name: 'presence.mender.name', lines: ['presence.mender.1', 'presence.mender.2'], silent: 'presence.mender.silent',
    hint: 'presence.mender.hint', drops: true,
  },
  'star-reader': {
    name: 'presence.starreader.name', lines: ['presence.starreader.1', 'presence.starreader.2'], silent: 'presence.starreader.silent',
    hint: 'presence.starreader.hint', drops: true,
  },
};

/** Whether a presence leaves when the player declines its offer (the Trickster and the Wanderer do; the others wait). */
export function leavesOnDecline(id: PresenceId): boolean {
  return PRESENCE_TALK[id].farewell !== undefined;
}

/** A presence that gives its reward leaves at once, in the frame the reward appears: its room is ordinary again, and its
 *  silence goes with it (docs/design/built/presences/LISTENER.md). The Trickster also leaves when its trade is declined. */
export function leavesAfterOffer(id: PresenceId): boolean {
  return PRESENCE_TALK[id].drops && !DWELLERS.has(id);
}

/** Presences that keep their place after their reward (the Gardener, the Elder, the Cartographer). */
export const DWELLERS: ReadonlySet<PresenceId> = new Set<PresenceId>(['gardener', 'elder', 'cartographer', 'child', 'boatman', 'mender', 'star-reader']);

export const TALK_REACH = 2.2;

export const PRESENCE_REPLY_MS = 4000;

export function answerDue(last: number | undefined, now: number): boolean {
  return last === undefined || now - last >= PRESENCE_REPLY_MS;
}

export function pushedOut(px: number, pz: number, cx: number, cz: number, reach: number): { x: number; z: number } | null {
  const dx = px - cx, dz = pz - cz, d = Math.hypot(dx, dz);
  if (d >= reach || d === 0) return null;
  const k = reach / d;
  return { x: cx + dx * k, z: cz + dz * k };
}

export const SILENCE_REACH = 2;
export const LIFT_REACH = 8;

export function presenceReaction(polarity: 'positive' | 'negative', distance: number): 'silence' | 'lift' | null {
  if (polarity === 'negative') return distance < SILENCE_REACH ? 'silence' : null;
  return distance < LIFT_REACH ? 'lift' : null;
}

/** The first floor on which the Trickster may wait, in a dead end (TRICKSTER.md). */
export const TRICKSTER_FIRST_FLOOR = 3;

/** The floor on which this run's Trickster waits: one seeded floor from TRICKSTER_FIRST_FLOOR on, so a run meets it once.
 *  Read from the run's root, never from the player. */
export function tricksterFloorOf(run: RunRandom): number {
  const floors: number[] = [];
  for (let k = TRICKSTER_FIRST_FLOOR; k <= LAST_FLOOR; k++) floors.push(k);
  return run.fork('presence', 'trickster').pick(floors);
}

/** The Wanderer's floors: one or two from floor 1 to the last floor, drawn from the run's root with weights 3 (one floor) to
 *  2 (two floors). Read from the run's root, never from the player (WANDERER.md, proposed). */
export const WANDERER_COUNT_TABLE: readonly (readonly [number, number])[] = [[1, 3], [2, 2]];

export function wandererFloorsOf(run: RunRandom): number[] {
  const r = run.fork('presence', 'wanderer');
  const count = r.weighted(WANDERER_COUNT_TABLE);
  const floors: number[] = [];
  for (let k = 1; k <= LAST_FLOOR; k++) floors.push(k);
  const out: number[] = [];
  while (out.length < count && floors.length) out.push(floors.splice(Math.floor(r.next() * floors.length), 1)[0]);
  return out.sort((a, b) => a - b);
}

/** The Gardener's floor: one seeded floor from floor 1 to the last floor (GARDENER.md, proposed). Never the tutorial. */
export function gardenerFloorOf(run: RunRandom): number {
  const floors: number[] = [];
  for (let k = 1; k <= LAST_FLOOR; k++) floors.push(k);
  return run.fork('presence', 'gardener').pick(floors);
}

/** The Elder's, the Cartographer's and the Child's floor: one seeded floor each from floor 1 to the last (ELDER.md,
 *  CARTOGRAPHER.md and CHILD.md, proposed: the Ledger Halls, the Tree and the Cellar of Habits are not built). Never the
 *  tutorial. */
export function dwellerFloorOf(run: RunRandom, id: 'elder' | 'cartographer' | 'child'): number {
  const floors: number[] = [];
  for (let k = 1; k <= LAST_FLOOR; k++) floors.push(k);
  return run.fork('presence', id).pick(floors);
}

/** The direction of a room from another, read from the map's cells (dx east, dz south): the word the Cartographer says. */
export function directionOf(dx: number, dz: number): 'here' | 'north' | 'south' | 'east' | 'west' {
  if (dx === 0 && dz === 0) return 'here';
  if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? 'east' : 'west';
  return dz > 0 ? 'south' : 'north';
}

export interface PlacedRoom { type: string; enemies: string[]; presence?: RoomPresence; template?: string }

/** The Witness's place: the last floor, the Silence (WITNESS.md). The Silence below the ninth is not built, so the Witness
 *  waits in a quiet room of the ninth floor. Fixed, not seeded: it draws nothing. */
export const WITNESS_FLOOR = LAST_FLOOR;

/** The room template that holds the Boatman's deep water and its island (BOATMAN.md): the drowned nave, on Zone II. */
export const BOATMAN_TEMPLATE = 'drowned-nave';

/** The Boatman's floor: one seeded floor of Zone II (3 or 4), read from the run's root (BOATMAN.md, proposed). */
export const BOATMAN_FLOORS: readonly number[] = [3, 4];

export function boatmanFloorOf(run: RunRandom): number {
  return run.fork('presence', 'boatman').pick([...BOATMAN_FLOORS]);
}

/** The Mender's floors: the vaults of floors 3 to 5, the last floors that keep a vault (MENDER.md, proposed: the Zone III
 *  vault rule). The Mender waits on this floor, and comes only once the player has opened a vault there. Read from the
 *  run's root, never from the player. */
export const MENDER_FLOORS: readonly number[] = [3, 4, 5];

export function menderFloorOf(run: RunRandom): number {
  return run.fork('presence', 'mender').pick([...MENDER_FLOORS]);
}

/** Whether the Mender comes to a vault opened on `floor`: once per run, and only on its seeded floor (MENDER.md). */
export function menderComesTo(run: RunRandom, floor: number, came: boolean): boolean {
  return !came && floor === menderFloorOf(run);
}

/** The Star-reader's floor: one seeded floor of the Tree (the Tree-of-Life floors, levels of kind 'tree', floors 1 to 5),
 *  read from the run's root (STAR-READER.md, proposed: the Leaves of the giant tree are not a room yet). */
export function starReaderFloorOf(run: RunRandom): number {
  const floors: number[] = [];
  for (let k = 1; k <= LAST_FLOOR; k++) if (level(k).kind === 'tree') floors.push(k);
  return run.fork('presence', 'star-reader').pick(floors);
}

export interface MessengerPlan {
  /** Per room, whether it is a dead end of the floor plan (one doorway). Aligned with the rooms. */
  deadEnds: readonly boolean[];
  /** The run's Trickster floor (tricksterFloorOf). */
  tricksterFloor: number;
  /** The depth the last run faded on (the save's `fade`), or undefined. The Echo waits there, once. */
  echoFloor?: number;
  /** The floors on which this run's Wanderer waits (wandererFloorsOf); none when absent. */
  wandererFloors?: readonly number[];
  /** The floor on which this run's Gardener waits (gardenerFloorOf); none when absent. */
  gardenerFloor?: number;
  /** The floors on which this run's Elder and Cartographer wait (elderFloorOf, cartographerFloorOf); none when absent. */
  elderFloor?: number;
  cartographerFloor?: number;
  /** The floor on which this run's Child waits (dwellerFloorOf 'child'); none when absent. */
  childFloor?: number;
  /** The floor on which this run's Boatman may wait (boatmanFloorOf); it waits only in a drowned nave of that floor. */
  boatmanFloor?: number;
  /** Whether the Witness waits on this floor (the last floor, WITNESS_FLOOR). */
  witnessFloor?: number;
  /** The floor on which this run's Star-reader waits (starReaderFloorOf); none when absent. */
  starReaderFloor?: number;
}

/** One Listener per Tree floor, in a quiet normal room. */
export function placePresences(rooms: PlacedRoom[], floor: number, rng: Rng): void {
  if (floor === 0 || level(floor).kind !== 'tree') return;
  const normal = rooms.filter(r => r.type === 'normal');
  if (!normal.length) return;
  const quiet = normal.filter(r => r.enemies.length === 0);
  const room = rng.pick(quiet.length ? quiet : normal);
  room.enemies = [];
  room.presence = 'listener';
}

/** The Trickster waits in a dead end of its floor, and the Echo where the last run faded. Both are normal rooms that
 *  hold no presence yet (so never the start, and never the Listener's room); both are cleared of projections. Runs after
 *  placePresences, so the order of the draws is fixed. */
export function placeMessengers(rooms: PlacedRoom[], floor: number, rng: Rng, plan: MessengerPlan): void {
  if (floor === 0) return;
  const free = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
  if (plan.tricksterFloor === floor && free.length) {
    const dead = free.filter(i => plan.deadEnds[i]);
    const room = rooms[rng.pick(dead.length ? dead : free)];
    room.enemies = [];
    room.presence = 'trickster';
  }
  if (plan.echoFloor === floor) {
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'echo';
    }
  }
  // the Wanderer last, in a quiet normal room that holds no other presence (WANDERER.md)
  if (plan.wandererFloors?.includes(floor)) {
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'wanderer';
    }
  }
  // the Gardener last, in a quiet normal room that holds no other presence (GARDENER.md)
  if (plan.gardenerFloor === floor) {
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'gardener';
    }
  }
  // the Elder, the Cartographer and the Child last, each in a quiet normal room that holds no other presence
  for (const [id, at] of [['elder', plan.elderFloor], ['cartographer', plan.cartographerFloor], ['child', plan.childFloor]] as const) {
    if (at !== floor) continue;
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = id;
    }
  }
  // the Star-reader on the Tree: a quiet normal room of its floor that holds no other presence (STAR-READER.md)
  if (plan.starReaderFloor === floor) {
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'star-reader';
    }
  }
  // the Witness in the Silence: a quiet normal room of the last floor that holds no other presence (WITNESS.md)
  if (plan.witnessFloor === floor) {
    const left = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined);
    const quiet = left.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : left;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'witness';
    }
  }
  // the Boatman by the deep water: a quiet drowned nave of its floor, the only room that holds one (BOATMAN.md). A floor
  // with no such nave holds no Boatman this run.
  if (plan.boatmanFloor === floor) {
    const nave = rooms.map((_, i) => i).filter(i => rooms[i].type === 'normal' && rooms[i].presence === undefined && rooms[i].template === BOATMAN_TEMPLATE);
    const quiet = nave.filter(i => rooms[i].enemies.length === 0);
    const pool = quiet.length ? quiet : nave;
    if (pool.length) {
      const room = rooms[rng.pick(pool)];
      room.enemies = [];
      room.presence = 'boatman';
    }
  }
}
