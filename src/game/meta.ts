// The save record, version 2 (docs/design/built/progression/SAVE.md): what the player keeps between
// runs. The Roots' page, the achievements and their counts, and the staircase unlock the Spiked Entity
// opens (docs/architecture/SKY.md §10.3). Browser storage, like the language: a private window, blocked
// storage or cleared data simply read as the default, and no write ever throws.
//
// This module is pure: it touches no game state and no DOM beyond the default browser store. main.ts loads
// the record once and hands it to the game with the browser store (game.ts `GameSave`); the sandbox, the lab
// and the tests use an in-memory record with `noStore`. Generation never reads it: the game passes the page
// and, later, the mastery level to the carving. A version 1 record (only the unlock) is migrated on read and
// written back as version 2 at the next save. A record from a newer build reads as the default in read-only
// mode, and is never written over.

export const META_VERSION = 2;

export interface MetaState {
  v: 2;
  staircase: boolean;
  metAt?: number;
  roots: { page: number };
  achievements: Record<string, number>;
  counts: Record<string, number>;
  /** The player has made the Listener's pact at least once (the first pact, ACHIEVEMENTS "Mind Crafter"). Optional: absent means not yet. */
  pact?: true;
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
  if (o.pact === true) s.pact = true;
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

/** A store that keeps nothing: the sandbox, the lab and the tests play on an in-memory record and never write. */
export const noStore: MetaStore = { read: () => null, write: () => undefined };

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

/**
 * The union of the record in the store and the one this tab holds (SAVE §3): every unlocked achievement, at the earlier
 * of its two times; the higher page; the higher count of each counter, except those of achievements now unlocked; the
 * staircase unlock if either has it; the earlier time of the staircase. Both inputs are clean records.
 */
export function mergeMeta(stored: MetaState, mine: MetaState): MetaState {
  const achievements: Record<string, number> = { ...stored.achievements };
  for (const [id, time] of Object.entries(mine.achievements)) {
    achievements[id] = id in achievements ? Math.min(achievements[id], time) : time;
  }
  const counts: Record<string, number> = {};
  for (const source of [stored.counts, mine.counts]) {
    for (const [id, n] of Object.entries(source)) counts[id] = Math.max(counts[id] ?? 0, n);
  }
  for (const id of Object.keys(achievements)) delete counts[id];
  const out: MetaState = {
    v: META_VERSION,
    staircase: stored.staircase || mine.staircase,
    roots: { page: Math.max(stored.roots.page, mine.roots.page) },
    achievements,
    counts,
  };
  if (stored.pact || mine.pact) out.pact = true;
  const times = [stored.metAt, mine.metAt].filter((t): t is number => t !== undefined);
  if (times.length) out.metAt = Math.min(...times);
  return out;
}

/**
 * Remembers the record as version 2, merged with what the store holds at this moment (SAVE §3): two tabs never overwrite
 * each other's progress. A store holding a newer build's record is never written over, and a read-only record is never
 * written. If the store refuses, nothing is kept. Returns the merged record now in the store, or undefined when nothing
 * was written; the caller may take it over as its own.
 */
export function saveMeta(s: MetaState | LoadedMeta, store: MetaStore = browserStore): MetaState | undefined {
  if ((s as LoadedMeta).readOnly) return undefined;
  try {
    const stored = loadMeta(store);
    if (stored.readOnly) return undefined;
    const merged = mergeMeta(clean(stored), clean(s));
    store.write(JSON.stringify(merged));
    return merged;
  } catch {
    return undefined;
  }
}

/** Copies a record into the one this tab holds, so the tab's later saves and unlocks see what the store holds. */
export function adoptMeta(target: LoadedMeta, from: MetaState): void {
  target.staircase = from.staircase;
  if (from.metAt !== undefined) target.metAt = from.metAt; else delete target.metAt;
  target.roots = { page: from.roots.page };
  target.achievements = { ...from.achievements };
  target.counts = { ...from.counts };
  if (from.pact) target.pact = true; else delete target.pact;
}

/**
 * Forgets the Roots: page 1, no achievements, no counts. The staircase unlock and its time are kept. This is the one write
 * that is not merged: the stored achievements and page are replaced, as the debug reset means (SAVE §4). Nothing is written
 * over a newer build's record or from a read-only record. Returns the new record.
 */
export function resetMeta(s: LoadedMeta, store: MetaStore = browserStore): LoadedMeta {
  const out: LoadedMeta = defaultMeta();
  out.staircase = s.staircase;
  if (s.metAt !== undefined) out.metAt = s.metAt;
  if (s.readOnly || loadMeta(store).readOnly) { out.readOnly = true; return out; }
  try { store.write(JSON.stringify(clean(out))); } catch { /* not remembered */ }
  return out;
}
