// The completion percentage (docs/design/built/progression/COMPLETION.md, issue #180): one number for the whole game.
// Pure: no DOM, no game state. It reads the save record (the achievements, the Roots' page and the first-time records)
// and the content's ids, and returns the percentage with the share of each part. Nothing is stored as a number: it is
// computed from what the player did for the first time, so adding content changes the totals without a code change.

import { ACHIEVEMENTS, ACHIEVEMENT_BOSSES, COMPLETION_ACHIEVEMENT } from '../content/achievements';
import { CREATURES } from '../content/creatures';
import { ENEMIES } from '../content/enemies';
import { loadBook, pageCount } from '../content/book';
import { ITEMS } from '../content/items';
import { LEVELS } from '../content/levels';
import { POTION_IDS } from '../content/potions';
import { PRESENCES } from '../content/presences';
import boundary from '../content/presences/boundary';
import { DEITIES } from '../sky/creatures/deities';
import { TREE_STORIES } from '../world/tree';
import { TIERS, tiered, type Tier } from '../enemies/tiers';
import type { EnemyDef } from '../enemies/types';
import type { Firsts } from './meta';

// ───────────────────────── the bestiary's variations (issue #360) ─────────────────────────

/**
 * Whether a being has variations in the bestiary: every projection (a tiered being that is not a boss). Its variations
 * are its three colour tiers (TIERS.md), each seen hostile and as an ally (the inverted view). Bosses are the bosses
 * part; creatures, presences and the Shadow never take a tier.
 */
export const hasVariations = (def: Pick<EnemyDef, 'id' | 'kind'>) => tiered(def) && def.kind !== 'boss';

/** The id a variation is kept under in `firsts.bestiary`: `<projection>:<tier>`, and `:ally` for the allied view. */
export const variationId = (projection: string, tier: Tier, allied: boolean): string =>
  `${projection}:${tier}${allied ? ':ally' : ''}`;

/** The six variations of a projection: Black, Yellow and Red, each hostile and allied. */
export const variationsOf = (projection: string): string[] =>
  TIERS.flatMap(tier => [variationId(projection, tier, false), variationId(projection, tier, true)]);

/**
 * The bestiary id a sighting is kept under: a projection's variation (its tier, hostile or allied), or the being's own id
 * for everything without variations (a boss, a creature, a presence).
 */
export function seenId(def: Pick<EnemyDef, 'id' | 'kind'>, tier: Tier | undefined, allied: boolean): string {
  return hasVariations(def) ? variationId(def.id, tier ?? 'black', allied) : def.id;
}

/** The parts of the percentage and their weights (COMPLETION.md §2). The weights add up to 100. */
export const PARTS = ['floors', 'bosses', 'achievements', 'practices', 'bestiary', 'recipes', 'book'] as const;
export type Part = (typeof PARTS)[number];
export const PART_WEIGHT: Readonly<Record<Part, number>> = {
  floors: 25, bosses: 20, achievements: 20, practices: 15, bestiary: 10, recipes: 5, book: 5,
};

/**
 * The ids the percentage counts, read from the content (or given, in tests). Three routes make the floors: the descent
 * (`LEVELS`, by number), the giant tree (`TREE_STORIES`, `tree.<story>`) and the sky (`DEITIES`, `sky.<animal>`).
 * The bestiary holds every projection and creature that is spawned, every Presence (the Boundary included) and the
 * sky's guardians and herds (`guardian-<animal>`, `herd-<animal>`). A projection counts only when all of its variations
 * are seen (`variations`, issue #360). The Spiked Entity is not counted: it is not wired in the game yet (COMPLETION.md §2).
 */
export interface ContentIds {
  readonly floors: readonly string[];
  readonly bosses: readonly string[];
  readonly achievements: readonly string[];
  readonly practices: readonly string[];
  readonly bestiary: readonly string[];
  readonly recipes: readonly string[];
  /** How many pages the Roots' book has. */
  readonly bookPages: number;
  /**
   * The bestiary ids that have variations (the projections), each with the variation ids it needs (`variationsOf`). Such
   * an id counts as met only when every one of its variations has been seen. Absent: no id has variations.
   */
  readonly variations?: Readonly<Record<string, readonly string[]>>;
}

/** The content as the game ships it. The book is read for its page count only. */
export function contentIds(bookPages: number = pageCount(loadBook('en'))): ContentIds {
  const animals = Object.keys(DEITIES);
  return {
    floors: [...LEVELS.map(l => String(l.floor)), ...TREE_STORIES.map(s => `tree.${s.key}`), ...animals.map(a => `sky.${a}`)],
    bosses: [...ACHIEVEMENT_BOSSES],
    achievements: ACHIEVEMENTS.map(a => a.id).filter(id => id !== COMPLETION_ACHIEVEMENT),
    practices: ITEMS.map(i => i.id),
    bestiary: [
      ...ENEMIES, ...CREATURES, ...PRESENCES, boundary,
    ].map(d => d.id).concat(animals.flatMap(a => [`guardian-${a}`, `herd-${a}`])),
    recipes: [...POTION_IDS],
    bookPages,
    variations: Object.fromEntries(ENEMIES.filter(hasVariations).map(d => [d.id, variationsOf(d.id)])),
  };
}

let shipped: ContentIds | undefined;
/** The shipped content, read once. */
export function shippedContent(): ContentIds { return shipped ??= contentIds(); }

/** The part of the save the percentage reads. */
export interface CompletionSave {
  readonly achievements: Readonly<Record<string, number>>;
  readonly roots: { readonly page: number };
  readonly firsts?: Partial<Firsts>;
}

export interface PartCount {
  /** How many of the part's ids the player has done at least once. */
  readonly done: number;
  readonly total: number;
  /** The part's weight in the percentage (its share of the whole). */
  readonly weight: number;
}

export function partPercent(part: PartCount): number {
  return part.total === 0 ? 100 : Math.floor((100 * part.done) / part.total);
}

export interface Completion {
  /** The whole number, 0 to 100. It is 100 only when every part is complete (floored, so 99.x reads 99). */
  readonly percent: number;
  readonly parts: Readonly<Record<Part, PartCount>>;
}

/** Counts the ids of `ids` that `seen` holds. Ids the content no longer has are not counted. */
function countIn(ids: readonly string[], seen: readonly string[] | undefined): number {
  if (!seen || seen.length === 0) return 0;
  const set = new Set(seen);
  return ids.filter(id => set.has(id)).length;
}

/**
 * The variations of `projection` that `seen` holds. A save from before the tiers kept a projection under its bare id when
 * it spawned, and every projection then was Black and hostile: that bare id reads as its Black hostile variation. The game
 * no longer writes the bare id of a projection, so the reading stays true.
 */
function variationsSeen(projection: string, variations: readonly string[], seen: ReadonlySet<string>): number {
  const legacy = seen.has(projection) ? variationId(projection, 'black', false) : undefined;
  return variations.filter(v => seen.has(v) || v === legacy).length;
}

/** Counts the bestiary ids that are met: an id with variations only when all of them are seen, any other id when held. */
function countBestiary(content: ContentIds, seen: readonly string[] | undefined): number {
  const set = new Set(seen ?? []);
  const vars = content.variations ?? {};
  return content.bestiary.filter(id => {
    const v = vars[id];
    return v ? variationsSeen(id, v, set) === v.length : set.has(id);
  }).length;
}

/** The projections' variations in a save: how many are seen, how many exist, and the projections with every one seen. */
export interface VariationCount { readonly seen: number; readonly total: number; readonly complete: number; readonly projections: number }

export function bestiaryVariations(firsts: Partial<Firsts> | undefined, content: ContentIds = shippedContent()): VariationCount {
  const set = new Set(firsts?.bestiary ?? []);
  let seen = 0, total = 0, complete = 0, projections = 0;
  for (const [id, v] of Object.entries(content.variations ?? {})) {
    const n = variationsSeen(id, v, set);
    seen += n;
    total += v.length;
    projections++;
    if (n === v.length) complete++;
  }
  return { seen, total, complete, projections };
}

/** The bestiary is complete (the achievement `bestiary.full`): every variation of every projection seen. */
export function bestiaryComplete(firsts: Partial<Firsts> | undefined, content: ContentIds = shippedContent()): boolean {
  const c = bestiaryVariations(firsts, content);
  return c.projections > 0 && c.complete === c.projections;
}

/**
 * The completion of a save against the content. A boss is done when its `destroyed` or `converted` achievement is unlocked;
 * the book is reached at the Roots' current page (pages 1 to that page). A part with no content counts as complete.
 */
export function completion(save: CompletionSave, content: ContentIds = shippedContent()): Completion {
  const has = (id: string) => Object.prototype.hasOwnProperty.call(save.achievements, id);
  const firsts = save.firsts ?? {};
  const bossDone = content.bosses.filter(b => has(`boss.${b}.destroyed`) || has(`boss.${b}.converted`)).length;
  const parts: Record<Part, PartCount> = {
    floors: { done: countIn(content.floors, firsts.floors), total: content.floors.length, weight: PART_WEIGHT.floors },
    bosses: { done: bossDone, total: content.bosses.length, weight: PART_WEIGHT.bosses },
    achievements: { done: content.achievements.filter(has).length, total: content.achievements.length, weight: PART_WEIGHT.achievements },
    practices: { done: countIn(content.practices, firsts.practices), total: content.practices.length, weight: PART_WEIGHT.practices },
    bestiary: { done: countBestiary(content, firsts.bestiary), total: content.bestiary.length, weight: PART_WEIGHT.bestiary },
    recipes: { done: countIn(content.recipes, firsts.recipes), total: content.recipes.length, weight: PART_WEIGHT.recipes },
    book: { done: Math.min(content.bookPages, Math.max(0, save.roots.page)), total: content.bookPages, weight: PART_WEIGHT.book },
  };
  let sum = 0;
  for (const p of PARTS) {
    const { done, total, weight } = parts[p];
    sum += total === 0 ? weight : weight * (done / total);
  }
  return { percent: Math.min(100, Math.floor(sum + 1e-9)), parts };
}
