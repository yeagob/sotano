// The meta record (docs/architecture/SKY.md §10.3): a round trip through a store, and every bad
// record reads as the default: no unlock, never an error.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStore, loadMeta, saveMeta, type MetaStore } from '../src/game/meta';

/** An in-memory store that remembers the last string written. */
function memory(initial: string | null = null): MetaStore & { value: string | null } {
  const m = {
    value: initial,
    read() { return m.value; },
    write(s: string) { m.value = s; },
  };
  return m;
}

const DEFAULT = { v: 1, staircase: false };

describe('loadMeta and saveMeta', () => {
  it('reads the default when nothing was saved', () => {
    expect(loadMeta(memory())).toEqual(DEFAULT);
  });

  it('round-trips the unlock and the time it was met', () => {
    const store = memory();
    saveMeta({ v: 1, staircase: true, metAt: 1234 }, store);
    expect(loadMeta(store)).toEqual({ v: 1, staircase: true, metAt: 1234 });
  });

  it('round-trips the default unlock without a time', () => {
    const store = memory();
    saveMeta({ v: 1, staircase: false }, store);
    expect(loadMeta(store)).toEqual(DEFAULT);
    expect(loadMeta(store).metAt).toBeUndefined();
  });

  it('reads broken JSON as the default', () => {
    expect(loadMeta(memory('{not json'))).toEqual(DEFAULT);
    expect(loadMeta(memory(''))).toEqual(DEFAULT);
  });

  it('reads non-object JSON as the default', () => {
    for (const raw of ['null', '42', '"staircase"', 'true', '[]']) {
      expect(loadMeta(memory(raw))).toEqual(DEFAULT);
    }
  });

  it('reads an unknown or newer version as the default, even with the unlock set', () => {
    expect(loadMeta(memory(JSON.stringify({ v: 2, staircase: true })))).toEqual(DEFAULT);
    expect(loadMeta(memory(JSON.stringify({ v: 0, staircase: true })))).toEqual(DEFAULT);
    expect(loadMeta(memory(JSON.stringify({ staircase: true })))).toEqual(DEFAULT);
  });

  it('reads a non-boolean unlock as locked and drops a non-numeric time', () => {
    expect(loadMeta(memory(JSON.stringify({ v: 1, staircase: 'yes' })))).toEqual(DEFAULT);
    expect(loadMeta(memory(JSON.stringify({ v: 1, staircase: true, metAt: 'soon' })))).toEqual({ v: 1, staircase: true });
  });

  it('reads a store that throws on read as the default', () => {
    const throwing: MetaStore = { read() { throw new Error('blocked'); }, write() {} };
    expect(loadMeta(throwing)).toEqual(DEFAULT);
  });

  it('does not throw when the store refuses a write', () => {
    const refusing: MetaStore = { read: () => null, write() { throw new Error('quota'); } };
    expect(() => saveMeta({ v: 1, staircase: true }, refusing)).not.toThrow();
  });
});

describe('browserStore', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the record under the-roots.meta in localStorage', () => {
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => { items.set(k, v); },
    });
    saveMeta({ v: 1, staircase: true, metAt: 7 }, browserStore);
    expect(JSON.parse(items.get('the-roots.meta') ?? 'null')).toEqual({ v: 1, staircase: true, metAt: 7 });
    expect(loadMeta(browserStore)).toEqual({ v: 1, staircase: true, metAt: 7 });
  });

  it('reads as no unlock and never throws when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
    });
    expect(loadMeta(browserStore)).toEqual(DEFAULT);
    expect(() => saveMeta({ v: 1, staircase: true }, browserStore)).not.toThrow();
  });

  it('reads as no unlock when there is no localStorage at all (node)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(browserStore.read()).toBeNull();
    expect(() => browserStore.write('{}')).not.toThrow();
    expect(loadMeta(browserStore)).toEqual(DEFAULT);
  });
});
