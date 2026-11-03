// The Spiked Entity's model: dark, low and wide, countless stepped spikes (docs/architecture/SKY.md §11,
// rulings in docs/art/sky/entity.md).
//
// A mound of four stepped slabs of near-black husk, bristling with spikes made of stepped thin boxes
// (whole texels, each segment narrower than the one below it), swept back from a bare front brow so its
// turn toward the player reads. A faint cold rim on each slab's top edge and cold tips on every spike make
// it read in the ink-black fog of silence. It never moves; it breathes very slowly. When a touch bounces
// off, its tips catch the player's own light (light.gold) and let it go: nothing of it changes.
//
// The geometry is pure data (`entityBoxes`, no randomness: a fixed hash of each spike's index), so the
// tests can measure it headless and the gallery shows exactly what the game shows.

import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';
import type { EntityViewApi, SpikedEntityApi } from '../sky/types';
import { ENTITY_MAX_H } from './entity';

const T = 1 / 16;

export type EntityPart = 'husk.dark' | 'husk.base' | 'husk.hi' | 'spike.root' | 'spike' | 'spike.mid' | 'tip' | 'rim';

/** One box of the model: its part, its size in blocks (whole texels) and where it sits in the model. */
export interface EntityBox { part: EntityPart; size: [number, number, number]; matrix: THREE.Matrix4 }

/** The four stepped slabs, bottom to top: width (x), height, depth (z), in texels. The front is +z. */
const SLABS: readonly { w: number; h: number; d: number; part: EntityPart }[] = [
  { w: 48, h: 12, d: 40, part: 'husk.dark' },
  { w: 42, h: 12, d: 34, part: 'husk.base' },
  { w: 34, h: 10, d: 26, part: 'husk.base' },
  { w: 24, h: 8, d: 16, part: 'husk.hi' },
];

/** A spike's segments from base to tip: [width, length] in texels. Every segment is narrower than the last. */
const LONG: readonly [number, number][] = [[6, 5], [5, 5], [4, 5], [3, 5], [2, 6]];
const SHORT: readonly [number, number][] = [[5, 4], [4, 4], [3, 4], [2, 5]];
/** How deep a spike's base sits inside the slab it grows from. */
const EMBED = 3 * T;
/** Spikes on the front face keep clear of this half-width, the bare brow it faces you with. */
const BROW = 0.9;
/** Spacing of the spikes along a slab's sides, in blocks. */
const STEP = 0.34;

/** A fixed hash of an index in [0, 1): the model draws nothing from any random stream. */
const hash = (i: number) => (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296;

const UP = new THREE.Vector3(0, 1, 0);

/** Every box of the model, in model space (feet at the origin, front toward +z). */
export function entityBoxes(): EntityBox[] {
  const out: EntityBox[] = [];
  const box = (part: EntityPart, size: [number, number, number], x: number, y: number, z: number, q?: THREE.Quaternion) =>
    out.push({ part, size, matrix: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q ?? new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)) });

  let y0 = 0, n = 0;
  for (let s = 0; s < SLABS.length; s++) {
    const { w, h, d, part } = SLABS[s];
    const hw = w * T / 2, hd = d * T / 2, top = y0 + h * T;
    box(part, [w * T, h * T, d * T], 0, y0 + h * T / 2, 0);
    // the rim: a 1-texel band just outside the slab's top edge on all four sides
    box('rim', [w * T + 2 * T, T, T], 0, top - T / 2, hd + T / 2);
    box('rim', [w * T + 2 * T, T, T], 0, top - T / 2, -hd - T / 2);
    box('rim', [T, T, d * T], hw + T / 2, top - T / 2, 0);
    box('rim', [T, T, d * T], -hw - T / 2, top - T / 2, 0);

    // spikes along the four sides, in two staggered rows on the tall slabs, pointing out, up and back
    const rows = h >= 12 ? [0.3, 0.78] : [0.55];
    const sides: [number, number, number, number, number][] = [
      // [nx, nz, along-x?, half-length, offset]
      [0, 1, 1, hw, hd], [0, -1, 1, hw, hd], [1, 0, 0, hd, hw], [-1, 0, 0, hd, hw],
    ];
    for (const [row, f] of rows.entries()) for (const [nx, nz, alongX, half, off] of sides) {
      const ym = y0 + h * T * f;
      const count = Math.max(1, Math.floor((2 * half) / STEP));
      for (let k = 0; k < count; k++) {
        const t = -half + (k + 0.5 + (row ? 0.25 : -0.25)) * (2 * half / count) + (hash(n) - 0.5) * 0.1;
        const px = alongX ? t : nx * off, pz = alongX ? nz * off : t;
        n++;
        if (nz === 1 && Math.abs(px) < BROW && s < 2) continue;
        const dir = new THREE.Vector3(nx, 0.55 + 0.3 * s + hash(n * 7) * 0.25, nz).add(new THREE.Vector3(0, 0, -0.45));
        spike(out, px, ym, pz, dir, hash(n * 13) < 0.45 ? LONG : SHORT);
      }
    }
    // the exposed corners of each slab carry one long spike each, so the silhouette bristles at every step
    for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
      spike(out, cx * (hw - 2 * T), top - 2 * T, cz * (hd - 2 * T), new THREE.Vector3(cx, 1.1, cz - 0.5), LONG);
    }
    y0 = top;
  }
  // the crown: a short row of spikes on the top slab, leaning back
  for (let k = 0; k < 4; k++) {
    const x = -0.5 + k / 3;
    spike(out, x, y0, -0.15 + (k % 2) * 0.2, new THREE.Vector3(x * 0.6, 1, -0.6), k % 2 ? SHORT : LONG);
  }
  return out;
}

/** Lays a stepped spike from `base` along `dir`, dropping its last segments if the tip would reach the roof. */
function spike(out: EntityBox[], x: number, y: number, z: number, dir: THREE.Vector3, segs: readonly [number, number][]) {
  const d = dir.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d);
  let along = -EMBED;
  const placed: EntityBox[] = [];
  for (let i = 0; i < segs.length; i++) {
    const [wt, lt] = segs[i];
    const len = lt * T, wid = wt * T;
    // the farthest corner of this segment must stay under the cap
    const c = along + len / 2;
    const cx = x + d.x * c, cy = y + d.y * c, cz = z + d.z * c;
    const reach = cy + Math.abs(d.y) * len / 2 + Math.sqrt(Math.max(0, 1 - d.y * d.y)) * wid / 2 * Math.SQRT2;
    if (reach > ENTITY_MAX_H - T) break;
    placed.push({ part: i === 0 ? 'spike.root' : i < segs.length - 2 ? 'spike' : 'spike.mid', size: [wid, len, wid], matrix: new THREE.Matrix4().compose(new THREE.Vector3(cx, cy, cz), q, new THREE.Vector3(1, 1, 1)) });
    along += len;
  }
  if (placed.length < 2) return;
  placed[placed.length - 1].part = 'tip';
  out.push(...placed);
}

/** The height of the model's highest point, for the chamber's cap (tests). */
export function modelHeight(boxes: readonly EntityBox[] = entityBoxes()): number {
  let top = 0;
  const v = new THREE.Vector3();
  for (const b of boxes) for (let i = 0; i < 8; i++) {
    v.set((i & 1 ? 0.5 : -0.5) * b.size[0], (i & 2 ? 0.5 : -0.5) * b.size[1], (i & 4 ? 0.5 : -0.5) * b.size[2]).applyMatrix4(b.matrix);
    top = Math.max(top, v.y);
  }
  return top;
}

const TOKENS: Record<EntityPart, PalToken> = {
  'husk.dark': 'entity.husk.dark', 'husk.base': 'entity.husk.base', 'husk.hi': 'entity.husk.hi',
  'spike.root': 'entity.husk.hi', spike: 'entity.spike.base', 'spike.mid': 'entity.spike.mid', tip: 'entity.spike.tip', rim: 'entity.rim',
};
/** Parts drawn unlit, so they hold their value in the dark: the rim and the tips. */
const UNLIT = new Set<EntityPart>(['rim', 'tip']);

/** Poses step at 12 fps like every creature (DECISIONS §8.5); its world place never changes. */
const POSE_STEP = 1 / 12;
/** The turn of the revelation, radians per second: slow, heavy. */
const TURN_RATE = 1.2;
/** The breath: a very slow swell of the slabs, ±1.2 % at 0.18 Hz (far under 3 Hz). */
const BREATH = 0.012, BREATH_HZ = 0.18;
/** The shimmer: held while touches keep landing, then let go. It rises and falls; it never blinks. */
const SHIMMER_HOLD = 0.3, SHIMMER_UP = 5, SHIMMER_DOWN = 1.5, SHIMMER_MAX = 0.4;

export class EntityView implements EntityViewApi {
  readonly group = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly geo = new THREE.BoxGeometry(1, 1, 1);
  private readonly mats: THREE.Material[] = [];
  private readonly tipMat: THREE.MeshBasicMaterial;
  private readonly tipBase = new THREE.Color(pal('entity.spike.tip'));
  private readonly gold = new THREE.Color(pal('light.gold'));
  private clock = 0;
  private poseT = 0;
  private yaw = 0;
  private placed = false;
  private lastTouch = -Infinity;
  /** 0 → 1: how much of the player's light the tips hold now. */
  level = 0;

  constructor(private root: THREE.Object3D) {
    const boxes = entityBoxes();
    const byPart = new Map<EntityPart, EntityBox[]>();
    for (const b of boxes) byPart.set(b.part, [...(byPart.get(b.part) ?? []), b]);
    let tip: THREE.MeshBasicMaterial | null = null;
    const m = new THREE.Matrix4(), scale = new THREE.Matrix4();
    for (const [part, list] of byPart) {
      const color = pal(TOKENS[part]);
      // the rim is its tell (DECISIONS G1): it ignores the fog, so the outline of something waiting shows
      // across the whole dark chamber long before the body does
      const mat = UNLIT.has(part) ? new THREE.MeshBasicMaterial({ color, fog: part !== 'rim' }) : new THREE.MeshLambertMaterial({ color });
      if (part === 'tip') tip = mat as THREE.MeshBasicMaterial;
      this.mats.push(mat);
      const mesh = new THREE.InstancedMesh(this.geo, mat, list.length);
      list.forEach((b, i) => mesh.setMatrixAt(i, m.copy(b.matrix).multiply(scale.makeScale(...b.size))));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      this.body.add(mesh);
    }
    this.tipMat = tip!;
    this.group.add(this.body);
    root.add(this.group);
  }

  sync(e: SpikedEntityApi, dt: number) {
    this.clock += dt;
    this.group.position.set(e.body.x, e.body.y, e.body.z);
    if (!this.placed) { this.yaw = e.facing; this.placed = true; }
    // the shimmer eases continuously: a steady glow under a stream of touches, never a flicker
    const target = this.clock - this.lastTouch < SHIMMER_HOLD ? 1 : 0;
    this.level = target > this.level ? Math.min(target, this.level + SHIMMER_UP * dt) : Math.max(target, this.level - SHIMMER_DOWN * dt);
    this.tipMat.color.copy(this.tipBase).lerp(this.gold, this.level * SHIMMER_MAX);
    // pose: stepped
    this.poseT += dt;
    if (this.poseT < POSE_STEP) return;
    const step = this.poseT;
    this.poseT = 0;
    let d = e.facing - this.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * step);
    this.body.rotation.y = this.yaw;
    this.body.scale.y = 1 + BREATH * Math.sin(this.clock * Math.PI * 2 * BREATH_HZ);
  }

  /** A touch bounced: the tips catch the player's light for a moment. */
  shimmer() {
    this.lastTouch = this.clock;
  }

  dispose() {
    this.root.remove(this.group);
    this.geo.dispose();
    for (const m of this.mats) m.dispose();
  }
}
