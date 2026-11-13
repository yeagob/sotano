import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';
import { glowTexture } from './icons';

export const SEED_VOXEL = 0.042;
export const SEED_W = 9;
export const SEED_H = 11;
export const SEED_FUSE_REF = 1.8;

const PROFILE = [2.0, 3.0, 3.6, 4.1, 4.3, 4.3, 4.1, 3.7, 3.0, 2.1, 1.1];
const C = (SEED_W - 1) / 2;
const SEAM = [0, 0, 0, 1, 1, 0, 0, -1, -1, 0, 0];
const BRANCHES = ['6,5,1', '7,4,1', '2,6,1', '1,7,1', '6,6,-1', '7,7,-1', '2,3,-1', '1,2,-1'];

/** `bomb`: the black seed of a negative bomb. `love`: the white bomb of a bomb placed at positive polarity (DECISIONS §7.8). */
export type SeedKind = 'bomb' | 'love';

/** The palette of one seed: husk ramp, seams, heart, cap and halo. */
interface Look {
  dark: PalToken; base: PalToken; hi: PalToken;
  lip: PalToken; lipEnd: PalToken; inner: PalToken; heart: PalToken; branch: PalToken;
  top: PalToken;
  halo: PalToken; haloRest: number; haloBreathe: number;
}

const LOOKS: Record<SeedKind, Look> = {
  bomb: {
    dark: 'mat.seed.dark', base: 'mat.seed.base', hi: 'mat.seed.hi',
    lip: 'light.ember', lipEnd: 'light.dusk', inner: 'light.hot', heart: 'light.core', branch: 'light.dusk',
    top: 'mat.seed.dark',
    halo: 'light.ember', haloRest: 0.35, haloBreathe: 0.3,
  },
  // the white bomb (§7.8): a white husk of bone and light.core, core seams with hot lip ends and branches (no gold), a light.core halo at 0.3
  love: {
    dark: 'bone.paper', base: 'light.core', hi: 'light.core',
    lip: 'light.core', lipEnd: 'light.hot', inner: 'light.core', heart: 'light.core', branch: 'light.hot',
    top: 'bone.paper',
    halo: 'light.core', haloRest: 0.3, haloBreathe: 0.3,
  },
};

type Cell = { t: PalToken; glow: boolean };

function inBounds(x: number, y: number, z: number): boolean {
  return y >= 0 && y < SEED_H && x >= 0 && z >= 0 && x < SEED_W && z < SEED_W;
}

function filled(x: number, y: number, z: number): boolean {
  if (!inBounds(x, y, z)) return false;
  const r = PROFILE[y];
  return (x - C) ** 2 + (z - C) ** 2 <= r * r + 0.35;
}

const DIRS: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function shell(x: number, y: number, z: number): boolean {
  return filled(x, y, z) && DIRS.some(([dx, dy, dz]) => !filled(x + dx, y + dy, z + dz));
}

function seamZ(x: number, y: number, z: number, wide: boolean): boolean {
  if (y < 1 || y > 9 || z === C || !shell(x, y, z) || filled(x, y, z + (z > C ? 1 : -1))) return false;
  const sx = z > C ? x : 2 * C - x;
  const at = C + SEAM[y];
  return sx === at || (wide && y >= 3 && y <= 7 && sx === at + 1);
}

function seam(x: number, y: number, z: number): boolean {
  return seamZ(x, y, z, true) || (y >= 3 && y <= 8 && seamZ(z, y, 2 * C - x, false));
}

function solid(x: number, y: number, z: number): boolean {
  return filled(x, y, z) && !seam(x, y, z);
}

function cell(x: number, y: number, z: number, L: Look): Cell {
  const nearSeam = DIRS.some(([dx, dy, dz]) => seam(x + dx, y + dy, z + dz));
  if (nearSeam && !shell(x, y, z)) return { t: y >= 4 && y <= 6 ? L.heart : L.inner, glow: true };
  if (nearSeam) return { t: y >= 3 && y <= 7 ? L.lip : L.lipEnd, glow: true };
  const side = z > C ? 1 : -1;
  if (BRANCHES.includes(`${side > 0 ? x : 2 * C - x},${y},${side}`) && !filled(x, y, z + side)) return { t: L.branch, glow: true };
  if (y === SEED_H - 1) return { t: L.top, glow: false };
  const nx = (x - C) / 4.3, ny = (y - 5) / 5.5, nz = (z - C) / 4.3;
  const lit = -0.45 * nx + 0.75 * ny + 0.45 * nz;
  const rib = Math.round(((Math.atan2(z - C, x - C) + Math.PI) / (Math.PI * 2)) * 12) % 3 === 0;
  if (y <= 1 || lit < -0.4) return { t: L.dark, glow: false };
  if (rib) return { t: lit > -0.1 ? L.hi : L.base, glow: false };
  if (lit > 0.45) return { t: L.hi, glow: false };
  return { t: L.base, glow: false };
}

const QUADS: number[][][] = [
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
];

function faceQuad(x: number, y: number, z: number, d: number): number[] {
  const q = QUADS[d];
  return [0, 1, 2, 0, 2, 3].flatMap(i => [x + q[i][0], y + q[i][1], z + q[i][2]]);
}

type Geo = { husk: THREE.BufferGeometry; glow: THREE.BufferGeometry };
const geos: Partial<Record<SeedKind, Geo>> = {};

function geometries(kind: SeedKind): Geo {
  const cached = geos[kind];
  if (cached) return cached;
  const L = LOOKS[kind];
  const out = { husk: { p: [] as number[], c: [] as number[] }, glow: { p: [] as number[], c: [] as number[] } };
  const col = new THREE.Color();
  for (let y = 0; y < SEED_H; y++) for (let z = 0; z < SEED_W; z++) for (let x = 0; x < SEED_W; x++) {
    if (!solid(x, y, z) || DIRS.every(([dx, dy, dz]) => solid(x + dx, y + dy, z + dz))) continue;
    const k = cell(x, y, z, L);
    const dst = k.glow ? out.glow : out.husk;
    col.setHex(pal(k.t));
    for (let d = 0; d < 6; d++) {
      const [dx, dy, dz] = DIRS[d];
      if (solid(x + dx, y + dy, z + dz)) continue;
      const q = faceQuad(x, y, z, d);
      for (let i = 0; i < q.length; i += 3) {
        dst.p.push((q[i] - SEED_W / 2) * SEED_VOXEL, q[i + 1] * SEED_VOXEL, (q[i + 2] - SEED_W / 2) * SEED_VOXEL);
        dst.c.push(col.r, col.g, col.b);
      }
    }
  }
  const build = (s: { p: number[]; c: number[] }) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(s.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(s.c, 3));
    g.computeVertexNormals();
    return g;
  };
  geos[kind] = { husk: build(out.husk), glow: build(out.glow) };
  return geos[kind]!;
}

const huskMats: Partial<Record<SeedKind, THREE.MeshLambertMaterial>> = {};

/** One husk material per seed. The white bomb carries its own emissive bone, so its shaded faces stay cream, not khaki (§7.8). */
function huskMaterial(kind: SeedKind): THREE.MeshLambertMaterial {
  const cached = huskMats[kind];
  if (cached) return cached;
  const mat = kind === 'love'
    ? new THREE.MeshLambertMaterial({ vertexColors: true, emissive: pal('bone.paper'), emissiveIntensity: 0.35 })
    : new THREE.MeshLambertMaterial({ vertexColors: true, emissive: pal('ink.void') });
  huskMats[kind] = mat;
  return mat;
}

export interface SeedModel {
  kind: SeedKind;
  root: THREE.Group;
  body: THREE.Group;
  cracks: THREE.MeshBasicMaterial;
  halo: THREE.Sprite;
}

export function buildSeed(kind: SeedKind = 'bomb'): SeedModel {
  const L = LOOKS[kind];
  const g = geometries(kind);
  const cracks = new THREE.MeshBasicMaterial({ vertexColors: true });
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(new THREE.Mesh(g.husk, huskMaterial(kind)), new THREE.Mesh(g.glow, cracks));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: pal(L.halo), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: L.haloRest }));
  halo.position.set(0, SEED_H * SEED_VOXEL * 0.48, SEED_W * SEED_VOXEL * 0.25);
  halo.scale.set(0.42, 0.42, 1);
  body.add(halo);
  return { kind, root, body, cracks, halo };
}

export function breatheSeed(m: SeedModel, time: number): void {
  const s = Math.sin(time * Math.PI * 2 * 0.6);
  m.cracks.color.setScalar(0.82 + 0.18 * s);
  m.halo.material.opacity = LOOKS[m.kind].haloBreathe + 0.1 * s;
}

export function fuseSeed(m: SeedModel, fuse: number): number {
  const e = Math.max(0, SEED_FUSE_REF - fuse);
  const u = Math.min(1, e / SEED_FUSE_REF);
  const phase = 0.8 * e + (1.7 * e * e) / (2 * SEED_FUSE_REF);
  const s = Math.sin(phase * Math.PI * 2);
  m.cracks.color.setScalar(Math.min(1, 0.7 + 0.2 * u + 0.1 * s));
  m.halo.material.opacity = LOOKS[m.kind].haloRest + 0.35 * u + 0.12 * s;
  const k = 1.3 + 0.9 * u + 0.1 * s;
  m.halo.scale.set(0.42 * k, 0.42 * k, 1);
  return 1 + 0.25 * u * u;
}

export function disposeSeed(m: SeedModel): void {
  m.cracks.dispose();
  m.halo.material.dispose();
  m.root.removeFromParent();
}
