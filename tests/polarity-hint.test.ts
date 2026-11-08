// The polarity hint: good intentions in a row that find nothing to mend on one block (issue #101).
import { describe, expect, it } from 'vitest';
import { PolarityHint } from '../src/game/polarity-hint';

function run(h: PolarityHint, n: number, block: number, device: 'touch' | 'keyboard' | 'gamepad', aboveZero: boolean) {
  return Array.from({ length: n }, () => h.idle(block, device, aboveZero));
}

describe('the polarity hint on a phone', () => {
  it('shows at the third idle good intention on one block', () => {
    expect(run(new PolarityHint(), 3, 7, 'touch', false)).toEqual([false, false, true]);
  });

  it('shows again each time three more intentions find nothing to mend on that block', () => {
    const h = new PolarityHint();
    const shown = run(h, 9, 7, 'touch', false).map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
    expect(shown).toEqual([3, 6, 9]);
  });

  it('repeats without a limit underground', () => {
    const h = new PolarityHint();
    const shown = run(h, 300, 7, 'touch', false).filter(Boolean).length;
    expect(shown).toBe(100);
  });

  it('counts one block at a time', () => {
    const h = new PolarityHint();
    expect(run(h, 2, 1, 'touch', false)).toEqual([false, false]);
    expect(run(h, 2, 2, 'touch', false)).toEqual([false, false]);
    expect(run(h, 1, 1, 'touch', false)).toEqual([false]);
    expect(run(h, 2, 1, 'touch', false)).toEqual([false, true]);
  });

  it('a mended block starts the count again', () => {
    const h = new PolarityHint();
    expect(run(h, 2, 3, 'touch', false)).toEqual([false, false]);
    h.mended();
    expect(run(h, 3, 3, 'touch', false)).toEqual([false, false, true]);
  });

  it('never shows above ground, and shows once it is underground again', () => {
    const h = new PolarityHint();
    expect(run(h, 10, 5, 'touch', true).some(Boolean)).toBe(false);
    expect(h.idle(5, 'touch', false)).toBe(true);
  });

  it('a new run starts the count again', () => {
    const h = new PolarityHint();
    run(h, 2, 4, 'touch', false);
    h.reset();
    expect(run(h, 2, 4, 'touch', false)).toEqual([false, false]);
  });
});

describe('the polarity hint on a keyboard or a pad', () => {
  it('shows once per run', () => {
    const h = new PolarityHint();
    expect(run(h, 6, 7, 'keyboard', false)).toEqual([false, false, true, false, false, false]);
  });

  it('is not shown again once the player has switched polarity themselves', () => {
    const h = new PolarityHint();
    h.learned();
    expect(run(h, 3, 7, 'gamepad', false)).toEqual([false, false, false]);
  });

  it('shows again in a new run', () => {
    const h = new PolarityHint();
    expect(run(h, 3, 7, 'keyboard', false).filter(Boolean)).toHaveLength(1);
    h.reset();
    expect(run(h, 3, 7, 'keyboard', false)).toEqual([false, false, true]);
  });
});
