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
import type { Firsts } from './meta';

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
 * sky's guardians and herds (`guardian-<animal>`, `herd-<animal>`). The Spiked Entity is not counted: it is not wired in
 * the game yet (COMPLETION.md §2).
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
    bestiary: { done: countIn(content.bestiary, firsts.bestiary), total: content.bestiary.length, weight: PART_WEIGHT.bestiary },
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
