// ?gallery=spirit (docs/art/DECISIONS.md §10.7). The spirit's outline round the hearts and its number, as the HUD draws
// them in the sky: at 100, 46 and 0, each on the light deck and on the dark void. The same ring (render/spirit-ring.ts)
// and the same classes as index.html, at a larger --u so the 1 u line reads in a capture.

import { createSpiritRing, paintSpiritRing } from '../../render/spirit-ring';
import type { GalleryKit } from '../gallery';

/** The gallery's scale for the 1 u line: 6 px, three times the HUD at 768 px high. */
const DEMO_U = '6px';

function demo(value: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'hearts-row sky';
  const box = document.createElement('div');
  box.className = 'hearts-box';
  const strip = document.createElement('div');
  strip.className = 'hearts-strip';
  for (let i = 0; i < 4; i++) {
    const h = document.createElement('span');
    h.className = 'heart full';
    strip.appendChild(h);
  }
  const ring = createSpiritRing();
  paintSpiritRing(ring, value);
  box.append(strip, ring);
  const num = document.createElement('div');
  num.className = 'spirit-num';
  num.textContent = String(value);
  row.append(box, num);
  row.style.setProperty('--u', DEMO_U);
  // pad the demo by 5 u, as the sky's row does in index.html, so the ring and the number sit inside their figure
  row.style.padding = `calc(5 * ${DEMO_U})`;
  return row;
}

export function spiritGallery(g: GalleryKit) {
  g.head('Spirit, the outline of the hearts (sky only): 100, 46 and 0, on the light deck and the dark void');
  const r = g.row();
  for (const value of [100, 46, 0]) {
    g.fig(r, demo(value), `${value} · deck`, 'on-white');
    g.fig(r, demo(value), `${value} · void`, 'on-black');
  }
}
