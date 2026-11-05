// The giant panda and its minions, headless (docs/design/not-built/sky/guardians/PANDA.md B2–B5, B3b; SKY.md §5.5).
// On the real floor 1 plan, with the real hindrance runner, effects and hazards, at a fixed dt: every attack shows its
// full telegraph before anything happens and only pushes, slows, holds or grows bamboo; the rest by phase and the
// rest beat; the three drains go through the gate, once, only when the player rushes, hides or is touched, and a
// positive hit on the panda answers them; the capture's spacing; the one rally at half the hits and the nap; the
// defeat by 24 positive hits; the minions' rules (the well's rim, the seat's height, turning, the allies' help); the
// bamboo hindrance; the palette and the words.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { AIR, MAT } from '../src/content/materials';
import { PALETTE, pal, type PalToken } from '../src/content/palette';
import { SKY_PANDA_PALETTE } from '../src/content/palette/sky-panda';
import { Rng } from '../src/core/rng';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { SKY_PANDA_EN } from '../src/i18n/locales/sky/panda.en';
import { DEITIES } from '../src/sky/creatures/deities';
import {
  CAPTURE_GAP, CHEW_SPIRIT, HALF_HITS, NAP, PANDA_ATTACKS, PANDA_KINDS, PEEK_SPIRIT, REST, REST_BEAT_WAIT, TUMBLE_SPIRIT,
  makePandaDeity, pandaDeity, pandaMind, phaseOf, type Kind,
} from '../src/sky/creatures/deities/panda';
import { MINIONS } from '../src/sky/creatures/minions';
import { onRim, pandaMinion } from '../src/sky/creatures/minions/panda';
import { ALLY, helpedHits } from '../src/sky/creatures/minion';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { panda as pandaFloor } from '../src/sky/floors/panda';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import {
  CAPTURE_TIME, ExceptionKind, TELEGRAPH, type CreatureDeps, type DeityDef, type Shape, type SkyActor, type SkyHost,
  type TowerKnockApi,
} from '../src/sky/types';
import type { Body } from '../src/physics/voxel-collide';

const DT = 1 / 30;
const O = { x: 128, y: 36, z: 128 };
const PLAN = pandaFloor.generate(new Rng(1), O);
/** The hall's ground: the tree's slab under the floor (the plan writes nothing at base − 1). */
const GROUND: Shape = { k: 'box', x0: O.x - 22, y0: O.y - 1, z0: O.z - 22, x1: O.x + 22, y1: O.y - 1, z1: O.z + 22, m: MAT.stone };

/** A ground cell east of the seat, within 12 of the panda and in its sight over the seat's edge: the default stand. */
const SPOT = { x: O.x + 10.5, y: O.y, z: O.z + 0.5 };

function rig(def: DeityDef = pandaDeity, at = SPOT) {
  let now = 0;
  const world = new SkyWorld(buildIndex([GROUND, ...PLAN.shapes]));
  const body: Body = { x: at.x, y: at.y, z: at.z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const pushes: number[][] = [], slows: number[][] = [], holds: number[] = [], drains: number[] = [], fx: string[] = [], cues: string[] = [], toasts: string[] = [];
  const bad = new Set<string>();
  let held = false;
  const player = {
    body, get eye() { return { x: body.x, y: body.y + 1.6, z: body.z }; }, aim: { x: -1, y: 0, z: 0 }, hand: [],
    get held() { return held; },
    push: (vx: number, vy: number, vz: number) => { pushes.push([vx, vy, vz]); },
    slow: (f: number, s: number) => { slows.push([f, s]); },
    hold: (s: number) => { holds.push(s); },
    carry: () => {},
  };
  const self = { id: 1000, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [self],
    hurt: (() => bad.add('hazard.hurt')) as unknown as HazardHost['hurt'],
    affect: (() => bad.add('hazard.affect')) as unknown as HazardHost['affect'],
    push: (() => bad.add('hazard.push')) as unknown as HazardHost['push'],
    live: () => {},
    particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  let practices = 0;
  const host = {
    time: () => now,
    player: () => player,
    actors: () => actors,
    world: () => world,
    debris: () => ({ spawn: () => 0 }),
    hazards: () => hazards,
    fork: (...path: (string | number)[]) => new Rng(path.length * 11 + 3),
    fx: (k: string) => { fx.push(k); }, cue: (k: string) => { cues.push(k); }, toast: (k: string) => { toasts.push(k); },
    card: () => {}, bar: () => {}, place: () => {}, gift: () => {},
    travel: () => bad.add('travel'), drainSpirit: () => bad.add('drainSpirit'), spirit: () => 100,
    takeRandomPractice: () => { practices++; return 'x'; }, sendUnderground: () => { bad.add('sendUnderground'); return true; },
    refillSpirit: () => {}, enterUnity: () => {},
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  let canDrain = true;
  let lastDrain = -Infinity;
  const spirit = {
    update() {},
    canDrain: () => canDrain && !held && now - lastDrain >= 6,
    drain: (n: number) => { if (!(canDrain && !held && now - lastDrain >= 6)) return false; drains.push(n); lastDrain = now; return true; },
  };
  const deps: CreatureDeps = { actors, runner, effects, puff: new Puff(host), knock: {} as TowerKnockApi, spirit };
  const creatures = new SkyCreatures(new THREE.Group(), host, deps);
  const deity = creatures.spawnDeity(def, PLAN);
  const won: number[] = [];
  creatures.onWon = d => { won.push(d.id); };
  const frame = () => {
    runner.update(DT);
    creatures.update(DT, 1);
    hazards.update(DT);
    effects.update(DT);
    now += DT;
    world.expire(now);
  };
  const run = (s: number) => { for (let t = 0; t < s - 1e-9; t += DT) frame(); };
  const until = (pred: () => boolean, max = 60) => { let t = 0; while (!pred() && t < max) { frame(); t += DT; } return t; };
  const touch = (n: number, polarity: 'positive' | 'negative' = 'positive') => {
    for (let i = 0; i < n; i++) creatures.touch(deity.id, polarity, true, { x: deity.body.x, y: deity.body.y + 1.5, z: deity.body.z }, 'intent');
  };
  return {
    world, body, player, host, hazards, effects, runner, creatures, deity, frame, run, until, touch, pushes, slows, holds,
    drains, fx, cues, toasts, bad, won, now: () => now, setHeld: (h: boolean) => { held = h; }, setCanDrain: (c: boolean) => { canDrain = c; },
    practices: () => practices,
  };
}

type Rig = ReturnType<typeof rig>;
const mind = (r: Rig) => pandaMind(r.deity)!;
/** Steps until the panda's telegraph of `id` begins; returns the seconds waited. */
const toTell = (r: Rig, id?: Kind, max = 60) => r.until(() => !!mind(r)?.tell && (!id || mind(r).tell!.id === id), max);

describe('the panda deity (B2)', () => {
  it('is the floor 1 guardian of its document: 24 hits, a 1.4 s telegraph, 2.5 s recovery, hovering 1.5, no teleport', () => {
    expect(DEITIES.panda).toBe(pandaDeity);
    expect([pandaDeity.floor, pandaDeity.hits, pandaDeity.telegraph, pandaDeity.recover, pandaDeity.hover, pandaDeity.teleport])
      .toEqual([1, 24, TELEGRAPH[0], 2.5, 1.5, false]);
    expect(PANDA_KINDS).toEqual(['toss', 'press', 'sit', 'yawn', 'shove', 'thicket', 'chew', 'peekaboo', 'tumble', 'cradle']);
    expect(PANDA_KINDS.filter(k => phaseOf(k) === 2)).toEqual(['yawn', 'peekaboo', 'tumble', 'cradle']);
    expect(PANDA_ATTACKS.filter(a => a.spirit !== undefined).map(a => [a.id, a.spirit])).toEqual([['chew', 6], ['peekaboo', 8], ['tumble', 8]]);
    for (const a of PANDA_ATTACKS) expect(a.stage).toBe(phaseOf(a.id) === 1 ? 0 : 1);
  });

  it('floats over the seat, idles out of sight and watches within 12 blocks', () => {
    const far = rig(pandaDeity, { x: O.x + 19.5, y: O.y, z: O.z + 0.5 });
    far.run(3);
    expect(far.deity.state).toBe('Idle');
    expect(far.deity.body.y).toBeGreaterThan(PLAN.seat.y + 1.2);
    const near = rig();
    near.run(0.2);
    expect(near.deity.state).toBe('Watching');
  });
});

describe('telegraphs and acts (B3, B3b)', () => {
  const ON_TOP = { x: O.x - 5.5, y: O.y + 15, z: O.z - 2.5 }; // gentle column 15's top, two by two

  for (const id of ['toss', 'press', 'sit', 'shove', 'thicket'] as Kind[]) {
    it(`${id}: nothing lands before the full telegraph, then a hindrance with its own warning; no harm`, () => {
      const r = rig(makePandaDeity([id]), id === 'sit' || id === 'thicket' ? ON_TOP : SPOT);
      toTell(r, id);
      const start = r.now();
      r.until(() => r.runner.active().length > 0, 5);
      expect(r.now() - start).toBeGreaterThanOrEqual(TELEGRAPH[0] - 1e-6);
      expect(r.pushes.length + r.slows.length).toBe(0);
      expect(r.runner.active()[0].phase).toBe('telegraph');
      r.run(8);
      expect([...r.bad]).toEqual([]);
      expect(r.drains).toEqual([]);
      expect(r.deity.alive).toBe(true);
    });
  }

  it('toss: the stalk stands as bamboo for a while, then dissolves, and never in a placed cell', () => {
    const r = rig(makePandaDeity(['toss']));
    r.body.x += 0; // the player stays: the stalk lands on them and pushes softly
    toTell(r, 'toss');
    const cell = () => mind(r).tell?.cells[0];
    r.frame();
    const c = cell()!;
    expect(c).toBeGreaterThanOrEqual(0);
    r.body.x += 2; // step off the mark
    r.until(() => r.world.getAt(c) === MAT.bamboo, 4);
    expect(r.world.getAt(c)).toBe(MAT.bamboo);
    r.run(7);
    expect(r.world.getAt(c)).toBe(AIR);
  });

  it('press slows a player who stays on it; sit-down opens one or two cells of the top, never all', () => {
    const r = rig(makePandaDeity(['press']));
    toTell(r, 'press');
    r.run(TELEGRAPH[0] + 1.2);
    expect(r.slows.some(([f]) => f === 0.5)).toBe(true);
    const s = rig(makePandaDeity(['sit']), ON_TOP);
    toTell(s, 'sit');
    s.frame();
    const cells = mind(s).tell!.cells;
    expect(cells.length).toBeGreaterThanOrEqual(1);
    expect(cells.length).toBeLessThanOrEqual(2);
    s.body.x -= 1.2; // off the cracks
    s.run(TELEGRAPH[0] + 1.2);
    expect(cells.filter(i => s.world.getAt(i) === AIR).length).toBe(cells.length);
    s.run(5);
    expect(cells.every(i => s.world.getAt(i) !== AIR)).toBe(true);
  });

  it('yawn (phase 2): a ring push from the seat, and a hit in the open mouth ends it with no ring', () => {
    const r = rig(makePandaDeity(['yawn']));
    r.touch(HALF_HITS);
    toTell(r, 'yawn', 30);
    r.run(TELEGRAPH[0] + 1.2);
    expect(r.pushes.length).toBe(1);
    const c = rig(makePandaDeity(['yawn']));
    c.touch(HALF_HITS);
    toTell(c, 'yawn', 30);
    c.run(0.5);
    c.touch(1);
    c.run(TELEGRAPH[0] + 1.2);
    expect(c.pushes.length).toBe(0);
    expect(mind(c).log).toContain('counter:yawn');
  });

  it('shove: a soft push along the arc, which a hit on the raised paw turns into a pat', () => {
    const r = rig(makePandaDeity(['shove']));
    toTell(r, 'shove');
    r.run(TELEGRAPH[0] + 1.2);
    expect(r.pushes.length).toBe(1);
    const k = Math.hypot(r.pushes[0][0], r.pushes[0][2]);
    expect(k).toBeCloseTo(1.5 * 2.5, 5);
    const c = rig(makePandaDeity(['shove']));
    toTell(c, 'shove');
    c.touch(1);
    c.run(TELEGRAPH[0] + 1.2);
    expect(c.pushes.length).toBe(0);
  });

  it('thicket: stalks two high between the player and the seat for 4 s; a positive shot cuts one', () => {
    const r = rig(makePandaDeity(['thicket']), ON_TOP);
    toTell(r, 'thicket');
    r.frame();
    const cells = [...mind(r).tell!.cells];
    expect(cells.length).toBeGreaterThanOrEqual(2);
    r.until(() => r.world.getAt(cells[0]) === MAT.bamboo, 4);
    expect(cells.filter(i => r.world.getAt(i) === MAT.bamboo).length).toBe(cells.length);
    const [x, y, z] = r.world.coords(cells[0]);
    expect(r.runner.positiveHit({ x: x + 0.5, y: y + 0.5, z: z + 0.5, cell: cells[0], actor: -1, weapon: 'intent', warm: true })).toBe(true);
    expect(r.world.getAt(cells[0])).toBe(AIR);
    expect(r.world.getAt(cells[1])).toBe(AIR);
    r.run(5);
    expect(cells.every(i => r.world.getAt(i) === AIR)).toBe(true);
  });
});

describe('rest and cooldown (B2)', () => {
  it('rests 3.5 s after a recovery in the first phase and 2.5 s in the second; never the same attack twice running', () => {
    const r = rig(makePandaDeity(['toss', 'press']));
    const order: string[] = [];
    let recEnd = -1;
    const gaps: number[] = [];
    let last = '';
    for (let t = 0; t < 40; t += DT) {
      r.body.vx = 1; // a player who never stands still: no rest beat
      const m = pandaMind(r.deity);
      const core = m?.core ?? '';
      if (last === 'Recovering' && core === 'Watching') recEnd = r.now();
      if (core === 'Attacking' && last !== 'Attacking') { order.push(m!.tell!.id); if (recEnd >= 0) gaps.push(r.now() - recEnd); }
      last = core;
      r.frame();
    }
    for (const g of gaps) expect(g).toBeCloseTo(REST[0], 1);
    for (let i = 1; i < order.length; i++) expect(order[i]).not.toBe(order[i - 1]);
    const h = rig(makePandaDeity(['toss', 'press']));
    h.touch(HALF_HITS + 1);
    h.run(RALLY_AND_NAP);
    const g2: number[] = [];
    last = '';
    recEnd = -1;
    for (let t = 0; t < 30; t += DT) {
      h.body.vx = 1;
      const core = mind(h).core;
      if (last === 'Recovering' && core === 'Watching') recEnd = h.now();
      if (core === 'Attacking' && last !== 'Attacking' && recEnd >= 0) g2.push(h.now() - recEnd);
      last = core;
      h.frame();
    }
    expect(g2.length).toBeGreaterThan(0);
    for (const g of g2) expect(g).toBeCloseTo(REST[1], 1);
  });

  it('the rest beat: a player still for 2 s while watched delays the next attack 2 s, with leaves settling first', () => {
    const moving = rig(makePandaDeity(['toss']));
    let tm = 0;
    moving.until(() => { moving.body.vx = 1; moving.body.x = SPOT.x + Math.sin(tm += DT) * 0.2; return !!mind(moving)?.tell; });
    const tMove = moving.now();
    const still = rig(makePandaDeity(['toss']));
    const fx0 = still.fx.length;
    toTell(still, 'toss');
    expect(still.now() - tMove).toBeCloseTo(REST_BEAT_WAIT, 1);
    expect(mind(still).log).toContain('rest-beat');
    expect(still.fx.slice(fx0).filter(k => k === 'motes').length).toBeGreaterThanOrEqual(8);
  });
});

/** Seconds of the rally (2) and the nap (5), with a margin. */
const RALLY_AND_NAP = 2 + NAP + 0.5;

describe('the drains go through the gate (B3b 7–9)', () => {
  it('slow chew drains 6 from a player who jumps twice during it, and nothing from one who stands', () => {
    const calm = rig(makePandaDeity(['chew']));
    toTell(calm, 'chew');
    calm.run(3);
    expect(calm.drains).toEqual([]);
    const rush = rig(makePandaDeity(['chew']));
    toTell(rush, 'chew');
    for (let j = 0; j < 2; j++) {
      rush.body.onGround = false; rush.body.vy = 8; rush.frame();
      rush.body.vy = 0; rush.body.onGround = true; rush.run(0.3);
    }
    rush.run(2);
    expect(rush.drains).toEqual([CHEW_SPIRIT]);
    expect(mind(rush).log.filter(l => l === 'drain:chew').length).toBe(1);
  });

  it('a positive hit in the chewing mouth: it swallows, no drain', () => {
    const r = rig(makePandaDeity(['chew']));
    toTell(r, 'chew');
    r.touch(1);
    for (let j = 0; j < 3; j++) { r.body.onGround = false; r.body.vy = 8; r.frame(); r.body.vy = 0; r.body.onGround = true; r.run(0.2); }
    r.run(2);
    expect(r.drains).toEqual([]);
    expect(mind(r).log).toContain('counter:chew');
  });

  it('a drain attack never starts its telegraph while the gate is shut, and lands only after its longer telegraph', () => {
    const r = rig(makePandaDeity(['chew']));
    r.setCanDrain(false);
    r.run(15);
    expect(mind(r).log.filter(l => l.includes('chew'))).toEqual([]);
    expect(mind(r).tell).toBeNull();
    r.setCanDrain(true);
    toTell(r, 'chew');
    const start = r.now();
    r.until(() => mind(r).core === 'Recovering', 5);
    expect(r.now() - start).toBeGreaterThanOrEqual(TELEGRAPH[0] + 0.2 - 1e-6);
  });

  it('peekaboo drains a player hidden behind a column and spares one in sight', () => {
    const hidden = rig(makePandaDeity(['peekaboo']));
    hidden.touch(HALF_HITS);
    toTell(hidden, 'peekaboo', 30);
    // a wall of placed cells between the panda and the player during the telegraph
    for (let y = O.y; y < O.y + 30; y++) for (let z = O.z - 3; z <= O.z + 3; z++) {
      hidden.world.placing = true; hidden.world.set(O.x + 8, y, z, MAT.stone); hidden.world.placing = false;
    }
    hidden.run(3);
    expect(hidden.drains).toEqual([PEEK_SPIRIT]);
    const seen = rig(makePandaDeity(['peekaboo']));
    seen.touch(HALF_HITS);
    toTell(seen, 'peekaboo', 30);
    seen.run(3);
    expect(seen.drains).toEqual([]);
  });

  it('tumble: the ball drains a player on its line once, and a block in its way stops it', () => {
    const r = rig(makePandaDeity(['tumble']));
    r.touch(HALF_HITS);
    toTell(r, 'tumble', 30);
    r.run(4);
    expect(r.drains).toEqual([TUMBLE_SPIRIT]);
    const b = rig(makePandaDeity(['tumble']));
    b.touch(HALF_HITS);
    toTell(b, 'tumble', 30);
    b.frame();
    const l = mind(b).tell!;
    expect(l.line).not.toBeNull();
    // a placed block on the line, between the ball's start and the player
    const mx = Math.floor((l.line!.x0 + b.body.x) / 2), mz = Math.floor((l.line!.z0 + b.body.z) / 2);
    b.world.placing = true; b.world.set(mx, l.line!.y, mz, MAT.stone); b.world.placing = false;
    b.run(4);
    expect(b.drains).toEqual([]);
    expect(mind(b).log).toContain('stopped:tumble');
  });

  it('cradle captures a player inside the ring for CAPTURE_TIME and takes one practice, at most once in 30 s', () => {
    const r = rig(makePandaDeity(['cradle', 'toss']));
    r.touch(HALF_HITS);
    toTell(r, 'cradle', 30);
    r.run(3);
    expect(r.holds).toEqual([CAPTURE_TIME]);
    expect(r.practices()).toBe(1);
    const at = r.now();
    r.until(() => mind(r).tell?.id === 'cradle' && r.now() > at, 40);
    expect(r.now() - at).toBeGreaterThanOrEqual(CAPTURE_GAP - 3);
    // a player who leaves the ring
    const e = rig(makePandaDeity(['cradle']));
    e.touch(HALF_HITS);
    toTell(e, 'cradle', 30);
    e.run(0.6);
    e.body.x += 2;
    e.run(3);
    expect(e.holds).toEqual([]);
  });

  it('cradle: a player block between the panda and the player stops its float; no capture', () => {
    const r = rig(makePandaDeity(['cradle']));
    r.touch(HALF_HITS);
    toTell(r, 'cradle', 30);
    r.world.placing = true;
    for (let y = O.y; y < O.y + 30; y++) for (let z = O.z - 3; z <= O.z + 3; z++) r.world.set(O.x + 8, y, z, MAT.stone);
    r.world.placing = false;
    r.run(3);
    expect(r.holds).toEqual([]);
    expect(mind(r).log).toContain('blocked:cradle');
  });

  it('cradle never begins while the player is held, nor within a second after', () => {
    const r = rig(makePandaDeity(['cradle']));
    r.touch(HALF_HITS);
    r.setHeld(true);
    r.run(15);
    expect(mind(r).tell).toBeNull();
    r.setHeld(false);
    r.run(0.5);
    expect(mind(r).tell).toBeNull();
  });
});

describe('phases, the rally and the nap (B2, B3b)', () => {
  it('no phase-two attack before half the hits; the one rally at 12, then a 5 s nap with no attack', () => {
    const r = rig();
    const seen = new Set<string>();
    for (let t = 0; t < 60; t += DT) { const m = pandaMind(r.deity); if (m?.tell) seen.add(m.tell.id); r.frame(); }
    for (const k of seen) expect(phaseOf(k)).toBe(1);
    // a third of the hits passes through the machine's own rally
    r.touch(8);
    r.run(0.5);
    expect(mind(r).log).not.toContain('rally');
    r.until(() => ['Idle', 'Watching'].includes(mind(r).core), 10);
    r.touch(4);
    r.until(() => mind(r).core === 'Rallying', 10);
    expect(mind(r).log.filter(l => l === 'rally').length).toBe(1);
    r.until(() => mind(r).core === 'Napping', 3);
    const napStart = r.now();
    r.until(() => mind(r).core !== 'Napping', 10);
    expect(r.now() - napStart).toBeCloseTo(NAP, 1);
    r.touch(4); // two thirds: no second rally, no second nap
    r.run(20);
    expect(mind(r).log.filter(l => l === 'rally' || l === 'nap')).toEqual(['rally', 'nap']);
  });
});

describe('defeat by positive hits (B4)', () => {
  it('24 warm positive hits win it: it settles awake and friendly, becomes an ally and opens the way once', () => {
    const r = rig();
    r.touch(30, 'negative');
    expect(r.deity.hits).toBe(0);
    r.touch(23);
    expect(r.deity.side).toBe('wild');
    r.touch(1);
    r.run(1);
    expect([r.deity.state, r.deity.side, r.deity.alive]).toEqual(['Won', 'ally', true]);
    expect(r.won).toEqual([r.deity.id]);
    expect(r.toasts).toContain('sky.panda.won');
    r.touch(5);
    r.run(10);
    expect(r.won.length).toBe(1);
    expect(mind(r).tell).toBeNull();
  });

  it('a whole fight is deterministic under a fixed dt and never harms', () => {
    const trace = () => {
      const r = rig();
      const out: string[] = [];
      for (let t = 0; t < 90; t += DT) {
        if (Math.round(t / DT) % 90 === 0) r.touch(1);
        r.body.x = SPOT.x + Math.sin(t) * 2;
        r.body.vx = Math.cos(t) * 2;
        r.frame();
        out.push(`${r.deity.state}${pandaMind(r.deity)?.tell?.id ?? ''}`);
      }
      expect([...r.bad]).toEqual([]);
      return { out, drains: r.drains, pushes: r.pushes.length };
    };
    expect(trace()).toEqual(trace());
  });
});

describe('the panda minions (B5)', () => {
  function minionRig(at = PLAN.spawns[1]) {
    const r = rig(pandaDeity, { x: O.x + 15.5, y: O.y, z: O.z + 6.5 });
    const m = r.creatures.spawnMinion(pandaMinion, PLAN, at);
    return { ...r, m };
  }

  it('is the minion of its document: 4 at most, 3 wild, 3 hits to turn, a 1.5 s warning every 12 s', () => {
    expect(MINIONS.panda).toBe(pandaMinion);
    expect([pandaMinion.max, pandaMinion.wildMax, pandaMinion.hitsToTurn, pandaMinion.spawn.warning, pandaMinion.spawn.every])
      .toEqual([4, 3, 3, 1.5, 12]);
  });

  it('moves the same way every time, never onto the well\'s rim and never above the seat\'s height', () => {
    const go = () => {
      const r = minionRig();
      const path: number[][] = [];
      for (let t = 0; t < 60; t += DT) {
        r.frame();
        const b = r.m.body;
        path.push([b.x, b.y, b.z]);
        if (b.y < O.y + 0.5) expect(onRim({ plan: PLAN }, b.x, b.z, 0)).toBe(false);
        expect(b.y).toBeLessThan(PLAN.seat.y);
        expect(r.m.alive).toBe(true);
      }
      expect([...r.bad]).toEqual([]);
      return path;
    };
    const a = go();
    expect(go()).toEqual(a);
    expect(a.some(p => Math.hypot(p[0] - a[0][0], p[2] - a[0][2]) > 2)).toBe(true);
  });

  it('turns into an ally after three positive hits; a negative one only puffs', () => {
    const r = minionRig();
    r.run(2);
    const hit = (pol: 'positive' | 'negative') => r.creatures.touch(r.m.id, pol, true, { x: r.m.body.x, y: r.m.body.y + 0.5, z: r.m.body.z }, 'intent');
    hit('negative');
    expect(r.m.hits).toBe(0);
    hit('positive'); r.run(1);
    hit('positive'); r.run(1);
    expect(r.m.side).toBe('wild');
    hit('positive');
    expect([r.m.side, r.m.state]).toEqual(['ally', ALLY]);
    r.run(20);
    expect(r.m.alive).toBe(true);
  });

  it('an ally that reaches the panda adds a hit every 4 s', () => {
    const r = minionRig();
    const m = r.m as SkyActor;
    r.run(2);
    for (let i = 0; i < 3; i++) r.creatures.touch(m.id, 'positive', true, { x: m.body.x, y: m.body.y, z: m.body.z }, 'intent');
    // carried to the seat (its climb is slow: the test puts it there)
    m.body.x = PLAN.seat.x + 0.5; m.body.y = PLAN.seat.y; m.body.z = PLAN.seat.z + 0.5;
    const before = r.deity.hits;
    r.run(8.2);
    expect(r.deity.hits - before).toBe(2);
    expect(helpedHits).toBeTypeOf('function');
  });

  it('a chewed block comes back: chewing is a transient change of an original cell, never a placed one', () => {
    const r = minionRig();
    r.run(60);
    const kinds = r.world.stats().byKind;
    expect(kinds[ExceptionKind.Placed]).toBe(0);
  });
});

describe('the panda bamboo hindrance', () => {
  it('is registered, never grows in a placed or solid cell, and leaves nothing when it ends', () => {
    expect(HINDRANCES['panda-bamboo'].id).toBe('panda-bamboo');
    const r = rig(makePandaDeity([]));
    const w = r.world;
    const a = w.idx(O.x + 10, O.y, O.z + 10), b = w.idx(O.x + 11, O.y, O.z + 10);
    w.placing = true; w.set(O.x + 11, O.y, O.z + 10, MAT.stone); w.placing = false;
    r.runner.start(HINDRANCES['panda-bamboo'], { cells: [a, b], seconds: 2 }, 0.8, 1);
    r.run(0.5);
    expect(w.getAt(a)).toBe(AIR);
    r.run(0.5);
    expect(w.getAt(a)).toBe(MAT.bamboo);
    expect(w.getAt(b)).toBe(MAT.stone);
    r.run(3);
    expect(w.getAt(a)).toBe(AIR);
    expect(w.getAt(b)).toBe(MAT.stone);
    expect(r.runner.active()).toEqual([]);
  });
});

// CIE Lab ΔE76, the maths of tests/sky-materials.test.ts
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lab(n: number): number[] {
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: number, b: number) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

describe('the panda\'s look and words', () => {
  it('plush tokens keep off harm, gold, the cold and the light\'s whites (docs/art/sky/README.md §2–§6)', () => {
    for (const t of Object.keys(SKY_PANDA_PALETTE) as PalToken[]) {
      expect((PALETTE as Record<string, string>)[t]).toBe((SKY_PANDA_PALETTE as Record<string, string>)[t]);
      for (const red of ['life.heart', 'attack.red.base', 'attack.red.dim', 'attack.warn.base'] as PalToken[]) expect(dE(pal(t), pal(red)), `${t} ${red}`).toBeGreaterThanOrEqual(20);
      expect(dE(pal(t), pal('light.gold')), t).toBeGreaterThanOrEqual(20);
      for (const c of ['cold.body', 'cold.rim', 'cold.dim', 'cold.deep'] as PalToken[]) expect(dE(pal(t), pal(c)), `${t} ${c}`).toBeGreaterThanOrEqual(15);
      for (const w of ['cold.white', 'light.core'] as PalToken[]) expect(dE(pal(t), pal(w)), `${t} ${w}`).toBeGreaterThanOrEqual(8);
    }
  });

  it('the models use palette colours only, and the deity is about 3 blocks tall with a head 2.2 times its body', () => {
    const colours = new Set(Object.values(PALETTE).map(h => parseInt(h.slice(1), 16)));
    const m = pandaDeity.model;
    for (const p of [...m.body, ...m.head, ...pandaMinion.model.parts]) expect(colours.has(p.color)).toBe(true);
    expect(m.h).toBe(3);
    const body = m.body.find(p => p.name === 'body')!, head = m.head.find(p => p.name === 'head')!;
    expect(head.size[0] / body.size[0]).toBeGreaterThanOrEqual(2.1);
    expect(head.size[0] / body.size[0]).toBeLessThanOrEqual(2.3);
    for (const a of PANDA_ATTACKS) expect(String((a as { telegraph: { cue: string } }).telegraph.cue).startsWith('panda.')).toBe(true);
  });

  it('every panda word exists in English and Spanish', () => {
    for (const k of Object.keys(SKY_PANDA_EN)) {
      expect(EN.messages, k).toHaveProperty([k]);
      expect(ES.messages, k).toHaveProperty([k]);
    }
    expect(pandaDeity.won.toast).toBe('sky.panda.won');
  });
});
