// The book's pictures (docs/design/not-built/levels/roots/BOOK-DATA.md §4): every picture the two book
// files use that is taken from the game has its file in public/book, every file in public/book is used by
// a book, and every file is a small WebP. The lesson pictures that the sandbox cannot stage yet are listed
// here, by id and with the reason, and must have no file; the capture script names the same reasons.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import bookEn from '../src/content/book/book.en.json';
import bookEs from '../src/content/book/book.es.json';
import { BESTIARY_PORTRAITS, LESSON_IMAGES, resolveImage } from '../src/content/book/images';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicBook = join(root, 'public/book');
const MAX_BYTES = 60 * 1024;

// The lesson pictures that are not captured yet, with the reason (scripts/book-captures.mjs, PENDING).
const PENDING: Record<string, string> = {
  ring: 'the minimap of the whole Roots needs a real run of floor 0; the sandbox is one room',
  drink: 'a flask on top of the hand: the sandbox hand carries blocks and parts, not potions',
  alembic: 'the alembic is placed by the floor generator on floors 2, 4, 6 and 8',
  kitchen: 'the kitchen is placed by the floor generator on floors 1, 3, 5 and 7',
  recipe: 'the alembic and the potion it made: the alembic is placed by the floor generator',
  paths: 'the practices tab of the inventory screen: the sandbox does not open the inventory yet',
  state: 'the banner of a state of being: shown only after three practices of one path',
  'white-bomb': 'a white bomb over lava needs a polarity-coloured explosion the sandbox cannot drop',
  'boss-room': 'a boss room after its fight: the lit pedestal needs a defeated boss',
  parts: 'the four parts of a released projection: the sandbox has no part pickup hook',
  chests: 'the locked chest with keyholes is a model the floor generator places',
  // pages 3 to 6 filling all 22 slots (owner, 2026-11-13): not captured yet (BOOK-DATA §4 says what each must show)
  sky: 'the sky above the great tree: the sandbox does not build the sky; it needs the real game started on the sky deck (?sky)',
  'warm-boss': 'a boss nearly warmed to your side: not captured yet (a sandbox boss room with its warmth set, like convert)',
  seal: 'a room sealed with a projection in it: the sandbox room has no doors to shut',
  omen: 'the cold motes of an omen gathering: not captured yet (an omen must be started and paused mid-gather)',
  'room-clear': 'a cleared room with what it left: not captured yet (the clear drop must be rolled and paused)',
  mastery: 'loose keys, bombs and hearts the Roots lay out at a high mastery: needs a real run of floor 0 at that level',
};

// The portraits that are not captured yet (scripts/bestiary-capture.mjs, PENDING_PORTRAITS). Each must have no file;
// a plate using one draws the neutral placeholder until it is captured.
const PENDING_PORTRAITS: readonly string[] = [];

/** Every `image` id of both book files. */
function imageIds(book: { pages: { panels: Record<string, Record<string, { image?: string }>> }[] }): string[] {
  const out: string[] = [];
  for (const page of book.pages) for (const room of Object.values(page.panels)) for (const panel of Object.values(room)) {
    if (panel.image) out.push(panel.image);
  }
  return out;
}

/** Every WebP under a folder, as paths relative to public/ (no leading slash). */
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return name.endsWith('.webp') ? [relative(join(root, 'public'), path).split('\\').join('/')] : [];
  });
}

const ids = [...new Set([...imageIds(bookEn as never), ...imageIds(bookEs as never)])];
const pictureIds = ids.filter(id => {
  const ref = resolveImage(id);
  return ref !== undefined && ref.kind !== 'icon';
});

describe('the book pictures', () => {
  it('every picture id the book uses resolves to a known portrait or lesson', () => {
    const unknown = ids.filter(id => id.startsWith('bestiary/') || id.startsWith('lesson/')).filter(id => !resolveImage(id));
    expect(unknown).toEqual([]);
  });

  it('the manifest lists the lesson and portrait pictures the book uses, and nothing it does not use', () => {
    const used = new Set(ids);
    const manifest = [...BESTIARY_PORTRAITS.map(id => `bestiary/${id}`), ...LESSON_IMAGES.map(name => `lesson/${name}`)];
    expect(manifest.filter(id => !used.has(id))).toEqual([]);
  });

  it('every picture that is not pending has its file in public/book', () => {
    const missing = pictureIds.filter(id => {
      const ref = resolveImage(id)!;
      const name = id.split('/')[1];
      if (ref.kind === 'lesson' && PENDING[name]) return false;
      if (ref.kind === 'portrait' && PENDING_PORTRAITS.includes(name)) return false;
      return !existsSync(join(root, 'public', ref.kind === 'portrait' || ref.kind === 'lesson' ? ref.file : ''));
    });
    expect(missing).toEqual([]);
  });

  it('a pending picture has no file, so the gap stays explicit', () => {
    const named = Object.keys(PENDING).filter(name => existsSync(join(publicBook, 'lesson', `${name}.webp`)));
    expect(named).toEqual([]);
    for (const name of Object.keys(PENDING)) expect(LESSON_IMAGES).toContain(name);
  });

  it('a pending portrait has no file and is in the portrait manifest', () => {
    const named = PENDING_PORTRAITS.filter(id => existsSync(join(publicBook, 'bestiary', `${id}.webp`)));
    expect(named).toEqual([]);
    for (const id of PENDING_PORTRAITS) expect(BESTIARY_PORTRAITS).toContain(id);
  });

  it('every file in public/book is used by a book page', () => {
    const used = new Set(pictureIds.map(id => resolveImage(id)!).filter(ref => ref.kind !== 'icon').map(ref => (ref as { file: string }).file));
    const unused = filesUnder(publicBook).filter(file => !used.has(file));
    expect(unused).toEqual([]);
  });

  it('every picture file is a WebP under 60 KB', () => {
    const big = filesUnder(publicBook).map(file => [file, statSync(join(root, 'public', file)).size] as const).filter(([, size]) => size > MAX_BYTES);
    expect(big).toEqual([]);
    for (const file of filesUnder(publicBook)) {
      const head = readFileSync(join(root, 'public', file)).subarray(0, 12).toString('latin1');
      expect(head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP').toBe(true);
    }
  });
});
