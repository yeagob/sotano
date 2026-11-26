// Intention polarity (docs/design/built/encounters/POLARITY.md, docs/reviews/polarity.md): the bar that decides both
// endings, the relapse and the ally rules, as pure functions. The game applies their results (tests/bar-conversion.test.ts
// drives the real damage pipeline); these tests pin the numbers the owner ruled on (2026-11-26).

import { describe, expect, it } from 'vitest';
import {
  allyHeal, barAfter, barLove, barRest, barShare, barStart, barTop, BAR_TOP, convertedHp, isConverted, meetsIntention,
  relapseHp, resolveHit, TURN_HP, type HitState, type Polarity,
} from '../src/combat/polarity';

const base = (over: Partial<HitState> = {}): HitState => ({ polarity: 'positive', faction: 'projection', hp: 24, ...over });

/** A fresh being of `maxHp` hit by `hits` intentions in turn, each of `damage`: its bar after them. */
const play = (maxHp: number, hits: readonly Polarity[], damage: number) =>
  hits.reduce((hp, p) => barAfter(p, hp, maxHp, damage), barStart(maxHp));

describe('the bar (owner, 2026-11-26)', () => {
  it('runs from 0 to twice the being\'s maximum health, and starts in the middle (50 %)', () => {
    expect(BAR_TOP).toBe(2);
    expect(barStart(24)).toBe(24);
    expect(barTop(24)).toBe(48);
    expect(barShare(barStart(24), 24)).toBe(0.5);
    expect(barShare(barStart(144), 144)).toBe(0.5);
  });

  it('a positive hit raises it by the whole damage; a negative hit lowers it by the whole damage', () => {
    expect(barAfter('positive', 24, 24, 3.5)).toBeCloseTo(27.5);
    expect(barAfter('negative', 24, 24, 3.5)).toBeCloseTo(20.5);
    expect(resolveHit(base(), 3.5)).toEqual({ harm: 0, love: 3.5, relapse: false });
    expect(resolveHit(base({ polarity: 'negative' }), 3.5)).toEqual({ harm: 3.5, love: 0, relapse: false });
  });

  it('never passes either end', () => {
    expect(barAfter('positive', 46, 24, 10)).toBe(48);
    expect(barAfter('negative', 2, 24, 10)).toBe(0);
  });

  it('reaching 0 is a release; reaching 2 × maxHp is a conversion', () => {
    expect(play(24, Array(7).fill('negative'), 3.5)).toBe(0);
    expect(play(24, Array(6).fill('negative'), 3.5)).toBeGreaterThan(0);
    expect(isConverted(play(24, Array(7).fill('positive'), 3.5), 24)).toBe(true);
    expect(isConverted(play(24, Array(6).fill('positive'), 3.5), 24)).toBe(false);
  });

  it('killing with harm and converting with love take the same number of the same hits', () => {
    for (const maxHp of [8, 24, 52, 120, 144, 60]) {
      for (const damage of [3.5, 5, 12]) {
        let toKill = 0, hp = barStart(maxHp);
        while (hp > 0) { hp = barAfter('negative', hp, maxHp, damage); toKill++; }
        let toTurn = 0; hp = barStart(maxHp);
        while (!isConverted(hp, maxHp)) { hp = barAfter('positive', hp, maxHp, damage); toTurn++; }
        expect(toTurn).toBe(toKill);
        expect(toTurn).toBe(Math.ceil(maxHp / damage - 1e-9));
      }
    }
  });

  it('is the same whatever the maximum health: two beings at the same share answer the same share of their life', () => {
    const small = 12, big = 120;
    // the same hits, each a tenth of its own life: both stand at the same share after any sequence
    const hits: Polarity[] = ['positive', 'positive', 'negative', 'positive', 'negative', 'negative', 'negative'];
    let a = barStart(small), b = barStart(big);
    for (const p of hits) {
      a = barAfter(p, a, small, small / 10);
      b = barAfter(p, b, big, big / 10);
      expect(barShare(a, small)).toBeCloseTo(barShare(b, big));
    }
    // and both end at the same rung: a quarter of the way to either ending is a quarter for both
    expect(barShare(small * 1.5, small)).toBe(barShare(big * 1.5, big));
    expect(barRest(small * 0.5, small)).toBe(barRest(big * 0.5, big));
  });

  it('follows every change of the shot: love up, harm down, love up again', () => {
    let hp = barStart(24);
    const seen: number[] = [];
    for (const p of ['positive', 'positive', 'negative', 'negative', 'negative', 'positive'] as Polarity[]) {
      hp = barAfter(p, hp, 24, 4);
      seen.push(hp);
    }
    expect(seen).toEqual([28, 32, 28, 24, 20, 24]);
  });

  it('a positive hit never harms a projection: the route of light always ends in a conversion', () => {
    for (const hp of [0.1, 1, 24, 47.9]) expect(resolveHit(base({ hp }), 50).harm).toBe(0);
  });
});

describe('readings of the bar', () => {
  it('the captive part is love past the middle, 0 → 1', () => {
    expect(barLove(24, 24)).toBe(0);
    expect(barLove(12, 24)).toBe(0);
    expect(barLove(36, 24)).toBe(0.5);
    expect(barLove(48, 24)).toBe(1);
  });

  it('what is left of the fight is 1 in the middle and 0 at either end, and hp / maxHp on the harm side', () => {
    expect(barRest(24, 24)).toBe(1);
    expect(barRest(0, 24)).toBe(0);
    expect(barRest(48, 24)).toBe(0);
    expect(barRest(8, 24)).toBeCloseTo(8 / 24);
    expect(barRest(40, 24)).toBeCloseTo(8 / 24);
  });
});

describe('a boss runs on the same bar', () => {
  it('a boss of 140 turns after 14 good hits of 10, and is released after 14 bad ones, the same as any being', () => {
    expect(play(140, Array(14).fill('positive'), 10)).toBe(280);
    expect(isConverted(play(140, Array(13).fill('positive'), 10), 140)).toBe(false);
    expect(play(140, Array(14).fill('negative'), 10)).toBe(0);
  });
});

describe('changing side', () => {
  it('a converted projection comes back with half its maximum health as an ally', () => {
    expect(TURN_HP).toBe(0.5);
    expect(convertedHp(24)).toBe(12);
    expect(convertedHp(9)).toBe(4.5);
  });

  it('only a positive intention fills the bar; an ally is never filled again', () => {
    expect(resolveHit(base({ polarity: 'negative', hp: 47 }), 3.5).love).toBe(0);
    expect(resolveHit(base({ faction: 'self', hp: 6 }), 3.5)).toEqual({ harm: 0, love: 0, relapse: false });
  });
});

describe('allies', () => {
  it('a positive intention heals an ally by half the damage, never past its maximum', () => {
    expect(allyHeal(3.5, 10, 12)).toBeCloseTo(1.75);
    expect(allyHeal(3.5, 11.5, 12)).toBeCloseTo(0.5);
    expect(allyHeal(3.5, 12, 12)).toBe(0);
  });

  it('a negative intention harms an ally at full damage', () => {
    expect(resolveHit(base({ polarity: 'negative', faction: 'self', hp: 12 }), 3.5)).toEqual({ harm: 3.5, love: 0, relapse: false });
  });

  it('an ally at zero under a negative intention relapses, its bar back in the middle', () => {
    expect(resolveHit(base({ polarity: 'negative', faction: 'self', hp: 3 }), 3.5).relapse).toBe(true);
    expect(relapseHp(12)).toBe(12);
    expect(barShare(relapseHp(9), 9)).toBe(0.5);
  });

  it('an ally above zero is only hurt', () => {
    const r = resolveHit(base({ polarity: 'negative', faction: 'self', hp: 6 }), 3.5);
    expect(r.relapse).toBe(false);
    expect(r.harm).toBe(3.5);
  });
});

describe('what an intention meets', () => {
  it('hostile projections are always met', () => {
    expect(meetsIntention('projection', 1, 12, 'positive')).toBe(true);
    expect(meetsIntention('projection', 1, 12, 'negative')).toBe(true);
    expect(meetsIntention('projection', 20, 12, 'positive')).toBe(true);
  });

  it('a healthy ally lets positive intentions pass, and a negative one always hits it', () => {
    expect(meetsIntention('self', 12, 12, 'positive')).toBe(false);
    expect(meetsIntention('self', 12, 12, 'negative')).toBe(true);
  });

  it('a hurt ally absorbs a positive intention (it heals); a negative one meets any creature; a healthy neutral lets positive pass', () => {
    expect(meetsIntention('self', 6, 12, 'positive')).toBe(true);
    expect(meetsIntention('neutral', 1, 12, 'negative')).toBe(true);
    expect(meetsIntention('neutral', 3, 3, 'positive')).toBe(false);
  });

  it('a creature that answers only one polarity meets that one always, and the other never', () => {
    expect(meetsIntention('neutral', 3, 3, 'positive', 'positive')).toBe(true);
    expect(meetsIntention('neutral', 1, 3, 'positive', 'positive')).toBe(true);
    expect(meetsIntention('neutral', 1, 3, 'negative', 'positive')).toBe(false);
    expect(meetsIntention('neutral', 1, 3, 'negative', 'negative')).toBe(true);
    expect(meetsIntention('neutral', 3, 3, 'positive', 'negative')).toBe(false);
  });
});
