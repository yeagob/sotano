// The active carried item (issue #144): the choice moves through the hand without moving an item,
// and every use (place, throw, drink, the alembic, the kitchen) targets the chosen one.

import { describe, expect, it } from 'vitest';
import { Player } from '../src/entities/player';
import { BINDING, BINDINGS, CONTROL_ROWS, contextsFor } from '../src/input/bindings';
import { POTIONS, type PotionId } from '../src/content/potions';

function hand(...items: number[]) {
  const p = new Player();
  p.hand = [...items];
  return p;
}

describe('the active carried item', () => {
  it('is the top of the hand until the player chooses another slot', () => {
    const p = hand(3, 5, 7);
    expect(p.activeIndex).toBe(2);
    expect(p.top).toBe(7);
  });

  it('chooses a slot without moving or consuming anything', () => {
    const p = hand(3, 5, 7);
    p.select(0);
    expect(p.activeIndex).toBe(0);
    expect(p.top).toBe(3);
    expect(p.hand).toEqual([3, 5, 7]);
  });

  it('ignores a slot the hand does not have', () => {
    const p = hand(3, 5);
    p.select(4);
    p.select(-1);
    expect(p.activeIndex).toBe(1);
  });

  it('steps through the hand and wraps round at both ends', () => {
    const p = hand(3, 5, 7);
    p.cycle(1);
    expect(p.activeIndex).toBe(0);
    p.cycle(-1);
    expect(p.activeIndex).toBe(2);
    p.cycle(1);
    expect(p.activeIndex).toBe(0);
  });

  it('takes the active item out of the hand, not the top, and goes back to the top', () => {
    const p = hand(3, 5, 7);
    p.select(1);
    expect(p.takeActive()).toBe(5);
    expect(p.hand).toEqual([3, 7]);
    expect(p.activeIndex).toBe(1);
    expect(p.top).toBe(7);
  });

  it('a new carry goes on top and becomes the active item', () => {
    const p = hand(3, 5);
    p.select(0);
    p.gain(9);
    expect(p.hand).toEqual([3, 5, 9]);
    expect(p.activeIndex).toBe(2);
  });

  it('an item leaving before the active one keeps the choice on the same item', () => {
    const p = hand(3, 5, 7, 9);
    p.select(2); // the 7
    expect(p.removeAt(0)).toBe(3);
    expect(p.active).toBe(7);
    expect(p.activeIndex).toBe(1);
  });

  it('an item leaving after the active one leaves the choice where it is', () => {
    const p = hand(3, 5, 7, 9);
    p.select(1); // the 5
    p.removeAt(3);
    expect(p.active).toBe(5);
    expect(p.activeIndex).toBe(1);
  });

  it('losing the active item itself sends the choice back to the last valid slot', () => {
    const p = hand(3, 5, 7);
    p.select(0);
    p.removeAt(0);
    expect(p.hand).toEqual([5, 7]);
    expect(p.activeIndex).toBe(1);
    expect(p.active).toBe(7);
  });

  it('removing from a hand with no choice keeps the top as the active item', () => {
    const p = hand(3, 5, 7);
    p.removeAt(0);
    expect(p.active).toBe(7);
  });

  it('an empty hand has no active item and no material on top', () => {
    const p = hand();
    expect(p.activeIndex).toBe(-1);
    expect(p.active).toBeUndefined();
    expect(p.takeActive()).toBeUndefined();
    expect(p.top).toBe(0);
    p.cycle(1);
    expect(p.activeIndex).toBe(-1);
  });

  it('a flask on top is active but has no block material', () => {
    const p = hand(3);
    p.gain({ potion: Object.keys(POTIONS)[0] as PotionId });
    expect(p.top).toBe(0);
    expect(p.activeIndex).toBe(1);
    expect(p.active).toEqual({ potion: Object.keys(POTIONS)[0] });
  });
});

describe('the carried-item controls', () => {
  it('the wheel steps the choice and the D-pad steps it too, in play only', () => {
    expect(BINDING.previous.keyboard.wheel).toBe(-1);
    expect(BINDING.next.keyboard.wheel).toBe(1);
    expect(BINDING.previous.gamepad.buttons).toEqual([14]);
    expect(BINDING.next.gamepad.buttons).toEqual([15]);
    for (const a of ['previous', 'next'] as const) expect(contextsFor(BINDING[a], 'keyboard')).toEqual(['play']);
  });

  it('number keys 1 to 9 pick a slot in play and in the inventory, Enter and A pick the highlighted one', () => {
    const keys = BINDING.pick.keyboard.keys ?? [];
    expect(keys).toHaveLength(10);
    expect(keys).toContain('Digit1');
    expect(keys).toContain('Digit9');
    expect(keys).toContain('Enter');
    expect(contextsFor(BINDING.pick, 'keyboard')).toEqual(['play', 'inventory']);
    expect(contextsFor(BINDING.pick, 'gamepad')).toEqual(['inventory']);
    expect(contextsFor(BINDING.pick, 'touch')).toEqual(['play', 'inventory']);
  });

  it('the new rows are on the pause card', () => {
    expect(CONTROL_ROWS).toEqual(expect.arrayContaining(['previous', 'next', 'pick']));
    expect(BINDINGS.filter(b => b.touch.control === 'none').map(b => b.action)).toEqual(expect.arrayContaining(['previous', 'next']));
  });
});
