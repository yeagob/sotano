// ?gallery=bombs (docs/art/DECISIONS.md §7.8). The two seeds of a bomb: the black breakthrough of a negative
// bomb and the white seed of a bomb placed at positive polarity (the love breakthrough). Both at rest (fuse
// 1.8) and at fuse 0.3, on the light deck and on the void, and both at 20 blocks in floor-1 fog. The seeds
// are the game's own buildSeed and fuseSeed, at the placed size (DebrisView). No randomness.
// Colour, greyscale and the colour-blindness filters are the gallery's &filter parameter.

import * as THREE from 'three';
import { pal, type PalToken } from '../../content/palette';
import { DEBRIS_SIZE } from '../../physics/debris';
import { buildSeed, disposeSeed, fuseSeed, SEED_H, SEED_VOXEL, type SeedKind } from '../../render/seed-model';
import type { GalleryKit } from '../gallery';

const SIZE = 200;
const KINDS: SeedKind[] = ['breakthrough', 'love'];
const SEED_SCALE = DEBRIS_SIZE / (SEED_H * SEED_VOXEL);

/** One seed at the origin, `dist` blocks from the camera, drawn at `fuse` seconds to go. */
function frame(kind: SeedKind, fuse: number, dist: number, bg: PalToken, fog?: PalToken): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE, false);
  renderer.setClearColor(pal(bg));
  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.Fog(pal(fog), 6, 34);
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const m = buildSeed(kind);
  // the root sits at the bottom of the seed, as the debris view places it: the seed's middle is half a cube up
  m.root.scale.setScalar(SEED_SCALE * fuseSeed(m, fuse));
  scene.add(m.root);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
  cam.position.set(0, DEBRIS_SIZE / 2, dist);
  cam.lookAt(0, DEBRIS_SIZE / 2, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = SIZE; out.height = SIZE;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  disposeSeed(m);
  renderer.dispose();
  return out;
}

export function bombsGallery(g: GalleryKit) {
  g.head('Bombs: the breakthrough (negative, black) and the white seed (placed at positive polarity), at rest and at fuse 0.3');
  for (const bg of ['rock.f1.base', 'ink.void'] as PalToken[]) {
    const r = g.row();
    for (const kind of KINDS) for (const fuse of [1.8, 0.3]) {
      g.fig(r, frame(kind, fuse, 1.6, bg), `${kind} · fuse ${fuse} · ${bg}`);
    }
  }

  g.head('The same two at 20 blocks in floor-1 fog');
  const far = g.row();
  for (const kind of KINDS) g.fig(far, frame(kind, 1.8, 20, 'fog.f1', 'fog.f1'), `${kind} · 20 blocks`);
}
