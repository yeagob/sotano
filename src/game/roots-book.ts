// The Roots' book: which page the walls show, when the page advances, and when a panel may turn.
// The rules are in docs/design/not-built/levels/roots/PAGES.md. Pure: no DOM, no Three.js. The game
// feeds it room-enter events, run-end events and a camera test, and reads back the page each room
// should show now and the number of the page stone.

import { TUTORIAL_CELLS } from '../content/rooms';
import { TUTORIAL_LAYOUT, tutorialPlan, type PlanRoom, type Side } from '../world/floorplan';

/** The first page of the hidden book. Pages before it are tutorial pages (PAGES §4). */
export const FIRST_BOOK_PAGE = 7;

/** Net steps around the ring that make one lap (PAGES §2). */
export const LAP_STEPS = 10;

/** The Roots' rooms by template id, derived from the plan (floorplan.ts) and the cell templates. */
export interface RootsLayout {
  /** The ten ring rooms in forward order, starting at the start room. */
  readonly ring: readonly string[];
  /** The way down: a spur off the start room, not on the ring. */
  readonly door: string;
  /** The room every run starts in. */
  readonly start: string;
  /** Every room of the Roots: the ring, then the way down. */
  readonly rooms: readonly string[];
  /** Per room, the room itself and every room joined to it by a straight line of open doors (PAGES §3). */
  readonly sight: Readonly<Record<string, readonly string[]>>;
}

export interface RootsBookOptions {
  /** How many pages the book files hold; the last page number. */
  pages: number;
  /** The saved current page, kept as saved. The walls show at most `pages`. */
  current: number;
  /** The first page of the hidden book. Default `FIRST_BOOK_PAGE`. */
  firstBookPage?: number;
  /** Camera test: true when the room lies inside the view frustum. Its panels never turn then. Default: never. */
  inView?: (room: string) => boolean;
  /** The Roots' layout. Default: `rootsLayout()`. */
  layout?: RootsLayout;
}

const SIDES: Side[] = ['N', 'E', 'S', 'W'];

function buildLayout(): RootsLayout {
  const plan = tutorialPlan();
  const rooms = plan.rooms;
  const nameOf = (r: PlanRoom): string => {
    const cell = TUTORIAL_CELLS[TUTORIAL_LAYOUT[r.gz][r.gx]];
    if (!cell) throw new Error(`roots-book: no cell template for grid (${r.gx}, ${r.gz})`);
    return cell.template;
  };

  const bosses = rooms.filter(r => r.type === 'boss');
  if (bosses.length !== 1) throw new Error(`roots-book: expected one way-down room, found ${bosses.length}`);
  const door = bosses[0];
  const start = rooms[plan.start];
  const ringRooms = rooms.filter(r => r !== door);
  const ringNeighbours = (r: PlanRoom): PlanRoom[] => {
    const out: PlanRoom[] = [];
    for (const side of SIDES) {
      const id = r.links[side];
      if (id !== undefined && rooms[id] !== door) out.push(rooms[id]);
    }
    return out;
  };
  for (const r of ringRooms) {
    if (ringNeighbours(r).length !== 2) throw new Error(`roots-book: ring room ${nameOf(r)} must join two ring rooms`);
  }

  // Forward is the way the start room's east neighbour leads (PAGES §2: from the start room east into the step room).
  const east = start.links.E;
  if (east === undefined) throw new Error('roots-book: the start room has no east neighbour to walk forward into');
  const order: PlanRoom[] = [start];
  let prev = start;
  let cur = rooms[east];
  while (cur !== start) {
    order.push(cur);
    const next = ringNeighbours(cur).find(n => n !== prev);
    if (!next) throw new Error('roots-book: the ring is broken');
    prev = cur;
    cur = next;
    if (order.length > ringRooms.length) throw new Error('roots-book: the ring does not close at the start room');
  }
  if (order.length !== ringRooms.length) throw new Error('roots-book: the ring misses rooms');

  const sight: Record<string, readonly string[]> = {};
  for (const r of rooms) {
    const seen = [nameOf(r)];
    for (const side of SIDES) {
      let id = r.links[side];
      while (id !== undefined) {
        seen.push(nameOf(rooms[id]));
        id = rooms[id].links[side];
      }
    }
    sight[nameOf(r)] = seen;
  }

  const ring = order.map(nameOf);
  const doorName = nameOf(door);
  return {
    ring,
    door: doorName,
    start: nameOf(start),
    rooms: [...ring, doorName],
    sight,
  };
}

let cachedLayout: RootsLayout | undefined;

/** The Roots' layout, derived once from `tutorialPlan()` and `TUTORIAL_CELLS`. */
export function rootsLayout(): RootsLayout {
  if (!cachedLayout) cachedLayout = buildLayout();
  return cachedLayout;
}

/**
 * The state of the book in one game. Create it with the saved current page, call `enterRoom` for
 * every room the player enters, `endRun` when a run ends (death) and `startRun` for a new run (R,
 * "New run", a new seed). `wallPage` answers the page a room should show now; `pageStone` the number
 * the page stone shows. A new instance begins its first run in the start room.
 */
export class RootsBook {
  readonly layout: RootsLayout;
  private readonly pages: number;
  private readonly firstBook: number;
  private readonly inView: (room: string) => boolean;
  private readonly index: Map<string, number>;
  private savedCurrent: number;
  private shownPage = 1;
  private painted = new Map<string, number>();
  private visited = new Set<string>();
  private last: string | undefined;
  private steps = 0;
  private ended = false;
  private here: string | undefined;

  constructor(options: RootsBookOptions) {
    if (!Number.isInteger(options.pages) || options.pages < 1) throw new Error(`roots-book: pages must be at least 1, got ${options.pages}`);
    if (!Number.isInteger(options.current) || options.current < 1) throw new Error(`roots-book: current page must be at least 1, got ${options.current}`);
    this.layout = options.layout ?? rootsLayout();
    this.pages = options.pages;
    this.savedCurrent = options.current;
    this.firstBook = options.firstBookPage ?? FIRST_BOOK_PAGE;
    this.inView = options.inView ?? (() => false);
    this.index = new Map(this.layout.ring.map((room, i) => [room, i]));
    this.beginRun();
  }

  /** The current page: the one the player has reached, as saved. Advances only in `endRun`. */
  get current(): number { return this.savedCurrent; }

  /** The page the walls show in this run. Starts at the current page; changes only by browsing. */
  get shown(): number { return this.shownPage; }

  /** The Roots' room the player is in, or undefined outside the Roots. */
  get location(): string | undefined { return this.here; }

  /** The last page the book files hold that a run may reach. */
  private top(): number { return Math.min(this.savedCurrent, this.pages); }

  /** A room was entered (the game's room-enter moment). Rooms outside the Roots only move the player out. */
  enterRoom(room: string): void {
    const ringAt = this.index.get(room);
    if (ringAt === undefined && room !== this.layout.door) {
      this.here = undefined;
      return;
    }
    this.here = room;
    this.visited.add(room);
    if (room === this.layout.door) return;
    if (this.last === undefined) {
      this.last = room;
      return;
    }
    if (room === this.last) return;

    const n = this.layout.ring.length;
    const from = this.index.get(this.last)!;
    const to = ringAt!;
    if (to === (from + 1) % n) this.steps += 1;
    else if (to === (from - 1 + n) % n) this.steps -= 1;
    else this.steps = 0;
    this.last = room;

    if (this.steps >= LAP_STEPS) {
      this.steps = 0;
      if (this.shownPage < this.top()) this.shownPage += 1;
    } else if (this.steps <= -LAP_STEPS) {
      this.steps = 0;
      if (this.shownPage > 1) this.shownPage -= 1;
    }
  }

  /**
   * The run ends (the death screen opens, or a new run replaces it). The decision is taken once per
   * run: the current page advances by one if every room of the Roots was entered in this run and the
   * current page is below the last page. Returns true when the current page advanced.
   */
  endRun(): boolean {
    if (this.ended) return false;
    this.ended = true;
    if (this.visited.size < this.layout.rooms.length) return false;
    if (this.savedCurrent >= this.pages) return false;
    this.savedCurrent += 1;
    return true;
  }

  /** A new run: a run still open ends first (once), then the walls show the current page again. */
  startRun(): void {
    this.endRun();
    this.beginRun();
  }

  private beginRun(): void {
    this.shownPage = this.top();
    this.painted = new Map(this.layout.rooms.map(room => [room, this.shownPage] as const));
    this.visited = new Set();
    this.last = undefined;
    this.steps = 0;
    this.ended = false;
    this.here = undefined;
    this.enterRoom(this.layout.start);
  }

  /**
   * The page a room of the Roots should show now. A room keeps the page it shows while the player is
   * in its sight set or the camera sees it, and takes the shown page otherwise.
   */
  wallPage(room: string): number {
    const painted = this.painted.get(room);
    if (painted === undefined) throw new Error(`roots-book: ${room} is not a room of the Roots`);
    const shown = this.shownPage;
    if (painted === shown) return shown;
    const inSight = this.here !== undefined && this.layout.sight[this.here].includes(room);
    if (inSight || this.inView(room)) return painted;
    this.painted.set(room, shown);
    return shown;
  }

  /** The number the page stone shows (PAGES §4): the start room's page, or null on a tutorial page. */
  pageStone(): number | null {
    const page = this.wallPage(this.layout.start);
    return page >= this.firstBook ? page : null;
  }
}
