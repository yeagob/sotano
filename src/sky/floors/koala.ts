// Sky floor 2, the koala's (docs/design/not-built/sky/guardians/KOALA.md, B6; docs/architecture/SKY.md §7.2–§7.3).
// Only shapes, places and links: four trunks with knots on their outer faces, four limbs from the
// trunks to the Fork, the moss floor, and a square spiral of branches round the trunks. Integers only.
//
// Rows are cells above the moss: the moss is row 0, a block on row r fills the cell at (o.y + r),
// and a place on row r stands at row r + 1. The Fork's crown is solid on row 29 and the koala
// floats over it at 30. Sides are described outward: u is the distance from the centre along the
// trunk's direction, v the offset across it.

import { AIR, MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Link, Move, Place, PlaceKind, PlatformTag, Shape, SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

/** B6: radius 22, height 32. */
const RADIUS = 22;
const HEIGHT = 32;
/** The hall's top row: the height plus 3 cells of headroom (§7.1: 71 → 106). */
const HALL_TOP = HEIGHT + 3;
/** The branch spiral's square: its sides at ±18, just outside the knots. */
const RING = 18;
const SIDE = 2 * RING;
const LOOP = 4 * SIDE;
/** Rows: the trunk's last solid row, the limbs' row and the Fork's crown. */
const TRUNK_TOP = 33;
const LIMB_ROW = 28;
const FORK_ROW = 29;
/** The first branch's row and the highest row a branch may take (the Fork's crown is at 29). */
const SPIRAL_FIRST = 2;
const SPIRAL_LAST = 26;
/** Knot offsets round the 2 × 2 square, as shapes.ts (along the side, across it) for k mod 4. */
const LEDGE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

interface Side { axis: 'x' | 'z'; sign: 1 | -1 }
/** East, south, west, north: the four trunks, in the same order as the ring's sides (see ringCell). */
const SIDES: readonly Side[] = [
  { axis: 'x', sign: 1 },
  { axis: 'z', sign: 1 },
  { axis: 'x', sign: -1 },
  { axis: 'z', sign: -1 },
];
/** The ring index of each trunk's midpoint cell on the ring. */
const MIDPOINT = [17, 55, 91, 125] as const;

interface Span { x0: number; x1: number; z0: number; z1: number }
interface Branch { index: number; row: number; thick: boolean; start: number; end: number; first: Place; last: Place; tag: number }

export const koala: SkyFloorGen = {
  animal: 'koala', index: 2, radius: RADIUS, height: HEIGHT,
  generate(rng: Rng, o: Vec3): SkyFloorPlan {
    const g = o.y;
    const cx = o.x, cz = o.z;

    /** The cell at outward distance u and offset v on a trunk's side. */
    const at = (s: Side, u: number, v: number): [number, number] =>
      s.axis === 'x' ? [cx + s.sign * u, cz + v] : [cx + v, cz + s.sign * u];
    /** The footprint between two (u, v) corners, inclusive. */
    const span = (s: Side, u0: number, v0: number, u1: number, v1: number): Span => {
      const [ax, az] = at(s, u0, v0), [bx, bz] = at(s, u1, v1);
      return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
    };

    const shapes: Shape[] = [];
    const places: Place[] = [];
    const links: Link[] = [];
    const platforms: PlatformTag[] = [];
    const place = (kind: PlaceKind, x: number, y: number, z: number, tag: number, w = 1, d = 1): Place => {
      const p: Place = { id: places.length, kind, x, y, z, w, d, tag };
      places.push(p);
      return p;
    };
    const join = (a: Place, b: Place, move: Move) => { links.push({ a: a.id, b: b.id, move }); };

    // ── the moss: the floor of the hall, open at the centre down to the moss ──
    const MOSS_TAG = 1;
    shapes.push({ k: 'ring', cx, cz, r0: 0, r1: RADIUS, y0: g, y1: g, m: MAT.moss, tag: MOSS_TAG });
    platforms.push({ tag: MOSS_TAG, place: -1, fixed: true });

    // ── the Fork: a 3 × 3 crown of living wood over the centre, walked at row 30 ──
    const FORK_TAG = 6;
    shapes.push({ k: 'box', x0: cx - 1, y0: g + FORK_ROW, z0: cz - 1, x1: cx + 1, y1: g + FORK_ROW, z1: cz + 1, m: MAT.skywood, tag: FORK_TAG });
    const seat = place('seat', cx, g + FORK_ROW + 1, cz, FORK_TAG, 3, 3);
    platforms.push({ tag: FORK_TAG, place: seat.id, fixed: true });

    // ── the four trunks: each with its tunnel to its limb, its limb, and its knots up to the top ──
    const knots: Place[][] = [];
    const tops: Place[] = [];
    const grounds: Place[] = [];
    SIDES.forEach((s, t) => {
      const trunkTag = 2 + t;
      const tr = span(s, 14, -1, 15, 0);
      shapes.push({ k: 'box', x0: tr.x0, y0: g + 1, z0: tr.z0, x1: tr.x1, y1: g + TRUNK_TOP, z1: tr.z1, m: MAT.skywood, tag: trunkTag });
      // the tunnel through the trunk's inner column, on the limb's row (rows 29–31 are air)
      const tu = span(s, 14, 0, 15, 0);
      shapes.push({ k: 'box', x0: tu.x0, y0: g + LIMB_ROW + 1, z0: tu.z0, x1: tu.x1, y1: g + LIMB_ROW + 3, z1: tu.z1, m: AIR });
      // the limb: thick and fixed, from the trunk to the Fork's edge, on row 28
      const lb = span(s, 2, -1, 13, 0);
      shapes.push({ k: 'box', x0: lb.x0, y0: g + LIMB_ROW, z0: lb.z0, x1: lb.x1, y1: g + LIMB_ROW, z1: lb.z1, m: MAT.skywood, tag: trunkTag });
      platforms.push({ tag: trunkTag, place: -1, fixed: true });

      // the knots: a 2 × 2 square just outside the trunk, one ledge per row from 1 to 33
      const sq = span(s, 16, -1, 17, 0);
      shapes.push({ k: 'ledges', x0: sq.x0, z0: sq.z0, axis: s.axis, y0: g + 1, y1: g + TRUNK_TOP, m: MAT.skywood });
      const column: Place[] = [];
      for (let k = 0; k < TRUNK_TOP; k++) {
        const [a, c] = LEDGE[k & 3];
        const x = s.axis === 'x' ? sq.x0 + a : sq.x0 + c;
        const z = s.axis === 'x' ? sq.z0 + c : sq.z0 + a;
        column.push(place('ledge', x, g + k + 2, z, 0));
      }
      knots.push(column);
      for (let k = 0; k + 1 < column.length; k++) join(column[k], column[k + 1], 'climb');

      // the moss cell beside the first knot, and the top of the trunk (walked at row 34)
      const first = column[0];
      const ground = s.axis === 'x' ? place('ground', first.x, g + 1, first.z - 1, MOSS_TAG) : place('ground', first.x - 1, g + 1, first.z, MOSS_TAG);
      grounds.push(ground);
      join(ground, first, 'step');
      const [tx, tz] = at(s, 15, -1);
      const top = place('top', tx, g + TRUNK_TOP + 1, tz, trunkTag);
      tops.push(top);
      join(column[column.length - 1], top, 'walk');

      // the limb's two ends: the tunnel's outer end (walked from the knot at row 27) and the Fork's edge
      const [ox, oz] = at(s, 13, 0), [ix, iz] = at(s, 2, 0);
      const outer = place('thick', ox, g + LIMB_ROW + 1, oz, trunkTag);
      const inner = place('thick', ix, g + LIMB_ROW + 1, iz, trunkTag);
      join(column[27], outer, 'walk');
      join(outer, inner, 'walk');
      join(inner, seat, 'step');
    });

    // ── the branch spiral: thin branches of 4–6 cells, every third thick and fixed, each 2 higher ──
    /** The ring's cell at an index (0–35 east, 36–71 south, 72–107 west, 108–143 north). */
    const ringCell = (i: number): [number, number] => {
      const n = ((i % LOOP) + LOOP) % LOOP;
      const side = Math.floor(n / SIDE), t = n % SIDE;
      switch (side) {
        case 0: return [cx + RING, cz - RING + t];
        case 1: return [cx + RING - t, cz + RING];
        case 2: return [cx - RING, cz + RING - t];
        default: return [cx - RING + t, cz - RING];
      }
    };
    /** The straight pieces of a branch: a piece ends before each corner, where a new side begins. */
    const pieces = (a: number, b: number): [number, number][] => {
      const out: [number, number][] = [];
      let from = a;
      for (let i = a + 1; i <= b; i++) if (i % SIDE === 0) { out.push([from, i - 1]); from = i; }
      out.push([from, b]);
      return out;
    };

    const branches: Branch[] = [];
    let cursor = 17;
    for (let i = 0; ; i++) {
      const row = SPIRAL_FIRST + 2 * i;
      if (row > SPIRAL_LAST) break;
      const len = rng.int(4, 6);
      const thick = i % 3 === 2;
      const start = cursor, end = cursor + len - 1;
      const tag = 7 + i;
      const [sx, sz] = ringCell(start), [ex, ez] = ringCell(end);
      const first = place(thick ? 'thick' : 'branch', sx, g + row + 1, sz, tag);
      const last = place(thick ? 'thick' : 'branch', ex, g + row + 1, ez, tag);
      join(first, last, 'walk');
      if (branches.length > 0) join(branches[branches.length - 1].last, first, 'build');
      for (const [pa, pb] of pieces(start, end)) {
        const [ax, az] = ringCell(pa), [bx, bz] = ringCell(pb);
        if (thick) {
          shapes.push({ k: 'run', ax, ay: g + row - 1, az, bx, by: g + row - 1, bz, w: 2, h: 1, m: MAT.skywood, tag });
          shapes.push({ k: 'run', ax, ay: g + row, az, bx, by: g + row, bz, w: 2, h: 1, m: MAT.skyleaf, tag });
        } else {
          shapes.push({ k: 'run', ax, ay: g + row, az, bx, by: g + row, bz, w: 1, h: 1, m: MAT.skywood, tag });
        }
      }
      platforms.push({ tag, place: first.id, fixed: thick });
      branches.push({ index: i, row, thick, start, end, first, last, tag });
      cursor = end + rng.int(2, 3) + 1;
      if (cursor + 6 > 17 + LOOP) break;
    }

    // Each trunk's midpoint on the ring joins the branch above it, through the knot on that row.
    SIDES.forEach((_, t) => {
      const m = MIDPOINT[t];
      const b = branches.find(br => m >= br.start && m <= br.end);
      if (!b) return;
      const k = b.row - 1;
      if (k < 0 || k >= knots[t].length) return;
      const nearest = Math.abs(m - b.start) <= Math.abs(m - b.end) ? b.first : b.last;
      join(knots[t][k], nearest, 'walk');
    });

    // The thick branches carry three sleeping clusters and four nests.
    const spawns: Place[] = [];
    const nests: Place[] = [];
    for (const b of branches) {
      if (!b.thick) continue;
      if (b.index !== 11) {
        const mid = Math.floor((b.start + b.end) / 2);
        const [mx, mz] = ringCell(mid);
        const sp = place('spawn', mx, g + b.row + 1, mz, b.tag);
        spawns.push(sp);
        join(sp, b.first, 'walk');
      }
      const [nx, nz] = ringCell(b.start);
      const nest = place('nest', nx, g + b.row + 1, nz, b.tag);
      nests.push(nest);
      join(nest, b.first, 'walk');
    }

    // ── the way up: the top of the east trunk, under the gate in the slab above ──
    const route: Place[] = [grounds[0], ...knots[0], tops[0]];
    const gate = { x: tops[0].x, z: tops[0].z, r: 2 };

    return {
      index: 2, animal: 'koala', y0: g, y1: g + HALL_TOP,
      shapes, graph: { places, links }, seat, spawns, nests, route, gate, platforms,
    };
  },
};
