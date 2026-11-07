// ?gallery=sky-koala (docs/architecture/SKY.md §11). Owned by: F2, B2. Rulings: docs/art/sky/koala.md.
//
// The koala deity and its minion, the same models as the game (deities/koala.ts, minions/koala.ts), on a slab of
// sky wood in the halls' dusk: front, ¾ (&angle), side and back; the grip loosening with the hits (B4 progress
// at 0, ⅓, ⅔ and 1); the minion as it turns (react at 0, ⅔ and 1). No randomness. Pending owner review.

import * as THREE from 'three';
import { pal } from '../../content/palette';
import { buildModel } from '../../entities/enemies';
import type { EnemyDef, ModelPart } from '../../enemies/types';
import { koalaDeity } from '../../sky/creatures/deities/koala';
import { koalaMinion } from '../../sky/creatures/minions/koala';
import type { Parts } from '../../sky/types';
import type { GalleryKit } from '../gallery';

const EYE = 1.62;

interface Shot { parts: readonly ModelPart[]; pose: (p: Parts) => void; angle: number; dist: number; look: number }

function render(s: Shot, w: number, h: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setClearColor(pal('sky.hall.high'));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('sky.hall.low'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), new THREE.MeshLambertMaterial({ color: pal('mat.skywood.base') }));
  slab.position.set(0, -0.5, 0);
  scene.add(slab);

  const built = buildModel({ model: [...s.parts] } as unknown as EnemyDef);
  const parts = new Map<string, THREE.Object3D>();
  for (const [name, objs] of built.parts) if (objs[0]) parts.set(name, objs[0]);
  s.pose(parts);
  built.group.rotation.y = s.angle;
  scene.add(built.group);

  const cam = new THREE.PerspectiveCamera(50, w / h, 0.05, 80);
  cam.position.set(0, EYE, s.dist);
  cam.lookAt(0, s.look, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  built.group.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
  renderer.dispose();
  return out;
}

const deg = (d: number) => d * Math.PI / 180;

export function skyKoalaGallery(g: GalleryKit) {
  const deity = [...koalaDeity.model.body, ...koalaDeity.model.head];
  const still = (p: Parts) => koalaDeity.model.progress(p, 0);
  g.head('The koala deity hugging its branch (about 3.4 high, head 2.2 × the body): front, ¾ (&angle), side, back');
  const r = g.row();
  for (const [label, a] of [['front', 0], [`¾ · ${Math.round(g.angle * 180 / Math.PI)}°`, g.angle], ['side', deg(90)], ['back', deg(180)]] as const) {
    g.fig(r, render({ parts: deity, pose: still, angle: a, dist: 7, look: 1.8 }, 320, 280), label);
  }

  g.head('B4 progress: the grip loosens with the hits, one arm, the other, then only the claws (0, ⅓, ⅔, all 30)');
  const rp = g.row();
  for (const k of [0, 1 / 3, 2 / 3, 1]) {
    g.fig(rp, render({ parts: deity, pose: p => koalaDeity.model.progress(p, k), angle: g.angle, dist: 7, look: 1.8 }, 240, 240), `${Math.round(k * 30)} hits`);
  }

  g.head('The koala minion (about one block): front, ¾, side; turning (0, 2 of 3 hits, an ally)');
  const rm = g.row();
  const minion = koalaMinion.model.parts;
  for (const [label, a] of [['front', 0], ['¾', g.angle], ['side', deg(90)]] as const) {
    g.fig(rm, render({ parts: minion, pose: p => koalaMinion.model.react(p, 0), angle: a, dist: 2.6, look: 0.6 }, 220, 220), label);
  }
  for (const k of [2 / 3, 1]) {
    g.fig(rm, render({ parts: minion, pose: p => koalaMinion.model.react(p, k), angle: g.angle, dist: 2.6, look: 0.6 }, 220, 220), k === 1 ? 'ally' : '2 of 3');
  }

  g.head('Deity and minion together, from the limb (12 blocks): the silhouette must read as a koala first');
  const rf = g.row();
  g.fig(rf, render({ parts: deity, pose: still, angle: g.angle, dist: 12, look: 1.8 }, 320, 240), 'deity at 12');
  g.fig(rf, render({ parts: minion, pose: p => koalaMinion.model.react(p, 0), angle: g.angle, dist: 8, look: 0.6 }, 320, 240), 'minion at 8');
}
