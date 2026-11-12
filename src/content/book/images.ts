// The images the book may show (docs/design/not-built/levels/roots/BOOK-DATA.md §4). An image is an id
// `namespace/name`, never a path. The lesson and portrait lists below are the manifest the capture
// scripts and the validator share; the icons are the game's own items, potions and hearts.

import { ITEM_BY_ID } from '../items';
import { POTION_IDS } from '../potions';
import { HEART_KINDS } from '../heart-art';

/** `lesson/<name>`: the thirty-three mechanic captures, one file each in `public/book/lesson/`. */
export const LESSON_IMAGES = [
  'blocks', 'polarity', 'step', 'behind-wall', 'dig', 'mend', 'pit', 'bridge', 'counters',
  'bomb', 'kick', 'crates', 'lava', 'water', 'sanctuary', 'practice', 'ring', 'way-down',
  'drink', 'alembic', 'kitchen', 'convert', 'parts', 'boss-room', 'paths', 'state', 'recipe',
  'creatures', 'white-bomb', 'throw', 'chests', 'toll', 'grow',
] as const;

/** `bestiary/<entity id>`: the nineteen portraits the book's plates use, one file each in `public/book/bestiary/`. */
export const BESTIARY_PORTRAITS = [
  'doubt', 'critic', 'panic', 'resistance', 'inertia', 'insatiable', 'overwhelm', 'wonder',
  'rootling', 'mossling', 'chirper', 'delver', 'bubbler', 'ferryback', 'leafling', 'star-mite',
  'inkmite', 'cinderwalker', 'listener',
] as const;

export type IconKind = 'item' | 'potion' | 'heart';

export type ImageRef =
  | { readonly kind: 'portrait'; readonly id: string; readonly file: string }
  | { readonly kind: 'lesson'; readonly name: string; readonly file: string }
  | { readonly kind: 'icon'; readonly icon: IconKind; readonly id: string };

const PORTRAIT_SET: ReadonlySet<string> = new Set<string>(BESTIARY_PORTRAITS);
const LESSON_SET: ReadonlySet<string> = new Set<string>(LESSON_IMAGES);
const POTION_SET: ReadonlySet<string> = new Set<string>(POTION_IDS);
const HEART_SET: ReadonlySet<string> = new Set<string>(HEART_KINDS);

/** Resolves an image id to what it draws, or `undefined` when no such image exists. Pure. */
export function resolveImage(id: string): ImageRef | undefined {
  const slash = id.indexOf('/');
  if (slash < 0) return undefined;
  const head = id.slice(0, slash);
  const rest = id.slice(slash + 1);
  if (head === 'bestiary') {
    return PORTRAIT_SET.has(rest) ? { kind: 'portrait', id: rest, file: `book/bestiary/${rest}.webp` } : undefined;
  }
  if (head === 'lesson') {
    return LESSON_SET.has(rest) ? { kind: 'lesson', name: rest, file: `book/lesson/${rest}.webp` } : undefined;
  }
  if (head === 'icon') {
    const sub = rest.indexOf('/');
    if (sub < 0) return undefined;
    const kind = rest.slice(0, sub);
    const name = rest.slice(sub + 1);
    if (kind === 'item' && ITEM_BY_ID.has(name)) return { kind: 'icon', icon: 'item', id: name };
    if (kind === 'potion' && POTION_SET.has(name)) return { kind: 'icon', icon: 'potion', id: name };
    if (kind === 'heart' && HEART_SET.has(name)) return { kind: 'icon', icon: 'heart', id: name };
  }
  return undefined;
}

/** Every image id the book may use. The validator takes this set (its file check is a later package). */
export function knownImageIds(): ReadonlySet<string> {
  return new Set<string>([
    ...BESTIARY_PORTRAITS.map(id => `bestiary/${id}`),
    ...LESSON_IMAGES.map(name => `lesson/${name}`),
    ...[...ITEM_BY_ID.keys()].map(id => `icon/item/${id}`),
    ...POTION_IDS.map(id => `icon/potion/${id}`),
    ...HEART_KINDS.map(kind => `icon/heart/${kind}`),
  ]);
}
