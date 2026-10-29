import * as THREE from 'three';
import { pal, palCss, type PalToken } from '../content/palette';
import { glowTexture } from './icons';

export interface ChestModel {
  root: THREE.Group;
  lid: THREE.Group;
  lock: THREE.Group | null;
  inner: THREE.Group;
  keyholes: THREE.Mesh[];
}

const T = 1 / 16;
const HINGE_Y = 8, HINGE_Z = -6; // outside the back bands, so the open lid never swings into them

type Ramp = { o: string; d: string; b: string; h: string };

function planks(r: Ramp, inside: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 12;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const rows = inside ? [r.d, r.o, r.o] : [r.h, r.b, r.d];
  for (let p = 0; p < 4; p++) for (let x = 0; x < 16; x++) for (let k = 0; k < 3; k++) px(x, p * 3 + k, rows[k]);
  const joints = [5, 12, 2, 9];
  const grain = [[1, 3], [9, 4], [6, 3], [13, 2]];
  for (let p = 0; p < 4; p++) {
    const j = joints[p];
    for (let k = 0; k < 3; k++) px(j, p * 3 + k, r.o);
    if (!inside) {
      px(j + 1, p * 3, r.b);
      const [gx, gl] = grain[p];
      for (let k = 0; k < gl; k++) px((gx + k) % 16, p * 3 + 1, r.d);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shared: Record<string, THREE.Material> | null = null;
function mats() {
  if (shared) return shared;
  const wood = { o: palCss('mat.crate.outline'), d: palCss('mat.crate.dark'), b: palCss('mat.crate.base'), h: palCss('mat.crate.hi') };
  const lam = (t: PalToken, e: PalToken = 'ink.void') => new THREE.MeshLambertMaterial({ color: pal(t), emissive: pal(e) });
  shared = {
    wood: new THREE.MeshLambertMaterial({ map: planks(wood, false), emissive: pal('ink.void') }),
    inside: new THREE.MeshLambertMaterial({ map: planks(wood, true), emissive: pal('ink.void') }),
    band: lam('iron.dark'),
    capFree: lam('iron.dark'),
    capLocked: lam('iron.base'),
    brassDark: lam('brass.dark'),
    brass: lam('brass.base'),
    brassHi: lam('brass.hi'),
  };
  return shared;
}

const geos = new Map<string, THREE.BoxGeometry>();
function geo(w: number, h: number, d: number, x0: number, y0: number, z0: number): THREE.BoxGeometry {
  const key = `${w},${h},${d},${x0},${y0},${z0}`;
  let g = geos.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w * T, h * T, d * T);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const face: [number, number, number, number][] = [
    [d, h, z0, y0], [d, h, z0, y0], [w, d, x0, z0], [w, d, x0, z0], [w, h, x0, y0], [w, h, x0, y0],
  ];
  for (let f = 0; f < 6; f++) {
    const [fu, fv, ou, ov] = face[f];
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (ou + uv.getX(k) * fu) / 16, (ov + uv.getY(k) * fv) / 12);
    }
  }
  geos.set(key, g);
  return g;
}

function box(parent: THREE.Object3D, m: THREE.Material | THREE.Material[], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geo(x1 - x0, y1 - y0, z1 - z0, x0, y0, z0), m);
  mesh.position.set((x0 + x1) / 2 * T, (y0 + y1) / 2 * T, (z0 + z1) / 2 * T);
  parent.add(mesh);
  return mesh;
}

const faces = (out: THREE.Material, inn: THREE.Material, inward: number): THREE.Material[] =>
  [0, 1, 2, 3, 4, 5].map(f => f === inward ? inn : out);

export function buildChest(opts: { keys: number; practice: boolean }): ChestModel {
  const keys = Math.max(0, Math.min(3, Math.floor(opts.keys)));
  const locked = keys > 0;
  const m = mats();
  const band = opts.practice ? m.brass : m.band;
  const cap = opts.practice ? m.brassHi : locked ? m.capLocked : m.capFree;
  const bw = locked ? 3 : 2;
  const bx = locked ? [-6, 3] : [-5, 3];

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  box(body, faces(m.wood, m.inside, 2), -6, 6, 0, 3, -4, 4);
  box(body, faces(m.wood, m.inside, 5), -7, 7, 0, 8, 4, 5);
  box(body, faces(m.wood, m.inside, 4), -7, 7, 0, 8, -5, -4);
  box(body, faces(m.wood, m.inside, 1), 6, 7, 0, 8, -4, 4);
  box(body, faces(m.wood, m.inside, 0), -7, -6, 0, 8, -4, 4);
  for (const x0 of [-8, 6]) for (const z0 of [-6, 4]) box(body, cap, x0, x0 + 2, 0, 2, z0, z0 + 2);
  const trimmed = locked || opts.practice;
  for (const x of bx) {
    box(body, band, x, x + bw, trimmed ? 1 : 0, 8, 5, 6);
    box(body, band, x, x + bw, 0, 8, -6, -5);
  }
  if (trimmed) box(body, cap, -6, 6, 0, 1, 5, 6);

  const lid = new THREE.Group();
  lid.position.set(0, HINGE_Y * T, HINGE_Z * T);
  root.add(lid);
  const top = new THREE.Group();
  top.position.set(0, -HINGE_Y * T, -HINGE_Z * T);
  lid.add(top);
  box(top, faces(m.wood, m.inside, 3), -7, 7, 8, 10, -5, 6);
  box(top, m.wood, -7, 7, 10, 12, -4, 5);
  box(top, m.wood, -7, 7, 12, 13, -2, 3);
  for (const x of bx) {
    box(top, band, x, x + bw, opts.practice ? 9 : 8, 11, -5, 7);
    box(top, band, x, x + bw, 10, 13, -4, 6);
    box(top, band, x, x + bw, 12, 14, -2, 4);
  }
  // the brass trim on the lid's front edge; a padlock's shackle takes the middle of it
  if (opts.practice && locked) {
    box(top, m.brassHi, -6, -2, 8, 9, 6, 7);
    box(top, m.brassHi, 2, 6, 8, 9, 6, 7);
  } else if (opts.practice) box(top, m.brassHi, -6, 6, 8, 9, 6, 7);

  let lock: THREE.Group | null = null;
  const keyholes: THREE.Mesh[] = [];
  if (!locked) {
    box(top, m.brass, -1, 1, 6, 10, 6, 7);
    box(body, m.brassDark, -2, 2, 5, 7, 5, 6);
  } else {
    lock = new THREE.Group();
    lock.position.set(0, 0, 5 * T);
    body.add(lock);
    const plate = new THREE.MeshLambertMaterial({ color: pal('iron.base'), emissive: pal('ink.void') });
    const shackle = new THREE.MeshLambertMaterial({ color: pal('iron.hi'), emissive: pal('ink.void') });
    const half = keys === 1 ? 3 : keys === 2 ? 4 : 5;
    box(lock, plate, -half, half, 1, 6, 0, 2);
    box(lock, shackle, -2, -1, 6, 8, 1, 2);
    box(lock, shackle, 1, 2, 6, 8, 1, 2);
    box(lock, shackle, -2, 2, 8, 9, 1, 2);
    const xs = keys === 1 ? [-1] : keys === 2 ? [-3, 1] : [-4, -1, 2];
    for (const x of xs) {
      const k = box(lock, new THREE.MeshBasicMaterial({ color: pal('ink.void') }), x, x + 2, 2, 5, 2, 3);
      k.scale.z = 0.25;
      k.position.z = 2.125 * T;
      keyholes.push(k);
    }
  }

  const inner = new THREE.Group();
  inner.visible = false;
  root.add(inner);
  const basic = (t: PalToken) => new THREE.MeshBasicMaterial({ color: pal(t), transparent: true });
  box(inner, basic('light.ember'), -6, 6, 3, 4, -4, 4);
  box(inner, basic('light.gold'), -4, 4, 4, 5, -3, 3);
  box(inner, basic('light.hot'), -2, 2, 5, 6, -2, 2);
  box(inner, basic('light.core'), -1, 1, 6, 7, -1, 1);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: pal('light.hot'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
  glow.position.set(0, 10 * T, 0);
  glow.scale.set(1.1, 1.1, 1);
  inner.add(glow);

  return { root, lid, lock, inner, keyholes };
}

export function disposeChest(m: ChestModel): void {
  const own = new Set<THREE.Material>();
  for (const g of [m.inner, m.lock]) g?.traverse(o => {
    const mat = (o as THREE.Mesh | THREE.Sprite).material;
    if (mat) for (const x of Array.isArray(mat) ? mat : [mat]) own.add(x);
  });
  for (const k of m.keyholes) own.add(k.material as THREE.Material);
  for (const x of own) x.dispose();
  m.root.removeFromParent();
}
