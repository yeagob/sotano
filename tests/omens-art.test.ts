// The omen's art rules (docs/art/DECISIONS.md §3.6, §7.3, §7.4): an omen gathers exactly 72 cold
// motes spread through its gather and none in the last 0.3 s; every omen particle is from the cold
// ramp; a slamming door throws at most 12 dust chips from its frame ramp.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pal, type PalToken } from '../src/content/palette';
import {
  EVENT_PARTICLE_CAP, gatherMoteColor, gatherMotesDue, MOTE_MIN_LIFE, OMEN_BREACH_COLOR, OMEN_COLORS, OMEN_GATHER,
  OMEN_MOTES, SLAM_MOTES, slamMotesPerDoor, type Omen,
} from '../src/game/omens';
import { rampSplit } from '../src/render/particles';

const omen = (): Omen => ({ def: 'doubt', room: 0, seq: 0, x: 0, y: 0, z: 0, t: 0, breached: false, emitted: 0 });

/** Runs one omen's gather at a fixed frame time; returns [time, motes] for every frame that emitted. */
function runGather(dt: number): [number, number][] {
  const o = omen(), out: [number, number][] = [];
  while (true) {
    o.t += dt;
    if (o.t >= OMEN_GATHER) break;
    const n = gatherMotesDue(o);
    if (n > 0) out.push([o.t, n]);
  }
  return out;
}

const COLD = new Set<number>((['cold.dim', 'cold.body', 'cold.white'] as PalToken[]).map(pal));

describe('omen gather schedule', () => {
  for (const fps of [144, 60, 30, 20]) {
    it(`emits exactly ${OMEN_MOTES} motes at ${fps} fps, none in the last ${MOTE_MIN_LIFE} s`, () => {
      const frames = runGather(1 / fps);
      const total = frames.reduce((a, [, n]) => a + n, 0);
      expect(OMEN_MOTES).toBe(72);
      expect(total).toBe(72);
      for (const [t] of frames) expect(OMEN_GATHER - t).toBeGreaterThanOrEqual(MOTE_MIN_LIFE);
    });
  }

  it('builds up gradually (never a burst at 60 fps)', () => {
    const frames = runGather(1 / 60);
    for (const [, n] of frames) expect(n).toBeLessThanOrEqual(2);
    expect(frames[frames.length - 1][1]).toBeGreaterThan(0);
  });

  it('never exceeds the cap, however long it is asked', () => {
    const o = omen();
    let total = 0;
    for (let i = 0; i < 1000; i++) { o.t = (i / 1000) * OMEN_GATHER; total += gatherMotesDue(o); }
    expect(total).toBeLessThanOrEqual(OMEN_MOTES);
  });
});

describe('omen colours stay in the cold ramp', () => {
  it('gather motes are cold.body, then cold.white in the second half', () => {
    expect(gatherMoteColor(0)).toBe('cold.body');
    expect(gatherMoteColor(OMEN_GATHER * 0.49)).toBe('cold.body');
    expect(gatherMoteColor(OMEN_GATHER * 0.5)).toBe('cold.white');
    for (let t = 0; t < OMEN_GATHER; t += 0.01) expect(COLD.has(pal(gatherMoteColor(t)))).toBe(true);
  });

  it('the breach flares cold.white and the declared omen colours are all cold', () => {
    expect(OMEN_BREACH_COLOR).toBe('cold.white');
    for (const c of OMEN_COLORS) expect(COLD.has(pal(c))).toBe(true);
  });

  it('updateOmens names no palette token outside the cold ramp', () => {
    const src = readFileSync(join(__dirname, '../src/game/game.ts'), 'utf8');
    const body = src.slice(src.indexOf('private updateOmens('), src.indexOf('private slamDoors('));
    expect(body.length).toBeGreaterThan(0);
    for (const m of body.matchAll(/pal\('([^']+)'\)/g)) expect(COLD.has(pal(m[1] as PalToken))).toBe(true);
  });
});

describe('door slam dust', () => {
  it('throws at most 12 motes per door, and never more than 60 in all', () => {
    expect(SLAM_MOTES).toBe(12);
    for (let doors = 1; doors <= 12; doors++) {
      const n = slamMotesPerDoor(doors);
      expect(n).toBeLessThanOrEqual(12);
      expect(n * doors).toBeLessThanOrEqual(EVENT_PARTICLE_CAP);
    }
    expect(slamMotesPerDoor(4)).toBe(12);
    expect(slamMotesPerDoor(0)).toBe(0);
  });

  it('splits the chips 50 % base, 30 % dark, 20 % hi', () => {
    expect(rampSplit(12)).toEqual([6, 4, 2]);
    for (let n = 0; n <= 12; n++) expect(rampSplit(n).reduce((a, b) => a + b, 0)).toBe(n);
  });
});
