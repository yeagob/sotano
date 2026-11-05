// ?gallery=sky-horse (docs/architecture/SKY.md §11). Owned by: F5 (the floor), B5 (the beings). Rulings: docs/art/sky/horse.md.
//
// Sky floor 5 as its generator draws it, from a fixed seed: the plan from above, and a section through
// the mast from the meadow to the way up. Shapes are painted in their own colours (the base of each
// material), the last shape that covers a cell wins, as in the world. Then the beings (B5): the horse and a
// horse of the herd in their poses, on the meadow's moss and the paddocks' pale stone, at the turntable angle.

import * as THREE from 'three';
import { MATERIALS } from '../../content/materials';
import { pal, palCss, type PalToken } from '../../content/palette';
import { buildModel } from '../../entities/enemies';
import type { EnemyDef, ModelPart } from '../../enemies/types';
import { Rng } from '../../core/rng';
import { HORSE_DEITY_PARTS, poseHorse, restPose, type HorsePose } from '../../sky/creatures/deities/horse';
import { HORSE_MINION_PARTS, poseHerd, type HerdPose } from '../../sky/creatures/minions/horse';
import { horse } from '../../sky/floors/horse';
import type { Shape, SkyFloorPlan, Vec3 } from '../../sky/types';
import { boundsOf, covers } from '../../sky/world/shapes';
import type { GalleryKit } from '../gallery';

const CELL = 6;
const ORIGIN: Vec3 = { x: 128, y: 194, z: 128 };
const RADIUS = 33;
const HEIGHT = 23;
const SEED = 5;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const BASE = new Map(MATERIALS.map(m => [m.id, m.colors[0]] as const));
/** The material a block shape lays (an element shape lays none; the floor has none). */
const matOf = (s: Shape): number => ('m' in s ? s.m : 0);

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w * CELL;
  c.height = h * CELL;
  return c;
}

/** The plan: each column shows its highest block, in the colour of the material that holds it. */
function plan(p: SkyFloorPlan): HTMLCanvasElement {
  const n = RADIUS * 2 + 1;
  const top = new Map<number, [number, number]>();
  for (const s of p.shapes as Shape[]) {
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    for (let z = Math.max(z0, ORIGIN.z - RADIUS); z <= Math.min(z1, ORIGIN.z + RADIUS); z++)
      for (let x = Math.max(x0, ORIGIN.x - RADIUS); x <= Math.min(x1, ORIGIN.x + RADIUS); x++)
        for (let y = y0; y <= y1; y++)
          if (covers(s, x, y, z)) {
            const k = (z - ORIGIN.z + RADIUS) * n + (x - ORIGIN.x + RADIUS);
            const was = top.get(k);
            if (!was || y >= was[0]) top.set(k, [y, matOf(s)]);
          }
  }
  const c = canvas(n, n), g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.hall.low');
  g.fillRect(0, 0, c.width, c.height);
  for (const [k, [, m]] of top) {
    g.fillStyle = hex(BASE.get(m) ?? 0);
    g.fillRect((k % n) * CELL, Math.floor(k / n) * CELL, CELL, CELL);
  }
  return c;
}

/** A section along x through the mast's row (z one cell under the centre): ground at the bottom, the way up at the top. */
function section(p: SkyFloorPlan): HTMLCanvasElement {
  const n = RADIUS * 2 + 1, zCut = p.gate.z;
  const c = canvas(n, HEIGHT), g = c.getContext('2d')!;
  g.fillStyle = palCss('sky.hall.low');
  g.fillRect(0, 0, c.width, c.height);
  for (const s of p.shapes as Shape[]) {
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    if (zCut < z0 || zCut > z1) continue;
    for (let x = Math.max(x0, ORIGIN.x - RADIUS); x <= Math.min(x1, ORIGIN.x + RADIUS); x++)
      for (let y = Math.max(y0, ORIGIN.y); y <= Math.min(y1, ORIGIN.y + HEIGHT - 1); y++)
        if (covers(s, x, y, zCut)) {
          g.fillStyle = hex(BASE.get(matOf(s)) ?? 0);
          g.fillRect((x - ORIGIN.x + RADIUS) * CELL, (ORIGIN.y + HEIGHT - 1 - y) * CELL, CELL, CELL);
        }
  }
  return c;
}


/** One model, posed, rendered as the gallery renders creatures (its hemisphere and sun, the turntable angle). */
function render(parts: readonly ModelPart[], pose: (p: Map<string, THREE.Object3D>, root: THREE.Object3D) => void,
  w: number, h: number, dist: number, target: number, bg: PalToken, angle: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setClearColor(pal(bg));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const built = buildModel({ model: [...parts] } as unknown as EnemyDef);
  const named = new Map<string, THREE.Object3D>();
  for (const [k, v] of built.parts) if (v[0]) named.set(k, v[0]);
  const turn = new THREE.Group();
  turn.add(built.group);
  scene.add(turn);
  pose(named, built.group);
  turn.rotation.y = angle;
  const cam = new THREE.PerspectiveCamera(40, w / h, 0.05, 60);
  cam.position.set(0, target + 0.25, dist);
  cam.lookAt(0, target, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  renderer.dispose();
  return out;
}

const DEITY_POSES: readonly [string, Partial<HorsePose>, number][] = [
  ['grazing', { head: 0.55 }, 0], ['alert', { head: -0.15, ears: 1 }, 0], ['rear and stamp', { rear: 1, ears: 1 }, 0],
  ['crouch (leap)', { crouch: 1 }, 0], ['tail gust', { tail: 1, t: 0.12 }, 0], ['snort', { head: -0.3, flare: 1 }, 0],
  ['snaking', { head: 0.35, ears: -1, swing: 1, t: 0.15 }, 0], ['Gentled', { head: 0.45 }, 0],
  ['half the marks', {}, 0.5], ['won', { head: 0.55 }, 1],
];
const HERD_POSES: readonly [string, Partial<HerdPose>][] = [
  ['gallop', { mode: 'run', stride: 0.5 }], ['graze', { mode: 'graze' }], ['kick (gathered legs)', { mode: 'kick' }],
  ['two hits', { mode: 'stand', ratio: 0.5 }], ['ally', { mode: 'stand', ratio: 1, ally: true, t: 0.3 }],
];

/** The beings: the deity in its poses and telegraphs, and a horse of the herd, on moss and on pale stone. */
function beings(g: GalleryKit) {
  for (const bg of ['mat.moss.base', 'mat.palestone.base'] as PalToken[]) {
    g.head(`The horse (sky floor 5) on ${bg}: its poses and telegraphs, the eyes softening and ears turning as the marks gather`);
    const r = g.row();
    for (const [label, over, ratio] of DEITY_POSES) {
      const p = { ...restPose(), ...over };
      fig(g, r, render(HORSE_DEITY_PARTS, (parts, root) => poseHorse(parts, root, p, ratio), 220, 300, 7, 1.6, bg, g.angle), label);
    }
    g.head(`A horse of the herd on ${bg}`);
    const h = g.row();
    for (const [label, over] of HERD_POSES) {
      const p: HerdPose = { yaw: 0, mode: 'stand', stride: 0, ratio: 0, ally: false, t: 0, ...over };
      fig(g, h, render(HORSE_MINION_PARTS, (parts, root) => poseHerd(parts, root, p), 160, 200, 3, 0.65, bg, g.angle), label);
    }
  }
}

const fig = (g: GalleryKit, r: HTMLElement, c: HTMLCanvasElement, label: string) => g.fig(r, c, label);

export function skyHorseGallery(g: GalleryKit) {
  const p = horse.generate(new Rng(SEED), ORIGIN);
  g.head('Sky floor 5, the meadow: the plan from above, and a section through the mast (ground at the bottom, the way up at the top)');
  const r = g.row();
  g.fig(r, plan(p), `plan · six paddocks, the runs, the mast at the centre · seed ${SEED}`);
  g.fig(r, section(p), `section · ${p.route.length - 1} rungs of the mast to the way up`);
  beings(g);
}
