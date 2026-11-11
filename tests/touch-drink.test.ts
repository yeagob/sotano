// The mobile drink button (src/input/touch.ts, drinkView): shown only while a flask is on top of the hand,
// the same flask Game.drink() drinks. Pure logic only: the DOM layer needs a browser, the rules do not.

import { describe, expect, it } from 'vitest';
import { POTIONS, type Flask, type PotionId } from '../src/content/potions';
import { PALETTE } from '../src/content/palette';
import { drinkView } from '../src/input/touch';

const flask = (potion: PotionId, iced?: true): Flask => (iced ? { potion, iced } : { potion });

describe('mobile drink button: when it is shown', () => {
  it('is hidden with an empty hand', () => {
    expect(drinkView(undefined)).toMatchObject({ show: false, key: '' });
  });

  it('is hidden when a block is on top of the hand', () => {
    expect(drinkView(7).show).toBe(false);
  });

  it('is hidden when a flask sits under a block: only the top of the hand can be drunk', () => {
    const hand = [flask('plain-tonic'), 7];
    expect(drinkView(hand.at(-1)).show).toBe(false);
  });

  it('is shown on gaining a flask as the top of the hand, with its potion and liquid colour', () => {
    const v = drinkView(flask('restoring-draught'));
    expect(v.show).toBe(true);
    expect(v.flask?.potion).toBe('restoring-draught');
    expect(v.liquid).toBe(POTIONS['restoring-draught'].liquid);
  });

  it('is hidden again once the flask is drunk, or the hand is empty after it', () => {
    const hand: (number | Flask)[] = [flask('plain-tonic')];
    expect(drinkView(hand.at(-1)).show).toBe(true);
    hand.pop();
    expect(drinkView(hand.at(-1))).toMatchObject({ show: false, key: '' });
  });

  it('is hidden when the flask is no longer on top after a block is put on it', () => {
    const hand: (number | Flask)[] = [flask('plain-tonic'), 3];
    expect(drinkView(hand.at(-1)).show).toBe(false);
  });
});

describe('mobile drink button: when its look must be redrawn', () => {
  it('changes its key when the flask on top changes (swapping hands)', () => {
    const a = drinkView(flask('plain-tonic')), b = drinkView(flask('ember-tonic'));
    expect(a.key).not.toBe(b.key);
  });

  it('changes its key for an iced flask, which has its own potion strength', () => {
    expect(drinkView(flask('plain-tonic')).key).not.toBe(drinkView(flask('plain-tonic', true)).key);
  });

  it('keeps the same key for the same flask, so it is not redrawn every frame', () => {
    expect(drinkView(flask('meal-small')).key).toBe(drinkView(flask('meal-small')).key);
  });
});

describe('mobile drink button: every potion can be drawn', () => {
  it('every potion has a liquid colour that is a palette token', () => {
    for (const id of Object.keys(POTIONS) as PotionId[]) {
      const v = drinkView(flask(id));
      expect(v.liquid).toBeDefined();
      expect(PALETTE[v.liquid!]).toBeDefined();
    }
  });
});
