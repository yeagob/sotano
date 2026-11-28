// The test bench's secret zones (src/world/outer-zones.ts): each button's column lies in the biome its name says,
// for any seed, measured from the tree's axis.

import { describe, expect, it } from 'vitest';
import { BIOME, Biomes } from '../src/world/biomes';
import { OUTER_ZONES, ZONE_RADIUS, outerZoneColumn } from '../src/world/outer-zones';

describe('the bench zones', () => {
  it('lists the four zones in button order', () => {
    expect([...OUTER_ZONES]).toEqual(['desert', 'ice', 'mountains', 'port']);
  });

  for (const seed of [0xbeef, 0x1234, 0x9f3]) {
    it(`stands each zone in its own biome (seed ${seed.toString(16)})`, () => {
      const cx = 0, cz = 0;
      const biomes = new Biomes(seed, cx, cz);
      const t = { cx, cz, biomes };
      const kind = (zone: (typeof OUTER_ZONES)[number]) => {
        const [x, z] = outerZoneColumn(zone, t);
        return biomes.kind(x, z);
      };
      expect(kind('desert')).toBe(BIOME.desert);
      expect(kind('ice')).toBe(BIOME.ice);
      expect(kind('mountains')).toBe(BIOME.mountains);
      expect(kind('port')).toBe(BIOME.sea);
    });
  }

  it('puts the desert south and the ice north of the axis, at ZONE_RADIUS', () => {
    const t = { cx: 10, cz: -5, biomes: new Biomes(0xbeef, 10, -5) };
    expect(outerZoneColumn('desert', t)).toEqual([10, -5 + ZONE_RADIUS]);
    expect(outerZoneColumn('ice', t)).toEqual([10, -5 - ZONE_RADIUS]);
  });
});
