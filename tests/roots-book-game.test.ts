// The Roots' book in a run (docs/design/not-built/levels/roots/PAGES.md, EASY-LAYOUT.md, package D1): the run's keeper
// reads the save, lays the layout, shows the page, turns the walls out of sight, advances the page once at a run's
// end and writes the record through its store. The game (game.ts) feeds the keeper from its rooms and its frames;
// these tests drive the same keeper with the rooms of a carved floor 0, a recording wall and a memory store, since
// the game itself needs WebGL. The browser check of the wiring is in the D1 report.

import { describe, expect, it } from 'vitest';
import { loadBook, pageCount, panelAt, type Book, type BookLayout, type Panel, type RoomKey, type Side } from '../src/content/book';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import { loadMeta, type MetaStore } from '../src/game/meta';
import { openRoots, roomKeyOf, RootsKeeper, type RootsCell, type WallImages, type WallSink } from '../src/game/roots-keeper';
import { LAP_STEPS } from '../src/game/roots-book';
import type { RoomInfo } from '../src/world/floor';
import { buildRun } from './helpers';

const HALL = 'roots-hall', STEP = 'roots-step', DIG = 'roots-dig', MEND = 'roots-mend', PIT = 'roots-pit';
const BRIDGE = 'roots-bridge', SEAL = 'roots-seal', CRATES = 'roots-crates', SPRING = 'roots-spring';
const GIFT = 'roots-gift', DOOR = 'roots-door';

/** The whole route of a run: every ring room in forward order from the start room, then the way down. */
const FULL = [STEP, DIG, MEND, PIT, BRIDGE, SEAL, CRATES, SPRING, GIFT, HALL, DOOR];
/** One forward lap from the start room: the ring in forward order, back to the start. */
const LAP_FORWARD = [STEP, DIG, MEND, PIT, BRIDGE, SEAL, CRATES, SPRING, GIFT, HALL];
/** One reverse lap from the start room. */
const LAP_BACK = [GIFT, SPRING, CRATES, SEAL, BRIDGE, PIT, MEND, DIG, STEP, HALL];

const book: Book = loadBook('en');
const ROOT = 1;

/** A memory store, counting its writes. */
function memory(initial: string | null = null) {
  const m = {
    value: initial,
    writes: 0,
    read() { return m.value; },
    write(s: string) { m.writes++; m.value = s; },
  };
  return m as MetaStore & { value: string | null; writes: number };
}

/** The save as a store holds it, at a page. */
const saved = (page: number) => JSON.stringify({ v: 2, staircase: false, roots: { page }, achievements: {}, counts: {} });

/** The rooms of floor 0 by key, carved with or without the easy layout (buildRun's own carve, no mastery). */
function floor0(easy: boolean): Map<RoomKey, RoomInfo> {
  const run = buildRun(ROOT, 1, undefined, { easyRoots: easy });
  return new Map(run.floors[0].rooms.map(r => [roomKeyOf(r), r] as const));
}

/** The plan cell of a Roots room key, as the game's room entry passes it. */
function cell(rooms: Map<RoomKey, RoomInfo>, key: string): RootsCell {
  const r = rooms.get(key as RoomKey);
  if (!r) throw new Error(`no room ${key}`);
  return r;
}

/** Enters the rooms in turn, by key. */
function walk(keeper: RootsKeeper, rooms: Map<RoomKey, RoomInfo>, keys: readonly string[]): void {
  for (const k of keys) keeper.enterRoom(cell(rooms, k));
}

interface Call { room: RoomKey; side: Side; id: string; page: number }

/** A wall that records every carve and every stone change. */
function recorder() {
  const calls: Call[] = [];
  const stones: (number | null)[] = [];
  const sink: WallSink = {
    show: (room, side, panel: Panel, page) => { calls.push({ room, side, id: panel.id, page }); },
    stone: page => { stones.push(page); },
  };
  return { sink, calls, stones };
}

/** The last carve of a room's side, or undefined. */
const last = (calls: readonly Call[], room: string, side: Side): Call | undefined =>
  [...calls].reverse().find(c => c.room === room && c.side === side);

/** A run's keeper on a saved page, with its store, the wall and the loads the images asked for. */
function openAt(page: number, opts: { inView?: (room: RoomKey) => boolean; store?: ReturnType<typeof memory> } = {}) {
  const store = opts.store ?? memory(saved(page));
  const record = loadMeta(store);
  const loads: { page: number; layout: BookLayout }[] = [];
  const images: WallImages = {
    preloadPage: (_book, p, layout) => { loads.push({ page: p, layout }); return Promise.resolve(); },
  };
  const keeper = openRoots(false, { record, store, book: () => book, images, inView: opts.inView ?? (() => false) })!;
  const wall = recorder();
  return { keeper, store, record, wall, loads };
}

describe('a run starts on the saved page', () => {
  it('shows the saved page on every wall, in the layout the page picks', () => {
    const { keeper, wall } = openAt(4);
    expect(keeper.current).toBe(4);
    expect(keeper.shown).toBe(4);
    expect(keeper.variant).toBe('easy');
    keeper.update(wall.sink);
    expect(wall.calls).toHaveLength(22);
    for (const c of wall.calls) {
      const want = panelAt(book, 4, c.room, c.side, 'easy');
      expect(c.id, `${c.room} ${c.side}`).toBe(want.id);
      expect(c.page).toBe(4);
    }
  });

  it('draws the page stone from page 7 on, and hides it on the tutorial pages', () => {
    const late = openAt(7);
    late.keeper.update(late.wall.sink);
    expect(late.wall.stones.at(-1)).toBe(7);
    const tutorial = openAt(6);
    tutorial.keeper.update(tutorial.wall.sink);
    expect(tutorial.wall.stones.at(-1)).toBe(null);
  });

  it('starts loading the shown page and its neighbours in the run’s layout', () => {
    const { keeper, loads } = openAt(3);
    void keeper.preload();
    expect(loads[0]).toEqual({ page: 3, layout: 'easy' });
    expect(loads.map(l => l.page).sort()).toEqual([2, 3, 4]);
  });

  it('keeps no walls and writes nothing in the sandbox', () => {
    const store = memory(saved(3));
    const keeper = openRoots(true, { record: loadMeta(store), store, book: () => book, images: { preloadPage: () => Promise.resolve() }, inView: () => false });
    expect(keeper).toBeUndefined();
    expect(store.writes).toBe(0);
  });
});

describe('the layout the page picks', () => {
  it('page 1 is carved in the teaching layout, page 2 in the easy one', () => {
    const a = openAt(1).keeper;
    expect(a.easyRoots).toBe(false);
    expect(a.variant).toBe('teaching');
    const teaching = [...floor0(a.easyRoots).values()].map(r => r.template);
    expect(teaching.some(t => t.endsWith('-easy'))).toBe(false);

    const b = openAt(2).keeper;
    expect(b.easyRoots).toBe(true);
    expect(b.variant).toBe('easy');
    const easy = [...floor0(b.easyRoots).values()].map(r => r.template);
    expect(easy.filter(t => t.endsWith('-easy'))).toHaveLength(6);
  });

  it('names the rooms by their plan cell in both layouts, never by the easy template id', () => {
    const rooms = floor0(true);
    const pit = rooms.get(PIT)!;
    expect(pit.template).toBe('roots-pit-easy');
    expect(roomKeyOf(pit)).toBe(PIT);
    expect(rooms.size).toBe(11);
  });

  it('the advance at a run’s end changes the next run’s layout, never the run that ends', () => {
    const first = openAt(1);
    walk(first.keeper, floor0(false), FULL);
    expect(first.keeper.endRun()).toBe(2);
    expect(first.keeper.easyRoots).toBe(false);
    expect(first.keeper.variant).toBe('teaching');
    const next = openRoots(false, { record: loadMeta(first.store), store: first.store, book: () => book, images: { preloadPage: () => Promise.resolve() }, inView: () => false })!;
    expect(next.easyRoots).toBe(true);
  });
});

describe('the advance of the page', () => {
  it('a run that walks the whole Roots advances the page once, saves it at once, and a death after it does not advance twice', () => {
    const a = openAt(1);
    const rooms = floor0(false);
    walk(a.keeper, rooms, FULL);
    expect(a.store.writes).toBe(0);
    expect(a.keeper.endRun()).toBe(2);
    expect(a.store.writes).toBe(1);
    expect(loadMeta(a.store).roots.page).toBe(2);
    // R after the death: the run is already ended, nothing advances and nothing is written again
    expect(a.keeper.endRun()).toBeUndefined();
    expect(a.store.writes).toBe(1);
    expect(loadMeta(a.store).roots.page).toBe(2);
  });

  it('a run that stops short of the way down, or misses a ring room, advances nothing', () => {
    const rooms = floor0(false);
    const short = openAt(1);
    walk(short.keeper, rooms, FULL.slice(0, -1));
    expect(short.keeper.endRun()).toBeUndefined();
    const missed = openAt(1);
    walk(missed.keeper, rooms, FULL.filter(k => k !== SEAL));
    expect(missed.keeper.endRun()).toBeUndefined();
    expect(missed.store.writes).toBe(0);
  });

  it('the page stops at the last page of the book', () => {
    const last = pageCount(book);
    const a = openAt(last);
    walk(a.keeper, floor0(true), FULL);
    expect(a.keeper.endRun()).toBeUndefined();
    expect(a.store.writes).toBe(0);
  });

  it('a read-only record (a newer build’s) advances nothing that persists', () => {
    const store = memory(JSON.stringify({ v: 3, roots: { page: 4 } }));
    const record = loadMeta(store);
    expect(record.readOnly).toBe(true);
    const keeper = openRoots(false, { record, store, book: () => book, images: { preloadPage: () => Promise.resolve() }, inView: () => false })!;
    walk(keeper, floor0(false), FULL);
    expect(keeper.endRun()).toBeUndefined();
    expect(store.writes).toBe(0);
  });
});

describe('laps: the walls turn only out of sight', () => {
  it('a reverse lap shows the previous page on the far rooms, and the room the player stands in keeps its page', () => {
    const a = openAt(3);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    walk(a.keeper, rooms, LAP_BACK);
    expect(a.keeper.shown).toBe(2);
    const before = a.wall.calls.length;
    a.keeper.update(a.wall.sink);
    const turned = a.wall.calls.slice(before);
    // the start room is in its own sight: it keeps page 3 (no carve for it)
    expect(turned.some(c => c.room === HALL)).toBe(false);
    // a far room, out of sight of the start room, turns at once
    expect(last(turned, PIT, 'north')?.page).toBe(2);
    expect(last(turned, PIT, 'south')?.page).toBe(2);
  });

  it('a forward lap after that turns a far room to the next page, and not the room the player stands in', () => {
    const a = openAt(3);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    walk(a.keeper, rooms, LAP_BACK);
    a.keeper.update(a.wall.sink);
    walk(a.keeper, rooms, LAP_FORWARD);
    expect(a.keeper.shown).toBe(3);
    const before = a.wall.calls.length;
    a.keeper.update(a.wall.sink);
    const turned = a.wall.calls.slice(before);
    expect(last(turned, PIT, 'north')?.page).toBe(3);
    expect(turned.some(c => c.room === HALL)).toBe(false);
  });

  it('a room the camera sees keeps its page until the view moves away', () => {
    let seen = true;
    const a = openAt(3, { inView: room => seen && room === PIT });
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    walk(a.keeper, rooms, LAP_BACK);
    a.keeper.update(a.wall.sink);
    expect(a.wall.calls.some(c => c.room === PIT && c.page === 2)).toBe(false);
    seen = false;
    a.keeper.update(a.wall.sink);
    expect(last(a.wall.calls, PIT, 'north')?.page).toBe(2);
  });

  it('a partial lap does nothing', () => {
    const a = openAt(3);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    const before = a.wall.calls.length;
    walk(a.keeper, rooms, LAP_BACK.slice(0, LAP_STEPS - 1));
    a.keeper.update(a.wall.sink);
    expect(a.keeper.shown).toBe(3);
    expect(a.wall.calls.length).toBe(before);
  });
});

describe('the easy layout’s remembered panels', () => {
  it('the dig room’s south wall shows the remembered panel on page 2, and still after browsing back to page 1', () => {
    const a = openAt(2);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    expect(last(a.wall.calls, DIG, 'south')?.id).toBe('easy-dig-s');
    expect(last(a.wall.calls, DIG, 'north')?.id).toBe(panelAt(book, 2, DIG, 'north', 'easy').id);
    walk(a.keeper, rooms, LAP_BACK);
    expect(a.keeper.shown).toBe(1);
    a.keeper.update(a.wall.sink);
    expect(last(a.wall.calls, DIG, 'south')?.id).toBe('easy-dig-s');
    expect(last(a.wall.calls, DIG, 'south')?.page).toBe(1);
  });

  it('walking every room of the easy Roots completes the visit (the keys are the cells, not the easy ids)', () => {
    const a = openAt(2);
    const rooms = floor0(true);
    walk(a.keeper, rooms, FULL);
    expect(a.keeper.endRun()).toBe(3);
  });
});

describe('the page stone', () => {
  it('follows the start room rule: it keeps its number while the player is in sight, and turns once they leave', () => {
    const a = openAt(8);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    expect(a.wall.stones.at(-1)).toBe(8);
    // the lap ends in the start room: the stone is in its own sight and keeps page 8
    walk(a.keeper, rooms, LAP_BACK);
    a.keeper.update(a.wall.sink);
    expect(a.keeper.shown).toBe(7);
    expect(a.wall.stones.at(-1)).toBe(8);
    // the player walks into the dig room, which cannot see the start room: the stone turns to 7
    walk(a.keeper, rooms, [DIG]);
    a.keeper.update(a.wall.sink);
    expect(a.wall.stones.at(-1)).toBe(7);
  });

  it('goes blank when the walls turn to a tutorial page', () => {
    const a = openAt(7);
    const rooms = floor0(true);
    a.keeper.update(a.wall.sink);
    walk(a.keeper, rooms, LAP_BACK);
    walk(a.keeper, rooms, [DIG]);
    a.keeper.update(a.wall.sink);
    expect(a.keeper.shown).toBe(6);
    expect(a.wall.stones.at(-1)).toBe(null);
  });
});

describe('the debug page (S.roots) is an override that never reaches the save', () => {
  /** A run started on `startPage` (the console's override) over the saved `page`, with its store. */
  function overridden(page: number, startPage: number) {
    const store = memory(saved(page));
    const record = loadMeta(store);
    const keeper = openRoots(false, {
      record, store, book: () => book, images: { preloadPage: () => Promise.resolve() }, inView: () => false, startPage,
    })!;
    return { keeper, store, record };
  }

  it('the run starts on the override page and lays its layout, the save keeps its own page', () => {
    const a = overridden(1, 3);
    expect(a.keeper.current).toBe(3);
    expect(a.keeper.shown).toBe(3);
    expect(a.keeper.easyRoots).toBe(true);
    expect(a.record.roots.page).toBe(1);
  });

  it('a run started on the override walks the whole Roots and advances nothing, in memory or in the store', () => {
    const a = overridden(1, 3);
    walk(a.keeper, floor0(true), FULL);
    expect(a.keeper.endRun()).toBeUndefined();
    expect(a.store.writes).toBe(0);
    expect(a.record.roots.page).toBe(1);
    expect(loadMeta(a.store).roots.page).toBe(1);
  });

  it('an achievement saved in an overridden run writes the save page, never the debug page', () => {
    const a = overridden(1, 5);
    const keeper = new AchievementKeeper(a.record, a.store);
    keeper.track('brew', {}, 1_700_000_000_000);
    expect(a.store.writes).toBe(1);
    expect(loadMeta(a.store).roots.page).toBe(1);
    expect(Object.keys(loadMeta(a.store).achievements)).toContain('brew.first');
  });
});
