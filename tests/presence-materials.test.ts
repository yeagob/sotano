// The presences' materials (docs/design/not-built/presences/README.md D13, owner ruling 2026-11-19): a living root and a
// tuft of cave moss for the Gardener, and the ore of each zone for the Cartographer's chart.

import { describe, expect, it } from 'vitest';
import { GARDEN_MATERIALS, MAT, MATERIALS, ORES, mat } from '../src/content/materials';
import { LAST_FLOOR, LEVELS, ZONES, oreOf, zoneOf } from '../src/content/levels';
import { MATERIAL_TILES, tileFor } from '../src/content/tiles';
import { RECIPES } from '../src/content/recipes';
import { LISTENER_GIFT_TABLE } from '../src/content/tables/heart-gifts';
import {
  cartographerOre, findCartographerOre, findPresenceOffer, gardenerWants, unlocksPresence, PRESENCE_KEY,
} from '../src/content/presences';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { PARTS } from '../src/content/parts';
import { bandOf, floorY, zoned } from '../src/world/floor';
import { buildRun } from './helpers';

const NEW = ['root', 'cavemoss', 'copperore', 'tinore', 'quicksilverore', 'leadore'];

describe('the presences\' materials exist and are registered', () => {
  it('each one has an id, a tile in the atlas and a breakable block', () => {
    for (const key of NEW) {
      const id = MAT[key];
      expect(id, key).toBeGreaterThan(0);
      expect(mat(id).key).toBe(key);
      expect(MATERIALS[id]).toBe(mat(id));
      expect(id).toBeLessThan(MATERIAL_TILES);
      for (let face = 0; face < 6; face++) expect(tileFor(id, face)).toBe(id);
      expect(Number.isFinite(mat(id).hp), key).toBe(true);
      expect(mat(id).concept, key).toBeTruthy();
    }
  });

  it('each one has its English name in its definition and its Spanish name in the catalog', () => {
    expect(NEW.map(k => mat(MAT[k]).name)).toEqual(['Living root', 'Cave moss', 'Copper ore', 'Tin ore', 'Quicksilver ore', 'Lead ore']);
    for (const key of NEW) {
      expect(ES.content.materials[key], key).toBeTruthy();
      expect(ES.content.materials[key]).not.toBe(mat(MAT[key]).name);
    }
  });

  it('the five zones each have their own ore, iron on the roots and Zone I', () => {
    expect(ZONES.map(z => z.ore)).toEqual(['ore', 'copperore', 'tinore', 'quicksilverore', 'leadore']);
    expect(ORES).toEqual(ZONES.map(z => MAT[z.ore]));
    expect(oreOf(0)).toBe('ore');
    expect(zoneOf(0)).toBe(0);
    for (let k = 1; k <= LAST_FLOOR; k++) expect(MAT[LEVELS[k].ore]).toBe(MAT[ZONES[zoneOf(k) - 1].ore]);
    expect([3, 5, 7, 9].map(oreOf)).toEqual(['copperore', 'tinore', 'quicksilverore', 'leadore']);
    // an ore block of a room template takes its floor's ore; nothing else changes
    expect(zoned(MAT.ore, 4)).toBe(MAT.copperore);
    expect(zoned(MAT.stone, 9)).toBe(MAT.stone);
  });

  it('every ore counts where an ore is asked for: the questioning tincture takes any of them', () => {
    const tincture = RECIPES.find(r => r.potion === 'questioning-tincture')!;
    const slot = tincture.slots.find(s => 'materials' in s) as { materials: readonly number[] };
    expect([...slot.materials].sort()).toEqual([...ORES].sort());
  });

  it('they stay out of the Listener\'s reward table (15/75/10)', () => {
    expect(LISTENER_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 15], ['special', 75], ['red', 10]]);
  });
});

describe('the rock of every floor holds the Gardener\'s root and moss and its zone\'s ore', () => {
  it('a seeded world: every band has root and moss, and its ore is the ore of its zone (no other ore)', () => {
    const run = buildRun(0xBEEF);
    const w = run.w;
    for (let k = 0; k <= LAST_FLOOR; k++) {
      const seen = new Set<number>();
      for (let y = floorY(k) - 6; y < floorY(k) + 4; y++) {
        if (bandOf(y) !== k) continue;
        for (let z = 1; z < w.sz - 1; z += 1) for (let x = 1; x < w.sx - 1; x++) seen.add(w.data[w.idx(x, y, z)]);
      }
      expect(seen.has(MAT.root), `floor ${k} root`).toBe(true);
      expect(seen.has(MAT.cavemoss), `floor ${k} moss`).toBe(true);
      expect(seen.has(MAT[oreOf(k)]), `floor ${k} ore`).toBe(true);
      for (const ore of ORES) if (ore !== MAT[oreOf(k)]) expect(seen.has(ore), `floor ${k} has ${mat(ore).key}`).toBe(false);
    }
  });
});

describe('the Gardener asks for a root and a tuft of moss (GARDENER.md)', () => {
  it('takes either one, and then only the one it does not hold yet', () => {
    expect(PRESENCE_KEY.gardener).toBe('garden');
    expect(GARDEN_MATERIALS).toEqual([MAT.root, MAT.cavemoss]);
    for (const m of GARDEN_MATERIALS) expect(unlocksPresence('gardener', m)).toBe(true);
    expect(unlocksPresence('gardener', MAT.ore)).toBe(false);
    expect(unlocksPresence('gardener', PARTS[0])).toBe(false);
    const hand = [MAT.cavemoss, MAT.stone, MAT.root];
    expect(findPresenceOffer('gardener', hand)).toEqual({ index: 2, carried: MAT.root });
    expect(findPresenceOffer('gardener', hand, [MAT.root])).toEqual({ index: 0, carried: MAT.cavemoss });
    expect(findPresenceOffer('gardener', [MAT.root], [MAT.root])).toBeUndefined();
    expect(gardenerWants([])).toEqual([MAT.root, MAT.cavemoss]);
    expect(gardenerWants([MAT.root])).toEqual([MAT.cavemoss]);
    expect(gardenerWants([MAT.cavemoss, MAT.root])).toEqual([]);
  });

  it('its lines name the materials in both languages', () => {
    for (const cat of [EN, ES]) {
      expect(cat.messages['presence.gardener.more']).toContain('{item}');
      expect(cat.messages['presence.offer.gardener.question']).toContain('{item}');
      expect(cat.messages['presence.gardener.hint']).toBeTruthy();
    }
  });
});

describe('the Cartographer charts the floor with the ore of its zone (CARTOGRAPHER.md)', () => {
  it('asks for the ore of the zone it waits in, and no other', () => {
    for (let k = 1; k <= LAST_FLOOR; k++) {
      const ore = cartographerOre(k);
      expect(ore).toBe(MAT[oreOf(k)]);
      expect(findCartographerOre(k, [MAT.stone, ore, PARTS[0]])).toEqual({ index: 1, carried: ore });
      for (const other of ORES) if (other !== ore) expect(findCartographerOre(k, [other])).toBeUndefined();
    }
    expect(findCartographerOre(1, [])).toBeUndefined();
  });

  it('its chart lines exist in both languages, with the places they name', () => {
    for (const cat of [EN, ES]) {
      expect(cat.messages['presence.offer.cartographer.ore']).toContain('{item}');
      expect(cat.messages['presence.cartographer.chart.vault']).toContain('{vault}');
      expect(cat.messages['presence.cartographer.chart.boss']).toContain('{boss}');
      for (const k of ['novault', 'noboss', 'done'] as const) expect(cat.messages[`presence.cartographer.chart.${k}`]).toBeTruthy();
    }
  });
});
