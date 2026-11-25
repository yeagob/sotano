// Colour tiers of projections (issue #338, docs/design/built/projections/TIERS.md).
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RunRandom } from '../src/core/rng';
import { ENEMIES, ENEMY_BY_ID } from '../src/content/enemies';
import { PALETTE, pal } from '../src/content/palette';
import {
  BASE_DIFFICULTY, climbOf, falterTargets, FALTER_SECONDS, GLOBAL_DIFFICULTY, rollTier, spawnTier, TIER_MULTIPLIERS, tierChances,
  tierMarks, tierMultipliers, tierStats, TIERS, type Tier,
} from '../src/enemies/tiers';
import { FlowField, type RoomArea } from '../src/enemies/flowfield';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { leap } from '../src/enemies/behaviours';
import type { Actor } from '../src/entities/actors';
import type { Enemy, EnemyCtx } from '../src/enemies/types';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const host = (over: Partial<EnemyHost> = {}): EnemyHost => ({
  solid: () => false, worldVersion: () => 1, actors: () => [] as Actor[], actor: () => undefined,
  room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 }), elemVersion: () => 0,
  pickupsIn: () => [],
  hazard: () => null, contact: () => {}, projectileHit: () => {}, projectileBlock: () => false,
  smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
  affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  ...over,
} as EnemyHost);

const doubt = ENEMY_BY_ID.get('doubt')!;
const projections = ENEMIES.filter(d => d.kind !== 'boss' && d.kind !== 'creature');

describe('the tier roll', () => {
  it('a fixed seed gives the same tier to every spawned projection, and another seed a different set', () => {
    const roll = (seed: number) => {
      const rng = new RunRandom(seed);
      const out: Tier[] = [];
      for (let floor = 1; floor <= 9; floor++) for (let room = 0; room < 12; room++) for (let seq = 0; seq < 9; seq++) {
        out.push(spawnTier(rng, floor, room, seq, projections[(floor + room + seq) % projections.length]));
      }
      return out;
    };
    const a = roll(0xC0FFEE);
    expect(roll(0xC0FFEE)).toEqual(a);
    expect(roll(0xBEEF)).not.toEqual(a);
    expect(new Set(a)).toEqual(new Set(TIERS));
  });

  it('the roll reads its own fork only: rolling tiers leaves the rooted roll and the runtime streams where they were', () => {
    const a = new RunRandom(41), b = new RunRandom(41);
    for (let seq = 0; seq < 50; seq++) spawnTier(a, 5, 3, seq, doubt);
    expect(a.fork('floor', 5, 'room', 3, 'rooted', 7).next()).toBe(b.fork('floor', 5, 'room', 3, 'rooted', 7).next());
    expect(a.stream('drops').next()).toBe(b.stream('drops').next());
  });

  it('bosses and creatures are always Black', () => {
    const rng = new RunRandom(7);
    for (let seq = 0; seq < 200; seq++) {
      expect(spawnTier(rng, 9, 1, seq, { kind: 'boss' }, 10)).toBe('black');
      expect(spawnTier(rng, 9, 1, seq, { kind: 'creature' }, 10)).toBe('black');
    }
  });

  it('a roll below the Red chance is Red, then the Yellow band, then Black', () => {
    const c = { yellow: 0.2, red: 0.1 };
    expect(rollTier(0, c)).toBe('red');
    expect(rollTier(0.0999, c)).toBe('red');
    expect(rollTier(0.1, c)).toBe('yellow');
    expect(rollTier(0.2999, c)).toBe('yellow');
    expect(rollTier(0.31, c)).toBe('black');
  });

  it('over many spawns, the share of each tier is its chance', () => {
    const rng = new RunRandom(99);
    const n = 20000, count = { black: 0, yellow: 0, red: 0 };
    for (let seq = 0; seq < n; seq++) count[spawnTier(rng, 9, 4, seq, doubt)]++;
    const c = tierChances(9);
    expect(count.yellow / n).toBeCloseTo(c.yellow, 1);
    expect(count.red / n).toBeCloseTo(c.red, 1);
  });
});

describe('the tier chances (documented formula)', () => {
  it('the global difficulty is a constant at its base value', () => {
    expect(GLOBAL_DIFFICULTY).toBe(BASE_DIFFICULTY);
    expect(BASE_DIFFICULTY).toBe(1);
  });

  it('floor 1 at base difficulty: 5 % Yellow, no Red', () => {
    const c = tierChances(1, BASE_DIFFICULTY);
    expect(c.yellow).toBeCloseTo(0.05, 12);
    expect(c.red).toBe(0);
  });

  it('yellow = d × (5 % + 2.5 % × (floor − 1)) and red = d × 1.5 % × (floor − 1), floor 1 to 9', () => {
    for (const d of [0.5, 1, 1.5]) for (let f = 1; f <= 9; f++) {
      const c = tierChances(f, d);
      expect(c.yellow).toBeCloseTo(Math.min(0.5, d * (0.05 + 0.025 * (f - 1))), 12);
      expect(c.red).toBeCloseTo(Math.min(0.3, d * 0.015 * (f - 1)), 12);
    }
    expect(tierChances(9).yellow).toBeCloseTo(0.25, 12);
    expect(tierChances(9).red).toBeCloseTo(0.12, 12);
  });

  it('both chances rise with the floor and with the difficulty', () => {
    for (let f = 2; f <= 9; f++) {
      expect(tierChances(f).yellow).toBeGreaterThan(tierChances(f - 1).yellow);
      expect(tierChances(f).red).toBeGreaterThan(tierChances(f - 1).red);
    }
    for (let f = 2; f <= 9; f++) {
      expect(tierChances(f, 1.5).yellow).toBeGreaterThan(tierChances(f, 1).yellow);
      expect(tierChances(f, 1.5).red).toBeGreaterThan(tierChances(f, 1).red);
    }
  });

  it('the Roots and difficulty 0 never roll a tier; past floor 9 and at any difficulty the caps hold', () => {
    expect(tierChances(0)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(-3)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(5, 0)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(12)).toEqual(tierChances(9));
    const hard = tierChances(9, 100);
    expect(hard.yellow).toBe(0.5);
    expect(hard.red).toBe(0.3);
  });
});

describe('the tier multipliers (documented numbers)', () => {
  it('Black is the projection as its file gives it', () => {
    expect(TIER_MULTIPLIERS.black).toEqual({ hp: 1, damage: 1, speed: 1, jump: 1 });
  });

  it('Yellow and Red have exactly the documented multipliers over Black for hp, damage, speed and jump', () => {
    expect(TIER_MULTIPLIERS.yellow).toEqual({ hp: 1.5, damage: 1.25, speed: 1.15, jump: 2 });
    expect(TIER_MULTIPLIERS.red).toEqual({ hp: 2.25, damage: 1.5, speed: 1.3, jump: 3 });
    for (const def of projections) for (const tier of ['yellow', 'red'] as const) {
      const m = tierMultipliers(def, tier), s = tierStats(def, tier);
      expect(m).toEqual(TIER_MULTIPLIERS[tier]);
      expect(s.hp, def.id).toBe(Math.round(def.hp * m.hp));
      expect(s.speed).toBeCloseTo(def.speed * m.speed, 12);
      expect(s.contactDamage).toBeCloseTo(def.contactDamage * m.damage, 12);
      expect(s.jump).toBe(m.jump);
    }
  });

  it('Red is the maximum: every Red number is at least the Yellow one, and Yellow at least Black', () => {
    for (const k of ['hp', 'damage', 'speed', 'jump'] as const) {
      expect(TIER_MULTIPLIERS.yellow[k]).toBeGreaterThan(TIER_MULTIPLIERS.black[k]);
      expect(TIER_MULTIPLIERS.red[k]).toBeGreaterThan(TIER_MULTIPLIERS.yellow[k]);
    }
  });

  it('the shared function returns a copy, so a caller (a boss later) cannot change the table', () => {
    const m = tierMultipliers({ id: 'x', kind: 'boss' }, 'red');
    m.hp = 99;
    expect(TIER_MULTIPLIERS.red.hp).toBe(2.25);
  });

  it('the rooted health stacks under the tier', () => {
    expect(tierStats(doubt, 'yellow', 28).hp).toBe(42);
  });
});

describe('a tiered projection in play', () => {
  it('spawns with its jump and damage multipliers, and its strikes and shots carry the damage', () => {
    const struck: number[] = [];
    const en = new Enemies(new THREE.Scene(), host());
    const s = tierStats(doubt, 'red');
    const e = en.spawn(doubt, 3, 0, 3, 0, 3, s.hp, s.speed, s.contactDamage, new Set(), 'red');
    expect(e.tier).toBe('red');
    expect(e.jump).toBe(3);
    expect(e.power).toBe(1.5);
    expect(e.maxHp).toBe(Math.round(doubt.hp * 2.25));
    const black = en.spawn(doubt, 4, 0, 6, 0, 3, doubt.hp, doubt.speed, doubt.contactDamage, new Set());
    expect(black.tier).toBe('black');
    expect(black.jump).toBe(1);
    expect(black.power).toBe(1);
    // the hazards' live damage is what the strike asked times the power
    const field = en.hazardField as unknown as { add(owner: number, side: string, cause: string, s: { damage: number }): void };
    const add = field.add.bind(field);
    field.add = (o, side, cause, st) => { struck.push(st.damage); add(o, side, cause, st); };
    e.spawning = 0; black.spawning = 0;
    const strike = { lead: 1, live: 0.2, damage: 8, shape: { kind: 'ring' as const, x: 3, y: 0, z: 3, r: 1, grow: 0, width: 0.4, height: 1 } };
    const doStrike: Enemy['spec']['behaviour'] = { name: 'test', update: (x, ctx) => { ctx.strike(x, strike); x.hold = 1e6; } };
    e.spec = { ...doubt, behaviour: doStrike };
    black.spec = { ...doubt, behaviour: doStrike };
    en.update(1 / 60);
    expect(struck.sort((a, b) => a - b)).toEqual([8, 12]);
  });

  it('wears its mark: two warning-yellow thorns for Yellow, a crown of three attack-red ones for Red, none for Black', () => {
    for (const def of projections) {
      expect(tierMarks(def, 'black')).toEqual([]);
      const y = tierMarks(def, 'yellow'), r = tierMarks(def, 'red');
      expect(y).toHaveLength(2);
      expect(r).toHaveLength(3);
      for (const p of y) expect(p.color).toBe(pal('attack.warn.base'));
      for (const p of r) expect(p.color).toBe(pal('attack.red.base'));
      // Yellow has a gap in the middle, Red a peak: the middle thorn is the largest and the highest
      expect(y[0].pos[0]).toBeLessThan(y[1].pos[0]);
      expect(r[1].size[1]).toBeGreaterThan(r[0].size[1]);
      expect(r[1].pos[1] + r[1].size[1] / 2).toBeGreaterThan(r[0].pos[1] + r[0].size[1] / 2);
      // whole texels (DECISIONS §8.2), and over the head or the highest part
      for (const p of [...y, ...r]) for (const v of p.size) expect(Math.abs(v * 16 - Math.round(v * 16))).toBeLessThan(1e-9);
      const head = def.model.find(p => p.name === 'head' && !p.parent);
      if (head) for (const p of [...y, ...r]) { expect(p.parent).toBe('head'); expect(p.pos[1] + p.size[1] / 2).toBeGreaterThan(head.size[1] / 2); }
      else {
        let top = -Infinity;
        for (const p of def.model) if (!p.parent && Math.abs(p.pos[0]) <= p.size[0] / 2) top = Math.max(top, p.pos[1] + p.size[1] / 2);
        for (const p of [...y, ...r]) expect(p.pos[1] + p.size[1] / 2, def.id).toBeGreaterThan(top);
      }
    }
    const en = new Enemies(new THREE.Scene(), host());
    en.spawn(doubt, 5, 0, 3, 0, 3, doubt.hp, doubt.speed, doubt.contactDamage, new Set(), 'red');
    expect(en.viewOf(5)!.parts.get('tier')).toHaveLength(3);
    en.spawn(doubt, 6, 0, 3, 0, 3, doubt.hp, doubt.speed, doubt.contactDamage, new Set());
    expect(en.viewOf(6)!.parts.get('tier')).toBeUndefined();
  });

  it('the two marks part in greyscale too: the yellow thorn is far lighter than the red one', () => {
    const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
    const y = lum(PALETTE['attack.warn.base']), r = lum(PALETTE['attack.red.base']);
    expect((y + 0.05) / (r + 0.05)).toBeGreaterThan(2.5);
  });

  it('a higher jump climbs a taller step on the flow field', () => {
    const room: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 9, d: 3, hx: 0, hz: 0 };
    // a wall two blocks high across the room at x = 4..8
    const solid = (x: number, y: number) => y < 0 || (x >= 4 && y < 2);
    for (const [jump, reaches] of [[1, false], [2, true], [3, true]] as const) {
      const f = new FlowField(room, 0, climbOf(jump));
      f.update(solid, 6, 1, 'v');
      expect(f.direction(1.5, 1.5) !== null, `jump ${jump}`).toBe(reaches);
    }
  });

  it('a walker of a higher tier hops up a step its jump allows, and a Black one does not', () => {
    const wallAt = (x: number, y: number) => y < 0 || (x >= 5 && y < 2);
    const climbs = (tier: Tier) => {
      const en = new Enemies(new THREE.Scene(), host({ solid: (x, y) => wallAt(x, y) }));
      const s = tierStats(doubt, tier);
      const e = en.spawn(doubt, 1, 0, 4.2, 0, 3.5, s.hp, s.speed, s.contactDamage, new Set(), tier);
      e.spawning = 0;
      e.spec = { ...doubt, behaviour: { name: 'push', update: x => { x.wishX = 1; x.wishZ = 0; } } };
      let top = 0;
      for (let i = 0; i < 240; i++) { en.update(1 / 60); top = Math.max(top, e.body.y); }
      return top;
    };
    expect(climbs('black')).toBeLessThan(2);
    expect(climbs('yellow')).toBeGreaterThanOrEqual(2);
  });

  it('a leap arcs jump times as high and still lands on its mark', () => {
    const flight = (jump: number) => {
      const e = { body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, onGround: true }, state: 'crouch', timer: 0, aimX: 1, aimZ: 0, pulse: 0, jump } as unknown as Enemy;
      const ctx = { dt: 1 / 60, target: () => ({ id: 1, x: 6, y: 0, z: 0 }), dist: () => 6, cue: () => {} } as unknown as EnemyCtx;
      leap({ every: 2, range: 8, crouch: 0.4, air: 0.6, reach: 1, damage: 4 }).update(e, ctx);
      const t = 2 * e.body.vy / 26;
      return { apex: e.body.vy ** 2 / 52, land: e.body.vx * t };
    };
    const base = flight(1), high = flight(3);
    expect(high.apex / base.apex).toBeCloseTo(3, 9);
    expect(base.land).toBeCloseTo(6, 9);
    expect(high.land).toBeCloseTo(6, 9);
  });
});

describe('deeper behaviour: a Red release makes its room falter', () => {
  it('the hostile projections left in the room hold still; allies, bosses and other rooms do not', () => {
    const cues: string[] = [];
    const en = new Enemies(new THREE.Scene(), host({ cue: k => { cues.push(k); } }));
    const red = en.spawn(doubt, 1, 0, 3, 0, 3, 10, 1, 4, new Set(), 'red');
    const mate = en.spawn(doubt, 2, 0, 5, 0, 3, 10, 1, 4, new Set());
    const ally = en.spawn(doubt, 3, 0, 6, 0, 3, 10, 1, 4, new Set());
    const away = en.spawn(doubt, 4, 9, 6, 0, 3, 10, 1, 4, new Set());
    const boss = en.spawn({ ...doubt, kind: 'boss' }, 5, 0, 7, 0, 3, 10, 1, 4, new Set());
    for (const e of en.list) e.spawning = 0;
    ally.faction = 'self';
    expect(falterTargets(en.list, red)).toEqual([mate]);
    expect(en.falter(red)).toBe(1);
    expect(mate.hold).toBe(FALTER_SECONDS);
    for (const o of [ally, away, boss]) expect(o.hold).toBe(0);
    expect(cues).toEqual(['falter']);
  });

  it('a Yellow or Black release changes nothing', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const y = en.spawn(doubt, 1, 0, 3, 0, 3, 10, 1, 4, new Set(), 'yellow');
    const mate = en.spawn(doubt, 2, 0, 5, 0, 3, 10, 1, 4, new Set());
    for (const e of en.list) e.spawning = 0;
    expect(en.falter(y)).toBe(0);
    expect(en.falter(mate)).toBe(0);
    expect(mate.hold).toBe(0);
  });
});

describe('tier names', () => {
  it('every tier is named in English and Spanish, and the death cause names it', () => {
    for (const tier of TIERS) {
      expect(EN.messages[`tier.${tier}`]).toBeTruthy();
      expect(ES.messages[`tier.${tier}`]).toBeTruthy();
    }
    expect(EN.messages['tier.named']).toContain('{name}');
    expect(ES.messages['tier.named']).toContain('{tier}');
  });
});
