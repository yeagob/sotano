// Intention polarity (docs/design/BESTIARY.md §1.1, docs/reviews/polarity.md): the damage, warmth,
// conversion and relapse rules, as pure functions. The game applies their results; these tests pin
// the numbers and the ordering the review ruled on.

import { describe, expect, it } from 'vitest';
import {
  allyHeal, convertedHp, intentCeiling, intentDamage, isWarm, meetsIntention, relapseHp, resolveHit, warmthAfter,
  type HitState,
} from '../src/combat/polarity';

const base = (over: Partial<HitState> = {}): HitState =>
  ({ polarity: 'positive', warm: true, faction: 'projection', hp: 12, maxHp: 12, warmth: 0, ...over });

describe('damage', () => {
  it('a positive intention deals half damage, a negative one full damage', () => {
    expect(intentDamage('positive', 3.5)).toBeCloseTo(1.75);
    expect(intentDamage('negative', 3.5)).toBe(3.5);
  });

  it('a positive intention never takes the last point (the ceiling is applied after the item hooks)', () => {
    expect(intentCeiling('positive', 12)).toBe(11);
    expect(intentCeiling('positive', 1.5)).toBe(0.5);
    expect(intentCeiling('positive', 0.4)).toBe(0);
    expect(intentCeiling('negative', 0.4)).toBe(Infinity);
  });

  it('a positive hit at one point deals nothing, but a negative one can kill', () => {
    const r = resolveHit(base({ hp: 1 }), 1.75);
    expect(r.dealt).toBe(0);
    expect(r.relapse).toBe(false);
    expect(resolveHit(base({ polarity: 'negative', hp: 1 }), 3.5).dealt).toBe(3.5);
  });
});

describe('warmth', () => {
  it('a positive hit adds warmth, capped at full; a negative hit cools it, never below zero', () => {
    expect(warmthAfter('positive', 0)).toBeCloseTo(0.2);
    expect(warmthAfter('positive', 0.95)).toBe(1);
    expect(warmthAfter('negative', 0.6)).toBeCloseTo(0.35);
    expect(warmthAfter('negative', 0.1)).toBe(0);
  });

  it('five positive hits fill the warmth, despite floating point sums', () => {
    let w = 0;
    for (let i = 0; i < 4; i++) w = warmthAfter('positive', w);
    expect(isWarm(w)).toBe(false);
    w = warmthAfter('positive', w);
    expect(isWarm(w)).toBe(true);
  });

  it('warms a target once per stroke: a repeat tick does not move warmth', () => {
    const r = resolveHit(base({ warm: false, warmth: 0.4 }), 1.75);
    expect(r.warmth).toBe(0.4);
  });
});

describe('conversion', () => {
  it('Doubt (12 hp) converts under five positive shots, and keeps at least half its health', () => {
    let hp = 12, warmth = 0, converted = false;
    for (let i = 0; i < 5; i++) {
      const r = resolveHit(base({ hp, warmth }), intentDamage('positive', 3.5));
      hp -= r.dealt; warmth = r.warmth; converted ||= r.convert;
    }
    expect(converted).toBe(true);
    expect(hp).toBeCloseTo(3.25);
    expect(convertedHp(hp, 12)).toBe(6);
  });

  it('a projection that is already at half health keeps its health on conversion', () => {
    expect(convertedHp(8, 12)).toBe(8);
    expect(convertedHp(1, 9)).toBe(4.5);
  });

  it('only a positive intention converts; a negative one never does, even at full warmth', () => {
    expect(resolveHit(base({ polarity: 'negative', warmth: 1 }), 3.5).convert).toBe(false);
  });

  it('an ally never converts again', () => {
    expect(resolveHit(base({ faction: 'self', hp: 6, warmth: 1 }), 1.75).convert).toBe(false);
  });
});

describe('allies', () => {
  it('a positive intention heals an ally by half the damage, never past its maximum', () => {
    expect(allyHeal(3.5, 10, 12)).toBeCloseTo(1.75);
    expect(allyHeal(3.5, 11.5, 12)).toBeCloseTo(0.5);
    expect(allyHeal(3.5, 12, 12)).toBe(0);
  });

  it('a negative intention harms an ally at full damage, and it loses health', () => {
    const r = resolveHit(base({ polarity: 'negative', faction: 'self', hp: 12, warmth: 0 }), 3.5);
    expect(r.dealt).toBe(3.5);
    expect(r.relapse).toBe(false);
  });

  it('an ally at zero under a negative intention relapses (half health, not dissolved)', () => {
    const r = resolveHit(base({ polarity: 'negative', faction: 'self', hp: 3 }), 3.5);
    expect(r.relapse).toBe(true);
    expect(r.warmth).toBe(0);
    expect(relapseHp(12)).toBe(6);
    expect(relapseHp(9)).toBe(4.5);
    expect(relapseHp(1)).toBe(1);
  });

  it('an ally above zero is only hurt', () => {
    const r = resolveHit(base({ polarity: 'negative', faction: 'self', hp: 6 }), 3.5);
    expect(r.relapse).toBe(false);
    expect(r.dealt).toBe(3.5);
  });
});

describe('what an intention meets', () => {
  it('hostile projections are always met', () => {
    expect(meetsIntention('projection', 1, 12, 'positive')).toBe(true);
    expect(meetsIntention('projection', 1, 12, 'negative')).toBe(true);
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
