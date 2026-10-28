import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import type { MessageKey } from '../../i18n';
import { level } from '../levels';
import gardener from './gardener';
import listener from './listener';

export type PresenceId = 'gardener' | 'listener';

export const PRESENCES: readonly EnemyDef[] = [gardener, listener];
export const PRESENCE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(PRESENCES.map(p => [p.id, p]));

export const PRESENCE_TALK: Record<PresenceId, { name: MessageKey; lines: readonly MessageKey[]; heals: boolean }> = {
  gardener: { name: 'presence.gardener.name', lines: ['presence.gardener.1', 'presence.gardener.2'], heals: false },
  listener: { name: 'presence.listener.name', lines: ['presence.listener.1', 'presence.listener.2'], heals: true },
};

export const TALK_REACH = 2.2;

interface PlacedRoom { type: string; enemies: string[]; presence?: PresenceId }

export function placePresences(rooms: PlacedRoom[], floor: number, rng: Rng): void {
  if (floor === 0) {
    const start = rooms.find(r => r.type === 'start');
    if (start) start.presence = 'gardener';
    return;
  }
  if (level(floor).kind !== 'tree') return;
  const normal = rooms.filter(r => r.type === 'normal');
  if (!normal.length) return;
  const quiet = normal.filter(r => r.enemies.length === 0);
  const room = rng.pick(quiet.length ? quiet : normal);
  room.enemies = [];
  room.presence = 'listener';
}
