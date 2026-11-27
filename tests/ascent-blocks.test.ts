// The meditations of the ascent (issue #380; ILLUMINATION.md §3a, MEDITATION-APP.md §7b): the sky and the sound run one
// cycle of 40-second blocks from the first checkpoint on: the starry sky, then the six meditations in the Sanctuary's
// order, and again. The music and the voice are fakes that record what they were asked to do, in the ascent's time.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  ASCENT_BLOCKS, ASCENT_SLOTS, AscentBlocks, CYCLE_S, blockAt, blockClips, clipDue, skyAt, type BlockMusic,
} from '../src/game/ascent-blocks';
import type { VoicePlayer } from '../src/audio/meditation-voice';
import { SEQUENCE, SEQUENCE_IDS, type Sequence } from '../src/content/presences/meditations';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { pal } from '../src/content/palette';
import { MeditationSky, blendStops, gradientAt, stopsOf } from '../src/sky/render/meditation-sky';

class Clock { t = 0 }

class FakeMusic implements BlockMusic {
  starts: { id: string; at: number; rise: number }[] = [];
  stops: { at: number; fade: number }[] = [];
  levels: number[] = [];
  constructor(private readonly clock: Clock) {}
  start(seq: Sequence, riseS: number) { this.starts.push({ id: seq.id, at: this.clock.t, rise: riseS }); }
  stop(fadeS: number) { this.stops.push({ at: this.clock.t, fade: fadeS }); }
  pause() {}
  tick() {}
  setLevel(l: number) { this.levels.push(l); }
}

/** A voice whose clips each last `length` seconds of the ascent's time. */
class TimedVoice implements VoicePlayer {
  played: { src: string; from: number; to: number }[] = [];
  private live: { end: () => void; left: number; i: number }[] = [];
  constructor(private readonly clock: Clock, private readonly length: number) {}
  play(src: string, onEnd: () => void) {
    const i = this.played.push({ src, from: this.clock.t, to: Infinity }) - 1;
    const clip = { end: onEnd, left: this.length, i };
    this.live.push(clip);
    return { stop: () => { this.live = this.live.filter(c => c !== clip); }, pause() {} };
  }
  advance(dt: number) {
    for (const c of [...this.live]) {
      c.left -= dt;
      if (c.left <= 1e-9) { this.live = this.live.filter(x => x !== c); this.played[c.i].to = this.clock.t; c.end(); }
    }
  }
  get playingNow() { return this.live.length; }
}

const url = (k: string) => `/audio/meditation/en/${k}.mp3`;

function run(seconds: number, opts: { muted?: boolean; clipS?: number; dt?: number } = {}) {
  const clock = new Clock(), dt = opts.dt ?? 0.25;
  const music: [FakeMusic, FakeMusic] = [new FakeMusic(clock), new FakeMusic(clock)];
  const voice = new TimedVoice(clock, opts.clipS ?? 3);
  const blocks = new AscentBlocks(music, voice, url, opts.muted ?? false);
  const sky: { t: number; to: string; sounding: string | null }[] = [];
  let maxLive = 0;
  for (let i = 0; i * dt < seconds; i++) {
    clock.t = blocks.time + dt;
    blocks.update(dt);
    voice.advance(dt);
    maxLive = Math.max(maxLive, voice.playingNow);
    sky.push({ t: blocks.time, to: blocks.sky().to, sounding: blocks.sounding });
  }
  const starts = [...music[0].starts, ...music[1].starts].sort((a, b) => a.at - b.at);
  return { blocks, music, voice, starts, sky, maxLive };
}

describe('the cycle of the ascent', () => {
  it('is the starry sky, then the six meditations in the Sanctuary order', () => {
    expect(ASCENT_SLOTS).toEqual(['stars', 'ground', 'dusk', 'night', 'box', 'warm', 'river']);
    expect(ASCENT_SLOTS.slice(1)).toEqual(SEQUENCE_IDS);
    expect(CYCLE_S).toBe(7 * 40);
  });

  it('is the same for the same run: the sky depends on the ascent time only, however the frames fall', () => {
    const a = new AscentBlocks([new FakeMusic(new Clock()), new FakeMusic(new Clock())], new TimedVoice(new Clock(), 1), url, true);
    const b = new AscentBlocks([new FakeMusic(new Clock()), new FakeMusic(new Clock())], new TimedVoice(new Clock(), 1), url, true);
    // two players' frames: steady 1/60 s against uneven steps; compared at the same ascent time
    const uneven = [0.013, 0.05, 0.021, 0.1, 0.007, 0.033];
    let i = 0;
    for (let s = 1; s <= 2 * CYCLE_S; s += 7) {
      while (a.time < s) a.update(Math.min(1 / 60, s - a.time));
      while (b.time < s) b.update(Math.min(uneven[i++ % uneven.length], s - b.time));
      expect(b.sky()).toEqual(a.sky());
      expect(a.sky()).toMatchObject(skyAt(s));
    }
  });

  it('cross-fades the sky over the first four seconds of every block, from the block before', () => {
    expect(ASCENT_BLOCKS.FADE_S).toBe(4);
    expect(skyAt(0)).toEqual({ from: 'stars', to: 'stars', k: 0 });
    expect(skyAt(40)).toMatchObject({ from: 'stars', to: 'ground', k: 0 });
    expect(skyAt(42).k).toBeCloseTo(0.5, 5);
    expect(skyAt(44)).toMatchObject({ from: 'stars', to: 'ground', k: 1 });
    expect(skyAt(80)).toMatchObject({ from: 'ground', to: 'dusk', k: 0 });
    expect(skyAt(CYCLE_S + 1)).toMatchObject({ from: 'river', to: 'stars' });
  });
});

describe('the blocks', () => {
  it('last 40 seconds exactly: each meditation starts on a multiple of 40 and fades the one before', () => {
    const { starts, music } = run(2 * CYCLE_S + 1);
    expect(ASCENT_BLOCKS.BLOCK_S).toBe(40);
    const meditationBlocks = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13];
    expect(starts.map(s => s.at)).toEqual(meditationBlocks.map(b => b * 40));
    for (const s of starts) expect(s.rise).toBe(ASCENT_BLOCKS.FADE_S);
    // every block's music fades out when the next block begins, over the same four seconds
    const stops = [...music[0].stops, ...music[1].stops].sort((a, b) => a.at - b.at);
    expect(stops.map(s => s.at)).toEqual(meditationBlocks.map(b => (b + 1) * 40));
    for (const s of stops) expect(s.fade).toBe(ASCENT_BLOCKS.FADE_S);
  });

  it('play the six meditations in the same order every loop, alternating the two players', () => {
    const { starts, music } = run(3 * CYCLE_S);
    const ids = starts.map(s => s.id);
    expect(ids).toEqual([...SEQUENCE_IDS, ...SEQUENCE_IDS, ...SEQUENCE_IDS]);
    expect(music[0].starts.length).toBe(music[1].starts.length);
  });

  it('start together with the sky: the music that sounds is always the background the sky goes to', () => {
    const { sky } = run(2 * CYCLE_S);
    for (const f of sky) expect(f.sounding ?? 'stars').toBe(f.to);
    expect(blockAt(0).slot).toBe('stars');
    expect(skyAt(0).to).toBe('stars');
  });

  it('speak the clips of their meditation in order, one per part, and never two at once', () => {
    for (const clipS of [2, 4.5, 7]) {
      const { voice, maxLive } = run(CYCLE_S + 1, { clipS });
      expect(maxLive).toBeLessThanOrEqual(1);
      for (const [i, id] of SEQUENCE_IDS.entries()) {
        const from = (i + 1) * 40, keys = blockClips(SEQUENCE[id], 0);
        const mine = voice.played.filter(p => p.from >= from && p.from < from + 40);
        // in the parts' order, a prefix of the block's clips (a long voice may leave the last ones out)
        expect(mine.map(p => p.src)).toEqual(keys.slice(0, mine.length).map(url));
        expect(mine.length).toBeGreaterThan(0);
        for (const [j, p] of mine.entries()) {
          expect(p.from - from).toBeGreaterThanOrEqual(clipDue(j) - 1e-9);
          expect(p.from - from).toBeLessThanOrEqual(ASCENT_BLOCKS.VOICE_LAST_S + 0.25);
          if (j > 0) expect(p.from - mine[j - 1].to).toBeGreaterThanOrEqual(ASCENT_BLOCKS.VOICE_GAP_S - 1e-9);
        }
        if (clipS <= 4.5) expect(mine.length).toBe(SEQUENCE[id].parts.length);
      }
      // never overlap anywhere, not even across blocks
      const all = [...voice.played].sort((a, b) => a.from - b.from);
      for (let j = 1; j < all.length; j++) expect(all[j].from).toBeGreaterThanOrEqual(all[j - 1].to);
    }
  });

  it('speak lines that exist in both languages, the next line of every part on each loop', () => {
    for (const s of SEQUENCE_IDS.map(id => SEQUENCE[id])) {
      for (let loop = 0; loop < 4; loop++) {
        const keys = blockClips(s, loop);
        expect(keys.length).toBe(s.parts.length);
        for (const [i, k] of keys.entries()) {
          expect(k).toBe(`med.${s.id}.${s.parts[i].id}.${(loop % s.parts[i].lines) + 1}`);
          expect(EN.messages as Record<string, unknown>).toHaveProperty([k]);
          expect(ES.messages as Record<string, unknown>).toHaveProperty([k]);
        }
      }
    }
  });

  it('are silent when the Sanctuary sound is off: no music, no voice, while the sky still turns', () => {
    const { starts, voice, sky } = run(2 * CYCLE_S, { muted: true });
    expect(starts).toEqual([]);
    expect(voice.played).toEqual([]);
    expect(new Set(sky.map(f => f.to))).toEqual(new Set(ASCENT_SLOTS));
  });

  it('keep the friends a quieter layer on top of the music, even while a reflection lowers it', () => {
    expect(ASCENT_BLOCKS.FRIENDS_LEVEL).toBeLessThan(ASCENT_BLOCKS.DUCK_LEVEL);
    expect(ASCENT_BLOCKS.DUCK_LEVEL).toBeLessThan(ASCENT_BLOCKS.MUSIC_LEVEL);
    const { music } = run(90, { clipS: 3 });
    const levels = [...music[0].levels, ...music[1].levels];
    expect(levels).toContain(ASCENT_BLOCKS.DUCK_LEVEL);
    expect(levels).toContain(ASCENT_BLOCKS.MUSIC_LEVEL);
  });

  it('hold while paused or away, and end with the rise: the music fades and the sky clears', () => {
    const { blocks, music } = run(45);
    const at = blocks.time;
    blocks.pause(true);
    blocks.update(10);
    expect(blocks.time).toBe(at);
    blocks.pause(false);
    blocks.setAway(true);
    blocks.update(10);
    expect(blocks.time).toBe(at);
    blocks.setAway(false);
    expect(blocks.sky().share).toBe(1);
    blocks.end();
    const stops = music[0].stops.length + music[1].stops.length;
    expect(stops).toBe(1);
    blocks.update(ASCENT_BLOCKS.FADE_S / 2);
    expect(blocks.sky().share).toBeGreaterThan(0);
    expect(blocks.sky().share).toBeLessThan(1);
    blocks.update(ASCENT_BLOCKS.FADE_S);
    expect(blocks.sky().share).toBe(0);
    // no new block begins after the end
    blocks.update(200);
    expect(music[0].starts.length + music[1].starts.length).toBe(1);
  });
});

describe('the ascent sky', () => {
  it('lays each meditation background on the dome: high at the zenith, mid on the horizon, deep below', () => {
    for (const id of SEQUENCE_IDS) {
      const s = stopsOf(id);
      expect(s.high).toBe(pal(`med.${id}.high`));
      expect(gradientAt(s, 1)).toBe(s.high);
      expect(gradientAt(s, 0)).toBe(s.mid);
      expect(gradientAt(s, -1)).toBe(s.deep);
    }
    expect(blendStops('stars', 'stars', 0.5)).toBeNull();
    expect(blendStops('stars', 'dusk', 0.2)).toEqual(stopsOf('dusk'));
    expect(blendStops('ground', 'dusk', 0)).toEqual(stopsOf('ground'));
    expect(blendStops('ground', 'dusk', 1)).toEqual(stopsOf('dusk'));
  });

  it('is hidden while only the stars show, and returns the horizon for the fog once a background shows', () => {
    const root = new THREE.Group(), dome = new MeditationSky(root);
    const mesh = root.children[0] as THREE.Mesh;
    expect(dome.update({ x: 0, y: 500, z: 0 }, 0x05040a, 'stars', 'stars', 0, 0)).toBeNull();
    expect(mesh.visible).toBe(false);
    expect(dome.update({ x: 1, y: 500, z: 2 }, 0x05040a, 'stars', 'ground', 0.5, 0.5)).toBe(stopsOf('ground').mid);
    expect(mesh.visible).toBe(true);
    expect(mesh.position.toArray()).toEqual([1, 500, 2]);
    expect(mesh.renderOrder).toBeLessThan(-1);
    expect((mesh.geometry.getAttribute('position')).count).toBeLessThan(300);
    dome.dispose();
    expect(root.children.length).toBe(0);
  });
});
