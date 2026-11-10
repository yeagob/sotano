// The Sanctuary's meditations (docs/design/built/presences/MEDITATION-APP.md): the six guided sittings the
// Boundary's meditation app runs, each one a tier 1 or 2 practice of the game, and the rules of a sitting's
// time. A sitting is planned from a meditation and a length; `momentAt` says what the screen shows at any
// elapsed time (the part, the guidance line, the breath). Nothing here reads a clock or the DOM.

import type { MessageKey } from '../../i18n';
import type { PalToken } from '../palette';

/** The sitting length is rolled for each visit, in whole seconds. */
export const MIN_LENGTH_SEC = 20;
export const MAX_LENGTH_SEC = 40;

export function randomLengthSec(rng: () => number): number {
  return MIN_LENGTH_SEC + Math.floor(rng() * (MAX_LENGTH_SEC - MIN_LENGTH_SEC + 1));
}

/** A guidance line stays on screen for at most this long before quiet/breath. */
export const LINE_MS = 6000;
/** With no paced breath the breath shape still moves, on a slow tide of this length. */
export const NATURAL_MS = 11000;

/** What the lungs do: fill, stay full, empty, stay empty; `natural` is the player's own pace. */
export type BreathKind = 'in' | 'full' | 'out' | 'empty' | 'natural';
/** A paced breath: its beats in order, in seconds. An empty pace is the natural breath. */
export type Pace = readonly (readonly [Exclude<BreathKind, 'natural'>, number])[];

const SLOW: Pace = [['in', 4], ['out', 6]];
const SLOWER: Pace = [['in', 5], ['out', 7]];
const LONG_OUT: Pace = [['in', 4], ['out', 8]];
const BOX4: Pace = [['in', 4], ['full', 4], ['out', 4], ['empty', 4]];
const BOX5: Pace = [['in', 5], ['full', 5], ['out', 5], ['empty', 5]];
const NATURAL: Pace = [];

export type SceneId = 'ground' | 'dusk' | 'night' | 'box' | 'warm' | 'river';
export type TextureId = 'earth' | 'wind' | 'air' | 'none' | 'breath' | 'river';

export interface Part {
  id: string;
  /** The part's share of the sitting, in hundredths. A meditation's shares add to 100. */
  share: number;
  pace: Pace;
  /** The scene effect that belongs to this part alone (the painter in render/meditation-scenes.ts). */
  effect: string;
  /** The pad chord of this part, in semitones above the root. */
  chord: readonly number[];
  /** How many guidance lines the part has (`med.<id>.<part>.1` … `.n`). */
  lines: number;
}

export interface Music {
  /** The root of the pad, in hertz; the drone sits an octave below. */
  root: number;
  /** The scale the bell notes are drawn from, in semitones. */
  scale: readonly number[];
  pad: OscillatorType;
  bell: OscillatorType;
  /** Seconds between bell notes: shortest and longest. */
  bellEvery: readonly [number, number];
  /** Octaves above the root where the bells ring. */
  bellOctave: number;
  texture: TextureId;
}

export interface Sounds {
  timbre: OscillatorType;
  /** The in-breath's glide and the out-breath's, from and to, in semitones above the root. */
  in: readonly [number, number];
  out: readonly [number, number];
  /** The note of a hold, or null for silence. */
  hold: number | null;
  /** The chime that opens each part: its notes in order, in semitones above the root. */
  part: readonly number[];
}

export type PaletteRole = 'high' | 'mid' | 'deep' | 'glow' | 'accent' | 'accent2' | 'mote' | 'ink';

export interface Sequence {
  id: SceneId;
  /** The tier of the practice it comes from: what it asks of attention, not what it gives. */
  tier: 1 | 2;
  /** The game's practice this meditation is (an item id) and its sources in docs/lore/SOURCES.md. */
  practice: string;
  sources: readonly string[];
  scene: SceneId;
  parts: readonly Part[];
  music: Music;
  sounds: Sounds;
}

export const SEQUENCES: readonly Sequence[] = [
  {
    id: 'ground', tier: 1, practice: 'grounding', sources: ['somatic'], scene: 'ground',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'dustSettles', chord: [0, 7, 14], lines: 2 },
      { id: 'legs', share: 25, pace: SLOW, effect: 'rootsGrow', chord: [0, 7, 10, 14], lines: 3 },
      { id: 'belly', share: 25, pace: SLOW, effect: 'columnRises', chord: [-2, 5, 10, 14], lines: 3 },
      { id: 'face', share: 25, pace: LONG_OUT, effect: 'leavesGather', chord: [3, 7, 10, 17], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'wholeGlow', chord: [0, 7, 12, 16], lines: 2 },
    ],
    music: { root: 146.83, scale: [0, 2, 3, 5, 7, 9, 10], pad: 'triangle', bell: 'triangle', bellEvery: [7, 15], bellOctave: 1, texture: 'earth' },
    sounds: { timbre: 'sine', in: [-12, -5], out: [-5, -12], hold: null, part: [-12, -5] },
  },
  {
    id: 'dusk', tier: 1, practice: 'gratitude', sources: ['positive-psychology'], scene: 'dusk',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'duskFalls', chord: [0, 7, 14], lines: 2 },
      { id: 'small', share: 25, pace: SLOW, effect: 'oneLantern', chord: [0, 4, 7, 14], lines: 3 },
      { id: 'holds', share: 25, pace: SLOW, effect: 'lanternPairs', chord: [-3, 4, 9, 12], lines: 3 },
      { id: 'given', share: 25, pace: SLOWER, effect: 'skyOfLanterns', chord: [5, 9, 12, 16], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'lanternsToStars', chord: [0, 7, 12, 16], lines: 2 },
    ],
    music: { root: 174.61, scale: [0, 2, 4, 7, 9], pad: 'sine', bell: 'sine', bellEvery: [5, 11], bellOctave: 2, texture: 'wind' },
    sounds: { timbre: 'sine', in: [0, 7], out: [12, 12], hold: null, part: [0, 4, 7] },
  },
  {
    id: 'night', tier: 1, practice: 'visualization', sources: ['sports-psych'], scene: 'night',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'starsComeOut', chord: [0, 7, 14], lines: 2 },
      { id: 'way', share: 20, pace: SLOW, effect: 'mountainsRise', chord: [0, 6, 7, 14], lines: 3 },
      { id: 'place', share: 30, pace: SLOW, effect: 'auroraUnfolds', chord: [2, 6, 9, 14], lines: 3 },
      { id: 'senses', share: 25, pace: SLOWER, effect: 'waterMirrors', chord: [-1, 4, 6, 11], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'paleDawn', chord: [0, 4, 7, 11], lines: 2 },
    ],
    music: { root: 164.81, scale: [0, 2, 4, 6, 7, 9, 11], pad: 'sine', bell: 'sine', bellEvery: [6, 13], bellOctave: 3, texture: 'air' },
    sounds: { timbre: 'sine', in: [12, 19], out: [19, 12], hold: null, part: [12, 19] },
  },
  {
    id: 'box', tier: 2, practice: 'boxbreathing', sources: ['breathwork'], scene: 'box',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'squareDraws', chord: [0, 7, 14], lines: 2 },
      { id: 'four', share: 25, pace: BOX4, effect: 'beadAndTrail', chord: [0, 5, 7, 14], lines: 3 },
      { id: 'holds', share: 25, pace: BOX4, effect: 'nestedSquares', chord: [0, 2, 7, 12], lines: 3 },
      { id: 'wide', share: 25, pace: BOX5, effect: 'tileField', chord: [-2, 5, 7, 12], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'squareToCircle', chord: [0, 4, 7, 12], lines: 2 },
    ],
    music: { root: 110, scale: [0, 2, 5, 7, 9], pad: 'triangle', bell: 'sine', bellEvery: [9, 17], bellOctave: 2, texture: 'none' },
    sounds: { timbre: 'triangle', in: [0, 7], out: [7, 0], hold: 12, part: [-12] },
  },
  {
    id: 'warm', tier: 2, practice: 'selfcompassion', sources: ['self-compassion'], scene: 'warm',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'orbSteadies', chord: [0, 7, 16], lines: 2 },
      { id: 'self', share: 25, pace: SLOW, effect: 'ringsStayClose', chord: [0, 4, 9, 14], lines: 3 },
      { id: 'close', share: 25, pace: SLOW, effect: 'twoOrbsMeet', chord: [5, 9, 12, 16], lines: 3 },
      { id: 'all', share: 25, pace: SLOWER, effect: 'manyOrbsJoined', chord: [-3, 4, 7, 12], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'oneGlow', chord: [0, 4, 7, 9], lines: 2 },
    ],
    music: { root: 196, scale: [0, 2, 4, 7, 9], pad: 'sine', bell: 'triangle', bellEvery: [6, 12], bellOctave: 1, texture: 'breath' },
    sounds: { timbre: 'sine', in: [-5, 0], out: [0, 7], hold: null, part: [4, 9] },
  },
  {
    id: 'river', tier: 2, practice: 'thinkwaitfast', sources: ['siddhartha', 'tao-te-ching'], scene: 'river',
    parts: [
      { id: 'arrive', share: 10, pace: NATURAL, effect: 'firstDrop', chord: [0, 7, 14], lines: 2 },
      { id: 'sounds', share: 25, pace: NATURAL, effect: 'streamsAndRings', chord: [0, 4, 7, 10], lines: 3 },
      { id: 'leaves', share: 30, pace: SLOW, effect: 'leavesDrift', chord: [-2, 5, 9, 12], lines: 3 },
      { id: 'whole', share: 20, pace: NATURAL, effect: 'wideShimmer', chord: [5, 7, 12, 16], lines: 3 },
      { id: 'return', share: 15, pace: NATURAL, effect: 'moonOnStillWater', chord: [0, 7, 12, 16], lines: 2 },
    ],
    music: { root: 130.81, scale: [0, 2, 4, 5, 7, 9, 10], pad: 'sine', bell: 'triangle', bellEvery: [3, 8], bellOctave: 2, texture: 'river' },
    sounds: { timbre: 'sine', in: [7, 7], out: [0, -5], hold: null, part: [19, 14, 7] },
  },
];

export type SequenceId = Sequence['id'];
export const SEQUENCE_IDS: readonly SequenceId[] = SEQUENCES.map(s => s.id);
export const SEQUENCE: Readonly<Record<SequenceId, Sequence>> = Object.fromEntries(SEQUENCES.map(s => [s.id, s])) as Record<SequenceId, Sequence>;

export const palOf = (id: SceneId | 'app', role: PaletteRole): PalToken => `med.${id}.${role}` as PalToken;

export const nameKey = (s: Sequence) => `med.${s.id}.name` as MessageKey;
export const blurbKey = (s: Sequence) => `med.${s.id}.blurb` as MessageKey;
export const partKey = (s: Sequence, part: number) => `med.${s.id}.${s.parts[part].id}.name` as MessageKey;
export const lineKey = (s: Sequence, part: number, line: number) => `med.${s.id}.${s.parts[part].id}.${line}` as MessageKey;
export const BREATH_KEY: Record<BreathKind, MessageKey> = {
  in: 'sanctuary.breath.in', full: 'sanctuary.breath.full', out: 'sanctuary.breath.out', empty: 'sanctuary.breath.empty', natural: 'sanctuary.breath.natural',
};

/** A planned sitting: where each part starts. `bounds` has one more entry than there are parts; the last is the total. */
export interface Plan { seq: Sequence; totalMs: number; bounds: readonly number[]; lines: readonly number[] }

function share(seq: Sequence, from: number, startMs: number, totalMs: number): number[] {
  const parts = seq.parts.slice(from);
  const sum = parts.reduce((a, p) => a + p.share, 0);
  const out: number[] = [];
  let acc = 0;
  for (const p of parts) {
    acc += p.share;
    out.push(startMs + Math.round((totalMs - startMs) * acc / sum));
  }
  out[out.length - 1] = totalMs;
  return out;
}

export function planSitting(seq: Sequence, seconds: number, rng: () => number): Plan {
  const totalMs = seconds * 1000;
  const pickedLines = seq.parts.map(p => Math.floor(rng() * p.lines) + 1);
  return { seq, totalMs, bounds: [0, ...share(seq, 0, 0, totalMs)], lines: pickedLines };
}

export function partAt(plan: Plan, elapsedMs: number): number {
  const t = Math.min(Math.max(0, elapsedMs), plan.totalMs);
  const last = plan.seq.parts.length - 1;
  for (let i = 0; i < last; i++) if (t < plan.bounds[i + 1]) return i;
  return last;
}

/** Next part: the part in course ends now and the time it had left goes to the parts that follow, by their
 *  shares. The sitting keeps its length. The last part cannot be skipped. */
export function skipPart(plan: Plan, elapsedMs: number): Plan {
  const i = partAt(plan, elapsedMs);
  if (i >= plan.seq.parts.length - 1 || elapsedMs >= plan.totalMs) return plan;
  const now = Math.max(plan.bounds[i], Math.round(elapsedMs));
  return { ...plan, bounds: [...plan.bounds.slice(0, i + 1), now, ...share(plan.seq, i + 1, now, plan.totalMs)] };
}

export interface Moment {
  part: number;
  /** How far into the part, 0 to 1. */
  partT: number;
  /** The guidance line on screen, counted from 1, or 0 if quiet; lineSeq identifies the moment. */
  line: number;
  lineSeq: number;
  breath: BreathKind;
  /** How far into this beat of the breath, 0 to 1. */
  breathT: number;
  /** The seconds this beat lasts, for the count on screen. */
  beatS: number;
  /** A count of beats since the part began, so a new beat can be told from the last. */
  beat: number;
  /** How full the lungs are, 0 to 1: what the breath shape draws. */
  lung: number;
  secondsLeft: number;
  done: boolean;
}

const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;

export function momentAt(plan: Plan, elapsedMs: number): Moment {
  const t = Math.min(Math.max(0, elapsedMs), plan.totalMs);
  const part = partAt(plan, t);
  const def = plan.seq.parts[part];
  const start = plan.bounds[part], ms = Math.max(1, plan.bounds[part + 1] - start);
  const into = Math.min(t - start, ms - 0.001);
  const line = into < LINE_MS ? plan.lines[part] : 0;
  let breath: BreathKind = 'natural', breathT = 0, beat = 0, lung = 0, beatS = NATURAL_MS / 1000;
  const cycle = def.pace.reduce((a, [, s]) => a + s * 1000, 0);
  if (cycle > 0) {
    const cycles = Math.max(1, Math.round(ms / cycle));
    const stretch = ms / cycles / cycle;
    const n = Math.min(cycles - 1, Math.floor(into / (cycle * stretch)));
    let at = into - n * cycle * stretch;
    for (const [i, [kind, s]] of def.pace.entries()) {
      const len = s * 1000 * stretch;
      if (at < len || i === def.pace.length - 1) {
        breath = kind; breathT = Math.min(1, at / len); beat = n * def.pace.length + i; beatS = s;
        break;
      }
      at -= len;
    }
    lung = breath === 'in' ? ease(breathT) : breath === 'full' ? 1 : breath === 'out' ? 1 - ease(breathT) : 0;
  } else {
    const tide = (into % NATURAL_MS) / NATURAL_MS;
    breathT = tide; beat = Math.floor(into / NATURAL_MS);
    lung = 0.5 - Math.cos(2 * Math.PI * tide) / 2;
  }
  return {
    part, partT: into / ms, line, lineSeq: line > 0 ? part * 1000 + line : part * 1000,
    breath, breathT, beatS, beat, lung,
    secondsLeft: Math.ceil((plan.totalMs - t) / 1000),
    done: t >= plan.totalMs,
  };
}

export type Outcome = 'cancel' | 'quick' | 'complete';

/** The practice tiers (quality 1 to 4) the Boundary's chest draws from: the quick reward is tier 1 or 2, a
 *  finished meditation is tier 3 or 4. Not now draws nothing. */
export function rewardBand(outcome: Exclude<Outcome, 'cancel'>): [number, number] {
  return outcome === 'complete' ? [3, 4] : [1, 2];
}
