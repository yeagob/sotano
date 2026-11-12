// The pure parts of the Roots' wall panels (docs/design/not-built/levels/roots/PANELS.md): the canvas
// geometry, word wrapping and shrink-to-fit against a measure the caller gives, which key cap a device
// reads, when a quotation carries the translation note, and where each panel hangs in its room (per layout).
// No DOM and no Three.js here, so every rule is tested in tests/tablets.test.ts; the drawing lives in
// tablets.ts and page-stone.ts.

import type { Device } from '../input/bindings';
import type { BookLayout, KeyAction, Lang, Panel, RoomKey, Side } from '../content/book';

/** The panel canvas (PANELS §1). */
export const PANEL_W = 896;
export const PANEL_H = 512;
/** The slab's size in the world, in blocks (PANELS §1). */
export const SLAB_W = 3.7;
export const SLAB_H = 2.1;

/** The width of a text at the font the caller has set. */
export type Measure = (text: string) => number;
/** The width of a text at a font size in pixels. */
export type MeasureAt = (text: string, px: number) => number;

/**
 * Breaks a text into lines no wider than `width`, at spaces. A word wider than the line is kept whole on a
 * line of its own (the caller sees it in `widest` and reports the overflow; nothing is ever cut).
 */
export function wrapText(text: string, width: number, measure: Measure): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (word === '') continue;
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > width) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** The widest of some lines. */
export function widest(lines: readonly string[], measure: Measure): number {
  return lines.reduce((w, l) => Math.max(w, measure(l)), 0);
}

/** A size range for shrink-to-fit: from the largest down to the smallest, in steps. */
export interface SizeRange { readonly from: number; readonly to: number; readonly step?: number }

/** The sizes of a range, largest first. */
export function sizesOf(r: SizeRange): number[] {
  const step = r.step ?? 2;
  const out: number[] = [];
  for (let px = r.from; px >= r.to; px -= step) out.push(px);
  if (out[out.length - 1] !== r.to) out.push(r.to);
  return out;
}

export interface LineFit { readonly px: number; readonly fits: boolean }

/** One line: the largest size of the range at which the text is no wider than `maxWidth`; else the smallest, flagged. */
export function fitLine(text: string, maxWidth: number, range: SizeRange, measureAt: MeasureAt): LineFit {
  const sizes = sizesOf(range);
  for (const px of sizes) if (measureAt(text, px) <= maxWidth) return { px, fits: true };
  return { px: sizes[sizes.length - 1], fits: false };
}

export interface BlockFit { readonly px: number; readonly lines: readonly string[]; readonly fits: boolean }

/**
 * A wrapped block: the largest size of the range at which the text takes at most `maxLines` lines, each no
 * wider than `width`. When no size fits, the smallest size's lines, flagged (every word still drawn).
 * `firstIndent` narrows the first `indentLines` lines (a drop cap).
 */
export function fitBlock(
  text: string, width: number, maxLines: number, range: SizeRange, measureAt: MeasureAt,
  indent: { readonly first: number; readonly lines: number } = { first: 0, lines: 0 },
): BlockFit {
  let last: BlockFit = { px: range.to, lines: [], fits: false };
  for (const px of sizesOf(range)) {
    const measure: Measure = s => measureAt(s, px);
    const lines = indent.lines > 0 ? wrapIndented(text, width, indent.first, indent.lines, measure) : wrapText(text, width, measure);
    const fits = lines.length <= maxLines && lines.every((l, i) => measure(l) <= width - (i < indent.lines ? indent.first : 0));
    last = { px, lines, fits };
    if (fits) return last;
  }
  return last;
}

/** Like wrapText, with the first `count` lines narrowed by `first` pixels. */
export function wrapIndented(text: string, width: number, first: number, count: number, measure: Measure): string[] {
  const out: string[] = [];
  let line = '';
  const room = () => width - (out.length < count ? first : 0);
  for (const word of text.split(' ')) {
    if (word === '') continue;
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > room()) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

// ── controls ──

const PART: Record<Device, 'key' | 'pad' | 'touch'> = { keyboard: 'key', gamepad: 'pad', touch: 'touch' };

/** The message key of a key cap's label on a device (BOOK-DATA §5). */
export function keycapLabelKey(action: KeyAction, device: Device): string {
  return `keycap.${action}.${PART[device]}`;
}

/** The message key of the verb beside a key cap. */
export function keycapVerbKey(action: KeyAction): string {
  return `keycap.${action}.verb`;
}

/** On touch the polarity cap draws the half-turn glyph instead of a label (PANELS §2). */
export function keycapGlyph(action: KeyAction, device: Device): 'half-turn' | undefined {
  return action === 'polarity' && device === 'touch' ? 'half-turn' : undefined;
}

/** A key cap's width: the label plus 48, clamped to 80…280 (PANELS §2). */
export function keycapWidth(labelWidth: number): number {
  return Math.min(280, Math.max(80, Math.ceil(labelWidth) + 48));
}

/** The message key of a control's label on a device, as the `{placeholder}`s read it (labels.ts). */
export function controlLabelKey(action: string, device: Device): string {
  return `controls.${action}.${PART[device]}`;
}

/** A control's label for the middle of a sentence: "The arrow" → "the arrow", "WASD" stays (labels.ts `inline`). */
export function inlineLabel(label: string): string {
  return label.length > 1 && label[1] === label[1].toLowerCase() ? label[0].toLowerCase() + label.slice(1) : label;
}

/** Fills `{action}` placeholders with each control's label, then capitalises each sentence (as today's tablets). */
export function fillControls(text: string, label: (action: string) => string): string {
  const filled = text.replace(/\{(\w+)\}/g, (_all, name: string) => inlineLabel(label(name)));
  return filled.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
}

// ── quotes ──

/** A quote shows "Our translation" when the book's language is not the quotation's own (PANELS §4b). */
export function showsTranslationNote(bookLang: Lang, quote: { readonly lang: Lang }): boolean {
  return bookLang !== quote.lang;
}

/** The author line as drawn: "— Author". */
export function authorLine(author: string): string {
  return `— ${author}`;
}

// ── where a panel hangs (PANELS §6) ──

/** A panel's place in the world: its centre, its turn about Y (0 faces south) and its size in blocks. */
export interface Mount {
  readonly x: number; readonly y: number; readonly z: number;
  readonly rotY: number;
  readonly w: number; readonly h: number;
}

/**
 * A slab's place relative to its room's interior corner (x0, y0, z0) of the 13 × 7 cell: the centre's offsets
 * along x and y, and its size. The wall (z) and the facing follow from the side.
 */
export interface MountSpec { readonly dx: number; readonly dy: number; readonly w: number; readonly h: number }

/** A layout variant's mounts: the default for each side, and the rooms whose own exercise asks for another place. */
export interface MountTable {
  readonly north: MountSpec;
  readonly south: MountSpec;
  readonly rooms: Partial<Record<RoomKey, Partial<Record<Side, MountSpec>>>>;
}

/**
 * The layout variant the panels hang in: the teaching layout (page 1, today's rooms) or the easy layout (page 2 on,
 * EASY-LAYOUT). The same names as the book's layouts: a variant is picked by the layout the Roots are carved in.
 */
export type MountVariant = BookLayout;

/**
 * The mount tables, one per layout variant (PANELS §6, EASY-LAYOUT §5). `teaching` (today's rooms): north west of
 * the door, south east of it; `roots-step` lifts both over its two-high walls; `roots-seal` narrows both into the
 * strips beside its obsidian walls. `easy`: the standard mount everywhere, since no easy room has a wall in front of
 * a panel.
 */
export const MOUNT_TABLES: Readonly<Record<MountVariant, MountTable>> = {
  teaching: {
    north: { dx: 2.0, dy: 2.0, w: SLAB_W, h: SLAB_H },
    south: { dx: 11.0, dy: 2.0, w: SLAB_W, h: SLAB_H },
    rooms: {
      'roots-step': {
        north: { dx: 2.0, dy: 3.1, w: SLAB_W, h: SLAB_H },
        south: { dx: 11.0, dy: 3.1, w: SLAB_W, h: SLAB_H },
      },
      'roots-seal': {
        north: { dx: 1.475, dy: 2.0, w: 2.85, h: 1.63 },
        south: { dx: 11.525, dy: 2.0, w: 2.85, h: 1.63 },
      },
    },
  },
  easy: {
    north: { dx: 2.0, dy: 2.0, w: SLAB_W, h: SLAB_H },
    south: { dx: 11.0, dy: 2.0, w: SLAB_W, h: SLAB_H },
    rooms: {},
  },
};

/**
 * Where the panel of a room's side hangs, from the room's interior corner (x0, y0, z0) of its 13 × 7 cell, in a
 * layout variant (the teaching layout by default). North faces south from z0; south faces north from z0 + 7.
 */
export function panelMount(room: RoomKey, side: Side, x0: number, y0: number, z0: number, layout: MountVariant = 'teaching'): Mount {
  const table = MOUNT_TABLES[layout];
  const spec = table.rooms[room]?.[side] ?? table[side];
  const north = side === 'north';
  return {
    x: x0 + spec.dx, y: y0 + spec.dy,
    z: north ? z0 + 0.02 : z0 + 7 - 0.02,
    rotY: north ? 0 : Math.PI,
    w: spec.w, h: spec.h,
  };
}

/** The image ids a panel draws (lesson and plate carry one; prose and quote none). */
export function panelImageIds(panel: Panel): string[] {
  return panel.layout === 'lesson' || panel.layout === 'plate' ? [panel.image] : [];
}

// ── the page stone (PAGES §4) ──

/** The page stone's place: the middle block of the start room's north wall, at y0 + 2, on its face toward the room. */
export function pageStoneMount(x0: number, y0: number, z0: number): Mount {
  return { x: x0 + 6.5, y: y0 + 2.5, z: z0 + 0.015, rotY: 0, w: 0.84, h: 0.84 };
}

/** The stone shows a number only on book pages. */
export function pageStoneShows(kind: 'tutorial' | 'book'): boolean {
  return kind === 'book';
}

// ── the stone's grain: a small deterministic generator (no Math.random outside core/fx.ts) ──

/** A 32-bit hash of a string (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** mulberry32: a seeded stream of numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
