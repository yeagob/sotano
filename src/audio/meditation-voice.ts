// The voice of the Sanctuary (docs/design/built/presences/MEDITATION-APP.md §7a): the guidance lines are read
// aloud from clips made offline (scripts/meditation-voice/generate.py) and committed under
// public/audio/meditation/<lang>/. Breath cues are never spoken: they keep their synthesized sound.
//
// The queue is DOM-free so its rules are tested with a fake player. Narration never overlaps: a line due while
// another still plays waits, and only the newest waiting line is kept (an older one that was never heard
// would be a line for a moment that has already passed). Pausing, muting or leaving stops it.

/** What plays a clip. `onEnd` is called once, when the clip ends or cannot be played (a missing clip is silent). */
export interface VoicePlayer {
  play(src: string, onEnd: () => void): { stop(): void; pause(on: boolean): void };
}

export class NarrationQueue {
  private current: { handle: { stop(): void; pause(on: boolean): void } } | null = null;
  private pending: string | null = null;
  private token = 0;
  private paused = false;

  constructor(
    private readonly player: VoicePlayer,
    /** The clip's address for a line key, or null when there is no clip for it. */
    private readonly src: (key: string) => string | null,
  ) {}

  /** True while a clip plays. */
  get playing(): boolean { return this.current !== null; }

  /** The line waiting for the clip in course, if any. */
  get waiting(): string | null { return this.pending; }

  /** A guidance line is due: plays it now, or keeps it until the clip in course ends (and the queue is not paused). */
  say(key: string): void {
    if (!this.src(key)) return;
    if (this.current || this.paused) { this.pending = key; return; }
    this.start(key);
  }

  /** Pauses or resumes. A paused queue holds the line due and starts nothing; the clip in course is paused too. */
  pause(on: boolean): void {
    if (this.paused === on) return;
    this.paused = on;
    if (this.current) this.current.handle.pause(on);
    else if (!on && this.pending) { const k = this.pending; this.pending = null; this.start(k); }
  }

  /** Drops the clip in course and every waiting line. */
  stop(): void {
    this.pending = null;
    this.paused = false;
    const c = this.current;
    this.current = null;
    this.token++;
    c?.handle.stop();
  }

  private start(key: string): void {
    const url = this.src(key);
    if (!url) return;
    const mine = ++this.token;
    let ended = false;
    const onEnd = () => {
      if (ended || mine !== this.token) return;
      ended = true;
      this.current = null;
      const next = this.pending;
      this.pending = null;
      if (next && !this.paused) this.start(next);
    };
    const handle = this.player.play(url, onEnd);
    // a clip that failed at once has already ended: nothing is left to track
    if (!ended) this.current = { handle };
  }
}

/** The address of a line's clip for `lang`, given the site's base path. */
export function clipUrl(base: string, lang: string, key: string): string {
  return `${base}audio/meditation/${lang}/${key}.mp3`;
}

/** A player that plays each clip with an HTMLAudioElement: one element per clip, reused on repeat. */
export function htmlPlayer(volume = 0.9): VoicePlayer {
  const cache = new Map<string, HTMLAudioElement>();
  return {
    play(src, onEnd) {
      let a = cache.get(src);
      if (!a) { a = new Audio(src); a.preload = 'auto'; cache.set(src, a); }
      const el = a;
      el.currentTime = 0;
      el.volume = volume;
      const end = () => { el.onended = null; el.onerror = null; onEnd(); };
      el.onended = end;
      el.onerror = end;
      el.play().catch(end);
      return {
        stop() { el.onended = null; el.onerror = null; el.pause(); el.currentTime = 0; },
        pause(on: boolean) { if (on) el.pause(); else el.play().catch(end); },
      };
    },
  };
}
