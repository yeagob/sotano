// ?gallery=sky-panda (docs/architecture/SKY.md §11). Owned by: F1 (the floor), B1 (the beings). Rulings: docs/art/sky/panda.md.
//
// The floor as the generator makes it (the hall's origin of the tree, seed 1): the plan from above with each
// column's material and its height, the section through the seat and the ledge strip (the vertical route to
// the way up), and the silhouette of the whole floor from the ground to the south. Then the beings (B1): the
// panda in each state and at the extreme pose of each telegraph, its lids at no, half and all its hits, and the
// little panda, in colour and in greyscale, front and three-quarter. Colours are palette tokens, never literals.

import * as THREE from 'three';
import { AIR, MATERIALS } from '../../content/materials';
import { pal, palCss } from '../../content/palette';
import type { EnemyDef } from '../../enemies/types';
import { buildModel } from '../../entities/enemies';
import { PANDA_KINDS, pandaDeity, posePanda, type Kind, type PandaPose } from '../../sky/creatures/deities/panda';
import { pandaMinion } from '../../sky/creatures/minions/panda';
import type { ModelPart } from '../../enemies/types';
import type { Parts } from '../../sky/types';
import { Rng } from '../../core/rng';
import { panda } from '../../sky/floors/panda';
import type { SkyFloorPlan } from '../../sky/types';
import { boundsOf, covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const ORIGIN = { x: 128, y: 36, z: 128 };
/** Pixels per block. */
const PX = 12;
/** Half-width of the plan and the sections, in blocks (the B6 radius is 20). */
const R = 22;

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

/** The highest block of each column in the plan, by its material. */
function topAt(p: SkyFloorPlan, x: number, z: number): { m: number; top: number } | null {
  let best: { m: number; top: number } | null = null;
  for (const s of p.shapes) {
    if (s.k === 'elem') continue;
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    for (let y = y1; y >= y0; y--) {
      if (!covers(s, x, y, z)) continue;
      if (!best || y + 1 > best.top) best = { m: 'm' in s ? s.m : AIR, top: y + 1 };
      break;
    }
  }
  return best;
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
    g.fillStyle = tone(t.m, Math.min(1, t.top / 24));
    g.fillRect((dx + R) * PX, (dz + R) * PX, PX, PX);
  }
  // the spawns and the nests: small squares in the palette's paper tone
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
  const H = p.y1 - p.y0;
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

export function skyPandaGallery(g: GalleryKit) {
  const p = panda.generate(new Rng(1), ORIGIN);
  g.head('Sky floor 1, the panda: the plan from above (the Bamboo Seat, the gentle path, the building path, nests and clumps)');
  g.fig(g.row(), drawPlan(p), 'plan · bamboo gentle path and seat, skywood building path, pale marks: nests and clumps');

  g.head('The section through the seat along x: the ledge strip is the vertical route to the way up');
  g.fig(g.row(), drawElevation(p, (i, h) => blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z)), 'section along x through the seat, the ground to the way up');

  g.head('From the ground to the south: the silhouette of the whole floor, nearest block along z');
  g.fig(g.row(), drawElevation(p, (i, h) => {
    for (let dz = -R; dz <= R; dz++) {
      const m = blockAt(p, ORIGIN.x + i, p.y0 + h, ORIGIN.z + dz);
      if (m !== null) return m;
    }
    return null;
  }), 'silhouette from the south, the ground to the way up');

  skyPandaBeings(g);
}

/** One plush model on the day sky, with the game's two lights, posed by `pose` (null: as built). */
function being(list: readonly ModelPart[], yaw: number, pose: ((parts: Parts) => void) | null, size: number, frame: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.setClearColor(pal('sky.day'));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const built = buildModel({ model: [...list] } as unknown as EnemyDef);
  const holder = new THREE.Group();
  holder.add(built.group);
  built.group.rotation.y = yaw;
  scene.add(holder);
  const parts = new Map<string, THREE.Object3D>();
  for (const [n, objs] of built.parts) if (objs[0]) parts.set(n, objs[0]);
  pose?.(parts);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, frame * 0.6, frame * 3.4);
  cam.lookAt(0, frame * 0.5, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = out.height = size;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  renderer.dispose();
  return out;
}

function grey(c: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = c.width; out.height = c.height;
  const g = out.getContext('2d')!;
  g.filter = 'grayscale(1)';
  g.drawImage(c, 0, 0);
  return out;
}

const DEITY = [...pandaDeity.model.body, ...pandaDeity.model.head];
const pose = (p: Partial<PandaPose>, ratio = 0) => (parts: Parts) =>
  posePanda(parts, ratio, { core: 'Watching', tell: null, u: 0, still: false, won: false, ...p }, 0.4);

export function skyPandaBeings(g: GalleryKit) {
  g.head('The giant panda (B1): front and three-quarter, colour and greyscale (about 3 blocks tall, the head 2.25 times the body)');
  const r1 = g.row();
  for (const yaw of [0, 0.7]) {
    const c = being(DEITY, yaw, pose({ core: 'Idle' }), 220, 3);
    g.fig(r1, c, `idle, chewing · yaw ${yaw}`);
    g.fig(r1, grey(c), `greyscale · yaw ${yaw}`);
  }

  g.head('Its sign of progress: the heavy lids open as the gold marks gather (no hits, half, all)');
  const r2 = g.row();
  for (const ratio of [0, 0.5, 1]) g.fig(r2, being(DEITY, 0.3, pose({}, ratio), 180, 3), `lids at ${ratio * 100}%`);

  g.head('Each telegraph at its extreme pose (the tell part named in its AttackDef), and the states');
  const r3 = g.row();
  for (const k of PANDA_KINDS as readonly Kind[]) g.fig(r3, being(DEITY, 0.5, pose({ core: 'Attacking', tell: k, u: 1 }), 160, 3), k);
  const r4 = g.row();
  for (const core of ['Recovering', 'Rallying', 'Napping'] as const) g.fig(r4, being(DEITY, 0.5, pose({ core }), 160, 3), core);
  g.fig(r4, being(DEITY, 0.5, pose({ core: 'Won', won: true }, 1), 160, 3), 'won: awake and friendly');

  g.head('The little panda (B5): front and three-quarter, colour and greyscale (about 1.25 blocks)');
  const r5 = g.row();
  for (const yaw of [0, 0.7]) {
    const c = being(pandaMinion.model.parts, yaw, null, 160, 1.3);
    g.fig(r5, c, `little panda · yaw ${yaw}`);
    g.fig(r5, grey(c), `greyscale · yaw ${yaw}`);
  }
}
