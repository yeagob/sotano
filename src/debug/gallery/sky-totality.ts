// ?gallery=sky-totality (docs/architecture/SKY.md §11). Owned by: TT. Rulings: docs/art/sky/totality.md.
//
// Totality as the player meets it, with the game's fog and clear colour of the stratum (atmosphere.ts) and
// the game's views (earth.ts, sun.ts): the Earth below the void, the Sun over the solar approach, and the
// Sun's volume beyond the last checkpoint, the way the last jump meets it. Unlit, like every
// block of the game. No randomness: the chain is the run's fork at a fixed seed.

import * as THREE from 'three';
import { MATERIALS } from '../../content/materials';
import { palCss, type PalToken } from '../../content/palette';
import { Rng, hashPath } from '../../core/rng';
import { atmosphereAt } from '../../sky/atmosphere';
import { EarthView } from '../../sky/render/earth';
import { SunView } from '../../sky/render/sun';
import { buildTotality } from '../../sky/totality/chain';
import type { SkyPlace, TotalityPlan, Vec3 } from '../../sky/types';
import type { GalleryKit } from '../gallery';

const W = 360, H = 240;

/** A frame of Totality from `eye` looking at `look`, in `place`'s air at the eye's height, with `add` building the scene. */
function frame(place: SkyPlace, eye: Vec3, look: Vec3, add: (root: THREE.Group) => void): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  const a = atmosphereAt(place, eye.y);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(a.clear);
  scene.fog = new THREE.Fog(a.fog, a.near, a.far);
  const root = new THREE.Group();
  scene.add(root);
  add(root);
  const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 1200);
  cam.position.set(eye.x, eye.y, eye.z);
  cam.lookAt(look.x, look.y, look.z);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  renderer.dispose();
  return out;
}

/** The plan's solids near the threshold as unlit boxes in their material's base colour. */
function solids(plan: TotalityPlan, root: THREE.Group) {
  const last = plan.platforms[plan.platforms.length - 1];
  for (const s of plan.shapes) {
    if (s.k !== 'box') continue;
    const near = Math.abs(s.x0 - last.x) < 14 && Math.abs(s.z0 - last.z) < 14 && s.y0 > last.y - 40;
    if (!near) continue;
    const def = MATERIALS.find(m => m.id === s.m);
    if (!def) continue;
    const size = [s.x1 - s.x0 + 1, s.y1 - s.y0 + 1, s.z1 - s.z0 + 1];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      new THREE.MeshBasicMaterial({ color: palCss(`mat.${def.key}.base` as PalToken) }),
    );
    mesh.position.set(s.x0 + size[0] / 2, s.y0 + size[1] / 2, s.z0 + size[2] / 2);
    root.add(mesh);
  }
}

export function skyTotalityGallery(g: GalleryKit) {
  g.head('Totality (×3): the Earth below the void, the Sun over the solar approach, the Sun\'s entrance');

  const plan = buildTotality((...path) => new Rng(hashPath(0x7e7, path)), { x: 128, y: 221, z: 128 });
  const sun = plan.sun, last = plan.platforms[plan.platforms.length - 1];

  const r = g.row();
  g.fig(r, frame('totality', { x: 0, y: 520, z: 0 }, { x: 0, y: 220, z: -20 }, root => {
    const earth = new EarthView(root);
    earth.update({ x: 0, y: 520, z: 0 }, 0);
  }), 'the Earth from the void at 520: a sphere below, its limb in thin air');

  // the Sun stands at its volume, 260 below the eye here: past 150 it is drawn on its line at 150 (far.ts)
  const below = { x: sun.x, y: sun.y - 260, z: sun.z };
  g.fig(r, frame('totality', below, sun, root => {
    const view = new SunView(root, sun);
    view.update(below, 0);
  }), 'the Sun from the solar approach, 260 below it: drawn at its true angular size, the one warmth that is not the player\'s');

  const eye = { x: last.x, y: last.y + 2, z: last.z };
  g.fig(r, frame('totality', eye, { x: sun.x, y: sun.y + 2.5, z: sun.z }, root => {
    solids(plan, root);
    // the Sun's volume, as the sphere the last jump enters (the disc of the view is camera-relative, sun.ts)
    const volume = new THREE.Mesh(
      new THREE.SphereGeometry(sun.r, 32, 24),
      new THREE.MeshBasicMaterial({ color: palCss('sky.strata.corona'), fog: false }),
    );
    volume.position.set(sun.x, sun.y, sun.z);
    root.add(volume);
  }), 'the last checkpoint: the last jump enters the Sun\'s volume beyond it (Unity pending)');
}
