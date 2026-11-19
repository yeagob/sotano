// The star map (owner decision D15 of #149: it belongs to the crown, and Opus designs it; docs/design/built/levels/
// giant-tree/STAR-MAP.md, the look in docs/art/DECISIONS.md §14.3). A tab of the menu screen: under the ground it
// draws the floor you stand on as a constellation (the rooms are stars, the doors are the lines between them, as the
// minimap knows them) with the room the Cartographer marked and the Star-reader's room; above the ground it draws the
// crown from above: the Leaves, the last stair, and the star pads, joined into their chain once the Star-reader has
// read them for you. Pure: a model from the game's state, and pixel art as an SVG string, so it is tested without a
// page. Every word goes through i18n; every colour is a palette token.

import { palCss, type PalToken } from '../content/palette';
import { t, type MessageKey } from '../i18n';
import { forDevice } from '../input/labels';
import type { Device } from '../input/bindings';
import type { RoomType } from '../world/floorplan';

/** What the Cartographer and the Star-reader marked, per floor: room ids (RoomInfo.id). */
export interface StarMarks {
  /** The room the Cartographer marked on each floor, with what was asked for; a chart for the zone's ore (presences
   *  README D13g) marks the vault in `room` and the boss in `also`. */
  cartographer: ReadonlyMap<number, { room: number; want: 'vault' | 'boss'; also?: number }>;
  /** The Star-reader's room once met, on its floor. */
  starReader: { floor: number; room: number } | null;
  /** The Star-reader read the stars for you (its gift was taken): the crown's chain of pads is drawn. */
  read: boolean;
}

export const NO_MARKS: StarMarks = { cartographer: new Map(), starReader: null, read: false };

/** A room as the floor's star map draws it. */
export interface MapStar {
  id: number; gx: number; gz: number; type: RoomType;
  state: 'here' | 'visited' | 'known' | 'told';
  cartographer: boolean; starReader: boolean;
}

export interface FloorStarMap {
  kind: 'floor';
  depth: number;
  w: number; h: number;
  stars: MapStar[];
  /** Joined pairs of room ids (a door the player has seen: one end visited). */
  lines: [number, number][];
}

export interface CrownStarMap {
  kind: 'crown';
  /** The world's size in blocks (x, z): the map is the crown seen from above, one pixel a block. */
  sx: number; sz: number;
  centre: [number, number];
  trunk: number;
  crown: [number, number];
  leaves: { x0: number; z0: number; w: number; d: number };
  stair: [number, number];
  pads: { x: number; z: number; to: number; up: boolean }[];
  read: boolean;
  here: [number, number] | null;
}

export type StarMap = FloorStarMap | CrownStarMap;

/** The floor's input: the shape of FloorResult that the map needs (rooms with their cells and their plan links). */
export interface FloorInput {
  plan: { w: number; h: number; rooms: readonly { links: Partial<Record<string, number>> }[] };
  rooms: readonly { id: number; gx: number; gz: number; type: RoomType }[];
}

/** The floor as a constellation: the rooms you have been in, the rooms whose doors you have seen, the rooms the
 *  presences told you of. A room the Cartographer marked is drawn even if no door to it has been seen. */
export function floorStarMap(floor: FloorInput, depth: number, visited: ReadonlySet<number>, current: number, marks: StarMarks): FloorStarMap {
  const known = new Set<number>(), lines: [number, number][] = [];
  const mark = marks.cartographer.get(depth);
  const cartoRooms = new Set<number>(mark ? [mark.room, ...(mark.also !== undefined ? [mark.also] : [])] : []);
  const reader = marks.starReader?.floor === depth ? marks.starReader.room : -1;
  floor.rooms.forEach((r, i) => {
    if (!visited.has(r.id)) return;
    known.add(r.id);
    for (const n of Object.values(floor.plan.rooms[i]?.links ?? {})) {
      const o = floor.rooms[n as number];
      if (!o) continue;
      known.add(o.id);
      if (!visited.has(o.id) || r.id < o.id) lines.push([r.id, o.id]);
    }
  });
  const stars: MapStar[] = [];
  for (const r of floor.rooms) {
    const told = cartoRooms.has(r.id) || r.id === reader;
    if (!known.has(r.id) && !told) continue;
    const state = r.id === current ? 'here' : visited.has(r.id) ? 'visited' : known.has(r.id) ? 'known' : 'told';
    stars.push({ id: r.id, gx: r.gx, gz: r.gz, type: r.type, state, cartographer: cartoRooms.has(r.id), starReader: r.id === reader });
  }
  return { kind: 'floor', depth, w: floor.plan.w, h: floor.plan.h, stars, lines };
}

// ───────────────────────── pixel art ─────────────────────────

/** One pixel per cell, by colour token and opacity; drawn as one path per colour (crisp, no anti-aliasing). */
class Pixels {
  private layers = new Map<string, Set<string>>();
  dot(x: number, y: number, tok: PalToken, a = 1) {
    const k = `${tok}|${a}`;
    if (!this.layers.has(k)) this.layers.set(k, new Set());
    this.layers.get(k)!.add(`${Math.round(x)},${Math.round(y)}`);
  }
  /** A glyph from rows of characters: each character names a token in `inks` ('.' is empty), centred on (x, y). */
  glyph(x: number, y: number, rows: readonly string[], inks: Record<string, PalToken>, a = 1) {
    const oy = y - (rows.length >> 1), ox = x - (rows[0].length >> 1);
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (inks[ch]) this.dot(ox + c, oy + r, inks[ch], a); }));
  }
  line(x0: number, y0: number, x1: number, y1: number, tok: PalToken, a = 1, every = 2) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i += every) this.dot(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), tok, a);
  }
  svg(w: number, h: number, label: string, scale: number): string {
    const body = [...this.layers].map(([k, px]) => {
      const [tok, a] = k.split('|');
      const d = [...px].map(p => { const [x, y] = p.split(','); return `M${x} ${y}h1v1h-1z`; }).join('');
      return `<path fill="${palCss(tok as PalToken)}"${a === '1' ? '' : ` fill-opacity="${a}"`} d="${d}"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}">` +
      `<rect width="${w}" height="${h}" fill="${palCss('ui.night')}"/>${body}</svg>`;
  }
}

/** The glyphs, 5 × 5 or smaller (docs/art/DECISIONS.md §14.3): shape before colour, never a ✗. */
export const GLYPHS = {
  /** A room you have been in: a four-point star, a bright core and dim tips. */
  visited: ['..d..', '..p..', 'dpppd', '..p..', '..d..'],
  /** A room whose door you have seen: a small dim star. */
  known: ['.f.', 'fff', '.f.'],
  /** A room a presence told you of, not yet seen: a single point. */
  told: ['f'],
  /** The minimap's marks for special rooms (DECISIONS §10.2): a house, a hollow ◇, a ▭, a ▣. */
  start: ['..s..', '.sss.', '.sss.', '.sss.'],
  treasure: ['..g..', '.g.g.', 'g...g', '.g.g.', '..g..'],
  vault: ['bbbbb', 'b...b', 'bbbbb'],
  boss: ['wwwww', 'w...w', 'w.w.w', 'w...w', 'wwwww'],
  /** The Cartographer's mark: four corners of brass round the room (9 × 9). */
  cartographer: ['hh.....hh', 'h.......h', '.........', '.........', '.........', '.........', '.........', 'h.......h', 'hh.....hh'],
  /** The Star-reader's room: a ring of eight points round it (9 × 9). */
  starReader: ['....p....', '.p.....p.', '.........', '.........', 'p.......p', '.........', '.........', '.p.....p.', '....p....'],
  /** You: the player's light under the star, a bar of gold. */
  here: ['ggggg'],
  /** You on the crown's map: a small gold star (the player's light). */
  you: ['.g.', 'ggg', '.g.'],
  /** A star pad of the crown: a starstone star; the last one carries a point above it, the way up. */
  pad: ['.p.', 'ppp', '.p.'],
  padUp: ['.p.', '...', '.p.', 'ppp', '.p.'],
  /** The Leaves' ring of starstone, the crown's place. */
  ring: ['ppp', 'p.p', 'ppp'],
  /** The last stair: a spiral read as a ring of bough. */
  stair: ['.uuu.', 'u...u', 'u...u', 'u...u', '.uuu.'],
} as const;

const INKS: Record<string, PalToken> = {
  p: 'bone.paper', d: 'bone.dim', f: 'bone.faded', s: 'bone.dim', g: 'light.gold', b: 'brass.base', h: 'brass.hi',
  w: 'cold.white', u: 'mat.bough.hi', l: 'mat.youngleaf.hi',
};

/** Pixels per cell of a floor's grid. */
const CELL = 12;

const glyphOf = (s: MapStar): readonly string[] =>
  s.type === 'start' || s.type === 'treasure' || s.type === 'vault' || s.type === 'boss' ? GLYPHS[s.type]
    : s.state === 'here' || s.state === 'visited' ? GLYPHS.visited : s.state === 'known' ? GLYPHS.known : GLYPHS.told;

/** A faint field of background stars, the same every time (a fixed hash, never the run's seed). */
function field(px: Pixels, w: number, h: number) {
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const n = Math.imul(x * 374761393 + y * 668265263, 1274126177) >>> 0;
    if (n % 97 === 0) px.dot(x, y, 'bone.faded', 0.35);
  }
}

/** The map as pixel art: an SVG string sized at an integer scale. */
export function starMapSvg(m: StarMap, scale = 4): string {
  const px = new Pixels();
  if (m.kind === 'floor') {
    // the map is cropped to the stars it shows, one cell of sky round them: it never tells the floor's size
    const gxs = m.stars.map(s => s.gx), gzs = m.stars.map(s => s.gz);
    const gx0 = Math.max(0, Math.min(...gxs, m.w) - 1), gx1 = Math.min(m.w - 1, Math.max(...gxs, -1) + 1);
    const gz0 = Math.max(0, Math.min(...gzs, m.h) - 1), gz1 = Math.min(m.h - 1, Math.max(...gzs, -1) + 1);
    const W = Math.max(3, gx1 - gx0 + 1) * CELL, H = Math.max(3, gz1 - gz0 + 1) * CELL;
    field(px, W, H);
    const at = new Map(m.stars.map(s => [s.id, [(s.gx - gx0) * CELL + CELL / 2, (s.gz - gz0) * CELL + CELL / 2] as const]));
    for (const [a, b] of m.lines) {
      const p = at.get(a), q = at.get(b);
      if (p && q) px.line(p[0], p[1], q[0], q[1], 'bone.faded', 0.6);
    }
    for (const s of m.stars) {
      const [x, y] = at.get(s.id)!;
      const dim = s.state === 'known' || s.state === 'told' ? 0.6 : 1;
      if (s.state === 'here') px.glyph(x, y, glyphOf(s), { ...INKS, p: 'light.core', d: 'light.gold', f: 'light.gold', s: 'light.gold' });
      else px.glyph(x, y, glyphOf(s), INKS, dim);
      if (s.state === 'here') px.glyph(x, y + 4, GLYPHS.here, INKS);
      if (s.cartographer) px.glyph(x, y, GLYPHS.cartographer, INKS);
      if (s.starReader) px.glyph(x, y, GLYPHS.starReader, INKS, 0.8);
    }
    return px.svg(W, H, starMapTitle(m), scale);
  }
  field(px, m.sx, m.sz);
  const [cx, cz] = m.centre;
  // the crown's outline (an ellipse of leaves, dotted), the trunk under it (a ring of bough)
  for (let k = 0; k < 360; k += 2) {
    const a = k * Math.PI / 180;
    px.dot(cx + Math.cos(a) * m.crown[0], cz + Math.sin(a) * m.crown[1], 'mat.leaf.hi', 0.7);
    if (k % 4 === 0) px.dot(cx + Math.cos(a) * m.trunk, cz + Math.sin(a) * m.trunk, 'mat.bough.base', 0.6);
  }
  // the Leaves: a room of young leaves, its ring of starstone at the centre
  const L = m.leaves;
  for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) for (const z of [L.z0 - 1, L.z0 + L.d]) px.dot(x, z, 'mat.youngleaf.hi');
  for (let z = L.z0; z < L.z0 + L.d; z++) for (const x of [L.x0 - 1, L.x0 + L.w]) px.dot(x, z, 'mat.youngleaf.hi');
  for (let z = L.z0; z < L.z0 + L.d; z++) for (let x = L.x0; x < L.x0 + L.w; x++) px.dot(x, z, 'mat.leaf.dark', 0.8);
  px.glyph(L.x0 + 6, L.z0 + 3, GLYPHS.ring, INKS);
  px.glyph(m.stair[0], m.stair[1], GLYPHS.stair, INKS);
  // the doors of the stars: drawn only once the Star-reader has read them for you
  if (m.read) for (const p of m.pads) { const q = m.pads[p.to]; if (q && !p.up) px.line(p.x, p.z, q.x, q.z, 'bone.dim', 0.7, 3); }
  for (const p of m.pads) px.glyph(p.x, p.z, p.up ? GLYPHS.padUp : GLYPHS.pad, INKS, p.up ? 1 : 0.9);
  if (m.here) {
    px.glyph(m.here[0], m.here[1], GLYPHS.you, INKS);
    px.glyph(m.here[0], m.here[1] + 3, GLYPHS.here, INKS);
  }
  return px.svg(m.sx, m.sz, starMapTitle(m), scale);
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const th = (k: MessageKey, p?: Record<string, string | number>) => esc(t(k, p));

/** The map's title: the floor's number, or the crown. */
export function starMapTitle(m: StarMap): string {
  return m.kind === 'floor' ? t('starmap.floor', { n: m.depth }) : t('starmap.crown');
}

/** The legend's rows that this map shows: a glyph and its words (never colour alone). */
export function legendRows(m: StarMap): { glyph: readonly string[]; inks?: Record<string, PalToken>; key: MessageKey }[] {
  const gold = { ...INKS, p: 'light.core', d: 'light.gold' } as Record<string, PalToken>;
  if (m.kind === 'floor') {
    const rows: { glyph: readonly string[]; inks?: Record<string, PalToken>; key: MessageKey }[] = [
      { glyph: GLYPHS.visited, inks: gold, key: 'starmap.legend.here' },
      { glyph: GLYPHS.visited, key: 'starmap.legend.visited' },
      { glyph: GLYPHS.known, key: 'starmap.legend.known' },
    ];
    const has = (f: (s: MapStar) => boolean) => m.stars.some(f);
    for (const type of ['start', 'treasure', 'vault', 'boss'] as const) if (has(s => s.type === type)) rows.push({ glyph: GLYPHS[type], key: `starmap.legend.${type}` });
    if (has(s => s.cartographer)) rows.push({ glyph: GLYPHS.cartographer, key: 'starmap.legend.cartographer' });
    if (has(s => s.starReader)) rows.push({ glyph: GLYPHS.starReader, key: 'starmap.legend.starreader' });
    return rows;
  }
  const rows: { glyph: readonly string[]; inks?: Record<string, PalToken>; key: MessageKey }[] = [
    { glyph: GLYPHS.you, key: 'starmap.legend.you' },
    { glyph: GLYPHS.ring, key: 'starmap.legend.leaves' },
    { glyph: GLYPHS.stair, key: 'starmap.legend.stair' },
  ];
  if (m.pads.length) rows.push({ glyph: GLYPHS.pad, key: 'starmap.legend.pad' }, { glyph: GLYPHS.padUp, key: 'starmap.legend.padUp' });
  return rows;
}

/** The tab's content: the card with its header (title, a line of what it shows, how to close it), the map and the legend. */
export function starMapHtml(m: StarMap, device: Device): string {
  const sub: MessageKey = m.kind === 'floor' ? 'starmap.floor.sub'
    : !m.pads.length ? 'starmap.crown.nostars' : m.read ? 'starmap.crown.read' : 'starmap.crown.unread';
  const legend = legendRows(m).map(r => {
    const px = new Pixels(), w = Math.max(...r.glyph.map(g => g.length)), h = r.glyph.length;
    px.glyph(w >> 1, h >> 1, r.glyph, r.inks ?? INKS);
    return `<li>${px.svg(w, h, '', 3).replace(' role="img" aria-label=""', ' aria-hidden="true"')}<span>${th(r.key)}</span></li>`;
  }).join('');
  return `<div class="card slate"><header><h2>${esc(starMapTitle(m))}</h2><small>${th(sub)} · ${th(forDevice('starmap.close', device))}</small>` +
    `<button type="button" class="close" data-act="inventory" aria-label="${th('inv.closeLabel')}">✕</button></header>` +
    `<div class="view">${starMapSvg(m)}</div><ul class="legend">${legend}</ul></div>`;
}

/** What the map key does to the screen: open it on the map, or close it when the map is what it shows. */
export function mapKeyOutcome(screenOpen: boolean, tab: string): 'open' | 'close' {
  return screenOpen && tab === 'map' ? 'close' : 'open';
}
