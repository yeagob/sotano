import { describe, expect, it } from 'vitest';
import { DEITIES } from '../src/sky/creatures/deities';
import { ANIMALS } from '../src/sky/types';
import { PRACTICES, STARTING, duel, type DuelResult } from './helpers/sky-duel';

const FULL = !!process.env.SKY_PLAYTEST;

export const TARGETS = {
  reacted: 0.8,
  horseReacted: 0.6,
  actsPerMin: 2,
  held: 0.2,
  exposure: [0.2, 0.9] as const,
  pandaPractices: [30, 240] as const,
};

const actsPerMin = (r: DuelResult) => (r.deityActs + r.minionActs) / (r.seconds / 60);

describe('a simulated player against each deity (#357)', () => {
  for (const [floor, cap] of [[1, 60], [2, 60], [3, 60], [4, 30], [5, 60]] as const) {
    it(`floor ${floor}, the starting kit: the deity moves when hit, it and its herd act on the player, it stays hard to reach`, () => {
      const r = duel(floor, STARTING, cap);
      const animal = ANIMALS[floor - 1];
      expect(r.reactions, `${animal} was hit`).toBeGreaterThan(0);
      expect(r.reacted / r.reactions, `${animal} moved after ${r.reacted} of ${r.reactions} hits`).toBeGreaterThanOrEqual(animal === 'horse' ? TARGETS.horseReacted : TARGETS.reacted);
      expect(actsPerMin(r), `${animal} acts`).toBeGreaterThanOrEqual(TARGETS.actsPerMin);
      expect(r.heldShare, `${animal} held`).toBeLessThanOrEqual(TARGETS.held);
      expect(r.underground).toBe(0);
      expect(r.exposure, `${animal} exposure`).toBeGreaterThanOrEqual(TARGETS.exposure[0]);
      expect(r.exposure, `${animal} exposure`).toBeLessThanOrEqual(TARGETS.exposure[1]);
      expect(r.minions, `${animal} herd`).toBeGreaterThanOrEqual(10);
      expect(r.won).toBe(false);
    }, 60_000);
  }

  it('floor 1, the normal practices: the panda is won within its target time, neither trivially nor never', () => {
    const r = duel(1, PRACTICES, TARGETS.pandaPractices[1]);
    expect(r.won).toBe(true);
    expect(r.seconds).toBeGreaterThanOrEqual(TARGETS.pandaPractices[0]);
    expect(r.deityHits).toBeGreaterThanOrEqual(DEITIES.panda.hits);
  }, 60_000);

  it.runIf(FULL)('the full measurements (SKY_PLAYTEST=1)', () => {
    const floors = (process.env.SKY_FLOORS ?? '1,2,3,4,5').split(',').map(Number);
    const cap = Number(process.env.SKY_CAP ?? 120);
    const kits = (process.env.SKY_KITS ?? 'starting,practices').split(',').map(k => (k === 'starting' ? STARTING : PRACTICES));
    for (const n of floors) for (const kit of kits) {
      const t0 = Date.now();
      const r = duel(n, kit, cap);
      console.log(JSON.stringify({ ...r, ms: Date.now() - t0 }));
      expect(r.seconds).toBeGreaterThan(0);
    }
  }, 7_200_000);
});
