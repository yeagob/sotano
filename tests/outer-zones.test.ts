// The test bench's secret zones (src/world/outer-zones.ts): each button's column lies in the biome its name says,
// for any seed, measured from the tree's axis.

import { describe, expect, it } from 'vitest';
import { BIOME, Biomes } from '../src/world/biomes';
import { OUTER_ZONES, ZONE_RADIUS, outerZoneColumn, zoneStandY } from '../src/world/outer-zones';

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

describe('standing on a zone (the bench\'s teleport)', () => {
  it('stands on the column\'s ground, not at the height of its top block\'s material id', () => {
    // a flat ground whose top block is at 170: the feet go at 171
    expect(zoneStandY(170, y => y <= 170)).toBe(171);
  });

  it('stands on the highest floor with room for the body above it, a roof or a deck over the ground included', () => {
    // a deck at 180 over a ground at 170: the feet go on the deck
    expect(zoneStandY(170, y => y <= 170 || y === 180)).toBe(181);
    // a block with only one free cell under it: the body cannot stand under it, so the feet go on top of it
    expect(zoneStandY(170, y => y <= 170 || y === 172)).toBe(173);
  });

  it('falls back to the cell over the ground when nothing in reach can hold the body', () => {
    expect(zoneStandY(170, () => true)).toBe(171);
    expect(zoneStandY(170, () => false)).toBe(171);
  });
});
