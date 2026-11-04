// ?gallery=sky-elephant (docs/architecture/SKY.md §11). Owned by: F3, B3. Rulings: docs/art/sky/elephant.md.
//
// The floor as the generator makes it (the hall's origin of the tree, seed 1): the plan from above with each
// column's material and its height, the water of the Basin and the waterhole in the water's own tone, the
// section through the Basin along x, and the silhouette of the whole floor from the ground to the south. The
// tusk line is the vertical route to the way up. Shapes only; the beings come with B3. Colours are the blocks'
// own material tones and the palette's marks, never literals.

import { AIR, MATERIALS } from '../../content/materials';
import { palCss } from '../../content/palette';
import { Rng } from '../../core/rng';
import { elephant } from '../../sky/floors/elephant';
import type { SkyFloorPlan } from '../../sky/types';
import { covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const ORIGIN = { x: 128, y: 110, z: 128 };
/** Pixels per block. */
const PX = 12;
/** Half-width of the plan and the sections, in blocks (the B6 radius is 24). */
const R = 26;

/** A block's tone: its material's base colour, lifted by height (0..1). */
function tone(m: number, lift: number): string {
  const def = MATERIALS.find(q => q.id === m);
  const c = def ? def.colors[0] : 0;
  const part = (sh: number) => Math.round(((c >> sh) & 255) * (0.62 + 0.38 * lift));
  return `rgb(${part(16)}, ${part(8)}, ${part(0)})`;
}

/** The material of the block that fills a cell (the last one covering it), or null. */
function blockAt(p: SkyFloorPlan, x: number, y: number, z: number): number | null {
  let found: number | null = null;
  for (const s of p.shapes) {
    if (s.k === 'elem' || !covers(s, x, y, z)) continue;
    found = 'm' in s ? s.m : AIR;
  }
  return found;
}

/** Whether a cell holds water: an element shape laid where the block is air, and no block after it. */
function waterAt(p: SkyFloorPlan, x: number, y: number, z: number): boolean {
  let air = true, water = false;
  for (const s of p.shapes) {
    if (!covers(s, x, y, z)) continue;
    if (s.k === 'elem') { if (air) water = true; continue; }
    air = 'm' in s ? s.m === AIR : true;
    water = false;
  }
  return water;
}

/** The highest block of each column in the plan, by its material, and whether water stands in the air above it. */
function topAt(p: SkyFloorPlan, x: number, z: number): { m: number; top: number; water: boolean } | null {
  // the highest solid cell of the column, after the carves (an air shape cuts what lies under it)
  let best: { m: number; top: number } | null = null;
  for (let y = p.y1; y >= p.y0 && !best; y--) {
    const m = blockAt(p, x, y, z);
    if (m !== null && m !== AIR) best = { m, top: y + 1 };
  }
  // the water of this column: from the top block (the pool, cut into the mesa) or, where the column has no block
  // at all (the waterhole, cut through the base), from the floor's first row
  const from = best ? best.top : p.y0;
  let water = false;
  for (let y = from; y < from + 3 && !water; y++) water = waterAt(p, x, y, z);
  if (!best && !water) return null;
  return { m: best ? best.m : AIR, top: best ? best.top : from, water };
}

function drawPlan(p: SkyFloorPlan): HTMLCanvasElement {
  const n = R * 2 + 1;
  const c = document.createElement('canvas');
  c.width = c.height = n * PX;
  const g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.day');
  g.fillRect(0, 0, c.width, c.height);
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
    const t = topAt(p, ORIGIN.x + dx, ORIGIN.z + dz);
    if (!t) continue;
    g.fillStyle = t.water ? palCss('el.water.surface') : tone(t.m, Math.min(1, t.top / 26));
    g.fillRect((dx + R) * PX, (dz + R) * PX, PX, PX);
  }
  // the spawn and the nests: small squares in the palette's paper tone
  g.fillStyle = palCss('bone.paper');
  for (const q of [...p.nests, ...p.spawns]) {
    g.fillRect((q.x - ORIGIN.x + R) * PX + PX / 4, (q.z - ORIGIN.z + R) * PX + PX / 4, PX / 2, PX / 2);
  }
  return c;
}

/**
 * A view of the floor in one plane. `cell(i, h)` says which block (if any) is seen at horizontal position i
 * and height h: a section fixes the other horizontal axis, a silhouette takes the nearest block along it.
 */
function drawElevation(p: SkyFloorPlan, cell: (i: number, h: number) => number | null): HTMLCanvasElement {
  const H = p.y1 - p.y0 + 1;
  const c = document.createElement('canvas');
  c.width = (R * 2 + 1) * PX;
  c.height = (H + 2) * PX;
  const g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.day');
  g.fillRect(0, 0, c.width, c.height);
  for (let i = -R; i <= R; i++) for (let h = 0; h < H; h++) {
    const m = cell(i, h);
    if (m === null) continue;
    g.fillStyle = tone(m, Math.min(1, (h + 1) / H));
    g.fillRect((i + R) * PX, c.height - (h + 2) * PX, PX, PX);
  }
  // the ground line
  g.fillStyle = palCss('bone.dim');
  g.fillRect(0, c.height - PX, c.width, 2);
  return c;
}

export function skyElephantGallery(g: GalleryKit) {
  const p = elephant.generate(new Rng(1), ORIGIN);
  g.head('Sky floor 3, the elephant: the plan from above (the rings, the Basin with its pool and rim, the waterhole, the tusk line, the nests)');
  g.fig(g.row(), drawPlan(p), 'plan · pale stone rings, the rim in fencewood, the skywood tusk line, water in its blue, pale marks: nests and spawn');

  g.head('The section through the Basin along x: the rings rising to the pool');
  g.fig(g.row(), drawElevation(p, (i, h) => blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z)), 'section along x through the Basin, the ground to the top of the mesa');

  g.head('From the ground to the south: the silhouette of the whole floor, nearest block along z');
  g.fig(g.row(), drawElevation(p, (i, h) => {
    for (let dz = -R; dz <= R; dz++) {
      const m = blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z + dz);
      if (m !== null) return m;
    }
    return null;
  }), 'silhouette from the south, the ground to the way up');
}
