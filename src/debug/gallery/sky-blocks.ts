// ?gallery=sky-blocks (docs/architecture/SKY.md §11). Owned by: AB (blocks), TR (trunk and deck). Rulings: docs/art/sky/blocks.md.
//
// The thirteen sky materials (tile ×6, cracks of light, 3 × 3, at 20 blocks in their own air, with a gold
// mark), the end faces, and the air itself: fog and clear colour by height for the deck, the void, the
// halls and Totality's strata, with the stars' share.

import { MATERIALS } from '../../content/materials';
import { palCss } from '../../content/palette';
import { CRACK_STAGES } from '../../content/tiles';
import { materialCanvas, paintCracks, skyTopCanvas } from '../../render/atlas';
import { atmosphereAt, HALLS, TOTALITY, VOID } from '../../sky/atmosphere';
import type { SkyPlace } from '../../sky/types';
import type { GalleryKit } from '../gallery';

/** Where each material lives, so it is shown in its own air. */
const HOME: Record<string, [SkyPlace, number, string]> = {
  cloud: ['deck', 32, 'the deck'],
  skywood: ['hall', 80, 'hall 2'],
  heartwood: ['hall', 40, 'hall 1'],
  skyleaf: ['hall', 80, 'hall 2'],
  bamboo: ['hall', 40, 'hall 1'],
  moss: ['hall', 80, 'hall 2'],
  palestone: ['hall', 160, 'hall 4'],
  fencewood: ['hall', 200, 'hall 5'],
  mist: ['hall', 200, 'hall 5'],
  starresin: ['totality', 300, 'lower stratum'],
  meteorglass: ['totality', 560, 'the void'],
  solarglass: ['totality', 880, 'upper stratum'],
  sunseal: ['totality', 975, 'the threshold'],
};

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** A 3 × 3 patch of the tile seen `dist` blocks away in its own air (three.js linear fog is a smoothstep). */
function inAir(tile: HTMLCanvasElement, place: SkyPlace, y: number, dist: number): HTMLCanvasElement {
  const a = atmosphereAt(place, y);
  const n = tile.width, c = document.createElement('canvas');
  c.width = c.height = n * 5;
  const g = c.getContext('2d')!;
  g.fillStyle = hex(a.clear); g.fillRect(0, 0, c.width, c.height);
  for (let j = 1; j < 4; j++) for (let i = 1; i < 4; i++) g.drawImage(tile, i * n, j * n);
  g.globalAlpha = smooth(a.near, a.far, dist);
  g.fillStyle = hex(a.fog); g.fillRect(n, n, n * 3, n * 3);
  g.globalAlpha = 1;
  return c;
}

/** The tile with a gold mark where a positive hit landed (README: gold marks are the player's light). */
function withMark(tile: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = tile.width; c.height = tile.height;
  const g = c.getContext('2d')!;
  g.drawImage(tile, 0, 0);
  g.fillStyle = palCss('light.gold'); g.fillRect(6, 6, 4, 4);
  return c;
}

export function skyBlocksGallery(g: GalleryKit) {
  g.head('Sky blocks (×6): cracks of light, 3 × 3, at 20 blocks in its own air, a gold mark');
  for (const m of MATERIALS.filter(q => HOME[q.key])) {
    const [place, y, where] = HOME[m.key];
    const r = g.row();
    g.fig(r, g.scaled(materialCanvas(m.id), 6), `${m.key} · ${m.concept ?? ''}`);
    if (isFinite(m.hp)) for (let s = 0; s < CRACK_STAGES; s++) {
      const c = materialCanvas(m.id);
      paintCracks(c.getContext('2d')!, 0, 0, s);
      g.fig(r, g.scaled(c, 6), `stage ${s + 1}`);
    } else g.fig(r, document.createElement('span'), 'unbreakable: never cracks');
    const tile = materialCanvas(m.id), big = document.createElement('canvas');
    big.width = big.height = tile.width * 3;
    const bg = big.getContext('2d')!;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) bg.drawImage(tile, i * tile.width, j * tile.height);
    g.fig(r, g.scaled(big, 2), '3 × 3');
    g.fig(r, g.scaled(inAir(tile, place, y, 0), 2), `in ${where}`);
    g.fig(r, g.scaled(inAir(tile, place, y, 20), 2), '20 blocks');
    g.fig(r, g.scaled(withMark(tile), 6), 'gold mark');
    if (m.key === 'skywood' || m.key === 'bamboo') g.fig(r, g.scaled(skyTopCanvas(m.key), 6), `${m.key} end`);
  }

  g.head('Sky air: clear colour by height (fog over it as a band), stars as dots');
  const r = g.row();
  const strip = (label: string, y0: number, y1: number, at: (y: number) => [SkyPlace, number]) => {
    const H = 420, W = 90, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cg = c.getContext('2d')!;
    for (let py = 0; py < H; py++) {
      const [place, y] = at(y1 - (py / (H - 1)) * (y1 - y0));
      const a = atmosphereAt(place, y);
      cg.fillStyle = hex(a.clear); cg.fillRect(0, py, W * 0.6, 1);
      cg.fillStyle = hex(a.fog); cg.fillRect(W * 0.6, py, W * 0.4, 1);
      if (a.stars > 0 && py % 7 === 0) { cg.globalAlpha = a.stars; cg.fillStyle = palCss('bone.paper'); cg.fillRect(((py * 37) % 40) + 6, py, 2, 2); cg.globalAlpha = 1; }
    }
    g.fig(r, c, label);
  };
  const lastVoid = VOID[VOID.length - 1].y;
  strip(`void + Totality ${VOID[0].y}–980`, VOID[0].y, 980, y => [y < lastVoid ? 'void' : 'totality', y]);
  strip(`halls ${HALLS[0].y0}–${HALLS[HALLS.length - 1].y1}`, HALLS[0].y0, HALLS[HALLS.length - 1].y1, y => ['hall', y]);

  g.head('Sky air: the stops (clear · fog · near/far · stars)');
  const stops: [string, SkyPlace, number][] = [
    ['deck', 'deck', 32],
    ...HALLS.map(h => [`hall ${h.floor}`, 'hall', h.y0 + 1] as [string, SkyPlace, number]),
    ...TOTALITY.map(k => [`totality y ${k.y}`, 'totality', k.y] as [string, SkyPlace, number]),
  ];
  const rs = g.row();
  for (const [label, place, y] of stops) {
    const a = atmosphereAt(place, y);
    const d = document.createElement('div');
    d.className = 'sw';
    d.style.background = `linear-gradient(90deg, ${hex(a.clear)} 60%, ${hex(a.fog)} 60%)`;
    g.fig(rs, d, `${label} · ${a.near.toFixed(0)}/${a.far.toFixed(0)} · ★${a.stars.toFixed(1)}`);
  }
}
