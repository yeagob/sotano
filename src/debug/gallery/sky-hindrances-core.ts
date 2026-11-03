// ?gallery=sky-hindrances-core (docs/architecture/SKY.md §11). Owned by: H0. Rulings: docs/art/sky/hindrances-core.md.
//
// The two hindrances of the core, as the player reads them: knockback (a ring, a line and a cone) and wind
// (the three lanes of a gust), each as its warning (dashed, the dark tone) and as its live marks (solid,
// the outline tone, twice the size), drawn by the game's Hazards with the sky's tints. Seen from above, and
// from the player's eye eight blocks back, on the sky's stone. Same shapes as the game (kickShapes,
// gustLanes); no randomness in the marks.

import * as THREE from 'three';
import { Hazards, type HazardHost, type MarkPaint, type Shape } from '../../enemies/attacks';
import { pal, palCss, type PalToken } from '../../content/palette';
import { kickShapes, KNOCKBACK_PAINT } from '../../sky/hindrances/knockback';
import { gustLanes, WIND_PAINT } from '../../sky/hindrances/wind';
import type { GalleryKit } from '../gallery';

/** The camera's views: from above, or from the player's eye eight blocks back. */
type View = 'above' | 'eye';

interface Shot {
  shapes: readonly Shape[];
  paint: MarkPaint;
  /** The warning (dashed) or the live marks (solid). */
  live: boolean;
  view: View;
}

/** The marks never hit anything in the gallery: the host has no actors. */
const NONE: HazardHost = {
  actors: () => [],
  hurt: () => {},
  affect: () => {},
  push: () => {},
  live: () => {},
  particles: () => {},
};

function render(s: Shot, w: number, h: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setClearColor(pal('sky.deck.haze'));
  const scene = new THREE.Scene();

  // the floor is the sky's pale stone, top at y 0 (the marks lie on it)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40), new THREE.MeshBasicMaterial({ color: pal('mat.palestone.base') }));
  floor.position.y = -0.5;
  scene.add(floor);

  const hz = new Hazards(scene, NONE);
  for (const shape of s.shapes) {
    // a warning runs for longer than the shot's own time, so it stays a warning; a live mark has no lead
    hz.add(-1, 'neutral', 'gallery', s.live
      ? { lead: 0, live: 99, damage: 0, shape, tint: s.paint }
      : { lead: 99, live: 0, damage: 0, shape, tint: s.paint });
  }
  hz.update(0.05);

  const cam = s.view === 'above'
    ? new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    : new THREE.PerspectiveCamera(60, w / h, 0.05, 100);
  if (s.view === 'above') {
    // the marks are small by design (0.09 blocks): the view is close enough to read a dash
    cam.position.set(0, 14, 0.01);
    cam.lookAt(0, 0, 0);
  } else {
    cam.position.set(0, 1.6, 8);
    cam.lookAt(0, 0.4, 0);
  }
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  hz.dispose();
  floor.geometry.dispose();
  (floor.material as THREE.Material).dispose();
  renderer.dispose();
  return out;
}

const RING = kickShapes({ from: { x: 0, y: 0, z: 0 }, shape: 'ring', radius: 4, strength: 0 });
const LINE = kickShapes({ from: { x: -6, y: 0, z: 0 }, shape: 'line', dir: { x: 1, y: 0, z: 0 }, radius: 10, strength: 0 });
const CONE = kickShapes({ from: { x: -5, y: 0, z: 0 }, shape: 'cone', dir: { x: 1, y: 0, z: 0 }, radius: 9, strength: 0 });
const GUST = gustLanes({ from: { x: -8, y: 0, z: 0 }, to: { x: 8, y: 0, z: 0 }, radius: 2.5, strength: 0, seconds: 0 });

export function skyHindrancesCoreGallery(g: GalleryKit) {
  const size = { w: 360, h: 300 };

  g.head('Knockback, the warning (dashed, the wood\'s dark): a ring, a line and a cone, from above, on the pale stone');
  const rw = g.row();
  for (const [label, shapes] of [['ring', RING], ['line', LINE], ['cone', CONE]] as const) {
    g.fig(rw, render({ shapes, paint: KNOCKBACK_PAINT, live: false, view: 'above' }, size.w, size.h), label);
  }

  g.head('Knockback, live for 0.6 s (solid, the wood\'s outline, twice the marks): the same three, from above');
  const rl = g.row();
  for (const [label, shapes] of [['ring', RING], ['line', LINE], ['cone', CONE]] as const) {
    g.fig(rl, render({ shapes, paint: KNOCKBACK_PAINT, live: true, view: 'above' }, size.w, size.h), label);
  }

  g.head('Wind: the lanes of a gust, the warning (dashed, the leaf\'s dark) and the gust (solid, the outline), from above');
  const rg = g.row();
  g.fig(rg, render({ shapes: GUST, paint: WIND_PAINT, live: false, view: 'above' }, size.w, size.h), 'warning');
  g.fig(rg, render({ shapes: GUST, paint: WIND_PAINT, live: true, view: 'above' }, size.w, size.h), 'blowing');

  g.head('From the player\'s eye, eight blocks back: the gust\'s lanes and a kick\'s cone');
  const re = g.row();
  g.fig(re, render({ shapes: GUST, paint: WIND_PAINT, live: true, view: 'eye' }, 360, 240), 'gust');
  g.fig(re, render({ shapes: CONE, paint: KNOCKBACK_PAINT, live: true, view: 'eye' }, 360, 240), 'cone');

  g.head('Palette: the sky\'s dust and leaf tones for the marks (ΔE ≥ 20 from the warning, the gold and the reds)');
  const rp = g.row();
  const tokens = new Set<PalToken>([KNOCKBACK_PAINT, WIND_PAINT].flatMap(p => [p.tell, p.live, p.reach, ...p.motes]));
  for (const t of tokens) {
    const d = document.createElement('div');
    d.className = 'sw';
    d.style.background = palCss(t);
    g.fig(rp, d, t);
  }
}
