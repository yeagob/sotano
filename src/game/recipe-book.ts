// The Recipe Book (the Book of Secrets, docs/design/built/practices/RECIPE-BOOK.md): a tab of the menu screen that
// explains every brew of the alembic, every meal of the kitchen and what each presence takes. Everything in it is read
// from the game's own data (RECIPES, FAMILIES, FLESH_TONICS, POTIONS, mealOf, PRESENCE_KEY, PRESENCE_PARTS,
// GARDEN_MATERIALS, PRESENCE_TAKES_ORE, ZONES), so a new recipe or presence shows up here without a word copied by hand
// (tests/recipe-book.test.ts fails when one is missing). Pure: a model, then HTML from it; the HUD passes the icons.
// Every word goes through i18n; every colour is a palette token.

import { ECHO, FALLBACK, FAMILIES, FLESH_TONICS, ICE, RECIPES, type DeepKind, type FamilyPath, type Slot } from '../content/recipes';
import { flaskRooms, POTION_IDS, POTIONS, type PotionId } from '../content/potions';
import { PART_KINDS, type PartKind } from '../content/parts';
import { GARDEN_MATERIALS, MAT } from '../content/materials';
import { ZONES } from '../content/levels';
import { ENEMY_BY_ID } from '../content/enemies';
import {
  PRESENCE_KEY, PRESENCE_PARTS, PRESENCE_TAKES_ORE, PRESENCE_TALK, PRESENCES, type PresenceId,
} from '../content/presences';
import { palCss, PATH_GLYPH, type PalToken, type PathName } from '../content/palette';
import { locale, t, type MessageKey } from '../i18n';
import { enemyText, materialName, pathName } from '../i18n/content';
import { forDevice } from '../input/labels';
import type { Device } from '../input/bindings';
import { BULB, BREWS } from './alembic';
import { COOKS, mealOf } from './kitchen';

// ───────────────────────── the model ─────────────────────────

/** One thing a recipe asks for: `count` parts of a kind (narrowed by path, line or projection), or one block of a list. */
export type Ingredient =
  | { kind: 'part'; part: PartKind; count: number; path?: PathName; lineage?: string; pattern?: string }
  | { kind: 'materials'; materials: readonly number[] };

/** One way the alembic makes a potion. */
export type Way =
  | { kind: 'recipe'; ingredients: Ingredient[]; patterns?: 'same' | 'distinct' }
  | { kind: 'family'; path: FamilyPath; deepest: DeepKind }
  | { kind: 'flesh'; count: number }
  | { kind: 'echo' }
  | { kind: 'fallback' };

export interface PotionPage { potion: PotionId; ways: Way[] }
export interface MealPage { potion: PotionId; parts: PartKind[] }

/** What a presence takes from the hand. */
export type Takes =
  | { kind: 'part'; part: PartKind | 'any'; count: number }
  | { kind: 'block' }
  | { kind: 'materials'; materials: readonly number[] }
  | { kind: 'ore'; zones: readonly { from: number; to: number; ore: number }[] };

export interface OfferingPage { presence: PresenceId; takes: Takes[] }

export interface RecipeBook {
  potions: PotionPage[];
  meals: MealPage[];
  offerings: OfferingPage[];
  /** Things the alembic's bulb holds, brews per alembic, cooks per kitchen. */
  bulb: number; brews: number; cooks: number;
}

/** A recipe's slots as ingredients: identical slots are one ingredient with a count. */
function ingredients(slots: readonly Slot[]): Ingredient[] {
  const out: Ingredient[] = [];
  const keys: string[] = [];
  for (const s of slots) {
    const key = JSON.stringify(s);
    const at = keys.indexOf(key);
    if ('materials' in s) { out.push({ kind: 'materials', materials: s.materials }); keys.push(key); continue; }
    if (at >= 0) { const prev = out[at]; if (prev.kind === 'part') prev.count++; continue; }
    out.push({ kind: 'part', part: s.part, count: 1, ...(s.path ? { path: s.path } : {}), ...(s.lineage ? { lineage: s.lineage } : {}), ...(s.pattern ? { pattern: s.pattern } : {}) });
    keys.push(key);
  }
  return out;
}

/** A recipe that asks for exactly `n` flesh parts of any kind says what the flesh tonic of `n` says: the tonic is not repeated. */
const sameAsFlesh = (w: Way, n: number) =>
  w.kind === 'recipe' && w.ingredients.length === 1 && w.ingredients[0].kind === 'part' && w.ingredients[0].part === 'flesh'
  && w.ingredients[0].count === n && !w.ingredients[0].path && !w.ingredients[0].lineage && !w.ingredients[0].pattern && !w.patterns;

/** The book, from the game's data. */
export function recipeBook(): RecipeBook {
  const potions: PotionPage[] = POTION_IDS.filter(id => !POTIONS[id].meal).map(potion => {
    const ways: Way[] = RECIPES.filter(r => r.potion === potion)
      .map(r => ({ kind: 'recipe' as const, ingredients: ingredients(r.slots), ...(r.patterns ? { patterns: r.patterns } : {}) }));
    for (const [path, kinds] of Object.entries(FAMILIES) as [FamilyPath, Record<DeepKind, PotionId>][]) {
      for (const [deepest, id] of Object.entries(kinds) as [DeepKind, PotionId][]) if (id === potion) ways.push({ kind: 'family', path, deepest });
    }
    FLESH_TONICS.forEach((id, i) => { if (id === potion && !ways.some(w => sameAsFlesh(w, i + 1))) ways.push({ kind: 'flesh', count: i + 1 }); });
    if (potion === ECHO) ways.push({ kind: 'echo' });
    if (potion === FALLBACK) ways.push({ kind: 'fallback' });
    return { potion, ways };
  });
  const meals: MealPage[] = POTION_IDS.filter(id => POTIONS[id].meal)
    .map(potion => ({ potion, parts: PART_KINDS.filter(k => mealOf(k) === potion) }));
  const offerings: OfferingPage[] = PRESENCES.map(p => p.id as PresenceId).map(presence => {
    const takes: Takes[] = [];
    const key = PRESENCE_KEY[presence];
    if (key === 'block') takes.push({ kind: 'block' });
    else if (key === 'garden') takes.push({ kind: 'materials', materials: GARDEN_MATERIALS });
    else if (key !== 'none') takes.push({ kind: 'part', part: key, count: PRESENCE_PARTS[presence] ?? 1 });
    if (PRESENCE_TAKES_ORE.has(presence)) {
      takes.push({ kind: 'ore', zones: ZONES.map(z => ({ from: z.floors[0], to: z.floors[1], ore: MAT[z.ore] })) });
    }
    return { presence, takes };
  }).filter(o => o.takes.length);
  return { potions, meals, offerings, bulb: BULB, brews: BREWS, cooks: COOKS };
}

// ───────────────────────── words ─────────────────────────

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const th = (k: MessageKey, p?: Record<string, string | number>) => esc(t(k, p));

/** "A or B or C" in the language on screen (Intl's own list, so no word order is assumed). */
function orList(words: readonly string[]): string {
  try { return new Intl.ListFormat(locale(), { type: 'disjunction' }).format(words); } catch { return words.join(' / '); }
}

/** A potion's name in the book: the echo names "a practice" in place of the one it will carry. */
export function potionName(id: PotionId): string {
  return POTIONS[id].echo ? t(POTIONS[id].name, { item: t('recipes.echo.item') }) : t(POTIONS[id].name);
}

/** A potion's effect in the book: its own effect line, with the rooms it lasts. */
export function potionEffect(id: PotionId): string {
  return POTIONS[id].echo ? t('recipes.echo.effect', { rooms: flaskRooms({ potion: id }) }) : t(POTIONS[id].effect, { rooms: flaskRooms({ potion: id }) });
}

const lineName = (source: string) => { const e = ENEMY_BY_ID.get(source); return e ? enemyText(e).name : source; };

// ───────────────────────── HTML ─────────────────────────

/** The icons the HUD draws (canvas data URLs), so this stays pure. */
export interface BookIcons { flask(id: PotionId): string; material(id: number): string }

const pathChip = (p: PathName) =>
  `<em class="path" style="--p:${palCss(`path.${p}.base` as PalToken)}">${PATH_GLYPH[p]} ${esc(pathName(p))}</em>`;

function partChip(part: PartKind | 'any', count: number, extra = ''): string {
  return `<span class="chip part" data-part="${part}">${th(`recipes.part.${part}` as MessageKey, { n: count })}${extra}</span>`;
}

function materialsChip(materials: readonly number[], icons: BookIcons): string {
  const imgs = materials.map(m => `<img src="${icons.material(m)}" alt="">`).join('');
  return `<span class="chip block">${imgs}${esc(orList(materials.map(materialName)))}</span>`;
}

function ingredientHtml(g: Ingredient, icons: BookIcons): string {
  if (g.kind === 'materials') return materialsChip(g.materials, icons);
  const extra = (g.path ? ` ${pathChip(g.path)}` : '')
    + (g.lineage ? ` <small>${th('recipes.lineage', { name: lineName(g.lineage) })}</small>` : '')
    + (g.pattern ? ` <small>${th('recipes.pattern', { name: lineName(g.pattern) })}</small>` : '');
  return partChip(g.part, g.count, extra);
}

function wayHtml(w: Way, icons: BookIcons): string {
  switch (w.kind) {
    case 'recipe': return `<div class="way">${w.ingredients.map(g => ingredientHtml(g, icons)).join('<b class="plus" aria-hidden="true">+</b>')}` +
      `${w.patterns ? `<small class="rule">${th(`recipes.patterns.${w.patterns}` as MessageKey)}</small>` : ''}</div>`;
    case 'family': return `<div class="way">${pathChip(w.path)}<small class="rule">${th(`recipes.family.${w.deepest}` as MessageKey)}</small></div>`;
    case 'flesh': return `<div class="way">${partChip('flesh', w.count)}<small class="rule">${th('recipes.way.flesh')}</small></div>`;
    case 'echo': return `<div class="way"><small class="rule">${th('recipes.way.echo')}</small></div>`;
    case 'fallback': return `<div class="way"><small class="rule">${th('recipes.way.fallback')}</small></div>`;
  }
}

function potionHtml(p: PotionPage, icons: BookIcons): string {
  const def = POTIONS[p.potion];
  const ways = p.ways.map(w => wayHtml(w, icons)).join(`<p class="or">${th('recipes.or')}</p>`);
  return `<li class="page" data-potion="${p.potion}" style="--p:${palCss(`path.${def.path}.base` as PalToken)}">` +
    `<img class="flask" src="${icons.flask(p.potion)}" alt=""><div class="body"><header><b class="name">${esc(potionName(p.potion))}</b>${pathChip(def.path)}</header>` +
    `<p class="effect">${esc(potionEffect(p.potion))}</p><div class="ways">${ways}</div></div></li>`;
}

function mealHtml(m: MealPage, icons: BookIcons): string {
  const def = POTIONS[m.potion];
  const parts = m.parts.map(k => partChip(k, 1)).join(`<b class="plus" aria-hidden="true">${th('recipes.or')}</b>`);
  return `<li class="page" data-potion="${m.potion}" style="--p:${palCss(`path.${def.path}.base` as PalToken)}">` +
    `<img class="flask" src="${icons.flask(m.potion)}" alt=""><div class="body"><header><b class="name">${esc(t(def.name))}</b></header>` +
    `<p class="effect">${esc(t(def.effect))}</p><div class="ways"><div class="way">${parts}</div></div></div></li>`;
}

function takesHtml(k: Takes, icons: BookIcons): string {
  switch (k.kind) {
    case 'part': return partChip(k.part, k.count, k.count > 1 ? ` <small>${th('recipes.takes.distinct')}</small>` : '');
    case 'block': return `<span class="chip block">${th('recipes.takes.block')}</span>`;
    case 'materials': return `${materialsChip(k.materials, icons)}<small class="rule">${th('recipes.takes.each')}</small>`;
    case 'ore': return `<ul class="ores">${k.zones.map(z => `<li><span class="chip block"><img src="${icons.material(z.ore)}" alt="">` +
      `${th(z.from === z.to ? 'recipes.takes.oreOne' : 'recipes.takes.ore', { ore: materialName(z.ore), from: z.from, to: z.to })}</span></li>`).join('')}</ul>`;
  }
}

function offeringHtml(o: OfferingPage, icons: BookIcons): string {
  return `<li class="page offering" data-presence="${o.presence}">` +
    `<div class="body"><header><b class="name">${th(PRESENCE_TALK[o.presence].name)}</b></header>` +
    `<div class="ways"><div class="way">${o.takes.map(k => takesHtml(k, icons)).join(`<b class="plus" aria-hidden="true">${th('recipes.or')}</b>`)}</div></div>` +
    `<p class="gives"><em>${th('codex.gives')}</em> ${th(`codex.${o.presence}.gives` as MessageKey)}</p></div></li>`;
}

/** The book's ornament: the practice's book with its flask standing on it, drawn small beside the title (pixel art, palette tokens). */
const ORNAMENT = ['.....pp.', '....bggb', '....bggb', 'dddddddd', 'dppppppd', 'dddddddd'];
const ORNAMENT_INK: Record<string, PalToken> = { d: 'path.mind.dark', b: 'path.mind.base', p: 'bone.paper', g: 'path.mind.glow' };

function ornamentSvg(): string {
  const w = ORNAMENT[0].length, h = ORNAMENT.length;
  const rects = ORNAMENT.flatMap((row, y) => [...row].map((c, x) => (ORNAMENT_INK[c] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${palCss(ORNAMENT_INK[c])}"/>` : ''))).join('');
  return `<svg class="ornament" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

/** The tab's content: the card with its header, then the three chapters. */
export function recipeBookHtml(book: RecipeBook, icons: BookIcons, device: Device): string {
  const chapter = (id: string, title: MessageKey, notes: string[], pages: string) =>
    `<section class="chapter" data-chapter="${id}"><h3>${th(title)}</h3>${notes.map(n => `<p class="note">${n}</p>`).join('')}<ul class="pages">${pages}</ul></section>`;
  return `<div class="card slate"><header>${ornamentSvg()}<h2>${th('recipes.title')}</h2><small>${th('recipes.sub')} · ${th(forDevice('recipes.close', device))}</small>` +
    `<button type="button" class="close" data-act="inventory" aria-label="${th('inv.closeLabel')}">✕</button></header>` +
    chapter('potions', 'recipes.ch.potions', [
      th('recipes.note.alembic', { bulb: book.bulb, brews: book.brews }),
      th('recipes.note.order'),
      th('recipes.note.ice', { ice: materialName(ICE) }),
    ], book.potions.map(p => potionHtml(p, icons)).join('')) +
    chapter('meals', 'recipes.ch.meals', [th('recipes.note.kitchen', { cooks: book.cooks })], book.meals.map(m => mealHtml(m, icons)).join('')) +
    chapter('offerings', 'recipes.ch.offerings', [th('recipes.note.offerings')], book.offerings.map(o => offeringHtml(o, icons)).join('')) +
    `</div>`;
}

/** What the book's key does to the screen: open it on the book, or close it when the book is what it shows. */
export function recipesKeyOutcome(screenOpen: boolean, tab: string): 'open' | 'close' {
  return screenOpen && tab === 'recipes' ? 'close' : 'open';
}
