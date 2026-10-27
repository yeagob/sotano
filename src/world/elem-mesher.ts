// Element meshing: water and lava surfaces with heights from their level, and fire as two crossed
// quads per burning cell (docs/architecture/ELEMENTS.md §9.4). Pure (no three.js, no DOM), it runs
// in the meshing worker next to the block mesher. Three groups, one per element, so each gets its
// own material: water translucent, lava full-bright, fire alpha-tested and animated by the renderer
// (texture offsets), never by re-meshing.

import { AIR } from '../content/materials';
import { EL_FIRE, EL_LAVA, EL_WATER, SOURCE, elemLevel, fluidHeight } from '../content/elements';

export interface ElemMeshData {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  /** Index ranges [start, count] for water, lava and fire. */
  groups: [number, number][];
}

/** Face shades, as for blocks (top brightest). */
const SHADE_TOP = 1, SHADE_SIDE = 0.82, SHADE_BOTTOM = 0.6;

export function meshElements(blocks: Uint8Array, elem: Uint8Array, size: number): ElemMeshData {
  const P = size + 2;
  const id = (x: number, y: number, z: number) => (x + 1) + P * ((y + 1) + P * (z + 1));
  const kindAt = (x: number, y: number, z: number) => elem[id(x, y, z)] >> 6;
  const solidAt = (x: number, y: number, z: number) => blocks[id(x, y, z)] !== AIR;

  const pos: number[] = [], uv: number[] = [], col: number[] = [];
  const idx: number[][] = [[], [], []];

  const quad = (g: number, c: number[][], uvs: number[][], shade: number) => {
    const v0 = pos.length / 3;
    for (let k = 0; k < 4; k++) { pos.push(c[k][0], c[k][1], c[k][2]); uv.push(uvs[k][0], uvs[k][1]); col.push(shade, shade, shade); }
    idx[g].push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
  };

  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const b = elem[id(x, y, z)], kind = b >> 6;
    if (!kind || solidAt(x, y, z)) continue;
    if (kind === EL_FIRE) {
      // two crossed quads, taller when the flame has more to burn; eternal flames stand a full block
      const lv = elemLevel(b), h = lv === SOURCE ? 1 : 0.45 + lv / 8 * 0.5, g = 2;
      const a = 0.15, e = 0.85;
      quad(g, [[x + a, y, z + a], [x + e, y, z + e], [x + e, y + h, z + e], [x + a, y + h, z + a]], [[0, 0], [1, 0], [1, h], [0, h]], 1);
      quad(g, [[x + e, y, z + a], [x + a, y, z + e], [x + a, y + h, z + e], [x + e, y + h, z + a]], [[0, 0], [1, 0], [1, h], [0, h]], 1);
      continue;
    }
    const g = kind === EL_WATER ? 0 : kind === EL_LAVA ? 1 : -1;
    if (g < 0) continue;
    const same = (dx: number, dy: number, dz: number) => kindAt(x + dx, y + dy, z + dz) === kind;
    // corner heights: the average of the fluid cells around each corner (air counts as empty, solid
    // is ignored), so a spreading flow slopes down to its tip like a ramp instead of stepping
    const cellH = (cx: number, cz: number): number | null => {
      if (solidAt(cx, y, cz)) return null;
      if (kindAt(cx, y, cz) !== kind) return 0;
      return kindAt(cx, y + 1, cz) === kind ? 1 : fluidHeight(elem[id(cx, y, cz)]);
    };
    const corner = (cx: number, cz: number) => {
      let sum = 0, n = 0;
      for (const [ox, oz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
        const h = cellH(cx + ox, cz + oz);
        if (h === null) continue;
        if (h >= 1) return 1;
        sum += h; n++;
      }
      return Math.max(0.05, n ? sum / n : 0.5);
    };
    const full = same(0, 1, 0);
    // corner heights at (x, z), (x+1, z), (x+1, z+1), (x, z+1)
    const h00 = full ? 1 : corner(x, z), h10 = full ? 1 : corner(x + 1, z);
    const h11 = full ? 1 : corner(x + 1, z + 1), h01 = full ? 1 : corner(x, z + 1);
    // top: world-space uvs so the texture scrolls continuously across cells and chunks
    if (!full) {
      quad(g, [[x, y + h01, z + 1], [x + 1, y + h11, z + 1], [x + 1, y + h10, z], [x, y + h00, z]],
        [[x, z + 1], [x + 1, z + 1], [x + 1, z], [x, z]], SHADE_TOP);
    }
    if (!same(0, -1, 0) && !solidAt(x, y - 1, z))
      quad(g, [[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], [[x, z], [x + 1, z], [x + 1, z + 1], [x, z + 1]], SHADE_BOTTOM);
    // sides, against anything that isn't solid or the same fluid, up to the corner heights
    const sides: [number, number, number[][]][] = [
      [1, 0, [[x + 1, y, z + 1], [x + 1, y, z], [x + 1, y + h10, z], [x + 1, y + h11, z + 1]]],
      [-1, 0, [[x, y, z], [x, y, z + 1], [x, y + h01, z + 1], [x, y + h00, z]]],
      [0, 1, [[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + h11, z + 1], [x, y + h01, z + 1]]],
      [0, -1, [[x + 1, y, z], [x, y, z], [x, y + h00, z], [x + 1, y + h10, z]]],
    ];
    for (const [dx, dz, c] of sides) {
      if (same(dx, 0, dz) || solidAt(x + dx, y, z + dz)) continue;
      const u = dx ? z : x;
      quad(g, c, [[u, y], [u + 1, y], [u + 1, y + c[2][1] - y], [u, y + c[3][1] - y]], SHADE_SIDE);
    }
  }

  const all: number[] = [], groups: [number, number][] = [];
  for (const list of idx) { groups.push([all.length, list.length]); for (const i of list) all.push(i); }
  return {
    positions: new Float32Array(pos), uvs: new Float32Array(uv), colors: new Float32Array(col),
    indices: new Uint32Array(all), groups,
  };
}
