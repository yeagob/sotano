import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { MISSIONS, MISSION_IDS, MISSION_WINDOW_MS, pickMission, rewardBand } from '../src/content/presences/missions';
import { ItemPools } from '../src/items/pool';
import { ITEMS } from '../src/content/items';

describe('the Boundary missions', () => {
  it('offers the five approved missions, each with a title, a body and an alternative', () => {
    expect(MISSION_IDS.sort()).toEqual(['breathe', 'draw', 'letter', 'message', 'phrase']);
    for (const m of Object.values(MISSIONS)) expect(m.title && m.body && m.alt).toBeTruthy();
  });

  it('picks a mission from the list', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 20; i++) expect(MISSION_IDS).toContain(pickMission(rng));
  });

  it('a yes inside the window is tier 1 or 2; a yes after it is tier 3 or 4', () => {
    expect(rewardBand(0)).toEqual([1, 2]);
    expect(rewardBand(MISSION_WINDOW_MS - 1)).toEqual([1, 2]);
    expect(rewardBand(MISSION_WINDOW_MS)).toEqual([3, 4]);
    expect(rewardBand(120000)).toEqual([3, 4]);
  });
});

describe('a runtime draw in a quality band', () => {
  it('draws only items of the band while the pool has them', () => {
    const pools = new ItemPools(ITEMS);
    const rng = new Rng(3);
    const id = pools.drawRuntime('treasure', rng, [3, 4]);
    const def = ITEMS.find(i => i.id === id)!;
    expect(def.quality === 3 || def.quality === 4).toBe(true);
  });
});
