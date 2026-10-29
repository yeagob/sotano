// Crates (issue #6): most broken crates give nothing, some give a key, heart or small bomb.

import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { CRATE_CONTENTS, CRATE_DROP, rollCrate } from '../src/content/tables/crates';

describe('crate drops', () => {
  it('only gives keys, hearts and small bombs', () => {
    expect(CRATE_CONTENTS.entries.map(e => e.value).sort()).toEqual(['bomb', 'heart', 'key']);
  });

  it('gives nothing most of the time, and about CRATE_DROP of the time', () => {
    const rng = new Rng(7);
    const n = 20000;
    let drops = 0;
    for (let i = 0; i < n; i++) if (rollCrate(rng, { floor: 1 })) drops++;
    expect(Math.abs(drops / n - CRATE_DROP)).toBeLessThan(0.02);
  });

  it('is deterministic for the same stream', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 200; i++) expect(rollCrate(a, { floor: 3 })).toBe(rollCrate(b, { floor: 3 }));
  });
});
