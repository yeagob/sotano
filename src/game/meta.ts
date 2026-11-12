// The save record, version 2 (docs/design/not-built/progression/SAVE.md): what the player keeps between
// runs. The Roots' page, the achievements and their counts, and the staircase unlock the Spiked Entity
// opens (docs/architecture/SKY.md §10.3). Browser storage, like the language: a private window, blocked
// storage or cleared data simply read as the default, and no write ever throws.
//
// This module is pure: it touches no game state and no DOM beyond the default browser store. Nothing in
// the game loads or saves the record yet; that wiring is package D1 of #147. Generation never reads it.
// A version 1 record (only the unlock) is migrated on read and written back as version 2 at the next save.
// A record from a newer build reads as the default in read-only mode, and is never written over.

export const META_VERSION = 2;

export interface MetaState {
  v: 2;
  staircase: boolean;
  metAt?: number;
  roots: { page: number };
  achievements: Record<string, number>;
  counts: Record<string, number>;
}

/** What loadMeta returns. readOnly is set for a newer build's record: the game plays, earns nothing persistent and never writes. Never stored. */
export type LoadedMeta = MetaState & { readOnly?: boolean };

export interface MetaStore { read(): string | null; write(s: string): void }

const KEY = 'the-roots.meta';

/** The default record: page 1, no achievements, no counts, the staircase locked. */
export function defaultMeta(): MetaState {
  return { v: META_VERSION, staircase: false, roots: { page: 1 }, achievements: {}, counts: {} };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Keeps every field on its own: a bad one reads as its default and the others are kept. Unknown fields are dropped. */
function clean(input: unknown): MetaState {
  const o: Record<string, unknown> = isObj(input) ? input : {};
  const s = defaultMeta();
  s.staircase = o.staircase === true;
  if (typeof o.metAt === 'number' && Number.isFinite(o.metAt)) s.metAt = o.metAt;
  const roots = isObj(o.roots) ? o.roots : {};
  const page = roots.page;
  if (typeof page === 'number' && Number.isInteger(page) && page >= 1) s.roots.page = page;
  if (isObj(o.achievements)) {
    for (const [id, time] of Object.entries(o.achievements)) {
      if (typeof time === 'number' && Number.isFinite(time)) s.achievements[id] = time;
    }
  }
  if (isObj(o.counts)) {
    for (const [id, n] of Object.entries(o.counts)) {
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) s.counts[id] = n;
    }
  }
  return s;
}

/** The browser's localStorage under one key. Reads and writes never throw. */
export function localStore(key: string): MetaStore {
  return {
    read() {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    write(s) {
      try { localStorage.setItem(key, s); } catch { /* not remembered */ }
    },
  };
}

export const browserStore: MetaStore = localStore(KEY);

/**
 * Reads the record. Missing, broken or not-an-object records, and records without a version, read as the
 * default. A version 1 record is migrated. A newer version reads as the default with readOnly set.
 */
export function loadMeta(store: MetaStore = browserStore): LoadedMeta {
  try {
    const raw = store.read();
    if (raw === null) return defaultMeta();
    const o: unknown = JSON.parse(raw);
    if (!isObj(o) || typeof o.v !== 'number' || !Number.isInteger(o.v) || o.v < 1) return defaultMeta();
    if (o.v > META_VERSION) return { ...defaultMeta(), readOnly: true };
    if (o.v === 1) return clean({ staircase: o.staircase, metAt: o.metAt });
    return clean(o);
  } catch {
    return defaultMeta();
  }
}

/** Remembers the whole record as version 2. A read-only record is never written. If the store refuses, nothing is kept. */
export function saveMeta(s: MetaState | LoadedMeta, store: MetaStore = browserStore): void {
  if ((s as LoadedMeta).readOnly) return;
  try { store.write(JSON.stringify(clean(s))); } catch { /* not remembered */ }
}

/**
 * Forgets the Roots: page 1, no achievements, no counts. The staircase unlock and its time are kept.
 * Writes the result unless the record is read-only. Returns the new record.
 */
export function resetMeta(s: LoadedMeta, store: MetaStore = browserStore): LoadedMeta {
  const out: LoadedMeta = defaultMeta();
  out.staircase = s.staircase;
  if (s.metAt !== undefined) out.metAt = s.metAt;
  if (s.readOnly) out.readOnly = true;
  saveMeta(out, store);
  return out;
}
