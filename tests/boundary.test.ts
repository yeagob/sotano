import { describe, expect, it } from 'vitest';
import { buildRun } from './helpers';
import boundary, { SANCTUARY_RADIUS } from '../src/content/presences/boundary';
import { CHEST_RARE } from '../src/content/tables/chests';
import { MAT } from '../src/content/materials';

describe('the Boundary: what it is', () => {
  it('a projection that cannot be hurt, that never leaves its sanctuary, and is never rostered', () => {
    expect(boundary.kind).toBe('projection');
    expect(boundary.armor).toBe(1);
    expect(boundary.responds).toBe('negative');
    expect(boundary.speed).toBe(0);
    expect(boundary.hp).toBeGreaterThan(1000);
    expect(boundary.minFloor).toBe(99);
    expect(SANCTUARY_RADIUS).toBe(2);
  });

  it('a chest has a small chance of an extra random practice', () => {
    expect(CHEST_RARE).toBeGreaterThan(0);
    expect(CHEST_RARE).toBeLessThan(0.2);
  });
});

describe('the Boundary: where it lives', () => {
  it('every vault of a dungeon floor is a sanctuary: two chests and a ring of pedestals around its centre', () => {
    const run = buildRun(7, 9);
    let vaults = 0;
    for (const f of run.floors) {
      for (const r of f.rooms) {
        if (r.type !== 'vault') continue;
        vaults++;
        expect(r.presence, `vault ${r.id}`).toBe('boundary');
        const chests = f.chests.filter(c => c.room === r.id);
        expect(chests.length, `chests in vault ${r.id}`).toBeGreaterThanOrEqual(1);
        const cx = r.x0 + 6, cz = r.z0 + 3;
        const ring = [];
        for (let dz = -SANCTUARY_RADIUS; dz <= SANCTUARY_RADIUS; dz++) for (let dx = -SANCTUARY_RADIUS; dx <= SANCTUARY_RADIUS; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== SANCTUARY_RADIUS) continue;
          ring.push(run.w.get(cx + dx, r.y0, cz + dz));
        }
        expect(ring.filter(m => m === MAT.pedestal).length, `ring in vault ${r.id}`).toBeGreaterThan(0);
      }
    }
    expect(vaults).toBeGreaterThan(0);
  });
});
