// Chunk meshing: visible faces only, per-vertex ambient occlusion and per-face shading.
// A pure function (no three.js, no DOM) so it can run inside a Web Worker.

import { AIR } from '../content/materials';
import { tileFor, tileUV } from '../content/tiles';

type V3 = [number, number, number];

/** Faces: normal, base corner and u, v axes with u × v = normal (so corners come out counter-clockwise). */
export const FACES: { n: V3; base: V3; u: V3; v: V3; shade: number }[] = [
  { n: [1, 0, 0], base: [1, 0, 1], u: [0, 0, -1], v: [0, 1, 0], shade: 0.8 },
  { n: [-1, 0, 0], base: [0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], shade: 0.8 },
  { n: [0, 1, 0], base: [0, 1, 1], u: [1, 0, 0], v: [0, 0, -1], shade: 1.0 },
  { n: [0, -1, 0], base: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], shade: 0.5 },
  { n: [0, 0, 1], base: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], shade: 0.65 },
  { n: [0, 0, -1], base: [1, 0, 0], u: [-1, 0, 0], v: [0, 1, 0], shade: 0.65 },
];

const CORNERS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AO_CURVE = [0.5, 0.68, 0.84, 1];

export interface MeshData {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

/** Warm glow baked on faces lit by lava or fire (until block light lands, art guide §8). */
const GLOW: [number, number, number] = [0.75, 0.32, -0.1];

/** `padded` is a (size+2)³ cube with the chunk in the middle and a 1-voxel border from its neighbours.
 *  `elem`, the same cube of the element layer, bakes a warm glow on faces next to lava or fire. */
export function meshChunk(padded: Uint8Array, size: number, elem?: Uint8Array): MeshData {
  const P = size + 2;
  const at = (x: number, y: number, z: number) => padded[(x + 1) + P * ((y + 1) + P * (z + 1))];
  const lit = (x: number, y: number, z: number) => {
    if (!elem || x < -1 || y < -1 || z < -1 || x > size || y > size || z > size) return 0;
    const k = elem[(x + 1) + P * ((y + 1) + P * (z + 1))] >> 6;
    return k === 2 ? 1 : k === 3 ? 0.8 : 0;
  };
  const occ = (x: number, y: number, z: number) => (at(x, y, z) !== AIR ? 1 : 0);

  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];

  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const m = at(x, y, z);
    if (m === AIR) continue;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f];
      const fx = x + F.n[0], fy = y + F.n[1], fz = z + F.n[2];
      if (at(fx, fy, fz) !== AIR) continue;
      const tile = tileFor(m, f);
      const v0 = pos.length / 3;
      // light from an element in the cell in front of the face, or one step beyond it
      let g = lit(fx, fy, fz);
      if (elem && g < 1) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]])
        g = Math.max(g, lit(fx + dx, fy + dy, fz + dz) * 0.55);
      const ao: number[] = [];
      for (const [a, b] of CORNERS) {
        const cx = F.base[0] + a * F.u[0] + b * F.v[0];
        const cy = F.base[1] + a * F.u[1] + b * F.v[1];
        const cz = F.base[2] + a * F.u[2] + b * F.v[2];
        pos.push(x + cx, y + cy, z + cz);
        const [tu, tv] = tileUV(tile, a, b);
        uv.push(tu, tv);
        // the vertex's side neighbours, in the layer in front of the face
        const su = a ? 1 : -1, sv = b ? 1 : -1;
        const ux = F.u[0] * su, uy = F.u[1] * su, uz = F.u[2] * su;
        const vx = F.v[0] * sv, vy = F.v[1] * sv, vz = F.v[2] * sv;
        const s1 = occ(fx + ux, fy + uy, fz + uz);
        const s2 = occ(fx + vx, fy + vy, fz + vz);
        const c = occ(fx + ux + vx, fy + uy + vy, fz + uz + vz);
        const level = s1 && s2 ? 0 : 3 - (s1 + s2 + c);
        ao.push(level);
        const l = AO_CURVE[level] * F.shade;
        col.push(l + g * GLOW[0], l + g * GLOW[1], l + g * GLOW[2]);
      }
      // flip the quad diagonal so the occlusion does not look anisotropic
      if (ao[0] + ao[2] < ao[1] + ao[3]) idx.push(v0 + 1, v0 + 2, v0 + 3, v0 + 1, v0 + 3, v0);
      else idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    }
  }
  return {
    positions: new Float32Array(pos),
    uvs: new Float32Array(uv),
    colors: new Float32Array(col),
    indices: new Uint32Array(idx),
  };
}
