// ?gallery=sky-lion (docs/architecture/SKY.md §11). Owned by: F4, B4. Rulings: docs/art/sky/lion.md.
// The floor from above: the plan of sky floor 4 (rocks, the Sunning Ledge, the thorn tree, nests, spawns,
// route), north up, 1 block = 8 pixels. The ground view and the beings come with the renderer and with B4.

import { palCss } from '../../content/palette';
import { Rng } from '../../core/rng';
import { lion } from '../../sky/floors/lion';
import type { GalleryKit } from '../gallery';

const PX = 8;
const HALF = 30;

export function skyLionGallery(g: GalleryKit) {
  g.head('Sky floor 4, the lion, from above: rocks, the Sunning Ledge, the thorn tree, nests (gold), spawns, route');
  // The plan is built at the origin, so its cells are relative to the hall's ground centre.
  const plan = lion.generate(new Rng(1), { x: 0, y: 0, z: 0 });
  const size = HALF * 2 * PX;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cg = c.getContext('2d')!;
  // Cell (x, z) to pixels: x to the right, z down (north is up, so z grows south).
  const cell = (x: number, z: number): [number, number] => [(x + HALF) * PX, (z + HALF) * PX];
  cg.fillStyle = palCss('sky.hall.high');
  cg.fillRect(0, 0, size, size);
  cg.beginPath();
  cg.arc(HALF * PX, HALF * PX, 26 * PX, 0, Math.PI * 2);
  cg.fillStyle = palCss('mat.moss.dark');
  cg.fill();
  for (const s of plan.shapes) {
    if (s.k === 'box') {
      const [px, pz] = cell(s.x0, s.z0);
      cg.fillStyle = palCss(s.tag === plan.seat.tag ? 'mat.palestone.hi' : 'mat.palestone.base');
      cg.fillRect(px, pz, (s.x1 - s.x0 + 1) * PX, (s.z1 - s.z0 + 1) * PX);
    } else if (s.k === 'helix') {
      const [px, pz] = cell(s.cx - 2, s.cz - 2);
      cg.fillStyle = palCss('mat.skywood.base');
      cg.fillRect(px, pz, 5 * PX, 5 * PX);
    }
  }
  for (const p of plan.route) {
    const [px, pz] = cell(p.x, p.z);
    cg.fillStyle = palCss('mat.skyleaf.hi');
    cg.fillRect(px + PX * 0.25, pz + PX * 0.25, PX * 0.5, PX * 0.5);
  }
  for (const n of plan.nests) {
    const [px, pz] = cell(n.x, n.z);
    cg.fillStyle = palCss('light.gold');
    cg.fillRect(px + 1, pz + 1, PX - 2, PX - 2);
  }
  for (const s of plan.spawns) {
    const [px, pz] = cell(s.x, s.z);
    cg.fillStyle = palCss('mat.fencewood.hi');
    cg.fillRect(px + 1, pz + 1, PX - 2, PX - 2);
  }
  const [sx, sz] = cell(plan.seat.x - ((plan.seat.w - 1) >> 1), plan.seat.z - ((plan.seat.d - 1) >> 1));
  cg.strokeStyle = palCss('mat.palestone.outline');
  cg.lineWidth = 2;
  cg.strokeRect(sx, sz, plan.seat.w * PX, plan.seat.d * PX);
  g.fig(g.row(), c, 'plan, north up, 1 block = 8 px');
}
