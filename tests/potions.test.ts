import { describe, expect, it } from 'vitest';
import { HEART } from '../src/entities/actors';
import { PARTS } from '../src/content/parts';
import { POTIONS, flaskDef, flaskIcon, isFlask, type PotionId } from '../src/content/potions';
import { RECIPES, brewOf } from '../src/content/recipes';

const part = (kind: 'flesh' | 'heart' | 'mind' | 'essence', source?: string) =>
  PARTS.find(p => p.kind === kind && (source === undefined || p.source === source))!;

describe('potions: what the bulb brews', () => {
  it('two flesh of any patterns brew a Restoring Draught', () => {
    expect(brewOf([part('flesh'), part('flesh')])).toBe('restoring-draught');
    expect(brewOf([part('flesh', 'doubt'), part('flesh', 'critic')])).toBe('restoring-draught');
  });

  it('flesh alone only heals, more the more flesh: one, two or three', () => {
    expect(brewOf([part('flesh')])).toBe('mending-tonic');
    expect(brewOf([3, part('flesh')])).toBe('mending-tonic');
    expect(brewOf([part('flesh', 'doubt'), part('flesh', 'panic'), part('flesh', 'impulse')])).toBe('full-restoring-draught');
    for (const id of ['mending-tonic', 'restoring-draught', 'full-restoring-draught'] as const) {
      expect(POTIONS[id].duration.kind, id).toBe('instant');
      expect(POTIONS[id].stats, id).toBeUndefined();
    }
  });

  it('a bulb of one path brews that path\'s variant for its deepest kind, flesh along with it or not', () => {
    expect(brewOf([part('flesh', 'doubt'), part('heart', 'doubt')])).toBe('lucid-cordial');
    expect(brewOf([part('heart', 'doubt'), part('mind', 'doubt')])).toBe('lucid-cordial');
  });

  it('only a bulb with no part is a Plain Tonic', () => {
    expect(brewOf([3, 3])).toBe('plain-tonic');
    expect(brewOf([3])).toBe('plain-tonic');
  });
});

describe('potions: flesh buys only instant healing, and the Footing Tincture is the one exception', () => {
  it('no timed recipe takes flesh except the Footing Tincture', () => {
    for (const r of RECIPES) {
      const takesFlesh = r.slots.some(s => 'part' in s && s.part === 'flesh');
      const timed = POTIONS[r.potion].duration.kind !== 'instant';
      expect(takesFlesh && timed, r.potion).toBe(r.potion === 'footing-tincture');
    }
  });

  it('the Patient Draught takes a heart and a mind', () => {
    const patient = RECIPES.find(r => r.potion === 'patient-draught')!;
    expect(patient.slots.map(s => 'part' in s && s.part)).toEqual(['heart', 'mind']);
  });
});

describe('potions: what they do', () => {
  it('the Plain Tonic restores half a heart, the Mending Tonic three quarters, the Restoring Draught one heart, the Full Restoring Draught one and a half', () => {
    expect(POTIONS['plain-tonic'].heal).toBe(HEART / 2);
    expect(POTIONS['mending-tonic'].heal).toBe((HEART * 3) / 4);
    expect(POTIONS['restoring-draught'].heal).toBe(HEART);
    expect(POTIONS['full-restoring-draught'].heal).toBe(HEART * 1.5);
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
