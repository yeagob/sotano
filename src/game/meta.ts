// Meta-progression: what the player keeps between runs (docs/architecture/SKY.md §10.3). For now
// it is one unlock, the staircase the Spiked Entity opens. Browser storage, like the language: a
// private window, blocked storage or cleared data simply read as no unlock. Generation never reads
// it; main.ts loads it once and passes the option to newRun.

export interface MetaState { v: 1; staircase: boolean; metAt?: number }
export interface MetaStore { read(): string | null; write(s: string): void }

const KEY = 'the-roots.meta';

function fresh(): MetaState {
  return { v: 1, staircase: false };
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

/** A missing, broken or newer record reads as the default. */
export function loadMeta(store: MetaStore = browserStore): MetaState {
  try {
    const raw = store.read();
    if (raw === null) return fresh();
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || o.v !== 1) return fresh();
    const s: MetaState = { v: 1, staircase: o.staircase === true };
    if (typeof o.metAt === 'number' && Number.isFinite(o.metAt)) s.metAt = o.metAt;
    return s;
  } catch {
    return fresh();
  }
}

/** Remembers the record. If the store refuses, the unlock is simply not kept. */
export function saveMeta(s: MetaState, store: MetaStore = browserStore): void {
  const out: MetaState = { v: 1, staircase: s.staircase === true };
  if (s.metAt !== undefined) out.metAt = s.metAt;
  try { store.write(JSON.stringify(out)); } catch { /* not remembered */ }
}
