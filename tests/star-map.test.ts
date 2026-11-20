// The star map (owner decision D15 of #149; docs/design/built/levels/giant-tree/STAR-MAP.md): the floor as a
// constellation with the Cartographer's and the Star-reader's marks, the crown from above with its stars, pixel art in
// palette tokens only, every word in English and Spanish, and reached and closed on keyboard, mouse, gamepad and touch.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { PALETTE } from '../src/content/palette';
import { setLocale } from '../src/i18n';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { BINDING, CONTROL_ROWS, contextsFor } from '../src/input/bindings';
import { CrownStarMap, floorStarMap, legendRows, mapKeyOutcome, NO_MARKS, starMapHtml, starMapSvg, type FloorInput } from '../src/game/star-map';
import { WORLD_SIZE } from '../src/world/floor';
import { LEAVES } from '../src/world/crown';

// a line of five rooms, west to east: start (0), normal (1), vault (2), normal (3), boss (4)
const FLOOR: FloorInput = {
  plan: { w: 7, h: 7, rooms: [{ links: { E: 1 } }, { links: { W: 0, E: 2 } }, { links: { W: 1, E: 3 } }, { links: { W: 2, E: 4 } }, { links: { W: 3 } }] },
  rooms: [
    { id: 400, gx: 1, gz: 3, type: 'start' }, { id: 401, gx: 2, gz: 3, type: 'normal' }, { id: 402, gx: 3, gz: 3, type: 'vault' },
    { id: 403, gx: 4, gz: 3, type: 'normal' }, { id: 404, gx: 5, gz: 3, type: 'boss' },
  ],
};

const CROWN: CrownStarMap = {
  kind: 'crown', sx: WORLD_SIZE.sx, sz: WORLD_SIZE.sz, centre: [WORLD_SIZE.sx >> 1, WORLD_SIZE.sz >> 1], trunk: 34, crown: [54, 36],
  leaves: { x0: LEAVES.x0, z0: LEAVES.z0, w: LEAVES.w, d: LEAVES.d }, stair: [69, 40],
  pads: [{ x: 60, z: 30, to: 1, up: false }, { x: 80, z: 20, to: 2, up: false }, { x: 100, z: 60, to: 0, up: true }], read: false, here: [70, 40],
};

const hexes = (svg: string) => [...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map(m => m[1].toUpperCase());
const tokens = new Set(Object.values(PALETTE).map(v => v.toUpperCase()));

afterEach(() => setLocale('en'));

describe('the star map: the floor as a constellation', () => {
  it('shows the rooms you have been in, the doors you have seen, and nothing else', () => {
    const m = floorStarMap(FLOOR, 4, new Set([400, 401]), 401, NO_MARKS);
    expect(m.stars.map(s => [s.id, s.state])).toEqual([[400, 'visited'], [401, 'here'], [402, 'known']]);
    expect(m.lines).toEqual([[400, 401], [401, 402]]);
  });

  it("draws the Cartographer's mark and the Star-reader's room even before their doors are seen", () => {
    const marks = { cartographer: new Map([[4, { room: 404, want: 'boss' as const }]]), starReader: { floor: 4, room: 403 }, read: true };
    const m = floorStarMap(FLOOR, 4, new Set([400]), 400, marks);
    expect(m.stars.find(s => s.id === 404)).toMatchObject({ state: 'told', cartographer: true });
    expect(m.stars.find(s => s.id === 403)).toMatchObject({ state: 'told', starReader: true });
    // a mark of another floor stays on its floor
    expect(floorStarMap(FLOOR, 5, new Set([400]), 400, marks).stars.some(s => s.cartographer || s.starReader)).toBe(false);
    const keys = legendRows(m).map(r => r.key);
    expect(keys).toContain('starmap.legend.cartographer');
    expect(keys).toContain('starmap.legend.starreader');
  });

  it('is pixel art in palette colours only, at an integer scale, cropped to the stars it shows', () => {
    const svg = starMapSvg(floorStarMap(FLOOR, 4, new Set([400, 401, 402]), 402, NO_MARKS));
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toMatch(/viewBox="0 0 72 36" width="288" height="144"/);
    for (const h of hexes(svg)) expect(tokens.has(h), h).toBe(true);
  });
});

describe('the star map: the crown from above', () => {
  it('draws the Leaves, the stair and the stars; the chain of doors only once the Star-reader has read it', () => {
    const unread = starMapSvg(CROWN), read = starMapSvg({ ...CROWN, read: true });
    expect(read.length).toBeGreaterThan(unread.length);
    for (const h of hexes(read)) expect(tokens.has(h), h).toBe(true);
    expect(legendRows(CROWN).map(r => r.key)).toEqual(['starmap.legend.you', 'starmap.legend.leaves', 'starmap.legend.stair', 'starmap.legend.pad', 'starmap.legend.padUp']);
    expect(starMapHtml(CROWN, 'keyboard')).toContain(EN.messages['starmap.crown.unread']);
    expect(starMapHtml({ ...CROWN, read: true }, 'keyboard')).toContain(EN.messages['starmap.crown.read']);
    expect(starMapHtml({ ...CROWN, pads: [] }, 'keyboard')).toContain(EN.messages['starmap.crown.nostars']);
  });
});

describe('the star map: both languages', () => {
  const maps = [floorStarMap(FLOOR, 4, new Set([400, 401]), 401, { cartographer: new Map([[4, { room: 404, want: 'boss' as const }]]), starReader: { floor: 4, room: 403 }, read: true }), CROWN];
  it('every word it shows exists in English and Spanish, and the page shows the language on screen', () => {
    const en = EN.messages as Record<string, string>, es = ES.messages as Record<string, string>;
    for (const m of maps) for (const r of legendRows(m)) { expect(en[r.key], r.key).toBeTruthy(); expect(es[r.key], r.key).toBeTruthy(); }
    for (const k of ['tab.map', 'starmap.floor', 'starmap.crown', 'starmap.floor.sub', 'starmap.close', 'starmap.close.pad', 'starmap.close.touch', 'toast.leaves']) {
      expect(en[k], k).toBeTruthy(); expect(es[k], k).toBeTruthy();
    }
    setLocale('es');
    const html = starMapHtml(maps[0], 'gamepad');
    expect(html).toContain('El mapa estelar del piso 4');
    expect(html).toContain(es['starmap.close.pad']);
    expect(html).toContain(es['starmap.legend.cartographer']);
    setLocale('en');
    expect(starMapHtml(maps[0], 'touch')).toContain(en['starmap.close.touch']);
    expect(starMapHtml(maps[1], 'keyboard')).toContain('The star map of the crown');
  });
});

describe('the star map: reached and closed on every device', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../src/game/game.ts', import.meta.url), 'utf8');

  it('has its own key on the keyboard and the gamepad, and its tab on touch and the mouse', () => {
    const b = BINDING.map;
    expect(b.keyboard.keys).toEqual(['KeyM']);
    expect(b.gamepad.buttons).toEqual([8]);
    expect(b.touch.control).toBe('menuButton');
    for (const c of ['play', 'paused', 'inventory'] as const) expect(contextsFor(b, 'keyboard')).toContain(c);
    for (const c of ['play', 'inventory'] as const) expect(contextsFor(b, 'gamepad')).toContain(c);
    for (const c of ['paused', 'inventory'] as const) expect(contextsFor(b, 'touch')).toContain(c);
    expect(CONTROL_ROWS).toContain('map');
    // the tab button (a click or a tap) and the close button of the card
    expect(html).toContain('data-act="tab-map" data-tab="map"');
    expect(html).toContain('<div id="starmap"></div>');
    expect(starMapHtml(CROWN, 'touch')).toContain('class="close" data-act="inventory"');
    expect(game).toContain("act === 'tab-map'");
    expect(game).toContain("inp.hit('map')");
  });

  it('the same key opens it and closes it; any other tab gives way to it', () => {
    expect(mapKeyOutcome(false, 'menu')).toBe('open');
    expect(mapKeyOutcome(true, 'items')).toBe('open');
    expect(mapKeyOutcome(true, 'menu')).toBe('open');
    expect(mapKeyOutcome(true, 'map')).toBe('close');
    // back (Esc, B) closes the screen it lives in, on the keyboard and the gamepad
    expect(contextsFor(BINDING.back, 'keyboard')).toContain('inventory');
    expect(contextsFor(BINDING.back, 'gamepad')).toContain('inventory');
  });
});
