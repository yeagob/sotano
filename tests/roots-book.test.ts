// The Roots' book as a pure state machine (docs/design/built/levels/roots/PAGES.md): the page
// the walls show, when the page advances, laps of the ring, the sight sets, the out-of-sight swap
// rule and the page stone.

import { describe, expect, it } from 'vitest';
import { FIRST_BOOK_PAGE, LAP_STEPS, RootsBook, rootsLayout } from '../src/game/roots-book';

const HALL = 'roots-hall', STEP = 'roots-step', DIG = 'roots-dig', MEND = 'roots-mend', PIT = 'roots-pit';
const BRIDGE = 'roots-bridge', SEAL = 'roots-seal', CRATES = 'roots-crates', SPRING = 'roots-spring';
const GIFT = 'roots-gift', DOOR = 'roots-door';
const OUT = 'floor-1-room';

/** The ring in forward order, starting at the start room (index 0). */
const RING = [HALL, STEP, DIG, MEND, PIT, BRIDGE, SEAL, CRATES, SPRING, GIFT];
/** The whole route of a run: every ring room and the way down. */
const FULL = [STEP, DIG, MEND, PIT, BRIDGE, SEAL, CRATES, SPRING, GIFT, HALL, DOOR];

/** The sight sets of PAGES §3, written out as the table reads. */
const TABLE: Record<string, string[]> = {
  [HALL]: [HALL, GIFT, STEP, DOOR],
  [STEP]: [STEP, HALL, GIFT, DIG, MEND, PIT],
  [DIG]: [DIG, STEP, MEND, PIT],
  [MEND]: [MEND, STEP, DIG, PIT],
  [PIT]: [PIT, STEP, DIG, MEND, BRIDGE, SEAL],
  [BRIDGE]: [BRIDGE, PIT, SEAL],
  [SEAL]: [SEAL, BRIDGE, PIT, CRATES, SPRING, GIFT],
  [CRATES]: [CRATES, SEAL, SPRING, GIFT],
  [SPRING]: [SPRING, SEAL, CRATES, GIFT],
  [GIFT]: [GIFT, SEAL, CRATES, SPRING, HALL, STEP],
  [DOOR]: [DOOR, HALL],
};

const L = rootsLayout();

/** The ring room `i` steps from the start room (wraps around the ring). */
const at = (i: number): string => RING[((i % RING.length) + RING.length) % RING.length];

/** The rooms of `n` moves from ring index `from`, one per move; dir +1 is forward, -1 reverse. */
function moves(from: number, dir: 1 | -1, n: number): string[] {
  return Array.from({ length: n }, (_, k) => at(from + dir * (k + 1)));
}

/** Enter each room in turn. */
function walk(book: RootsBook, rooms: readonly string[]): void {
  for (const room of rooms) book.enterRoom(room);
}

/** A forward lap that starts at ring room `s`: walk there from the start room, then go round. */
const forwardLapFrom = (book: RootsBook, s: number): void => {
  walk(book, moves(0, 1, s));
  walk(book, moves(s, 1, LAP_STEPS));
};

/** A reverse lap that starts at ring room `s`: walk there backwards from the start room, then go round. */
const reverseLapFrom = (book: RootsBook, s: number): void => {
  walk(book, moves(0, -1, (LAP_STEPS - s) % LAP_STEPS));
  walk(book, moves(s, -1, LAP_STEPS));
};

/** A book whose run starts at the saved page; `visible` is the camera's view. */
function makeBook(current: number, pages = 9, visible: Set<string> = new Set()): RootsBook {
  return new RootsBook({ pages, current, inView: room => visible.has(room) });
}

/** The page every room shows now (asked the way the game asks each frame). */
const wall = (book: RootsBook): Record<string, number> =>
  Object.fromEntries(L.rooms.map(room => [room, book.wallPage(room)]));

describe('the Roots layout, derived from the plan', () => {
  it('the ring is the ten rooms in forward order, east from the start room first', () => {
    expect(L.ring).toEqual(RING);
    expect(L.start).toBe(HALL);
    expect(L.door).toBe(DOOR);
    expect(L.rooms).toEqual([...RING, DOOR]);
  });

  it('the sight sets equal the table in PAGES section 3', () => {
    expect(Object.keys(L.sight).sort()).toEqual(Object.keys(TABLE).sort());
    for (const [room, seen] of Object.entries(TABLE)) {
      expect([...L.sight[room]].sort(), room).toEqual([...seen].sort());
    }
  });

  it('a room is in its own sight set, and a room behind a rock or round a corner is not seen', () => {
    for (const room of L.rooms) expect(L.sight[room]).toContain(room);
    expect(L.sight[DIG]).not.toContain(BRIDGE);
    expect(L.sight[HALL]).not.toContain(SEAL);
  });
});

describe('laps of the ring', () => {
  it('a forward lap from any ring room shows the next page', () => {
    for (let s = 0; s < RING.length; s++) {
      const book = makeBook(9);
      reverseLapFrom(book, 0);
      reverseLapFrom(book, 0);
      expect(book.shown, `before lap from ${s}`).toBe(7);
      forwardLapFrom(book, s);
      expect(book.shown, `forward lap from ${RING[s]}`).toBe(8);
    }
  });

  it('a reverse lap from any ring room shows the previous page', () => {
    for (let s = 0; s < RING.length; s++) {
      const book = makeBook(9);
      reverseLapFrom(book, s);
      expect(book.shown, `reverse lap from ${RING[s]}`).toBe(8);
    }
  });

  it('a lap starts counting in the room the player jumped to', () => {
    for (let s = 2; s <= 8; s++) {
      const book = makeBook(9);
      reverseLapFrom(book, 0);
      book.enterRoom(RING[s]);
      walk(book, moves(s, 1, LAP_STEPS - 1));
      expect(book.shown, `nine forward moves from ${RING[s]}`).toBe(8);
      book.enterRoom(at(s + LAP_STEPS));
      expect(book.shown, `tenth move back in ${RING[s]}`).toBe(9);
    }
  });

  it('a reverse lap started in a room reached by a jump fires on the tenth move back', () => {
    for (let s = 2; s <= 8; s++) {
      const book = makeBook(9);
      book.enterRoom(RING[s]);
      walk(book, moves(s, -1, LAP_STEPS - 1));
      expect(book.shown, `nine reverse moves from ${RING[s]}`).toBe(9);
      book.enterRoom(at(s - LAP_STEPS));
      expect(book.shown, `tenth move back in ${RING[s]}`).toBe(8);
    }
  });

  it('a lap on the current page does nothing, and page 1 does not go lower', () => {
    const atCurrent = makeBook(3);
    forwardLapFrom(atCurrent, 0);
    expect(atCurrent.shown).toBe(3);

    const first = makeBook(1);
    reverseLapFrom(first, 0);
    expect(first.shown).toBe(1);
  });

  it('browsing never goes beyond the current page nor below page 1', () => {
    const book = makeBook(3);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(2);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(1);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(1);
    forwardLapFrom(book, 0);
    expect(book.shown).toBe(2);
    forwardLapFrom(book, 0);
    expect(book.shown).toBe(3);
    forwardLapFrom(book, 0);
    expect(book.shown).toBe(3);
  });

  it('a partial lap does nothing', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    walk(book, moves(0, 1, LAP_STEPS - 1));
    expect(book.shown).toBe(8);
  });

  it('walking back and forth does nothing, however long', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    for (let i = 0; i < 30; i++) walk(book, [DIG, STEP]);
    expect(book.shown).toBe(8);
  });

  it('a jump between rooms that are not neighbours starts the count again', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    walk(book, [STEP, DIG, MEND, PIT]);
    book.enterRoom(CRATES);
    walk(book, moves(7, 1, LAP_STEPS - 1));
    expect(book.shown).toBe(8);
    book.enterRoom(CRATES);
    expect(book.shown).toBe(9);
  });

  it('the way down is ignored, and so is any room outside the Roots', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    book.enterRoom(DOOR);
    book.enterRoom(STEP);
    walk(book, [DIG, MEND, PIT, BRIDGE, SEAL, CRATES, SPRING, GIFT]);
    expect(book.shown).toBe(8);
    book.enterRoom(HALL);
    expect(book.shown).toBe(9);
  });

  it('going down and climbing back in the middle of a lap keeps the count', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    book.enterRoom(SPRING);
    walk(book, [GIFT, HALL, DOOR, OUT, DOOR, HALL, STEP, DIG, MEND, PIT, BRIDGE, SEAL, CRATES]);
    expect(book.shown).toBe(8);
    book.enterRoom(SPRING);
    expect(book.shown).toBe(9);
  });
});

describe('when the page advances', () => {
  it('a run that enters every room of the Roots advances the current page once it ends', () => {
    const book = makeBook(1);
    walk(book, FULL);
    expect(book.endRun()).toBe(true);
    expect(book.current).toBe(2);
  });

  it('a run that misses the way down, or any ring room, does not advance', () => {
    const noDoor = makeBook(1);
    walk(noDoor, FULL.filter(room => room !== DOOR));
    expect(noDoor.endRun()).toBe(false);
    expect(noDoor.current).toBe(1);

    const noCrates = makeBook(1);
    walk(noCrates, FULL.filter(room => room !== CRATES));
    expect(noCrates.endRun()).toBe(false);
    expect(noCrates.current).toBe(1);
  });

  it('a death after the whole route advances once; R after the death does not advance again', () => {
    const book = makeBook(1);
    walk(book, FULL);
    expect(book.endRun()).toBe(true);
    book.startRun();
    expect(book.current).toBe(2);
    expect(book.endRun()).toBe(false);
    expect(book.current).toBe(2);
  });

  it('R ends a complete run and advances it once; the run it starts advances nothing by itself', () => {
    const book = makeBook(1);
    walk(book, FULL);
    book.startRun();
    expect(book.current).toBe(2);
    expect(book.endRun()).toBe(false);
    expect(book.current).toBe(2);
  });

  it('the visited rooms belong to one run', () => {
    const book = makeBook(1);
    walk(book, FULL.filter(room => room !== DOOR));
    book.startRun();
    walk(book, FULL.filter(room => room !== CRATES));
    expect(book.endRun()).toBe(false);
    expect(book.current).toBe(1);
  });

  it('rooms visited stay counted after the player goes down', () => {
    const book = makeBook(1);
    walk(book, FULL);
    book.enterRoom(OUT);
    expect(book.endRun()).toBe(true);
    expect(book.current).toBe(2);
  });

  it('the advance is one page from the current page, even after browsing back', () => {
    const book = makeBook(3);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(2);
    walk(book, [DOOR]);
    expect(book.endRun()).toBe(true);
    expect(book.current).toBe(4);
    expect(book.shown).toBe(2);
    book.startRun();
    expect(book.shown).toBe(4);
  });

  it('the current page never goes past the last page of the book', () => {
    const last = makeBook(3, 3);
    walk(last, FULL);
    expect(last.endRun()).toBe(false);
    expect(last.current).toBe(3);

    const beforeLast = makeBook(2, 3);
    walk(beforeLast, FULL);
    expect(beforeLast.endRun()).toBe(true);
    expect(beforeLast.current).toBe(3);
    beforeLast.startRun();
    walk(beforeLast, FULL);
    expect(beforeLast.endRun()).toBe(false);
    expect(beforeLast.current).toBe(3);
  });

  it('a save above the book keeps its number, and the walls show the last page', () => {
    const book = makeBook(7, 3);
    expect(book.shown).toBe(3);
    expect(book.current).toBe(7);
    walk(book, FULL);
    expect(book.endRun()).toBe(false);
    expect(book.current).toBe(7);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(2);
    forwardLapFrom(book, 0);
    expect(book.shown).toBe(3);
    forwardLapFrom(book, 0);
    expect(book.shown).toBe(3);
  });

  it('a book with no pages or a page below 1 is refused', () => {
    expect(() => new RootsBook({ pages: 0, current: 1 })).toThrow();
    expect(() => new RootsBook({ pages: 3, current: 0 })).toThrow();
    expect(() => new RootsBook({ pages: 3.5, current: 1 })).toThrow();
  });
});

describe('the walls: sight sets and the out-of-sight swap', () => {
  it('a room the player can see keeps its page; it turns once the player leaves its sight', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(8);

    // In the start room: the far rooms turn at once, the rooms in sight of the start room wait.
    expect(wall(book)).toEqual({
      [HALL]: 9, [STEP]: 9, [DIG]: 8, [MEND]: 8, [PIT]: 8, [BRIDGE]: 8, [SEAL]: 8,
      [CRATES]: 8, [SPRING]: 8, [GIFT]: 9, [DOOR]: 9,
    });

    // Step room: the start room is still in sight, the way down is not.
    book.enterRoom(STEP);
    expect(book.wallPage(HALL)).toBe(9);
    expect(book.wallPage(GIFT)).toBe(9);
    expect(book.wallPage(DOOR)).toBe(8);

    // Bridge: the step room, the start room and the treasure room are out of sight now.
    book.enterRoom(DIG);
    book.enterRoom(MEND);
    book.enterRoom(PIT);
    book.enterRoom(BRIDGE);
    expect(book.wallPage(STEP)).toBe(8);
    expect(book.wallPage(HALL)).toBe(8);
    expect(book.wallPage(GIFT)).toBe(8);
  });

  it('a forward lap ending in the start room turns the far rooms at once and the near rooms after the player walks out', () => {
    const book = makeBook(9);
    // The game asks every frame: one wall() after each room entered.
    const frame = (room: string): Record<string, number> => {
      book.enterRoom(room);
      return wall(book);
    };
    reverseLapFrom(book, 0);
    wall(book);
    for (const room of [STEP, DIG, MEND, PIT, BRIDGE]) frame(room);
    expect(book.wallPage(STEP)).toBe(8);
    for (const room of [SEAL, CRATES, SPRING, GIFT]) frame(room);
    // In the start room the start room itself is in sight, so it keeps the old page too.
    expect(frame(HALL)).toEqual({
      [HALL]: 8, [STEP]: 8, [DIG]: 9, [MEND]: 9, [PIT]: 9, [BRIDGE]: 9, [SEAL]: 9,
      [CRATES]: 9, [SPRING]: 9, [GIFT]: 8, [DOOR]: 8,
    });
    expect(book.shown).toBe(9);

    // Walking out of the start room's sight: the start room, the step room, the treasure room and the way down turn.
    expect(frame(STEP)[DOOR]).toBe(9);
    expect(frame(STEP)[GIFT]).toBe(8);
    expect(frame(DIG)[GIFT]).toBe(9);
    expect(frame(DIG)[STEP]).toBe(8);
    expect(frame(BRIDGE)[STEP]).toBe(9);
  });

  it('the camera guard keeps a room in view on its page until the view moves away', () => {
    const visible = new Set([DIG]);
    const book = makeBook(9, 9, visible);
    reverseLapFrom(book, 0);
    expect(book.wallPage(DIG)).toBe(9);
    expect(book.wallPage(MEND)).toBe(8);

    visible.clear();
    expect(book.wallPage(DIG)).toBe(8);
  });

  it('outside the Roots every room is out of sight, so all of them turn at once', () => {
    const book = makeBook(9);
    reverseLapFrom(book, 0);
    expect(book.wallPage(STEP)).toBe(9);
    book.enterRoom(OUT);
    expect(book.location).toBeUndefined();
    expect(wall(book)[STEP]).toBe(8);
    expect(wall(book)[DOOR]).toBe(8);
  });

  it('a room that is not part of the Roots is refused', () => {
    const book = makeBook(9);
    expect(() => book.wallPage(OUT)).toThrow();
  });
});

describe('the page stone', () => {
  it('shows nothing on a tutorial page and the page number from the first book page on', () => {
    expect(FIRST_BOOK_PAGE).toBe(7);
    expect(makeBook(6, 9).pageStone()).toBeNull();
    expect(makeBook(7, 9).pageStone()).toBe(7);
    expect(makeBook(8, 9).pageStone()).toBe(8);
    expect(makeBook(6, 6).pageStone()).toBeNull();
  });

  it('changes under the start room rule: it keeps its number while the player is in sight, and turns after', () => {
    const book = makeBook(8, 9);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(7);
    expect(book.pageStone()).toBe(8);
    book.enterRoom(GIFT);
    expect(book.pageStone()).toBe(8);
    book.enterRoom(SPRING);
    expect(book.pageStone()).toBe(7);
  });

  it('the stone goes blank when the walls turn to a tutorial page', () => {
    const book = makeBook(7, 9);
    reverseLapFrom(book, 0);
    expect(book.shown).toBe(6);
    expect(book.pageStone()).toBe(7);
    book.enterRoom(SPRING);
    expect(book.pageStone()).toBeNull();
  });
});
