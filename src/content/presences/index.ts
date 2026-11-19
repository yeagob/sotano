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

export type PresenceId = 'gardener' | 'listener' | 'trickster' | 'echo';

export type RoomPresence = PresenceId | 'boundary';

export const PRESENCES: readonly EnemyDef[] = [gardener, listener, trickster, echo];
export const PRESENCE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(PRESENCES.map(p => [p.id, p]));

/** What a presence takes: one kind of monster part, or any part (the Echo asks for any part in hand). */
export type PresenceKey = PartKind | 'any';

export const PRESENCE_KEY: Record<PresenceId, PresenceKey> = { gardener: 'flesh', listener: 'heart', trickster: 'heart', echo: 'any' };

export function unlocksPresence(id: PresenceId, carried: Carried | undefined): boolean {
  if (typeof carried !== 'object' || isFlask(carried)) return false;
  const key = PRESENCE_KEY[id];
  return key === 'any' || carried.kind === key;
}

export function findPresenceOffer(id: PresenceId, hand: readonly Carried[]): { index: number; carried: Carried } | undefined {
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
};

export interface PresenceTalk {
  name: MessageKey;
  lines: readonly MessageKey[];
  silent: MessageKey;
  hint: MessageKey;
  /** Gives a reward when its offer is accepted (the game rolls it from the run's `drops` stream). */
  drops: boolean;
  /** The Trickster's line when the player declines its trade, before it leaves. */
  laugh?: MessageKey;
}

export const PRESENCE_TALK: Record<PresenceId, PresenceTalk> = {
  gardener: { name: 'presence.gardener.name', lines: ['presence.gardener.1', 'presence.gardener.2'], silent: 'presence.gardener.silent', hint: 'presence.gardener.hint', drops: false },
  listener: { name: 'presence.listener.name', lines: ['presence.listener.1', 'presence.listener.2'], silent: 'presence.listener.silent', hint: 'presence.listener.hint', drops: true },
  trickster: {
    name: 'presence.trickster.name', lines: ['presence.trickster.1', 'presence.trickster.2'], silent: 'presence.trickster.silent',
    hint: 'presence.trickster.hint', drops: true, laugh: 'presence.trickster.laugh',
  },
  echo: { name: 'presence.echo.name', lines: ['presence.echo.1', 'presence.echo.2'], silent: 'presence.echo.silent', hint: 'presence.echo.hint', drops: true },
};

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

export interface PlacedRoom { type: string; enemies: string[]; presence?: RoomPresence }

export interface MessengerPlan {
  /** Per room, whether it is a dead end of the floor plan (one doorway). Aligned with the rooms. */
  deadEnds: readonly boolean[];
  /** The run's Trickster floor (tricksterFloorOf). */
  tricksterFloor: number;
  /** The depth the last run faded on (the save's `fade`), or undefined. The Echo waits there, once. */
  echoFloor?: number;
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
}
