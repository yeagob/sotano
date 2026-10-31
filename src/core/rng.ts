// Seeded deterministic RNG (sfc32), path-derived forks and runtime streams.
// See docs/architecture/RNG.md for the rules: structure, runtime and cosmetic randomness.

export class Rng {
  private a: number; private b: number; private c: number; private d: number;

  constructor(seed: number) {
    // sfc32 seeded with splitmix32
    let s = seed >>> 0;
    const next = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.a = next(); this.b = next(); this.c = next(); this.d = next();
    for (let i = 0; i < 12; i++) this.u32();
  }

  u32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** [0, 1) */
  next(): number { return this.u32() / 4294967296; }
  range(min: number, max: number) { return min + (max - min) * this.next(); }
  int(min: number, maxIncl: number) { return min + Math.floor(this.next() * (maxIncl - min + 1)); }
  chance(p: number) { return this.next() < p; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
}

/** 32-bit string hash (FNV-1a), to derive seeds from names. */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** Deterministic value noise for integer coordinates. */
export function hash3(seed: number, x: number, y: number, z: number): number {
  let h = seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Incremental path hash seeded by the root: mixes each part in turn (strings char by char,
 * numbers as 32-bit words) with no string building, so `fork('floor', 2, 'room', 5)` and
 * `fork('floor', 25)` never collide by concatenation and different roots never correlate.
 */
export function hashPath(root: number, parts: readonly (string | number)[]): number {
  let h = (root ^ 0x9e3779b9) >>> 0;
  const mix = (v: number) => {
    h = Math.imul(h ^ (v >>> 0), 0x85ebca6b);
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
  };
  for (const p of parts) {
    if (typeof p === 'number') {
      if (!Number.isInteger(p)) throw new Error(`hashPath: path parts must be integers or strings, got ${p}`);
      mix(0x6e756d00); mix(p | 0);
    }
    else { mix(0x73747200 ^ p.length); for (let i = 0; i < p.length; i++) mix(p.charCodeAt(i)); }
    mix(0x2f2f2f2f); // separator
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * All of a run's randomness, derived from its 32-bit root (docs/architecture/RNG.md).
 *
 * - `fork(...path)` — a **fresh** RNG for one decision site. Same path, same sequence, whatever
 *   happened before. Call it ONCE per site and draw from it in order (calling it twice for the
 *   same path gives the same numbers again: that's a bug, not a second roll).
 * - `stream(name)` — a long-lived **runtime** stream (drops, item procs, AI): seeded from the root
 *   too, isolated from structure, but its order follows the player's actions.
 */
export class RunRandom {
  private streams = new Map<string, Rng>();
  constructor(readonly root: number) {}

  fork(...path: (string | number)[]): Rng { return new Rng(hashPath(this.root, path)); }

  stream(name: RuntimeStream): Rng {
    let r = this.streams.get(name);
    if (!r) { r = this.fork('run', name); this.streams.set(name, r); }
    return r;
  }
}

/** Runtime streams: outcomes during play (no replay promise; isolated from structure). */
export type RuntimeStream = 'drops' | 'loot' | 'ai' | 'guard';
