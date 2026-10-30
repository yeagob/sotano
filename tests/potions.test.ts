import { describe, expect, it } from 'vitest';
import { HEART } from '../src/entities/actors';
import { PARTS } from '../src/content/parts';
import { POTIONS, brewOf, flaskDef, flaskIcon, isFlask, type PotionId } from '../src/content/potions';

const part = (kind: 'flesh' | 'heart' | 'mind' | 'essence', source?: string) =>
  PARTS.find(p => p.kind === kind && (source === undefined || p.source === source))!;

describe('potions: what the bulb brews', () => {
  it('two flesh of any patterns brew a Restoring Draught', () => {
    expect(brewOf([part('flesh'), part('flesh')])).toBe('restoring-draught');
    expect(brewOf([part('flesh', 'doubt'), part('flesh', 'critic')])).toBe('restoring-draught');
  });

  it('anything else is a Plain Tonic: one flesh, flesh with another kind, three things, or a block', () => {
    expect(brewOf([part('flesh')])).toBe('plain-tonic');
    expect(brewOf([part('flesh'), part('heart')])).toBe('plain-tonic');
    expect(brewOf([part('flesh'), part('flesh'), part('flesh')])).toBe('plain-tonic');
    expect(brewOf([part('heart'), part('mind')])).toBe('plain-tonic');
    expect(brewOf([3, 3])).toBe('plain-tonic');
    expect(brewOf([3, part('flesh')])).toBe('plain-tonic');
  });
});

describe('potions: what they do', () => {
  it('the Plain Tonic restores half a heart, the Restoring Draught one heart', () => {
    expect(POTIONS['plain-tonic'].heal).toBe(HEART / 2);
    expect(POTIONS['restoring-draught'].heal).toBe(HEART);
  });

  it('every potion has a flask with a 12 by 12 icon and a definition the hand can show', () => {
    for (const id of Object.keys(POTIONS) as PotionId[]) {
      const icon = flaskIcon(id);
      expect(icon.rows, id).toHaveLength(12);
      for (const row of icon.rows) expect(row.length, `${id} ${row}`).toBe(12);
      const def = flaskDef({ potion: id });
      expect(def.id).toBe(`flask.${id}`);
      expect(def.icon).toEqual(icon);
    }
  });

  it('tells a flask apart from a block and from a part', () => {
    expect(isFlask({ potion: 'plain-tonic' })).toBe(true);
    expect(isFlask(3)).toBe(false);
    expect(isFlask(part('flesh'))).toBe(false);
  });
});
