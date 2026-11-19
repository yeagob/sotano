import type { EnemyDef } from '../../enemies/types';
import type { Rng, RunRandom } from '../../core/rng';
import type { MessageKey } from '../../i18n';
import type { Carried } from '../../entities/player';
import { LAST_FLOOR, level } from '../levels';
import type { PartKind } from '../parts';
import { isFlask } from '../potions';
import echo from './echo';
import gardener from './gardener';
import listener from './listener';
import trickster from './trickster';
import wanderer from './wanderer';

export type PresenceId = 'gardener' | 'listener' | 'trickster' | 'echo' | 'wanderer';

export type RoomPresence = PresenceId | 'boundary';

export const PRESENCES: readonly EnemyDef[] = [gardener, listener, trickster, echo, wanderer];
export const PRESENCE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(PRESENCES.map(p => [p.id, p]));

/** What a presence takes: one kind of monster part, any part (the Echo asks for any part in hand), or nothing (the
 *  Wanderer offers a gift, and asks for no part). */
export type PresenceKey = PartKind | 'any' | 'none';

export const PRESENCE_KEY: Record<PresenceId, PresenceKey> = {
  gardener: 'flesh', listener: 'heart', trickster: 'heart', echo: 'any', wanderer: 'none',
};

export function unlocksPresence(id: PresenceId, carried: Carried | undefined): boolean {
  const key = PRESENCE_KEY[id];
  if (key === 'none') return carried === undefined;
  if (typeof carried !== 'object' || isFlask(carried)) return false;
  return key === 'any' || carried.kind === key;
}

/** The offer of a presence: the hand slot it takes and the part, or no slot (index -1) for a presence that takes nothing. */
export function findPresenceOffer(id: PresenceId, hand: readonly Carried[]): { index: number; carried?: Carried } | undefined {
  if (PRESENCE_KEY[id] === 'none') return { index: -1 };
  for (let index = hand.length - 1; index >= 0; index--) {
    const carried = hand[index];
    if (carried !== undefined && unlocksPresence(id, carried)) return { index, carried };
  }
  return undefined;
}

/** The question of an offer's card, where the presence says plainly what it gives back. Presences not listed ask the
 *  plain question ("Offer {item} to {presence}?"). */
export const PRESENCE_OFFER_QUESTION: Partial<Record<PresenceId, MessageKey>> = {
  trickster: 'presence.offer.trade.question',
  echo: 'presence.offer.echo.question',
  wanderer: 'presence.offer.wanderer.question',
};

/** The presences whose offer is a gift to take, not a part to give: the card says Take and Decline, not Give and Keep. */
export const GIFT_OFFER: ReadonlySet<PresenceId> = new Set<PresenceId>(['wanderer']);

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
  wanderer: {
    name: 'presence.wanderer.name', lines: ['presence.wanderer.1', 'presence.wanderer.2'], silent: 'presence.wanderer.silent',
    hint: 'presence.wanderer.hint', drops: true, farewell: 'presence.wanderer.walk',
  },
};

/** Whether a presence leaves when the player declines its offer (the Trickster and the Wanderer do; the others wait). */
export function leavesOnDecline(id: PresenceId): boolean {
  return PRESENCE_TALK[id].farewell !== undefined;
}

/** A presence that gives its reward leaves at once, in the frame the reward appears: its room is ordinary again, and its
 *  silence goes with it (docs/design/built/presences/LISTENER.md). The Trickster also leaves when its trade is declined. */
export function leavesAfterOffer(id: PresenceId): boolean {
  return PRESENCE_TALK[id].drops;
}

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

export interface PlacedRoom { type: string; enemies: string[]; presence?: RoomPresence }

export interface MessengerPlan {
  /** Per room, whether it is a dead end of the floor plan (one doorway). Aligned with the rooms. */
  deadEnds: readonly boolean[];
  /** The run's Trickster floor (tricksterFloorOf). */
  tricksterFloor: number;
  /** The depth the last run faded on (the save's `fade`), or undefined. The Echo waits there, once. */
  echoFloor?: number;
  /** The floors on which this run's Wanderer waits (wandererFloorsOf); none when absent. */
  wandererFloors?: readonly number[];
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
}
