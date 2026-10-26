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
    case 'frame':
      // riveted border around a darker plate
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const edge = x < 2 || y < 2 || x > T - 3 || y > T - 3;
        px(x, y, edge ? light : rng.next() < 0.15 ? base : dark);
      }
      for (const [x, y] of [[3, 3], [T - 4, 3], [3, T - 4], [T - 4, T - 4]]) px(x, y, light);
      break;
    case 'seed':
      // dark core with glowing cracks: a breakthrough waiting to happen
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        px(x, y, d > 7.2 ? dark : rng.next() < 0.1 ? dark : base);
      }
      for (let i = 0; i < 4; i++) {
        let x = 7, y = 7;
        for (let k = 0; k < 6; k++) { px(x, y, light); x += rng.int(-1, 1); y += rng.int(-1, 1); x = Math.max(1, Math.min(T - 2, x)); y = Math.max(1, Math.min(T - 2, y)); }
      }
      px(7, 7, '#fff3c4'); px(8, 7, '#fff3c4'); px(7, 8, '#fff3c4'); px(8, 8, '#fff3c4');
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

export type DoorLook = 'normal' | 'treasure' | 'boss' | 'locked';

const DOOR_COLORS: Record<DoorLook, [string, string, string]> = {
  normal: ['#5d4a3a', '#3e3127', '#7a6450'],
  treasure: ['#8a6d12', '#5e4a0b', '#e8c454'],
  boss: ['#6e1f1f', '#431212', '#b8a89a'],
  locked: ['#4b5563', '#2f3640', '#c9a227'],
};

/** Doom-style sliding door: horizontal bands, rivets, a stripe; locked doors get a padlock. */
export function doorTexture(look: DoorLook): THREE.CanvasTexture {
  const S = 32;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;
  const [base, dark, light] = DOOR_COLORS[look];
  const rng = new Rng(55);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (y % 8 === 7) { g.fillStyle = dark; g.fillRect(x, y, 1, 1); }
    else if (rng.next() < 0.08) { g.fillStyle = light; g.globalAlpha = 0.35; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
  }
  g.fillStyle = dark; g.fillRect(0, 0, S, 2); g.fillRect(0, S - 2, S, 2); g.fillRect(0, 0, 2, S); g.fillRect(S - 2, 0, 2, S);
  g.fillStyle = light;
  for (let y = 3; y < S; y += 8) { g.fillRect(3, y, 1, 1); g.fillRect(S - 4, y, 1, 1); }
  if (look === 'boss') { g.fillStyle = light; g.fillRect(14, 6, 4, 4); g.fillRect(13, 10, 6, 3); g.fillStyle = dark; g.fillRect(14, 8, 1, 1); g.fillRect(17, 8, 1, 1); }
  if (look === 'treasure') { g.fillStyle = light; g.fillRect(11, 9, 10, 2); g.fillRect(11, 7, 2, 2); g.fillRect(15, 6, 2, 3); g.fillRect(19, 7, 2, 2); }
  if (look === 'locked') {
    g.fillStyle = light; g.fillRect(13, 12, 6, 6); g.fillRect(14, 9, 1, 3); g.fillRect(17, 9, 1, 3); g.fillRect(14, 9, 4, 1);
    g.fillStyle = dark; g.fillRect(15, 14, 2, 2);
  }
  return pixelTexture(c);
}

/** Small pixel-art sprite for the minimap and HUD icons. */
export function iconCanvas(draw: (g: CanvasRenderingContext2D) => void, size = 16): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d')!);
  return c;
}
