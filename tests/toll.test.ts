import { describe, expect, it } from 'vitest';
import { LAST_FLOOR, tollOf } from '../src/content/levels';

describe('the way down asks a toll', () => {
  it('asks one thing from the first level, one more each level, five from floor 4', () => {
    for (let k = 0; k <= 4; k++) expect(tollOf(k), `floor ${k}`).toEqual({ count: k + 1, practices: false });
  });

  it('asks practices from floor 5 on: one, two, three and four', () => {
    for (let k = 5; k <= 8; k++) expect(tollOf(k), `floor ${k}`).toEqual({ count: k - 4, practices: true });
  });

  it('is free from the last floor, which opens into silence, and above the roots', () => {
    expect(tollOf(LAST_FLOOR)).toBeNull();
    expect(tollOf(-1)).toBeNull();
  });
});
