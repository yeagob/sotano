// The koala, guardian of sky floor 2, headless on its own floor (docs/design/not-built/sky/guardians/KOALA.md B2–B5,
// B3b; docs/architecture/SKY.md §5.3, §5.4, §6). Asleep, Stirring and Watching; every attack only after the koala's
// telegraph and its hindrance's own; the drains (8, 10, 18) through the spirit gate, and their answers; the capture
// and its 30 s gap; the rest by stage, the Clinging guard and an ally's hug that lifts it; teleport far; defeat by
// 30 positive hits; the minion's sleep, swing, hug, shake-off and turning, an ally's hold; determinism; palette.

import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { PALETTE, type PalToken } from '../src/content/palette';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import type { Body } from '../src/physics/voxel-collide';
import { KOALA_ATTACKS, koalaDeity, CAPTURE_GAP, TELEPORT_GAP } from '../src/sky/creatures/deities/koala';
import { koalaMinion } from '../src/sky/creatures/minions/koala';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { koala } from '../src/sky/floors/koala';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { cellsOfTags } from '../src/sky/hindrances/fading-platforms';
import { ridden } from '../src/sky/hindrances/koala-hug';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { SpiritLaw } from '../src/sky/laws/spirit';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import type { AttackDef, CreatureDeps, DeityDef, Place, SkyActor, SkyHost, TowerKnockApi, Vec3 } from '../src/sky/types';

const DT = 0.05;
const O: Vec3 = { x: 128, y: 71, z: 128 };
const attack = (id: string, over: Partial<AttackDef> = {}): AttackDef => ({ ...KOALA_ATTACKS.find(a => a.id === id)!, ...over });
/** The koala with only these attacks, all from the first stage. */
const only = (...ids: string[]): DeityDef => ({ ...koalaDeity, attacks: ids.map(id => attack(id, { stage: 0 })) });

const open: { runner: HindranceRunner }[] = [];
afterEach(() => { for (const r of open.splice(0)) r.runner.clear(); });

function rig(def: DeityDef | null = koalaDeity, seed = 1) {
  const plan = koala.generate(new Rng(seed), O);
  const world = new SkyWorld(buildIndex(plan.shapes));
  let now = 0, heldT = 0, spirit = 100;
  const body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = { drains: [] as [number, number][], pushes: [] as number[][], slows: [] as number[][], holds: [] as number[], taken: 0, toasts: [] as string[], cues: [] as string[], won: [] as number[] };
  const player = {
    body, eye: { x: 0, y: 0, z: 0 }, aim: { x: 0, y: 0, z: 1 }, hand: [],
    get held() { return heldT > 0; },
    push: (vx: number, vy: number, vz: number) => { log.pushes.push([vx, vy, vz]); },
    slow: (f: number, s: number) => { log.slows.push([f, s]); },
    hold: (s: number) => { log.holds.push(s); heldT = Math.max(heldT, s); },
    carry: () => {},
  };
  const me = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [me], hurt: () => { throw new Error('hurt'); }, affect: () => {}, push: () => {}, live: () => {}, particles: () => {},
  } as unknown as HazardHost;
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const host = {
    time: () => now, player: () => player, actors: () => actors, world: () => world, hazards: () => hazards,
    debris: () => ({ spawn: () => 0 }),
    fork: (...path: (string | number)[]) => new Rng(seed * 97 + path.join('/').length * 13 + Number(path[path.length - 1]) || 1),
    fx: () => {}, cue: (k: string) => { log.cues.push(k); }, toast: (k: string) => { log.toasts.push(k); },
    card: () => {}, bar: () => {}, place: () => {}, gift: () => {}, travel: () => {}, enterUnity: () => {},
    drainSpirit: (n: number) => { log.drains.push([n, now]); spirit -= n; }, spirit: () => spirit, refillSpirit: () => { spirit = 100; },
    takeRandomPractice: () => { log.taken++; return 'x'; }, sendUnderground: () => true,
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  open.push({ runner });
  const law = new SpiritLaw(host);
  const knock = { start() {}, update() {}, busy: false } as TowerKnockApi;
  const deps: CreatureDeps = { actors, runner, effects, puff: new Puff(host), knock, spirit: law };
  const creatures = new SkyCreatures(new THREE.Group(), host, deps);
  creatures.onWon = (_d, floor) => { log.won.push(floor); };
  const deity = def ? creatures.spawnDeity(def, plan) : null;
  const seat = plan.seat;
  const frame = (dt = DT) => {
    law.update();
    creatures.update(dt, 2);
    runner.update(dt);
    hazards.update(dt);
    now += dt;
    heldT = Math.max(0, heldT - dt);
    world.expire(now);
  };
  const run = (s: number) => { for (let t = 0; t < s - 1e-9; t += DT) frame(); };
  const until = (pred: () => boolean, max = 60) => { let t = 0; while (!pred() && t < max) { frame(); t += DT; } return t; };
  const standAt = (x: number, y: number, z: number) => { Object.assign(body, { x, y, z, vx: 0, vy: 0, vz: 0, onGround: true }); };
  const stand = (p: Place) => standAt(p.x + 0.5, p.y, p.z + 0.5);
  /** Within 12 of the koala, not within the teleport's 3: over the central gap, at the Fork's height. */
  const near = () => standAt(seat.x + 6.5, seat.y, seat.z + 0.5);
  const touchDeity = (n = 1) => {
    for (let i = 0; i < n; i++) {
      const b = deity!.body;
      creatures.touch(deity!.id, 'positive', true, { x: b.x, y: b.y + b.h / 2, z: b.z }, 'intent');
    }
  };
  const active = () => runner.active().map(a => `${a.id}:${a.phase}`);
  const thin = plan.graph.places.filter(p => p.kind === 'branch' && plan.platforms.some(t => t.tag === p.tag && !t.fixed));
  return { plan, world, body, player, log, host, effects, runner, creatures, deity: deity as SkyActor, seat, frame, run, until, stand, standAt, near, touchDeity, active, thin, now: () => now };
}

type Rig = ReturnType<typeof rig>;
/** Wakes the koala and runs it to Watching. */
function awake(r: Rig) {
  r.near();
  r.until(() => r.deity.state === 'Watching');
}
/** Runs until the koala's next attack has acted (its own telegraph is over and a hindrance runs). */
function toAct(r: Rig) {
  r.until(() => r.deity.state === 'Attacking');
  r.until(() => r.deity.state !== 'Attacking' && r.deity.state !== 'Hurt');
}

describe('the koala deity: its states (B2)', () => {
  it('sleeps until the player comes within 12, stirs for 1.5 s, then watches', () => {
    const r = rig();
    r.stand(r.thin[0]);
    r.run(4);
    expect(r.deity.state).toBe('Asleep');
    r.near();
    r.frame();
    expect(r.deity.state).toBe('Stirring');
    const t = r.until(() => r.deity.state === 'Watching');
    expect(t).toBeGreaterThanOrEqual(1.4);
    expect(t).toBeLessThanOrEqual(1.6);
  });

  it('a first positive hit wakes it from any distance', () => {
    const r = rig();
    r.stand(r.thin[0]);
    r.frame();
    r.touchDeity();
    r.frame();
    expect(['Stirring', 'Hurt']).toContain(r.deity.state);
  });

  it('rests 3 s in the first stage, then attacks; it dozes 2 s and never clings in the first stage', () => {
    const r = rig(only('leaf-drop'));
    awake(r);
    const rest = r.until(() => r.deity.state === 'Attacking');
    expect(rest).toBeGreaterThanOrEqual(2.9);
    expect(rest).toBeLessThanOrEqual(3.1);
    const seen = new Map<string, number>();
    r.until(() => { seen.set(r.deity.state, (seen.get(r.deity.state) ?? 0) + 1); return r.deity.state === 'Watching'; });
    expect((seen.get('Dozing') ?? 0) * DT).toBeGreaterThanOrEqual(1.9);
    // the first stage passes through Clinging in one frame, with no guard
    expect(seen.get('Clinging') ?? 0).toBeLessThanOrEqual(1);
  });

  it('teleports far when the player reaches it, never within 12, and not again for 20 s', () => {
    const r = rig(only('leaf-drop'));
    awake(r);
    r.standAt(r.deity.body.x + 1, r.deity.body.y, r.deity.body.z);
    r.frame();
    expect(r.deity.state).toBe('Teleporting');
    r.until(() => r.deity.state === 'Watching');
    expect(Math.hypot(r.deity.body.x - r.body.x, r.deity.body.z - r.body.z)).toBeGreaterThanOrEqual(12);
    r.standAt(r.deity.body.x + 1, r.deity.body.y, r.deity.body.z);
    let again = false;
    for (let t = 0; t < TELEPORT_GAP - 2; t += DT) { r.frame(); if (r.deity.state === 'Teleporting') again = true; }
    expect(again).toBe(false);
  });
});

describe('the koala deity: telegraphs and attacks (B3)', () => {
  it('nothing lands before the koala\'s full telegraph, then its hindrance shows its own', () => {
    const r = rig(only('haze'));
    awake(r);
    r.until(() => r.deity.state === 'Attacking');
    r.run(1.1);
    expect(r.runner.active()).toEqual([]);
    r.run(0.15);
    expect(r.active()).toEqual(['koala-haze:telegraph']);
    expect(r.log.drains).toEqual([]);
  });

  it('Let-go turns the thin branch under the player to mist, then air for 4 s; the next branch stays', () => {
    const r = rig(only('let-go'));
    const b = r.thin[1], other = r.thin[2];
    r.stand(b);
    r.touchDeity();
    toAct(r);
    const cells = cellsOfTags(r.world, [b.tag]), others = cellsOfTags(r.world, [other.tag]);
    expect(r.world.getAt(cells[0])).toBe(MAT.mist);
    r.run(0.9);
    expect(r.world.solid(...r.world.coords(cells[0]))).toBe(false);
    expect(others.every(i => r.world.solid(...r.world.coords(i)))).toBe(true);
    r.run(4.5);
    expect(cells.every(i => r.world.solid(...r.world.coords(i)))).toBe(true);
  });

  it('Leaf drop shoves the player off its mark and down; a roof overhead stops it', () => {
    const r = rig(only('leaf-drop'));
    awake(r);
    const [x, y, z] = [Math.floor(r.body.x), Math.floor(r.body.y), Math.floor(r.body.z)];
    r.world.setStory(x, y - 1, z, MAT.cloud);
    toAct(r);
    r.run(1);
    expect(r.log.pushes.some(p => p[1] < 0)).toBe(true);

    const s = rig(only('leaf-drop'));
    awake(s);
    const [a, c, e] = [Math.floor(s.body.x), Math.floor(s.body.y), Math.floor(s.body.z)];
    s.world.setStory(a, c - 1, e, MAT.cloud);
    s.world.setStory(a, c + 3, e, MAT.cloud);
    toAct(s);
    s.run(1);
    expect(s.log.pushes).toEqual([]);
  });

  it('Hug closes a cage of cubes round the player\'s cell after the outlines, gone after 4 s', () => {
    const r = rig(only('hug'));
    r.stand(r.thin[1]);
    r.touchDeity();
    toAct(r);
    r.run(0.9);
    const b = r.body;
    expect(r.world.getAt(r.world.idx(Math.floor(b.x) + 1, Math.floor(b.y), Math.floor(b.z)))).toBe(MAT.cloud);
    r.run(4.2);
    expect(r.world.getAt(r.world.idx(Math.floor(b.x) + 1, Math.floor(b.y), Math.floor(b.z)))).not.toBe(MAT.cloud);
  });

  it('Sleepy sigh pushes the player toward the gap; a positive hit on the koala in its telegraph makes it a yawn', () => {
    const r = rig(only('sigh'));
    r.stand(r.thin[1]);
    r.touchDeity();
    toAct(r);
    r.run(1.5);
    const toward = (p: number[]) => (r.seat.x + 0.5 - r.body.x) * p[0] + (r.seat.z + 0.5 - r.body.z) * p[2] > 0;
    expect(r.log.pushes.length).toBeGreaterThan(0);
    expect(r.log.pushes.every(toward)).toBe(true);

    const s = rig(only('sigh'));
    s.stand(s.thin[1]);
    s.touchDeity();
    s.until(() => s.deity.state === 'Attacking');
    s.frame();
    s.touchDeity();
    s.until(() => s.deity.state !== 'Attacking' && s.deity.state !== 'Hurt');
    s.run(2);
    expect(s.log.pushes).toEqual([]);
    expect(s.log.cues).toContain('koala.yawn');
  });
});

describe('the koala deity: special attacks drain spirit only through the gate (B3b)', () => {
  it('Eucalyptus haze drains 8 once when the player stays in the circle, none when they step out', () => {
    const r = rig(only('haze'));
    awake(r);
    toAct(r);
    r.run(1);
    expect(r.log.drains.map(d => d[0])).toEqual([8]);

    const s = rig(only('haze'));
    awake(s);
    toAct(s);
    s.standAt(s.body.x + 3, s.body.y, s.body.z);
    s.run(1);
    expect(s.log.drains).toEqual([]);
  });

  it('a positive shot into the haze\'s circle during its warning scatters it: no drain', () => {
    const r = rig(only('haze'));
    awake(r);
    toAct(r);
    const b = r.body;
    expect(r.runner.positiveHit({ x: b.x + 1, y: b.y + 0.5, z: b.z, cell: -1, actor: -1, weapon: 'intent', warm: true })).toBe(true);
    r.run(1);
    expect(r.log.drains).toEqual([]);
  });

  it('Bellow drains 10 when its ring touches the player; a block between, or a jump over it, lets it pass', () => {
    const r = rig(only('bellow'));
    awake(r);
    toAct(r);
    r.run(1.5);
    expect(r.log.drains.map(d => d[0])).toEqual([10]);

    const s = rig(only('bellow'));
    awake(s);
    s.world.setStory(Math.floor(s.body.x) - 1, Math.floor(s.body.y), Math.floor(s.body.z), MAT.cloud);
    toAct(s);
    s.run(1.5);
    expect(s.log.drains).toEqual([]);

    const j = rig(only('bellow'));
    awake(j);
    toAct(j);
    j.body.y += 1.5;
    j.run(1.5);
    expect(j.log.drains).toEqual([]);
  });

  it('a positive hit into its chest during the telegraph turns the bellow into a grunt', () => {
    const r = rig(only('bellow'));
    awake(r);
    r.until(() => r.deity.state === 'Attacking');
    r.frame();
    r.touchDeity();
    r.until(() => r.deity.state !== 'Attacking' && r.deity.state !== 'Hurt');
    r.run(2);
    expect(r.active().some(a => a.startsWith('koala-bellow'))).toBe(false);
    expect(r.log.drains).toEqual([]);
  });

  it('Lullaby drains 18 from a player still on the branch\'s wood; stepping off, or a shot on the glow, saves it', () => {
    const r = rig(only('lullaby'));
    r.stand(r.thin[1]);
    r.touchDeity();
    toAct(r);
    r.run(1);
    expect(r.log.drains.map(d => d[0])).toEqual([18]);

    const s = rig(only('lullaby'));
    s.stand(s.thin[1]);
    s.touchDeity();
    toAct(s);
    s.standAt(s.body.x, s.body.y + 3, s.body.z);
    s.run(1);
    expect(s.log.drains).toEqual([]);

    const h = rig(only('lullaby'));
    h.stand(h.thin[1]);
    h.touchDeity();
    toAct(h);
    const b = h.body, cell = h.world.idx(Math.floor(b.x), Math.floor(b.y) - 1, Math.floor(b.z));
    expect(h.runner.positiveHit({ x: b.x, y: b.y - 0.5, z: b.z, cell, actor: -1, weapon: 'intent', warm: true })).toBe(true);
    h.run(1);
    expect(h.log.drains).toEqual([]);
  });

  it('no drain attack starts its telegraph while the gate is closed (the player held)', () => {
    const r = rig(only('haze'));
    awake(r);
    r.player.hold(20);
    r.run(15);
    expect(r.runner.active()).toEqual([]);
    expect(r.log.drains).toEqual([]);
  });

  it('two drains are at least 6 s apart, and every drain is a B3b amount', () => {
    const r = rig(only('haze'));
    awake(r);
    r.run(40);
    expect(r.log.drains.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < r.log.drains.length; i++) expect(r.log.drains[i][1] - r.log.drains[i - 1][1]).toBeGreaterThanOrEqual(6 - 1e-9);
    expect(r.log.drains.every(d => d[0] === 8)).toBe(true);
  });

  it('Hold fast captures a player in the closed ring: held 3 s, one practice taken; not again within 30 s', () => {
    const r = rig(only('hold-fast'));
    awake(r);
    toAct(r);
    r.run(1);
    expect(r.log.holds).toEqual([3]);
    expect(r.log.taken).toBe(1);
    expect(r.log.toasts).toContain('toast.skyKoalaHoldFast');
    r.run(CAPTURE_GAP - 4);
    expect(r.log.taken).toBe(1);
    r.run(15);
    expect(r.log.taken).toBe(2);
  });

  it('a positive hit on the koala while it floats in, or a step out of the ring, saves the player', () => {
    const r = rig(only('hold-fast'));
    awake(r);
    toAct(r);
    r.touchDeity();
    r.run(1);
    expect(r.log.taken).toBe(0);

    const s = rig(only('hold-fast'));
    awake(s);
    toAct(s);
    s.standAt(s.body.x + 2.5, s.body.y, s.body.z);
    s.run(1);
    expect(s.log.taken).toBe(0);
  });

  it('Joey ride halves the player\'s jumps for 4 s, and three jumps shake it off', () => {
    const r = rig(only('joey'));
    awake(r);
    toAct(r);
    r.run(0.9);
    expect(ridden()).toBe(true);
    for (let k = 0; k < 3; k++) {
      r.body.onGround = true; r.body.vy = 0; r.frame();
      r.body.onGround = false; r.body.vy = 8; r.frame();
    }
    expect(ridden()).toBe(false);
    expect(r.log.pushes.filter(p => p[1] < 0).length).toBe(3);
  });

  it('nothing the koala does takes health, and only the gate drains', () => {
    const r = rig();
    awake(r);
    r.touchDeity(21);
    r.run(60);
    for (const [n] of r.log.drains) expect([8, 10, 18]).toContain(n);
  });
});

describe('the koala deity: the guard and defeat (B2, B4)', () => {
  it('from the second stage it clings after each attack: positive hits puff; an ally hugging it lifts the guard', () => {
    const r = rig(only('leaf-drop'));
    awake(r);
    r.touchDeity(10);
    r.until(() => r.deity.state === 'Clinging');
    const before = r.deity.hits;
    r.touchDeity();
    expect(r.deity.hits).toBe(before);
    const ally = r.creatures.spawnMinion(koalaMinion, r.plan, r.seat);
    r.run(1.6);
    for (let i = 0; i < 3; i++) r.creatures.touch(ally.id, 'positive', true, { x: ally.body.x, y: ally.body.y + 0.5, z: ally.body.z }, 'intent');
    expect(ally.side).toBe('ally');
    r.until(() => r.deity.state === 'Clinging');
    Object.assign(ally.body, { x: r.deity.body.x, y: r.deity.body.y, z: r.deity.body.z });
    const h = r.deity.hits;
    r.touchDeity();
    expect(r.deity.hits).toBe(h + 1);
  });

  it('30 positive hits win it: it lets go, turns ally, fires onWon once for floor 2, and attacks no more', () => {
    const r = rig();
    awake(r);
    r.touchDeity(35);
    expect(r.deity.hits).toBe(30);
    expect(r.deity.side).toBe('ally');
    r.frame();
    expect(r.deity.state).toBe('Won');
    expect(r.log.won).toEqual([2]);
    expect(r.log.toasts).toContain('toast.skyKoalaWon');
    expect(r.log.cues).toContain('koala.letgo');
    r.runner.clear();
    r.run(20);
    expect(r.runner.active()).toEqual([]);
    expect(r.deity.alive).toBe(true);
  });

  it('a negative touch only puffs', () => {
    const r = rig();
    awake(r);
    r.creatures.touch(r.deity.id, 'negative', true, { x: r.deity.body.x, y: r.deity.body.y + 1, z: r.deity.body.z }, 'intent');
    expect(r.deity.hits).toBe(0);
  });

  it('runs the same under a fixed dt and the same seed', () => {
    const trace = () => {
      const r = rig(koalaDeity, 7);
      const out: string[] = [];
      awake(r);
      for (let i = 0; i < 1200; i++) {
        if (i === 100) r.touchDeity(11);
        if (i === 500) r.touchDeity(10);
        r.standAt(r.seat.x + 6.5 + Math.sin(i / 40), r.seat.y, r.seat.z + 0.5);
        r.frame();
        out.push(`${r.deity.state}|${r.active().join(',')}|${r.log.drains.length}|${r.deity.body.x.toFixed(3)}`);
      }
      r.runner.clear();
      return out.join('\n');
    };
    expect(trace()).toBe(trace());
  });
});

describe('the koala minions (B5)', () => {
  it('sleeps in its cluster until the player comes within 4, then wakes with a stretch', () => {
    const r = rig(null);
    const at = r.plan.spawns[0];
    const m = r.creatures.spawnMinion(koalaMinion, r.plan, at);
    r.standAt(at.x + 10, at.y, at.z);
    r.run(3);
    expect(m.state).toBe('Asleep');
    r.standAt(at.x + 3.5, at.y, at.z + 0.5);
    r.frame();
    expect(m.state).toBe('Wild');
    expect(r.log.cues).toContain('koala.stretch');
  });

  it('swings, then drops on the player under it and hugs: 40% walk, half jumps, three jumps shake it off', () => {
    const r = rig(null);
    const at = r.plan.spawns[0];
    const m = r.creatures.spawnMinion(koalaMinion, r.plan, at);
    r.run(2);
    r.standAt(at.x + 0.5, at.y, at.z + 0.5);
    r.run(1.2);
    expect(m.state).toBe('Wild');
    expect(r.active()).toContain('koala-hug:telegraph');
    r.run(1.3);
    expect(ridden()).toBe(true);
    expect(r.log.slows.some(([f]) => f === 0.4)).toBe(true);
    expect(r.log.toasts).toContain('toast.skyKoalaHug');
    for (let k = 0; k < 3; k++) {
      r.body.onGround = true; r.body.vy = 0; r.frame();
      r.body.onGround = false; r.body.vy = 8; r.frame();
    }
    expect(ridden()).toBe(false);
  });

  it('a positive intention at a hugging koala lets go; three turn it to an ally; a negative one puffs', () => {
    const r = rig(null);
    const at = r.plan.spawns[0];
    const m = r.creatures.spawnMinion(koalaMinion, r.plan, at);
    r.run(2);
    r.standAt(at.x + 0.5, at.y, at.z + 0.5);
    r.run(2.5);
    expect(ridden()).toBe(true);
    const p = { x: m.body.x, y: m.body.y + 0.5, z: m.body.z };
    r.creatures.touch(m.id, 'negative', true, p, 'intent');
    expect(m.hits).toBe(0);
    r.creatures.touch(m.id, 'positive', true, p, 'intent');
    r.frame();
    expect(ridden()).toBe(false);
    r.creatures.touch(m.id, 'positive', true, p, 'intent');
    r.creatures.touch(m.id, 'positive', true, p, 'intent');
    expect(m.side).toBe('ally');
  });

  it('an ally holds the thin branch ahead of the player: it does not fade', () => {
    const r = rig(null);
    const [a, b] = [r.thin[1], r.thin[2]];
    r.stand(a);
    const m = r.creatures.spawnMinion(koalaMinion, r.plan, b);
    r.run(2);
    for (let i = 0; i < 3; i++) r.creatures.touch(m.id, 'positive', true, { x: m.body.x, y: m.body.y + 0.5, z: m.body.z }, 'intent');
    expect(m.side).toBe('ally');
    r.run(1);
    const near = r.thin.filter(p => p.tag !== a.tag).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) - Math.hypot(q.x - a.x, q.y - a.y, q.z - a.z))[0];
    expect(near.tag).toBe(b.tag);
    const cells = cellsOfTags(r.world, [b.tag]);
    expect(cells.every(i => r.effects.isProtected(i))).toBe(true);
    r.runner.start(HINDRANCES['fading-platforms'], { tags: [b.tag], seconds: 2 }, 1, 1);
    r.run(1.5);
    expect(cells.every(i => r.world.solid(...r.world.coords(i)))).toBe(true);
  });

  it('goes back to sleep where it is after 10 s with the player never within 6', () => {
    const r = rig(null);
    const at = r.plan.spawns[0];
    const m = r.creatures.spawnMinion(koalaMinion, r.plan, at);
    r.run(2);
    r.standAt(at.x + 3.5, at.y, at.z + 0.5);
    r.frame();
    expect(m.state).toBe('Wild');
    r.standAt(at.x + 30, at.y + 20, at.z);
    r.run(12);
    expect(m.state).toBe('Asleep');
  });
});

describe('the koala\'s palette (docs/art/sky/README.md §2)', () => {
  const lab = (hex: string) => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    const X = (0.4124 * c[0] + 0.3576 * c[1] + 0.1805 * c[2]) / 0.95047, Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], Z = (0.0193 * c[0] + 0.1192 * c[1] + 0.9505 * c[2]) / 1.08883;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  };
  const dE = (a: string, b: string) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const koalaTokens = Object.keys(PALETTE).filter(k => k.startsWith('plush.koala.')) as PalToken[];

  it('is plush: never gold, warning yellow or red (ΔE ≥ 20), never the cold (≥ 15)', () => {
    expect(koalaTokens.length).toBeGreaterThan(0);
    for (const t of koalaTokens) {
      for (const r of ['light.gold', 'attack.warn.base', 'life.heart', 'attack.red.base'] as PalToken[]) expect(dE(PALETTE[t], PALETTE[r]), `${t} vs ${r}`).toBeGreaterThanOrEqual(20);
      for (const c of ['cold.body', 'cold.rim'] as PalToken[]) expect(dE(PALETTE[t], PALETTE[c]), `${t} vs ${c}`).toBeGreaterThanOrEqual(15);
    }
  });

  it('the deity\'s head is about 2.2 times its body\'s width, and the model has its named parts', () => {
    const head = koalaDeity.model.head.find(p => p.name === 'head')!, body = koalaDeity.model.body.find(p => p.name === 'body')!;
    expect(head.size[0] / body.size[0]).toBeGreaterThan(2);
    expect(head.size[0] / body.size[0]).toBeLessThan(2.4);
    for (const n of ['armL', 'armR', 'lidL', 'lidR', 'nose', 'earL', 'earR']) expect([...koalaDeity.model.body, ...koalaDeity.model.head].some(p => p.name === n), n).toBe(true);
    const mh = koalaMinion.model.parts.find(p => p.name === 'head')!, mb = koalaMinion.model.parts.find(p => p.name === 'body')!;
    expect(mh.size[0] / mb.size[0]).toBeGreaterThan(2);
  });
});
