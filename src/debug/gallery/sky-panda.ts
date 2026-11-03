// ?gallery=sky-panda (docs/architecture/SKY.md §11). Owned by: F1 (the floor), B1 (the beings). Rulings: docs/art/sky/panda.md.
//
// The floor as the generator makes it (the hall's origin of the tree, seed 1): the plan from above with each
// column's material and its height, the section through the seat and the ledge strip (the vertical route to
// the way up), and the silhouette of the whole floor from the ground to the south. Shapes only; the beings
// come with B1. Colours are the blocks' own material tones and the palette's marks, never literals.

import { AIR, MATERIALS } from '../../content/materials';
import { palCss } from '../../content/palette';
import { Rng } from '../../core/rng';
import { panda } from '../../sky/floors/panda';
import type { SkyFloorPlan } from '../../sky/types';
import { boundsOf, covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const ORIGIN = { x: 128, y: 36, z: 128 };
/** Pixels per block. */
const PX = 12;
/** Half-width of the plan and the sections, in blocks (the B6 radius is 20). */
const R = 22;

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

/** The highest block of each column in the plan, by its material. */
function topAt(p: SkyFloorPlan, x: number, z: number): { m: number; top: number } | null {
  let best: { m: number; top: number } | null = null;
  for (const s of p.shapes) {
    if (s.k === 'elem') continue;
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    for (let y = y1; y >= y0; y--) {
      if (!covers(s, x, y, z)) continue;
      if (!best || y + 1 > best.top) best = { m: 'm' in s ? s.m : AIR, top: y + 1 };
      break;
    }
  }
  return best;
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
    g.fillStyle = tone(t.m, Math.min(1, t.top / 24));
    g.fillRect((dx + R) * PX, (dz + R) * PX, PX, PX);
  }
  // the spawns and the nests: small squares in the palette's paper tone
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
  const H = p.y1 - p.y0;
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

export function skyPandaGallery(g: GalleryKit) {
  const p = panda.generate(new Rng(1), ORIGIN);
  g.head('Sky floor 1, the panda: the plan from above (the Bamboo Seat, the gentle path, the building path, nests and clumps)');
  g.fig(g.row(), drawPlan(p), 'plan · bamboo gentle path and seat, skywood building path, pale marks: nests and clumps');

  g.head('The section through the seat along x: the ledge strip is the vertical route to the way up');
  g.fig(g.row(), drawElevation(p, (i, h) => blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z)), 'section along x through the seat, the ground to the way up');

  g.head('From the ground to the south: the silhouette of the whole floor, nearest block along z');
  g.fig(g.row(), drawElevation(p, (i, h) => {
    for (let dz = -R; dz <= R; dz++) {
      const m = blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z + dz);
      if (m !== null) return m;
    }
    return null;
  }), 'silhouette from the south, the ground to the way up');
}
