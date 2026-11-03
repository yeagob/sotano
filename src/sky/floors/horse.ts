// Sky floor 5, the horse's meadow (docs/design/not-built/sky/guardians/HORSE.md, B6; docs/architecture/SKY.md §7.2–7.3).
//
// Conventions, shared with the other floors:
// - `o` is the hall's ground centre. The meadow is one solid layer at o.y (the hall ground); the
//   player walks on its top. A block at height y is solid in cell y.
// - A place's (x, y, z) is the cell it stands on; its extent runs w along x and d along z, from
//   lo = c − ⌊(w − 1) / 2⌋ to hi = c + ⌊w / 2⌋ (the same rule as a run's cross-section).
// - The floor's band is y0 = o.y up to y1 = o.y + 23, exclusive (the hall top: 217 when the ground is 194).
//
// The floor, in the order of the B6 document:
// - a meadow of radius 30 (one ring shape);
// - six fenced paddocks, 5 × 5, in two rows of three (x −20, 0, +20; z −10, +10), 20 apart, at heights
//   0, 2, 4, 6, 4, 2 round the ring (0 is level with the meadow); the seat is one of the three highest;
// - the ring of runs joining each paddock to the next: three segments of 3 × 2 per side, one block up
//   every two segments, gaps of 1 and 2 between them. Every fourth segment (ids 3, 7, 11, 15) is fixed,
//   with a hitching post, and the others are mist, which fades;
// - the mast at the centre: one-block ledges turning round a 2 × 2 square, one per height, from the
//   meadow to the top rung at o.y + 21, under the way up; a fixed spoke joins the rung at the height of
//   the first paddock (the nearest to the mast) to that paddock;
// - two spawns on the ground at the meadow's edge, and four nests on the fixed segments.
//
// Nothing is a single cube written in a loop: every block is a shape of src/sky/world/shapes.ts (a
// box, a ring, a ledges strip). The one draw is which of the three high paddocks is the seat.

import { MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Link, Move, Place, PlaceKind, PlatformTag, Shape, SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

/** The hall's height above its ground: the top rung plus headroom. */
const HALL_TOP = 23;
/** The top rung's height above the hall ground. */
const ROUTE_TOP = 21;
const MEADOW_R = 30;
/** Half the paddock's side: a paddock is 5 × 5. */
const PAD = 2;
/** Paddock spacing: neighbours on the ring are 20 apart (B6: 12 to 20). */
const SPACING_X = 20;
const SPACING_Z = 10;
/** The ring in order, relative to the centre; each paddock joins the next, and the last joins the first. */
const RING: readonly (readonly [number, number])[] = [
  [-SPACING_X, -SPACING_Z], [0, -SPACING_Z], [SPACING_X, -SPACING_Z],
  [SPACING_X, SPACING_Z], [0, SPACING_Z], [-SPACING_X, SPACING_Z],
];
/** Paddock tops above the hall ground, by ring index. */
const HEIGHT: readonly number[] = [0, 2, 4, 6, 4, 2];
/** The seat is one of the three highest paddocks (ring indices). */
const SEATS: readonly number[] = [2, 3, 4];
/** Each mast ledge's offset round its 2 × 2 square, for k mod 4 (as shapes.ts draws them). */
const LEDGE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** Segments per run side. */
const SEGMENTS = 3;
/** Every fourth segment of the ring is fixed. */
const FIXED_EVERY = 4;

type Side = 'N' | 'S' | 'E' | 'W';

export const horse: SkyFloorGen = {
  animal: 'horse', index: 5, radius: 30, height: 12,
  generate(rng: Rng, o: Vec3): SkyFloorPlan {
    const ox = o.x, oy = o.y, oz = o.z;
    const places: Place[] = [], links: Link[] = [], shapes: Shape[] = [], platforms: PlatformTag[] = [];

    // A place from its lower corner (lx, lz) and its extent (w, d); `tag` is its platform (0 for none).
    const put = (kind: PlaceKind, lx: number, lz: number, w: number, d: number, y: number, tag: number): Place => {
      const p: Place = { id: places.length, kind, x: lx + ((w - 1) >> 1), y, z: lz + ((d - 1) >> 1), w, d, tag };
      places.push(p);
      return p;
    };
    const join = (a: Place, b: Place, move: Move) => { links.push({ a: a.id, b: b.id, move }); };

    // ── the meadow and its ground nodes ──
    shapes.push({ k: 'ring', cx: ox, cz: oz, r0: 0, r1: MEADOW_R, y0: oy, y1: oy, m: MAT.moss });
    const ground = put('ground', ox - 2, oz - 1, 1, 1, oy, 0);
    const spawnW = put('spawn', ox - 26, oz, 1, 1, oy, 0);
    const spawnE = put('spawn', ox + 26, oz, 1, 1, oy, 0);
    join(ground, spawnW, 'walk');
    join(ground, spawnE, 'walk');

    // ── the mast: ledges from the meadow to the top rung, and the route through them ──
    const mx = ox - 1, mz = oz - 1;
    shapes.push({ k: 'ledges', x0: mx, z0: mz, axis: 'x', y0: oy + 1, y1: oy + ROUTE_TOP, m: MAT.skywood });
    // mast[k] is the rung at height oy + 1 + k
    const mast: Place[] = [];
    for (let k = 0; k < ROUTE_TOP; k++) {
      const [a, c] = LEDGE[k & 3];
      mast.push(put('route', mx + a, mz + c, 1, 1, oy + 1 + k, 0));
    }
    const route: Place[] = [ground, ...mast];
    for (let i = 0; i + 1 < route.length; i++) join(route[i], route[i + 1], 'jump');

    // ── the paddocks: solid bodies here, their fences below ──
    const seatRing = rng.pick(SEATS);
    const pads: Place[] = [], padTags: number[] = [], padCentre: [number, number][] = [];
    for (let i = 0; i < RING.length; i++) {
      const cx = ox + RING[i][0], cz = oz + RING[i][1], h = HEIGHT[i];
      const t = platforms.length + 1;
      const p = put(i === seatRing ? 'seat' : 'paddock', cx - PAD, cz - PAD, 2 * PAD + 1, 2 * PAD + 1, oy + h, t);
      platforms.push({ tag: t, place: p.id, fixed: true });
      pads.push(p);
      padTags.push(t);
      padCentre.push([cx, cz]);
      shapes.push({ k: 'box', x0: cx - PAD, y0: oy, z0: cz - PAD, x1: cx + PAD, y1: oy + h, z1: cz + PAD, m: MAT.palestone, tag: t });
    }
    // the paddock level with the meadow is walked onto from the ground
    join(ground, pads[0], 'walk');

    // The cells each paddock's fence leaves open, by side: where a run or the spoke enters it.
    const openings = new Map<string, number[]>();
    const open = (i: number, side: Side, coords: number[]) => {
      const key = `${i}${side}`;
      openings.set(key, [...(openings.get(key) ?? []), ...coords]);
    };

    // ── the runs: a ring of chords, each of three segments ──
    const nests: Place[] = [];
    let n = 0;
    for (let i = 0; i < RING.length; i++) {
      const j = (i + 1) % RING.length;
      const ax = ox + RING[i][0], az = oz + RING[i][1];
      const bx = ox + RING[j][0], bz = oz + RING[j][1];
      const alongX = RING[i][1] === RING[j][1];
      const dir = alongX ? Math.sign(bx - ax) : Math.sign(bz - az);
      const start = alongX ? ax : az;
      // the two cells across the run: z = az − 1 and az on a run along x, x = ax − 1 and ax along z
      const across = alongX ? az - 1 : ax - 1;
      if (alongX) {
        open(i, dir > 0 ? 'E' : 'W', [across, across + 1]);
        open(j, dir > 0 ? 'W' : 'E', [across, across + 1]);
      } else {
        open(i, dir > 0 ? 'N' : 'S', [across, across + 1]);
        open(j, dir > 0 ? 'S' : 'N', [across, across + 1]);
      }

      const dH = HEIGHT[j] - HEIGHT[i];
      let prev: Place = pads[i];
      for (let k = 0; k < SEGMENTS; k++) {
        // a gap of one cell from the paddock, then segments of three cells with gaps of two
        const c1 = start + dir * (4 + 5 * k), c3 = start + dir * (6 + 5 * k);
        const lo = Math.min(c1, c3);
        const y = oy + HEIGHT[i] + Math.round(dH * (k + 1) / (SEGMENTS + 1));
        const fixed = n % FIXED_EVERY === FIXED_EVERY - 1;
        const t = platforms.length + 1;
        const p = alongX ? put('segment', lo, across, 3, 2, y, t) : put('segment', across, lo, 2, 3, y, t);
        platforms.push({ tag: t, place: p.id, fixed });
        const m = fixed ? MAT.skywood : MAT.mist;
        shapes.push(alongX
          ? { k: 'box', x0: lo, y0: y, z0: across, x1: lo + 2, y1: y, z1: across + 1, m, tag: t }
          : { k: 'box', x0: across, y0: y, z0: lo, x1: across + 1, y1: y, z1: lo + 2, m, tag: t });
        if (fixed) {
          // the hitching post: one block on the segment's middle, on its first row, two high
          const at = lo + 1;
          shapes.push(alongX
            ? { k: 'box', x0: at, y0: y + 1, z0: across, x1: at, y1: y + 2, z1: across, m: MAT.fencewood, tag: t }
            : { k: 'box', x0: across, y0: y + 1, z0: at, x1: across, y1: y + 2, z1: at, m: MAT.fencewood, tag: t });
          const nest = alongX ? put('nest', lo, across, 3, 2, y, t) : put('nest', across, lo, 2, 3, y, t);
          join(nest, p, 'walk');
          nests.push(nest);
        }
        join(prev, p, 'jump');
        prev = p;
        n++;
      }
      join(prev, pads[j], 'jump');
    }

    // ── the spoke: a fixed run from the mast's rung at the first paddock's height to that paddock ──
    {
      const t = platforms.length + 1;
      const pad = pads[1];
      const spoke = put('segment', ox, oz - 7, 2, 6, oy + HEIGHT[1], t);
      platforms.push({ tag: t, place: spoke.id, fixed: true });
      shapes.push({ k: 'box', x0: ox, y0: oy + HEIGHT[1], z0: oz - 7, x1: ox + 1, y1: oy + HEIGHT[1], z1: oz - 2, m: MAT.skywood, tag: t });
      join(mast[HEIGHT[1] - 1], spoke, 'walk');
      join(spoke, pad, 'walk');
      open(1, 'N', [ox, ox + 1]);
    }

    // ── the fences: each side of each paddock, cut where a run or the spoke enters ──
    const sides: Side[] = ['N', 'S', 'E', 'W'];
    for (let i = 0; i < pads.length; i++) {
      const [cx, cz] = padCentre[i];
      const top = oy + HEIGHT[i] + 1, t = padTags[i];
      for (const side of sides) {
        const alongX = side === 'N' || side === 'S';
        const base = alongX ? cx : cz;
        const edge = side === 'N' ? cz + PAD : side === 'S' ? cz - PAD : side === 'E' ? cx + PAD : cx - PAD;
        const cut = new Set(openings.get(`${i}${side}`) ?? []);
        let s: number | null = null;
        for (let u = -PAD; u <= PAD + 1; u++) {
          const rail = u <= PAD && !cut.has(base + u);
          if (rail && s === null) s = u;
          if (!rail && s !== null) {
            const from = base + s, to = base + u - 1;
            shapes.push(alongX
              ? { k: 'box', x0: from, y0: top, z0: edge, x1: to, y1: top, z1: edge, m: MAT.fencewood, tag: t }
              : { k: 'box', x0: edge, y0: top, z0: from, x1: edge, y1: top, z1: to, m: MAT.fencewood, tag: t });
            s = null;
          }
        }
      }
    }

    return {
      index: 5, animal: 'horse', y0: oy, y1: oy + HALL_TOP,
      shapes, graph: { places, links },
      seat: pads[seatRing], spawns: [spawnW, spawnE], nests, route,
      gate: { x: mx, z: mz, r: 2 }, platforms,
      extra: { mast, paddocks: pads },
    };
  },
};
