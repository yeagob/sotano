
import type { Rng } from '../../core/rng';
import type { EnemyDef } from '../../enemies/types';
import type { FloorResult } from '../../world/floor';
import chirper from './chirper';
import cinderwalker from './cinderwalker';
import delver from './delver';
import drifter from './drifter';
import ferryback from './ferryback';
import huddler from './huddler';
import inkmite from './inkmite';
import mossling from './mossling';
import rootling from './rootling';
import bubbler from './bubbler';
import wonder from './wonder';

export const CREATURES: readonly EnemyDef[] = [
  wonder, rootling, mossling, chirper, delver, bubbler, ferryback, drifter, inkmite, cinderwalker, huddler,
];
export const CREATURE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(CREATURES.map(c => [c.id, c]));

export const CREATURE_LIFE: readonly { def: string; floors: readonly [number, number]; count: readonly [number, number] }[] = [
  { def: 'wonder', floors: [0, 0], count: [2, 4] },
  { def: 'rootling', floors: [0, 0], count: [2, 3] },
  { def: 'mossling', floors: [0, 0], count: [2, 3] },
  { def: 'chirper', floors: [1, 2], count: [2, 3] },
  { def: 'delver', floors: [1, 3], count: [1, 2] },
  { def: 'bubbler', floors: [3, 4], count: [1, 2] },
  { def: 'ferryback', floors: [3, 4], count: [1, 1] },
  { def: 'drifter', floors: [5, 6], count: [1, 2] },
  { def: 'inkmite', floors: [5, 6], count: [2, 3] },
  { def: 'cinderwalker', floors: [7, 8], count: [1, 2] },
  { def: 'huddler', floors: [9, 9], count: [2, 3] },
];

export function ambientCreatures(f: FloorResult, rng: Rng): { def: string; room: number; x: number; y: number; z: number }[] {
  const rooms = f.rooms.filter(r => r.type === 'normal' || r.type === 'start');
  const out: { def: string; room: number; x: number; y: number; z: number }[] = [];
  if (!rooms.length) return out;
  for (const life of CREATURE_LIFE) {
    if (f.floor < life.floors[0] || f.floor > life.floors[1]) continue;
    const n = life.count[0] + rng.int(0, life.count[1] - life.count[0]);
    for (let i = 0; i < n; i++) {
      const r = rng.pick(rooms);
      out.push({ def: life.def, room: r.id, x: r.hx + 6.5 + rng.range(-3, 3), y: r.y0 + 1.5, z: r.hz + 3.5 + rng.range(-1.5, 1.5) });
    }
  }
  return out;
}
