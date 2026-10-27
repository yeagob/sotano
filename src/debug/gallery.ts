// ?gallery: deterministic captures of everything the player sees (docs/art/DECISIONS.md §12.5).
// Same palette, atlas painters, icon renderer and creature/pickup builders as the game; no world
// generation, no physics, no randomness. A developer tool: English only, like the debug readout.
//
//   ?gallery                 every section
//   ?gallery=materials|items|enemies|pickups|hud|palette
//   &filter=grey|deutan|protan|tritan|silhouette
//   &angle=35                turntable angle for enemies and pickups (degrees)
//   &id=critic               one enemy or item only

import * as THREE from 'three';
import { ENEMIES } from '../content/enemies';
import { HUD_ICONS } from '../content/hud-icons';
import { ITEMS } from '../content/items';
import { MATERIALS } from '../content/materials';
import { PALETTE, pal, palCss, type PalToken } from '../content/palette';
import { CRACK_STAGES } from '../content/tiles';
import { buildModel } from '../entities/enemies';
import { pickupMesh } from '../entities/pickups';
import { materialCanvas, paintCracks } from '../render/atlas';
import { applyPaletteCss, hudIconUrl, iconCanvas } from '../render/icons';

// Machado et al. 2009 at full severity (the same matrices as tests/art.test.ts), applied in sRGB here
const CVD: Record<string, number[]> = {
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lightness(n: number) {
  const Y = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}

export function runGallery(params: URLSearchParams) {
  applyPaletteCss(HUD_ICONS);
  const section = params.get('gallery') || 'all';
  const filter = params.get('filter') ?? '';
  const angle = Number(params.get('angle') ?? 35) * Math.PI / 180;
  const only = params.get('id');
  document.body.innerHTML = '';
  document.body.style.overflow = 'auto';
  document.body.style.userSelect = 'text';
  const style = document.createElement('style');
  style.textContent = `
    body { padding: 16px; background: var(--pal-ink-panel); }
    h2 { font-size: 20px; letter-spacing: 2px; margin: 18px 0 8px; color: var(--ui-text); }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
    figure { margin: 0; text-align: center; font-size: 12px; color: var(--ui-text-2); }
    figure canvas, figure img { display: block; image-rendering: pixelated; margin-bottom: 3px; }
    .sw { width: 92px; height: 40px; }
    .on-black { background: var(--pal-ink-void); padding: 6px; } .on-white { background: var(--pal-sky-albedo); padding: 6px; }
  `;
  document.head.appendChild(style);
  const root = document.createElement('div');
  document.body.appendChild(root);
  if (filter) root.style.filter = filterCss(filter);

  const show = (name: string) => section === 'all' || section === name;
  const head = (t: string) => { const h = document.createElement('h2'); h.textContent = t; root.appendChild(h); };
  const row = () => { const r = document.createElement('div'); r.className = 'row'; root.appendChild(r); return r; };
  const fig = (r: HTMLElement, el: HTMLElement, label: string, cls = '') => {
    const f = document.createElement('figure');
    if (cls) f.className = cls;
    f.append(el, document.createTextNode(label));
    r.appendChild(f);
  };
  const scaled = (src: HTMLCanvasElement, k: number) => {
    const c = document.createElement('canvas');
    c.width = src.width * k; c.height = src.height * k;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  };

  if (show('palette')) {
    head('Palette (token · L*)');
    const r = row();
    for (const t of Object.keys(PALETTE) as PalToken[]) {
      const d = document.createElement('div');
      d.className = 'sw';
      d.style.background = palCss(t);
      fig(r, d, `${t} · ${lightness(pal(t)).toFixed(0)}`);
    }
  }

  if (show('materials')) {
    head('Materials (×6) and cracks of light, stages 1–4');
    for (const m of MATERIALS) {
      if (m.id === 0) continue;
      const r = row();
      fig(r, scaled(materialCanvas(m.id), 6), `${m.key} · ${m.concept ?? ''}`);
      for (let s = 0; s < CRACK_STAGES; s++) {
        const c = materialCanvas(m.id);
        if (isFinite(m.hp)) paintCracks(c.getContext('2d')!, 0, 0, s);
        fig(r, scaled(c, 6), `stage ${s + 1}`);
      }
      // 3 × 3 to judge tiling
      const tile = materialCanvas(m.id), big = document.createElement('canvas');
      big.width = big.height = tile.width * 3;
      const g = big.getContext('2d')!;
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) g.drawImage(tile, x * tile.width, y * tile.height);
      fig(r, scaled(big, 2), '3 × 3');
    }
  }

  if (show('items')) {
    head('Practices: icons at ×2, ×3, ×5 on slate, and ×3 on black and white');
    const r = row();
    for (const d of ITEMS) {
      if (only && d.id !== only) continue;
      const box = document.createElement('div');
      box.className = 'row';
      // the renderer caches its canvases: show copies at the game's integer scales
      for (const k of [2, 3, 5]) box.appendChild(scaled(iconCanvas(d, k), 1));
      fig(r, box, d.id);
      fig(r, scaled(iconCanvas(d, 1), 3), '', 'on-black');
      fig(r, scaled(iconCanvas(d, 1), 3), '', 'on-white');
    }
  }

  const three = (draw: (scene: THREE.Scene) => THREE.Object3D, w: number, h: number, dist: number, target: number, bg: PalToken) => {
    const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    renderer.setSize(w, h, false);
    renderer.setClearColor(pal(bg));
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
    const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
    sun.position.set(0.4, 1, 0.3);
    scene.add(sun);
    const obj = draw(scene);
    obj.rotation.y = angle;
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.05, 50);
    cam.position.set(0, target + 0.25, dist);
    cam.lookAt(0, target, 0);
    renderer.render(scene, cam);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
    renderer.dispose();
    return out;
  };

  if (show('enemies')) {
    head('Projections on floor 1 (brick) and floor 4 (deepstone) backgrounds');
    const r = row();
    for (const e of ENEMIES) {
      if (only && e.id !== only) continue;
      for (const bg of ['rock.f1.base', 'mat.deepstone.base'] as PalToken[]) {
        const c = three(scene => { const v = buildModel(e).group; scene.add(v); return v; }, 260, 320, 3.6, e.size[1] / 2, bg);
        fig(r, c, `${e.id} · ${bg}`);
      }
    }
  }

  if (show('pickups')) {
    head('Pickups: key (an insight), seed (a breakthrough), heart');
    const r = row();
    for (const k of ['key', 'bomb', 'heart'] as const) {
      const c = three(scene => { const o = pickupMesh(k); scene.add(o); return o; }, 180, 180, 1.4, 0.2, 'rock.f1.base');
      fig(r, c, k);
    }
  }

  if (show('hud')) {
    head('HUD glyphs (×4) and hearts in every quarter state');
    const r = row();
    for (const [k, icon] of Object.entries(HUD_ICONS)) {
      const img = new Image();
      img.src = hudIconUrl(icon);
      img.width = icon.rows[0].length * 4; img.height = icon.rows.length * 4;
      fig(r, img, k);
    }
    const hearts = document.createElement('div');
    hearts.id = 'hearts';
    hearts.style.display = 'flex';
    hearts.style.gap = '4px';
    for (let q = 4; q >= 0; q--) {
      const shown = q === 4 ? 0 : (1 - (1 + 9 * q / 4) / 11) * 100;
      const h = document.createElement('span');
      h.className = 'heart';
      h.style.width = '44px'; h.style.height = '40px';
      if (q > 0) {
        const f = document.createElement('span');
        f.className = 'heart full';
        f.style.width = '44px'; f.style.height = '40px';
        f.style.clipPath = `inset(0 ${shown.toFixed(1)}% 0 0)`;
        h.appendChild(f);
      }
      hearts.appendChild(h);
    }
    fig(r, hearts, 'hearts 4/4 → 0/4');
  }
}

function filterCss(f: string): string {
  if (f === 'grey') return 'grayscale(1)';
  if (f === 'silhouette') return 'brightness(0)';
  const m = CVD[f];
  if (!m) return '';
  const id = `cvd-${f}`;
  if (!document.getElementById(id)) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.innerHTML = `<filter id="${id}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0"/></filter>`;
    document.body.appendChild(svg);
  }
  return `url(#${id})`;
}
