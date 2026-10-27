// Pixel-art texture atlas generated at runtime: original art, zero image files.
// The texture grammar of docs/art/DECISIONS.md §6.1: every tile is a 4-value ramp (outline, dark,
// base, hi) drawn as shapes, never noise; every shape is bevelled with light from the top-left;
// features are ≥ 2 px; mortar and gaps are the outline. Cracks are cracks of light (§6.3).

import * as THREE from 'three';
import { MATERIALS, type MaterialDef } from '../content/materials';
import { palCss, type PalToken } from '../content/palette';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, TILE_CRACK0, TILE_GRASS_TOP, TILE_LOG_TOP, TILE_PX } from '../content/tiles';
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

const wrap = (px: Px): Px => (x, y, c) => px(((x % T) + T) % T, ((y % T) + T) % T, c);

type Blob = [number, number, number, number];

function blobOwner(list: Blob[]) {
  const grid = new Int8Array(T * T).fill(-1);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let best = -1, bd = 1;
    list.forEach(([cx, cy, rx, ry], i) => {
      const dx = Math.min(Math.abs(x - cx), T - Math.abs(x - cx)), dy = Math.min(Math.abs(y - cy), T - Math.abs(y - cy));
      const d = (dx / rx) ** 2 + (dy / ry) ** 2;
      if (d <= bd) { bd = d; best = i; }
    });
    grid[y * T + x] = best;
  }
  return (x: number, y: number) => grid[(((y % T) + T) % T) * T + (((x % T) + T) % T)];
}

function paintBlobs(px: Px, list: Blob[], fill: (i: number) => string, r: Ramp, gap: string, shadow: string, leftLit = true) {
  const own = blobOwner(list);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const i = own(x, y);
    if (i < 0) { px(x, y, own(x - 1, y - 1) >= 0 || own(x, y - 1) >= 0 ? shadow : gap); continue; }
    if (own(x, y - 1) !== i || (leftLit && own(x - 1, y) !== i)) px(x, y, r.h);
    else if (own(x, y + 1) !== i || own(x + 1, y) !== i) px(x, y, r.d);
    else px(x, y, fill(i));
  }
}

const DIRT_CLODS: Blob[] = [
  [3, 3, 2.6, 2.2], [10.5, 1.5, 2.3, 1.9], [7, 8, 3, 2.4], [14, 8.5, 2.1, 2], [2.5, 12.5, 2.2, 1.9], [11.5, 13.5, 2.8, 2.1], [6.5, 15, 1.6, 1.4],
];

function paintDirt(px: Px, r: Ramp) {
  const w = wrap(px);
  paintBlobs(w, DIRT_CLODS, () => r.b, r, r.b, r.d, false);
  for (const [x, y] of [[13, 4], [0, 7], [10, 10], [5, 0]]) w(x, y, r.d);
  const pebble = r.a ?? r.h;
  for (const [x, y] of [[4, 6], [12, 11]]) { w(x, y, pebble); w(x + 1, y, pebble); w(x, y + 1, r.o); w(x + 1, y + 1, r.o); }
}

const LEAF_CLUSTERS: Blob[] = [
  [2, 2, 2.4, 1.6], [7, 1, 2.2, 1.5], [12, 2.5, 2.6, 1.6], [4.5, 5.5, 2.4, 1.5], [10, 6, 2.5, 1.6],
  [15, 7.5, 2, 1.5], [1.5, 9, 2.2, 1.6], [7, 9.5, 2.6, 1.6], [12.5, 11, 2.4, 1.5], [3.5, 13, 2.6, 1.6],
  [9, 13.5, 2.2, 1.5], [14.5, 15, 2.2, 1.4],
];

function paintLeaves(px: Px, r: Ramp) {
  const w = wrap(px);
  paintBlobs(w, LEAF_CLUSTERS, i => (i % 4 === 2 ? r.d : r.b), r, r.d, r.o);
}

function paintCrate(px: Px, r: Ramp, nail: string) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const edge = Math.min(x, y, T - 1 - x, T - 1 - y);
    if (edge < 2) {
      const far = x === T - 1 || y === T - 1 ? 2 : x === T - 2 || y === T - 2 ? 1 : 0;
      const near = x === 0 || y === 0 ? 2 : x === 1 || y === 1 ? 1 : 0;
      const corner = (x < 2 || x > T - 3) && (y < 2 || y > T - 3);
      if (corner && ((x < 2) !== (y < 2))) px(x, y, r.b);
      else if (far === 2) px(x, y, r.d);
      else if (near === 2) px(x, y, r.h);
      else px(x, y, r.b);
      continue;
    }
    if (y === 2) { px(x, y, r.o); continue; }
    const k = (y - 3) % 4;
    if (k === 3) { px(x, y, r.o); continue; }
    if (x === 2) { px(x, y, r.d); continue; }
    px(x, y, k === 0 ? r.h : k === 1 ? r.b : r.d);
  }
  for (let x = 4; x < 8; x++) px(x, 1, r.d);
  for (let x = 9; x < 12; x++) px(x, T - 2, r.d);
  for (let y = 6; y < 10; y++) px(1, y, r.d);
  for (let y = 3; y < 6; y++) px(T - 2, y, r.d);
  const grain: [number, number, number][] = [[4, 4, 4], [10, 4, 2], [3, 8, 2], [11, 8, 2], [6, 12, 5]];
  for (const [x, y, l] of grain) for (let k = 0; k < l; k++) px(x + k, y, r.d);
  px(8, 7, r.d); px(7, 8, r.d); px(8, 8, r.o); px(9, 8, r.d); px(8, 9, r.d);
  for (const y of [4, 8, 12]) { px(1, y, nail); px(1, y + 1, r.o); px(T - 2, y, nail); px(T - 2, y + 1, r.o); }
}

const BARK_CREVICES: [number, number, number][] = [[0, 1, 0], [5, 2, 2.1], [10, 1, 4.2]];
const BARK_SPLITS: [number, number][] = [[2, 4], [7, 11], [12, 14], [3, 13], [8, 2]];

function paintBark(px: Px, r: Ramp, moss: string | undefined) {
  const w = wrap(px);
  for (let y = 0; y < T; y++) {
    const cs = BARK_CREVICES.map(([x0, k, ph]) => x0 + Math.round(Math.sin((y / T) * Math.PI * 2 * k + ph) * 0.9));
    for (let x = 0; x < T; x++) {
      const rel = cs.map(c => (x - c + T) % T);
      const d = Math.min(...rel);
      const next = Math.min(...cs.map(c => (c - x + T) % T));
      w(x, y, d === 0 ? r.o : d === 1 ? r.b : d === 2 && next > 2 ? r.b : r.d);
    }
  }
  for (const [x, y] of BARK_SPLITS) { w(x, y, r.o); w(x + 1, y, r.o); w(x, y + 1, r.b); w(x + 1, y + 1, r.b); }
  for (const [x, y] of [[2, 9], [7, 5], [12, 8], [7, 14]]) { w(x, y, r.h); w(x, y + 1, r.h); }
  if (moss) for (const [x, y] of [[0, 12], [1, 13], [0, 14], [10, 3], [11, 4]]) w(x, y, moss);
}

function paintLogTop(px: Px, r: Ramp) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.8);
    const d = (dx ** 3 + dy ** 3) ** (1 / 3) + 0.35 * Math.sin(Math.atan2(y - 7.8, x - 7.5) * 3 + 0.6);
    const edge = Math.min(x, y, T - 1 - x, T - 1 - y);
    if (edge === 0) { px(x, y, x === T - 1 || y === T - 1 ? r.o : r.d); continue; }
    if (edge === 1) { px(x, y, x === T - 2 || y === T - 2 ? r.d : r.b); continue; }
    if (d < 1) { px(x, y, r.d); continue; }
    const ring = Math.floor((d - 1) / 2);
    const line = (d - 1) % 2 >= 1.25;
    px(x, y, line ? r.d : ring % 2 ? r.b : r.h);
  }
  for (const [x, y] of [[9, 6], [10, 5], [11, 4], [12, 3], [12, 2]]) { px(x, y, r.o); px(x - 1, y, r.d); }
}

function paintDeepstone(px: Px, r: Ramp, rng: Rng) {
  const bands: [number, number, string, string][] = [[0, 5, r.b, r.h], [5, 6, r.d, r.b], [11, 5, r.b, r.h]];
  for (const [y0, h, fill, lit] of bands) for (let y = y0; y < y0 + h; y++) for (let x = 0; x < T; x++) {
    const k = y - y0;
    px(x, y, k === 0 ? r.o : k === 1 && (x + y0) % 7 < 5 ? lit : k === h - 1 && fill === r.b ? r.d : fill);
  }
  const w = wrap(px);
  for (const [x0, y, l] of [[3, 8, 4], [11, 13, 3], [12, 3, 3]] as [number, number, number][]) {
    for (let k = 0; k < l; k++) { w(x0 + k, y, r.h); w(x0 + k, y + 1, r.d); }
    w(x0 - 1, y, r.o); w(x0 - 1, y + 1, r.o); w(x0 + l, y + 1, r.o);
  }
  for (let v = 0; v < 2; v++) {
    let x = rng.int(0, T - 1);
    for (let yy = rng.int(1, 4); yy < T; yy++) { w(x, yy, r.o); if (rng.next() < 0.4) x += rng.next() < 0.5 ? 1 : -1; if (rng.next() < 0.15) break; }
  }
}

const ASHLAR: [number, number, number, number][] = [[0, 0, 16, 7], [0, 7, 7, 9], [7, 7, 9, 9]];

function paintFrame(px: Px, r: Ramp, rng: Rng) {
  for (const [x0, y0, w, h] of ASHLAR) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const lx = x - x0, ly = y - y0;
    if (lx === w - 1 || ly === h - 1) px(x, y, r.o);
    else if (ly === 0 || lx === 0) px(x, y, ly === 0 && lx === w - 2 ? r.b : r.h);
    else if (lx === w - 2 || ly === h - 2) px(x, y, r.d);
    else px(x, y, r.b);
  }
  if (r.a) { let x = 8; for (let y = 1; y < T - 1; y++) { px(x, y, r.a); if (rng.next() < 0.35) x += rng.next() < 0.5 ? -1 : 1; x = Math.max(4, Math.min(T - 5, x)); } }
}

function paintSeed(px: Px, r: Ramp) {
  const ember = r.a ?? r.h, dusk = palCss('light.dusk'), hot = palCss('light.hot'), core = palCss('light.core');
  const inside = (x: number, y: number) => {
    const dy = y - 8.6, ry = 6.6, top = dy < 0 ? 1 + dy / ry * 0.4 : 1;
    const rx = 5.6 * top;
    return (x - 7.5) ** 2 / (rx * rx) + dy * dy / (ry * ry) <= 1;
  };
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (!inside(x, y)) { px(x, y, r.d); continue; }
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) { px(x, y, r.o); continue; }
    const nx = (x - 7.5) / 5.6, ny = (y - 8.6) / 6.6;
    const lit = -0.6 * nx - 0.8 * ny;
    px(x, y, lit > 0.45 ? r.h : lit < -0.4 ? r.d : r.b);
  }
  const seam = [8, 8, 7, 7, 7, 8, 8, 8, 7, 7, 8];
  seam.forEach((x, k) => { const y = 3 + k; px(x, y, ember); px(x + 1, y, dusk); });
  for (const [x, y] of [[9, 6], [10, 5], [6, 11], [5, 12]]) px(x, y, ember);
  for (const [x, y] of [[7, 7], [8, 8], [7, 9]]) px(x, y, hot);
  px(7, 8, core); px(8, 9, core);
}

function paintTile(g: CanvasRenderingContext2D, ox: number, oy: number, m: MaterialDef, rng: Rng) {
  const r = rampOf(m);
  const px: Px = (x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
  g.fillStyle = r.b; g.fillRect(ox, oy, T, T);
  switch (m.pattern) {
    case 'clumps':
      paintDirt(px, r);
      break;
    case 'leaves':
      paintLeaves(px, r);
      break;
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
    case 'strata':
      paintDeepstone(px, r, rng);
      break;
    case 'planks':
      paintCrate(px, r, r.a ?? r.h);
      break;
    case 'bark':
      paintBark(px, r, r.a);
      break;
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
    case 'frame':
      paintFrame(px, r, rng);
      break;
    case 'pedestal': {
      // big bevelled blocks with vertical grain (built)
      bevel(px, 0, 0, 8, T, r); bevel(px, 8, 0, 8, T, r);
      for (const x of [3, 5, 11, 13]) for (let y = 2; y < T - 2; y += 1) if (rng.next() < 0.7) px(x, y, r.d);
      for (let x = 0; x < T; x++) px(x, T - 1, r.o);
      break;
    }
    case 'chest':
    case 'chestopen': {
      // a banded wooden chest: bevelled planks, two brass straps, a brass lock plate with a keyhole;
      // open, the lid seam gapes onto a dark inside with one glint of gold
      const brass = { o: r.o, d: palCss('brass.dark'), b: palCss('brass.base'), h: palCss('brass.hi') };
      bevel(px, 0, 0, T, T, r);
      for (const x of [6, 9]) for (let y = 2; y < T - 2; y++) px(x, y, r.d);
      bevel(px, 1, 0, 3, T, brass); bevel(px, 12, 0, 3, T, brass);
      if (m.pattern === 'chest') {
        for (let x = 4; x < 12; x++) { px(x, 6, r.o); px(x, 7, r.h); }
        bevel(px, 6, 5, 4, 6, brass);
        px(7, 7, r.o); px(8, 7, r.o); px(7, 8, r.o); px(8, 8, r.o); px(7, 9, r.o);
      } else {
        const inside = palCss('ink.void');
        for (let y = 3; y < 12; y++) for (let x = 4; x < 12; x++) px(x, y, inside);
        for (let x = 4; x < 12; x++) { px(x, 2, r.h); px(x, 12, r.d); }
        px(7, 8, palCss('light.gold')); px(8, 8, palCss('light.gold')); px(8, 9, palCss('light.gold'));
      }
      break;
    }
    case 'seed':
      paintSeed(px, r);
      break;
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
  paintLogTopTile(g, ...at(TILE_LOG_TOP));
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

export function logTopCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  paintLogTopTile(c.getContext('2d')!, 0, 0);
  return c;
}

function paintLogTopTile(g: CanvasRenderingContext2D, ox: number, oy: number) {
  const r = rampOf(MATERIALS.find(m => m.key === 'log')!);
  paintLogTop((x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); }, r);
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
  const joints = [30, 14, 40, 22, 6, 34];
  for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) {
    const bx = x % 8, j = joints[Math.floor(x / 8)];
    px(x, y, bx === 7 ? o : y === j ? o : y === j + 1 && bx < 7 ? h : bx === 0 ? h : bx === 6 ? d : b);
  }
  for (let k = 0; k < 6; k++) {
    const x0 = k * 8;
    const g1 = 2 + (k * 5) % 3, g2 = 4 + (k * 3) % 2;
    for (let y = (k * 11) % 13; y < S; y += 17) for (let t = 0; t < 9 && y + t < S; t++) px(x0 + g1, y + t, d);
    for (let y = (k * 7 + 5) % 15; y < S; y += 21) for (let t = 0; t < 6 && y + t < S; t++) px(x0 + g2, y + t, d);
    if (k % 2 === 0) { const ky = 18 + k * 3; px(x0 + 3, ky, d); px(x0 + 4, ky, d); px(x0 + 2, ky + 1, d); px(x0 + 3, ky + 1, o); px(x0 + 4, ky + 1, o); px(x0 + 5, ky + 1, d); px(x0 + 3, ky + 2, d); px(x0 + 4, ky + 2, d); }
  }
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

