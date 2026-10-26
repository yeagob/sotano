// Chain safety for explosions (docs/architecture/ACTORS.md §1). Explosions never run inside
// another event: they are queued here and run a few per frame. A blast queued while another one
// runs joins its chain (`gen + 1`); chains stop after `maxGen` links and the queue has a hard cap.

import type { Cause } from '../game/events';

export const BLASTS_PER_FRAME = 8;
export const MAX_BLASTS = 256;
export const MAX_CHAIN_GEN = 12;

export class BlastQueue<B extends { source: string; cause: Cause }> {
  private queue: B[] = [];
  /** The chain of the blast running now (or set by the caller for delayed links, e.g. bombs). */
  current: Cause | null = null;
  private warned = new Set<string>();

  constructor(private perFrame = BLASTS_PER_FRAME, private max = MAX_BLASTS, private maxGen = MAX_CHAIN_GEN) {}

  get pending() { return this.queue.length; }

  /** The cause a blast queued right now would get. */
  nextCause(source: string): Cause {
    return this.current ? { origin: this.current.origin, gen: this.current.gen + 1 } : { origin: source, gen: 0 };
  }

  /** Queues a blast (its `cause` is filled in). Returns false if the chain or the queue is full. */
  push(blast: Omit<B, 'cause'>): boolean {
    const cause = this.nextCause(blast.source);
    if (cause.gen > this.maxGen) return this.warn('chain', `[blasts] chain from "${cause.origin}" stopped at ${this.maxGen} links`);
    if (this.queue.length >= this.max) return this.warn('queue', `[blasts] more than ${this.max} explosions queued; dropping new ones`);
    this.queue.push({ ...blast, cause } as B);
    return true;
  }

  /** Runs up to `perFrame` queued blasts; the rest wait for the next frame. */
  run(fn: (b: B) => void) {
    for (let n = 0; n < this.perFrame && this.queue.length; n++) {
      const b = this.queue.shift()!;
      this.current = b.cause;
      try { fn(b); } catch (err) { console.error('[blasts] explosion failed', err); } finally { this.current = null; }
    }
  }

  clear() { this.queue = []; this.current = null; }

  private warn(key: string, msg: string) {
    if (!this.warned.has(key)) { this.warned.add(key); console.warn(msg); }
    return false;
  }
}
