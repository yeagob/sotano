import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/content/bosses';
import {
  BEAT, BOLT_RADIUS, BOLT_SPEED, MAX_DPS, MAX_STRANDS, MIRROR_RULES, MOVE, STRAND_DAMAGE, VOLLEY_RATE, mirrorOf, type Mirror,
} from '../src/content/bosses/mirror';
import { STILLNESS_TAG } from '../src/content/bosses/shadow';
import { ITEMS } from '../src/content/items';
import type { Strike } from '../src/enemies/attacks';
import type { Enemy, EnemyCtx } from '../src/enemies/types';

// Issue #339: the Shadow mirrors the practices the player holds when its fight starts
// (docs/design/built/bosses/SHADOW.md, "The mirror").

const DT = 1 / 60;
const SHADOW = BOSSES.find(b => b.id === 'shadow')!;
const FALLBACK = mirrorOf([]);
const dps = (m: Mirror) => m.shot.damage * m.shot.strands.reduce((a, k) => a + k, 0) * m.shot.rate;

interface Bolt { t: number; damage: number; speed: number; radius: number }

/** The Shadow in a fake room, in one phase, with you standing still `dist` blocks away. */
function fight(held: string[], stage: number, dist = 6) {
  const hp = [100, 60, 30][stage];
  const e = {
    id: 7, hp, maxHp: 100, stage, hold: 0, state: 'move', timer: 0, seq: 0, armed: true, hidden: false,
    wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: SHADOW.speed, clock: 0, aimX: 0, aimZ: 0, volley: 0,
    body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: SHADOW.size[0], h: SHADOW.size[1], onGround: true },
    tags: new Set<string>(), room: 0, faction: 'projection', spec: SHADOW, def: SHADOW.id,
  } as unknown as Enemy;
  let t = 0, killed = false;
  const bolts: Bolt[] = [], strikes: { t: number; s: Strike }[] = [];
  const you = { id: 1, x: dist, y: 0, z: 0, vx: 0, vz: 0 };
  const ctx = {
    dt: DT, target: () => you, near: () => you, practices: () => held,
    dist: (_e: Enemy, p: { x: number; z: number }) => Math.hypot(p.x - e.body.x, p.z - e.body.z),
    toward: () => [1, 0], bounds: () => [-10, -10, 10, 10], centre: () => [0, 0],
    bolt: (_e: Enemy, _dx: number, _dy: number, _dz: number, speed: number, damage: number, radius?: number) => { bolts.push({ t, damage, speed, radius: radius ?? 0.12 }); },
    strike: (_e: Enemy, s: Strike) => { strikes.push({ t, s }); },
    shootAt: () => {}, rain: () => {}, rockfall: () => {}, summon: () => {}, quake: () => {}, cue: () => {}, crash: () => {}, fx: () => {},
    arena: () => {}, burst: () => {}, quiet: () => false, others: () => [], safe: () => true, hide: () => {},
    kill: () => { killed = true; },
  } as unknown as EnemyCtx;
  return {
    e, bolts, strikes, you,
    get killed() { return killed; },
    run(seconds: number) { for (let k = 0; k < Math.round(seconds / DT); k++) { SHADOW.behaviour.update(e, ctx); t += DT; if (killed) break; } },
  };
}

describe('the Shadow mirrors your practices: every practice is classified', () => {
  it('every practice in src/content/items has a rule, in the catalogue or not, and every rule is a practice', () => {
    const files = import.meta.glob<{ default?: { id?: string; effect?: string } }>('../src/content/items/*.ts', { eager: true });
    const ids = [...new Set([
      ...ITEMS.map(i => i.id),
      ...Object.values(files).map(f => f.default).filter(d => d?.id && d.effect).map(d => d!.id!),
    ])];
    const missing = ids.filter(id => !MIRROR_RULES[id]);
    expect(missing, 'practices with no mirror rule: add them to MIRROR_RULES and the table in SHADOW.md').toEqual([]);
    expect(Object.keys(MIRROR_RULES).filter(id => !ids.includes(id))).toEqual([]);
  });

  it('a copied or adapted practice alone changes the mirror; a skipped one alone leaves the fallback', () => {
    for (const { id } of ITEMS) {
      const rule = MIRROR_RULES[id], m = mirrorOf([id]);
      if (rule.how === 'skipped') expect({ ...m, practices: [] }, id).toEqual(FALLBACK);
      else expect({ ...m, practices: [] }, id).not.toEqual(FALLBACK);
    }
  });
});

describe('the Shadow mirrors your practices: the spec', () => {
  it('a player with no practices meets the fallback: half a heart a strand, about one volley a second', () => {
    expect(FALLBACK).toEqual({
      practices: [], weapon: 'intent', harmless: false, move: 1, dash: false, charge: 1,
      shot: { damage: 4, rate: 2.7 * 0.35, strands: [1], speed: 9, radius: 0.12 },
    });
    expect(dps(FALLBACK)).toBeLessThan(4);
  });

  it('a fixed strong build gives the documented spec, inside every cap', () => {
    const m = mirrorOf(['meditations', 'selfreliance', 'triangulation', 'stoic', 'flow', 'breakingbread', 'kairos']);
    expect(m.practices).toEqual(['meditations', 'selfreliance', 'triangulation', 'stoic', 'flow']);
    expect(m.weapon).toBe('intent');
    expect(m.shot.strands).toEqual([1, 0.6, 0.6]);
    expect(m.shot.rate).toBe(VOLLEY_RATE[1]);
    expect(m.shot.damage).toBeCloseTo(MAX_DPS / (2.2 * 1.6), 9);
    expect(m.shot.speed).toBe(9);
    expect(m.shot.radius).toBeCloseTo(0.12 * 1.4, 9);
    expect(m.move).toBeCloseTo(1.3, 9);
    expect(dps(m)).toBeCloseTo(MAX_DPS, 9);
  });

  it('weapons: the blade, the beam, and both as the great cut', () => {
    expect(mirrorOf(['occamsrazor']).weapon).toBe('blade');
    expect(mirrorOf(['kiai']).weapon).toBe('beam');
    expect(mirrorOf(['kiai', 'occamsrazor']).weapon).toBe('greatcut');
    expect(mirrorOf(['kiai', 'selfreliance']).charge).toBe(0.8);
  });

  it('movement: speed within its bounds, running raises it, a dash becomes its dodge', () => {
    expect(mirrorOf(['fartlek']).move).toBeCloseTo(1.45, 9);
    expect(mirrorOf(['fartlek', 'flow', 'satori']).move).toBe(MOVE[1]);
    expect(mirrorOf(['irimi']).dash).toBe(true);
  });

  it('every mirrored practice at once still stays inside every cap', () => {
    const all = Object.entries(MIRROR_RULES).filter(([, r]) => r.how !== 'skipped').map(([id]) => id).filter(id => id !== 'boundaries');
    const m = mirrorOf(all);
    expect(m.shot.strands.length).toBeLessThanOrEqual(MAX_STRANDS);
    expect(m.shot.damage).toBeGreaterThanOrEqual(STRAND_DAMAGE[0]);
    expect(m.shot.damage).toBeLessThanOrEqual(STRAND_DAMAGE[1]);
    expect(m.shot.rate).toBeLessThanOrEqual(VOLLEY_RATE[1]);
    expect(dps(m)).toBeLessThanOrEqual(MAX_DPS + 1e-9);
    expect(m.shot.speed).toBeLessThanOrEqual(BOLT_SPEED[1]);
    expect(m.shot.radius).toBeLessThanOrEqual(BOLT_RADIUS[1]);
    expect(m.move).toBeLessThanOrEqual(MOVE[1]);
  });
});

describe('the Shadow mirrors your practices: in the fight', () => {
  it('fires your volley a beat later, with the mirrored spec (fixed build, fixed boss)', () => {
    const held = ['triangulation', 'stoic', 'visualization'];
    const m = mirrorOf(held);
    const f = fight(held, 0);
    f.run(4);
    expect(f.bolts.length).toBeGreaterThan(0);
    // its first volley: after its first breath (1.5 s) and the beat
    expect(f.bolts[0].t).toBeGreaterThanOrEqual(1.5 + BEAT - DT);
    const first = f.bolts.filter(b => b.t === f.bolts[0].t);
    expect(first.map(b => b.damage)).toEqual(m.shot.strands.map(k => m.shot.damage * k));
    for (const b of first) { expect(b.speed).toBe(m.shot.speed); expect(b.radius).toBe(m.shot.radius); }
    // the same build and the same boss give the same fight
    const again = fight(held, 0);
    again.run(4);
    expect(again.bolts).toEqual(f.bolts);
  });

  it('takes its snapshot when the fight starts: a practice gained later changes nothing', () => {
    const held = ['stoic'];
    const f = fight(held, 0);
    f.run(0.1);
    held.push('triangulation', 'meditations');
    f.run(3);
    const first = f.bolts.filter(b => b.t === f.bolts[0].t);
    expect(first).toHaveLength(1);
    expect(first[0].damage).toBe(mirrorOf(['stoic']).shot.damage);
  });

  it('with no practices the fight is fair: one strand at a time, under four points a second', () => {
    const f = fight([], 0);
    f.run(20);
    const dealt = f.bolts.reduce((a, b) => a + b.damage, 0);
    expect(f.bolts.every(b => b.damage === 4)).toBe(true);
    expect(dealt / 20).toBeLessThan(4);
  });

  it('the beam and the great cut replace its shot and are always telegraphed', () => {
    for (const held of [['kiai'], ['kiai', 'occamsrazor']]) {
      const f = fight(held, 0);
      f.run(10);
      expect(f.bolts).toEqual([]);
      expect(f.strikes.length).toBeGreaterThan(0);
      for (const { s } of f.strikes) { expect(s.lead).toBeGreaterThanOrEqual(0.8); expect(s.damage).toBeLessThanOrEqual(8); }
    }
  });

  it('the blade strokes when you are close and keeps the shot', () => {
    const f = fight(['occamsrazor'], 0, 2);
    f.run(6);
    expect(f.strikes.length).toBeGreaterThan(0);
    expect(f.bolts.length).toBeGreaterThan(0);
  });

  it('the stillness ending still works with a strong build: no attack, and three seconds beside it ends the fight', () => {
    const f = fight(['meditations', 'selfreliance', 'triangulation', 'kiai', 'occamsrazor', 'irimi'], 2, 2);
    f.run(3.5);
    expect(f.bolts).toEqual([]);
    expect(f.strikes).toEqual([]);
    expect(f.killed).toBe(true);
    expect(f.e.tags.has(STILLNESS_TAG)).toBe(true);
  });
});
