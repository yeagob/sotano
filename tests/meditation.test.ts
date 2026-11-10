// The Sanctuary's meditations (docs/design/built/presences/MEDITATION-APP.md): the content of the six sittings
// and the rules of a sitting's time. The timer reaches the chosen length, the parts fill it exactly, a part
// holds whole breaths, Next part never shortens it, and every meditation has its own scene, palette, music,
// sounds and words in every language.

import { describe, expect, it } from 'vitest';
import {
  LINE_MS, MAX_LENGTH_SEC, MIN_LENGTH_SEC, SEQUENCES, SEQUENCE_IDS, blurbKey, lineKey, momentAt, nameKey, palOf,
  partAt, partKey, planSitting, randomLengthSec, rewardBand, skipPart, type PaletteRole,
} from '../src/content/presences/meditations';
import { PALETTE } from '../src/content/palette';
import { EFFECTS } from '../src/render/meditation-scenes';
import { ITEM_BY_ID } from '../src/content/items';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const en = EN.messages as Record<string, unknown>;
const es = ES.messages as Record<string, unknown>;
const SITTING_LENGTHS_SEC = [MIN_LENGTH_SEC, 30, MAX_LENGTH_SEC] as const;
const planned = (s: typeof SEQUENCES[number], seconds: number) => planSitting(s, seconds, () => 0.5);
const ROLES: PaletteRole[] = ['high', 'mid', 'deep', 'glow', 'accent', 'accent2', 'mote', 'ink'];

const lum = (hex: string) => {
  const ch = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

describe('the collection', () => {
  it('has at least six meditations, each a tier 1 or 2 practice of the game with a source in the library', () => {
    expect(SEQUENCES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(SEQUENCE_IDS).size).toBe(SEQUENCES.length);
    const sources = readFileSync(join(__dirname, '..', 'docs/lore/SOURCES.md'), 'utf8');
    for (const s of SEQUENCES) {
      const item = ITEM_BY_ID.get(s.practice);
      expect(item, s.practice).toBeDefined();
      expect(item!.quality, s.id).toBe(s.tier);
      expect([1, 2]).toContain(s.tier);
      for (const id of s.sources) expect(sources, id).toContain(`\`${id}\``);
    }
    expect(SEQUENCES.some(s => s.tier === 1) && SEQUENCES.some(s => s.tier === 2)).toBe(true);
  });

  it('gives every meditation five parts whose shares add to 100, each with its own scene effect', () => {
    const seen = new Set<string>();
    for (const s of SEQUENCES) {
      expect(s.parts.length, s.id).toBe(5);
      expect(s.parts.reduce((a, p) => a + p.share, 0), s.id).toBe(100);
      expect(s.parts.map(p => p.effect), s.id).toEqual(EFFECTS[s.scene]);
      for (const p of s.parts) {
        expect(seen.has(p.effect), p.effect).toBe(false);
        seen.add(p.effect);
        expect(p.lines, `${s.id}.${p.id}`).toBeGreaterThanOrEqual(2);
        expect(p.chord.length, `${s.id}.${p.id}`).toBeGreaterThanOrEqual(3);
      }
      expect(new Set(s.parts.map(p => p.chord.join())).size, `${s.id} chords`).toBe(5);
    }
    expect(new Set(SEQUENCES.map(s => s.scene)).size).toBe(SEQUENCES.length);
  });

  it('gives every meditation a music entry and a sound entry, and no two the same', () => {
    for (const s of SEQUENCES) {
      expect(s.music.root, s.id).toBeGreaterThan(60);
      expect(s.music.root, s.id).toBeLessThan(400);
      expect(s.music.scale.length, s.id).toBeGreaterThanOrEqual(5);
      expect(s.music.bellEvery[0], s.id).toBeGreaterThanOrEqual(3);
      expect(s.music.bellEvery[1], s.id).toBeGreaterThan(s.music.bellEvery[0]);
      expect(s.sounds.part.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.sounds.in.length + s.sounds.out.length, s.id).toBe(4);
    }
    expect(new Set(SEQUENCES.map(s => JSON.stringify(s.music))).size).toBe(SEQUENCES.length);
    expect(new Set(SEQUENCES.map(s => JSON.stringify(s.sounds))).size).toBe(SEQUENCES.length);
    expect(new Set(SEQUENCES.map(s => s.music.root)).size).toBe(SEQUENCES.length);
    expect(new Set(SEQUENCES.map(s => s.music.texture)).size).toBe(SEQUENCES.length);
  });

  it('gives every meditation its own palette, with ink that reads on every background stop', () => {
    const sets = new Set<string>();
    for (const id of [...SEQUENCE_IDS, 'app'] as const) {
      const hexes = ROLES.map(r => PALETTE[palOf(id, r)]);
      for (const [i, h] of hexes.entries()) expect(h, `${id}.${ROLES[i]}`).toMatch(/^#[0-9A-F]{6}$/);
      sets.add(hexes.join());
      const ink = PALETTE[palOf(id, 'ink')];
      for (const r of ['high', 'mid', 'deep'] as const) {
        expect(contrast(ink, PALETTE[palOf(id, r)]), `${id} ink on ${r}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(PALETTE[palOf(id, 'mote')], PALETTE[palOf(id, r)]), `${id} secondary text on ${r}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(sets.size).toBe(SEQUENCES.length + 1);
    for (const r of ['high', 'mid', 'deep'] as const) expect(contrast(PALETTE['med.app.dim'], PALETTE[palOf('app', r)]), r).toBeGreaterThanOrEqual(4.5);
  });

  it('has every word of every meditation in English and Spanish', () => {
    for (const s of SEQUENCES) {
      const keys = [nameKey(s), blurbKey(s)];
      for (const [i, p] of s.parts.entries()) {
        keys.push(partKey(s, i));
        for (let n = 1; n <= p.lines; n++) keys.push(lineKey(s, i, n));
        expect(en, `${s.id}.${p.id} has no line past its count`).not.toHaveProperty([`med.${s.id}.${p.id}.${p.lines + 1}`]);
      }
      for (const k of keys) {
        expect(typeof en[k], `en ${k}`).toBe('string');
        expect(typeof es[k], `es ${k}`).toBe('string');
        expect((en[k] as string).length, k).toBeGreaterThan(2);
        expect((en[k] as string).length, `${k} is short`).toBeLessThanOrEqual(80);
        expect((es[k] as string).length, `${k} is short in Spanish`).toBeLessThanOrEqual(90);
      }
    }
  });
});

describe('a sitting', () => {
  it('rolls an inclusive whole-second duration from 20 to 40 seconds', () => {
    expect(MIN_LENGTH_SEC).toBe(20);
    expect(MAX_LENGTH_SEC).toBe(40);
    expect(randomLengthSec(() => 0)).toBe(20);
    expect(randomLengthSec(() => 0.5)).toBe(30);
    expect(randomLengthSec(() => 1)).toBe(40);
  });

  it('reaches the chosen length: the timer reads the full time at the start and zero only at the end', () => {
    for (const s of SEQUENCES) for (const sec of SITTING_LENGTHS_SEC) {
      const plan = planned(s, sec), total = sec * 1000;
      expect(plan.totalMs).toBe(total);
      expect(plan.bounds[0]).toBe(0);
      expect(plan.bounds.at(-1)).toBe(total);
      expect(momentAt(plan, 0).secondsLeft).toBe(sec);
      expect(momentAt(plan, 0).done).toBe(false);
      expect(momentAt(plan, total - 1).secondsLeft).toBe(1);
      expect(momentAt(plan, total - 1).done).toBe(false);
      expect(momentAt(plan, total).secondsLeft).toBe(0);
      expect(momentAt(plan, total).done).toBe(true);
      expect(momentAt(plan, total + 99999).done).toBe(true);
    }
  });

  it('gives each part its share of the length, in order, with no gap', () => {
    for (const s of SEQUENCES) for (const sec of SITTING_LENGTHS_SEC) {
      const plan = planned(s, sec);
      for (const [i, p] of s.parts.entries()) {
        const ms = plan.bounds[i + 1] - plan.bounds[i];
        expect(Math.abs(ms - sec * 10 * p.share), `${s.id} ${sec} ${p.id}`).toBeLessThanOrEqual(1);
        expect(partAt(plan, plan.bounds[i])).toBe(i);
        expect(partAt(plan, plan.bounds[i + 1] - 1)).toBe(i);
      }
    }
  });

  it('a longer sitting is the same meditation, slower: the same lines in the same order', () => {
    const s = SEQUENCES[0];
    expect(planned(s, 60).lines).toEqual(planned(s, 30).lines);
  });

  it('shows one seeded line at the start of each part, then leaves the rest quiet', () => {
    const plan = planned(SEQUENCES[0], MAX_LENGTH_SEC);
    for (const [part, section] of plan.seq.parts.entries()) {
      const start = plan.bounds[part], end = plan.bounds[part + 1];
      expect(plan.lines[part]).toBeGreaterThanOrEqual(1);
      expect(plan.lines[part]).toBeLessThanOrEqual(section.lines);
      expect(momentAt(plan, start).line).toBe(plan.lines[part]);
      expect(momentAt(plan, Math.min(end - 1, start + LINE_MS - 1)).line).toBe(plan.lines[part]);
      if (end - start > LINE_MS) {
        expect(momentAt(plan, start + LINE_MS).line).toBe(0);
        expect(momentAt(plan, end - 1).line).toBe(0);
      }
    }
  });

  it('holds a whole number of breaths in every paced part: a part never ends mid-breath', () => {
    for (const s of SEQUENCES) for (const sec of SITTING_LENGTHS_SEC) {
      const plan = planned(s, sec);
      for (const [i, p] of s.parts.entries()) {
        if (!p.pace.length) { expect(momentAt(plan, plan.bounds[i] + 10).breath).toBe('natural'); continue; }
        const first = momentAt(plan, plan.bounds[i]), last = momentAt(plan, plan.bounds[i + 1] - 1);
        expect(first.breath, `${s.id}.${p.id} starts on its first beat`).toBe(p.pace[0][0]);
        expect(first.breathT).toBeLessThan(0.01);
        expect(last.breath, `${s.id}.${p.id} ends on its last beat`).toBe(p.pace.at(-1)![0]);
        expect(last.breathT).toBeGreaterThan(0.99);
        expect((last.beat + 1) % p.pace.length).toBe(0);
      }
    }
  });

  it('moves the lungs smoothly: full after an in-breath, empty after an out-breath, never a jump', () => {
    for (const s of SEQUENCES) {
      const plan = planned(s, 30);
      let prev = momentAt(plan, 0);
      for (let t = 20; t < plan.totalMs; t += 20) {
        const m = momentAt(plan, t);
        expect(m.lung).toBeGreaterThanOrEqual(0);
        expect(m.lung).toBeLessThanOrEqual(1);
        if (m.part === prev.part) expect(Math.abs(m.lung - prev.lung), `${s.id} at ${t}`).toBeLessThan(0.08);
        prev = m;
      }
    }
  });

  it('Next part ends the part now, keeps the length and shares the time left among the parts that follow', () => {
    for (const s of SEQUENCES) {
      const plan = planned(s, 30), at = plan.bounds[1] + 1000;
      const next = skipPart(plan, at);
      expect(next.totalMs).toBe(plan.totalMs);
      expect(next.bounds.at(-1)).toBe(plan.totalMs);
      expect(next.bounds.slice(0, 2)).toEqual(plan.bounds.slice(0, 2));
      expect(next.bounds[2]).toBe(at);
      expect(partAt(next, at)).toBe(2);
      expect(momentAt(next, at).secondsLeft).toBe(momentAt(plan, at).secondsLeft);
      for (let i = 2; i < 5; i++) expect(next.bounds[i + 1] - next.bounds[i]).toBeGreaterThan(plan.bounds[i + 1] - plan.bounds[i]);
      expect(momentAt(next, plan.totalMs).done).toBe(true);
    }
  });

  it('cannot skip the last part, however often it is asked', () => {
    let plan = planned(SEQUENCES[3], 30);
    for (let i = 0; i < 12; i++) plan = skipPart(plan, 1000 + i);
    expect(partAt(plan, 1100)).toBe(4);
    expect(plan.totalMs).toBe(30 * 1000);
    expect(momentAt(plan, 5000).done).toBe(false);
    expect(momentAt(plan, plan.totalMs - 1).done).toBe(false);
    expect(skipPart(plan, 5000)).toBe(plan);
  });
});

describe('the reward', () => {
  it('is a tier 1 or 2 practice for the quick reward and tier 3 or 4 for a finished meditation', () => {
    expect(rewardBand('quick')).toEqual([1, 2]);
    expect(rewardBand('complete')).toEqual([3, 4]);
  });
});
