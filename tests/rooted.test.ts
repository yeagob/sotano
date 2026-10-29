import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { ROOTED_HP, rootedChance } from '../src/content/rooted';

describe('rooted projections (BESTIARY §4.2–4.3)', () => {
  it('the first floor never roots, and the chance grows with depth to 18 % on floor 9', () => {
    expect(rootedChance(1)).toBe(0);
    expect(rootedChance(9)).toBe(0.18);
    for (let k = 2; k <= 9; k++) expect(rootedChance(k)).toBeGreaterThan(rootedChance(k - 1));
  });

  it('a rooted projection has more health, and the roll on its own fork is the chance', () => {
    expect(ROOTED_HP).toBeGreaterThan(1);
    const rng = new RunRandom(41);
    let rooted = 0;
    const N = 20000;
    for (let seq = 0; seq < N; seq++) if (rng.fork('floor', 9, 'room', 3, 'rooted', seq).chance(rootedChance(9))) rooted++;
    expect(rooted / N).toBeCloseTo(0.18, 1);
  });
});
