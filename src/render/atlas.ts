// Pixel-art texture atlas generated at runtime: original art, zero image files.
// The texture grammar of docs/art/DECISIONS.md §6.1: every tile is a 4-value ramp (outline, dark,
// base, hi) drawn as shapes, never noise; every shape is bevelled with light from the top-left;
// features are ≥ 2 px; mortar and gaps are the outline. Cracks are cracks of light (§6.3).

import * as THREE from 'three';
import { MATERIALS, type MaterialDef } from '../content/materials';
import { palCss, type PalToken } from '../content/palette';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, TILE_BAMBOO_TOP, TILE_CRACK0, TILE_GRASS_TOP, TILE_LOG_TOP, TILE_PX, TILE_SKYWOOD_TOP } from '../content/tiles';
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

/** Leaves; `young` mirrors the clusters (so a patch of young leaves never repeats the old ones) and
 *  keeps only one cluster in six in shade: new growth is open to the light. */
function paintLeaves(px: Px, r: Ramp, young = false) {
  const w = wrap(px);
  const list: Blob[] = young ? LEAF_CLUSTERS.map(([x, y, rx, ry]) => [T - 1 - x, y, rx, ry]) : LEAF_CLUSTERS;
  paintBlobs(w, list, i => ((young ? i % 6 === 3 : i % 4 === 2) ? r.d : r.b), r, r.d, r.o);
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

const ROOT_CREVICES: [number, number][] = [[1, 0.4], [6, 2.5], [11, 4.6]];
const ROOT_SPLITS: [number, number][] = [[3, 3], [8, 9], [13, 14]];

/** Root bark (the foot of the trunk): three wide crevices that twist as they climb, so the ridges
 *  between them read as gnarled and thick; a lit lip on each ridge, two tufts of moss in the damp. */
function paintRootBark(px: Px, r: Ramp, moss: string | undefined) {
  const w = wrap(px);
  for (let y = 0; y < T; y++) {
    const cs = ROOT_CREVICES.map(([x0, ph]) => x0 + Math.round(Math.sin((y / T) * Math.PI * 2 + ph) * 2 + Math.sin((y / T) * Math.PI * 4 + ph * 1.7) * 0.8));
    for (let x = 0; x < T; x++) {
      const d = Math.min(...cs.map(c => (x - c + T) % T));
      const next = Math.min(...cs.map(c => (c - x + T) % T));
      w(x, y, d === 0 || next === 1 ? r.o : d === 1 ? r.h : next === 2 ? r.d : r.b);
    }
  }
  for (const [x, y] of ROOT_SPLITS) { w(x, y, r.o); w(x + 1, y, r.o); w(x, y + 1, r.d); w(x + 1, y + 1, r.d); }
  for (const [x, y] of [[4, 6], [9, 12]]) { w(x, y, r.h); w(x, y + 1, r.h); }
  if (moss) for (const [x, y] of [[2, 12], [8, 1]]) { w(x, y, moss); w(x + 1, y, moss); w(x, y + 1, moss); w(x + 1, y + 1, moss); }
}

/** Old bark's two deep furrows: [x0, phase]. */
const OLD_FURROWS: [number, number][] = [[2, 0.3], [10, 1.5]];
/** Short checks across a ridge: [x, y, length]; each stops short of the next furrow. */
const OLD_CHECKS: [number, number, number][] = [[5, 4, 3], [12, 12, 3], [4, 13, 2]];

/** Old bark (high on the trunk): two deep furrows that wander, and between them wide, flat, weathered
 *  ridges; one furrow forks off and dies out, a few short checks cross a ridge without closing it,
 *  so it never reads as boards, bricks or scales; pale lichen in two patches. */
function paintPlateBark(px: Px, r: Ramp, lichen: string | undefined) {
  const w = wrap(px);
  for (let y = 0; y < T; y++) {
    const cs = OLD_FURROWS.map(([x0, ph]) => x0 + Math.round(Math.sin((y / T) * Math.PI * 2 + ph) * 1.2));
    for (let x = 0; x < T; x++) {
      const d = Math.min(...cs.map(c => (x - c + T) % T));
      const next = Math.min(...cs.map(c => (c - x + T) % T));
      w(x, y, d === 0 || next === 1 ? r.o : d === 1 ? r.d : d === 2 ? r.h : next === 2 ? r.d : r.b);
    }
  }
  // the fork: a furrow that leaves the first one and dies out across the ridge
  for (const [x, y] of [[5, 7], [6, 8], [6, 9], [7, 10]]) { w(x, y, r.o); w(x + 1, y, r.h); }
  // a fibre on each ridge: a short shaded line, never full height
  for (let y = 1; y < 5; y++) w(7, y, r.d);
  for (let y = 9; y < 14; y++) w(14, y, r.d);
  for (const [x, y, l] of OLD_CHECKS) for (let k = 0; k < l; k++) { w(x + k, y, r.o); w(x + k, y + 1, r.h); }
  if (lichen) for (const [x, y] of [[4, 10], [12, 2]]) { w(x, y, lichen); w(x + 1, y, lichen); w(x, y + 1, lichen); w(x + 1, y + 1, lichen); }
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

const EARTH_COURSES: [number, number][] = [[0, 0.6], [6, 2.4], [11, 4.4]];
const EARTH_CRACKS: [number, number, number][] = [[5, 1, 3], [12, 2, 2], [9, 7, 3], [1, 8, 2], [4, 12, 3], [14, 13, 2]];
const EARTH_STONES: [number, number, boolean][] = [[10, 3, true], [2, 9, false], [12, 13, false]];
const EARTH_PORES: [number, number][] = [[7, 4], [14, 9], [6, 14]];

function paintEarth(px: Px, r: Ramp) {
  const w = wrap(px);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) w(x, y, r.b);
  for (const [y0, ph] of EARTH_COURSES) for (let x = 0; x < T; x++) {
    const y = y0 + Math.round(Math.sin((x / T) * Math.PI * 2 + ph) * 0.8);
    w(x, y, r.d);
    if (Math.sin((x / T) * Math.PI * 4 + ph * 2) > -0.3) w(x, y + 1, r.h);
  }
  for (const [x, y0, l] of EARTH_CRACKS) for (let k = 0; k < l; k++) w(x + (k === l - 1 ? 1 : 0), y0 + k, r.d);
  const pale = r.a ?? r.h;
  for (const [x, y, light] of EARTH_STONES) { w(x, y, light ? pale : r.h); w(x + 1, y, r.h); w(x, y + 1, r.d); w(x + 1, y + 1, r.d); w(x + 1, y + 2, r.o); w(x, y + 2, r.d); }
  for (const [x, y] of EARTH_PORES) w(x, y, r.o);
}

function paintRubble(px: Px, r: Ramp, rng: Rng) {
  const seeds = [[2, 2], [9, 1], [14, 4], [5, 7], [11, 8], [1, 11], [7, 13], [13, 13]].map(([x, y]) => [x + rng.int(0, 1), y + rng.int(0, 1)]);
  const tones = seeds.map((_, i) => (i % 3 === 1 ? r.d : i % 4 === 2 ? r.h : r.b));
  const owner = (x: number, y: number) => {
    x = ((x % T) + T) % T; y = ((y % T) + T) % T;
    let best = 0, bd = Infinity;
    seeds.forEach(([sx, sy], i) => {
      const dx = Math.min(Math.abs(x - sx), T - Math.abs(x - sx)), dy = Math.min(Math.abs(y - sy), T - Math.abs(y - sy));
      const d = dx * dx + dy * dy * 1.3;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const p = owner(x, y);
    if (owner(x + 1, y) !== p || owner(x, y + 1) !== p) px(x, y, r.o);
    else if (owner(x - 1, y) !== p || owner(x, y - 1) !== p) px(x, y, tones[p] === r.h ? r.h : tones[p] === r.d ? r.b : r.h);
    else if (owner(x + 2, y) !== p || owner(x, y + 2) !== p) px(x, y, r.d);
    else px(x, y, tones[p]);
  }
}

const ASHLAR_COURSES: [number, number, number[]][] = [[0, 8, [0, 10]], [8, 8, [5, 13]]];

function paintAshlar(px: Px, r: Ramp) {
  const w = wrap(px);
  for (const [y0, h, joints] of ASHLAR_COURSES) for (let y = y0; y < y0 + h; y++) for (let x = 0; x < T; x++) {
    const ly = y - y0;
    const lx = Math.min(...joints.map(j => (x - j + T) % T));
    const toJoint = Math.min(...joints.map(j => (j - 1 - x + 2 * T) % T));
    if (ly === h - 1 || toJoint === 0) w(x, y, r.o);
    else if (ly === 0 || lx === 0) w(x, y, r.h);
    else if (ly === h - 2 || toJoint === 1) w(x, y, r.d);
    else w(x, y, r.b);
  }
  for (const [x, y] of [[4, 3], [12, 11], [8, 12]]) { w(x, y, r.d); }
}

const SLATE_ROWS: [number, number[]][] = [[3, [0, 6, 11]], [2, [3, 9, 14]], [4, [1, 7, 12]], [3, [4, 10]], [4, [2, 8, 13]]];

function paintSlate(px: Px, r: Ramp) {
  const w = wrap(px);
  let y0 = 0;
  SLATE_ROWS.forEach(([h, joints], row) => {
    for (let y = y0; y < y0 + h; y++) for (let x = 0; x < T; x++) {
      const ly = y - y0;
      const toJoint = Math.min(...joints.map(j => (j - x + T) % T));
      const fromJoint = Math.min(...joints.map(j => (x - j - 1 + T) % T));
      const shade = (joints.findIndex(j => j > x) + row) % 3 === 0 ? r.d : r.b;
      if (ly === h - 1 || toJoint === 0) w(x, y, r.o);
      else if (ly === 0 && h > 2) w(x, y, fromJoint < 2 ? r.b : r.h);
      else w(x, y, shade);
    }
    y0 += h;
  });
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

// ───────────────────────── the sky's matter (docs/art/sky/blocks.md) ─────────────────────────
// Pale, soft, never emissive; light from the top-left like every tile. Found matter lies horizontal
// (cloud, mist, fence rails), what grows rises (heartwood figure, bamboo culms).

/** Seamless distance on the tile's torus. */
const tor = (d: number) => { const m = ((d % T) + T) % T; return m > T / 2 ? m - T : m; };

/** Cloud: two banks of billows lying flat, each billow a soft dome lit on its crest, the bank behind
 *  showing in shade between the domes. No outline anywhere: a cloud has no hard edge (never cobble). */
function paintCloud(px: Px, r: Ramp) {
  // bank 0 (rows 0–7) and bank 1 (rows 8–15); domes 8 px wide, the lower bank shifted by 4 and a row
  const banks: [number, number[]][] = [[0, [2.6, 3.2]], [4, [3.4, 2.4]]];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const bank = y >> 3, ly = y & 7, [off, heights] = banks[bank];
    const k = Math.floor(((x + off) % T) / 8), bx = ((x + off) % 8) - 3.5;
    const crest = Math.round(3.6 - heights[k] * Math.sqrt(Math.max(0, 1 - (bx / 4.4) ** 2)));
    let c: string;
    if (ly < crest) c = ly === crest - 1 && Math.abs(bx) < 3 ? r.d : r.b;  // the bank behind, in its shade
    else if (ly === crest) c = r.h;
    else if (ly === crest + 1) c = bx < 1.5 ? r.h : r.b;
    else if (ly === 7) c = Math.abs(bx) > 2.5 ? r.d : r.b;                  // the flat underside
    else c = r.b;
    px(x, y, c);
  }
}

/** Mist: long thin wisps lying flat, low contrast, no outline: a step that is barely there. */
function paintMist(px: Px, r: Ramp) {
  const w = wrap(px);
  const wisps: [number, number, number][] = [[1, 0.4, 1], [5, 2.1, 2], [9, 4.0, 1], [13, 5.3, 2]];
  for (const [y0, ph, k] of wisps) for (let x = 0; x < T; x++) {
    const y = y0 + Math.round(Math.sin((x / T) * Math.PI * 2 * k + ph) * 1.1);
    if (Math.sin((x / T) * Math.PI * 2 + ph * 3) > -0.45) w(x, y, r.h);
    if (Math.sin((x / T) * Math.PI * 4 + ph) > 0.35) w(x, y + 1, r.d);
  }
}

/** Heartwood: dense polished figure, grain lines rising and parting around one knot (never boards). */
function paintHeartwood(px: Px, r: Ramp) {
  const kx = 8, ky = 8.5;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = tor(x - kx), dy = y - ky;
    const push = 2.6 * Math.sign(dx || 1) * Math.exp(-(dx * dx * 0.7 + dy * dy * 0.35) / 6);
    const u = x - push + Math.sin((y / T) * Math.PI * 2 + 0.7) * 1.2 + Math.sin((y / T) * Math.PI * 4 + x * 0.4) * 0.4;
    const s = ((u % 4) + 4) % 4, band = Math.floor(u / 4);
    px(x, y, s < 0.95 ? r.d : s < 1.9 && band % 2 === 0 && Math.sin((y / T) * Math.PI * 2 + band) > -0.2 ? r.h : r.b);
  }
  // a small knot: the grain parts around it; small, so a wall of heartwood is not a grid of dots
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const e = ((x - kx + 0.5) / 1.5) ** 2 + ((y - ky) / 2) ** 2;
    if (e < 0.35) px(x, y, r.o);
    else if (e < 1) px(x, y, r.d);
    else if (e < 1.6 && x < kx && y < ky) px(x, y, r.h);
  }
}

/** Sky wood (branches): smooth pale bark in long rising plates (never the trunk's deep crevices), a few
 *  short lenticels across them, and one branch eye where a twig once was. */
function paintBranch(px: Px, r: Ramp) {
  const w = wrap(px);
  // four shallow fissures that wander and break off, each with a lit ridge on its left
  const seams: [number, number, number][] = [[1, 1.3, 1], [5, 0.2, 2], [9, 2.4, 1], [13, 4.1, 2]];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) w(x, y, r.b);
  seams.forEach(([x0, ph, k], i) => {
    for (let y = 0; y < T; y++) {
      if (Math.sin((y / T) * Math.PI * 2 + ph * 2 + i) < -0.55) continue;
      const x = x0 + Math.round(Math.sin((y / T) * Math.PI * 2 * k + ph) * 0.9);
      w(x, y, r.d); w(x - 1, y, r.h);
    }
  });
  // lenticels: short dark dashes lying across the bark (the mark of a branch, never of a trunk)
  for (const [x, y, l] of [[2, 3, 3], [10, 6, 4], [5, 10, 3], [12, 13, 3], [0, 15, 2]] as [number, number, number][]) {
    for (let k = 0; k < l; k++) w(x + k, y, r.o);
  }
  const eye: [number, number, string][] = [[7, 13, r.h], [8, 13, r.d], [6, 14, r.h], [7, 14, r.o], [8, 14, r.o], [9, 14, r.d], [7, 15, r.d], [8, 15, r.d]];
  for (const [x, y, c] of eye) w(x, y, c);
}

const SKY_LEAVES: [number, number, number, number][] = [
  [3.5, 3, 4.6, -1.0], [11, 3.5, 4.4, 0.35], [7.5, 9, 4.8, 1.15], [14, 10.5, 4.2, -0.4], [2.5, 12.5, 4.4, 0.6], [10, 15, 4.4, -1.25],
];

/** Sky leaf: long pointed leaves lying every which way, each with a midrib and a lit upper edge,
 *  dark shade between them (never a scale pattern: no two neighbours point the same way). */
function paintSkyleaf(px: Px, r: Ramp) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let c = (x * 3 + y) % 7 === 0 ? r.d : r.o;
    for (let i = SKY_LEAVES.length - 1; i >= 0; i--) {
      const [cx, cy, len, a] = SKY_LEAVES[i];
      const dx = tor(x - cx), dy = tor(y - cy);
      const u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(u) >= len) continue;
      const half = 2.1 * (1 - (u / len) ** 2);
      if (Math.abs(v) > half) continue;
      c = Math.abs(v) < 0.45 && Math.abs(u) < len - 1.2 ? r.d : Math.abs(v) > half - 0.9 ? (v < 0 ? r.h : r.d) : v < 0 ? r.b : i % 2 ? r.b : r.d;
      break;
    }
    px(x, y, c);
  }
}

/** Bamboo: two culms side by side, rounded by a lit left edge, each ringed by one node at its own height. */
function paintBamboo(px: Px, r: Ramp) {
  const w = wrap(px);
  const nodes = [5, 12];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const k = x >> 3, lx = x & 7, n = nodes[k];
    if (y === n) w(x, y, lx === 0 ? r.d : r.o);
    else if (y === n + 1) w(x, y, lx === 0 ? r.d : r.h);
    else w(x, y, lx === 0 ? r.o : lx === 1 ? r.h : lx === 6 ? r.d : lx === 7 ? r.o : r.b);
  }
  // a sheath leaf off the first culm's node, and a long gloss streak down each culm
  for (const [x, y] of [[7, 4], [8, 3], [9, 3], [10, 2]]) w(x, y, r.d);
  for (let y = 8; y < 15; y++) w(3, y, r.h);
  for (let y = 1; y < 8; y++) w(11, y, r.h);
}

/** Bamboo end: four open culms, each a ring of wall around its hollow. */
function paintBambooTop(px: Px, r: Ramp) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const cx = x < 8 ? 3.5 : 11.5, cy = y < 8 ? 3.5 : 11.5;
    const d = Math.hypot(x - cx, y - cy);
    px(x, y, d > 3.9 ? r.o : d > 3 ? (x < cx || y < cy ? r.h : r.d) : d > 1.6 ? r.b : r.o);
  }
}

/** Moss: a dense, uneven cushion of tufts of every size, lit on top, sunk in shade between. */
// one tuft, 4 × 4: a little dome lit on top-left, shaded under; '.' leaves what is beneath
const MOSS_TUFT = ['.hh.', 'hbbd', '.dd.', '.oo.'];

function paintMoss(px: Px, r: Ramp) {
  const w = wrap(px);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) w(x, y, (x + 2 * y) % 5 === 0 ? r.o : r.d);
  for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
    const i = gy * 4 + gx, ox = gx * 4 + (gy % 2) * 2 + ((i * 5) % 3) - 1, oy = gy * 4 + ((i * 3) % 2);
    const shade = i % 5 === 2;
    MOSS_TUFT.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (ch === '.') return;
      const c = ch === 'h' ? (shade ? r.b : r.h) : ch === 'b' ? (shade ? r.d : r.b) : ch === 'd' ? r.d : r.o;
      w(ox + dx, oy + dy, c);
    }));
  }
}

/** Fence wood: three weathered rails laid flat (the door leaf's boards turned on their side): a lit top
 *  edge, an outline gap, long grain lines, one butt joint and one peg, a knot on the top rail. */
const FENCE_RAILS: [number, number][] = [[0, 5], [5, 5], [10, 6]];

function paintFence(px: Px, r: Ramp) {
  const w = wrap(px);
  for (const [y0, h] of FENCE_RAILS) for (let y = y0; y < y0 + h; y++) for (let x = 0; x < T; x++) {
    const ly = y - y0;
    w(x, y, ly === h - 1 ? r.o : ly === 0 ? r.h : ly === h - 2 ? r.d : r.b);
  }
  // long grain, 6–11 px, each on its own rail row
  const grain: [number, number, number][] = [[1, 2, 9], [12, 1, 3], [4, 7, 11], [0, 12, 6], [9, 13, 6], [13, 7, 2]];
  for (const [x, y, l] of grain) for (let k = 0; k < l; k++) w(x + k, y, r.d);
  // the middle rail's butt joint with its lit end, and the peg that holds it
  for (let y = 5; y < 9; y++) { w(9, y, r.o); w(10, y, y === 5 ? r.h : r.b); }
  w(11, 7, r.o); w(12, 7, r.d); w(11, 6, r.d);
  // a knot on the top rail: an outline pip ringed in dark
  w(13, 2, r.o); w(12, 2, r.d); w(14, 2, r.d); w(13, 3, r.d);
}

const RESIN_DROPS: Blob[] = [[3.5, 3, 3.2, 2.6], [11, 4, 3.6, 2.8], [7, 10, 3.4, 3], [14.5, 12, 2.6, 2.4], [1.5, 13, 2.4, 2]];

/** Star resin: rounded drops of set light, each with a 2 px glint of starlight on its upper left. */
function paintResin(px: Px, r: Ramp) {
  const w = wrap(px);
  paintBlobs(w, RESIN_DROPS, i => (i === 2 ? r.h : r.b), r, r.d, r.o);
  const glint = r.a ?? r.h;
  for (const [x, y] of [[2, 2], [9, 3], [6, 8]]) { w(x, y, glint); w(x + 1, y, glint); }
}

/** Solar glass: a cut block, bevelled, deeper towards the lower right, two parallel glints. */
function paintGlass(px: Px, r: Ramp) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const edge = x === 0 || y === 0 ? r.h : x === T - 1 || y === T - 1 ? r.o : x === T - 2 || y === T - 2 ? r.d : '';
    px(x, y, edge || (x + y > 19 ? r.d : r.b));
  }
  for (let x = 2; x < 8; x++) { px(x, 9 - x, r.h); px(x + 3, 12 - x, r.h); }
  for (let k = 0; k < 4; k++) px(9 + k, 13 - k, r.o);
}

/** The sun seal: a pale disc set in a bevelled square, ringed like a medallion and closed on its centre:
 *  a door of light that is not open yet. Rings, never rays (four rays read as the Critic's ✗) and never
 *  seams that could read as cracks (cracks are the player's). */
function paintSeal(px: Px, r: Ramp) {
  const c = 7.5;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), lit = dx + dy < 0;
    let col: string;
    if (x === 0 || y === 0) col = r.h;
    else if (x === T - 1 || y === T - 1) col = r.d;
    else if (d > 7.1) col = r.b;                       // the square's field
    else if (d > 6.2) col = r.d;                       // the groove the disc sits in
    else if (d > 5.2) col = lit ? r.h : r.b;            // the disc's raised rim, lit top-left
    else if (d > 3.4) col = r.b;
    else if (d > 2.5) col = r.d;                       // a sunken ring
    else col = d > 1.3 ? r.b : r.h;                     // the closed centre
    px(x, y, col);
  }
}

/** Meteor glass: dark green glass sculpted by the fall, rippled with melt-flow ridges, each ridge lit on top. */
function paintTektite(px: Px, r: Ramp) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const a = (x / T) * Math.PI * 2;
    const f = (y + 1.8 * Math.sin(a + 0.6) + 0.9 * Math.sin(a * 2 + 2.1) + 0.5 * Math.sin(a * 3 + (y / T) * Math.PI * 2)) / 4;
    const s = ((f % 1) + 1) % 1;
    px(x, y, s < 0.18 ? r.o : s < 0.36 ? r.h : s > 0.8 ? r.d : r.b);
  }
  // two glassy glints where the light catches a ridge
  for (const [x, y] of [[3, 1], [11, 9]]) { px(x, y, r.h); px(x + 1, y, r.h); }
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
      paintLeaves(px, r, m.key === 'youngleaf');
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
    case 'earth':
      paintEarth(px, r);
      break;
    case 'rubble':
      paintRubble(px, r, rng);
      break;
    case 'ashlar':
      paintAshlar(px, r);
      break;
    case 'slate':
      paintSlate(px, r);
      break;
    case 'planks':
      paintCrate(px, r, r.a ?? r.h);
      break;
    case 'bark':
      paintBark(px, r, r.a);
      break;
    case 'rootbark':
      paintRootBark(px, r, r.a);
      break;
    case 'platebark':
      paintPlateBark(px, r, r.a);
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
    case 'cloud': paintCloud(px, r); break;
    case 'mist': paintMist(px, r); break;
    case 'heartwood': paintHeartwood(px, r); break;
    case 'branch': paintBranch(px, r); break;
    case 'skyleaf': paintSkyleaf(px, r); break;
    case 'bamboo': paintBamboo(px, r); break;
    case 'moss': paintMoss(px, r); break;
    case 'fence': paintFence(px, r); break;
    case 'resin': paintResin(px, r); break;
    case 'tektite': paintTektite(px, r); break;
    case 'glass': paintGlass(px, r); break;
    case 'seal': paintSeal(px, r); break;
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
  paintSkyTop(g, ...at(TILE_SKYWOOD_TOP), 'skywood');
  paintSkyTop(g, ...at(TILE_BAMBOO_TOP), 'bamboo');
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

/** The end faces of sky wood (its own growth rings) and bamboo (open culms). */
function paintSkyTop(g: CanvasRenderingContext2D, ox: number, oy: number, key: 'skywood' | 'bamboo') {
  const r = rampOf(MATERIALS.find(m => m.key === key)!);
  const px: Px = (x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
  if (key === 'skywood') paintLogTop(px, r); else paintBambooTop(px, r);
}

export function skyTopCanvas(key: 'skywood' | 'bamboo'): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  paintSkyTop(c.getContext('2d')!, 0, 0, key);
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

