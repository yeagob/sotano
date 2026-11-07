// The horse of sky floor 5 and its herd, headless, on the real meadow (docs/design/not-built/sky/guardians/HORSE.md).
// The deity: its telegraphs before every act, the pushes and slows of its attacks, the rests between them, the
// special attacks' longer telegraphs and the spirit gate, the startle and the calm, Gentled hits worth two, and the
// defeat. The herd: the errand and the kick (its telegraph first), the startle, turning by positive hits, the ally's
// help. The spreading ring. The plush models (parts, tokens only). Everything under a fixed dt, the same twice.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { pal, PALETTE, type PalToken } from '../src/content/palette';
import { SKY_HORSE_PALETTE } from '../src/content/palette/sky-horse';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { MAT } from '../src/content/materials';
import { SKY_HORSE_EN } from '../src/i18n/locales/sky/horse.en';
import { SKY_HORSE_ES } from '../src/i18n/locales/sky/horse.es';
import type { Body } from '../src/physics/voxel-collide';
import { TowerKnock } from '../src/sky/creatures/knock';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import {
  CAPTURE_TAIL, DRAIN_TAIL, GALLOP_SPIRIT, HORSE_ATTACKS, HORSE_DEITY_PARTS, HORSE_HITS, PANIC_SPIRIT, REST, SENT,
  SNORT_SPIRIT, groundAt, horseBrain, horseDeity, type HorseAttackId,
} from '../src/sky/creatures/deities/horse';
import { HORSE_MINION_PARTS, horseMinion } from '../src/sky/creatures/minions/horse';
import { horse } from '../src/sky/floors/horse';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { SpiritLaw } from '../src/sky/laws/spirit';
import { CAPTURE_TIME, TELEGRAPH, type CreatureDeps, type HindranceId, type SkyHost, type Vec3 } from '../src/sky/types';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';

const DT = 0.05;
const O: Vec3 = { x: 128, y: 194, z: 128 };

/** The meadow of seed 5, its world, a player at `at`, and the realm's systems as SkyRealm composes them. */
function rig(at?: (plan: ReturnType<typeof horse.generate>, world: SkyWorld) => Vec3) {
  const plan = horse.generate(new Rng(5), O);
  const world = new SkyWorld(buildIndex(plan.shapes));
  let now = 0;
  const p0 = at ? at(plan, world) : { x: plan.seat.x + 0.5 + 10, y: O.y + 1, z: plan.seat.z + 0.5 };
  const body: Body = { x: p0.x, y: p0.y, z: p0.z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = {
    pushes: [] as number[][], holds: [] as number[], slows: [] as number[][], drains: [] as number[], taken: 0,
    toasts: [] as string[], cues: [] as string[], gifts: [] as string[], carries: 0, hurt: 0,
    starts: [] as { id: HindranceId; t: number; telegraph: number; source: number }[],
  };
  let spirit = 100;
  const player = {
    body, eye: { x: p0.x, y: p0.y + 1.6, z: p0.z }, aim: { x: 0, y: 0, z: 1 }, hand: [], held: false,
    push: (vx: number, vy: number, vz: number) => { log.pushes.push([vx, vy, vz]); },
    slow: (f: number, s: number) => { log.slows.push([f, s]); },
    hold: (s: number) => { log.holds.push(s); },
    carry: () => { log.carries++; },
  };
  const target = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [target],
    hurt: (() => { log.hurt++; }) as unknown as HazardHost['hurt'],
    affect: (() => { log.hurt++; }) as unknown as HazardHost['affect'],
    push: (() => { log.hurt++; }) as unknown as HazardHost['push'],
    live: () => {}, particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const host = {
    time: () => now, player: () => player, actors: () => actors, world: () => world, hazards: () => hazards,
    debris: () => ({ spawn: () => 0 }), fork: (...path: (string | number)[]) => new Rng(path.length * 7 + 5),
    fx: () => {}, cue: (k: string) => { log.cues.push(k); }, toast: (k: string) => { log.toasts.push(k); },
    card: () => {}, bar: () => {}, place: () => {}, gift: (id: string) => { log.gifts.push(id); }, travel: () => {},
    drainSpirit: (n: number) => { log.drains.push(n); spirit -= n; }, spirit: () => spirit, refillSpirit: () => { spirit = 100; },
    takeRandomPractice: () => { log.taken++; return 'x'; }, sendUnderground: () => true, enterUnity: () => {},
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  const start = runner.start.bind(runner);
  runner.start = ((h: { id: HindranceId }, p: unknown, telegraph: number, source: number) => {
    log.starts.push({ id: h.id, t: now, telegraph, source });
    return start(h as never, p as never, telegraph, source);
  }) as typeof runner.start;
  const spiritLaw = new SpiritLaw(host);
  const deps: CreatureDeps = { actors, runner, effects, puff: new Puff(host), knock: new TowerKnock(host, effects), spirit: spiritLaw };
  const creatures = new SkyCreatures(new THREE.Group(), host, deps);
  const deity = creatures.spawnDeity(horseDeity, plan);
  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      runner.update(DT); effects.update(DT); spiritLaw.update(); creatures.update(DT, 5); hazards.update(DT);
      now += DT; world.expire(now);
    }
  };
  const until = (pred: () => boolean, max = 2000) => { let n = 0; while (!pred() && n < max) { step(); n++; } return n * DT; };
  const brain = () => { const b = horseBrain(deity); if (!b) throw new Error('no brain yet'); return b; };
  const hit = (n = 1) => { for (let i = 0; i < n; i++) creatures.touch(deity.id, 'positive', true, { x: deity.body.x, y: deity.body.y + 1.5, z: deity.body.z }, 'intent'); };
  return { plan, world, body, player, host, log, runner, creatures, deity, step, until, brain, hit, now: () => now, setSpirit: (v: number) => { spirit = v; } };
}

/** The ground spot `d` blocks from the seat toward the meadow's centre (never on a paddock or a run). */
const towardCentre = (d: number) => (plan: ReturnType<typeof horse.generate>, world: SkyWorld): Vec3 => {
  const sx = plan.seat.x + 0.5, sz = plan.seat.z + 0.5;
  const dx = O.x - sx, dz = O.z - sz, l = Math.hypot(dx, dz);
  const x = sx + (dx / l) * d, z = sz + (dz / l) * d;
  return { x, y: groundAt(world, x, z, O.y + 12) ?? O.y + 1, z };
};

/** Makes the brain offer only these attacks, from the stage `stage` (set by hits that are not counted as progress here). */
function only(r: ReturnType<typeof rig>, ids: HorseAttackId[]) {
  r.step();
  r.brain().only = ids;
}

describe('the horse deity: data (HORSE.md B9)', () => {
  it('walks (no levitation), teleports, takes 48 hits, telegraphs for 0.9 s and rests 2.5, 2, 1.5', () => {
    expect([horseDeity.hover, horseDeity.teleport, horseDeity.hits, horseDeity.telegraph]).toEqual([null, true, HORSE_HITS, TELEGRAPH[4]]);
    expect(horseDeity.rest).toEqual(REST);
    expect(horseDeity.won.gift).toBe('triple-jump');
    expect(horseDeity.won.toast).toBe('toast.horseWon');
  });

  it('has its four attacks, the herd it sends and the six special ones, each in its stage', () => {
    const by = Object.fromEntries(HORSE_ATTACKS.map(a => [a.id, a.stage]));
    expect(by).toEqual({ stamp: 0, gust: 0, send: 0, dust: 0, snort: 0, leap: 1, shake: 1, gallop: 1, wave: 2, panic: 2, snaking: 2 });
    expect(HORSE_ATTACKS.filter(a => a.spirit !== undefined).map(a => [a.id, a.spirit])).toEqual([['snort', 14], ['gallop', 16], ['panic', 18]]);
    for (const a of HORSE_ATTACKS) expect(a.telegraph.cue.startsWith('horse.')).toBe(true);
  });
});

describe('the horse deity: telegraphs before every act', () => {
  it('Rear and stamp: nothing starts before the deity’s 0.9 s, then a ring push and two segments fade, each with its own telegraph', () => {
    const r = rig(towardCentre(10));
    only(r, ['stamp']);
    r.until(() => r.deity.state === 'Attacking');
    const t0 = r.now();
    r.until(() => r.log.starts.length > 0);
    expect(r.now() - t0).toBeGreaterThanOrEqual(TELEGRAPH[4] - 1e-9);
    const ids = r.log.starts.map(s => s.id).sort();
    expect(ids).toEqual(['fading-platforms', 'knockback']);
    for (const s of r.log.starts) expect(s.telegraph).toBeGreaterThanOrEqual(0.8);
    expect(r.log.hurt).toBe(0);
  });

  it('a stamp pushes a player within 3 blocks after the full telegraph, and never takes health', () => {
    const r = rig(towardCentre(2.5));
    r.step();
    r.brain().only = ['stamp'];
    r.brain().calmReady = false;
    r.body.y = r.deity.body.y;
    r.until(() => r.log.starts.some(s => s.id === 'knockback'));
    expect(r.log.pushes).toEqual([]);
    r.until(() => r.log.pushes.length > 0, 40);
    expect(r.log.pushes.length).toBe(1);
    expect(Math.hypot(r.log.pushes[0][0], r.log.pushes[0][2])).toBeCloseTo(2.5 * 2.5, 5);
    expect(r.log.hurt).toBe(0);
    expect(r.log.drains).toEqual([]);
  });

  it('rests between attacks by stage: no new telegraph before recover + rest', () => {
    const r = rig(towardCentre(10));
    only(r, ['stamp', 'gust']);
    const begins: number[] = [];
    let was = r.deity.state;
    for (let i = 0; i < 600; i++) {
      r.step();
      if (r.deity.state === 'Attacking' && was !== 'Attacking') begins.push(r.now());
      if (r.deity.state !== 'Hurt') was = r.deity.state;
    }
    expect(begins.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < begins.length; i++) expect(begins[i] - begins[i - 1]).toBeGreaterThanOrEqual(TELEGRAPH[4] + 2 + REST[0] - 1e-6);
    // and never the same attack twice in a row while the other is there
    const seq = r.log.starts.filter(s => s.id === 'knockback' || s.id === 'wind').map(s => s.id);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });
});

describe('the horse deity: special attacks and the spirit gate', () => {
  it('Snort drains 14 in its cone, 0.2 s after the floor’s telegraph, never at its start', () => {
    const r = rig(towardCentre(10));
    only(r, ['snort']);
    r.until(() => r.deity.state === 'Attacking');
    const t0 = r.now();
    r.until(() => r.log.drains.length > 0, 60);
    expect(r.log.drains).toEqual([SNORT_SPIRIT]);
    expect(r.now() - t0).toBeGreaterThanOrEqual(TELEGRAPH[4] + DRAIN_TAIL - 1e-6);
  });

  it('a positive hit on the horse during the Snort’s telegraph turns it into a nicker: no drain', () => {
    const r = rig(towardCentre(10));
    only(r, ['snort']);
    r.until(() => r.deity.state === 'Attacking');
    r.step(4);
    r.hit();
    r.step(30);
    expect(r.log.drains).toEqual([]);
    expect(r.log.cues).toContain('horse.nicker');
  });

  it('a block between the nose and the player stops the breath', () => {
    const r = rig(towardCentre(10));
    only(r, ['snort']);
    r.until(() => r.deity.state === 'Attacking');
    // a wall of stone two cells in front of the player, across the cone
    const b = r.deity.body, p = r.body;
    const ux = (b.x - p.x) / Math.hypot(b.x - p.x, b.z - p.z), uz = (b.z - p.z) / Math.hypot(b.x - p.x, b.z - p.z);
    for (let k = -2; k <= 2; k++) for (let y = 0; y < 5; y++) {
      const x = Math.floor(p.x + ux * 2 - uz * k), z = Math.floor(p.z + uz * 2 + ux * k);
      r.world.set(x, Math.floor(p.y) + y - 1, z, MAT.stone);
    }
    r.step(30);
    expect(r.log.drains).toEqual([]);
  });

  it('the gate: two drains are at least 6 s apart, and none begins its telegraph while the player is held', () => {
    const r = rig(towardCentre(10));
    only(r, ['snort']);
    r.player.held = true;
    r.step(200);
    expect(r.log.starts).toEqual([]);
    expect(r.deity.state).not.toBe('Attacking');
    expect(r.log.drains).toEqual([]);
    r.player.held = false;
    const times: number[] = [];
    for (let i = 0; i < 800; i++) { const n = r.log.drains.length; r.step(); if (r.log.drains.length > n) times.push(r.now()); }
    expect(times.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(6 - 1e-6);
  });

  it('Herd panic drains 18 from a player who moved, and nothing from one who stood still', () => {
    for (const moving of [true, false]) {
      const r = rig(towardCentre(10));
      r.step();
      // 32 of 48 hits: the third stage, where Herd panic enters
      r.hit(32);
      r.brain().only = ['panic'];
      r.brain().calmReady = false;
      r.until(() => r.deity.state === 'Attacking', 400);
      if (moving) r.body.vx = 1;
      r.step(30);
      expect(r.log.drains).toEqual(moving ? [PANIC_SPIRIT] : []);
      if (!moving) expect(r.log.cues).toContain('horse.chime');
    }
  });

  it('Gallop line drains 16 from a player it touches, once', () => {
    const r = rig(towardCentre(10));
    r.step();
    r.hit(16);
    r.brain().only = ['gallop'];
    r.until(() => r.deity.state === 'Attacking', 400);
    r.step(1);
    // the player steps onto the line the horse will run
    const b = r.deity.body;
    r.step(TELEGRAPH[4] / DT + 2);
    r.body.x = b.x + (r.deity.body.vx || 0) * 0.3;
    r.body.z = b.z + (r.deity.body.vz || 0) * 0.3;
    r.body.y = r.deity.body.y;
    r.step(40);
    expect(r.log.drains).toEqual([GALLOP_SPIRIT]);
  });

  it('Snaking captures a player who stays inside the circle (3 s, one practice), 0.5 s after the floor’s telegraph', () => {
    const r = rig(towardCentre(8));
    r.step();
    r.hit(32);
    r.brain().only = ['snaking'];
    r.brain().calmReady = false;
    r.until(() => r.deity.state === 'Attacking', 600);
    const t0 = r.now();
    r.until(() => r.log.holds.length > 0, 60);
    expect(r.log.holds).toEqual([CAPTURE_TIME]);
    expect(r.log.taken).toBe(1);
    expect(r.log.toasts).toContain('toast.horseHerds');
    expect(r.now() - t0).toBeGreaterThanOrEqual(TELEGRAPH[4] + CAPTURE_TAIL - 1e-6);
    // at most once every 30 s
    r.step(300);
    expect(r.log.taken).toBe(1);
  });

  it('a player who leaves the circle before it closes is not captured', () => {
    const r = rig(towardCentre(8));
    r.step();
    r.hit(32);
    r.brain().only = ['snaking'];
    r.brain().calmReady = false;
    r.until(() => r.deity.state === 'Attacking', 600);
    r.step(3);
    r.body.x += 6;
    r.step(40);
    expect(r.log.holds).toEqual([]);
    expect(r.log.taken).toBe(0);
  });
});

describe('the horse deity: startle, calm and defeat', () => {
  it('a player rushing within 6 blocks startles it: it crouches, then leaps to a paddock at least 12 from them', () => {
    const r = rig(towardCentre(5));
    r.step();
    r.body.vx = 1;
    r.until(() => r.deity.state === 'Leaping', 40);
    expect(r.deity.state).toBe('Leaping');
    r.body.vx = 0;
    r.until(() => r.deity.state !== 'Leaping', 100);
    const pads = r.plan.extra!.paddocks!;
    const on = pads.find(p => Math.abs(r.deity.body.x - (p.x + 0.5)) <= 2.5 && Math.abs(r.deity.body.z - (p.z + 0.5)) <= 2.5);
    expect(on).toBeDefined();
    expect(Math.hypot(on!.x + 0.5 - r.body.x, on!.z + 0.5 - r.body.z)).toBeGreaterThanOrEqual(12);
  });

  it('a still player near it for 1.5 s gentles it, and each positive hit then counts two', () => {
    const r = rig(towardCentre(6));
    r.until(() => r.deity.state === 'Gentled', 60);
    expect(r.deity.state).toBe('Gentled');
    r.hit(3);
    expect(r.deity.hits).toBe(6);
    r.until(() => r.deity.state === 'Watching', 80);
    r.hit(1);
    expect(r.deity.hits).toBe(7);
  });

  it('48 positive hits win it: its outcome, the toast, the gift, and the herd goes calm; it never dies', () => {
    const r = rig(towardCentre(10));
    r.step();
    r.hit(HORSE_HITS);
    expect(r.deity.state).toBe('Won');
    expect(r.deity.side).toBe('ally');
    expect(r.log.toasts).toContain('toast.horseWon');
    expect(r.log.gifts).toEqual(['triple-jump']);
    r.step(200);
    expect(r.deity.state).toBe('Won');
    expect(r.deity.alive).toBe(true);
    expect(r.log.drains).toEqual([]);
  });

  it('a negative touch only puffs', () => {
    const r = rig(towardCentre(10));
    r.step();
    r.creatures.touch(r.deity.id, 'negative', true, { x: r.deity.body.x, y: r.deity.body.y + 1, z: r.deity.body.z }, 'intent');
    expect(r.deity.hits).toBe(0);
  });

  it('runs the same twice under a fixed dt', () => {
    const run = () => {
      const r = rig(towardCentre(10));
      const out: number[] = [];
      for (let i = 0; i < 400; i++) { r.step(); if (i === 150) r.hit(16); if (i % 20 === 0) out.push(r.deity.body.x, r.deity.body.y, r.deity.body.z); }
      return [out, r.log.starts.map(s => `${s.id}@${s.t.toFixed(2)}`)];
    };
    expect(run()).toEqual(run());
  });
});

describe('the herd (B5)', () => {
  /** The player on the open meadow 4 blocks from the gate nearest the horse, toward it. */
  const byGate = (plan: ReturnType<typeof horse.generate>, world: SkyWorld): Vec3 => {
    const s = gateOf(plan), dx = plan.seat.x - s.x, dz = plan.seat.z - s.z, l = Math.hypot(dx, dz);
    const x = s.x + 0.5 + (dx / l) * 4, z = s.z + 0.5 + (dz / l) * 4;
    return { x, y: groundAt(world, x, z, O.y + 12) ?? O.y + 1, z };
  };
  const gateOf = (plan: ReturnType<typeof horse.generate>) =>
    [...plan.spawns].sort((a, b) => Math.hypot(a.x - plan.seat.x, a.z - plan.seat.z) - Math.hypot(b.x - plan.seat.x, b.z - plan.seat.z))[0];
  function herd(at = byGate) {
    const r = rig(at);
    const spawn = gateOf(r.plan);
    const m = r.creatures.spawnMinion(horseMinion, r.plan, spawn);
    return { ...r, m, spawn };
  }

  it('a sent minion gallops to the player and kicks once, after the floor’s telegraph, and returns to its loop', () => {
    const r = herd();
    r.step();
    r.brain().only = ['send'];
    r.brain().calmReady = false;
    r.until(() => SENT.has(r.m.id), 600);
    expect(SENT.has(r.m.id)).toBe(true);
    r.until(() => r.log.starts.some(s => s.id === 'knockback' && s.source === r.m.id), 400);
    const kick = r.log.starts.find(s => s.id === 'knockback' && s.source === r.m.id)!;
    expect(kick.telegraph).toBe(TELEGRAPH[4]);
    expect(SENT.has(r.m.id)).toBe(false);
    const before = r.log.pushes.length;
    r.step(Math.floor(0.8 / DT));
    expect(r.log.pushes.length).toBe(before);
    expect(r.log.hurt).toBe(0);
  });

  it('a jump that lands within 3 blocks startles it: it bolts and does not kick', () => {
    const r = herd();
    r.until(() => r.m.state === 'Wild', 100);
    r.body.x = r.m.body.x + 1.5; r.body.z = r.m.body.z; r.body.y = r.m.body.y;
    r.body.onGround = false;
    r.step();
    r.body.onGround = true;
    r.step(2);
    const starts = r.log.starts.filter(s => s.source === r.m.id).length;
    r.step(20);
    expect(r.log.starts.filter(s => s.source === r.m.id).length).toBe(starts);
  });

  it('four positive hits turn it into an ally; a negative one only puffs', () => {
    const r = herd();
    r.until(() => r.m.state === 'Wild', 100);
    const at = { x: r.m.body.x, y: r.m.body.y + 0.5, z: r.m.body.z };
    r.creatures.touch(r.m.id, 'negative', true, at, 'intent');
    expect(r.m.hits).toBe(0);
    for (let i = 0; i < 4; i++) r.creatures.touch(r.m.id, 'positive', true, at, 'intent');
    expect([r.m.side, r.m.state]).toEqual(['ally', 'Ally']);
    // it goes to the horse and grazes beside it, which gentles the horse (B4)
    r.until(() => r.deity.state === 'Gentled', 1200);
    expect(r.deity.state).toBe('Gentled');
  });
});

describe('the horse’s ring (horse-ring)', () => {
  function ring(y = 0) {
    const r = rig(towardCentre(10));
    const from = { x: r.body.x - 2, y: r.body.y, z: r.body.z };
    r.body.y += y;
    r.runner.start(HINDRANCES['horse-ring'], { from, speed: 8, radius: 4, height: 0.8, strength: 5 }, 0.8, 99);
    for (let i = 0; i < 40; i++) { r.runner.update(DT); }
    return r;
  }
  it('pushes a player it passes, once, outward', () => {
    const r = ring();
    expect(r.log.pushes.length).toBe(1);
    expect(r.log.pushes[0][0]).toBeGreaterThan(0);
  });
  it('passes under a player who jumps it', () => {
    expect(ring(1).log.pushes).toEqual([]);
  });
});

describe('the plush models (docs/art/sky/horse.md)', () => {
  const tokens = Object.keys(SKY_HORSE_PALETTE) as PalToken[];
  it('stay within the part caps and use only the horse’s plush tokens', () => {
    expect(HORSE_DEITY_PARTS.length).toBeLessThanOrEqual(24);
    expect(HORSE_MINION_PARTS.length).toBeLessThanOrEqual(14);
    const allowed = new Set(tokens.map(t => pal(t)));
    for (const p of [...HORSE_DEITY_PARTS, ...HORSE_MINION_PARTS]) expect(allowed.has(p.color)).toBe(true);
    for (const t of tokens) expect((PALETTE as Record<string, string>)[t]).toBe((SKY_HORSE_PALETTE as Record<string, string>)[t]);
  });

  it('the giant head is about 2.2 times the body’s width', () => {
    const body = HORSE_DEITY_PARTS.find(p => p.name === 'body')!, head = HORSE_DEITY_PARTS.find(p => p.name === 'head')!;
    expect(head.size[0] / body.size[0]).toBeGreaterThanOrEqual(1.9);
    expect(head.size[0] / body.size[0]).toBeLessThanOrEqual(2.4);
  });

  it('nothing is red, gold or cold: every token ΔE ≥ 20 from life, the attack red, the warning and the gold; ≥ 15 from the cold', () => {
    const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lab = (n: number) => {
      const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
      const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
      const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
    };
    const dE = (a: number, b: number) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
    for (const t of tokens) {
      for (const r of ['life.heart', 'attack.red.base', 'attack.red.dim', 'attack.warn.base', 'light.gold'] as PalToken[]) expect(dE(pal(t), pal(r)), `${t} ${r}`).toBeGreaterThanOrEqual(20);
      for (const r of ['cold.deep', 'cold.dim', 'cold.rim', 'cold.body'] as PalToken[]) expect(dE(pal(t), pal(r)), `${t} ${r}`).toBeGreaterThanOrEqual(15);
    }
  });
});

describe('the horse’s words', () => {
  it('every key is in English and Spanish', () => {
    expect(Object.keys(SKY_HORSE_ES).sort()).toEqual(Object.keys(SKY_HORSE_EN).sort());
    for (const k of Object.keys(SKY_HORSE_EN)) expect((SKY_HORSE_ES as Record<string, string>)[k].length).toBeGreaterThan(0);
  });
});
