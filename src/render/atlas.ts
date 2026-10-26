// Pixel-art texture atlas generated at runtime: original art, zero image files.

import * as THREE from 'three';
import { MATERIALS, type MaterialDef } from '../content/materials';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, TILE_CRACK0, TILE_GRASS_TOP, TILE_PX } from '../content/tiles';
import { Rng } from '../core/rng';

const T = TILE_PX;

function hex(c: number) { return '#' + c.toString(16).padStart(6, '0'); }

function paintTile(g: CanvasRenderingContext2D, ox: number, oy: number, m: MaterialDef, rng: Rng) {
  const [base, dark, light] = m.colors.map(hex);
  const px = (x: number, y: number, c: string) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
  g.fillStyle = base; g.fillRect(ox, oy, T, T);
  switch (m.pattern) {
    case 'noise':
    case 'speckle':
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const r = rng.next();
        if (r < 0.18) px(x, y, dark); else if (r > 0.86) px(x, y, light);
      }
      if (m.key === 'ore') for (let i = 0; i < 6; i++) {
        const x = rng.int(1, T - 3), y = rng.int(1, T - 3);
        px(x, y, light); px(x + 1, y, light); px(x, y + 1, hex(0xb0805a));
      }
      if (m.key === 'obsidian') for (let i = 0; i < 5; i++) px(rng.int(0, T - 1), rng.int(0, T - 1), hex(0x8a5cc7));
      break;
    case 'brick':
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const row = y >> 2, off = row % 2 ? 4 : 0;
        if (y % 4 === 3 || (x + off) % 8 === 7) px(x, y, dark);
        else if (rng.next() < 0.1) px(x, y, light);
      }
      break;
    case 'planks':
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        if (y % 5 === 4 || x === 0 || x === T - 1) px(x, y, dark);
        else if (rng.next() < 0.12) px(x, y, light);
      }
      for (let i = 2; i < T - 2; i++) { px(i, i, dark); px(T - 1 - i, i, dark); }
      break;
    case 'cracked':
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const r = rng.next();
        if (r < 0.25) px(x, y, dark); else if (r > 0.9) px(x, y, light);
      }
      for (let i = 0; i < 3; i++) {
        let x = rng.int(0, T - 1), y = rng.int(0, T - 1);
        for (let k = 0; k < 7; k++) { px(x, y, dark); x = (x + rng.int(-1, 1) + T) % T; y = (y + 1) % T; }
      }
      break;
    case 'grass':
      // grass side: dirt with a green fringe on top
      paintTile(g, ox, oy, MATERIALS[1], rng);
      for (let x = 0; x < T; x++) {
        const h = 3 + (rng.next() < 0.5 ? 1 : 0) + (rng.next() < 0.25 ? 1 : 0);
        for (let y = 0; y < h; y++) px(x, y, rng.next() < 0.2 ? light : base);
      }
      break;
  }
}

function paintGrassTop(g: CanvasRenderingContext2D, ox: number, oy: number, rng: Rng) {
  const [base, dark, light] = MATERIALS[2].colors.map(hex);
  g.fillStyle = base; g.fillRect(ox, oy, T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const r = rng.next();
    g.fillStyle = r < 0.2 ? dark : r > 0.85 ? light : base;
    g.fillRect(ox + x, oy + y, 1, 1);
  }
}

/** Cracks: dark lines that grow longer with each stage. */
export function paintCracks(g: CanvasRenderingContext2D, ox: number, oy: number, stage: number, seed = 7) {
  const rng = new Rng(seed);
  const strokes = 2 + stage * 2, len = 3 + stage * 2;
  g.fillStyle = 'rgba(10,8,8,0.85)';
  for (let s = 0; s < strokes; s++) {
    let x = rng.int(3, T - 4), y = rng.int(3, T - 4);
    for (let k = 0; k < len; k++) {
      g.fillRect(ox + x, oy + y, 1, 1);
      x = Math.min(T - 1, Math.max(0, x + rng.int(-1, 1)));
      y = Math.min(T - 1, Math.max(0, y + rng.int(-1, 1)));
    }
  }
}

export function buildAtlas(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = ATLAS_COLS * T; c.height = ATLAS_ROWS * T;
  const g = c.getContext('2d')!;
  const at = (tile: number): [number, number] => [(tile % ATLAS_COLS) * T, Math.floor(tile / ATLAS_COLS) * T];
  for (const m of MATERIALS) {
    if (m.id === 0) continue;
    paintTile(g, ...at(m.id), m, new Rng(1000 + m.id));
  }
  paintGrassTop(g, ...at(TILE_GRASS_TOP), new Rng(77));
  for (let s = 0; s < CRACK_STAGES; s++) paintCracks(g, ...at(TILE_CRACK0 + s), s);
  return pixelTexture(c);
}

/** Texture for a single material (loose cubes and the block in your hand). */
export function materialTexture(matId: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  const g = c.getContext('2d')!;
  if (matId === 2) paintGrassTop(g, 0, 0, new Rng(77));
  else paintTile(g, 0, 0, MATERIALS[matId], new Rng(1000 + matId));
  return pixelTexture(c);
}

export function crackTexture(stage: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  paintCracks(c.getContext('2d')!, 0, 0, stage);
  return pixelTexture(c);
}

function pixelTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
