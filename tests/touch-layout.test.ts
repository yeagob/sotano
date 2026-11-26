// The contextual touch controls (issue #376, src/input/touch-layout.ts): the set rests hidden with no touch,
// a touch brings it up, it leaves after TOUCH_IDLE_MS, keyboard and gamepad never see it, and every target
// is at least the minimum size on every checked phone. Pure logic: the DOM layer needs a browser.

import { describe, expect, it } from 'vitest';
import { BINDINGS, DEVICES, type Context } from '../src/input/bindings';
import {
  CHECK_VIEWPORTS, REST_SET, SLOT, TOUCH_CORE_MIN_PX, TOUCH_IDLE_MS, TOUCH_LAYOUT, TOUCH_TARGET_MIN_PX, TouchPresence,
  slotFor, slotRect, slotStyle, slotVisible, touchLayerShown, type Rect,
} from '../src/input/touch-layout';

const CONTEXTS: Context[] = ['play', 'prompt', 'paused', 'dead', 'inventory', 'toll', 'meditation'];
const visibleSet = (awake: boolean) => TOUCH_LAYOUT.filter(s => slotVisible(s, true, awake)).map(s => s.id);
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('touch controls: when they are on screen', () => {
  it('with no touch only the rest set shows: the tab button (and fullscreen when out of it)', () => {
    expect(REST_SET).toEqual(['inventory', 'fullscreen']);
    const p = new TouchPresence();
    expect(p.awake(0, false)).toBe(false);
    expect(visibleSet(p.awake(0, false))).toEqual(['inventory', 'fullscreen']);
  });

  it('a touch shows the whole set', () => {
    const p = new TouchPresence();
    p.wake(1000);
    expect(p.awake(1001, false)).toBe(true);
    expect(visibleSet(true)).toEqual(TOUCH_LAYOUT.map(s => s.id));
  });

  it('it hides TOUCH_IDLE_MS after the last touch, and a held touch keeps it up', () => {
    expect(TOUCH_IDLE_MS).toBe(3000);
    const p = new TouchPresence();
    p.wake(1000);
    expect(p.awake(1000 + TOUCH_IDLE_MS - 1, false)).toBe(true);
    expect(p.awake(1000 + TOUCH_IDLE_MS, false)).toBe(false);
    expect(p.awake(1000 + 10 * TOUCH_IDLE_MS, true)).toBe(true);
    p.wake(5000);
    expect(p.awake(5000 + TOUCH_IDLE_MS - 1, false)).toBe(true);
    p.sleep();
    expect(p.awake(5001, false)).toBe(false);
  });

  it('keyboard, mouse and gamepad never see the touch layer, in any context', () => {
    for (const d of DEVICES) for (const c of CONTEXTS) {
      expect(touchLayerShown(d, c), `${d} ${c}`).toBe(d === 'touch' && (c === 'play' || c === 'prompt'));
    }
    for (const s of TOUCH_LAYOUT) expect(slotVisible(s, false, true), s.id).toBe(false);
  });

  it('every touch button of the bindings has exactly one slot, and the mapping is unchanged', () => {
    const buttons = BINDINGS.filter(b => b.touch.control === 'button' || b.touch.control === 'systemButton');
    for (const b of buttons) expect(slotFor(b.action), b.action).toBeDefined();
    for (const s of TOUCH_LAYOUT) if (s.action) expect(buttons.map(b => b.action), s.id).toContain(s.action);
    for (const b of BINDINGS) expect(b.keyboard, b.action).toBeDefined();
  });
});

describe('touch layout: targets on every checked phone', () => {
  for (const [w, h] of CHECK_VIEWPORTS) {
    it(`${w} × ${h}: every target is at least ${TOUCH_TARGET_MIN_PX} px, jump and the bead at least ${TOUCH_CORE_MIN_PX} px`, () => {
      for (const s of TOUCH_LAYOUT) {
        const r = slotRect(s, w, h);
        expect(Math.min(r.w, r.h), s.id).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN_PX);
        if (s.id === 'jump' || s.id === 'cast') expect(r.w, s.id).toBeGreaterThanOrEqual(TOUCH_CORE_MIN_PX);
      }
    });

    it(`${w} × ${h}: buttons stay on screen, apart, off the stick zone and off the minimap`, () => {
      const minimap: Rect = { x: w - 10 - 138, y: 8, w: 138, h: 138 };
      const rects = TOUCH_LAYOUT.map(s => [s.id, slotRect(s, w, h)] as const);
      for (const [id, r] of rects) {
        expect(r.x, id).toBeGreaterThanOrEqual(0);
        expect(r.y, id).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, id).toBeLessThanOrEqual(w);
        expect(r.y + r.h, id).toBeLessThanOrEqual(h);
        if (id !== 'stick') {
          expect(r.x, `${id} in the stick zone`).toBeGreaterThanOrEqual(w * 0.42);
          expect(overlap(r, minimap), `${id} on the minimap`).toBe(false);
        }
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        expect(overlap(rects[i][1], rects[j][1]), `${rects[i][0]} / ${rects[j][0]}`).toBe(false);
      }
    });
  }

  it('the CSS keeps the floor and the safe areas', () => {
    const st = slotStyle(SLOT.cast);
    expect(st.width).toBe('max(72px, 23vmin)');
    expect(st.right).toContain('env(safe-area-inset-right)');
    expect(slotStyle(SLOT.fullscreen).right).toContain('max(48px, 11vmin)');
  });
});
