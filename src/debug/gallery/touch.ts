// ?gallery=touch (docs/art/DECISIONS.md §14.11, issue #376). The touch layout at phone size, in landscape: each
// checked phone at rest (no touch: only the rest set) and awake (a touch: the whole set, every contextual button
// shown). The rectangles come from src/input/touch-layout.ts, the one place the game also reads; the buttons
// use the game's own classes and glyphs from index.html, on a dark slate that stands for the world.

import { palCss } from '../../content/palette';
import { BINDING } from '../../input/bindings';
import { CHECK_VIEWPORTS, TOUCH_LAYOUT, slotRect, slotVisible } from '../../input/touch-layout';
import type { GalleryKit } from '../gallery';

function phone(w: number, h: number, awake: boolean): HTMLElement {
  const frame = document.createElement('div');
  frame.style.cssText = `position: relative; width: ${w}px; height: ${h}px; overflow: hidden; background: var(--pal-ink-void);
    box-shadow: 0 0 0 2px var(--ui-line);`;
  // the left 42 % is the stick's zone: a faint line marks its edge
  const zone = document.createElement('div');
  zone.style.cssText = `position: absolute; left: ${w * 0.42}px; top: 0; bottom: 0; border-left: 1px dashed var(--ui-text-2); opacity: .3;`;
  frame.appendChild(zone);
  // the minimap's place on a phone (130 px, top right)
  const map = document.createElement('div');
  map.className = 'slate';
  map.style.cssText = 'position: absolute; right: 10px; top: 8px; width: 138px; height: 138px; opacity: .6;';
  frame.appendChild(map);
  for (const s of TOUCH_LAYOUT) {
    if (!slotVisible(s, true, awake)) continue;
    const r = slotRect(s, w, h);
    const el = document.createElement(s.id === 'stick' ? 'div' : 'button');
    if (s.id === 'stick') {
      el.style.cssText = `border-radius: 50%; box-shadow: inset 0 0 0 2px var(--ui-text-2);
        background: color-mix(in srgb, var(--ui-panel) 35%, transparent); opacity: .35;`;
    } else {
      el.className = `tb tb-${s.id}${s.tier === 'rest' ? ' sys' : ''}`;
      const icon = s.action ? BINDING[s.action].touch.icon : undefined;
      if (icon) el.style.setProperty('--glyph', `var(--ico-${icon})`);
      if (s.id === 'cast' || s.id === 'bomb') { el.dataset.polarity = 'positive'; el.style.setProperty('--pol', palCss('light.gold')); }
      if (s.id === 'bomb') el.style.setProperty('--glyph', 'var(--ico-seedLove)');
    }
    el.style.position = 'absolute';
    el.style.left = `${r.x}px`; el.style.top = `${r.y}px`;
    el.style.width = `${r.w}px`; el.style.height = `${r.h}px`;
    el.style.margin = '0';
    el.title = `${s.id} · ${Math.round(r.w)} px`;
    frame.appendChild(el);
  }
  return frame;
}

export function touchGallery(g: GalleryKit) {
  g.head('Touch layout at phone size (landscape): at rest with no touch, and awake after a touch (every contextual button shown)');
  for (const [w, h] of CHECK_VIEWPORTS.filter(([, h]) => h <= 412)) {
    const r = g.row();
    g.fig(r, phone(w, h, false), `${w} × ${h} · rest (no touch)`);
    g.fig(r, phone(w, h, true), `${w} × ${h} · awake`);
  }
}
