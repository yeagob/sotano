// The meditations of the ascent (issue #380; ILLUMINATION.md §3a, MEDITATION-APP.md §7b): from the first checkpoint
// of the final ascent on, the sky and the sound run one cycle of 40-second blocks. The first block is the starry sky
// the player climbed into; then each of the six meditations has one block, in the Sanctuary's order, and the cycle
// begins again. A meditation's block shows its background as the sky, plays its music and ambience (the Sanctuary's
// synthesised sound, src/audio/meditation.ts) and speaks its reflections, one clip per part, in order, never two at
// once. The friends' chimes (#351) are a quieter layer on top.
//
// Pure and DOM-free: time comes from update(dt), never from the seed or the clock, so every run's cycle is the same.
// The music and the voice are handed in (MeditationAudio and htmlPlayer in the game, fakes in the tests).

import { SEQUENCE, SEQUENCE_IDS, lineKey, type Sequence, type SequenceId } from '../content/presences/meditations';
import type { VoicePlayer } from '../audio/meditation-voice';

/** The cycle's timings and levels, the only place they are written (seconds; levels are shares of the app's volume). */
export const ASCENT_BLOCKS = {
  /** Every block lasts exactly this long: the starry sky's and each meditation's. */
  BLOCK_S: 40,
  /** The cross-fade at the start of a block: the sky blends and the music of the block before fades while this one rises. */
  FADE_S: 4,
  /** A block's first reflection is due this long after the block begins (once the fade has settled). */
  VOICE_FIRST_S: 5,
  /** The next reflection is due this long after the one before was due... */
  VOICE_EVERY_S: 6,
  /** ...and never sooner than this long after the one before ended: two clips never overlap. */
  VOICE_GAP_S: 1.5,
  /** A reflection not begun by this second of its block is dropped, so the voice is done before the next fade. */
  VOICE_LAST_S: 31,
  /** The block's music, and the same music lowered while a reflection is spoken over it. */
  MUSIC_LEVEL: 0.85,
  DUCK_LEVEL: 0.6,
  /** The friends' chimes (#351): a layer on top of the block's music, quieter than it even while it is lowered. */
  FRIENDS_LEVEL: 0.45,
  /** The music fades out over this long when the rise into the Sun begins. */
  END_FADE_S: 5,
} as const;

/** What the sky shows in a block: the starry sky, or one meditation's background. */
export type SkySlot = 'stars' | SequenceId;

/** The cycle: the starry sky, then the six meditations in the Sanctuary's order (MEDITATION-APP.md §4). */
export const ASCENT_SLOTS: readonly SkySlot[] = ['stars', ...SEQUENCE_IDS];

/** The seconds one whole cycle takes. */
export const CYCLE_S = ASCENT_SLOTS.length * ASCENT_BLOCKS.BLOCK_S;

/** The block `t` seconds into the ascent falls in: its number from the start, its slot, the seconds into it, the loop. */
export function blockAt(t: number): { block: number; slot: SkySlot; into: number; loop: number } {
  const s = Math.max(0, t), block = Math.floor(s / ASCENT_BLOCKS.BLOCK_S);
  return { block, slot: ASCENT_SLOTS[block % ASCENT_SLOTS.length], into: s - block * ASCENT_BLOCKS.BLOCK_S, loop: Math.floor(block / ASCENT_SLOTS.length) };
}

/** How much of the sky a slot's background covers: none for the starry sky, all of it for a meditation's. */
export const slotShare = (slot: SkySlot): number => (slot === 'stars' ? 0 : 1);

/** The sky at `t`: the slot it comes from, the slot it goes to, and how far the cross-fade is (0 → 1, eased). */
export function skyAt(t: number): { from: SkySlot; to: SkySlot; k: number } {
  const b = blockAt(t);
  const from = b.block === 0 ? 'stars' : ASCENT_SLOTS[(b.block - 1) % ASCENT_SLOTS.length];
  const u = Math.min(1, b.into / ASCENT_BLOCKS.FADE_S);
  return { from, to: b.slot, k: u * u * (3 - 2 * u) };
}

/**
 * A meditation's reflections for one pass of the cycle: one guidance line of each part, in the parts' order. Each loop
 * speaks the next line of every part (the first loop the first lines, the second the second, and so on, round), so the
 * ascent goes through all of them and a given loop always says the same.
 */
export function blockClips(seq: Sequence, loop: number): string[] {
  return seq.parts.map((p, i) => lineKey(seq, i, (Math.max(0, loop) % p.lines) + 1));
}

/** The second of its block the `i`th reflection is due (it may start later, never sooner). */
export const clipDue = (i: number): number => ASCENT_BLOCKS.VOICE_FIRST_S + i * ASCENT_BLOCKS.VOICE_EVERY_S;

/** What plays a block's music and ambience: MeditationAudio. */
export interface BlockMusic {
  start(seq: Sequence, riseS: number): void;
  stop(fadeS: number): void;
  pause(on: boolean): void;
  tick(dt: number): void;
  setLevel(level: number, easeS?: number): void;
}

type Handle = ReturnType<VoicePlayer['play']>;

export class AscentBlocks {
  /** Seconds since the ascent began. It stands still while the game is paused or the player is out of Totality. */
  private t = 0;
  private block = -1;
  private paused = false;
  private away = false;
  private endedAt = -1;
  /** Which of the two music players holds the block in course (they alternate, so one fades while the other rises). */
  private turn = 0;
  private playing: SequenceId | null = null;
  private clips: string[] = [];
  private next = 0;
  private clip: Handle | null = null;
  private clipEndedAt = -Infinity;

  constructor(
    private readonly music: readonly [BlockMusic, BlockMusic],
    private readonly voice: VoicePlayer,
    /** The clip's address for a line key, or null when there is none. */
    private readonly src: (key: string) => string | null,
    /** The Sanctuary's sound is off: the cycle still turns the sky, and nothing sounds. */
    private readonly muted: boolean,
  ) {}

  get time(): number { return this.t; }
  get ended(): boolean { return this.endedAt >= 0; }
  /** The meditation whose music sounds now, if any. */
  get sounding(): SequenceId | null { return this.playing; }
  /** True while a reflection is spoken. */
  get speaking(): boolean { return this.clip !== null; }

  /** The sky now: the slots it blends and how much of it the backgrounds cover (0 → 1), fading out once the rise begins. */
  sky(): { from: SkySlot; to: SkySlot; k: number; share: number } {
    const s = skyAt(this.t);
    const base = slotShare(s.from) + (slotShare(s.to) - slotShare(s.from)) * s.k;
    if (this.endedAt < 0) return { ...s, share: base };
    const u = Math.min(1, (this.t - this.endedAt) / ASCENT_BLOCKS.FADE_S);
    return { ...s, share: base * (1 - u * u * (3 - 2 * u)) };
  }

  /** One frame of the ascent. */
  update(dt: number) {
    if (this.paused || this.away) return;
    this.t += Math.max(0, dt);
    if (this.endedAt >= 0) return;
    const b = blockAt(this.t);
    if (b.block !== this.block) this.enter(b.block, b.slot, b.loop);
    for (const m of this.music) m.tick(dt);
    this.speak(b.into);
  }

  private enter(block: number, slot: SkySlot, loop: number) {
    this.block = block;
    if (this.playing) this.music[this.turn].stop(ASCENT_BLOCKS.FADE_S);
    this.playing = null;
    this.clips = [];
    this.next = 0;
    if (slot === 'stars' || this.muted) return;
    const seq = SEQUENCE[slot];
    this.turn = 1 - this.turn;
    const m = this.music[this.turn];
    m.setLevel(this.clip ? ASCENT_BLOCKS.DUCK_LEVEL : ASCENT_BLOCKS.MUSIC_LEVEL, 0);
    m.start(seq, ASCENT_BLOCKS.FADE_S);
    this.playing = slot;
    this.clips = blockClips(seq, loop);
  }

  /** The block's reflections: each one at its due second, once the one before has ended and the gap has passed. */
  private speak(into: number) {
    if (this.clip || this.next >= this.clips.length) return;
    if (into > ASCENT_BLOCKS.VOICE_LAST_S) { this.next = this.clips.length; return; }
    if (into < clipDue(this.next) || this.t - this.clipEndedAt < ASCENT_BLOCKS.VOICE_GAP_S) return;
    const key = this.clips[this.next++], url = this.src(key);
    if (!url) return;
    let done = false;
    const level = (l: number) => { if (this.playing) this.music[this.turn].setLevel(l); };
    const onEnd = () => {
      if (done) return;
      done = true;
      if (this.clip === handle || handle === null) { this.clip = null; this.clipEndedAt = this.t; level(ASCENT_BLOCKS.MUSIC_LEVEL); }
    };
    let handle: Handle | null = null;
    level(ASCENT_BLOCKS.DUCK_LEVEL);
    handle = this.voice.play(url, onEnd);
    if (!done) this.clip = handle;
  }

  /** The game is paused or a screen is open: the clock holds, the music draws back and the voice waits. */
  pause(on: boolean) {
    if (this.paused === on) return;
    this.paused = on;
    for (const m of this.music) m.pause(on);
    this.clip?.pause(on);
  }

  /** The player is out of Totality: the clock holds and the sound is gone until they are back. */
  setAway(on: boolean) {
    if (this.away === on) return;
    this.away = on;
    if (this.playing) this.music[this.turn].setLevel(on ? 0 : this.clip ? ASCENT_BLOCKS.DUCK_LEVEL : ASCENT_BLOCKS.MUSIC_LEVEL, 1.5);
    this.clip?.pause(on);
  }

  /** The rise into the Sun begins: the music fades, no reflection begins (the one spoken ends on its own), the sky clears. */
  end() {
    if (this.endedAt >= 0) return;
    this.endedAt = this.t;
    this.paused = this.away = false;
    if (this.playing) this.music[this.turn].stop(ASCENT_BLOCKS.END_FADE_S);
    this.playing = null;
    this.clips = [];
  }

  /** A new run: everything stops at once (eased, never cut). */
  stop() {
    for (const m of this.music) m.stop(1.2);
    this.playing = null;
    this.clips = [];
    const c = this.clip;
    this.clip = null;
    c?.stop();
    this.endedAt = this.endedAt >= 0 ? this.endedAt : this.t;
  }
}
