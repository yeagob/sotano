// ?gallery=sky-lion (docs/architecture/SKY.md §11). Owned by: F4, B4. Rulings: docs/art/sky/lion.md.
// The floor from above: the plan of sky floor 4 (rocks, the Sunning Ledge, the thorn tree, nests, spawns,
// route), north up, 1 block = 8 pixels. Then the beings (B4): the lion and a lion of the pride, from the front,
// three quarters and the side, each telegraph's pose, the mane at 0 and 42 hits, the stare's last warning, and the
// palette. The same models and poses as the game (deities/lion.ts, minions/lion.ts); no randomness.

import * as THREE from 'three';
import { pal, palCss, type PalToken } from '../../content/palette';
import { SKY_LION_PALETTE } from '../../content/palette/sky-lion';
import { buildModel } from '../../entities/enemies';
import type { EnemyDef, ModelPart } from '../../enemies/types';
import { LION_BODY, LION_HEAD, poseLion, type LionPose } from '../../sky/creatures/deities/lion';
import { LION_MINION_PARTS, posePride } from '../../sky/creatures/minions/lion';
import { Rng } from '../../core/rng';
import { lion } from '../../sky/floors/lion';
import type { GalleryKit } from '../gallery';

const PX = 8;
const HALF = 30;

export function skyLionGallery(g: GalleryKit) {
  g.head('Sky floor 4, the lion, from above: rocks, the Sunning Ledge, the thorn tree, nests (gold), spawns, route');
  // The plan is built at the origin, so its cells are relative to the hall's ground centre.
  const plan = lion.generate(new Rng(1), { x: 0, y: 0, z: 0 });
  const size = HALF * 2 * PX;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cg = c.getContext('2d')!;
  // Cell (x, z) to pixels: x to the right, z down (north is up, so z grows south).
  const cell = (x: number, z: number): [number, number] => [(x + HALF) * PX, (z + HALF) * PX];
  cg.fillStyle = palCss('sky.hall.high');
  cg.fillRect(0, 0, size, size);
  cg.beginPath();
  cg.arc(HALF * PX, HALF * PX, 26 * PX, 0, Math.PI * 2);
  cg.fillStyle = palCss('mat.moss.dark');
  cg.fill();
  for (const s of plan.shapes) {
    if (s.k === 'box') {
      const [px, pz] = cell(s.x0, s.z0);
      cg.fillStyle = palCss(s.tag === plan.seat.tag ? 'mat.palestone.hi' : 'mat.palestone.base');
      cg.fillRect(px, pz, (s.x1 - s.x0 + 1) * PX, (s.z1 - s.z0 + 1) * PX);
    } else if (s.k === 'helix') {
      const [px, pz] = cell(s.cx - 2, s.cz - 2);
      cg.fillStyle = palCss('mat.skywood.base');
      cg.fillRect(px, pz, 5 * PX, 5 * PX);
    }
  }
  for (const p of plan.route) {
    const [px, pz] = cell(p.x, p.z);
    cg.fillStyle = palCss('mat.skyleaf.hi');
    cg.fillRect(px + PX * 0.25, pz + PX * 0.25, PX * 0.5, PX * 0.5);
  }
  for (const n of plan.nests) {
    const [px, pz] = cell(n.x, n.z);
    cg.fillStyle = palCss('light.gold');
    cg.fillRect(px + 1, pz + 1, PX - 2, PX - 2);
  }
  for (const s of plan.spawns) {
    const [px, pz] = cell(s.x, s.z);
    cg.fillStyle = palCss('mat.fencewood.hi');
    cg.fillRect(px + 1, pz + 1, PX - 2, PX - 2);
  }
  const [sx, sz] = cell(plan.seat.x - ((plan.seat.w - 1) >> 1), plan.seat.z - ((plan.seat.d - 1) >> 1));
  cg.strokeStyle = palCss('mat.palestone.outline');
  cg.lineWidth = 2;
  cg.strokeRect(sx, sz, plan.seat.w * PX, plan.seat.d * PX);
  g.fig(g.row(), c, 'plan, north up, 1 block = 8 px');
  skyLionBeings(g);
}

/** One frame of a plush model on the Sunning Ledge's pale stone, under the sky, with the game's lights. */
function shot(parts: readonly ModelPart[], pose: (p: Map<string, THREE.Object3D>) => void, angle: number, dist: number, w: number, h: number, look: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setClearColor(pal('sky.day'));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), new THREE.MeshLambertMaterial({ color: pal('mat.palestone.base') }));
  ground.position.set(0, -0.5, 0);
  scene.add(ground);
  const built = buildModel({ model: [...parts] } as unknown as EnemyDef);
  const named = new Map<string, THREE.Object3D>();
  for (const [k, v] of built.parts) if (v[0]) named.set(k, v[0]);
  pose(named);
  scene.add(built.group);
  const cam = new THREE.PerspectiveCamera(40, w / h, 0.05, 80);
  cam.position.set(Math.sin(angle) * dist, look + 0.4, Math.cos(angle) * dist);
  cam.lookAt(0, look, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  built.group.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
  renderer.dispose();
  return out;
}

const REST: LionPose = { ratio: 0, pose: null, state: 'Watching', stare: 0, blink: 0, yaw: 0, clock: 0.3 };
const LION = [...LION_BODY, ...LION_HEAD];

export function skyLionBeings(g: GalleryKit) {
  g.head('The lion (B4, pending owner review): front, ¾ (&angle), side, back; on the Sunning Ledge’s pale stone');
  const r = g.row();
  for (const [label, a] of [['front', 0], [`¾ · ${Math.round(g.angle * 180 / Math.PI)}°`, g.angle], ['side', Math.PI / 2], ['back', Math.PI]] as const) {
    g.fig(r, shot(LION, p => poseLion(p, REST), a, 7, 300, 240, 1.6), label);
  }
  g.head('Its telegraphs (the tell is its own part): roar (mane lifts), crosswind (tail), pounce and scruff (crouch), long grass (sinks), scrape (hind paws), dusk call (chest), mane flare, noon sun (yawn)');
  const rt = g.row();
  for (const pose of ['lift', 'lash', 'crouch', 'sink', 'rake', 'chest', 'fluff', 'yawn']) {
    g.fig(rt, shot(LION, p => poseLion(p, { ...REST, pose }), g.angle, 7, 200, 170, 1.6), pose);
  }
  g.head('Progress and the stare: basking; the mane at 0 and at 42 hits (it lies softer); the stare building; its last 1.2 s (eyes flare, mane brightens); a blink');
  const rp = g.row();
  const states: [string, LionPose][] = [
    ['basking', { ...REST, state: 'Basking' }], ['0 hits', REST], ['42 hits', { ...REST, ratio: 1 }],
    ['stare 50%', { ...REST, stare: 0.5 }], ['stare, last warning', { ...REST, stare: 0.95 }], ['blink', { ...REST, blink: 0.3 }],
  ];
  for (const [label, pose] of states) g.fig(rp, shot(LION, p => poseLion(p, pose), 0, 7, 200, 170, 1.6), label);
  g.head('A lion of the pride (about 1 block): at rest, ¾, crouched to pounce, roaring, hit twice, turned ally');
  const rm = g.row();
  const minion: [string, number, string, number][] = [['rest', 0, 'free', 0], ['¾', g.angle, 'free', 0], ['crouch', g.angle, 'crouch', 0], ['roar', g.angle, 'roar', 0], ['2 of 4 hits', g.angle, 'free', 0.5], ['ally', g.angle, 'free', 1]];
  for (const [label, a, mode, ratio] of minion) g.fig(rm, shot(LION_MINION_PARTS, p => posePride(p, { mode, ratio, t: 0.1 }), a, 2.6, 180, 150, 0.6), label);
  g.head('Palette: plush.lion.*, and the gold of the player’s marks it keeps clear of');
  const rs = g.row();
  for (const t of [...Object.keys(SKY_LION_PALETTE), 'light.gold'] as PalToken[]) {
    const d = document.createElement('div');
    d.className = 'sw';
    d.style.background = palCss(t);
    g.fig(rs, d, t);
  }
}
