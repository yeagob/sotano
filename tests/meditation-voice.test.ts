// Issue #203 (docs/design/built/presences/MEDITATION-APP.md §7a): the spoken guidance never overlaps, plays in
// order, waits for the clip in course, keeps only the newest waiting line, and stops, pauses and resumes with the
// sitting. The player is a fake: it records what it was asked to play and ends a clip when the test says so.

import { describe, expect, it } from 'vitest';
import { NarrationQueue, clipUrl, type VoicePlayer } from '../src/audio/meditation-voice';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { SEQUENCES, lineKey } from '../src/content/presences/meditations';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

class FakePlayer implements VoicePlayer {
  /** Every clip started, in order. */
  started: string[] = [];
  /** Clips that are playing now, with the callback that ends each one. */
  live: { src: string; end: () => void; paused: boolean }[] = [];
  stops = 0;
  /** Clips the player fails on at once (a missing file). */
  failing = new Set<string>();

  play(src: string, onEnd: () => void) {
    this.started.push(src);
    if (this.failing.has(src)) { onEnd(); return { stop() {}, pause() {} }; }
    const clip = { src, end: onEnd, paused: false };
    this.live.push(clip);
    return {
      stop: () => { this.stops++; this.live = this.live.filter(c => c !== clip); },
      pause: (on: boolean) => { clip.paused = on; },
    };
  }

  /** Ends the oldest clip still playing. */
  finish() {
    const c = this.live.shift();
    c?.end();
  }

  get playingNow() { return this.live.length; }
}

const url = (k: string) => `/audio/meditation/en/${k}.mp3`;

function queue(player = new FakePlayer(), missing: string[] = []) {
  return { player, q: new NarrationQueue(player, k => (missing.includes(k) ? null : url(k))) };
}

describe('the narration queue', () => {
  it('plays a line at once when nothing else plays', () => {
    const { player, q } = queue();
    q.say('med.ground.arrive.1');
    expect(player.started).toEqual([url('med.ground.arrive.1')]);
    expect(q.playing).toBe(true);
  });

  it('never has two clips playing at once: a line due during another waits for it to end', () => {
    const { player, q } = queue();
    q.say('med.ground.arrive.1');
    q.say('med.ground.arrive.2');
    expect(player.playingNow).toBe(1);
    expect(player.started).toHaveLength(1);
    expect(q.waiting).toBe('med.ground.arrive.2');
    player.finish();
    expect(player.started).toEqual([url('med.ground.arrive.1'), url('med.ground.arrive.2')]);
    expect(player.playingNow).toBe(1);
    expect(q.waiting).toBeNull();
  });

  it('plays the lines in the order they were due, and a line is not repeated', () => {
    const { player, q } = queue();
    const keys = ['med.dusk.small.1', 'med.dusk.small.2', 'med.dusk.small.3'];
    for (const k of keys) { q.say(k); player.finish(); }
    expect(player.started).toEqual(keys.map(url));
    expect(q.playing).toBe(false);
  });

  it('keeps only the newest waiting line: an older one that was never heard is dropped', () => {
    const { player, q } = queue();
    q.say('a');
    q.say('b');
    q.say('c');
    expect(q.waiting).toBe('c');
    player.finish();
    expect(player.started).toEqual([url('a'), url('c')]);
  });

  it('a line with no clip is silent and does not hold the queue', () => {
    const { player, q } = queue(new FakePlayer(), ['missing']);
    q.say('missing');
    expect(player.started).toEqual([]);
    expect(q.playing).toBe(false);
    q.say('med.ground.arrive.1');
    expect(player.started).toEqual([url('med.ground.arrive.1')]);
  });

  it('a clip that fails at once ends at once and the next line plays', () => {
    const player = new FakePlayer();
    player.failing.add(url('broken'));
    const { q } = queue(player);
    q.say('broken');
    expect(q.playing).toBe(false);
    q.say('next');
    expect(player.started).toEqual([url('broken'), url('next')]);
  });

  it('pausing holds the line due and pauses the clip in course; resuming plays what was held', () => {
    const { player, q } = queue();
    q.say('a');
    q.pause(true);
    expect(player.live[0].paused).toBe(true);
    q.say('b');
    expect(player.started).toEqual([url('a')]);
    q.pause(false);
    expect(player.live[0].paused).toBe(false);
    player.finish();
    expect(player.started).toEqual([url('a'), url('b')]);
  });

  it('a paused queue with nothing playing starts the held line on resume', () => {
    const { player, q } = queue();
    q.pause(true);
    q.say('a');
    expect(player.started).toEqual([]);
    q.pause(false);
    expect(player.started).toEqual([url('a')]);
  });

  it('stop drops the clip in course and every waiting line, and a late end does nothing', () => {
    const { player, q } = queue();
    q.say('a');
    q.say('b');
    q.stop();
    expect(player.playingNow).toBe(0);
    expect(q.waiting).toBeNull();
    expect(q.playing).toBe(false);
    player.started.length = 0;
    const stale = player.live.length;
    expect(stale).toBe(0);
    q.say('c');
    expect(player.started).toEqual([url('c')]);
  });

  it('the address of a clip is per language and per line', () => {
    expect(clipUrl('/', 'es', 'med.ground.arrive.1')).toBe('/audio/meditation/es/med.ground.arrive.1.mp3');
  });
});

describe('the guidance lines', () => {
  it('every guidance line of every meditation has its words in English and Spanish', () => {
    for (const s of SEQUENCES) for (let p = 0; p < s.parts.length; p++) for (let l = 1; l <= s.parts[p].lines; l++) {
      const k = lineKey(s, p, l) as string;
      expect(EN.messages as Record<string, unknown>, k).toHaveProperty(k);
      expect(ES.messages as Record<string, unknown>, k).toHaveProperty(k);
    }
  });

  it('when the clips are generated, every guidance line has a clip in each language, and the breath has none', () => {
    const dir = (lang: string) => join(process.cwd(), 'public', 'audio', 'meditation', lang);
    for (const lang of ['en', 'es']) {
      if (!existsSync(dir(lang))) continue;
      const have = new Set(readdirSync(dir(lang)).map(f => f.replace(/\.mp3$/, '')));
      for (const s of SEQUENCES) for (let p = 0; p < s.parts.length; p++) for (let l = 1; l <= s.parts[p].lines; l++) {
        expect(have.has(lineKey(s, p, l) as string), `${lang} ${lineKey(s, p, l)}`).toBe(true);
      }
      for (const f of have) expect(f.startsWith('med.') && !/breath/.test(f), f).toBe(true);
    }
  });
});
