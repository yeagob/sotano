// Pixel-art texture atlas generated at runtime: original art, zero image files.
// The texture grammar of docs/art/DECISIONS.md §6.1: every tile is a 4-value ramp (outline, dark,
// base, hi) drawn as shapes, never noise; every shape is bevelled with light from the top-left;
// features are ≥ 2 px; mortar and gaps are the outline. Cracks are cracks of light (§6.3).

import * as THREE from 'three';
import { MATERIALS, type MaterialDef } from '../content/materials';
import { palCss, type PalToken } from '../content/palette';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, TILE_CRACK0, TILE_GRASS_TOP, TILE_PX } from '../content/tiles';
import { Rng } from '../core/rng';

const T = TILE_PX;

type Px = (x: number, y: number, c: string) => void;
type Ramp = { o: string; d: string; b: string; h: string; a?: string };

const rampOf = (m: MaterialDef): Ramp => {
  const [o, d, b, h] = m.ramp.map(palCss);
  return { o, d, b, h, a: m.accent ? palCss(m.accent) : undefined };
};

/** A bevelled rectangle: hi on top and left, dark on bottom and right, base inside. */
function bevel(px: Px, x0: number, y0: number, w: number, h: number, r: Ramp, fill = r.b) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const top = y === y0 || x === x0, bottom = y === y0 + h - 1 || x === x0 + w - 1;
    px(x, y, top && !(bottom && (y === y0 + h - 1)) ? r.h : bottom ? r.d : fill);
  }
}

/** Voronoi plates (stone, bedrock, ore): one tone per plate, outline between plates, hi on top-left edges. */
function plates(px: Px, rng: Rng, n: number, r: Ramp, tones: string[], highlight = true) {
  const seeds = Array.from({ length: n }, () => [rng.int(0, T - 1), rng.int(0, T - 1)]);
  const tone = seeds.map(() => tones[rng.int(0, tones.length - 1)]);
  const owner = (x: number, y: number) => {
    // wraps, so the tile tiles seamlessly
    let best = 0, bd = Infinity;
    seeds.forEach(([sx, sy], i) => {
      const dx = Math.min(Math.abs(x - sx), T - Math.abs(x - sx)), dy = Math.min(Math.abs(y - sy), T - Math.abs(y - sy));
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const p = owner(x, y);
    if (owner((x + 1) % T, y) !== p || owner(x, (y + 1) % T) !== p) px(x, y, r.o);
    else if (highlight && (owner((x + T - 1) % T, y) !== p || owner(x, (y + T - 1) % T) !== p)) px(x, y, r.h);
    else px(x, y, tone[p]);
  }
}

function paintTile(g: CanvasRenderingContext2D, ox: number, oy: number, m: MaterialDef, rng: Rng) {
  const r = rampOf(m);
  const px: Px = (x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
  g.fillStyle = r.b; g.fillRect(ox, oy, T, T);
  switch (m.pattern) {
    case 'clumps': {
      // soft clumps: dark 2×3 blobs and bevelled 2×2 pebbles, no straight lines
      for (let i = 0; i < 5; i++) {
        const x = rng.int(0, T - 2), y = rng.int(0, T - 3);
        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) if (rng.next() < 0.85) px(x + dx, y + dy, r.d);
      }
      for (let i = 0; i < 4; i++) {
        const x = rng.int(0, T - 2), y = rng.int(0, T - 2);
        px(x, y, r.h); px(x + 1, y, r.h); px(x, y + 1, r.b); px(x + 1, y + 1, r.d);
      }
      break;
    }
    case 'grass': {
      // grass side: dirt with a ragged 3–5 px fringe of grass on top
      paintTile(g, ox, oy, MATERIALS.find(q => q.key === 'dirt')!, rng);
      for (let x = 0; x < T; x++) {
        const h = 3 + (rng.next() < 0.5 ? 1 : 0) + (rng.next() < 0.3 ? 1 : 0);
        for (let y = 0; y < h; y++) px(x, y, y === h - 1 ? r.d : y === 0 && rng.next() < 0.4 ? r.h : r.b);
      }
      break;
    }
    case 'brick': {
      // running bond: bricks 7×3 + 1 px mortar, every brick bevelled; 1 in 6 a step darker or lighter
      for (let row = 0; row < T / 4; row++) {
        const off = row % 2 ? 4 : 0;
        for (let b = -1; b < 2; b++) {
          const x0 = b * 8 + off, shade = rng.next();
          const fill = shade < 0.09 ? r.d : shade > 0.92 ? r.h : r.b;
          for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
            const tx = x0 + x;
            if (tx < 0 || tx >= T) continue;
            const ty = row * 4 + y;
            if (y === 3 || x === 7) px(tx, ty, r.o);
            else if (y === 0 || x === 0) px(tx, ty, r.h);
            else if (y === 2 || x === 6) px(tx, ty, r.d);
            else px(tx, ty, fill);
          }
          // a chipped corner now and then
          if (rng.next() < 0.3 && x0 + 6 < T && x0 + 6 >= 0) px(x0 + 6, row * 4, r.o);
        }
      }
      break;
    }
    case 'plates':
      plates(px, rng, 5, r, [r.b, r.b, r.d]);
      break;
    case 'nuggets': {
      plates(px, rng, 5, r, [r.b, r.b, r.d]);
      // bevelled copper nuggets
      const c = { o: r.o, d: palCss('copper.dark'), b: palCss('copper.base'), h: palCss('copper.hi') };
      for (let i = 0; i < 5; i++) bevel(px, rng.int(1, T - 4), rng.int(1, T - 3), rng.next() < 0.5 ? 2 : 3, 2, c);
      break;
    }
    case 'strata': {
      // three horizontal strata, 4–6 px, offset in tone; 2–3 hairline veins
      let y = 0;
      const tones = [r.d, r.b, r.h, r.b];
      for (let s = 0; y < T; s++) {
        const h = rng.int(4, 6);
        for (let yy = y; yy < Math.min(T, y + h); yy++) for (let x = 0; x < T; x++) px(x, yy, yy === y ? r.o : tones[s % tones.length]);
        y += h;
      }
      for (let v = 0; v < 3; v++) {
        let x = rng.int(0, T - 1);
        for (let yy = rng.int(0, 4); yy < T; yy++) { px(x, yy, r.o); if (rng.next() < 0.4) x = (x + (rng.next() < 0.5 ? 1 : T - 1)) % T; if (rng.next() < 0.12) break; }
      }
      break;
    }
    case 'planks': {
      // three horizontal planks of 5 px with 1 px gaps, grain streaks, nail heads, a rope band
      for (let p = 0; p < 3; p++) {
        const y0 = p * 5 + (p > 0 ? p : 0) - (p === 2 ? 1 : 0);
        for (let y = y0; y < Math.min(T, y0 + 5); y++) for (let x = 0; x < T; x++)
          px(x, y, y === y0 + 4 ? r.o : y === y0 ? r.h : y === y0 + 3 ? r.d : r.b);
        for (let i = 0; i < 3; i++) { const x = rng.int(1, T - 6), y = y0 + rng.int(1, 2); for (let k = 0; k < 4; k++) px(x + k, y, r.d); }
        px(1, y0 + 1, r.h); px(T - 2, y0 + 1, r.h);
      }
      for (let y = 0; y < T; y++) { px(11, y, y % 2 ? r.h : r.d); px(12, y, y % 2 ? r.d : r.h); }
      break;
    }
    case 'facets': {
      // obsidian: three large glassy triangles, diagonal accent streaks, never noise
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const a = x + y < T - 1, b = x - y > 2;
        px(x, y, x + y === T - 1 || x - y === 3 ? r.o : a && b ? r.h : a ? r.b : r.d);
      }
      const acc = r.a ?? r.h;
      for (const [x, y] of [[3, 2], [9, 8], [12, 11]]) for (let k = 0; k < 4; k++) if (x + k < T && y - k >= 0) px(x + k, y - k, acc);
      break;
    }
    case 'cobble':
      // bedrock: dense, low contrast, no highlight, never glows
      plates(px, rng, 11, r, [r.b, r.d], false);
      break;
    case 'frame': {
      // a 2 px bevelled border and four rivets around a plate with vertical grain
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const inner = x >= 2 && y >= 2 && x < T - 2 && y < T - 2;
        if (!inner) px(x, y, x < 2 && y < T - 2 || y < 2 && x < T - 2 ? r.h : r.d);
        else px(x, y, x % 3 === 0 ? r.d : r.b);
      }
      for (let i = 0; i < T; i++) { px(i, 0, r.h); px(0, i, r.h); px(i, T - 1, r.o); px(T - 1, i, r.o); }
      for (const [x, y] of [[3, 3], [T - 4, 3], [3, T - 4], [T - 4, T - 4]]) { px(x, y, r.h); px(x + 1, y + 1, r.o); }
      // the obsidian frame holds one long crack of captive light
      if (r.a) { let x = 7; for (let y = 2; y < T - 2; y++) { px(x, y, r.a); if (rng.next() < 0.35) x += rng.next() < 0.5 ? -1 : 1; x = Math.max(4, Math.min(T - 5, x)); } }
      break;
    }
    case 'pedestal': {
      // big bevelled blocks with vertical grain (built)
      bevel(px, 0, 0, 8, T, r); bevel(px, 8, 0, 8, T, r);
      for (const x of [3, 5, 11, 13]) for (let y = 2; y < T - 2; y += 1) if (rng.next() < 0.7) px(x, y, r.d);
      for (let x = 0; x < T; x++) px(x, T - 1, r.o);
      break;
    }
    case 'seed': {
      // a breakthrough: round dark core, four bevelled branching cracks of ember, a white-hot heart
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        px(x, y, d > 7.4 ? r.o : d > 6.4 ? r.d : (x + y) < 12 ? r.h : r.b);
      }
      const ember = r.a ?? r.h, dusk = palCss('light.dusk');
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        let x = 7, y = 7;
        for (let k = 0; k < 6; k++) {
          x += k % 2 ? dx : 0; y += k % 2 ? 0 : dy;
          if (x < 1 || y < 1 || x > T - 2 || y > T - 2) break;
          px(x, y, ember); px(x + (dx > 0 ? 1 : -1), y, dusk);
        }
      }
      const core = palCss('light.core');
      px(7, 7, core); px(8, 7, core); px(7, 8, core); px(8, 8, core);
      break;
    }
  }
}

function paintGrassTop(g: CanvasRenderingContext2D, ox: number, oy: number, rng: Rng) {
  const r = rampOf(MATERIALS.find(m => m.key === 'grass')!);
  g.fillStyle = r.b; g.fillRect(ox, oy, T, T);
  const px: Px = (x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
  // 1×2 blade ticks in about 30 % of the 2×2 cells, horizontal grain of darker tufts
  for (let cy = 0; cy < T; cy += 2) for (let cx = 0; cx < T; cx += 2) {
    const u = rng.next();
    if (u < 0.3) { const x = cx + rng.int(0, 1); px(x, cy, r.h); px(x, cy + 1, r.b); }
    else if (u > 0.82) { px(cx, cy + 1, r.d); px(cx + 1, cy + 1, r.d); }
  }
}

/** Cracks of light (DECISIONS §6.3): each stroke is a 1 px outline edge plus a 1 px gold core. */
export function paintCracks(g: CanvasRenderingContext2D, ox: number, oy: number, stage: number, seed = 7) {
  const rng = new Rng(seed);
  const strokes = 2 + stage * 2, len = 3 + stage * 2;
  const coreAlpha = [0.35, 0.55, 0.8, 1][Math.min(3, stage)];
  const ink = palCss('ink.line'), gold = palCss('light.gold'), hot = palCss('light.hot');
  for (let s = 0; s < strokes; s++) {
    let x = rng.int(3, T - 4), y = rng.int(3, T - 4);
    for (let k = 0; k < len; k++) {
      g.globalAlpha = 0.9; g.fillStyle = ink; g.fillRect(ox + x + 1, oy + y + 1, 1, 1);
      g.globalAlpha = coreAlpha; g.fillStyle = stage >= 3 && k === 0 ? hot : gold; g.fillRect(ox + x, oy + y, 1, 1);
      x = Math.min(T - 2, Math.max(0, x + rng.int(-1, 1)));
      y = Math.min(T - 2, Math.max(0, y + rng.int(-1, 1)));
    }
  }
  g.globalAlpha = 1;
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

/** One material's tile on its own canvas (the gallery, the inventory). */
export function materialCanvas(matId: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  const g = c.getContext('2d')!;
  if (matId === MATERIALS.find(m => m.key === 'grass')!.id) paintGrassTop(g, 0, 0, new Rng(77));
  else paintTile(g, 0, 0, MATERIALS[matId], new Rng(1000 + matId));
  return c;
}

/** Texture for a single material (loose cubes and the block in your hand). */
export function materialTexture(matId: number): THREE.CanvasTexture {
  return pixelTexture(materialCanvas(matId));
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

/** Door leaves (DECISIONS §6.2): built wood with vertical grain in the crate ramp; brass for
 *  treasure, obsidian with a captive crack for the boss; a gold keyhole when locked (a key is an insight). */
const DOOR_RAMPS: Record<DoorLook, [PalToken, PalToken, PalToken, PalToken]> = {
  normal: ['mat.crate.outline', 'mat.crate.dark', 'mat.crate.base', 'mat.crate.hi'],
  treasure: ['ink.line', 'brass.dark', 'brass.base', 'brass.hi'],
  boss: ['mat.obsidian.outline', 'mat.obsidian.dark', 'mat.obsidian.base', 'mat.obsidian.hi'],
  locked: ['mat.crate.outline', 'mat.crate.dark', 'mat.crate.base', 'mat.crate.hi'],
};

/** A door leaf: 16 texels per block (3 × 3 blocks = 48 px), vertical boards, iron bands, rivets. */
export function doorTexture(look: DoorLook): THREE.CanvasTexture {
  const S = 48;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;
  const [o, d, b, h] = DOOR_RAMPS[look].map(palCss);
  const rng = new Rng(55);
  const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  // vertical boards 6 px wide, bevelled, with grain
  for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) {
    const bx = x % 6;
    px(x, y, bx === 5 ? o : bx === 0 ? h : bx === 4 ? d : b);
  }
  for (let i = 0; i < 40; i++) { const x = rng.int(0, S - 1), y = rng.int(0, S - 5); if (x % 6 > 0 && x % 6 < 4) for (let k = 0; k < 4; k++) px(x, y + k, d); }
  // two iron bands with rivets
  const [io, id, ib, ih] = (['ink.line', 'iron.dark', 'iron.base', 'iron.hi'] as PalToken[]).map(palCss);
  for (const y0 of [8, 36]) {
    for (let x = 0; x < S; x++) { px(x, y0, ih); px(x, y0 + 1, ib); px(x, y0 + 2, ib); px(x, y0 + 3, id); px(x, y0 + 4, io); }
    for (let x = 3; x < S; x += 8) { px(x, y0 + 1, ih); px(x + 1, y0 + 2, io); }
  }
  for (let i = 0; i < S; i++) { px(i, 0, o); px(0, i, o); px(i, S - 1, o); px(S - 1, i, o); }
  if (look === 'boss') {
    // one long crack of captive light down the middle (never a skull: bone is gore-adjacent)
    const ember = palCss('captive.ember');
    let x = 24;
    for (let y = 2; y < S - 2; y++) { px(x, y, ember); if (rng.next() < 0.3) x += rng.next() < 0.5 ? -1 : 1; }
  }
  if (look === 'treasure') {
    // a hollow diamond: the treasure mark of the minimap
    const gold = palCss('brass.hi');
    for (let k = 0; k < 6; k++) { px(24 - k, 18 + k, gold); px(24 + k, 18 + k, gold); px(24 - k, 30 - k, gold); px(24 + k, 30 - k, gold); }
  }
  if (look === 'locked') {
    const gold = palCss('light.gold');
    for (let y = 18; y < 30; y++) for (let x = 19; x < 29; x++) px(x, y, (x === 19 || y === 18) ? ih : (x === 28 || y === 29) ? id : ib);
    for (let y = 13; y < 18; y++) { px(21, y, ih); px(26, y, id); }
    for (let x = 21; x < 27; x++) px(x, 13, ih);
    px(23, 22, gold); px(24, 22, gold); px(23, 23, gold); px(24, 23, gold); px(23, 24, gold); px(24, 24, gold); px(24, 25, gold);
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

