// The practice card (the item banner, sotano-popups §2) and its close rule (issue #375). The rule is pure
// (src/input/gestures.ts), so these tests drive it with plain numbers. The scroll is CSS: a long text overflows its
// card only in a browser's layout, so the test checks the rule that makes the card a scroll container.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TAP_SLOP } from '../src/input/bindings';
import { practiceReleaseCloses } from '../src/input/gestures';

const ON_CLOSE = { startedOnCard: true, endedOnCard: true, endedOnClose: true };
const ON_TEXT = { startedOnCard: true, endedOnCard: true, endedOnClose: false };
const OUTSIDE = { startedOnCard: false, endedOnCard: false, endedOnClose: false };

describe('practice card close rule (#375)', () => {
  it('a tap on the close control closes the card', () => {
    expect(practiceReleaseCloses({ ...ON_CLOSE, travel: 0 })).toBe(true);
  });

  it('a touch that moves inside the card does not close it, even when it ends on the close control', () => {
    expect(practiceReleaseCloses({ ...ON_TEXT, travel: 40 })).toBe(false);
    expect(practiceReleaseCloses({ ...ON_CLOSE, travel: 40 })).toBe(false);
  });

  it('a press that starts on the card and ends elsewhere does not close it', () => {
    expect(practiceReleaseCloses({ startedOnCard: true, endedOnCard: false, endedOnClose: false, travel: 90 })).toBe(false);
  });

  it('a tap on the card text does not close it', () => {
    expect(practiceReleaseCloses({ ...ON_TEXT, travel: 0 })).toBe(false);
  });

  it('a tap outside the card closes it, and a drag outside never does', () => {
    expect(practiceReleaseCloses({ ...OUTSIDE, travel: 0 })).toBe(true);
    expect(practiceReleaseCloses({ ...OUTSIDE, travel: TAP_SLOP })).toBe(true);
    expect(practiceReleaseCloses({ ...OUTSIDE, travel: TAP_SLOP + 1 })).toBe(false);
  });

  it('a mouse drag inside the card, measured by its movement, does not close it', () => {
    expect(practiceReleaseCloses({ ...ON_TEXT, travel: 200 })).toBe(false);
  });
});

describe('practice card scroll (#375)', () => {
  const css = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[[\]"]/g, m => `\\${m}`)} \\{([^}]*)\\}`))?.[1] ?? '';

  it('the card takes the pointer only while the practice card is open', () => {
    expect(rule('#banner[data-practice="true"]')).toMatch(/pointer-events:\s*auto/);
  });

  it('a long text scrolls: the card is a scroll container that touch pans, not the game', () => {
    const body = rule('#banner[data-practice="true"] .ribbon');
    expect(body).toMatch(/max-height:\s*72vh/);
    expect(body).toMatch(/overflow-y:\s*auto/);
    expect(body).toMatch(/overscroll-behavior:\s*contain/);
    expect(body).toMatch(/touch-action:\s*pan-y/);
  });
});
