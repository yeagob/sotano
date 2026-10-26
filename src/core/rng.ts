// Seeded deterministic RNG, with one independent stream per purpose
// (so shooting more does not change which items drop; see docs/TECHNICAL.md §1.7).

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

export type StreamName = 'loot' | 'drops' | 'combat' | 'items' | 'fx';

/** One Rng per purpose, all derived from the run seed. */
export class RunRng {
  private streams = new Map<string, Rng>();
  constructor(readonly seed: number) {}
  get(name: StreamName): Rng { return this.named(name); }

  /** A stream for any name (e.g. "floor3:rooms"), so each floor's layout is independent of when it is generated. */
  named(name: string): Rng {
    let r = this.streams.get(name);
    if (!r) { r = new Rng(this.seed ^ hashStr(name)); this.streams.set(name, r); }
    return r;
  }
}
