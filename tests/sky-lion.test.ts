// The lion, guardian of sky floor 4, and its pride, headless on the real floor plan (docs/design/not-built/sky/
// guardians/LION.md B2–B5; docs/architecture/SKY.md §5.3–§5.5). Basking and the pacing in the air; every attack
// telegraphs for the floor's full length before its hindrance starts, and the hindrance shows its own warning;
// facing the roar halves it and a positive hit in a telegraph softens the attack; the rest between attacks by
// stage; the drain attacks only start where the spirit gate allows and drain once; the Stare-down drains only
// after five seconds of looking away; the pounce and the scruff hold glide to the player and a wall stops them;
// nothing takes health; 42 positive hits win the lion and the pride lies down; the pride stalks, pounces from
// above, never on a frozen player, and turns ally at four hits. Deterministic under a fixed dt.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { pal, type PalToken } from '../src/content/palette';
import { SKY_LION_PALETTE } from '../src/content/palette/sky-lion';
import { MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { SKY_LION_EN } from '../src/i18n/locales/sky/lion.en';
import { SKY_LION_ES } from '../src/i18n/locales/sky/lion.es';
import { CALM } from '../src/sky/creatures/minion';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import {
  BASK, FACE_HOLD, GLIDE, HOVER, LANDED, LION_BODY, LION_HEAD, NOON, PACE, ROAR, STARE, crosswind, duskCall, lionDeity,
  lionReadout, longGrass, maneFlare, noonSun, pounce, roar, scrape, scruffHold,
} from '../src/sky/creatures/deities/lion';
import { LION_MINION_PARTS, POUNCE_COOLDOWN, lionMinion } from '../src/sky/creatures/minions/lion';
import { lion } from '../src/sky/floors/lion';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import {
  CAPTURE_TIME, MIN_TELEGRAPH, type AttackDef, type CreatureDeps, type DeityDef, type Place, type SkyActor, type SkyHost,
  type TowerKnockApi, type Vec3,
} from '../src/sky/types';
import type { Body } from '../src/physics/voxel-collide';

const DT = 1 / 30;
const O = { x: 100, y: 10, z: 100 };
const PLAN = lion.generate(new Rng(1), O);
const SEAT = PLAN.seat;
/** The nerve line's ledge below and in front of the Sunning Ledge (9 down, about 7 across). */
const LEDGE = PLAN.graph.places[11];

interface Rig {
  world: SkyWorld; body: Body; player: { eye: Vec3; aim: Vec3; held: boolean; hold(s: number): void };
  creatures: SkyCreatures; runner: HindranceRunner; actor: SkyActor;
  log: { pushes: number[][]; holds: number[]; slows: number[][]; drains: number[]; toasts: string[]; cues: string[]; taken: number; bad: Set<string> };
  gate: { open: boolean };
  step(n?: number): void; until(pred: () => boolean, max?: number): number; seconds(s: number): void;
  touch(n: number): void;
}

/** The lion's floor with the plain under it, a player standing at `at`, real hindrances and a spirit gate that logs. */
function rig(def: DeityDef = lionDeity, at: Vec3 = { x: LEDGE.x + 0.5, y: LEDGE.y, z: LEDGE.z + 0.5 }): Rig {
  const world = new SkyWorld(buildIndex([
    { k: 'box', x0: O.x - 30, y0: O.y - 2, z0: O.z - 30, x1: O.x + 30, y1: O.y - 1, z1: O.z + 30, m: MAT.stone },
    ...PLAN.shapes,
  ]));
  let now = 0;
  let heldT = 0;
  const body: Body = { x: at.x, y: at.y, z: at.z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = { pushes: [] as number[][], holds: [] as number[], slows: [] as number[][], drains: [] as number[], toasts: [] as string[], cues: [] as string[], taken: 0, bad: new Set<string>() };
  const player = {
    body, eye: { x: at.x, y: at.y + 1.6, z: at.z }, aim: { x: 0, y: 0, z: -1 }, hand: [],
    get held() { return heldT > 0; },
    push: (vx: number, vy: number, vz: number) => { log.pushes.push([vx, vy, vz]); },
    slow: (f: number, s: number) => { log.slows.push([f, s]); },
    hold: (s: number) => { log.holds.push(s); if (s > 0) heldT = Math.max(heldT, s); },
    carry: () => {},
  };
  const me = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [me],
    hurt: (() => log.bad.add('hurt')) as unknown as HazardHost['hurt'],
    affect: (() => log.bad.add('affect')) as unknown as HazardHost['affect'],
    push: (() => log.bad.add('hazard.push')) as unknown as HazardHost['push'],
    live: () => {}, particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const host = {
    time: () => now, player: () => player, actors: () => actors, world: () => world, hazards: () => hazards,
    debris: () => ({ spawn: () => 0 }), fork: (...p: (string | number)[]) => new Rng(p.length + 3),
    fx: () => {}, cue: (k: string) => { log.cues.push(k); }, toast: (k: string) => { log.toasts.push(k); },
    card: () => {}, bar: () => {}, place: () => {}, gift: () => {}, enterUnity: () => {},
    travel: () => log.bad.add('travel'), drainSpirit: () => log.bad.add('drainSpirit'), spirit: () => 100, refillSpirit: () => {},
    takeRandomPractice: () => { log.taken++; return 'a-practice'; }, sendUnderground: () => { log.bad.add('sendUnderground'); return true; },
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  const gate = { open: true };
  const deps: CreatureDeps = {
    actors, runner, effects, puff: new Puff(host), knock: {} as TowerKnockApi,
    spirit: { update() {}, canDrain: () => gate.open, drain: n => { if (!gate.open) return false; log.drains.push(n); return true; } },
  };
  const creatures = new SkyCreatures(new THREE.Group(), host, deps);
  const actor = creatures.spawnDeity(def, PLAN);
  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      creatures.update(DT, 4);
      runner.update(DT);
      hazards.update(DT);
      now += DT;
      world.expire(now);
      heldT = Math.max(0, heldT - DT);
    }
  };
  const until = (pred: () => boolean, max = 3000) => { let n = 0; while (!pred() && n < max) { step(); n++; } return n; };
  const seconds = (s: number) => step(Math.round(s / DT));
  const touch = (n: number) => {
    for (let i = 0; i < n; i++) {
      const b = actor.body;
      creatures.touch(actor.id, 'positive', true, { x: b.x, y: b.y + 1.5, z: b.z }, 'intent');
    }
  };
  return { world, body, player, creatures, runner, actor, log, gate, step, until, seconds, touch };
}

/** The lion with only these attacks, all from the first stage (their own acts and telegraphs). */
const only = (...a: AttackDef[]): DeityDef => ({ ...lionDeity, attacks: a.map(x => ({ ...x, stage: 0 })) });
const head = (r: Rig): Vec3 => ({ x: r.actor.body.x, y: r.actor.body.y + r.actor.body.h * 0.62, z: r.actor.body.z });
/** Points the player's aim at the lion's head, or straight away from it. */
function aim(r: Rig, at: boolean) {
  const h = head(r), e = r.player.eye;
  const d = { x: h.x - e.x, y: h.y - e.y, z: h.z - e.z }, l = Math.hypot(d.x, d.y, d.z);
  const k = at ? 1 : -1;
  r.player.aim = { x: (k * d.x) / l, y: (k * d.y) / l, z: (k * d.z) / l };
}
const active = (r: Rig, id: string) => r.runner.active().filter(a => a.id === id);
const onSeat = (): Vec3 => ({ x: SEAT.x + 2.5, y: SEAT.y, z: SEAT.z + 2.5 });

// ───────────────────────── the model and its colours ─────────────────────────

const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lab(n: number): number[] {
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: number, b: number) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

describe('the lion and its pride are plush (docs/art/sky/README.md §2, §3, §4)', () => {
  const tokens = Object.keys(SKY_LION_PALETTE) as PalToken[];

  it('every lion token is ≥ 20 from the reds, the gold and the warning yellow, and ≥ 15 from the cold', () => {
    for (const t of tokens) {
      for (const ref of ['life.heart', 'attack.red.base', 'attack.red.dim', 'light.gold', 'attack.warn.base'] as PalToken[]) {
        expect(dE(pal(t), pal(ref)), `${t} vs ${ref}`).toBeGreaterThanOrEqual(20);
      }
      for (const ref of ['cold.body', 'cold.rim', 'cold.dim', 'cold.deep'] as PalToken[]) expect(dE(pal(t), pal(ref)), `${t} vs ${ref}`).toBeGreaterThanOrEqual(15);
    }
  });

  it('every part wears a plush.lion token, in whole texels; the head is about 2.2 times the body; the lion is 3 tall, a minion 1', () => {
    const colours = new Set(tokens.map(t => pal(t)));
    for (const p of [...LION_BODY, ...LION_HEAD, ...LION_MINION_PARTS]) {
      expect(colours.has(p.color), p.name).toBe(true);
      for (const s of p.size) expect(Math.abs(s * 16 - Math.round(s * 16)), p.name).toBeLessThan(1e-9);
    }
    const width = (name: string, parts = [...LION_BODY, ...LION_HEAD]) => parts.find(p => p.name === name)!.size[0];
    expect(width('mane') / width('body')).toBeGreaterThanOrEqual(2.1);
    expect(width('mane') / width('body')).toBeLessThanOrEqual(2.4);
    expect(lionDeity.model.h).toBe(3);
    expect(lionMinion.model.h).toBe(1);
    expect(lionDeity.model.hw).toBeGreaterThan(0);
  });

  it('the words of the lion exist in English and Spanish', () => {
    for (const k of Object.keys(SKY_LION_EN)) expect((SKY_LION_ES as Record<string, string>)[k], k).toBeTruthy();
    expect(Object.keys(SKY_LION_ES).sort()).toEqual(Object.keys(SKY_LION_EN).sort());
  });
});

// ───────────────────────── the machine ─────────────────────────

describe('the lion levitates, basks and paces (B2)', () => {
  it('basks at least 4 s with the player in sight, then watches and paces 3 blocks each way in the air', () => {
    const r = rig(only(), onSeat());
    expect(r.actor.state).toBe('Basking');
    r.seconds(BASK - 0.2);
    expect(r.actor.state).toBe('Basking');
    r.seconds(0.4);
    expect(r.actor.state).toBe('Watching');
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < 400; i++) { r.step(); xs.push(r.actor.body.x); ys.push(r.actor.body.y); }
    const mid = SEAT.x + 0.5;
    expect(Math.max(...xs) - mid).toBeGreaterThan(PACE - 0.3);
    expect(mid - Math.min(...xs)).toBeGreaterThan(PACE - 0.3);
    expect(Math.max(...xs) - mid).toBeLessThanOrEqual(PACE + 1e-6);
    for (const y of ys) expect(Math.abs(y - (SEAT.y + HOVER))).toBeLessThanOrEqual(0.16);
  });

  it('a far player leaves it basking', () => {
    const r = rig(only(roar), { x: O.x - 20, y: O.y, z: O.z + 12 });
    r.seconds(20);
    expect(r.actor.state).toBe('Basking');
    expect(r.runner.active()).toEqual([]);
  });
});

describe('telegraphs (law 3.6, B3)', () => {
  it('each attack shows its pose for the floor’s 1.0 s before anything starts, and its hindrance warns again', () => {
    for (const [a, id] of [[roar, 'paralysis'], [crosswind, 'wind'], [maneFlare, 'knockback'], [longGrass, 'dense-ground'], [duskCall, 'lion-ring']] as const) {
      const r = rig(only(a));
      r.until(() => r.actor.state === 'Attacking');
      const n = r.until(() => r.runner.active().length > 0, 200);
      expect(n * DT, a.id).toBeGreaterThanOrEqual(lionDeity.telegraph - DT - 1e-9);
      const runs = active(r, id);
      expect(runs.length, a.id).toBeGreaterThan(0);
      for (const run of runs) {
        expect(run.phase, a.id).toBe('telegraph');
        expect(run.left, a.id).toBeGreaterThan(MIN_TELEGRAPH - 2 * DT);
      }
      expect(r.log.cues, a.id).toContain(a.telegraph.cue);
    }
  });

  it('the roar spreads 12 at the player’s level; facing the lion through its telegraph halves it', () => {
    const plain = rig(only(roar));
    plain.until(() => active(plain, 'paralysis').length > 0);
    const faced = rig(only(roar));
    faced.until(() => faced.actor.state === 'Attacking');
    for (let i = 0; i < 25; i++) { aim(faced, true); faced.step(); }
    faced.until(() => active(faced, 'paralysis').length > 0);
    expect(lionReadout(faced.actor)!.faced).toBeGreaterThanOrEqual(FACE_HOLD);
    // the ring reaches the player 7 blocks away unfaced (frozen), and stops short at 6 when faced
    plain.player.aim = { x: 0, y: 0, z: 1 };
    faced.player.aim = { x: 0, y: 0, z: 1 };
    plain.seconds(2.5);
    faced.seconds(2.5);
    expect(plain.log.holds).toContain(ROAR.hold);
    expect(faced.log.holds).not.toContain(ROAR.hold);
  });

  it('a positive hit on the lion during a telegraph softens it: the roar goes out in a huff', () => {
    const r = rig(only(roar));
    r.until(() => r.actor.state === 'Attacking');
    r.step(3);
    r.touch(1);
    r.until(() => r.actor.state === 'Recovering');
    r.seconds(2);
    expect(active(r, 'paralysis')).toEqual([]);
    expect(r.log.holds).toEqual([]);
    expect(r.log.cues).toContain('lion.huff');
    expect(r.actor.hits).toBe(1);
  });
});

describe('the rest between attacks (B2 cycle)', () => {
  it('telegraph 1 s, recovery 2 s, rest 3 s in the first stage: at least 6 s between two attacks, never the same twice', () => {
    const r = rig(only(roar, crosswind));
    const starts: number[] = [];
    let was = r.actor.state, t = 0;
    for (let i = 0; i < 1200; i++) {
      r.step();
      t += DT;
      if (r.actor.state === 'Attacking' && was !== 'Attacking') starts.push(t);
      was = r.actor.state;
    }
    expect(starts.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(6 - 2 * DT);
    expect(lionDeity.rest).toEqual([3, 2.5, 2]);
  });
});

describe('nothing takes health (owner decision 8)', () => {
  it('a long fight with every attack only pushes, slows, holds or drains through the gate', () => {
    const r = rig(lionDeity, onSeat());
    r.touch(30);
    for (let i = 0; i < 3000; i++) r.step();
    expect([...r.log.bad]).toEqual([]);
    expect(r.actor.alive).toBe(true);
    for (const d of r.log.drains) expect([STARE.spirit, duskCall.spirit, noonSun.spirit]).toContain(d);
  });
});

// ───────────────────────── the drains and the capture (B3b) ─────────────────────────

describe('the spirit gate (guardians §6.6)', () => {
  it('a drain attack never starts its telegraph while the gate is closed', () => {
    const r = rig(only(duskCall), onSeat());
    r.gate.open = false;
    aim(r, true);
    for (let i = 0; i < 900; i++) { aim(r, true); r.step(); }
    expect(r.actor.state).not.toBe('Attacking');
    expect(active(r, 'lion-ring')).toEqual([]);
    expect(r.log.drains).toEqual([]);
  });

  it('the Dusk call drains 14 once, however many rings touch', () => {
    const r = rig(only(duskCall), onSeat());
    for (let i = 0; i < 420; i++) { aim(r, true); r.step(); }
    expect(r.log.drains).toEqual([duskCall.spirit]);
  });

  it('Noon sun drains 16 in the sun, and nothing under one block overhead', () => {
    const sun = rig(only(noonSun));
    sun.until(() => sun.actor.state === 'Recovering', 600);
    expect(sun.log.drains).toEqual([NOON.spirit]);
    const shade = rig(only(noonSun));
    shade.world.placing = true;
    shade.world.set(Math.floor(shade.body.x), LEDGE.y + 2, Math.floor(shade.body.z), MAT.dirt);
    shade.world.placing = false;
    shade.until(() => shade.actor.state === 'Recovering', 600);
    expect(shade.log.drains).toEqual([]);
  });

  it('the Scruff hold glides beside the player, captures them for CAPTURE_TIME and keeps one practice', () => {
    const r = rig(only(scruffHold));
    r.until(() => r.actor.state === 'Scruffing');
    r.seconds(GLIDE + 0.2);
    const b = r.actor.body;
    expect(Math.hypot(b.x - r.body.x, b.z - r.body.z)).toBeLessThan(1.5);
    expect(r.log.holds).toContain(CAPTURE_TIME);
    expect(r.log.taken).toBe(1);
    expect(r.log.toasts).toContain('toast.skyLionScruff');
    r.seconds(LANDED + 2.5);
    expect(Math.hypot(r.actor.body.x - (SEAT.x + 0.5), r.actor.body.z - (SEAT.z + 0.5))).toBeLessThan(PACE + 2);
  });

  it('a positive hit on the crouch makes it sit: no capture', () => {
    const r = rig(only(scruffHold));
    r.until(() => r.actor.state === 'Attacking');
    r.step(2);
    r.touch(1);
    r.seconds(6);
    expect(r.log.taken).toBe(0);
    expect(r.log.holds).toEqual([]);
  });
});

describe('the Stare-down (B3b 6, owner 2026-11-05)', () => {
  it('looking away for 5 s drains 12; a glance shorter than that costs nothing and falls back in about 1 s', () => {
    const r = rig(only(), onSeat());
    r.until(() => r.actor.state === 'Watching');
    for (let i = 0; i < Math.round(3 / DT); i++) { aim(r, false); r.step(); }
    expect(lionReadout(r.actor)!.stare).toBeGreaterThan(2.5);
    for (let i = 0; i < Math.round(1.1 / DT); i++) { aim(r, true); r.step(); }
    expect(lionReadout(r.actor)!.stare).toBe(0);
    expect(r.log.drains).toEqual([]);
    const flare = r.log.cues.filter(c => c === 'lion.flare').length;
    for (let i = 0; i < Math.round(5.2 / DT); i++) { aim(r, false); r.step(); }
    expect(r.log.drains).toEqual([STARE.spirit]);
    expect(r.log.cues.filter(c => c === 'lion.flare').length).toBe(flare + 1);
    expect(r.log.cues).toContain('lion.purr');
  });

  it('never builds while the player looks at the lion, nor while they are held', () => {
    const r = rig(only(), onSeat());
    r.until(() => r.actor.state === 'Watching');
    for (let i = 0; i < 600; i++) { aim(r, true); r.step(); }
    expect(r.log.drains).toEqual([]);
    for (let i = 0; i < 300; i++) { r.player.hold(1); aim(r, false); r.step(); }
    expect(r.log.drains).toEqual([]);
    expect(lionReadout(r.actor)!.stare).toBe(0);
  });

  it('a positive hit while it builds makes it blink and look away: the stare is gone at once', () => {
    const r = rig(only(), onSeat());
    r.until(() => r.actor.state === 'Watching');
    for (let i = 0; i < 100; i++) { aim(r, false); r.step(); }
    r.touch(1);
    expect(lionReadout(r.actor)!.stare).toBe(0);
  });
});

// ───────────────────────── the pounce, scrape and the wall ─────────────────────────

describe('the pounce (B3 3)', () => {
  it('glides beside the player, lands with the pushing ring, recovers there 2.5 s and glides home', () => {
    const r = rig(only(pounce));
    r.until(() => r.actor.state === 'Pouncing');
    expect(active(r, 'lion-ring')).toHaveLength(1);
    r.seconds(GLIDE + 0.1);
    const b = r.actor.body;
    expect(Math.hypot(b.x - r.body.x, b.z - r.body.z)).toBeLessThan(2);
    r.seconds(0.4);
    expect(r.log.pushes.length).toBeGreaterThan(0);
    r.seconds(LANDED + 1.2);
    expect(r.actor.state).toBe('Recovering');
    expect(Math.hypot(r.actor.body.x - r.body.x, r.actor.body.z - r.body.z)).toBeLessThan(2);
    r.until(() => r.actor.state === 'Watching');
    r.seconds(2.6);
    expect(Math.abs(r.actor.body.y - (SEAT.y + HOVER))).toBeLessThan(0.2);
  });

  it('a wall of player blocks in its line stops it at the wall: no ring, and it recovers against the wall', () => {
    const r = rig(only(pounce));
    r.world.placing = true;
    const z = Math.floor((SEAT.z + LEDGE.z) / 2) - 1;
    for (let x = LEDGE.x - 3; x <= LEDGE.x + 3; x++) for (let y = LEDGE.y; y <= SEAT.y + 4; y++) r.world.set(x, y, z, MAT.dirt);
    r.world.placing = false;
    r.until(() => r.actor.state === 'Pouncing');
    r.seconds(GLIDE + 0.2);
    expect(active(r, 'lion-ring')).toEqual([]);
    expect(r.log.pushes).toEqual([]);
    expect(r.actor.body.z).toBeGreaterThan(z + 0.5);
  });

  it('Scrape fades the strip of a wide ledge on the lion’s side and keeps the far side; a 3 by 3 ledge is never scraped', () => {
    const r = rig(only(scrape), onSeat());
    r.until(() => active(r, 'fading-platforms').length > 0, 900);
    expect(active(r, 'fading-platforms')).toHaveLength(1);
    const small = rig(only(scrape));
    small.until(() => small.actor.state === 'Recovering', 900);
    expect(active(small, 'fading-platforms')).toEqual([]);
    expect(small.log.cues).toContain('lion.huff');
  });
});

// ───────────────────────── defeat ─────────────────────────

describe('defeat by 42 positive hits (B4)', () => {
  it('rallies at a third and two thirds, is won at 42, never dies, and its wild pride lies down', () => {
    const r = rig(only(), onSeat());
    const m = r.creatures.spawnMinion(lionMinion, PLAN, PLAN.spawns[0]);
    r.step();
    r.touch(14);
    r.seconds(0.4);
    expect(r.actor.state).toBe('Rallying');
    r.seconds(2.5);
    r.touch(14);
    r.seconds(0.4);
    expect(r.actor.state).toBe('Rallying');
    r.seconds(2.5);
    r.touch(13);
    expect(r.actor.side).toBe('wild');
    r.touch(1);
    expect(r.actor.hits).toBe(42);
    expect([r.actor.state, r.actor.side, r.actor.alive]).toEqual(['Won', 'ally', true]);
    expect(r.log.toasts).toContain('toast.skyLionWon');
    r.seconds(3);
    expect(m.state).toBe(CALM);
    for (let i = 0; i < 300; i++) { aim(r, false); r.step(); }
    expect(r.log.drains).toEqual([]);
  });
});

// ───────────────────────── the pride (B5) ─────────────────────────

describe('the pride (B5)', () => {
  /** A lion of the pride standing on a ledge `up` blocks over the player. */
  function pride(up: number) {
    const r = rig(only(), { x: O.x - 20, y: O.y, z: O.z + 12 });
    const from: Place = PLAN.graph.places[0];
    const m = r.creatures.spawnMinion(lionMinion, PLAN, from);
    r.body.x = from.x + 0.5 + 3; r.body.z = from.z + 0.5; r.body.y = from.y - up;
    r.player.eye = { x: r.body.x, y: r.body.y + 1.6, z: r.body.z };
    r.player.aim = { x: 1, y: 0, z: 0 };
    return { r, m };
  }

  it('shows its warning, then pounces from a ledge 2 or more above the player, along the drawn ring', () => {
    const { r, m } = pride(3);
    r.seconds(1.6);
    r.until(() => active(r, 'lion-ring').length > 0, 120);
    expect(active(r, 'lion-ring')).toHaveLength(1);
    expect(active(r, 'lion-ring')[0].source).toBe(m.id);
  });

  it('never pounces on a frozen player', () => {
    const { r } = pride(3);
    for (let i = 0; i < Math.round(POUNCE_COOLDOWN / DT); i++) { r.player.hold(1); r.step(); }
    expect(active(r, 'lion-ring')).toEqual([]);
  });

  it('turns ally after four positive hits, and a negative one only puffs', () => {
    const r = rig(only(), { x: O.x - 20, y: O.y, z: O.z + 12 });
    const m = r.creatures.spawnMinion(lionMinion, PLAN, PLAN.spawns[0]);
    r.seconds(2);
    const at = { x: m.body.x, y: m.body.y + 0.5, z: m.body.z };
    r.creatures.touch(m.id, 'negative', true, at, 'intent');
    expect(m.hits).toBe(0);
    for (let i = 0; i < 3; i++) r.creatures.touch(m.id, 'positive', true, at, 'intent');
    expect(m.side).toBe('wild');
    r.creatures.touch(m.id, 'positive', true, at, 'intent');
    expect(m.side).toBe('ally');
  });

  it('is deterministic: the same floor, the same steps, the same path', () => {
    const path = () => {
      const r = rig(lionDeity, onSeat());
      const m = r.creatures.spawnMinion(lionMinion, PLAN, PLAN.spawns[1]);
      const out: number[] = [];
      for (let i = 0; i < 600; i++) { r.step(); out.push(r.actor.body.x, r.actor.body.y, m.body.x, m.body.z); }
      return out;
    };
    expect(path()).toEqual(path());
  });
});
