// ?gallery=sky-horse (docs/architecture/SKY.md §11). Owned by: F5 (the floor), B5 (the beings). Rulings: docs/art/sky/horse.md.
//
// Sky floor 5 as its generator draws it, from a fixed seed: the plan from above, and a section through
// the mast from the meadow to the way up. Shapes are painted in their own colours (the base of each
// material), the last shape that covers a cell wins, as in the world. The beings come with B5.

import { MATERIALS } from '../../content/materials';
import { palCss } from '../../content/palette';
import { Rng } from '../../core/rng';
import { horse } from '../../sky/floors/horse';
import type { Shape, SkyFloorPlan, Vec3 } from '../../sky/types';
import { boundsOf, covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const CELL = 6;
const ORIGIN: Vec3 = { x: 128, y: 194, z: 128 };
const RADIUS = 33;
const HEIGHT = 23;
const SEED = 5;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const BASE = new Map(MATERIALS.map(m => [m.id, m.colors[0]] as const));
/** The material a block shape lays (an element shape lays none; the floor has none). */
const matOf = (s: Shape): number => ('m' in s ? s.m : 0);

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w * CELL;
  c.height = h * CELL;
  return c;
}

/** The plan: each column shows its highest block, in the colour of the material that holds it. */
function plan(p: SkyFloorPlan): HTMLCanvasElement {
  const n = RADIUS * 2 + 1;
  const top = new Map<number, [number, number]>();
  for (const s of p.shapes as Shape[]) {
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    for (let z = Math.max(z0, ORIGIN.z - RADIUS); z <= Math.min(z1, ORIGIN.z + RADIUS); z++)
      for (let x = Math.max(x0, ORIGIN.x - RADIUS); x <= Math.min(x1, ORIGIN.x + RADIUS); x++)
        for (let y = y0; y <= y1; y++)
          if (covers(s, x, y, z)) {
            const k = (z - ORIGIN.z + RADIUS) * n + (x - ORIGIN.x + RADIUS);
            const was = top.get(k);
            if (!was || y >= was[0]) top.set(k, [y, matOf(s)]);
          }
  }
  const c = canvas(n, n), g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.hall.low');
  g.fillRect(0, 0, c.width, c.height);
  for (const [k, [, m]] of top) {
    g.fillStyle = hex(BASE.get(m) ?? 0);
    g.fillRect((k % n) * CELL, Math.floor(k / n) * CELL, CELL, CELL);
  }
  return c;
}

/** A section along x through the mast's row (z one cell under the centre): ground at the bottom, the way up at the top. */
function section(p: SkyFloorPlan): HTMLCanvasElement {
  const n = RADIUS * 2 + 1, zCut = p.gate.z;
  const c = canvas(n, HEIGHT), g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.hall.low');
  g.fillRect(0, 0, c.width, c.height);
  for (const s of p.shapes as Shape[]) {
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    if (zCut < z0 || zCut > z1) continue;
    for (let x = Math.max(x0, ORIGIN.x - RADIUS); x <= Math.min(x1, ORIGIN.x + RADIUS); x++)
      for (let y = Math.max(y0, ORIGIN.y); y <= Math.min(y1, ORIGIN.y + HEIGHT - 1); y++)
        if (covers(s, x, y, zCut)) {
          g.fillStyle = hex(BASE.get(matOf(s)) ?? 0);
          g.fillRect((x - ORIGIN.x + RADIUS) * CELL, (ORIGIN.y + HEIGHT - 1 - y) * CELL, CELL, CELL);
        }
  }
  return c;
}

export function skyHorseGallery(g: GalleryKit) {
  const p = horse.generate(new Rng(SEED), ORIGIN);
  g.head('Sky floor 5, the meadow: the plan from above, and a section through the mast (ground at the bottom, the way up at the top)');
  const r = g.row();
  g.fig(r, plan(p), `plan · six paddocks, the runs, the mast at the centre · seed ${SEED}`);
  g.fig(r, section(p), `section · ${p.route.length - 1} rungs of the mast to the way up`);
}
