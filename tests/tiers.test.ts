// Colour tiers of projections and bosses (issue #338, docs/design/built/projections/TIERS.md).
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RunRandom } from '../src/core/rng';
import { ENEMIES, ENEMY_BY_ID } from '../src/content/enemies';
import { PALETTE, pal } from '../src/content/palette';
import { ReleaseLog } from '../src/content/presences/mended';
import { BOSS_BY_ID } from '../src/content/bosses';
import {
  allyColor, BASE_DIFFICULTY, BOSS_TIER_MULTIPLIERS, climbOf, DEEPEST_FLOOR, FALTER_ENABLED, falterTargets, FALTER_SECONDS,
  leapAir, paintBody, rollTier, spawnTier, TIER_BODY, TIER_MULTIPLIERS, tierChances, tierMarks, tierModel, tierMultipliers,
  tierStats, TIERS, type Tier,
} from '../src/enemies/tiers';
import { FlowField, type RoomArea } from '../src/enemies/flowfield';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { leap } from '../src/enemies/behaviours';
import type { Actor } from '../src/entities/actors';
import { birthHp, type Enemy, type EnemyCtx } from '../src/enemies/types';
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
const shadow = BOSS_BY_ID.get('shadow')!;
const projections = ENEMIES.filter(d => d.kind !== 'boss' && d.kind !== 'creature');
const bosses = [...BOSS_BY_ID.values()].filter(d => d.id !== 'shadow');

describe('the tier roll', () => {
  it('a fixed seed gives the same tier to every spawned projection and boss, and another seed a different set', () => {
    const pool = [...projections, ...bosses];
    const roll = (seed: number) => {
      const rng = new RunRandom(seed);
      const out: Tier[] = [];
      for (let floor = 1; floor <= DEEPEST_FLOOR; floor++) for (let room = 0; room < 12; room++) for (let seq = 0; seq < 9; seq++) {
        out.push(spawnTier(rng, floor, room, seq, pool[(floor + room + seq) % pool.length]));
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

  it('bosses roll a tier; creatures and the Shadow never do', () => {
    const rng = new RunRandom(7);
    const seen = new Set<Tier>();
    for (let seq = 0; seq < 400; seq++) {
      seen.add(spawnTier(rng, 13, 1, seq, bosses[0]));
      expect(spawnTier(rng, 13, 1, seq, { id: 'moth', kind: 'creature' }, 10)).toBe('black');
      expect(spawnTier(rng, 13, 1, seq, shadow, 10)).toBe('black');
    }
    expect(seen).toEqual(new Set(TIERS));
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
    for (let seq = 0; seq < n; seq++) count[spawnTier(rng, 13, 4, seq, doubt)]++;
    const c = tierChances(13);
    expect(count.yellow / n).toBeCloseTo(c.yellow, 1);
    expect(count.red / n).toBeCloseTo(c.red, 1);
  });
});

describe('the tier chances (documented formula)', () => {
  it('the difficulty is an input, 1 for now', () => {
    expect(BASE_DIFFICULTY).toBe(1);
    expect(tierChances(7)).toEqual(tierChances(7, 1));
  });

  it('at difficulty 1: floor 1 5 % / 0 %, floor 3 10 % / 0 %, floor 4 12.5 % / 1.5 %, floor 13 35 % / 15 %', () => {
    const at = (f: number) => tierChances(f, 1);
    expect(at(1).yellow).toBeCloseTo(0.05, 12); expect(at(1).red).toBe(0);
    expect(at(3).yellow).toBeCloseTo(0.10, 12); expect(at(3).red).toBe(0);
    expect(at(4).yellow).toBeCloseTo(0.125, 12); expect(at(4).red).toBeCloseTo(0.015, 12);
    expect(at(13).yellow).toBeCloseTo(0.35, 12); expect(at(13).red).toBeCloseTo(0.15, 12);
  });

  it('at difficulty 2 both chances double: floor 1 10 % / 0 %, floor 3 20 % / 0 %, floor 4 25 % / 3 %, floor 13 70 % / 30 %', () => {
    const at = (f: number) => tierChances(f, 2);
    expect(at(1).yellow).toBeCloseTo(0.10, 12); expect(at(1).red).toBe(0);
    expect(at(3).yellow).toBeCloseTo(0.20, 12); expect(at(3).red).toBe(0);
    expect(at(4).yellow).toBeCloseTo(0.25, 12); expect(at(4).red).toBeCloseTo(0.03, 12);
    expect(at(13).yellow).toBeCloseTo(0.70, 12); expect(at(13).red).toBeCloseTo(0.30, 12);
  });

  it('yellow = d × (5 % + 2.5 % × (floor − 1)) and red = d × 1.5 % × max(0, floor − 3), floors 1 to 13', () => {
    for (const d of [0.5, 1, 1.5]) for (let f = 1; f <= 13; f++) {
      const c = tierChances(f, d);
      expect(c.yellow).toBeCloseTo(d * (0.05 + 0.025 * (f - 1)), 12);
      expect(c.red).toBeCloseTo(d * 0.015 * Math.max(0, f - 3), 12);
    }
  });

  it('both rise with the floor (Red from floor 4) and with the difficulty', () => {
    for (let f = 2; f <= 13; f++) expect(tierChances(f).yellow).toBeGreaterThan(tierChances(f - 1).yellow);
    for (let f = 5; f <= 13; f++) expect(tierChances(f).red).toBeGreaterThan(tierChances(f - 1).red);
    for (let f = 1; f <= 13; f++) expect(tierChances(f, 1.5).yellow).toBeGreaterThan(tierChances(f, 1).yellow);
  });

  it('the Roots and difficulty 0 never roll a tier; past floor 13 the numbers hold, and the two never pass 100 %', () => {
    expect(tierChances(0)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(-3)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(5, 0)).toEqual({ yellow: 0, red: 0 });
    expect(tierChances(20)).toEqual(tierChances(13));
    const hard = tierChances(13, 100);
    expect(hard.red).toBe(1);
    expect(hard.yellow + hard.red).toBeLessThanOrEqual(1);
  });
});

describe('the tier multipliers (documented numbers)', () => {
  it('Black is the projection as its file gives it', () => {
    expect(TIER_MULTIPLIERS.black).toEqual({ hp: 1, damage: 1, speed: 1, climb: 0 });
    for (const def of projections) {
      const s = tierStats(def, 'black');
      expect(s).toMatchObject({ hp: def.hp, speed: def.speed, contactDamage: def.contactDamage, climb: 0 });
    }
  });

  it('Yellow: hp ×1.5, damage ×1.25, speed ×1.2, +1 block; Red: hp ×2.5, damage ×1.5, speed ×1.4, +2 blocks', () => {
    expect(TIER_MULTIPLIERS.yellow).toEqual({ hp: 1.5, damage: 1.25, speed: 1.2, climb: 1 });
    expect(TIER_MULTIPLIERS.red).toEqual({ hp: 2.5, damage: 1.5, speed: 1.4, climb: 2 });
    for (const def of projections) for (const tier of ['yellow', 'red'] as const) {
      const m = tierMultipliers(def, tier), s = tierStats(def, tier);
      expect(m).toEqual(TIER_MULTIPLIERS[tier]);
      expect(s.hp, def.id).toBe(Math.round(birthHp(def) * m.hp));
      expect(s.speed).toBeCloseTo(def.speed * m.speed, 12);
      expect(s.contactDamage).toBeCloseTo(def.contactDamage * m.damage, 12);
      expect(climbOf(s.climb)).toBe(1 + m.climb);
    }
  });

  it('bosses take the tier on their health only: Yellow ×1.25, Red ×1.5', () => {
    expect(BOSS_TIER_MULTIPLIERS.yellow).toEqual({ hp: 1.25, damage: 1, speed: 1, climb: 0 });
    expect(BOSS_TIER_MULTIPLIERS.red).toEqual({ hp: 1.5, damage: 1, speed: 1, climb: 0 });
    for (const def of bosses) for (const tier of TIERS) {
      const s = tierStats(def, tier, 400);
      expect(s.hp, def.id).toBe(Math.round(400 * BOSS_TIER_MULTIPLIERS[tier].hp));
      expect(s.speed).toBe(def.speed);
      expect(s.contactDamage).toBe(def.contactDamage);
      expect(s.climb).toBe(0);
      expect(s.damage).toBe(1);
    }
  });

  it('the Shadow takes no tier, whatever is asked', () => {
    for (const tier of TIERS) expect(tierMultipliers(shadow, tier)).toEqual(TIER_MULTIPLIERS.black);
  });

  it('Red is the maximum: every Red number is above the Yellow one, and Yellow above Black', () => {
    for (const k of ['hp', 'damage', 'speed', 'climb'] as const) {
      expect(TIER_MULTIPLIERS.yellow[k]).toBeGreaterThan(TIER_MULTIPLIERS.black[k]);
      expect(TIER_MULTIPLIERS.red[k]).toBeGreaterThan(TIER_MULTIPLIERS.yellow[k]);
    }
  });

  it('there are bosses to tier, and the Shadow is one of the bosses', () => {
    expect(bosses.length).toBeGreaterThan(5);
    expect(shadow.kind).toBe('boss');
  });

  it('the shared function returns a copy, so a caller cannot change the table', () => {
    const m = tierMultipliers({ id: 'x', kind: 'boss' }, 'red');
    m.hp = 99;
    expect(BOSS_TIER_MULTIPLIERS.red.hp).toBe(1.5);
    const p = tierMultipliers(doubt, 'red');
    p.hp = 99;
    expect(TIER_MULTIPLIERS.red.hp).toBe(2.5);
  });

  it('the rooted health stacks under the tier', () => {
    expect(tierStats(doubt, 'yellow', 28).hp).toBe(42);
  });
});

describe('a tiered projection in play', () => {
  it('spawns with its climb and damage, and its strikes and shots carry the damage', () => {
    const struck: number[] = [];
    const en = new Enemies(new THREE.Scene(), host());
    const s = tierStats(doubt, 'red');
    const e = en.spawn(doubt, 3, 0, 3, 0, 3, s.hp, s.speed, s.contactDamage, new Set(), 'red');
    expect(e.tier).toBe('red');
    expect(e.climb).toBe(2);
    expect(e.power).toBe(1.5);
    expect(e.maxHp).toBe(Math.round(birthHp(doubt) * 2.5));
    const black = en.spawn(doubt, 4, 0, 6, 0, 3, birthHp(doubt), doubt.speed, doubt.contactDamage, new Set());
    expect(black.tier).toBe('black');
    expect(black.climb).toBe(0);
    expect(black.power).toBe(1);
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

  it('a higher tier climbs a taller step on the flow field: one block more for Yellow, two for Red', () => {
    const room: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 9, d: 3, hx: 0, hz: 0 };
    const reaches = (wall: number, tier: Tier) => {
      const solid = (x: number, y: number) => y < 0 || (x >= 4 && y < wall);
      const f = new FlowField(room, 0, climbOf(TIER_MULTIPLIERS[tier].climb));
      f.update(solid, 6, 1, 'v');
      return f.direction(1.5, 1.5) !== null;
    };
    expect(reaches(2, 'black')).toBe(false);
    expect(reaches(2, 'yellow')).toBe(true);
    expect(reaches(3, 'yellow')).toBe(false);
    expect(reaches(3, 'red')).toBe(true);
    expect(reaches(4, 'red')).toBe(false);
  });

  it('a walker of a higher tier hops up a step its climb allows, and a Black one does not', () => {
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

  it('a leap rises exactly its extra blocks higher and still lands on its mark', () => {
    const flight = (climb: number) => {
      const e = { body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, onGround: true }, state: 'crouch', timer: 0, aimX: 1, aimZ: 0, pulse: 0, climb } as unknown as Enemy;
      const ctx = { dt: 1 / 60, target: () => ({ id: 1, x: 6, y: 0, z: 0 }), dist: () => 6, cue: () => {} } as unknown as EnemyCtx;
      leap({ every: 2, range: 8, crouch: 0.4, air: 0.6, reach: 1, damage: 4 }).update(e, ctx);
      const t = 2 * e.body.vy / 26;
      return { apex: e.body.vy ** 2 / 52, land: e.body.vx * t };
    };
    const base = flight(0), yellow = flight(1), red = flight(2);
    expect(yellow.apex - base.apex).toBeCloseTo(1, 9);
    expect(red.apex - base.apex).toBeCloseTo(2, 9);
    for (const f of [base, yellow, red]) expect(f.land).toBeCloseTo(6, 9);
    expect(leapAir(0.6, 0)).toBe(0.6);
  });
});

describe('the tier look (DECISIONS §14.6)', () => {
  const bodyParts = <P extends { glow?: boolean; inlay?: boolean; name?: string }>(m: readonly P[]) => m.filter(p => !p.glow && !p.inlay && p.name !== 'tier');
  const tokens = (r: { dark: string; base: string; hi: string }) => new Set([r.dark, r.base, r.hi].map(t => pal(t as keyof typeof PALETTE)));

  it('a Yellow body is the loud yellow and a Red body is red; Black keeps the file colours', () => {
    for (const def of [...projections, ...bosses]) {
      expect(tierModel(def, 'black')).toEqual(def.model);
      for (const tier of ['yellow', 'red'] as const) {
        const m = tierModel(def, tier), ramp = tokens(TIER_BODY[tier]);
        for (const p of bodyParts(m)) expect(ramp.has(p.color), `${def.id} ${tier}`).toBe(true);
        // eyes, tells and sockets keep their colour
        const lights = def.model.filter(p => p.glow || p.inlay);
        expect(m.filter(p => (p.glow || p.inlay) && p.name !== 'tier')).toEqual(lights);
      }
    }
    expect(PALETTE['tier.yellow.base']).toBe('#F5F000');
  });

  it('the body ramp keeps the order of light: a darker part never takes a lighter tone', () => {
    const lum = (c: number) => 0.2126 * (c >> 16 & 255) + 0.7152 * (c >> 8 & 255) + 0.0722 * (c & 255);
    for (const def of projections) {
      const painted = paintBody(def.model, TIER_BODY.yellow);
      def.model.forEach((p, i) => def.model.forEach((q, j) => {
        if (bodyParts([p]).length && bodyParts([q]).length && lum(p.color) < lum(q.color)) {
          expect(lum(painted[i].color), def.id).toBeLessThanOrEqual(lum(painted[j].color));
        }
      }));
    }
  });

  it('the colour-blind cue: two thorns for Yellow, a crown of three for Red, none for Black, in the tier\'s dark tone', () => {
    for (const def of projections) {
      expect(tierMarks(def, 'black')).toEqual([]);
      const y = tierMarks(def, 'yellow'), r = tierMarks(def, 'red');
      expect(y).toHaveLength(2);
      expect(r).toHaveLength(3);
      for (const p of y) { expect(p.color).toBe(pal('tier.yellow.dark')); expect(p.glow).toBeFalsy(); }
      for (const p of r) { expect(p.color).toBe(pal('tier.red.dark')); expect(p.glow).toBeFalsy(); }
      expect(y[0].pos[0]).toBeLessThan(y[1].pos[0]);
      expect(r[1].size[1]).toBeGreaterThan(r[0].size[1]);
      expect(r[1].pos[1] + r[1].size[1] / 2).toBeGreaterThan(r[0].pos[1] + r[0].size[1] / 2);
      for (const p of [...y, ...r]) for (const v of p.size) expect(Math.abs(v * 16 - Math.round(v * 16))).toBeLessThan(1e-9);
    }
  });

  it('the two hostile bodies part in greyscale: the yellow is far lighter than the red', () => {
    const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
    const y = lum(PALETTE['tier.yellow.base']), r = lum(PALETTE['tier.red.base']);
    expect((y + 0.05) / (r + 0.05)).toBeGreaterThan(2.5);
  });

  it('allyColor is the full inversion: every channel 255 minus itself', () => {
    expect(allyColor(0x000000)).toBe(0xFFFFFF);
    expect(allyColor(0xFFFFFF)).toBe(0x000000);
    expect(allyColor(pal('tier.yellow.base'))).toBe(0x0A0FFF);
    expect(allyColor(pal('tier.red.base'))).toBe(0x1FE1E1);
    expect(allyColor(allyColor(0x123456))).toBe(0x123456);
  });

  it('an allied draw is the inverse of the hostile draw for every part, with no glow; the hostile draw is unchanged', () => {
    for (const tier of TIERS) {
      const en = new Enemies(new THREE.Scene(), host());
      const e = en.spawn(doubt, 1, 0, 3, 0, 3, 10, 1, 4, new Set(), tier);
      e.spawning = 0;
      e.spec = { ...doubt, behaviour: { name: 'still', update: () => {} } };
      const v = en.viewOf(1)!;
      const model = tierModel(doubt, tier);
      en.update(1 / 60);
      const hostile = v.paints.map(p => p.mat.color.getHex());
      expect(hostile).toEqual(model.map(p => p.color));
      e.faction = 'self';
      en.update(1 / 60);
      expect(v.paints.map(p => p.mat.color.getHex()), tier).toEqual(hostile.map(allyColor));
      for (const m of v.mats) expect(m.emissive.getHex()).toBe(0);
      // the shape cue stays: the thorns are still there, inverted
      expect((v.parts.get('tier') ?? []).every(o => o.visible)).toBe(true);
      expect(v.parts.get('tier')?.length ?? 0).toBe(tierMarks(doubt, tier).length);
      e.faction = 'projection';
      en.update(1 / 60);
      expect(v.paints.map(p => p.mat.color.getHex())).toEqual(hostile);
    }
  });

  it('a mended ally comes back in the tier it was released in', () => {
    const log = new ReleaseLog();
    expect(log.lastTier(3)).toBe('black');
    log.record(3, 'doubt', 'yellow');
    log.record(3, 'critic', 'red');
    expect(log.on(3)).toEqual(['doubt', 'critic']);
    expect(log.lastTier(3)).toBe('red');
    log.record(3, 'doubt');
    expect(log.lastTier(3)).toBe('black');
    log.clear();
    expect(log.lastTier(3)).toBe('black');
  });
});

describe('optional deeper behaviour: the falter after a Red release', () => {
  it('is off by default: a Red release changes nothing in its room', () => {
    expect(FALTER_ENABLED).toBe(false);
    const en = new Enemies(new THREE.Scene(), host());
    const red = en.spawn(doubt, 1, 0, 3, 0, 3, 10, 1, 4, new Set(), 'red');
    const mate = en.spawn(doubt, 2, 0, 5, 0, 3, 10, 1, 4, new Set());
    for (const e of en.list) e.spawning = 0;
    expect(falterTargets(en.list, red)).toEqual([]);
    expect(en.falter(red)).toBe(0);
    expect(mate.hold).toBe(0);
  });

  it('when turned on, the hostile projections left in the room hold still; allies, bosses and other rooms do not', () => {
    const cues: string[] = [];
    const en = new Enemies(new THREE.Scene(), host({ cue: k => { cues.push(k); } }));
    const red = en.spawn(doubt, 1, 0, 3, 0, 3, 10, 1, 4, new Set(), 'red');
    const mate = en.spawn(doubt, 2, 0, 5, 0, 3, 10, 1, 4, new Set());
    const ally = en.spawn(doubt, 3, 0, 6, 0, 3, 10, 1, 4, new Set());
    const away = en.spawn(doubt, 4, 9, 6, 0, 3, 10, 1, 4, new Set());
    const boss = en.spawn({ ...doubt, kind: 'boss' }, 5, 0, 7, 0, 3, 10, 1, 4, new Set());
    for (const e of en.list) e.spawning = 0;
    ally.faction = 'self';
    expect(falterTargets(en.list, red, true)).toEqual([mate]);
    expect(en.falter(red, true)).toBe(1);
    expect(mate.hold).toBe(FALTER_SECONDS);
    for (const o of [ally, away, boss]) expect(o.hold).toBe(0);
    expect(cues).toEqual(['falter']);
    const y = en.spawn(doubt, 6, 0, 3, 0, 3, 10, 1, 4, new Set(), 'yellow');
    y.spawning = 0;
    expect(en.falter(y, true)).toBe(0);
  });
});

describe('tier names', () => {
  it('every tier is named in English and Spanish, and the death cause names it', () => {
    for (const tier of TIERS) {
      expect(EN.messages[`tier.${tier}`]).toBeTruthy();
      expect(ES.messages[`tier.${tier}`]).toBeTruthy();
    }
    expect(ES.messages['tier.yellow']).toBe('rango amarillo');
    expect(ES.messages['tier.red']).toBe('rango rojo');
    expect(EN.messages['tier.named']).toContain('{name}');
    expect(ES.messages['tier.named']).toContain('{tier}');
  });
});
