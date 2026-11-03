// The sky's materialised chunks (docs/architecture/SKY.md §3.2): an LRU cache of CHUNK³ buffers
// with a memo of the last chunk read. A read of the memoised chunk costs one comparison and never
// touches the LRU order; only a memo miss that finds the chunk in the map moves it to the young end
// [m4]. Eviction drops the buffers only: the world's exceptions live elsewhere, so nothing is lost.

/** One materialised chunk: blocks, and the element layer only for chunks that hold an element. */
export interface SkyChunk {
  readonly blocks: Uint8Array;
  elem: Uint8Array | null;
}

/** The default cap: 1 024 chunks of 4 KB (§3.6). */
export const CACHE_CHUNKS = 1024;

export class ChunkCache {
  private readonly map = new Map<number, SkyChunk>();
  /** The memo: the last chunk read (it may be a shared read-only empty chunk that is not in the map). */
  lastKey = -1;
  last: SkyChunk | null = null;
  /** Called with each chunk the cap pushes out. */
  onEvict: ((key: number, c: SkyChunk) => void) | null = null;

  constructor(readonly cap = CACHE_CHUNKS) {}

  get size() { return this.map.size; }
  has(key: number) { return this.map.has(key); }

  /** The memo, or the map (moved to the young end and memoised); undefined when not materialised. */
  get(key: number): SkyChunk | undefined {
    if (key === this.lastKey) return this.last!;
    const c = this.map.get(key);
    if (!c) return undefined;
    this.map.delete(key);
    this.map.set(key, c);
    this.lastKey = key; this.last = c;
    return c;
  }

  /** The map only: no touch, no memo (reading a neighbour's border must not keep it alive). */
  peek(key: number): SkyChunk | undefined { return this.map.get(key); }

  /** Stores a freshly materialised chunk, memoises it, and evicts the oldest past the cap. */
  put(key: number, c: SkyChunk) {
    this.map.delete(key);
    this.map.set(key, c);
    this.lastKey = key; this.last = c;
    while (this.map.size > Math.max(1, this.cap)) {
      const [k, old] = this.map.entries().next().value as [number, SkyChunk];
      this.map.delete(k);
      this.onEvict?.(k, old);
    }
  }

  /** Memoises a chunk without storing it (the shared empty chunk). */
  remember(key: number, c: SkyChunk) { this.lastKey = key; this.last = c; }

  /** Forgets the memo when it is this chunk (a chunk that was empty gained content). */
  forget(key: number) { if (this.lastKey === key) { this.lastKey = -1; this.last = null; } }

  delete(key: number) { this.forget(key); this.map.delete(key); }
  clear() { this.map.clear(); this.lastKey = -1; this.last = null; }
  keys() { return this.map.keys(); }
}
