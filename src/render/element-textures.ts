// Element textures, painted at runtime from palette tokens (docs/art/DECISIONS.md §3.8): shapes,
// never noise. Water: ripple bands and a few foam glints over the body. Lava: dark crust plates
// floating on molten rock, hot cracks between them and a rare vein of yellow (≤ 45 % emissive).
// Fire: a 4-frame strip of flame tongues (deep at the base, a pale core) that the renderer steps
// through at 8 fps; shape changes only, never a brightness flash.

import * as THREE from 'three';
import { palCss, type PalToken } from '../content/palette';
import { Rng } from '../core/rng';

const T = 16;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, t: PalToken) => { g.fillStyle = palCss(t); g.fillRect(x, y, 1, 1); };
  return { c, g, px };
}

function texture(c: HTMLCanvasElement, wrap: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function paintWater(): HTMLCanvasElement {
  const { c, g, px } = canvas(T, T);
  g.fillStyle = palCss('el.water.body'); g.fillRect(0, 0, T, T);
  const rng = new Rng(31);
  // ripple bands: short horizontal strokes, lit on top
  for (let i = 0; i < 7; i++) {
    const x = rng.int(0, T - 1), y = rng.int(0, T - 1), len = rng.int(3, 6);
    for (let k = 0; k < len; k++) px((x + k) % T, y, 'el.water.surface');
  }
  for (let i = 0; i < 3; i++) { const x = rng.int(0, T - 2), y = rng.int(0, T - 1); px(x, y, 'el.water.foam'); px(x + 1, y, 'el.water.foam'); }
  return c;
}

export function paintLava(): HTMLCanvasElement {
  const { c, g, px } = canvas(T, T);
  g.fillStyle = palCss('el.lava.hot'); g.fillRect(0, 0, T, T);
  // small crust plates drifting on molten rock (about 55 % crust, so ≤ 45 % glows), bevelled
  // with light from the top-left; the gaps between them are molten, their centres the hottest
  const plates: [number, number, number, number][] = [[1, 1, 6, 4], [8, 0, 7, 3], [9, 5, 6, 4], [2, 7, 5, 5], [7, 11, 5, 4], [12, 11, 4, 3], [0, 13, 2, 2], [4, 13, 2, 3], [15, 8, 1, 3], [0, 6, 1, 2]];
  for (const [x0, y0, w, h] of plates) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const top = y === y0 || x === x0, bot = y === y0 + h - 1 || x === x0 + w - 1;
    px(x % T, y % T, top ? 'el.lava.crust2' : bot ? 'el.lava.crust2' : 'el.lava.crust');
  }
  // molten seams cooling at the plate edges, and a few veins of yellow in the widest gaps
  for (const [x, y] of [[7, 5], [8, 4], [11, 10], [1, 5], [15, 4], [6, 12]] as [number, number][]) px(x, y, 'el.lava.molten');
  for (const [x, y] of [[7, 2], [8, 9], [1, 11], [14, 15]] as [number, number][]) px(x, y, 'el.lava.vein');
  return c;
}

export function paintFire(): HTMLCanvasElement {
  const { c, px } = canvas(T * 4, T);
  for (let f = 0; f < 4; f++) {
    const rng = new Rng(90 + f);
    // three tongues of different height that sway from frame to frame
    const tongues = [{ x: 3 + (f % 2), h: 9 + rng.int(0, 2) }, { x: 8 - (f === 2 ? 1 : 0), h: 13 + rng.int(0, 2) }, { x: 12 + (f === 1 ? 1 : 0), h: 8 + rng.int(0, 3) }];
    for (let x = 0; x < T; x++) {
      let h = 0;
      for (const t of tongues) h = Math.max(h, t.h - Math.abs(x - t.x) * 2.2);
      h = Math.max(0, Math.floor(h));
      for (let k = 0; k < h; k++) {
        const y = T - 1 - k, inner = h - k;
        const tok: PalToken = k < 2 ? 'el.fire.deep' : inner <= 2 ? 'el.fire.deep' : inner <= 4 ? 'el.fire.base' : k < h * 0.55 && inner > 6 ? 'el.fire.core' : 'el.fire.hi';
        px(f * T + x, y, tok);
      }
    }
  }
  return c;
}

/** The three element textures, ready for the renderer (water and lava tile; fire is a strip). */
export function elementTextures() {
  const fire = texture(paintFire(), false);
  fire.repeat.set(0.25, 1);
  return { water: texture(paintWater(), true), lava: texture(paintLava(), true), fire };
}
