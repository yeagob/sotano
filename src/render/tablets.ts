// The Roots' wall panels: the book carved into limestone slabs on the walls of its rooms (owner: the tutorial
// lives in the world, never in an overlay). Four layouts share one slab (docs/design/not-built/levels/roots/
// PANELS.md): `lesson` (an image, a title, a short text and the control as a key cap), `plate` (a portrait or
// an icon, a name, a kind, a text and a note), `prose` (the hidden book, with its page number) and `quote`
// (someone else's voice on a paler inset page). Every panel carries its id small in a lower corner, like a
// mason's mark.
//
// A panel is carved in full on an offscreen canvas and copied onto its slot's canvas in one synchronous step,
// so the wall never shows a blank, half-drawn or mixed panel. Its image is loaded first (PanelImages); a
// missing image draws a neutral framed placeholder and never breaks the panel.
//
// The pure rules (wrapping, shrink-to-fit, key caps per device, the translation note, the mounts) are in
// panel-layout.ts.

import * as THREE from 'three';
import {
  ROOM_KEYS, SIDES, bookMessage, loadBook, panelAt, panelById, quoteSource,
  type Book, type BookLayout, type ImageId, type Lang, type Panel, type RoomKey, type Side,
} from '../content/book';
import { resolveImage } from '../content/book/images';
import { HEART_HUD, type HeartKind } from '../content/heart-art';
import { ITEM_BY_ID } from '../content/items';
import { palCss, type PalToken } from '../content/palette';
import { flaskDef } from '../content/potions';
import type { PotionId } from '../content/potions';
import { locale } from '../i18n';
import type { Device } from '../input/bindings';
import { activeDevice } from '../input/input';
import { iconCanvas } from './icons';
import {
  PANEL_H, PANEL_W, authorLine, controlLabelKey, fillControls, fitBlock, fitLine, hashString, keycapGlyph, keycapLabelKey,
  keycapVerbKey, keycapWidth, panelImageIds, panelMount, seededRandom, showsTranslationNote,
  type MeasureAt, type Mount, type MountVariant, type SizeRange,
} from './panel-layout';

const SANS = 'system-ui, "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

/** The language and the device a panel is carved for. */
export interface PanelVoice { readonly lang: Lang; readonly device: Device }

/** The player's language and device now. */
export function currentVoice(): PanelVoice {
  return { lang: locale() === 'es' ? 'es' : 'en', device: activeDevice() };
}

/** What a carving found: the fields whose text did not fit (never cut, drawn as they are) and the images that are missing. */
export interface PanelReport {
  readonly id: string;
  readonly overflow: readonly string[];
  readonly missing: readonly ImageId[];
}

// ── images ──

type ImageState = 'icon' | 'loading' | 'ready' | 'missing' | 'unknown';

interface ImageEntry { state: 'loading' | 'ready' | 'missing'; img: HTMLImageElement; done: Promise<void> }

/**
 * The panels' image cache. Portraits and lesson captures are files (`public/book/...`) loaded once and kept;
 * icons are drawn from the game's own art and need no loading. A file that fails to load is remembered as
 * missing and drawn as a placeholder (and warned about once in the console).
 */
export class PanelImages {
  private entries = new Map<string, ImageEntry>();

  constructor(private readonly base: string = import.meta.env.BASE_URL ?? '/') {}

  /** Where an image stands: an icon (always ready), loading, ready, missing, or an id that does not resolve. */
  state(id: ImageId): ImageState {
    const ref = resolveImage(id);
    if (!ref) return 'unknown';
    if (ref.kind === 'icon') return 'icon';
    return this.entries.get(id)?.state ?? 'loading';
  }

  /** True when every id is settled (ready, missing, unknown or an icon): a panel using them can be carved now. */
  settled(ids: Iterable<ImageId>): boolean {
    for (const id of ids) {
      const s = this.state(id);
      if (s === 'loading') return false;
    }
    return true;
  }

  /** The loaded picture of an id, if it is ready. */
  image(id: ImageId): HTMLImageElement | undefined {
    const e = this.entries.get(id);
    return e?.state === 'ready' ? e.img : undefined;
  }

  /** Starts loading every id not yet asked for; resolves when all of them are settled. Never rejects. */
  preload(ids: Iterable<ImageId>): Promise<void> {
    const waits: Promise<void>[] = [];
    for (const id of ids) {
      const ref = resolveImage(id);
      if (!ref || ref.kind === 'icon') continue;
      let e = this.entries.get(id);
      if (!e) {
        const img = new Image();
        img.decoding = 'async';
        const entry = { state: 'loading', img } as ImageEntry;
        entry.done = new Promise<void>(resolve => {
          img.onload = () => { entry.state = img.naturalWidth > 0 ? 'ready' : 'missing'; resolve(); };
          img.onerror = () => {
            entry.state = 'missing';
            console.warn(`[book] image "${id}" did not load (${ref.file}); the panel shows a placeholder`);
            resolve();
          };
        });
        img.src = `${this.base}${ref.file}`;
        this.entries.set(id, entry);
        e = entry;
      }
      if (e.state === 'loading') waits.push(e.done);
    }
    return Promise.all(waits).then(() => undefined);
  }

  /** Every image the 22 slots of a page show in a layout (page 1's panel, or a remembered one, where the page leaves a slot out). */
  static pageIds(book: Book, page: number, layout: BookLayout = 'teaching'): ImageId[] {
    const ids = new Set<ImageId>();
    for (const room of ROOM_KEYS) for (const side of SIDES) for (const id of panelImageIds(panelAt(book, page, room, side, layout))) ids.add(id);
    return [...ids];
  }

  /** Preloads every image of a page in a layout; resolves when they are all settled. */
  preloadPage(book: Book, page: number, layout: BookLayout = 'teaching'): Promise<void> {
    return this.preload(PanelImages.pageIds(book, page, layout));
  }
}

/** The one cache the game shares: images loaded for one run stay for the next. */
export const panelImages = new PanelImages();

// ── carving ──

const css = (tok: PalToken) => palCss(tok);

function font(g: CanvasRenderingContext2D, style: string, px: number, family: string) {
  g.font = `${style} ${px}px ${family}`.trim();
}

/** A text measure at a size, for the shrink-to-fit rules. */
function measurer(g: CanvasRenderingContext2D, style: string, family: string): MeasureAt {
  return (text, px) => { font(g, style, px, family); return g.measureText(text).width; };
}

/**
 * Text cut into the stone: the light from the top left catches the lower inner wall of each letter, so a pale
 * lip sits a pixel below and right of the ink. On the paler inset page (`lip: false`) the ink stands alone.
 */
function carveText(g: CanvasRenderingContext2D, text: string, x: number, y: number, ink: PalToken, lip = true) {
  g.textBaseline = 'top';
  if (lip) {
    g.save();
    g.globalAlpha = 0.55;
    g.fillStyle = css('limestone.hi');
    g.fillText(text, x + 1, y + 2);
    g.restore();
  }
  g.fillStyle = css(ink);
  g.fillText(text, x, y);
}

/** A carved rule: the groove in `ink.bevel` with the pale lip under it. */
function carveRule(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  g.save();
  g.globalAlpha = 0.6;
  g.fillStyle = css('limestone.hi');
  g.fillRect(x + 1, y + h, w, 2);
  g.restore();
  g.fillStyle = css('ink.bevel');
  g.fillRect(x, y, w, h);
}

/** The gold diamond, the light's mark on the stone. */
function diamond(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.fillStyle = css('light.gold');
  g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.fill();
  // a darker lower facet, so the diamond reads as cut, not printed
  g.save();
  g.globalAlpha = 0.35;
  g.fillStyle = css('light.dusk');
  g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.closePath(); g.fill();
  g.restore();
}

/**
 * The slab shared by every layout (PANELS §1): a `limestone.dark` border, the face, a light edge on the top and
 * left and a bevel on the bottom and right (mitred at the corners), and a quiet grain that is the same every
 * time a panel is carved (seeded by its id).
 */
export function carveSlab(g: CanvasRenderingContext2D, seed: string, w = PANEL_W, h = PANEL_H, edge = 16, lip = 8) {
  g.fillStyle = css('limestone.dark'); g.fillRect(0, 0, w, h);
  // the outer corners chamfered: a darker facet on each
  g.fillStyle = css('ink.bevel');
  const c = edge * 0.75;
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * c, y); g.lineTo(x, y + dy * c); g.closePath(); g.fill();
  }
  const x0 = edge, y0 = edge, x1 = w - edge, y1 = h - edge;
  g.fillStyle = css('limestone.base'); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  grain(g, seed, x0 + lip, y0 + lip, x1 - lip, y1 - lip);
  // light edge (top, left) and bevel (bottom, right), mitred
  g.fillStyle = css('limestone.hi');
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 - lip, y0 + lip); g.lineTo(x0 + lip, y0 + lip); g.lineTo(x0 + lip, y1 - lip); g.lineTo(x0, y1); g.closePath(); g.fill();
  g.fillStyle = css('ink.bevel');
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x0, y1); g.lineTo(x0 + lip, y1 - lip); g.lineTo(x1 - lip, y1 - lip); g.lineTo(x1 - lip, y0 + lip); g.lineTo(x1, y0); g.closePath(); g.fill();
}

/** Limestone grain: a soft fall of light from the top, fine specks and two or three faint veins. Seeded, never random. */
function grain(g: CanvasRenderingContext2D, seed: string, x0: number, y0: number, x1: number, y1: number) {
  const rnd = seededRandom(hashString(seed));
  const w = x1 - x0, h = y1 - y0;
  g.save();
  const fall = g.createLinearGradient(0, y0, 0, y1);
  fall.addColorStop(0, css('limestone.hi'));
  fall.addColorStop(0.45, css('limestone.base'));
  fall.addColorStop(1, css('limestone.dark'));
  g.globalAlpha = 0.22;
  g.fillStyle = fall;
  g.fillRect(x0, y0, w, h);
  const specks = Math.round(w * h / 420);
  for (let i = 0; i < specks; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h, s = 1 + Math.floor(rnd() * 2.6);
    const pale = rnd() < 0.45;
    g.globalAlpha = pale ? 0.18 + rnd() * 0.2 : 0.1 + rnd() * 0.16;
    g.fillStyle = css(pale ? 'limestone.hi' : 'limestone.dark');
    g.fillRect(Math.round(x), Math.round(y), s, s);
  }
  g.lineCap = 'round';
  const veins = 2 + Math.floor(rnd() * 2);
  for (let v = 0; v < veins; v++) {
    let x = x0 + rnd() * w, y = y0 + rnd() * h * 0.2;
    let a = Math.PI * (0.3 + rnd() * 0.4);
    g.globalAlpha = 0.1 + rnd() * 0.06;
    g.strokeStyle = css('limestone.dark');
    g.lineWidth = 1 + rnd() * 1.2;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 40 && y < y1 && x > x0 && x < x1; s++) {
      a += (rnd() - 0.5) * 0.5;
      x += Math.cos(a) * 14; y += Math.sin(a) * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

/** The mason's mark: the panel id, very small, in the lower right of the face (PANELS §10). */
function masonMark(g: CanvasRenderingContext2D, id: string) {
  font(g, 'bold', 13, SANS);
  g.textAlign = 'right';
  g.textBaseline = 'alphabetic';
  g.save();
  g.globalAlpha = 0.6; g.fillStyle = css('limestone.hi'); g.fillText(id, 865, 479);
  g.restore();
  g.save();
  g.globalAlpha = 0.85; g.fillStyle = css('ink.bevel'); g.fillText(id, 864, 478);
  g.restore();
  g.textAlign = 'left';
}

/** A picture set into the stone: a 4 px ink frame, the image (or a placeholder), a recess shadow along its top and left. */
function framedImage(g: CanvasRenderingContext2D, id: ImageId, x: number, y: number, w: number, h: number, images: PanelImages): boolean {
  const ax = x + 4, ay = y + 4, aw = w - 8, ah = h - 8;
  g.fillStyle = css('ink.line'); g.fillRect(x, y, w, h);
  const ref = resolveImage(id);
  let present = true;
  g.save();
  g.beginPath(); g.rect(ax, ay, aw, ah); g.clip();
  if (ref?.kind === 'icon') drawIcon(g, ref.icon, ref.id, ax, ay, aw, ah);
  else {
    const img = images.image(id);
    if (img) coverFit(g, img, ax, ay, aw, ah);
    else { placeholder(g, ax, ay, aw, ah); present = false; }
  }
  // the recess: the frame's top and left throw a soft shadow into the picture
  const top = g.createLinearGradient(0, ay, 0, ay + 14);
  top.addColorStop(0, css('ink.line')); top.addColorStop(1, 'transparent');
  g.globalAlpha = 0.4; g.fillStyle = top; g.fillRect(ax, ay, aw, 14);
  const left = g.createLinearGradient(ax, 0, ax + 14, 0);
  left.addColorStop(0, css('ink.line')); left.addColorStop(1, 'transparent');
  g.fillStyle = left; g.fillRect(ax, ay, 14, ah);
  g.restore();
  // the stone's lip round the frame
  g.save();
  g.globalAlpha = 0.6; g.fillStyle = css('limestone.hi');
  g.fillRect(x + 2, y + h, w, 2); g.fillRect(x + w, y + 2, 2, h);
  g.restore();
  return present;
}

/** Cover-fit, centred crop. */
function coverFit(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const k = Math.max(w / iw, h / ih);
  const sw = w / k, sh = h / k;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

/** A neutral stand-in for a picture that is not there: pale stone, fine hatching and an empty diamond. No words. */
function placeholder(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  g.fillStyle = css('limestone.hi'); g.fillRect(x, y, w, h);
  g.save();
  g.globalAlpha = 0.28; g.strokeStyle = css('limestone.dark'); g.lineWidth = 2;
  g.beginPath();
  for (let d = -h; d < w; d += 18) { g.moveTo(x + d, y + h); g.lineTo(x + d + h, y); }
  g.stroke();
  g.globalAlpha = 0.7; g.strokeStyle = css('ink.bevel'); g.lineWidth = 4;
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.12;
  g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.stroke();
  g.restore();
}

/** An icon from the game's own art on a pale field, scaled by a whole multiple, nearest neighbour, with a soft ground shadow. */
function drawIcon(g: CanvasRenderingContext2D, kind: 'item' | 'potion' | 'heart', id: string, x: number, y: number, w: number, h: number) {
  g.fillStyle = css('limestone.hi'); g.fillRect(x, y, w, h);
  const fit = (pw: number, ph: number) => Math.max(1, Math.floor(Math.min(w * 0.72 / pw, h * 0.66 / ph)));
  let pic: HTMLCanvasElement;
  if (kind === 'heart') {
    const icon = HEART_HUD[id as HeartKind];
    const rows = icon.rows, pw = rows[0].length, ph = rows.length, k = fit(pw, ph);
    pic = document.createElement('canvas');
    pic.width = pw * k; pic.height = ph * k;
    const p = pic.getContext('2d')!;
    rows.forEach((r, yy) => [...r].forEach((ch, xx) => {
      const tok = icon.palette[ch];
      if (!tok) return;
      p.fillStyle = css(tok); p.fillRect(xx * k, yy * k, k, k);
    }));
  } else {
    const def = kind === 'item' ? ITEM_BY_ID.get(id) : flaskDef({ potion: id as PotionId });
    if (!def) { placeholder(g, x, y, w, h); return; }
    pic = iconCanvas(def, fit(14, 14));
  }
  const px = Math.round(x + (w - pic.width) / 2), py = Math.round(y + (h - pic.height) / 2 - h * 0.03);
  g.save();
  g.globalAlpha = 0.22; g.fillStyle = css('limestone.dark');
  g.beginPath(); g.ellipse(x + w / 2, py + pic.height + h * 0.045, pic.width * 0.42, h * 0.035, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.imageSmoothingEnabled = false;
  g.drawImage(pic, px, py);
  g.imageSmoothingEnabled = true;
}

/** A message in a language (the book's language), falling back to English. */
function message(lang: Lang, key: string): string {
  return bookMessage(lang, key) ?? bookMessage('en', key) ?? key;
}

/** A text with its `{placeholders}` filled with the device's control labels in the book's language. */
function filled(text: string, voice: PanelVoice): string {
  return fillControls(text, action => message(voice.lang, controlLabelKey(action, voice.device)));
}

/** Draws wrapped lines from (x, top) with a line height. */
function carveLines(g: CanvasRenderingContext2D, lines: readonly string[], x: number, top: number, lh: number, ink: PalToken, lip = true) {
  lines.forEach((line, i) => carveText(g, line, x, top + i * lh, ink, lip));
}

/** A one-line field, shrunk to fit; reports its name when even the smallest size does not fit. */
function oneLine(
  g: CanvasRenderingContext2D, field: string, text: string, x: number, top: number, maxW: number,
  range: SizeRange, style: string, family: string, ink: PalToken, over: string[], align: 'left' | 'right' | 'center' = 'left', lip = true,
): number {
  const fit = fitLine(text, maxW, range, measurer(g, style, family));
  if (!fit.fits) over.push(field);
  font(g, style, fit.px, family);
  g.textAlign = align;
  carveText(g, text, x, top, ink, lip);
  g.textAlign = 'left';
  return fit.px;
}

/** A wrapped field: lines at a size, shrunk within its range; reports its name when it runs past its last line. */
function block(
  g: CanvasRenderingContext2D, field: string, text: string, x: number, top: number, width: number, maxLines: number,
  range: SizeRange, lineRatio: number, style: string, family: string, ink: PalToken, over: string[], lip = true,
) {
  const fit = fitBlock(text, width, maxLines, range, measurer(g, style, family));
  if (!fit.fits) over.push(field);
  font(g, style, fit.px, family);
  carveLines(g, fit.lines, x, top, Math.round(fit.px * lineRatio), ink, lip);
}

// ── the four layouts (PANELS §2–§4b; every number below is the canvas geometry of that section) ──

function carveLesson(g: CanvasRenderingContext2D, p: Extract<Panel, { layout: 'lesson' }>, voice: PanelVoice, images: PanelImages, over: string[], missing: ImageId[]) {
  if (!framedImage(g, p.image, 40, 40, 280, 432, images)) missing.push(p.image);
  diamond(g, 356, 74, 12);
  oneLine(g, 'title', p.title, 380, 48, 476, { from: 52, to: 40 }, 'bold', SANS, 'ink.line', over);
  carveRule(g, 352, 116, 504, 4);
  block(g, 'text', filled(p.text, voice), 352, 136, 504, 5, { from: 34, to: 34 }, 44 / 34, '', SANS, 'ink.line', over);
  if (p.key) keyCap(g, p.key, voice, over);
}

/** The control as a key cap with its verb beside it (PANELS §2). */
function keyCap(g: CanvasRenderingContext2D, action: NonNullable<Extract<Panel, { layout: 'lesson' }>['key']>, voice: PanelVoice, over: string[]) {
  const x = 352, y = 384, h = 80;
  const glyph = keycapGlyph(action, voice.device);
  const label = message(voice.lang, keycapLabelKey(action, voice.device));
  const labelFit = fitLine(label, 280 - 48, { from: 36, to: 24 }, measurer(g, 'bold', SANS));
  if (!glyph && !labelFit.fits) over.push('key cap');
  font(g, 'bold', labelFit.px, SANS);
  const w = glyph ? 150 : keycapWidth(g.measureText(label).width);
  // the cap: a pale block standing out of the stone, its own shadow on the face, a darker lower wall
  g.save();
  g.globalAlpha = 0.35; g.fillStyle = css('ink.line');
  roundRect(g, x + 4, y + 6, w, h, 12); g.fill();
  g.restore();
  g.fillStyle = css('ink.line'); roundRect(g, x, y, w, h, 12); g.fill();
  g.fillStyle = css('ink.bevel'); roundRect(g, x + 4, y + 4, w - 8, h - 8, 9); g.fill();
  g.fillStyle = css('limestone.hi'); roundRect(g, x + 4, y + 4, w - 8, h - 8 - 6, 9); g.fill();
  if (glyph) halfTurn(g, x + w / 2 + 22, y + (h - 6) / 2 + 2, 1.2, 'ink.line');
  else {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = css('ink.line');
    g.fillText(label, x + w / 2, y + (h - 6) / 2 + 2);
    g.textAlign = 'left';
  }
  const verb = message(voice.lang, keycapVerbKey(action));
  const vx = x + w + 20;
  const fit = fitLine(verb, 856 - vx, { from: 30, to: 22 }, measurer(g, 'bold', SANS));
  if (!fit.fits) over.push('verb');
  font(g, 'bold', fit.px, SANS);
  carveText(g, verb, vx, y + h / 2 - fit.px * 0.55, 'ink.bevel');
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function carvePlate(g: CanvasRenderingContext2D, p: Extract<Panel, { layout: 'plate' }>, voice: PanelVoice, images: PanelImages, over: string[], missing: ImageId[]) {
  if (!framedImage(g, p.image, 40, 40, 360, 432, images)) missing.push(p.image);
  diamond(g, 444, 74, 12);
  oneLine(g, 'title', p.title, 468, 48, 388, { from: 48, to: 32 }, 'bold', SANS, 'ink.line', over);
  oneLine(g, 'subtitle', p.subtitle, 432, 108, 424, { from: 28, to: 22 }, 'italic', SANS, 'ink.bevel', over);
  carveRule(g, 432, 150, 424, 4);
  block(g, 'text', filled(p.text, voice), 432, 170, 424, 5, { from: 30, to: 30 }, 40 / 30, '', SANS, 'ink.line', over);
  if (p.note) {
    diamond(g, 442, 424, 8);
    oneLine(g, 'note', p.note, 458, 408, 398, { from: 24, to: 20 }, 'bold', SANS, 'ink.line', over);
  }
}

function carveProse(g: CanvasRenderingContext2D, p: Extract<Panel, { layout: 'prose' }>, page: number, over: string[]) {
  // the gold margin line, cut a little into the stone
  g.fillStyle = css('light.gold'); g.fillRect(64, 48, 6, 416);
  g.save(); g.globalAlpha = 0.35; g.fillStyle = css('light.dusk'); g.fillRect(68, 48, 2, 416); g.restore();
  // a drop cap two lines high opens the page when it starts with a letter
  const first = [...p.text][0] ?? '';
  const drop = /\p{L}/u.test(first);
  const px = 32, lh = 44, x = 96, top = 56, width = 744;
  let rest = p.text, indent = 0;
  if (drop) {
    rest = p.text.slice(first.length);
    font(g, 'bold', 92, SERIF);
    indent = Math.ceil(g.measureText(first).width) + 12;
    g.textBaseline = 'alphabetic';
    g.save(); g.globalAlpha = 0.55; g.fillStyle = css('limestone.hi'); g.fillText(first, x + 1, top + lh + 26 + 2); g.restore();
    g.fillStyle = css('ink.line'); g.fillText(first, x, top + lh + 26);
  }
  const measureAt = measurer(g, '', SERIF);
  const fit = fitBlock(rest, width, 8, { from: px, to: px }, measureAt, { first: indent, lines: drop ? 2 : 0 });
  if (!fit.fits) over.push('text');
  font(g, '', fit.px, SERIF);
  fit.lines.forEach((line, i) => carveText(g, line, x + (i < 2 ? indent : 0), top + i * lh, 'ink.line'));
  // the page number between two small gold diamonds
  font(g, 'bold', 30, SERIF);
  g.textAlign = 'center';
  carveText(g, String(page), 448, 436, 'ink.bevel');
  g.textAlign = 'left';
  const half = Math.max(44, g.measureText(String(page)).width / 2 + 22);
  diamond(g, 448 - half, 452, 6);
  diamond(g, 448 + half, 452, 6);
}

function carveQuote(g: CanvasRenderingContext2D, p: Extract<Panel, { layout: 'quote' }>, voice: PanelVoice, over: string[]) {
  // the inset page: paler, set into the face, its border in the bevel ink and a shadow along its top and left
  // (34 to 458, a little higher and shorter than PANELS §4b's first proposal, so the mason's mark fits under it)
  g.fillStyle = css('ink.bevel'); g.fillRect(40, 34, 816, 424);
  g.fillStyle = css('limestone.hi'); g.fillRect(42, 36, 812, 420);
  g.save();
  const top = g.createLinearGradient(0, 36, 0, 48);
  top.addColorStop(0, css('limestone.dark')); top.addColorStop(1, 'transparent');
  g.globalAlpha = 0.5; g.fillStyle = top; g.fillRect(42, 36, 812, 12);
  const left = g.createLinearGradient(42, 0, 54, 0);
  left.addColorStop(0, css('limestone.dark')); left.addColorStop(1, 'transparent');
  g.fillStyle = left; g.fillRect(42, 36, 12, 420);
  g.restore();
  // the large opening mark: a glyph in gold with an ink keyline, so it holds on the pale page
  font(g, 'bold', 96, SERIF);
  g.textBaseline = 'top';
  g.lineWidth = 3; g.strokeStyle = css('ink.bevel'); g.strokeText('“', 52, 30);
  g.fillStyle = css('light.gold'); g.fillText('“', 52, 30);
  block(g, 'text', p.text, 112, 58, 712, 9, { from: 28, to: 28 }, 38 / 28, 'italic', SERIF, 'ink.line', over, false);
  oneLine(g, 'author', authorLine(p.author), 824, 398, 712, { from: 26, to: 20 }, 'bold', SANS, 'ink.line', over, 'right', false);
  oneLine(g, 'source', quoteSource(p), 824, 428, 440, { from: 22, to: 18 }, 'italic', SANS, 'ink.bevel', over, 'right', false);
  if (showsTranslationNote(voice.lang, p)) {
    oneLine(g, 'translation note', message(voice.lang, 'book.quote.translated'), 64, 430, 300, { from: 20, to: 20 }, '', SANS, 'ink.bevel', over, 'left', false);
  }
}

/**
 * Carves a whole panel on a 896 × 512 context: the slab, its layout and the mason's mark. Pure drawing: it
 * waits for nothing, so a missing or unloaded image is drawn as a placeholder and listed in the report.
 */
export function carvePanel(g: CanvasRenderingContext2D, panel: Panel, page: number, voice: PanelVoice, images: PanelImages = panelImages): PanelReport {
  const over: string[] = [], missing: ImageId[] = [];
  g.save();
  g.textAlign = 'left';
  carveSlab(g, panel.id);
  if (panel.layout === 'lesson') carveLesson(g, panel, voice, images, over, missing);
  else if (panel.layout === 'plate') carvePlate(g, panel, voice, images, over, missing);
  else if (panel.layout === 'prose') carveProse(g, panel, page, over);
  else carveQuote(g, panel, voice, over);
  masonMark(g, panel.id);
  g.restore();
  return { id: panel.id, overflow: over, missing };
}

/**
 * A half turn of the phone, the touch control for the polarity: a landscape phone under an arrow that sweeps
 * over it, clockwise, from one side to the other (90° to 270°), with the angle beside it. `ink` defaults to the
 * gold of today's tablets; the key cap draws it in ink.
 */
export function halfTurn(g: CanvasRenderingContext2D, cx: number, cy: number, scale = 1, ink: PalToken = 'light.gold') {
  const r = 22, start = Math.PI * 1.15, end = Math.PI * 1.85;
  g.save();
  g.translate(cx, cy); g.scale(scale, scale);
  g.strokeStyle = css(ink); g.fillStyle = css(ink);
  g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, r, start, end); g.stroke();
  // the arrowhead at the end of the sweep, pointing along the curve
  const tx = -Math.sin(end), ty = Math.cos(end), nx = Math.cos(end), ny = Math.sin(end);
  const hx = r * nx, hy = r * ny;
  g.beginPath();
  g.moveTo(hx + tx * 8, hy + ty * 8);
  g.lineTo(hx - tx * 4 + nx * 7, hy - ty * 4 + ny * 7);
  g.lineTo(hx - tx * 4 - nx * 7, hy - ty * 4 - ny * 7);
  g.closePath(); g.fill();
  // the phone, in landscape, the way it is held to play
  g.lineWidth = 2.5;
  g.strokeRect(-9, -6, 18, 12);
  g.font = `bold 16px ${SANS}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillText('180°', -r - 8, 0);
  g.restore();
}

// ── the slots on the walls ──

/** What a slot shows: a book panel and the page it belongs to. */
interface Shown { readonly panel: Panel; readonly page: number }

interface Slot {
  readonly mesh: THREE.Mesh;
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  readonly room: RoomKey;
  readonly side: Side;
  shown?: Shown;
  /** Bumped by every show: a load that finishes after a newer show is dropped. */
  token: number;
}

let scratch: HTMLCanvasElement | undefined;
/** The offscreen canvas every panel is carved on before it is copied to its slot in one step. */
function scratchCanvas(w: number, h: number): HTMLCanvasElement {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
  return scratch;
}

/**
 * The panels on the walls of the Roots.
 *
 * - `mountRoom(room, x0, y0, z0, variant)` hangs a room's two slots at their mounts of a layout variant (PANELS §6,
 *   EASY-LAYOUT §5); they stay invisible until their first panel is carved. Calling it again moves them.
 * - `show(room, side, panel, page)` carves a panel offscreen and swaps it in. If its image is already loaded
 *   (`panelImages.preloadPage`) the swap happens inside the call; otherwise the old panel stays until the image
 *   settles. The promise gives the carving's report.
 * - `redraw()` carves every slot again in the player's language and device (the same panel id, from the other
 *   language's book).
 */
export class Tablets {
  private slots = new Map<string, Slot>();
  private group = new THREE.Group();
  private disposed = false;

  constructor(private scene: THREE.Object3D, private readonly images: PanelImages = panelImages) { scene.add(this.group); }

  /**
   * Hangs the two slots of a Roots room whose interior corner is (x0, y0, z0), at the mounts of its layout
   * variant (MOUNT_TABLES). Calling it again moves them.
   */
  mountRoom(room: RoomKey, x0: number, y0: number, z0: number, variant: MountVariant = 'teaching') {
    for (const side of SIDES) {
      const key = `${room}:${side}`;
      const old = this.slots.get(key);
      if (old) this.free(old);
      this.slots.set(key, this.makeSlot(panelMount(room, side, x0, y0, z0, variant), PANEL_W, PANEL_H, room, side));
    }
  }

  /** What a slot shows now: the panel and its page, or undefined while it is still blank. */
  shownAt(room: RoomKey, side: Side): Shown | undefined {
    return this.slots.get(`${room}:${side}`)?.shown;
  }

  /**
   * Carves `panel` for page `page` into the slot of `room` and `side` and swaps it in, in the given voice (the
   * player's language and device by default). Throws if the room was not mounted.
   */
  show(room: RoomKey, side: Side, panel: Panel, page: number, voice: PanelVoice = currentVoice()): Promise<PanelReport> {
    const slot = this.slots.get(`${room}:${side}`);
    if (!slot) throw new Error(`Tablets.show: ${room} is not mounted`);
    const token = ++slot.token;
    const ids = panelImageIds(panel);
    const carve = () => this.carveInto(slot, { panel, page }, voice);
    if (this.images.settled(ids)) return Promise.resolve(carve());
    return this.images.preload(ids).then(() => (token === slot.token && !this.disposed ? carve() : { id: panel.id, overflow: [], missing: [] }));
  }

  /** The language or the device changed: carve every slot again (the same panel ids, from that language's book). */
  redraw() {
    const voice = currentVoice();
    let book: Book | undefined;
    for (const slot of this.slots.values()) {
      const s = slot.shown;
      if (!s) continue;
      book ??= loadBook(voice.lang);
      void this.show(slot.room, slot.side, panelById(book, s.panel.id) ?? s.panel, s.page, voice);
    }
  }

  dispose() {
    this.disposed = true;
    for (const slot of this.slots.values()) this.free(slot);
    this.slots.clear();
    this.scene.remove(this.group);
  }

  private makeSlot(m: Mount, w: number, h: number, room: RoomKey, side: Side): Slot {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshBasicMaterial({ map: texture }));
    mesh.position.set(m.x, m.y, m.z);
    mesh.rotation.y = m.rotY;
    mesh.visible = false;
    this.group.add(mesh);
    return { mesh, canvas, texture, room, side, token: 0 };
  }

  /** Carves offscreen, then copies onto the slot's canvas and flags the texture, in one synchronous step. */
  private carveInto(slot: Slot, shown: Shown, voice: PanelVoice): PanelReport {
    const off = scratchCanvas(slot.canvas.width, slot.canvas.height);
    const report = carvePanel(off.getContext('2d')!, shown.panel, shown.page, voice, this.images);
    slot.canvas.getContext('2d')!.drawImage(off, 0, 0);
    slot.texture.needsUpdate = true;
    slot.shown = shown;
    slot.mesh.visible = true;
    return report;
  }

  private free(slot: Slot) {
    slot.token++;
    slot.texture.dispose();
    slot.mesh.geometry.dispose();
    (slot.mesh.material as THREE.Material).dispose();
    this.group.remove(slot.mesh);
  }
}
