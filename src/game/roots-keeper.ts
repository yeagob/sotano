// The Roots' walls in one run (docs/design/not-built/levels/roots/PAGES.md, EASY-LAYOUT.md): the page the run
// starts on, the layout it is carved in, the panel each room shows now, and the page stone. It holds the book's
// rules (RootsBook) and the save record (meta.ts), and speaks to the renderer only through WallSink, so the whole
// of it runs in tests without three.js or the DOM. The game (game.ts) owns one keeper per run, made by `openRoots`.

import { ROOM_KEYS, SIDES, pageCount, panelAt, type Book, type BookLayout, type Panel, type RoomKey, type Side } from '../content/book';
import { rootsRoomKey } from '../content/rooms';
import { saveMeta, type LoadedMeta, type MetaStore } from './meta';
import { RootsBook } from './roots-book';

/** The name the book gives every room that is not one of the Roots. */
export const OUTSIDE = 'outside';

/** Where the walls are drawn. Both calls are fire and forget: the renderer carves and swaps when it can. */
export interface WallSink {
  show(room: RoomKey, side: Side, panel: Panel, page: number): unknown;
  /** The page stone's number on a book page, or null to hide it. */
  stone(page: number | null): void;
}

/** The pictures a page needs, loaded ahead of the walls that show it (PanelImages.preloadPage). */
export interface WallImages {
  preloadPage(book: Book, page: number, layout: BookLayout): Promise<void>;
}

export interface RootsKeeperOptions {
  /** The save record. Its page is read once, when the keeper is made; `endRun` writes the page it advances to. */
  readonly record: LoadedMeta;
  /** Where the record is written. */
  readonly store: MetaStore;
  /** The book in the player's language now. */
  readonly book: () => Book;
  readonly images: WallImages;
  /** The camera test (RootsBook §3): true when the room lies inside the view frustum. */
  readonly inView: (room: RoomKey) => boolean;
  /**
   * The debug override (the console's S.roots): the page this run starts on, in memory. Such a run never advances the save:
   * `endRun` writes nothing, so a debug page cannot reach the store.
   */
  readonly startPage?: number;
}

/** A Roots room by its plan cell: its column and row (`RoomInfo.gx`, `gz`). */
export interface RootsCell { readonly gx: number; readonly gz: number }

/**
 * The key a Roots room is known by: the teaching template id of its cell, in both layouts (`rootsRoomKey`). The
 * book and the walls never name a room by `RoomInfo.template`, which is the easy id in the easy layout.
 */
export function roomKeyOf(cell: RootsCell): RoomKey {
  const key = rootsRoomKey(cell.gx, cell.gz);
  if (!(ROOM_KEYS as readonly string[]).includes(key)) throw new Error(`roots-keeper: ${key} is not a room of the book`);
  return key as RoomKey;
}

/**
 * One run's walls. Made at the start of a run from the save: the layout is fixed then (page 2 on is the easy layout,
 * EASY-LAYOUT §1), and a page advanced at the run's end changes the next run, never this one.
 */
export class RootsKeeper {
  readonly book: RootsBook;
  /** The layout this run is carved in and its panels hang in. */
  readonly variant: BookLayout;
  /** The page each room's panels were last carved for (what the wall shows). */
  private readonly drawn = new Map<RoomKey, number>();
  private stoneNow: number | null | undefined;

  constructor(private readonly o: RootsKeeperOptions) {
    const start = o.startPage ?? o.record.roots.page;
    this.book = new RootsBook({
      pages: pageCount(o.book()),
      current: start,
      inView: room => o.inView(room as RoomKey),
    });
    this.variant = start >= 2 ? 'easy' : 'teaching';
  }

  /** Floor 0's carve option for this run: the easy layout from page 2 on, read from the current page, never the shown one. */
  get easyRoots(): boolean { return this.variant === 'easy'; }

  /** The page the player has reached (the save's page, advanced only by `endRun`). */
  get current(): number { return this.book.current; }

  /** The page the walls show now. */
  get shown(): number { return this.book.shown; }

  /** The eleven rooms of the Roots, by key. */
  get rooms(): readonly RoomKey[] { return this.book.layout.rooms as readonly RoomKey[]; }

  /** The start room's key (its panels and the page stone hang there). */
  get start(): RoomKey { return this.book.layout.start as RoomKey; }

  /** A room was entered: a Roots room by its cell, or `undefined` for any room outside the Roots. */
  enterRoom(cell?: RootsCell): void {
    this.book.enterRoom(cell ? roomKeyOf(cell) : OUTSIDE);
  }

  /**
   * The run ends (death, R, a new run or a new seed; PAGES §1). The book decides once per run whether the page
   * advances; if it did, the record is written at once. Returns the new current page when it advanced, else
   * undefined. A read-only record (a newer build's) is never written, so nothing it advances persists.
   */
  endRun(): number | undefined {
    if (this.o.startPage !== undefined) return undefined;
    if (!this.book.endRun()) return undefined;
    if (this.o.record.readOnly) return undefined;
    this.o.record.roots.page = this.book.current;
    saveMeta(this.o.record, this.o.store);
    return this.book.current;
  }

  /**
   * Loads the shown page's pictures, so the walls never wait for one; the pages either side load in the
   * background, so a browse never waits either. Resolves when the shown page's pictures are ready.
   */
  preload(): Promise<void> {
    const book = this.o.book(), shown = this.book.shown, pages = pageCount(book);
    const ready = this.o.images.preloadPage(book, shown, this.variant);
    for (const page of [shown - 1, shown + 1]) {
      if (page >= 1 && page <= pages) void this.o.images.preloadPage(book, page, this.variant);
    }
    return ready;
  }

  /**
   * Carves every room whose wall shows a different page from the one it shows now (the book says which, by its
   * out-of-sight rule), and keeps the page stone in step. Called every frame; it does nothing when nothing turns.
   */
  update(sink: WallSink): void {
    const book = this.o.book();
    for (const room of this.rooms) {
      const page = this.book.wallPage(room);
      if (this.drawn.get(room) !== page) this.paint(book, room, page, sink);
    }
    const stone = this.book.pageStone();
    if (stone !== this.stoneNow) {
      this.stoneNow = stone;
      sink.stone(stone);
    }
  }

  private paint(book: Book, room: RoomKey, page: number, sink: WallSink) {
    for (const side of SIDES) sink.show(room, side, panelAt(book, page, room, side, this.variant), page);
    this.drawn.set(room, page);
  }
}

/**
 * The Roots' walls of a run, or none. The sandbox and the lab play on their own sealed room: they have no walls, never
 * advance the page and never write the save (SANDBOX.md).
 */
export function openRoots(sandbox: boolean, options: RootsKeeperOptions): RootsKeeper | undefined {
  return sandbox ? undefined : new RootsKeeper(options);
}
