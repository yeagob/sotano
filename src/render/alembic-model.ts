import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';

// The laboratory's alembic (docs/design/built/laboratory): a voxel model at 16 texels per block,
// drawn over two tiles and built as two one-tile models split exactly at the seam x = 1: the
// -X tile is the kitchen (buildKitchenTile, re-exported by kitchen-model.ts), the +X tile the alembic. Side: world / vessel. Concept: inner alchemy (transmutation),
// the vessel where what a pattern left is brewed. It never glows at rest: the hearth is banked
// and only the player's positive intention lights it (`hearth-glow`).
//
// Footprint: x in [0, 2], z in [0, 1], y in [0, 1.5625]; the origin is the lower corner of the
// tile on the -X side. Tile 0 holds the stone hearth with the glass bulb on it; tile 1 holds the
// copper coil and the flask stand. The hearth's mouth and the flask face +Z.
//
// Named children the game may drive (all optional):
//   ring-0, ring-1, ring-2  the three brass hoops round the bulb, bottom to top: brews left.
//                           Each owns its material, so a spent one can be dimmed (`material.color`).
//   hearth-coals            the banked coals (shown at rest).
//   hearth-glow             the same coals lit (hidden; show it and hide the coals while brewing).
//   flask                   the brewed flask waiting on the stand (hidden); its `flask-liquid`
//                           material takes the potion's liquid colour (`material.color`).
//   flask-slot              an empty anchor at the stand's cradle, where a flask sits.
// Geometry and materials are built per call and owned by the group: dispose them by traversal.

const T = 1 / 16;

type Kind =
  | 'stone' | 'iron' | 'ironHi' | 'brass' | 'copper' | 'coal'
  | 'glass' | 'ring0' | 'ring1' | 'ring2' | 'fglass' | 'liquid';

type Layer = 'solid' | 'glass' | 'ring0' | 'ring1' | 'ring2' | 'coal' | 'fglass' | 'liquid';

const LAYER: Record<Kind, Layer> = {
  stone: 'solid', iron: 'solid', ironHi: 'solid', brass: 'solid', copper: 'solid',
  coal: 'coal', glass: 'glass', ring0: 'ring0', ring1: 'ring1', ring2: 'ring2',
  fglass: 'fglass', liquid: 'liquid',
};

const SEE_THROUGH = new Set<Layer>(['glass', 'fglass']);

// Directions: +X, -X, +Y, -Y, +Z, -Z.
const DIRS: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const QUADS: number[][][] = [
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
];
const UP = 2, DOWN = 3, PX = 0, NX = 1, PZ = 4;

const key = (x: number, y: number, z: number) => x + 128 * (y + 128 * z);
const hash = (x: number, y: number, z: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// The bulb (cucurbit): a glass sphere seated on the hearth.
const BX = 8, BZ = 8, BY = 16, BR = 5.3;
const bulbR = (y: number) => {
  const d = y + 0.5 - BY;
  return d * d < BR * BR ? Math.sqrt(BR * BR - d * d) : 0;
};
const RING_Y = [12, 15, 18];
// The coil (worm): copper round an iron post on tile 1.
const CX = 24, CZ = 8, CR = 3.5, COIL_TOP = 22, COIL_BOT = 12, TURNS = 2.75;
// The flask stand, in front of the coil.
const FX = 24, FZ = 12, FY = 7.5, FR = 2.2;

class Grid {
  readonly cells = new Map<number, { x: number; y: number; z: number; k: Kind }>();
  /** `s` voxels per texel: 1 for the model, 2 for the thin copper pipes (a tube one texel thick). */
  constructor(readonly s = 1) {}
  set(x: number, y: number, z: number, k: Kind) {
    const s = this.s;
    if (x < 0 || x >= 32 * s || z < 0 || z >= 16 * s || y < 0 || y >= 25 * s) return;
    this.cells.set(key(x, y, z), { x, y, z, k });
  }
  del(x: number, y: number, z: number) { this.cells.delete(key(x, y, z)); }
  get(x: number, y: number, z: number) { return this.cells.get(key(x, y, z)); }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, k: Kind | null) {
    for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      if (k) this.set(x, y, z, k); else this.del(x, y, z);
    }
  }
  /** A horizontal disc or ring at row y round (cx, cz): voxel centres with rIn < r <= rOut. */
  ring(cx: number, cz: number, y: number, rIn: number, rOut: number, k: Kind) {
    const m = Math.ceil(rOut) + 1;
    for (let z = Math.floor(cz - m); z <= cz + m; z++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
      const r = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (r <= rOut && r > rIn) this.set(x, y, z, k);
    }
  }
  /** A round tube of radius `r` voxels along a path of points (voxel units). */
  tube(path: [number, number, number][], r: number, k: Kind) {
    for (const [px, py, pz] of path) {
      for (let y = Math.floor(py - r); y <= py + r; y++) for (let z = Math.floor(pz - r); z <= pz + r; z++) for (let x = Math.floor(px - r); x <= px + r; x++) {
        if (Math.hypot(x + 0.5 - px, y + 0.5 - py, z + 0.5 - pz) <= r) this.set(x, y, z, k);
      }
    }
  }
}

function carve(): Grid {
  const g = new Grid();

  // --- tile 0: the hearth (athanor), dark worn stone, stepped so it never reads as a cube
  g.box(1, 15, 0, 2, 1, 15, 'stone');             // footing
  g.box(2, 14, 2, 9, 2, 14, 'stone');             // body
  g.box(1, 15, 9, 10, 1, 15, 'stone');            // cornice, one texel proud
  g.box(2, 14, 10, 11, 2, 14, 'stone');           // the hob
  // the fire mouth on +Z: an arch six wide, five tall, four deep
  g.box(5, 11, 2, 7, 9, 14, null);
  g.box(6, 10, 7, 8, 9, 14, null);
  g.box(4, 12, 8, 9, 13, 15, 'iron');             // iron lintel over the arch
  g.box(5, 11, 2, 3, 9, 13, 'coal');              // the banked coal bed
  for (let x = 5; x < 11; x += 2) g.box(x, x + 1, 3, 4, 9, 13, 'iron'); // the grate
  g.box(4, 12, 1, 2, 14, 15, 'iron');             // iron sill in front of the mouth
  // two rivets of the lintel and a vent on the back
  g.set(4, 8, 14, 'ironHi'); g.set(11, 8, 14, 'ironHi');
  g.box(6, 10, 4, 6, 2, 3, null);
  // the flue, back-left, an iron pipe with a cap
  g.box(2, 4, 11, 18, 2, 4, 'iron');
  g.box(1, 5, 18, 19, 1, 5, 'iron');
  g.box(2, 4, 19, 20, 2, 4, 'ironHi');

  // the seat: an iron ring the bulb sits in
  g.ring(BX, BZ, 11, 2.2, 3.9, 'iron');

  // --- the bulb: a hollow glass shell, one to two voxels thick
  for (let y = 11; y < 21; y++) {
    const r = bulbR(y);
    if (r > 0) g.ring(BX, BZ, y, -1, r, 'glass');
  }
  // its neck, then a brass collar and the helm (the alembic's head)
  g.ring(BX, BZ, 21, 0.8, 1.6, 'glass');
  g.ring(BX, BZ, 22, 0, 2.3, 'brass');
  g.ring(BX, BZ, 23, 0, 2.9, 'brass');
  g.ring(BX, BZ, 24, 0, 1.6, 'brass');
  // four iron ribs cradle the bulb from the seat up to the top hoop
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
    for (let y = 11; y <= 18; y++) {
      const r = Math.max(bulbR(y), 2.6) + 0.55;
      g.set(Math.floor(BX + r * Math.cos(a)), y, Math.floor(BZ + r * Math.sin(a)), 'iron');
    }
  }
  // the three brass hoops: brews left
  RING_Y.forEach((y, i) => {
    const r = bulbR(y);
    g.ring(BX, BZ, y, r - 0.1, r + 0.95, (['ring0', 'ring1', 'ring2'] as const)[i]);
  });

  g.box(11, 12, 23, 24, 7, 9, 'brass');            // the beak's sleeve at the helm
  // --- tile 1: a low stone plinth, a step down from the hearth
  g.box(14, 17, 0, 2, 4, 12, 'stone');
  g.box(17, 31, 0, 3, 2, 15, 'stone');
  // the iron post the coil winds round, with a brass cap
  g.box(CX - 1, CX + 1, 3, COIL_TOP + 1, CZ - 1, CZ + 1, 'iron');
  g.box(CX - 1, CX + 1, COIL_TOP + 1, COIL_TOP + 2, CZ - 1, CZ + 1, 'brass');
  // two iron arms hold the coil
  g.box(CX - 4, CX + 4, 17, 18, CZ - 1, CZ, 'iron');
  g.set(FX, COIL_BOT - 1, FZ, 'brass');            // the drip lip over the flask's mouth

  // the flask stand: a brass cradle ring on three iron legs
  g.ring(FX, FZ + 0.5, 5, 2.0, 3.0, 'brass');
  for (const a of [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 + 4.189]) {
    g.box(Math.floor(FX + 2.6 * Math.cos(a)), Math.floor(FX + 2.6 * Math.cos(a)) + 1, 3, 5,
      Math.floor(FZ + 0.5 + 2.6 * Math.sin(a)), Math.floor(FZ + 0.5 + 2.6 * Math.sin(a)) + 1, 'iron');
  }
  return g;
}

/** The copper, at two voxels per texel so a tube one texel thick can curve: the beak from the
 *  helm down to the coil, the coil (a helix round the post), and the spout over the flask. */
function carvePipes(): Grid {
  const f = new Grid(2);
  const path: [number, number, number][] = [];
  const seg = (a: number[], b: number[], n: number) => {
    for (let i = 0; i <= n; i++) path.push([0, 1, 2].map(j => 2 * (a[j] + (b[j] - a[j]) * i / n)) as [number, number, number]);
  };
  const top = [CX + CR * Math.cos(Math.PI), COIL_TOP + 0.5, CZ];
  seg([BX + 3, 23.5, BZ], [14, 23.5, BZ], 40);
  seg([14, 23.5, BZ], [top[0], top[1], top[2]], 60);
  const steps = 600;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.PI + t * TURNS * Math.PI * 2;
    path.push([2 * (CX + CR * Math.cos(a)), 2 * (COIL_TOP + 0.5 - t * (COIL_TOP - COIL_BOT)), 2 * (CZ + CR * Math.sin(a))]);
  }
  seg([CX, COIL_BOT + 0.5, CZ + CR], [FX + 0.5, COIL_BOT + 0.5, FZ + 0.5], 20);
  f.tube(path, 1.05, 'copper');
  return f;
}

/** The brewed flask: a small glass bulb with a neck, holding a liquid (hidden until a brew). */
function carveFlask(): Grid {
  const g = new Grid();
  for (let y = 5; y < 10; y++) {
    const d = y + 0.5 - FY;
    const r = d * d < FR * FR ? Math.sqrt(FR * FR - d * d) + 0.3 : 0;
    if (r <= 0) continue;
    g.ring(FX, FZ + 0.5, y, -1, r, 'fglass');
    if (y <= 7) g.ring(FX, FZ + 0.5, y, -1, Math.max(0, r - 0.9), 'liquid');
  }
  g.ring(FX, FZ + 0.5, 10, 0, 1.0, 'fglass');
  return g;
}

const RAMP = {
  stone: ['mat.flagstone.outline', 'mat.flagstone.dark', 'mat.flagstone.base', 'mat.flagstone.hi'],
} as const;

const inMouth = (x: number, y: number, z: number) => x >= 5 && x <= 10 && y >= 2 && y <= 7 && z >= 9 && z <= 13;

function stone(x: number, y: number, z: number, d: number): PalToken {
  const [o, dk, b, h] = RAMP.stone;
  const step = (t: PalToken, k: number): PalToken => {
    const i = Math.max(0, Math.min(3, RAMP.stone.indexOf(t as never) + k));
    return RAMP.stone[i];
  };
  if (d === DOWN) return o;
  if (inMouth(x + DIRS[d][0], y + DIRS[d][1], z + DIRS[d][2])) return (x + y + z) % 3 === 0 ? dk : o; // soot
  if (d === UP) {
    if (y === 9) return (x + z) % 7 === 0 ? b : h;       // cornice top, worn
    if (y === 10) return x % 4 === 0 || z % 6 === 0 ? dk : b; // the hob's slabs
    if (y === 1) return h;                                // footing ledge
    return x % 5 === 2 || z % 6 === 1 ? b : h;            // plinth top: worn slabs
  }
  const a = d === PX || d === NX ? z : x;
  if (y <= 1) return y === 1 ? ((a + 2) % 7 === 0 ? o : b) : dk;
  if (x >= 14 && y <= 2) return y === 2 ? h : b;          // tile 1 plinth and the step
  if (y === 9) return h;
  if (y === 10) return b;
  const row = (y - 2) % 4;
  let t: PalToken = row === 0 ? dk : row === 1 ? b : row === 2 ? h : o;
  if (row === 3) return t;
  const c = Math.floor((y - 2) / 4);
  const j = (a + c * 3) % 6;
  if (j === 0) return o;
  if (j === 1) t = step(t, 1);
  if (j === 5) t = step(t, -1);
  if (hash(x, y, z) < 0.08) t = step(t, -1);
  return t;
}

function metal(ramp: [PalToken, PalToken, PalToken], d: number, front: boolean): PalToken {
  if (d === UP) return ramp[2];
  if (d === DOWN) return ramp[0];
  return front ? ramp[1] : ramp[0];
}

function paint(k: Kind, x: number, y: number, z: number, d: number): PalToken {
  const front = d === PZ || d === NX;
  switch (k) {
    case 'stone': return stone(x, y, z, d);
    case 'iron': return d === UP ? 'iron.base' : d === DOWN ? 'iron.dark' : front && hash(x, y, z) < 0.15 ? 'iron.base' : 'iron.dark';
    case 'ironHi': return d === DOWN ? 'iron.base' : 'iron.hi';
    case 'brass': return metal(['brass.dark', 'brass.base', 'brass.hi'], d, front);
    case 'copper': return metal(['copper.dark', 'copper.base', 'copper.hi'], d, front);
    case 'ring0': case 'ring1': case 'ring2': {
      if (d === DOWN) return 'brass.dark';
      if (d === UP) return 'brass.hi';
      // lit from the top-left and the front, as every shape is
      const nx = x + 0.5 - BX, nz = z + 0.5 - BZ;
      return -nx + nz > 0 ? 'brass.hi' : 'brass.base';
    }
    case 'coal': {
      const h = hash(x, y, z);
      return h < 0.3 ? 'el.ember.dead' : h < 0.6 ? 'mat.bedrock.hi' : h < 0.85 ? 'mat.bedrock.base' : 'el.smoke';
    }
    case 'glass': case 'fglass': {
      const cx = k === 'glass' ? BX : FX, cz = k === 'glass' ? BZ : FZ + 0.5, cy = k === 'glass' ? BY : FY;
      const nx = x + 0.5 - cx, ny = y + 0.5 - cy, nz = z + 0.5 - cz;
      const len = Math.hypot(nx, ny, nz) || 1;
      // one glint, high on the front-left, where the top-left light catches the curve
      const lit = (-0.45 * nx + 0.55 * ny + 0.7 * nz) / len;
      return lit > 0.86 && d !== DOWN ? 'bone.paper' : 'el.water.foam';
    }
    case 'liquid': return d === UP ? 'bone.paper' : 'bone.dim';
  }
}

function glowPaint(x: number, y: number, z: number, d: number): PalToken {
  if (d === DOWN) return 'light.dusk';
  const h = hash(x, y, z);
  return h < 0.25 ? 'light.hot' : h < 0.7 ? 'light.ember' : 'light.dusk';
}

/** Faces of `layer`, keeping only voxels whose texel x lies in [x0, x1) (the tile the model is
 *  built for); faces are shifted by -x0 so the tile's lower corner is the origin. A face on the
 *  seam whose neighbour lies on the other tile is still hidden, so the cut stays closed only
 *  where the part really ends; a part that crosses the seam is cut there exactly. */
function geometry(grids: Grid | Grid[], layer: Layer, painter: (k: Kind, x: number, y: number, z: number, d: number) => PalToken, x0 = 0, x1 = 32): THREE.BufferGeometry {
  const p: number[] = [], c: number[] = [];
  const col = new THREE.Color();
  for (const g of Array.isArray(grids) ? grids : [grids]) for (const v of g.cells.values()) {
    const u = T / g.s;
    if (LAYER[v.k] !== layer) continue;
    if (v.x / g.s < x0 || v.x / g.s >= x1) continue;
    for (let d = 0; d < 6; d++) {
      const [dx, dy, dz] = DIRS[d];
      const n = g.get(v.x + dx, v.y + dy, v.z + dz);
      if (n) {
        const nl = LAYER[n.k];
        // an opaque neighbour hides the face; glass hides only glass of its own vessel
        if (!SEE_THROUGH.has(nl) || nl === layer) continue;
      }
      col.setHex(pal(painter(v.k, v.x, v.y, v.z, d)));
      const q = QUADS[d];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        p.push((v.x + q[i][0]) * u - x0 * T, (v.y + q[i][1]) * u, (v.z + q[i][2]) * u);
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

const lambert = () => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: pal('ink.void') });
const glassMat = () => new THREE.MeshLambertMaterial({
  vertexColors: true, emissive: pal('ink.void'), transparent: true, opacity: 0.45, depthWrite: false,
});

function mesh(parent: THREE.Object3D, name: string, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  parent.add(m);
  return m;
}

const SEAM = 16;

/** The kitchen: the -X tile of the original station, exactly as it was (the hearth with its
 *  mouth, coals, flue and seat; the bulb, its hoops and helm, whose centre lies on this tile; the
 *  beak's half up to the seam). Origin at the tile's lower corner. */
export function buildKitchenTile(): THREE.Group {
  const g = carve();
  const root = new THREE.Group();
  root.name = 'kitchen';
  mesh(root, 'kitchen-body', geometry([g, carvePipes()], 'solid', paint, 0, SEAM), lambert());
  mesh(root, 'hearth-coals', geometry(g, 'coal', paint, 0, SEAM), lambert());
  const glow = mesh(root, 'hearth-glow', geometry(g, 'coal', (_k, x, y, z, d) => glowPaint(x, y, z, d), 0, SEAM), new THREE.MeshBasicMaterial({ vertexColors: true }));
  glow.visible = false;
  for (const i of [0, 1, 2]) mesh(root, `ring-${i}`, geometry(g, `ring${i}` as Layer, paint, 0, SEAM), lambert());
  const bulb = mesh(root, 'bulb', geometry(g, 'glass', paint, 0, SEAM), glassMat());
  bulb.renderOrder = 1;
  return root;
}

/** The laboratory's alembic: the +X tile of the original station, exactly as it was (the plinth,
 *  the coil on its post, the flask stand and the beak's half from the seam). Origin at the tile's
 *  lower corner. */
export function buildAlembicModel(): THREE.Group {
  const g = carve();
  const root = new THREE.Group();
  root.name = 'alembic';
  mesh(root, 'alembic-body', geometry([g, carvePipes()], 'solid', paint, SEAM, 32), lambert());

  const f = carveFlask();
  const flask = new THREE.Group();
  flask.name = 'flask';
  flask.visible = false;
  root.add(flask);
  mesh(flask, 'flask-liquid', geometry(f, 'liquid', paint, SEAM, 32), new THREE.MeshLambertMaterial({ vertexColors: true, color: pal('path.body.base'), emissive: pal('ink.void') }));
  const fg = mesh(flask, 'flask-glass', geometry(f, 'fglass', paint, SEAM, 32), glassMat());
  fg.renderOrder = 1;

  const slot = new THREE.Object3D();
  slot.name = 'flask-slot';
  slot.position.set((FX + 0.5 - SEAM) * T, 5 * T, (FZ + 1) * T);
  root.add(slot);
  return root;
}
