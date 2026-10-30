import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';

// The laboratory's alembic (docs/design/built/laboratory): a voxel model at 16 texels per block,
// drawn over ONE solid tile. It is the right half of the former two-tile station; the left half
// (the hearth) is now the kitchen (kitchen-model.ts). Side: world / vessel. Concept: inner
// alchemy (transmutation), the vessel where what a pattern left is brewed.
//
// Footprint: x in [0, 1], z in [0, 1], y in [0, 1.5]; the origin is the tile's lower corner.
// A stepped stone stand on the -X side seats the glass bulb; the low plinth on the +X side
// carries the copper coil (back) and the flask stand (front, facing +Z).
//
// Named children the game may drive (all optional):
//   ring-0, ring-1, ring-2  the three brass hoops round the bulb, bottom to top: brews left.
//                           Each owns its material, so a spent one can be dimmed (`material.color`).
//   flask                   the brewed flask waiting on the stand (hidden); its `flask-liquid`
//                           material takes the potion's liquid colour (`material.color`).
//   flask-slot              an empty anchor at the stand's cradle, where a flask sits.
// Geometry and materials are built per call and owned by the group: dispose them by traversal.
//
// The voxel toolkit below (VoxelGrid, voxelGeometry, the face painters) is shared with the
// kitchen, so both stations are carved and lit the same way.

export const T = 1 / 16;
/** Texel bounds of a one-tile station: 16 wide, 24 tall (1.5 blocks), 16 deep. */
const W = 16, H = 24;

// Directions: +X, -X, +Y, -Y, +Z, -Z.
export const DIRS: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const QUADS: number[][][] = [
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
];
export const UP = 2, DOWN = 3, PX = 0, NX = 1, PZ = 4;

const key = (x: number, y: number, z: number) => x + 128 * (y + 128 * z);
export const hash = (x: number, y: number, z: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export class VoxelGrid<K extends string> {
  readonly cells = new Map<number, { x: number; y: number; z: number; k: K }>();
  /** `s` voxels per texel: 1 for the model, 2 for thin pipes (a tube one texel thick). */
  constructor(readonly s = 1) {}
  set(x: number, y: number, z: number, k: K) {
    const s = this.s;
    if (x < 0 || x >= W * s || z < 0 || z >= W * s || y < 0 || y >= H * s) return;
    this.cells.set(key(x, y, z), { x, y, z, k });
  }
  del(x: number, y: number, z: number) { this.cells.delete(key(x, y, z)); }
  get(x: number, y: number, z: number) { return this.cells.get(key(x, y, z)); }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, k: K | null) {
    for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      if (k) this.set(x, y, z, k); else this.del(x, y, z);
    }
  }
  /** A horizontal disc or ring at row y round (cx, cz): voxel centres with rIn < r <= rOut. */
  ring(cx: number, cz: number, y: number, rIn: number, rOut: number, k: K) {
    const m = Math.ceil(rOut) + 1;
    for (let z = Math.floor(cz - m); z <= cz + m; z++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
      const r = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (r <= rOut && r > rIn) this.set(x, y, z, k);
    }
  }
  /** A round tube of radius `r` voxels along a path of points (voxel units). */
  tube(path: [number, number, number][], r: number, k: K) {
    for (const [px, py, pz] of path) {
      for (let y = Math.floor(py - r); y <= py + r; y++) for (let z = Math.floor(pz - r); z <= pz + r; z++) for (let x = Math.floor(px - r); x <= px + r; x++) {
        if (Math.hypot(x + 0.5 - px, y + 0.5 - py, z + 0.5 - pz) <= r) this.set(x, y, z, k);
      }
    }
  }
}

/** Faces of every cell whose `layerOf(k)` is `layer`; an opaque neighbour hides a face, a
 *  see-through neighbour hides only faces of its own layer. */
export function voxelGeometry<K extends string>(
  grids: VoxelGrid<K> | VoxelGrid<K>[], layer: string, layerOf: (k: K) => string, seeThrough: ReadonlySet<string>,
  painter: (k: K, x: number, y: number, z: number, d: number) => PalToken,
): THREE.BufferGeometry {
  const p: number[] = [], c: number[] = [];
  const col = new THREE.Color();
  for (const g of Array.isArray(grids) ? grids : [grids]) for (const v of g.cells.values()) {
    const u = T / g.s;
    if (layerOf(v.k) !== layer) continue;
    for (let d = 0; d < 6; d++) {
      const [dx, dy, dz] = DIRS[d];
      const n = g.get(v.x + dx, v.y + dy, v.z + dz);
      if (n) {
        const nl = layerOf(n.k);
        if (!seeThrough.has(nl) || nl === layer) continue;
      }
      col.setHex(pal(painter(v.k, v.x, v.y, v.z, d)));
      const q = QUADS[d];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        p.push((v.x + q[i][0]) * u, (v.y + q[i][1]) * u, (v.z + q[i][2]) * u);
        c.push(col.r, col.g, col.b);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  geo.computeVertexNormals();
  return geo;
}

export const STONE = ['mat.flagstone.outline', 'mat.flagstone.dark', 'mat.flagstone.base', 'mat.flagstone.hi'] as const;
export const stoneStep = (t: PalToken, k: number): PalToken =>
  STONE[Math.max(0, Math.min(3, STONE.indexOf(t as never) + k))];

/** Coursed dark stone side faces: four texels a course from row `base`, staggered joints. */
export function stoneCourse(x: number, y: number, z: number, d: number, base: number): PalToken {
  const [o, dk, b, h] = STONE;
  const a = d === PX || d === NX ? z : x;
  const row = (y - base) % 4;
  let t: PalToken = row === 0 ? dk : row === 1 ? b : row === 2 ? h : o;
  if (row === 3) return t;
  const j = (a + Math.floor((y - base) / 4) * 3) % 6;
  if (j === 0) return o;
  if (j === 1) t = stoneStep(t, 1);
  if (j === 5) t = stoneStep(t, -1);
  if (hash(x, y, z) < 0.08) t = stoneStep(t, -1);
  return t;
}

/** A metal lit from above and the front: [dark, base, hi]. */
export function metalFace(ramp: [PalToken, PalToken, PalToken], d: number, front: boolean): PalToken {
  if (d === UP) return ramp[2];
  if (d === DOWN) return ramp[0];
  return front ? ramp[1] : ramp[0];
}
export const ironFace = (x: number, y: number, z: number, d: number, front: boolean): PalToken =>
  d === UP ? 'iron.base' : d === DOWN ? 'iron.dark' : front && hash(x, y, z) < 0.15 ? 'iron.base' : 'iron.dark';

export const lambert = () => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: pal('ink.void') });
export const glassMat = () => new THREE.MeshLambertMaterial({
  vertexColors: true, emissive: pal('ink.void'), transparent: true, opacity: 0.45, depthWrite: false,
});
export function mesh(parent: THREE.Object3D, name: string, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------------------------------------
// The alembic.

type Kind = 'stone' | 'iron' | 'brass' | 'copper' | 'glass' | 'ring0' | 'ring1' | 'ring2' | 'fglass' | 'liquid';
const LAYER: Record<Kind, string> = {
  stone: 'solid', iron: 'solid', brass: 'solid', copper: 'solid',
  glass: 'glass', ring0: 'ring0', ring1: 'ring1', ring2: 'ring2', fglass: 'fglass', liquid: 'liquid',
};
const layerOf = (k: Kind) => LAYER[k];
const SEE_THROUGH = new Set(['glass', 'fglass']);
type Grid = VoxelGrid<Kind>;

// The bulb (cucurbit) on its stone stand, -X side.
const BX = 5.5, BZ = 8.5, BY = 13.5, BR = 4.4;
const bulbR = (y: number) => {
  const d = y + 0.5 - BY;
  return d * d < BR * BR ? Math.sqrt(BR * BR - d * d) : 0;
};
const RING_Y = [11, 13, 15];
// The coil (worm): copper round an iron post at the back of the +X plinth.
const CX = 12.5, CZ = 5, CR = 2.1, COIL_TOP = 20, COIL_BOT = 11, TURNS = 2.5;
// The flask stand, in front of the coil.
const FX = 12.5, FZ = 11.5, FY = 6.6, FR = 1.8;

function carve(): Grid {
  const g: Grid = new VoxelGrid<Kind>();
  // the stand: stepped stone, footing, body, cornice, so it never reads as a cube
  g.box(0, 11, 0, 2, 2, 15, 'stone');
  g.box(1, 10, 2, 7, 3, 14, 'stone');
  g.box(0, 11, 7, 8, 2, 15, 'stone');
  g.box(1, 10, 8, 9, 3, 14, 'stone');
  // the +X plinth, a step lower
  g.box(10, 16, 0, 3, 1, 15, 'stone');

  g.ring(BX, BZ, 9, 1.8, 3.4, 'iron');               // the seat
  for (let y = 9; y < 18; y++) {                     // the bulb: a glass shell
    const r = bulbR(y);
    if (r > 0) g.ring(BX, BZ, y, -1, r, 'glass');
  }
  g.ring(BX, BZ, 18, 0.6, 1.4, 'glass');             // neck, collar and helm
  g.ring(BX, BZ, 19, 0, 2.0, 'brass');
  g.ring(BX, BZ, 20, 0, 2.5, 'brass');
  g.ring(BX, BZ, 21, 0, 1.4, 'brass');
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) { // iron ribs
    for (let y = 9; y <= 15; y++) {
      const r = Math.max(bulbR(y), 2.4) + 0.55;
      g.set(Math.floor(BX + r * Math.cos(a)), y, Math.floor(BZ + r * Math.sin(a)), 'iron');
    }
  }
  RING_Y.forEach((y, i) => {                         // the three brass hoops: brews left
    const r = bulbR(y);
    g.ring(BX, BZ, y, r - 0.1, r + 0.95, (['ring0', 'ring1', 'ring2'] as const)[i]);
  });
  g.box(8, 9, 20, 21, 7, 10, 'brass');               // the beak's sleeve

  g.box(CX - 1, CX + 1, 3, COIL_TOP + 1, CZ - 1, CZ + 1, 'iron'); // the coil's post, brass cap
  g.box(CX - 1, CX + 1, COIL_TOP + 1, COIL_TOP + 2, CZ - 1, CZ + 1, 'brass');
  g.box(CX - 3, CX + 4, 16, 17, CZ - 1, CZ, 'iron'); // an arm holds the coil
  g.ring(FX, FZ, 5, 1.6, 2.6, 'brass');              // the flask cradle on three iron legs
  for (const a of [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 + 4.189]) {
    const x = Math.floor(FX + 2.1 * Math.cos(a)), z = Math.floor(FZ + 2.1 * Math.sin(a));
    g.box(x, x + 1, 3, 5, z, z + 1, 'iron');
  }
  return g;
}

/** The copper at two voxels per texel: the beak, the coil and the spout over the flask. */
function carvePipes(): Grid {
  const f: Grid = new VoxelGrid<Kind>(2);
  const path: [number, number, number][] = [];
  const seg = (a: number[], b: number[], n: number) => {
    for (let i = 0; i <= n; i++) path.push([0, 1, 2].map(j => 2 * (a[j] + (b[j] - a[j]) * i / n)) as [number, number, number]);
  };
  seg([BX + 2.5, 20.5, BZ], [9.5, 20.5, 7], 20);
  seg([9.5, 20.5, 7], [CX - CR, COIL_TOP + 0.5, CZ], 30);
  const steps = 500;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.PI + t * TURNS * Math.PI * 2;
    path.push([2 * (CX + CR * Math.cos(a)), 2 * (COIL_TOP + 0.5 - t * (COIL_TOP - COIL_BOT)), 2 * (CZ + CR * Math.sin(a))]);
  }
  const end = Math.PI + TURNS * Math.PI * 2;
  seg([CX + CR * Math.cos(end), COIL_BOT + 0.5, CZ + CR * Math.sin(end)], [FX, COIL_BOT - 0.5, FZ - 0.5], 20);
  f.tube(path, 1.05, 'copper');
  return f;
}

function carveFlask(): Grid {
  const g: Grid = new VoxelGrid<Kind>();
  for (let y = 5; y < 9; y++) {
    const d = y + 0.5 - FY;
    const r = d * d < FR * FR ? Math.sqrt(FR * FR - d * d) + 0.3 : 0;
    if (r <= 0) continue;
    g.ring(FX, FZ, y, -1, r, 'fglass');
    if (y <= 6) g.ring(FX, FZ, y, -1, Math.max(0, r - 0.9), 'liquid');
  }
  g.ring(FX, FZ, 9, 0, 0.9, 'fglass');
  return g;
}

function stone(x: number, y: number, z: number, d: number): PalToken {
  const [o, dk, b, h] = STONE;
  if (d === DOWN) return o;
  if (d === UP) return y === 7 ? ((x + z) % 7 === 0 ? b : h) : y === 8 ? (x % 4 === 0 || z % 6 === 0 ? dk : b) : x % 5 === 2 || z % 6 === 1 ? b : h;
  if (y <= 1) return y === 1 ? ((x + z + 2) % 7 === 0 ? o : b) : dk;
  if (x >= 10 && y === 2) return h;
  if (y === 7) return h;
  if (y === 8) return b;
  return stoneCourse(x, y, z, d, 2);
}

function paint(k: Kind, x: number, y: number, z: number, d: number): PalToken {
  const front = d === PZ || d === NX;
  switch (k) {
    case 'stone': return stone(x, y, z, d);
    case 'iron': return ironFace(x, y, z, d, front);
    case 'brass': return metalFace(['brass.dark', 'brass.base', 'brass.hi'], d, front);
    case 'copper': return metalFace(['copper.dark', 'copper.base', 'copper.hi'], d, front);
    case 'ring0': case 'ring1': case 'ring2':
      if (d === DOWN) return 'brass.dark';
      if (d === UP) return 'brass.hi';
      return -(x + 0.5 - BX) + (z + 0.5 - BZ) > 0 ? 'brass.hi' : 'brass.base';
    case 'glass': case 'fglass': {
      const cx = k === 'glass' ? BX : FX, cz = k === 'glass' ? BZ : FZ, cy = k === 'glass' ? BY : FY;
      const nx = x + 0.5 - cx, ny = y + 0.5 - cy, nz = z + 0.5 - cz;
      const lit = (-0.45 * nx + 0.55 * ny + 0.7 * nz) / (Math.hypot(nx, ny, nz) || 1);
      return lit > 0.86 && d !== DOWN ? 'bone.paper' : 'el.water.foam';
    }
    case 'liquid': return d === UP ? 'bone.paper' : 'bone.dim';
  }
}

const geo = (g: Grid | Grid[], layer: string) => voxelGeometry(g, layer, layerOf, SEE_THROUGH, paint);

/** The laboratory's alembic on one tile, origin at the tile's lower corner. */
export function buildAlembicModel(): THREE.Group {
  const g = carve();
  const root = new THREE.Group();
  root.name = 'alembic';
  mesh(root, 'alembic-body', geo([g, carvePipes()], 'solid'), lambert());
  for (const i of [0, 1, 2]) mesh(root, `ring-${i}`, geo(g, `ring${i}`), lambert());
  mesh(root, 'bulb', geo(g, 'glass'), glassMat()).renderOrder = 1;

  const f = carveFlask();
  const flask = new THREE.Group();
  flask.name = 'flask';
  flask.visible = false;
  root.add(flask);
  mesh(flask, 'flask-liquid', geo(f, 'liquid'), new THREE.MeshLambertMaterial({ vertexColors: true, color: pal('path.body.base'), emissive: pal('ink.void') }));
  mesh(flask, 'flask-glass', geo(f, 'fglass'), glassMat()).renderOrder = 1;

  const slot = new THREE.Object3D();
  slot.name = 'flask-slot';
  slot.position.set(FX * T, 5 * T, FZ * T);
  root.add(slot);
  return root;
}
