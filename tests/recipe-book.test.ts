// The Recipe Book and the Book of Secrets (docs/design/built/practices/RECIPE-BOOK.md): the book is read from the
// game's data, so it can never miss a recipe, a meal or a presence that takes something; the practice that opens it;
// and the controls that open it on every device.

import { afterEach, describe, expect, it } from 'vitest';
import { FAMILIES, FLESH_TONICS, RECIPES, ECHO, FALLBACK } from '../src/content/recipes';
import { POTION_IDS, POTIONS, type PotionId } from '../src/content/potions';
import { PART_KINDS, PARTS } from '../src/content/parts';
import { MATERIALS } from '../src/content/materials';
import { PRESENCE_TAKES_ORE, PRESENCE_TALK, PRESENCES, unlocksPresence, type PresenceId } from '../src/content/presences';
import { ITEM_BY_ID } from '../src/content/items';
import { mealOf } from '../src/game/kitchen';
import { recipeBook, recipeBookHtml, recipesKeyOutcome, potionName, type Way } from '../src/game/recipe-book';
import { validateItem } from '../src/items/validate';
import { isHandedOut } from '../src/items/pool';
import { BASE_STATS, STAT_LIMITS, computeStats } from '../src/core/stats';
import { BINDING, CONTROL_ROWS, PAD, contextsFor } from '../src/input/bindings';
import { setLocale, t, type MessageKey } from '../src/i18n';
import type { Carried } from '../src/entities/player';

const book = recipeBook();
const icons = { flask: (id: PotionId) => `flask:${id}`, material: (m: number) => `mat:${m}` };
const page = (id: PotionId) => book.potions.find(p => p.potion === id);

afterEach(() => setLocale('en'));

describe('the Recipe Book covers what the data defines', () => {
  it('every potion of the game has a page: brewed ones in the alembic chapter, meals in the kitchen chapter', () => {
    const shown = [...book.potions.map(p => p.potion), ...book.meals.map(m => m.potion)];
    expect([...shown].sort()).toEqual([...POTION_IDS].sort());
    for (const p of book.potions) expect(p.ways.length, p.potion).toBeGreaterThan(0);
    for (const m of book.meals) expect(POTIONS[m.potion].meal, m.potion).toBe(true);
  });

  it('every named recipe is written on its potion\'s page with all of its slots', () => {
    for (const r of RECIPES) {
      const ways = page(r.potion)!.ways.filter((w): w is Extract<Way, { kind: 'recipe' }> => w.kind === 'recipe');
      const counted = ways.map(w => w.ingredients.reduce((n, g) => n + (g.kind === 'part' ? g.count : 1), 0));
      expect(counted, r.potion).toContain(r.slots.length);
      expect(ways.some(w => (w.patterns ?? null) === (r.patterns ?? null)), r.potion).toBe(true);
    }
  });

  it('every family potion is written with its path and its deepest part', () => {
    for (const [path, kinds] of Object.entries(FAMILIES)) for (const [deepest, id] of Object.entries(kinds)) {
      expect(page(id as PotionId)!.ways, `${path} ${deepest}`).toContainEqual({ kind: 'family', path, deepest });
    }
  });

  it('every flesh tonic is written, the echo and the plain tonic too', () => {
    FLESH_TONICS.forEach((id, i) => {
      const ways = page(id)!.ways;
      const flesh = ways.some(w => w.kind === 'flesh' && w.count === i + 1);
      const recipe = ways.some(w => w.kind === 'recipe' && w.ingredients.length === 1 && w.ingredients[0].kind === 'part'
        && w.ingredients[0].part === 'flesh' && w.ingredients[0].count === i + 1);
      expect(flesh || recipe, id).toBe(true);
    });
    expect(page(ECHO)!.ways).toContainEqual({ kind: 'echo' });
    expect(page(FALLBACK)!.ways).toContainEqual({ kind: 'fallback' });
  });

  it('every part kind cooks into a meal the book names', () => {
    for (const kind of PART_KINDS) {
      const meal = book.meals.find(m => m.potion === mealOf(kind));
      expect(meal?.parts, kind).toContain(kind);
    }
  });

  it('every presence that takes something from the hand has a page, and every page takes something', () => {
    const samples: Carried[] = [...PARTS, ...MATERIALS.map(m => m.id), { potion: 'plain-tonic' }];
    const takers = PRESENCES.map(p => p.id as PresenceId)
      .filter(id => PRESENCE_TAKES_ORE.has(id) || samples.some(c => unlocksPresence(id, c)));
    expect(book.offerings.map(o => o.presence).sort()).toEqual([...takers].sort());
    for (const o of book.offerings) expect(o.takes.length, o.presence).toBeGreaterThan(0);
    expect(takers.length).toBeGreaterThan(0);
  });

  it('the notes read the alembic and the kitchen from their own numbers', () => {
    expect(book.bulb).toBe(3);
    expect(book.brews).toBe(3);
    expect(book.cooks).toBe(3);
  });
});

describe('the Recipe Book on screen', () => {
  it('names every potion, meal and presence in English and in Spanish, with no raw message key', () => {
    for (const lang of ['en', 'es']) {
      setLocale(lang);
      const html = recipeBookHtml(book, icons, 'keyboard');
      for (const p of book.potions) expect(html, `${lang} ${p.potion}`).toContain(potionName(p.potion).replace(/'/g, '&#39;'));
      for (const m of book.meals) expect(html, `${lang} ${m.potion}`).toContain(t(POTIONS[m.potion].name));
      for (const o of book.offerings) expect(html, `${lang} ${o.presence}`).toContain(t(PRESENCE_TALK[o.presence].name).replace(/'/g, '&#39;'));
      expect(html).not.toMatch(/recipes\.[a-z]/);
      expect(html).not.toMatch(/codex\.[a-z]/);
      expect(html).not.toContain('{');
    }
  });

  it('draws every flask with its icon, and closes with the inventory action', () => {
    const html = recipeBookHtml(book, icons, 'gamepad');
    for (const p of book.potions) expect(html).toContain(`flask:${p.potion}`);
    expect(html).toContain('data-act="inventory"');
    expect(html).toContain(t('recipes.close.pad' as MessageKey));
  });

  it('the book key opens the book, and closes it when the book is what the screen shows', () => {
    expect(recipesKeyOutcome(false, 'menu')).toBe('open');
    expect(recipesKeyOutcome(true, 'items')).toBe('open');
    expect(recipesKeyOutcome(true, 'recipes')).toBe('close');
  });
});

describe('the Book of Secrets (the practice that opens the book)', () => {
  const def = ITEM_BY_ID.get('bookofsecrets')!;

  it('is a valid mind practice of one star, handed out only by the Roots', () => {
    expect(def).toBeDefined();
    expect(validateItem(def)).toEqual([]);
    expect(def.tags).toContain('mind');
    expect(def.quality).toBe(1);
    expect(def.pools).toEqual({ roots: 1 });
    expect(isHandedOut(def)).toBe(true);
  });

  it('opens the book through the recipes stat: a 0/1 switch, off by default, on while held', () => {
    expect(BASE_STATS.recipes).toBe(0);
    expect(STAT_LIMITS.recipes).toEqual([0, 1]);
    expect(def.stats).toEqual([{ stat: 'recipes', layer: 'add', value: 1 }]);
    const held = computeStats((def.stats ?? []).map(m => ({ ...m, source: def.id })));
    expect(held.recipes).toBe(1);
    // two copies never push the switch past 1
    const twice = computeStats([...(def.stats ?? []), ...(def.stats ?? [])].map(m => ({ ...m, source: def.id })));
    expect(twice.recipes).toBe(1);
  });
});

describe('the Recipe Book\'s controls (sotano-controls)', () => {
  const b = BINDING.recipes;

  it('J on the keyboard in play, on the pause card and on the screen', () => {
    expect(b.keyboard.keys).toEqual(['KeyJ']);
    for (const c of ['play', 'paused', 'inventory'] as const) expect(contextsFor(b, 'keyboard')).toContain(c);
  });

  it('D-pad Down on a pad, in play only (in the menus the d-pad navigates)', () => {
    expect(b.gamepad.buttons).toEqual([PAD.DOWN]);
    expect(contextsFor(b, 'gamepad')).toEqual(['play']);
    expect(contextsFor(BINDING.navigate, 'gamepad')).not.toContain('play');
  });

  it('its own tab of the menu on touch, on the pause card and the screen', () => {
    expect(b.touch.control).toBe('menuButton');
    expect(contextsFor(b, 'touch')).toEqual(['paused', 'inventory']);
  });

  it('is listed on the pause card\'s controls', () => {
    expect(CONTROL_ROWS).toContain('recipes');
  });
});
