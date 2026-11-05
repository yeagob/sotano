// ?gallery=sky-elephant (docs/architecture/SKY.md §11). Owned by: F3, B3. Rulings: docs/art/sky/elephant.md.
//
// B3 (the beings, pending owner review): the elephant deity and a calf of its herd, built from the game's own
// models (buildModel) and posed by their own functions, over the floor's pale stone and the day sky: the turntable,
// every telegraph's pose, the sign of progress (the ears hang looser) and the calf's reactions.
//
// The floor as the generator makes it (the hall's origin of the tree, seed 1): the plan from above with each
// column's material and its height, the water of the Basin and the waterhole in the water's own tone, the
// section through the Basin along x, and the silhouette of the whole floor from the ground to the south. The
// tusk line is the vertical route to the way up. Shapes only; the beings come with B3. Colours are the blocks'
// own material tones and the palette's marks, never literals.

import * as THREE from 'three';
import { AIR, MATERIALS } from '../../content/materials';
import { pal, palCss } from '../../content/palette';
import { buildModel } from '../../entities/enemies';
import type { EnemyDef, ModelPart } from '../../enemies/types';
import { ELEPHANT_ATTACKS, LISTENING, elephantDeity, mindOf, poseModel } from '../../sky/creatures/deities/elephant';
import { elephantMinion, reactModel } from '../../sky/creatures/minions/elephant';
import { Rng } from '../../core/rng';
import { elephant } from '../../sky/floors/elephant';
import type { Parts, SkyActor, SkyFloorPlan } from '../../sky/types';
import { covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const ORIGIN = { x: 128, y: 110, z: 128 };
/** Pixels per block. */
const PX = 12;
/** Half-width of the plan and the sections, in blocks (the B6 radius is 24). */
const R = 26;

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

/** Whether a cell holds water: an element shape laid where the block is air, and no block after it. */
function waterAt(p: SkyFloorPlan, x: number, y: number, z: number): boolean {
  let air = true, water = false;
  for (const s of p.shapes) {
    if (!covers(s, x, y, z)) continue;
    if (s.k === 'elem') { if (air) water = true; continue; }
    air = 'm' in s ? s.m === AIR : true;
    water = false;
  }
  return water;
}

/** The highest block of each column in the plan, by its material, and whether water stands in the air above it. */
function topAt(p: SkyFloorPlan, x: number, z: number): { m: number; top: number; water: boolean } | null {
  // the highest solid cell of the column, after the carves (an air shape cuts what lies under it)
  let best: { m: number; top: number } | null = null;
  for (let y = p.y1; y >= p.y0 && !best; y--) {
    const m = blockAt(p, x, y, z);
    if (m !== null && m !== AIR) best = { m, top: y + 1 };
  }
  // the water of this column: from the top block (the pool, cut into the mesa) or, where the column has no block
  // at all (the waterhole, cut through the base), from the floor's first row
  const from = best ? best.top : p.y0;
  let water = false;
  for (let y = from; y < from + 3 && !water; y++) water = waterAt(p, x, y, z);
  if (!best && !water) return null;
  return { m: best ? best.m : AIR, top: best ? best.top : from, water };
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
    g.fillStyle = t.water ? palCss('el.water.surface') : tone(t.m, Math.min(1, t.top / 26));
    g.fillRect((dx + R) * PX, (dz + R) * PX, PX, PX);
  }
  // the spawn and the nests: small squares in the palette's paper tone
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
  const H = p.y1 - p.y0 + 1;
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

export function skyElephantGallery(g: GalleryKit) {
  const p = elephant.generate(new Rng(1), ORIGIN);
  g.head('Sky floor 3, the elephant: the plan from above (the rings, the Basin with its pool and rim, the waterhole, the tusk line, the nests)');
  g.fig(g.row(), drawPlan(p), 'plan · pale stone rings, the rim in fencewood, the skywood tusk line, water in its blue, pale marks: nests and spawn');

  g.head('The section through the Basin along x: the rings rising to the pool');
  g.fig(g.row(), drawElevation(p, (i, h) => blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z)), 'section along x through the Basin, the ground to the top of the mesa');

  g.head('From the ground to the south: the silhouette of the whole floor, nearest block along z');
  g.fig(g.row(), drawElevation(p, (i, h) => {
    for (let dz = -R; dz <= R; dz++) {
      const m = blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z + dz);
      if (m !== null) return m;
    }
    return null;
  }), 'silhouette from the south, the ground to the way up');

  skyElephantBeings(g);
}

// ───────────────────────── the beings (B3) ─────────────────────────

const EYE = 1.62;

/** One being on a slab of pale stone under the day sky, posed, seen from `dist` at `angle` round it. */
function being(list: readonly ModelPart[], posing: (parts: Parts) => void, angle: number, dist: number, look: number, w: number, h: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setClearColor(pal('sky.day'));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40), new THREE.MeshLambertMaterial({ color: pal('mat.palestone.base') }));
  floor.position.set(0, -0.5, 0);
  scene.add(floor);
  const built = buildModel({ model: [...list] } as unknown as EnemyDef);
  scene.add(built.group);
  const parts = new Map<string, THREE.Object3D>();
  for (const [name, objs] of built.parts) if (objs[0]) parts.set(name, objs[0]);
  posing(parts);
  const cam = new THREE.PerspectiveCamera(45, w / h, 0.05, 80);
  cam.position.set(Math.sin(angle) * dist, EYE, Math.cos(angle) * dist);
  cam.lookAt(0, look, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  renderer.dispose();
  return out;
}

/** A mind for the gallery: the pose by name, held `t` seconds, facing the camera at +z. */
function posed(pose: string, t = 0.4) {
  const m = mindOf({} as SkyActor);
  m.pose = pose; m.poseT = t; m.clock = t; m.yaw = 0;
  return m;
}

const DEITY = [...elephantDeity.model.body, ...elephantDeity.model.head];
const deg = (d: number) => (d * Math.PI) / 180;

export function skyElephantBeings(g: GalleryKit) {
  g.head('The elephant (B3, pending owner review): a great head on a small plush body, about 3 high. Front, ¾ (&angle), side, back');
  const r = g.row();
  for (const [a, label] of [[0, 'front'], [g.angle, '¾'], [deg(90), 'side'], [deg(180), 'back']] as const) {
    g.fig(r, being(DEITY, p => poseModel(p, 0, posed('Idle')), a, 6.5, 1.5, 300, 240), label);
  }

  g.head('The telegraphs: each attack’s pose of the trunk, the ears or the head (1.1 s), and the states');
  const rt = g.row();
  const poses: [string, string][] = [
    ...ELEPHANT_ATTACKS.map(a => [a.telegraph.pose, a.id] as [string, string]),
    [LISTENING, 'Listening'], ['Recovering', 'Drinking'], ['Rallying', 'Rallying'], ['Won', 'Won'],
  ];
  for (const [pose, label] of poses) g.fig(rt, being(DEITY, p => poseModel(p, 0, posed(pose)), deg(35), 7, 1.5, 200, 170), `${label} · ${pose}`);

  g.head('The sign of progress: the ears hang looser as the hits gather (0, a third, two thirds, all)');
  const rp = g.row();
  for (const k of [0, 1 / 3, 2 / 3, 1]) g.fig(rp, being(DEITY, p => poseModel(p, k, posed('Idle')), 0, 6.5, 1.5, 220, 180), `${Math.round(k * 36)} / 36`);

  g.head('A calf of the herd, about a block high: at rest, after hits (it lowers its head), turned (trunk up, ears open)');
  const rc = g.row();
  for (const [k, label] of [[0, 'wild'], [0.6, '3 of 5'], [1, 'ally']] as const) {
    g.fig(rc, being(elephantMinion.model.parts, p => reactModel(p, k), deg(30), 3, 0.6, 200, 170), label);
  }

  g.head('Scale: the deity and a calf side by side, 8 blocks away');
  const rs = g.row();
  const both: ModelPart[] = [
    ...DEITY,
    ...elephantMinion.model.parts.map(q => (q.parent ? { ...q, name: `c.${q.name}`, parent: `c.${q.parent}` } : { ...q, name: `c.${q.name}`, pos: [q.pos[0] + 2.2, q.pos[1], q.pos[2]] as [number, number, number] })),
  ];
  g.fig(rs, being(both, p => poseModel(p, 0, posed('Idle')), deg(20), 9, 1.2, 360, 220), 'deity and calf');
}
