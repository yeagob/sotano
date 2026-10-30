// The laboratory's place in the world: one alembic in one normal room of each laboratory floor
// (docs/design/not-built/practices/potions/BREWING-RULES.md §1), always on the room's floor, and
// never in a room the rest of the floor needs.

import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { LABORATORY_FLOORS } from '../src/world/floor';
import { buildRun } from './helpers';

describe('the laboratory', () => {
  it('is on floors 2, 4, 6 and 8, and nowhere else', () => {
    expect(LABORATORY_FLOORS).toEqual([2, 4, 6, 8]);
    for (const seed of [0xBEEF, 7, 42]) {
      const { floors, w } = buildRun(seed, 10);
      for (const f of floors) {
        const lab = f.laboratory;
        if (!LABORATORY_FLOORS.includes(f.floor)) {
          expect(lab, `seed ${seed} floor ${f.floor}`).toBeNull();
          continue;
        }
        expect(lab, `seed ${seed} floor ${f.floor}`).not.toBeNull();
        expect(w.get(lab!.x, lab!.y, lab!.z)).toBe(MAT.alembic);
        const room = f.rooms.find(r => r.id === lab!.room)!;
        expect(room.type).toBe('normal');
        expect(lab!.x >= room.x0 && lab!.x < room.x0 + room.w).toBe(true);
        expect(lab!.z >= room.z0 && lab!.z < room.z0 + room.d).toBe(true);
        expect(lab!.y).toBe(room.y0);
      }
    }
  });

  it('every laboratory floor has its alembic, whatever the seed', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { floors } = buildRun(seed * 7919, 10);
      for (const f of floors) {
        if (!LABORATORY_FLOORS.includes(f.floor)) continue;
        expect(f.laboratory, `seed ${seed} floor ${f.floor}`).not.toBeNull();
        const lab = f.laboratory!;
        expect(f.keys.some(k => k.x === lab.x && k.z === lab.z), `seed ${seed} floor ${f.floor}: a key under the alembic`).toBe(false);
        expect(f.bombs.some(b => b.x === lab.x && b.z === lab.z), `seed ${seed} floor ${f.floor}: a bomb under the alembic`).toBe(false);
      }
    }
  }, 120000);

  it('holds exactly one alembic per laboratory floor', () => {
    const { floors, w } = buildRun(0xBEEF, 10);
    for (const f of floors) {
      let count = 0;
      for (const r of f.rooms) for (let x = r.x0; x < r.x0 + r.w; x++) for (let z = r.z0; z < r.z0 + r.d; z++) {
        if (w.get(x, r.y0, z) === MAT.alembic) count++;
      }
      expect(count, `floor ${f.floor}`).toBe(LABORATORY_FLOORS.includes(f.floor) ? 1 : 0);
    }
  });
});
