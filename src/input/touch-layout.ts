// The touch layout (issue #376): where every touch button sits, how big it is, and when it is on screen.
// One place for every touch control's place and presence: the bindings (src/input/bindings.ts) say which
// actions have a button; this file says where it goes and whether it rests on screen. Pure data and
// arithmetic, no DOM, so the rules are tested in node (tests/touch-layout.test.ts) and the gallery draws
// the same rectangles (?gallery=touch). Design: docs/architecture/input/TOUCH.md §1.1, art: DECISIONS §14.11.

import type { Action, Device, Context } from './bindings';

/** The smallest touch target, in CSS pixels, for every button (Material 48 dp; Apple asks 44 pt). */
export const TOUCH_TARGET_MIN_PX = 48;
/** The floor of the two buttons used every second (jump and the bead of light). */
export const TOUCH_CORE_MIN_PX = 64;
/** How long the set stays on screen after the last touch ends, in milliseconds. */
export const TOUCH_IDLE_MS = 3000;
/** How long the set takes to fade out (and in), in milliseconds; none with reduced motion. */
export const TOUCH_FADE_MS = 300;

/**
 * `rest`: always on screen while playing on touch (the minimum set: the menu button, and the fullscreen
 * button while the page is not fullscreen). `wake`: comes up on a touch, leaves after TOUCH_IDLE_MS with
 * no touch. A faded `wake` button still answers where it sits, so a thumb that knows the place never misses.
 */
export type TouchTier = 'rest' | 'wake';

/** A length as the sum of viewport units and pixels (resolved by the browser in CSS, by `resolve` here). */
export interface Len { vw?: number; vh?: number; vmin?: number; px?: number; plusSizeOf?: SlotId }

export type SlotId = 'stick' | 'jump' | 'cast' | 'use' | 'bomb' | 'miracle' | 'body' | 'inventory' | 'fullscreen';

export interface TouchSlot {
  id: SlotId;
  /** The action the slot fires; the stick moves, the fullscreen button is not an action. */
  action?: Action;
  /** The actions that share this slot's one button (`touch.shared` in the bindings): the use button (throw and drink), the body button (crouch and dash). */
  shares?: readonly Action[];
  tier: TouchTier;
  /** Distance from the right edge (or the left, for the stick's resting ring) to the button's near side. */
  x: Len & { from: 'right' | 'left' };
  y: Len & { from: 'bottom' | 'top' };
  /** The square's side: `vmin` of the viewport, never under `min` CSS pixels. */
  size: { vmin: number; min: number };
  /** Shown only in some moments (a flask on top, Kairos held, a block in hand, a seed to place, a crouch or dash practice). */
  contextual?: true;
  /** The stick is centred on its point (it floats under the thumb); buttons are placed by their corner. */
  centred?: true;
}

/**
 * The layout. The right thumb's arc round the bead of light (bottom right): jump to its left, the use button
 * above it (throw, or drink with a flask on top), then the contextual body button and miracle above jump, the bomb at the arc's far end. Nothing in the left
 * 42 % (the stick's zone). The top bar sits left of the minimap.
 */
export const TOUCH_LAYOUT: readonly TouchSlot[] = [
  { id: 'stick', tier: 'wake', x: { from: 'left', vw: 18 }, y: { from: 'top', vh: 72 }, size: { vmin: 26, min: 96 }, centred: true },
  { id: 'cast', action: 'cast', tier: 'wake', x: { from: 'right', vw: 5 }, y: { from: 'bottom', vh: 8 }, size: { vmin: 23, min: 72 } },
  { id: 'jump', action: 'jump', tier: 'wake', x: { from: 'right', vw: 5, vmin: 25 }, y: { from: 'bottom', vh: 6 }, size: { vmin: 19, min: TOUCH_CORE_MIN_PX } },
  // the use button (owner, #376): what the active hand holds; it drinks a flask on top, and throws anything else
  { id: 'use', shares: ['throw', 'drink'], tier: 'wake', x: { from: 'right', vw: 5, vmin: 4 }, y: { from: 'bottom', vh: 8, vmin: 25 }, size: { vmin: 15, min: TOUCH_TARGET_MIN_PX }, contextual: true },
  { id: 'miracle', action: 'miracle', tier: 'wake', x: { from: 'right', vw: 5, vmin: 41 }, y: { from: 'bottom', vh: 6, vmin: 21 }, size: { vmin: 14, min: TOUCH_TARGET_MIN_PX }, contextual: true },
  // the body button (#377): crouch and dash share it (context-button.ts), above jump; its action is chosen at the press
  { id: 'body', shares: ['crouch', 'dash'], tier: 'wake', x: { from: 'right', vw: 5, vmin: 25 }, y: { from: 'bottom', vh: 6, vmin: 22 }, size: { vmin: 14, min: TOUCH_TARGET_MIN_PX }, contextual: true },
  { id: 'bomb', action: 'bomb', tier: 'wake', x: { from: 'right', vw: 5, vmin: 46 }, y: { from: 'bottom', vh: 6 }, size: { vmin: 15, min: TOUCH_TARGET_MIN_PX }, contextual: true },
  { id: 'inventory', action: 'inventory', tier: 'rest', x: { from: 'right', px: 150 }, y: { from: 'top', px: 10 }, size: { vmin: 11, min: TOUCH_TARGET_MIN_PX } },
  { id: 'fullscreen', tier: 'rest', x: { from: 'right', px: 158, plusSizeOf: 'inventory' }, y: { from: 'top', px: 10 }, size: { vmin: 11, min: TOUCH_TARGET_MIN_PX }, contextual: true },
];

export const SLOT = Object.fromEntries(TOUCH_LAYOUT.map(s => [s.id, s])) as Record<SlotId, TouchSlot>;

/** The slot of a button action, if it has one (a shared button's slot for the actions it shares). */
export function slotFor(action: Action): TouchSlot | undefined {
  return TOUCH_LAYOUT.find(s => s.action === action || s.shares?.includes(action));
}

/** The buttons on screen with no touch (the minimum set). */
export const REST_SET: readonly SlotId[] = TOUCH_LAYOUT.filter(s => s.tier === 'rest').map(s => s.id);

const inset = (side: string) => `env(safe-area-inset-${side})`;

function lenCss(l: Len, side: string): string {
  const parts = [`${l.vw ?? 0}vw`, `${l.vh ?? 0}vh`, `${l.vmin ?? 0}vmin`, `${l.px ?? 0}px`];
  if (l.plusSizeOf) parts.push(sizeCss(SLOT[l.plusSizeOf]));
  parts.push(inset(side));
  return `calc(${parts.join(' + ')})`;
}

export function sizeCss(s: TouchSlot): string {
  return `max(${s.size.min}px, ${s.size.vmin}vmin)`;
}

/** The inline style of a slot (position, size), with the safe-area insets. */
export function slotStyle(s: TouchSlot): Record<string, string> {
  const size = sizeCss(s);
  const st: Record<string, string> = { width: size, height: size, [s.x.from]: lenCss(s.x, s.x.from), [s.y.from]: lenCss(s.y, s.y.from) };
  if (s.centred) { st.marginLeft = `calc(${size} / -2)`; st.marginTop = `calc(${size} / -2)`; }
  return st;
}

export interface Rect { x: number; y: number; w: number; h: number }

/** A slot's side in CSS pixels on a `w` × `h` viewport. */
export function sizePx(s: TouchSlot, w: number, h: number): number {
  return Math.max(s.size.min, s.size.vmin * Math.min(w, h) / 100);
}

function lenPx(l: Len, w: number, h: number): number {
  const m = Math.min(w, h) / 100;
  return (l.vw ?? 0) * w / 100 + (l.vh ?? 0) * h / 100 + (l.vmin ?? 0) * m + (l.px ?? 0) + (l.plusSizeOf ? sizePx(SLOT[l.plusSizeOf], w, h) : 0);
}

/** A slot's rectangle in CSS pixels on a `w` × `h` viewport with no safe-area insets (tests, the gallery). */
export function slotRect(s: TouchSlot, w: number, h: number): Rect {
  const size = sizePx(s, w, h);
  const ox = lenPx(s.x, w, h), oy = lenPx(s.y, w, h);
  let x = s.x.from === 'left' ? ox : w - ox - size;
  let y = s.y.from === 'top' ? oy : h - oy - size;
  if (s.centred) { x -= size / 2; y -= size / 2; }
  return { x, y, w: size, h: size };
}

/** Landscape phones the layout is checked on (CSS pixels): iPhone SE 1, a small Android, iPhone 12–15, a large Android, an iPad. */
export const CHECK_VIEWPORTS: readonly [number, number][] = [[568, 320], [640, 360], [844, 390], [915, 412], [1024, 768]];

/**
 * When the set is on screen. A touch (start or move) wakes it for TOUCH_IDLE_MS; a held touch keeps it
 * up; a contextual button that appears wakes it too, so a new verb is seen. Times are milliseconds.
 */
export class TouchPresence {
  private until = -Infinity;
  wake(now: number) { this.until = Math.max(this.until, now + TOUCH_IDLE_MS); }
  sleep() { this.until = -Infinity; }
  awake(now: number, held: boolean): boolean { return held || now < this.until; }
}

/** Whether the touch layer is shown at all: only on touch, in play or with a banner. Keyboard, mouse and pad never see it. */
export function touchLayerShown(device: Device, ctx: Context): boolean {
  return device === 'touch' && (ctx === 'play' || ctx === 'prompt');
}

/** Whether a slot is drawn: a `rest` slot whenever the layer is shown, a `wake` slot only while awake. */
export function slotVisible(s: TouchSlot, layerShown: boolean, awake: boolean): boolean {
  return layerShown && (s.tier === 'rest' || awake);
}
