import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import type { MessageKey } from '../../i18n';
import type { Carried } from '../../entities/player';
import { level } from '../levels';
import type { PartKind } from '../parts';
import { isFlask } from '../potions';
import gardener from './gardener';
import listener from './listener';

export type PresenceId = 'gardener' | 'listener';

export type RoomPresence = PresenceId | 'boundary';

export const PRESENCES: readonly EnemyDef[] = [gardener, listener];
export const PRESENCE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(PRESENCES.map(p => [p.id, p]));

export const PRESENCE_KEY: Record<PresenceId, PartKind> = { gardener: 'flesh', listener: 'heart' };

export function unlocksPresence(id: PresenceId, carried: Carried | undefined): boolean {
  return typeof carried === 'object' && !isFlask(carried) && carried.kind === PRESENCE_KEY[id];
}

export const PRESENCE_TALK: Record<PresenceId, { name: MessageKey; lines: readonly MessageKey[]; silent: MessageKey; hint: MessageKey; heals: boolean }> = {
  gardener: { name: 'presence.gardener.name', lines: ['presence.gardener.1', 'presence.gardener.2'], silent: 'presence.gardener.silent', hint: 'presence.gardener.hint', heals: false },
  listener: { name: 'presence.listener.name', lines: ['presence.listener.1', 'presence.listener.2'], silent: 'presence.listener.silent', hint: 'presence.listener.hint', heals: true },
};

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

interface PlacedRoom { type: string; enemies: string[]; presence?: RoomPresence }

export function placePresences(rooms: PlacedRoom[], floor: number, rng: Rng): void {
  if (floor === 0 || level(floor).kind !== 'tree') return;
  const normal = rooms.filter(r => r.type === 'normal');
  if (!normal.length) return;
  const quiet = normal.filter(r => r.enemies.length === 0);
  const room = rng.pick(quiet.length ? quiet : normal);
  room.enemies = [];
  room.presence = 'listener';
}
