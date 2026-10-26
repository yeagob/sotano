// Item icons: each item's 12×12 pixel art (from its definition) drawn on a canvas, with a dark
// outline so it reads on any background. Used on pedestals, in the pickup banner, the hold-up
// animation and the inventory window. Cached per item and scale.

import * as THREE from 'three';
import type { ItemDef } from '../items/types';

const cache = new Map<string, HTMLCanvasElement>();

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** The icon at `scale` pixels per icon pixel, plus a 1-pixel outline on every side. */
export function iconCanvas(def: ItemDef, scale = 4): HTMLCanvasElement {
  const key = `${def.id}@${scale}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = def.icon.rows, N = 12, P = N + 2;
  const c = document.createElement('canvas');
  c.width = P * scale; c.height = P * scale;
  const g = c.getContext('2d')!;
  const solid = (x: number, y: number) => y >= 0 && y < N && x >= 0 && x < N && rows[y][x] !== '.';
  // outline: any empty pixel next to a filled one
  g.fillStyle = '#120d0a';
  for (let y = -1; y <= N; y++) for (let x = -1; x <= N; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    g.fillStyle = hex(def.icon.palette[ch]);
    g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
    // a 1-pixel highlight on the top edge of each filled run gives the art some depth
    if (!solid(x, y - 1) && scale >= 3) {
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect((x + 1) * scale, (y + 1) * scale, scale, Math.max(1, scale >> 2));
    }
  }
  cache.set(key, c);
  return c;
}

export function iconDataUrl(def: ItemDef, scale = 4) { return iconCanvas(def, scale).toDataURL(); }

const texCache = new Map<string, THREE.CanvasTexture>();

export function iconTexture(def: ItemDef): THREE.CanvasTexture {
  let t = texCache.get(def.id);
  if (!t) {
    t = new THREE.CanvasTexture(iconCanvas(def, 4));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(def.id, t);
  }
  return t;
}

/** Soft round glow sprite texture (shared). */
let glow: THREE.CanvasTexture | null = null;
export function glowTexture(): THREE.CanvasTexture {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glow = new THREE.CanvasTexture(c);
  return glow;
}

/** "★★★☆" style quality string. */
export function qualityStars(q: number) { return '★'.repeat(q) + '☆'.repeat(4 - q); }
