import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/content/bosses';
import { emitter, sleep } from '../src/enemies/behaviours';
import { evading, OPENING } from '../src/enemies/evade';
import type { Enemy, EnemyCtx } from '../src/enemies/types';

// Issue #314: a boss shot while it stands still leaves your line of fire, and no state of a boss is a
// dead end. Each boss is fed a fake world (like tests/bosses.test.ts) a phase at a time, with a target
// that stands still six blocks away.

const DT = 1 / 60;
const HP = [100, 60, 30];

interface Run {
  e: Enemy;
  /** Seconds at which it did something: an attack, a summon, a windup, a manoeuvre, walking. */
  acts: number[];
  killed: boolean;
  step(): void;
  time(): number;
}

function arena(id: string, stage: number, bounds: [number, number, number, number], you: { x: number; z: number }): Run {
  const def = BOSSES.find(b => b.id === id)!;
  const e = {
    id: 7, hp: HP[stage], maxHp: 100, stage, hold: 0, state: 'move', timer: 2, seq: 0, armed: true, hidden: false,
    wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: def.speed || 1, clock: 0, aimX: 0, aimZ: 0, volley: 2,
    body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: def.size[0], h: def.size[1], onGround: true },
    tags: new Set<string>(def.asleep && stage === 0 ? ['asleep'] : []), room: 0, faction: 'projection', spec: def, def: def.id,
  } as unknown as Enemy;
  let t = 0, killed = false;
  const acts: number[] = [];
  const did = () => { acts.push(t); };
  const target = () => ({ id: 1, x: you.x, y: 0, z: you.z, vx: 0, vz: 0 });
  const ctx = {
    dt: DT, target, near: target,
    dist: (_e: Enemy, p: { x: number; z: number }) => Math.hypot(p.x - e.body.x, p.z - e.body.z),
    toward: (_e: Enemy, p: { x: number; z: number }) => { const dx = p.x - e.body.x, dz = p.z - e.body.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; },
    bounds: () => bounds, centre: () => [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
    strike: did, bolt: did, shootAt: did, rain: did, rockfall: did, summon: did, quake: did,
    cue: (_e: Enemy, kind: string) => { if (kind === 'windup' || kind === 'leap' || kind === 'hide') did(); },
    crash: () => {}, fx: () => {}, arena: () => {}, burst: () => {}, quiet: () => false, others: () => [],
    safe: () => true, hide: (_e: Enemy, h: boolean) => { e.hidden = h; }, kill: () => { killed = true; }, practices: () => [],
  } as unknown as EnemyCtx;
  let wasEvading = false, lx = 0, lz = 0, walked = 0;
  return {
    e, acts,
    get killed() { return killed; },
    step() {
      def.behaviour.update(e, ctx);
      if (evading(e) && !wasEvading) did();
      wasEvading = evading(e);
      // the body follows its wish and stops at the room's walls (the game's own physics are not needed
      // to read its decisions; a charge ends where its body is stopped)
      const b = e.body;
      b.vx = e.hidden ? 0 : e.wishX * e.speed; b.vz = e.hidden ? 0 : e.wishZ * e.speed;
      const nx = b.x + b.vx * DT, nz = b.z + b.vz * DT;
      const cx = Math.min(bounds[2] + 1 - b.hw, Math.max(bounds[0] + b.hw, nx)), cz = Math.min(bounds[3] + 1 - b.hw, Math.max(bounds[1] + b.hw, nz));
      if (cx !== nx) b.vx = 0;
      if (cz !== nz) b.vz = 0;
      b.x = cx; b.z = cz;
      walked += Math.hypot(e.body.x - lx, e.body.z - lz); lx = e.body.x; lz = e.body.z;
      // walking at a pace counts as doing something: a blocks-a-second check twice a second
      if (Math.round(t / DT) % 30 === 29) { if (walked >= 0.5) did(); walked = 0; }
      t += DT;
    },
    time: () => t,
  } as Run;
}

/** It stands still: the recovery after a move, the opening a player shoots into. */
function stand(e: Enemy) {
  e.state = 'recover'; e.move = 0; e.timer = 1;
}

/** How far (x, z) is from the line from you through where the boss stood. */
function offLine(you: { x: number; z: number }, from: { x: number; z: number }, x: number, z: number) {
  const ux = from.x - you.x, uz = from.z - you.z, l = Math.hypot(ux, uz) || 1;
  return Math.abs((x - you.x) * uz / l - (z - you.z) * ux / l);
}

const SQUARE: [number, number, number, number] = [-10, -10, 10, 10];
const HALL: [number, number, number, number] = [-13, -3, 14, 3];

describe('bosses: every boss leaves your line of fire when it is shot standing still (issue #314)', () => {
  for (const b of BOSSES) {
    it(`${b.id} answers a hit with a manoeuvre in every phase`, () => {
      for (const stage of [0, 1, 2]) {
        const you = { x: -6, z: 0 };
        const r = arena(b.id, stage, SQUARE, you);
        stand(r.e);
        r.step();
        const from = { x: r.e.body.x, z: r.e.body.z };
        r.e.hp -= 5; // shot
        let began = -1;
        for (let k = 0; k < 120; k++) { r.step(); if (began < 0 && evading(r.e)) began = r.time(); }
        expect(began, `${b.id} phase ${stage + 1}: no manoeuvre`).toBeGreaterThanOrEqual(0);
        expect(began, `${b.id} phase ${stage + 1}: too slow`).toBeLessThanOrEqual(OPENING + 0.1);
        expect(evading(r.e), `${b.id} phase ${stage + 1}: still in its manoeuvre`).toBe(false);
        expect(r.e.hidden, `${b.id} phase ${stage + 1}: left hidden`).toBe(false);
        // clear of a shot aimed at its centre where it stood
        expect(offLine(you, from, r.e.body.x, r.e.body.z), `${b.id} phase ${stage + 1}: still in the line`).toBeGreaterThan(r.e.body.hw + 0.3);
      }
    });

    it(`${b.id} gets off the line in the narrow boss hall too`, () => {
      for (const stage of [0, 1, 2]) {
        const you = { x: -6, z: 0 };
        const r = arena(b.id, stage, HALL, you);
        stand(r.e);
        r.step();
        const from = { x: r.e.body.x, z: r.e.body.z };
        r.e.hp -= 5;
        for (let k = 0; k < 120; k++) r.step();
        expect(offLine(you, from, r.e.body.x, r.e.body.z), `${b.id} phase ${stage + 1}`).toBeGreaterThan(1);
        const [x0, z0, x1, z1] = HALL;
        expect(r.e.body.z, `${b.id} phase ${stage + 1}: left the room`).toBeGreaterThanOrEqual(z0);
        expect(r.e.body.z).toBeLessThanOrEqual(z1 + 1);
        expect(r.e.body.x).toBeGreaterThanOrEqual(x0);
        expect(r.e.body.x).toBeLessThanOrEqual(x1 + 1);
      }
    });

    it(`${b.id} never stands still under steady fire for long: it attacks, walks or dodges`, () => {
      for (const stage of [0, 1, 2]) {
        const you = { x: -6, z: 0 };
        const r = arena(b.id, stage, SQUARE, you);
        let dodges = 0, was = false, sitting = 0, longest = 0, lx = r.e.body.x, lz = r.e.body.z;
        for (let k = 0; k < 20 * 60; k++) {
          // a shot every quarter second; its health is quietly put back so the phase never changes
          if (k % 15 === 0) { r.e.hp -= 1; if (r.e.hp < HP[stage] - 4.5) r.e.hp = HP[stage]; }
          r.step();
          if (r.killed) break;
          if (evading(r.e) && !was) dodges++;
          was = evading(r.e);
          // a sitting duck: no attack under way, no manoeuvre, and slower than a block a second
          const moved = Math.hypot(r.e.body.x - lx, r.e.body.z - lz) / DT;
          lx = r.e.body.x; lz = r.e.body.z;
          const attacking = ['windup', 'act', 'aim', 'run'].includes(r.e.state);
          sitting = !attacking && !evading(r.e) && moved < 1 ? sitting + DT : 0;
          longest = Math.max(longest, sitting);
        }
        if (r.killed) continue; // the Shadow's stillness ending (its last phase)
        expect(dodges, `${b.id} phase ${stage + 1}: dodges in 20 s`).toBeGreaterThanOrEqual(1);
        expect(longest, `${b.id} phase ${stage + 1}: longest time standing in the line of fire`).toBeLessThan(3.5);
      }
    });
  }
});

describe('bosses: no state is a dead end (issue #314)', () => {
  // the Shadow's first phase mirrors you: if you stand still and hold your fire, so does it, by design
  const BY_DESIGN = new Set(['shadow:0']);
  for (const b of BOSSES) {
    it(`${b.id} always has a next action within a few seconds, untouched, in every phase`, () => {
      for (const stage of [0, 1, 2]) {
        if (BY_DESIGN.has(`${b.id}:${stage}`)) continue;
        const r = arena(b.id, stage, SQUARE, { x: -6, z: 0 });
        r.e.tags.delete('asleep'); // asleep is a wait for your push, covered below
        for (let k = 0; k < 30 * 60 && !r.killed; k++) r.step();
        if (r.killed) continue;
        const acts = [0, ...r.acts, r.time()];
        const gap = Math.max(...acts.slice(1).map((a, i) => a - acts[i]));
        expect(gap, `${b.id} phase ${stage + 1}: longest time doing nothing`).toBeLessThanOrEqual(6.5);
      }
    });
  }

  it('the Shadow comes to stand beside you in its last phase, so standing still ends it', () => {
    const r = arena('shadow', 2, SQUARE, { x: -6, z: 0 });
    for (let k = 0; k < 15 * 60 && !r.killed; k++) r.step();
    expect(r.killed).toBe(true);
  });

  it('a sleeping boss wakes when it is hurt, not only when it is pushed', () => {
    const idle = { name: 'idle', update: () => {} };
    const b = sleep({ wakeSpeed: 1.5, wakeHurt: 0.03, then: idle });
    const e = { hp: 100, maxHp: 100, tags: new Set(['asleep']), body: { vx: 0, vz: 0 }, wishX: 0, wishZ: 0, pulse: 0 } as unknown as Enemy;
    const ctx = { dt: DT, cue: () => {} } as unknown as EnemyCtx;
    b.update(e, ctx);
    expect(e.tags.has('asleep')).toBe(true);
    e.hp = 96;
    b.update(e, ctx);
    expect(e.tags.has('asleep')).toBe(false);
  });

  it('an emitter boss within its distance circles you instead of standing still', () => {
    const b = emitter({ every: 5, follow: { speed: 1, keep: 4 }, shot: () => {} });
    const e = { id: 3, wishX: 0, wishZ: 0, timer: 5, pulse: 0, speed: 1 } as unknown as Enemy;
    const ctx = { dt: DT, target: () => ({ x: 3, z: 0, y: 0 }), dist: () => 3, toward: () => [1, 0] } as unknown as EnemyCtx;
    b.update(e, ctx);
    expect(Math.hypot(e.wishX, e.wishZ)).toBeGreaterThan(0.5);
    expect(e.wishX).toBeCloseTo(0);
  });
});
