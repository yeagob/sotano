// ?gallery=sky-entity (docs/architecture/SKY.md §11). Owned by: EN. Rulings: docs/art/sky/entity.md.
//
// The Spiked Entity as the player meets it: inside a 4-high chamber of silence (bedrock floor, deepstone
// walls and roof), in silence's ink-black fog (0 → 14 blocks), seen from the player's eye height with the
// game's camera and lights. Then the bounce's shimmer, the distances, the value against the depths'
// materials, and its palette. Same model as the game (entity-view.ts); no randomness.

import * as THREE from 'three';
import { pal, palCss, type PalToken } from '../../content/palette';
import { SpikedEntity } from '../../endgame/entity';
import { EntityView } from '../../endgame/entity-view';
import type { GalleryKit } from '../gallery';

/** The chamber of silence: air from y 0 to 4 here (floor.ts carves y 1–4 over the bedrock). */
const CHAMBER_H = 4;
const EYE = 1.62;
/** Silence's fog (game.ts: ink.void, near 0, far 14). */
const FOG_FAR = 14;

interface Shot { angle: number; dist: number; shimmer?: boolean; fog?: boolean; wall?: PalToken; side?: number }

function render(s: Shot, w: number, h: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  const bg = s.fog === false ? pal(s.wall ?? 'ink.void') : pal('ink.void');
  renderer.setClearColor(bg);
  const scene = new THREE.Scene();
  if (s.fog !== false) scene.fog = new THREE.Fog(pal('ink.void'), 0, FOG_FAR);
  // the game's lights (game.ts), so the husk reads as it will in play
  scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
  const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);

  if (s.fog !== false) {
    // floor, roof and the far wall of the chamber, wide enough to fill every frame
    const slab = (token: PalToken, sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ color: pal(token) }));
      m.position.set(x, y, z);
      scene.add(m);
    };
    slab('mat.bedrock.base', 60, 1, 60, 0, -0.5, 0);
    slab('mat.deepstone.base', 60, 1, 60, 0, CHAMBER_H + 0.5, 0);
    slab('mat.deepstone.base', 60, CHAMBER_H, 1, 0, CHAMBER_H / 2, -4.5);
  }

  const entity = new SpikedEntity(1, { x: 0, y: 0, z: 0 }, { bounce: () => {} });
  entity.facing = s.angle;
  const view = new EntityView(scene);
  view.sync(entity, 0);
  if (s.shimmer) { view.shimmer(); view.sync(entity, 0.25); }
  else view.sync(entity, 0.25);

  const side = s.side ?? 0;
  const cam = new THREE.PerspectiveCamera(s.fog === false ? 40 : 60, w / h, 0.05, 80);
  cam.position.set(side, EYE, s.dist);
  cam.lookAt(0, 1.4, 0);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  view.dispose();
  renderer.dispose();
  return out;
}

const deg = (d: number) => d * Math.PI / 180;

export function skyEntityGallery(g: GalleryKit) {
  g.head('The Spiked Entity in the chamber of silence (4 high, ink fog 0–14), from eye height: front, ¾ (&angle), side, back');
  const r = g.row();
  for (const [label, a] of [['front', 0], [`¾ · ${Math.round(g.angle * 180 / Math.PI)}°`, g.angle], ['side', deg(90)], ['back', deg(180)]] as const) {
    g.fig(r, render({ angle: a, dist: 6.5 }, 360, 240), label);
  }

  g.head('A touch bounces: the tips catch the player\'s light and let it go (shimmer off · on)');
  const rs = g.row();
  for (const on of [false, true]) g.fig(rs, render({ angle: g.angle, dist: 5, shimmer: on }, 360, 240), on ? 'shimmer' : 'still');

  g.head('Distance in silence\'s fog: 4, 8, 12 and 14 blocks (the fog is complete at 14)');
  const rd = g.row();
  for (const d of [4, 8, 12, 14]) g.fig(rd, render({ angle: g.angle, dist: d + 1.5 }, 220, 160), `${d}`);

  g.head('Value against the depths, no fog: deepstone, obsidian, bedrock, ink');
  const rv = g.row();
  for (const wall of ['mat.deepstone.base', 'mat.obsidian.base', 'mat.bedrock.base', 'ink.void'] as PalToken[]) {
    g.fig(rv, render({ angle: g.angle, dist: 8, fog: false, wall }, 220, 180), wall);
  }

  g.head('The turn of the revelation: facing away, half turned, facing you (seen from the front)');
  const rt = g.row();
  for (const a of [deg(180), deg(90), 0]) g.fig(rt, render({ angle: a, dist: 6.5 }, 220, 160), `${Math.round(a * 180 / Math.PI)}°`);

  g.head('Palette: entity.* and the gold its tips borrow');
  const rp = g.row();
  for (const t of ['entity.husk.dark', 'entity.husk.base', 'entity.husk.hi', 'entity.spike.base', 'entity.spike.tip', 'entity.rim', 'light.gold'] as PalToken[]) {
    const d = document.createElement('div');
    d.className = 'sw';
    d.style.background = palCss(t);
    g.fig(rp, d, t);
  }
}
