// The spirit's outline round the hearts (docs/art/DECISIONS.md §10.7): a 1 · --u light.core line on a
// 1 · --u ink.void keyline, its length the spirit out of 100, clockwise from the top left. Shared by the HUD
// (hud.ts) and ?gallery=spirit, so the gallery shows what the player sees. The colours and the slide are CSS
// (index.html, `.spirit-ring`); this file only writes the length.

const NS = 'http://www.w3.org/2000/svg';

/** An SVG that sits over the hearts row, with the keyline and the light as two rects of the same outline. */
export function createSpiritRing(): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'spirit-ring');
  svg.setAttribute('aria-hidden', 'true');
  for (const cls of ['spirit-key', 'spirit-line']) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', cls);
    r.setAttribute('x', '0');
    r.setAttribute('y', '0');
    r.setAttribute('width', '100%');
    r.setAttribute('height', '100%');
    // a unit path of 100 so that the dash is the spirit in hundredths, starting at the top left
    r.setAttribute('pathLength', '100');
    svg.appendChild(r);
  }
  paintSpiritRing(svg, 100);
  return svg;
}

/** Sets the outline's length: `value` of 100 is the whole outline, 0 is none. */
export function paintSpiritRing(svg: SVGSVGElement, value: number): void {
  const v = Math.max(0, Math.min(100, value));
  for (const r of Array.from(svg.querySelectorAll('rect'))) r.style.strokeDasharray = `${v} ${100 - v}`;
}
