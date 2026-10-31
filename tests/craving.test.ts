// Craving (Ansia in Spanish, a projection of wanting that never fills): its model, its breathing and
// its wind sound. Issue #46: a socket on its top face flickered against the face, the breathing jumped
// once every few seconds, and the wind's onset clicked.
import { describe, expect, it, vi } from 'vitest';
import { pal } from '../src/content/palette';
import craving from '../src/content/enemies/craving';
import type { Enemy, EnemyCtx, ModelPart } from '../src/enemies/types';
import { unlockAudio, spatial } from '../src/audio/sfx';

/** The four faces of a box that point the same way, each with its plane and its extent on the other two axes. */
function facesOf(p: ModelPart) {
  const out: { axis: number; dir: number; at: number; lo: number[]; hi: number[] }[] = [];
  for (let axis = 0; axis < 3; axis++) {
    const others = [0, 1, 2].filter(i => i !== axis);
    const lo = others.map(i => p.pos[i] - p.size[i] / 2), hi = others.map(i => p.pos[i] + p.size[i] / 2);
    out.push({ axis, dir: -1, at: p.pos[axis] - p.size[axis] / 2, lo, hi });
    out.push({ axis, dir: 1, at: p.pos[axis] + p.size[axis] / 2, lo, hi });
  }
  return out;
}

describe('craving model (issue #46): no z-fighting faces', () => {
  it('two boxes never share a face in the same direction over an area, unless one is an inlay', () => {
    const clashes: string[] = [];
    const model = craving.model;
    for (let i = 0; i < model.length; i++) for (let j = i + 1; j < model.length; j++) {
      const a = model[i], b = model[j];
      if (a.inlay || b.inlay) continue;
      for (const fa of facesOf(a)) for (const fb of facesOf(b)) {
        if (fa.axis !== fb.axis || fa.dir !== fb.dir || Math.abs(fa.at - fb.at) > 1e-9) continue;
        const overlap = fa.lo.every((lo, k) => Math.max(lo, fb.lo[k]) < Math.min(fa.hi[k], fb.hi[k]) - 1e-9);
        if (overlap) clashes.push(`parts ${i} and ${j} share a face on axis ${fa.axis}`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('the socket on top of craving is an inlay: it sits flush on the slab and is drawn with a depth offset', () => {
    const socket = craving.model.find(p => p.inlay);
    expect(socket, 'an inlay part').toBeDefined();
    expect(socket!.color).toBe(pal('ink.void'));
    expect(socket!.pos[1] - socket!.size[1] / 2).toBeGreaterThanOrEqual(craving.model[1].pos[1] - craving.model[1].size[1] / 2);
  });
});

describe('craving breathing (issue #46): no jump in the pulse', () => {
  it('the pulse changes smoothly from frame to frame, across winds and hits', () => {
    const e = { timer: 1.3, clock: 0, wishX: 0, wishZ: 0, pulse: 0, body: { x: 0, y: 0, z: 0 } } as unknown as Enemy;
    const strike = vi.fn();
    const ctx = {
      dt: 1 / 60,
      target: () => ({ id: 1, x: 6, y: 0, z: 6, vx: 0, vz: 0 }),
      dist: () => 3,
      toward: () => [1, 0] as [number, number],
      strike,
    } as unknown as EnemyCtx;
    craving.behaviour.update(e, ctx); // the first frame sets the breath; the jump from 0 is not measured
    let last = e.pulse, worst = 0;
    for (let frame = 1; frame < 60 * 13; frame++) {
      if (frame === 60 * 6) e.clock = 0; // a hit resets the wind clock; the breathing must not notice
      craving.behaviour.update(e, ctx);
      worst = Math.max(worst, Math.abs(e.pulse - last));
      last = e.pulse;
    }
    expect(worst).toBeLessThan(0.02);
    expect(strike).toHaveBeenCalledTimes(2); // winds at 4 s and, after the hit reset the clock, at 10 s
  });
});

describe('craving wind sound (issue #46): the onset fades in', () => {
  class Param {
    value = 0; calls: [string, number, number][] = [];
    setValueAtTime(v: number, t: number) { this.calls.push(['set', v, t]); return this; }
    linearRampToValueAtTime(v: number, t: number) { this.calls.push(['lin', v, t]); return this; }
    exponentialRampToValueAtTime(v: number, t: number) { this.calls.push(['exp', v, t]); return this; }
  }
  const node = () => ({ connect(n: unknown) { return n; }, disconnect() {} });
  const gains: { gain: Param }[] = [];
  class FakeAudioContext {
    currentTime = 0; sampleRate = 8000; state = 'running';
    destination = node();
    listener = { positionX: new Param(), positionY: new Param(), positionZ: new Param(), forwardX: new Param(), forwardY: new Param(), forwardZ: new Param(), upX: new Param(), upY: new Param(), upZ: new Param() };
    createGain() { const g = { ...node(), gain: new Param() }; gains.push(g); return g; }
    createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { ...node(), buffer: null, start() {}, stop() {} }; }
    createBiquadFilter() { return { ...node(), type: '', frequency: new Param(), Q: new Param() }; }
    createOscillator() { return { ...node(), type: '', frequency: new Param(), start() {}, stop() {} }; }
    createPanner() { return { ...node(), panningModel: '', distanceModel: '', refDistance: 0, rolloffFactor: 0, maxDistance: 0, positionX: new Param(), positionY: new Param(), positionZ: new Param() }; }
  }

  it('a pull starts from silence and swells to its level, so it never clicks', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    try {
      unlockAudio();
      spatial.cue('pull', 0, 0, 0);
      const wind = gains[gains.length - 1].gain.calls;
      expect(wind[0][0]).toBe('set');
      expect(wind[0][1]).toBeLessThan(0.001);
      expect(wind[1]).toEqual(['lin', 0.12, expect.any(Number)]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
