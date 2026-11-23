// Each meal the kitchen can cook has its own icon and its own in-hand card (issue #291), and the
// label that names a crafted meal exists in both languages (issue #290).
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { PALETTE } from '../src/content/palette';
import { flaskDef, flaskIcon, POTION_IDS, POTIONS } from '../src/content/potions';
import { mealOf } from '../src/game/kitchen';
import { PART_KINDS } from '../src/content/parts';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const tokenOf = new Map(Object.entries(PALETTE).map(([t, h]) => [parseInt(h.slice(1), 16), t]));
const mask = (rows: readonly string[]) => rows.join('').split('').map(c => c !== '.');
const iou = (a: boolean[], b: boolean[]) => {
  let and = 0, or = 0;
  for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) and++; if (a[k] || b[k]) or++; }
  return and / or;
};

/** The kitchen's meals: whatever a part kind cooks into (game/kitchen.ts mealOf). */
const COOKABLE = [...new Set(PART_KINDS.map(k => mealOf(k)))];
const MEALS = POTION_IDS.filter(id => POTIONS[id].meal);

describe('meal icons (issue #291)', () => {
  it('the kitchen cooks two meals, and both are meals in the catalogue', () => {
    expect(COOKABLE.sort()).toEqual(['meal-hearty', 'meal-small']);
    for (const id of COOKABLE) expect(POTIONS[id].meal, id).toBe(true);
  });

  it('every cookable meal has its own 12 by 12 icon, not the potion bottle', () => {
    const bottle = flaskIcon('plain-tonic').rows.join();
    for (const id of COOKABLE) {
      const icon = flaskIcon(id);
      expect(icon.rows, id).toHaveLength(12);
      for (const row of icon.rows) expect(row.length, `${id}: ${row}`).toBe(12);
      expect(icon.rows.join(), id).not.toBe(bottle);
    }
    expect(flaskIcon('meal-small').rows.join()).not.toBe(flaskIcon('meal-hearty').rows.join());
  });

  it('every meal icon uses palette tokens only, at most four colours, and no life, cold or light token', () => {
    for (const id of MEALS) {
      const cols = new Set(Object.values(flaskIcon(id).palette));
      expect(cols.size, `${id}: colours`).toBeLessThanOrEqual(4);
      for (const c of cols) {
        expect(tokenOf.has(c), `${id}: ${c.toString(16)} is not a palette token`).toBe(true);
      }
      for (const [ch, c] of Object.entries(flaskIcon(id).palette)) {
        const name = tokenOf.get(c)!;
        expect(name.startsWith('life.') || name.startsWith('cold.') || name.startsWith('light.'), `${id}: ${ch} is ${name}`).toBe(false);
      }
    }
  });

  it('each meal icon fills at least 40 of its 144 pixels and touches no border (DECISIONS §10.1)', () => {
    for (const id of MEALS) {
      const rows = flaskIcon(id).rows;
      const filled = mask(rows).filter(Boolean).length;
      expect(filled, `${id}: fill`).toBeGreaterThanOrEqual(40);
      const edges = [rows[0], rows[11], rows.map(r => r[0]).join(''), rows.map(r => r[11]).join('')];
      for (const e of edges) expect(/[^.]/.test(e), `${id}: touches a border`).toBe(false);
    }
  });

  it('each cookable meal reads as its own silhouette against every item icon (alpha-mask IoU < 0.8)', () => {
    for (const id of COOKABLE) {
      const m = mask(flaskIcon(id).rows);
      for (const d of ITEMS) expect(iou(m, mask(d.icon.rows)), `${id} vs ${d.id}`).toBeLessThan(0.8);
    }
    expect(iou(mask(flaskIcon('meal-small').rows), mask(flaskIcon('meal-hearty').rows))).toBeLessThan(0.8);
  });

  it('the in-hand card of a meal carries the meal icon, and a meal is not a potion of the same id', () => {
    for (const id of COOKABLE) {
      const def = flaskDef({ potion: id });
      expect(def.icon).toEqual(flaskIcon(id));
      expect(def.id).toBe(`flask.${id}`);
    }
  });
});

describe('the crafted label (issue #290)', () => {
  it('the cooked toast names the meal in English and Spanish', () => {
    expect(EN.messages['kitchen.cooked']).toContain('{name}');
    expect(ES.messages['kitchen.cooked']).toContain('{name}');
  });

  it('each meal has its name in both languages, so the label can show it', () => {
    for (const id of COOKABLE) {
      expect(EN.messages[POTIONS[id].name], id).toBeTruthy();
      expect(ES.messages[POTIONS[id].name], id).toBeTruthy();
    }
  });
});
