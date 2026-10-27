
import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import furnace from './furnace';
import grudge from './grudge';
import hoard from './hoard';
import impostor from './impostor';
import inertia from './inertia';
import insatiable from './insatiable';
import manyFaces from './many-faces';
import oldRule from './old-rule';
import overwhelm from './overwhelm';
import downpour from './downpour';
import resistance from './resistance';
import shadow from './shadow';
import thresholdGuardian from './threshold-guardian';
import verdict from './verdict';

export const BOSSES: readonly EnemyDef[] = [
  resistance, inertia, insatiable,
  overwhelm, hoard, downpour,
  thresholdGuardian, verdict, grudge, oldRule,
  furnace, impostor, manyFaces,
  shadow,
];
export const BOSS_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(BOSSES.map(b => [b.id, b]));

export const BOSS_ZONES: readonly { floors: readonly [number, number]; pool: readonly string[]; keystone?: string }[] = [
  { floors: [1, 2], pool: ['resistance', 'inertia', 'insatiable'] },
  { floors: [3, 4], pool: ['overwhelm', 'hoard', 'downpour'] },
  { floors: [5, 5], pool: [], keystone: 'threshold-guardian' },
  { floors: [6, 6], pool: ['verdict', 'grudge', 'old-rule'] },
  { floors: [7, 8], pool: ['furnace', 'impostor', 'many-faces'] },
  { floors: [9, 9], pool: [], keystone: 'shadow' },
];

export function bossFor(floor: number, rng: Rng, used: ReadonlySet<string>): string | null {
  const zone = BOSS_ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1]);
  if (!zone) return null;
  if (zone.keystone) return zone.keystone;
  const free = zone.pool.filter(id => !used.has(id));
  return free.length ? rng.pick(free) : null;
}

export const bossHp = (floor: number) => Math.round(140 * Math.pow(1000 / 140, (Math.max(1, floor) - 1) / 8));
