// The book's loader and validator (docs/design/built/levels/roots/BOOK-DATA.md §6): the real files pass,
// every rule fails on a broken copy, the page-1 fallback, and the image manifest.

import { describe, expect, it } from 'vitest';
import bookEn from '../src/content/book/book.en.json';
import bookEs from '../src/content/book/book.es.json';
import {
  type Book, BookValidationError, PLACEHOLDER_ACTIONS, type RoomKey, type Side, bookMessage, bookRefs, loadBook, pageCount, panelAt,
  panelById, panelIdOf, easyPanelIdOf, quoteSource, validateBook, type BookRefs, ROOM_KEYS, SIDES, IMAGE_CAPTION_BUDGET,
} from '../src/content/book';
import { BESTIARY_PORTRAITS, LESSON_IMAGES, knownImageIds, resolveImage } from '../src/content/book/images';
import { BOSS_BY_ID } from '../src/content/bosses';
import { CREATURE_BY_ID } from '../src/content/creatures';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { PRESENCE_BY_ID } from '../src/content/presences';
import boundary from '../src/content/presences/boundary';
import { DEITIES } from '../src/sky/creatures/deities';
import { MINIONS } from '../src/sky/creatures/minions';
import { LESSON_CONTROLS } from '../src/input/labels';

// The shipped files as typed books. The 'real files pass' test proves them; the loader itself is
// exercised through loadBook in the test that loads both languages.
const shipped = (lang: 'en' | 'es'): Book => (lang === 'en' ? bookEn : bookEs) as unknown as Book;

// Broken copies are plain JSON trees; the tests reach into them by path.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;
const copyEn = (): Raw => structuredClone(bookEn);
const copyEs = (): Raw => structuredClone(bookEs);

/** The problems the validator lists for a pair of files, or none when they pass. */
function problemsOf(en: unknown, es: unknown, refs: BookRefs = bookRefs()): string[] {
  try {
    validateBook(en, es, refs);
    return [];
  } catch (error) {
    if (error instanceof BookValidationError) return [...error.problems];
    throw error;
  }
}

/** Expects one listed problem that contains `fragment`. */
function expectProblem(problems: string[], fragment: string) {
  expect(problems.some(p => p.includes(fragment)), `no problem contains "${fragment}" in:\n${problems.join('\n')}`).toBe(true);
}

/** The panel of page `page` (1-based) in a raw file, for the broken copies. */
const slot = (raw: Raw, page: number, room: string, side: string): Raw => raw.pages[page - 1].panels[room][side];

describe('the shipped book', () => {
  it('the real files pass every rule', () => {
    expect(problemsOf(bookEn, bookEs)).toEqual([]);
  });

  it('loads each language, validated, with the language set', () => {
    expect(loadBook('en').language).toBe('en');
    expect(loadBook('es').language).toBe('es');
    expect(loadBook('es').pages.map(p => p.id)).toEqual(shipped('en').pages.map(p => p.id));
  });

  it('has nine pages: six tutorial pages, then three book pages', () => {
    const book = shipped('en');
    expect(pageCount(book)).toBe(9);
    expect(book.pages.map(p => p.kind)).toEqual(['tutorial', 'tutorial', 'tutorial', 'tutorial', 'tutorial', 'tutorial', 'book', 'book', 'book']);
  });

  it('every image of the shipped files resolves to the manifest', () => {
    const images = new Set<string>();
    for (const page of shipped('en').pages) {
      for (const slots of Object.values(page.panels)) {
        for (const panel of Object.values(slots ?? {})) if (panel && 'image' in panel) images.add(panel.image);
      }
    }
    expect(images.size).toBeGreaterThan(0);
    for (const id of images) expect(resolveImage(id), id).toBeDefined();
  });
});

describe('which pages fill which slots (owner, 2026-11-13)', () => {
  /** The slots a page of a book fills, as `room side`. */
  const filled = (book: Book, page: number) => Object.entries(book.pages[page - 1].panels)
    .flatMap(([room, slot]) => Object.keys(slot ?? {}).map(side => `${room} ${side}`));

  it('pages 3 to 6 each fill all 22 slots, in both languages', () => {
    for (const lang of ['en', 'es'] as const) {
      for (let page = 3; page <= 6; page++) {
        for (const [room, side] of ROOM_KEYS.flatMap(r => SIDES.map(s => [r, s] as const))) {
          expect(shipped(lang).pages[page - 1].panels[room]?.[side], `${lang} page ${page} ${room} ${side}`).toBeDefined();
        }
        expect(filled(shipped(lang), page).length, `${lang} page ${page}`).toBe(22);
      }
    }
  });

  it('on pages 3 to 6 no slot shows a panel of an earlier page, in either layout', () => {
    for (const lang of ['en', 'es'] as const) {
      for (let page = 3; page <= 6; page++) {
        for (const room of ROOM_KEYS) {
          for (const side of SIDES) {
            for (const layout of ['teaching', 'easy'] as const) {
              expect(panelAt(shipped(lang), page, room, side, layout).id, `${lang} page ${page} ${room} ${side} ${layout}`).toBe(panelIdOf(page, room, side));
            }
          }
        }
      }
    }
  });

  it('page 2 keeps its nine plate walls, as the owner likes it', () => {
    expect(filled(shipped('en'), 2).sort()).toEqual([
      'roots-bridge south', 'roots-crates north', 'roots-dig north', 'roots-hall south', 'roots-mend south',
      'roots-pit south', 'roots-seal north', 'roots-spring north', 'roots-step south',
    ]);
  });

  it('no two panels of pages 3 to 6 say the same thing: every title on a page is different', () => {
    for (const lang of ['en', 'es'] as const) {
      for (let page = 3; page <= 6; page++) {
        const titles = Object.values(shipped(lang).pages[page - 1].panels)
          .flatMap(slot => Object.values(slot ?? {}).map(panel => (panel as { title: string }).title));
        expect(new Set(titles).size, `${lang} page ${page}`).toBe(22);
      }
    }
  });
});

describe('panelAt', () => {
  it('shows the page own panel when the page has one', () => {
    const book = shipped('en');
    expect(panelAt(book, 2, 'roots-hall', 'south')).toEqual(book.pages[1].panels['roots-hall']?.south);
    expect(panelAt(book, 9, 'roots-hall', 'south')).toEqual(book.pages[8].panels['roots-hall']?.south);
  });

  it('falls back to page 1 for a slot the page does not fill', () => {
    const book = shipped('en');
    expect(book.pages[1].panels['roots-hall']?.north).toBeUndefined();
    expect(panelAt(book, 2, 'roots-hall', 'north')).toEqual(book.pages[0].panels['roots-hall']?.north);
    expect(panelAt(book, 9, 'roots-hall', 'north')).toEqual(book.pages[0].panels['roots-hall']?.north);
  });

  it('throws on a page, room or side that does not exist', () => {
    const book = shipped('en');
    expect(() => panelAt(book, 0, 'roots-hall', 'north')).toThrow(RangeError);
    expect(() => panelAt(book, 10, 'roots-hall', 'north')).toThrow(RangeError);
    expect(() => panelAt(book, 1.5, 'roots-hall', 'north')).toThrow(RangeError);
    expect(() => panelAt(book, 1, 'roots-moon' as never, 'north')).toThrow(RangeError);
    expect(() => panelAt(book, 1, 'roots-hall', 'east' as never)).toThrow(RangeError);
  });
});

describe('validation rules (BOOK-DATA §6), one broken copy each', () => {
  // 1. The file
  it('rule 1: the version must be 1', () => {
    const en = copyEn();
    en.version = 2;
    expectProblem(problemsOf(en, copyEs()), 'version must be 1');
  });

  it('rule 1: the language must match its file', () => {
    expectProblem(problemsOf(copyEs(), copyEs()), 'language must be "en"');
  });

  it('rule 1: no unknown top-level field', () => {
    const en = copyEn();
    en.extra = true;
    expectProblem(problemsOf(en, copyEs()), 'unknown top-level field "extra"');
  });

  // 2. The pages and page 1
  it('rule 2: the pages list must not be empty', () => {
    const en = copyEn();
    en.pages = [];
    expectProblem(problemsOf(en, copyEs()), 'at least one page');
  });

  it('rule 2: page 1 must be a tutorial page', () => {
    const en = copyEn();
    en.pages[0].kind = 'book';
    expectProblem(problemsOf(en, copyEs()), 'page 1 must be a tutorial page');
  });

  it('rule 2: page 1 must fill all 22 slots', () => {
    const en = copyEn();
    delete en.pages[0].panels['roots-hall'].south;
    expectProblem(problemsOf(en, copyEs()), 'page 1 has no panel for roots-hall south');
  });

  it('rule 2: no tutorial page after a book page', () => {
    const en = copyEn();
    en.pages.push({ id: 'tutorial-7', kind: 'tutorial', panels: {} });
    expectProblem(problemsOf(en, copyEs()), 'a tutorial page follows a book page');
  });

  // 3. The page ids
  it('rule 3: page ids are unique', () => {
    const en = copyEn();
    en.pages[1].id = 'tutorial-1';
    expectProblem(problemsOf(en, copyEs()), 'id "tutorial-1" is not unique');
  });

  it('rule 3: page ids match ^[a-z0-9-]+$', () => {
    const en = copyEn();
    en.pages[1].id = 'Tutorial 2';
    expectProblem(problemsOf(en, copyEs()), 'must match ^[a-z0-9-]+$');
  });

  // 4. Rooms, sides, layouts and fields
  it('rule 4: every room key is one of the eleven', () => {
    const en = copyEn();
    en.pages[0].panels['roots-moon'] = en.pages[0].panels['roots-hall'];
    expectProblem(problemsOf(en, copyEs()), 'unknown room "roots-moon"');
  });

  it('rule 4: every side is north or south', () => {
    const en = copyEn();
    en.pages[0].panels['roots-hall'].east = en.pages[0].panels['roots-hall'].south;
    expectProblem(problemsOf(en, copyEs()), 'unknown side "east"');
  });

  it('rule 4: a room holds at least one panel', () => {
    const en = copyEn();
    en.pages[1].panels['roots-gift'] = {};
    expectProblem(problemsOf(en, copyEs()), 'roots-gift has no panel');
  });

  it('rule 4: the layout must be known', () => {
    const en = copyEn();
    slot(en, 2, 'roots-hall', 'south').layout = 'poster';
    expectProblem(problemsOf(en, copyEs()), 'unknown layout "poster"');
  });

  it('rule 4: a field the layout does not allow is refused', () => {
    const en = copyEn();
    slot(en, 3, 'roots-dig', 'north').key = 'move';
    expectProblem(problemsOf(en, copyEs()), '"key" is not a field of a plate panel');
  });

  it('rule 4: a required field is present', () => {
    const en = copyEn();
    delete slot(en, 1, 'roots-hall', 'north').title;
    expectProblem(problemsOf(en, copyEs()), '"title" is missing');
  });

  // 5. Strings
  it('rule 5: a string is not empty', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').text = '';
    expectProblem(problemsOf(en, copyEs()), '"text" is empty');
  });

  it('rule 5: a string has no markup', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').text = 'Throw <b>it</b>.';
    expectProblem(problemsOf(en, copyEs()), 'contains markup');
  });

  it('rule 5: a string has no leading or trailing space', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').text = ' Throw it.';
    expectProblem(problemsOf(en, copyEs()), 'leading or trailing space');
  });

  it('rule 5: a string has no double space', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').text = 'Throw  it.';
    expectProblem(problemsOf(en, copyEs()), 'double space');
  });

  // 6. Placeholders
  it('rule 6: a placeholder names an allowed action', () => {
    const en = copyEn();
    slot(en, 1, 'roots-step', 'south').text = '{fly} jumps one block.';
    expectProblem(problemsOf(en, copyEs()), 'unknown placeholder {fly}');
  });

  it('rule 6: a placeholder is only in lesson and plate text', () => {
    const en = copyEn();
    slot(en, 7, 'roots-hall', 'south').text = 'Press {jump} to begin.';
    expectProblem(problemsOf(en, copyEs()), 'placeholders are only allowed in lesson and plate text');
  });

  it('rule 6: braces must hold one action name', () => {
    const en = copyEn();
    slot(en, 1, 'roots-step', 'south').text = '{jump jumps one block.';
    expectProblem(problemsOf(en, copyEs()), 'malformed placeholder');
  });

  // 7. Images and keys
  it('rule 7: every image resolves', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').image = 'lesson/nowhere';
    expectProblem(problemsOf(en, copyEs()), 'image "lesson/nowhere" does not resolve');
  });

  it('rule 7: every key is an allowed action', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').key = 'fly';
    expectProblem(problemsOf(en, copyEs()), 'key "fly" is not an action with a key cap');
  });

  // 8. Budgets
  it('rule 8: a title is within its budget of 22 characters', () => {
    const en = copyEn();
    slot(en, 1, 'roots-hall', 'north').title = 'a'.repeat(23);
    expectProblem(problemsOf(en, copyEs()), '"title" is 23 characters with the longest labels, the budget is 22');
  });

  it('rule 8: a prose text is within its budget of 320 characters', () => {
    const en = copyEn();
    slot(en, 7, 'roots-hall', 'south').text = 'a'.repeat(321);
    expectProblem(problemsOf(en, copyEs()), 'the budget is 320');
  });

  it('rule 8: a placeholder counts at its longest label', () => {
    const longest = Math.max(...['key', 'pad', 'touch'].map(d => bookMessage('en', `controls.jump.${d}`)!.length));
    // The raw text fits 120 characters; with the longest jump label it does not.
    const rawLength = '{jump} '.length + (120 - longest);
    expect(rawLength).toBeLessThanOrEqual(120);
    const en = copyEn();
    slot(en, 1, 'roots-step', 'south').text = `{jump} ${'a'.repeat(120 - longest)}`;
    expectProblem(problemsOf(en, copyEs()), '"text" is 121 characters with the longest labels, the budget is 120');
  });

  it('rule 8: a key cap label is within its budget of 14 characters', () => {
    const refs: BookRefs = {
      images: knownImageIds(),
      message: (lang, key) => (key.startsWith('keycap.') ? 'x'.repeat(15) : bookMessage(lang, key)),
    };
    expectProblem(problemsOf(copyEn(), copyEs(), refs), 'the key cap budget is 14');
  });

  // 9. The two languages
  it('rule 9: the languages have the same number of pages', () => {
    const es = copyEs();
    es.pages.pop();
    expectProblem(problemsOf(copyEn(), es), 'differ in page count');
  });

  it('rule 9: the same id and kind at every position', () => {
    const es = copyEs();
    es.pages[1].id = 'tutorial-9';
    expectProblem(problemsOf(copyEn(), es), 'id is "tutorial-2" in en and "tutorial-9" in es');
  });

  it('rule 9: the same slots in both languages', () => {
    const es = copyEs();
    delete es.pages[0].panels['roots-hall'].south;
    expectProblem(problemsOf(copyEn(), es), 'roots-hall south: the slot is filled in en only');
  });

  it('rule 9: the same layout, image and key in each slot', () => {
    const es = copyEs();
    slot(es, 1, 'roots-step', 'south').key = 'jump';
    expectProblem(problemsOf(copyEn(), es), 'key is "move" in en and "jump" in es');
  });

  it('rule 9: the same set of fields in each slot', () => {
    const es = copyEs();
    delete slot(es, 1, 'roots-hall', 'south').note;
    expectProblem(problemsOf(copyEn(), es), 'fields differ');
  });

  // 10. Key cap messages
  it('rule 10: every key cap label and verb exists in every language', () => {
    const refs: BookRefs = {
      images: knownImageIds(),
      message: (lang, key) => (key === 'keycap.cast.verb' && lang === 'es' ? undefined : bookMessage(lang, key)),
    };
    expectProblem(problemsOf(copyEn(), copyEs(), refs), 'message keycap.cast.verb is missing in es');
  });

  it('lists every problem, not only the first', () => {
    const en = copyEn();
    en.version = 2;
    slot(en, 1, 'roots-hall', 'north').image = 'lesson/nowhere';
    slot(en, 2, 'roots-step', 'south').text = 'Two  spaces.';
    const found = problemsOf(en, copyEs());
    expect(found.length).toBeGreaterThanOrEqual(3);
    expectProblem(found, 'version must be 1');
    expectProblem(found, 'does not resolve');
    expectProblem(found, 'double space');
  });

  it('throws a BookValidationError carrying the problems', () => {
    const en = copyEn();
    en.version = 2;
    expect(() => validateBook(en, copyEs(), bookRefs())).toThrow(BookValidationError);
  });
});

describe('the image manifest (images.ts)', () => {
  it('lists thirty-nine lesson captures and forty-five portraits, each once', () => {
    expect(LESSON_IMAGES.length).toBe(39);
    expect(new Set(LESSON_IMAGES).size).toBe(39);
    expect(BESTIARY_PORTRAITS.length).toBe(45);
    expect(new Set(BESTIARY_PORTRAITS).size).toBe(45);
  });

  it('every portrait is an entity of the game: a projection, creature, boss or presence, the Boundary, or a sky guardian or herd', () => {
    const sky = (id: string) => {
      const [role, animal] = id.split(/-(.*)/s);
      return (role === 'guardian' && animal in DEITIES) || (role === 'herd' && animal in MINIONS);
    };
    for (const id of BESTIARY_PORTRAITS) {
      const known = ENEMY_BY_ID.has(id) || CREATURE_BY_ID.has(id) || BOSS_BY_ID.has(id) || PRESENCE_BY_ID.has(id) || id === boundary.id || sky(id);
      expect(known, id).toBe(true);
    }
  });

  it('resolves each namespace to its file or to the game icon', () => {
    expect(resolveImage('bestiary/doubt')).toEqual({ kind: 'portrait', id: 'doubt', file: 'book/bestiary/doubt.webp' });
    expect(resolveImage('lesson/blocks')).toEqual({ kind: 'lesson', name: 'blocks', file: 'book/lesson/blocks.webp' });
    expect(resolveImage('icon/potion/plain-tonic')).toEqual({ kind: 'icon', icon: 'potion', id: 'plain-tonic' });
    expect(resolveImage('icon/heart/stone')).toEqual({ kind: 'icon', icon: 'heart', id: 'stone' });
    expect(resolveImage('icon/item/grounding')).toEqual({ kind: 'icon', icon: 'item', id: 'grounding' });
  });

  it('refuses unknown ids, bare names and paths', () => {
    for (const id of ['bestiary/nobody', 'lesson/nowhere', 'icon/item/nothing', 'icon/potion/nothing', 'icon/heart/gold', 'icon/gem/stone', 'blocks', 'lesson/../blocks', 'book/lesson/blocks.webp']) {
      expect(resolveImage(id), id).toBeUndefined();
    }
  });

  it('knows every id the manifest lists', () => {
    const known = knownImageIds();
    for (const name of LESSON_IMAGES) expect(known.has(`lesson/${name}`)).toBe(true);
    for (const id of BESTIARY_PORTRAITS) expect(known.has(`bestiary/${id}`)).toBe(true);
    expect(known.has('icon/item/selfcompassion')).toBe(true);
  });

  it('the placeholders are every lesson control plus drink', () => {
    for (const action of LESSON_CONTROLS) expect(PLACEHOLDER_ACTIONS).toContain(action);
    expect(PLACEHOLDER_ACTIONS).toContain('drink');
  });
});

/** A quotation in the treasure room's north slot of `page` (a book page by default), in both files. */
function withQuote(en: Raw, es: Raw, page = 8, patchEn: Record<string, unknown> = {}, patchEs: Record<string, unknown> = {}) {
  const facts = { author: 'Ana Autora', work: 'La obra', publisher: 'Editorial Uno', year: 1995, lang: 'es' };
  // JSON.parse(JSON.stringify(…)) drops every field a patch sets to undefined.
  const build = (text: string, patch: Record<string, unknown>) => JSON.parse(JSON.stringify({ id: `${page}-gift-n`, layout: 'quote', text, ...facts, ...patch }));
  en.pages[page - 1].panels['roots-gift'] = { north: build('A quotation, translated.', patchEn) };
  es.pages[page - 1].panels['roots-gift'] = { north: build('Una cita original.', patchEs) };
  return { en, es };
}

/** The problems of a book with a quotation on page 8, the copies patched per language. */
const quoted = (patchEn: Record<string, unknown> = {}, patchEs: Record<string, unknown> = {}, page = 8) => {
  const { en, es } = withQuote(copyEn(), copyEs(), page, patchEn, patchEs);
  return problemsOf(en, es);
};

describe('quotations (BOOK-DATA §2b, PANELS §4b): the quote layout', () => {
  it('a quote with its author, work and language passes on a book page', () => {
    expect(quoted()).toEqual([]);
  });

  it('a quote without an author fails', () => {
    expectProblem(quoted({ author: undefined }, { author: undefined }), '"author" is missing');
  });

  it('a quote without a work fails', () => {
    expectProblem(quoted({ work: undefined }, { work: undefined }), '"work" is missing');
  });

  it('a quote without its language fails', () => {
    expectProblem(quoted({ lang: undefined }, { lang: undefined }), '"lang" is missing');
  });

  it('a quote on a tutorial page fails', () => {
    expectProblem(quoted({}, {}, 2), 'a quote is only allowed on a book page');
  });

  it('a quote takes no image, key or other field its layout does not allow', () => {
    expectProblem(quoted({ image: 'lesson/blocks' }, { image: 'lesson/blocks' }), '"image" is not a field of a quote panel');
  });

  it('a quote has no placeholders: its text is the quotation as printed', () => {
    expectProblem(quoted({ text: 'Press {jump}.' }, { text: 'Press {jump}.' }), 'placeholders are only allowed in lesson and plate text');
  });

  it('the facts of a quote (author, work, publisher, year, language) are identical in both files', () => {
    expectProblem(quoted({}, { author: 'Otra Persona' }), 'author is "Ana Autora" in en and "Otra Persona" in es');
    expectProblem(quoted({ year: 1996 }, {}), 'year is 1996 in en and 1995 in es');
  });

  it('a quote year is a whole number from 1000 to this year', () => {
    expect(quoted({ year: 1000 }, { year: 1000 })).toEqual([]);
    const next = new Date().getFullYear() + 1;
    for (const bad of [999, next, 1995.5, '1995']) {
      expectProblem(quoted({ year: bad }, { year: bad }), 'year must be a whole number from 1000');
    }
  });

  it('a quote language is one of the shipped languages', () => {
    expectProblem(quoted({ lang: 'fr' }, { lang: 'fr' }), 'lang "fr" is not a shipped language');
  });

  it('the quotation text is within its budget of 440 characters', () => {
    expect(quoted({ text: 'a'.repeat(440) }, { text: 'a'.repeat(440) })).toEqual([]);
    expectProblem(quoted({ text: 'a'.repeat(441) }, { text: 'a'.repeat(441) }), '"text" is 441 characters with the longest labels, the budget is 440');
  });

  it('the author is within 40 characters, the work within 48 and the publisher within 32', () => {
    expectProblem(quoted({ author: 'a'.repeat(41) }, { author: 'a'.repeat(41) }), 'the budget is 40');
    expectProblem(quoted({ work: 'w'.repeat(49) }, { work: 'w'.repeat(49) }), 'the budget is 48');
    expectProblem(quoted({ publisher: 'p'.repeat(33) }, { publisher: 'p'.repeat(33) }), 'the budget is 32');
  });

  it('the source line ("Work · Publisher, Year") is within 60 characters', () => {
    // 40 + 3 + 11 + 6 = 60 passes; one more letter does not.
    expect(quoted({ work: 'w'.repeat(40), publisher: 'p'.repeat(11) }, { work: 'w'.repeat(40), publisher: 'p'.repeat(11) })).toEqual([]);
    expectProblem(quoted({ work: 'w'.repeat(40), publisher: 'p'.repeat(12) }, { work: 'w'.repeat(40), publisher: 'p'.repeat(12) }), 'the budget is 60');
  });

  it('the translation note (book.quote.translated) exists in both languages, within 24 characters', () => {
    const { en, es } = withQuote(copyEn(), copyEs());
    const missing: BookRefs = { images: knownImageIds(), message: (lang, key) => (key === 'book.quote.translated' && lang === 'es' ? undefined : bookMessage(lang, key)) };
    expectProblem(problemsOf(en, es, missing), 'message book.quote.translated is missing in es');
    const long: BookRefs = { images: knownImageIds(), message: (lang, key) => (key === 'book.quote.translated' ? 'x'.repeat(25) : bookMessage(lang, key)) };
    expectProblem(problemsOf(en, es, long), 'book.quote.translated is 25 characters in en, the budget is 24');
  });

  it('the source line is drawn as "Work · Publisher, Year", with only the parts that are given', () => {
    expect(quoteSource({ work: 'W', publisher: 'P', year: 1995 })).toBe('W · P, 1995');
    expect(quoteSource({ work: 'W', publisher: 'P' })).toBe('W · P');
    expect(quoteSource({ work: 'W', year: 1995 })).toBe('W, 1995');
    expect(quoteSource({ work: 'W' })).toBe('W');
  });

  it('page 7 quotes the same source in both files, in Spanish, as the owner gave it', () => {
    const en = panelById(shipped('en'), '7-gift-n');
    const es = panelById(shipped('es'), '7-gift-n');
    expect(en).toMatchObject({ layout: 'quote', author: 'Guillermo Borja', work: 'La locura lo cura (extractos)', publisher: 'Editorial La Llave', year: 1995, lang: 'es' });
    expect(es).toMatchObject({ layout: 'quote', author: 'Guillermo Borja', work: 'La locura lo cura (extractos)', publisher: 'Editorial La Llave', year: 1995, lang: 'es' });
    expect(quoteSource(es as { work: string; publisher: string; year: number })).toBe('La locura lo cura (extractos) · Editorial La Llave, 1995');
    expect((es as { text: string }).text.length).toBeLessThanOrEqual(440);
  });
});

describe('panel ids (BOOK-DATA §2): page, room and side, unique, the same in both files', () => {
  it('every shipped panel carries the id of its page, room and side', () => {
    shipped('en').pages.forEach((page, index) => {
      for (const [room, slot] of Object.entries(page.panels)) {
        for (const [side, panel] of Object.entries(slot ?? {})) {
          expect(panel?.id, `page ${index + 1} ${room} ${side}`).toBe(panelIdOf(index + 1, room as RoomKey, side as Side));
        }
      }
    });
  });

  it('the ids read as the examples: 1-hall-n, 3-pit-s, 7-gift-n', () => {
    expect(panelIdOf(1, 'roots-hall', 'north')).toBe('1-hall-n');
    expect(panelIdOf(3, 'roots-pit', 'south')).toBe('3-pit-s');
    expect(panelIdOf(7, 'roots-gift', 'north')).toBe('7-gift-n');
  });

  it('an id that does not match its page, room and side fails', () => {
    const en = copyEn();
    en.pages[0].panels['roots-hall'].north.id = '2-hall-n';
    expectProblem(problemsOf(en, copyEs()), 'id "2-hall-n" must be "1-hall-n" (its page, room and side)');
  });

  it('a panel without an id fails', () => {
    const en = copyEn();
    delete en.pages[0].panels['roots-hall'].north.id;
    expectProblem(problemsOf(en, copyEs()), '"id" is missing');
  });

  it('an id is unique in the file', () => {
    const en = copyEn();
    en.pages[0].panels['roots-hall'].south.id = '1-hall-n';
    expectProblem(problemsOf(en, copyEs()), 'id "1-hall-n" is not unique in the file');
  });

  it('the two languages give a panel the same id', () => {
    const es = copyEs();
    es.pages[0].panels['roots-hall'].north.id = '1-hall-x';
    expectProblem(problemsOf(copyEn(), es), 'id is "1-hall-n" in en and "1-hall-x" in es');
  });

  it('panelById finds a panel of either file by its id, and nothing for an unknown id', () => {
    const en = shipped('en');
    expect(panelById(en, '1-hall-n')).toEqual(en.pages[0].panels['roots-hall']?.north);
    expect(panelById(shipped('es'), '1-hall-n')).toEqual(shipped('es').pages[0].panels['roots-hall']?.north);
    expect(panelById(en, '9-hall-n')).toBeUndefined();
  });
});

// ── the remembered panels (EASY-LAYOUT §4, BOOK-DATA §1, §2, §6 rule 11) ──

/** The five slots whose page-1 panel teaches an exercise the easy layout no longer has. */
const REMEMBERED: readonly (readonly [RoomKey, Side])[] = [
  ['roots-step', 'south'], ['roots-dig', 'south'], ['roots-pit', 'north'], ['roots-bridge', 'north'], ['roots-seal', 'south'],
];
const isRemembered = (room: RoomKey, side: Side) => REMEMBERED.some(([r, s]) => r === room && s === side);

/** Every (room, side) slot of the Roots. */
const EVERY_SLOT: readonly (readonly [RoomKey, Side])[] = ROOM_KEYS.flatMap(room => SIDES.map(side => [room, side] as const));

/** A copy of a raw book with its `easy` object replaced, or removed when `easy` is undefined. */
const withEasy = (raw: Raw, easy: unknown): Raw => {
  if (easy === undefined) delete raw.easy;
  else raw.easy = easy;
  return raw;
};

describe('the remembered panels: the shipped layer (EASY-LAYOUT §4)', () => {
  it('holds exactly the five remembered slots, with their ids, in both languages', () => {
    const listed = (book: Book) => Object.entries(book.easy ?? {}).flatMap(
      ([room, slot]) => Object.entries(slot ?? {}).map(([side, panel]) => [room, side, panel?.id]),
    );
    const expected = [
      ['roots-step', 'south', 'easy-step-s'], ['roots-dig', 'south', 'easy-dig-s'], ['roots-pit', 'north', 'easy-pit-n'],
      ['roots-bridge', 'north', 'easy-bridge-n'], ['roots-seal', 'south', 'easy-seal-s'],
    ];
    expect(listed(shipped('en'))).toEqual(expected);
    expect(listed(shipped('es'))).toEqual(expected);
  });

  it('every remembered panel is a lesson with a key and an image that resolves', () => {
    for (const lang of ['en', 'es'] as const) {
      for (const [room, side] of REMEMBERED) {
        const panel = shipped(lang).easy?.[room]?.[side];
        expect(panel?.layout, `${lang} ${room} ${side}`).toBe('lesson');
        expect(resolveImage((panel as { image: string }).image), `${lang} ${room} ${side}`).toBeDefined();
      }
    }
  });

  it('the id of a remembered panel is easy-<room>-<side>, whatever its page', () => {
    expect(easyPanelIdOf('roots-step', 'south')).toBe('easy-step-s');
    expect(easyPanelIdOf('roots-pit', 'north')).toBe('easy-pit-n');
    expect(easyPanelIdOf('roots-seal', 'south')).toBe('easy-seal-s');
  });

  it('easy is optional: a book without it passes', () => {
    expect(problemsOf(withEasy(copyEn(), undefined), withEasy(copyEs(), undefined))).toEqual([]);
  });

  it('a book with an empty easy object passes', () => {
    expect(problemsOf(withEasy(copyEn(), {}), withEasy(copyEs(), {}))).toEqual([]);
  });
});

describe('the remembered panels: validation (BOOK-DATA §6 rule 11)', () => {
  /** The problems of the shipped book with one remembered panel patched in both languages, or with `patch` per language. */
  const patched = (patchEn: (easy: Raw) => void, patchEs: (easy: Raw) => void = patchEn) => {
    const en = copyEn();
    const es = copyEs();
    patchEn(en.easy);
    patchEs(es.easy);
    return problemsOf(en, es);
  };

  it('easy must be an object of rooms', () => {
    expectProblem(problemsOf(withEasy(copyEn(), 'roots-step'), withEasy(copyEs(), 'roots-step')), 'easy must be an object of rooms');
  });

  it('an easy room must be one of the eleven', () => {
    const en = copyEn();
    en.easy['roots-moon'] = { south: en.easy['roots-step'].south };
    expectProblem(problemsOf(en, copyEs()), 'easy: unknown room "roots-moon"');
  });

  it('an easy side must be north or south', () => {
    const en = copyEn();
    en.easy['roots-step'].east = en.easy['roots-step'].south;
    expectProblem(problemsOf(en, copyEs()), 'easy roots-step: unknown side "east"');
  });

  it('an easy panel carries the id of its room and side', () => {
    expectProblem(patched(easy => { easy['roots-step'].south.id = 'easy-step-n'; }), 'id "easy-step-n" must be "easy-step-s"');
  });

  it('an easy id is unique in the file', () => {
    expectProblem(patched(easy => { easy['roots-dig'].south.id = 'easy-step-s'; }), 'id "easy-step-s" is not unique in the file');
  });

  it('an easy id does not collide with a page id', () => {
    const en = copyEn();
    en.easy['roots-dig'].south.id = '1-hall-n';
    expectProblem(problemsOf(en, copyEs()), 'id "1-hall-n" is not unique in the file');
  });

  it('an easy panel has a known layout and no field its layout does not allow', () => {
    expectProblem(patched(easy => { easy['roots-pit'].north.layout = 'poster'; }), 'unknown layout "poster"');
    expectProblem(patched(easy => { easy['roots-pit'].north.note = 'x'; }), '"note" is not a field of a lesson panel');
  });

  it('a quote is refused in the easy layout, which is not a book page', () => {
    const quote = { id: 'easy-dig-s', layout: 'quote', text: 'A quotation.', author: 'A', work: 'W', lang: 'es' };
    expectProblem(patched(easy => { easy['roots-dig'].south = { ...quote }; }), 'a quote is only allowed on a book page');
  });

  it('an easy text has the same budget as a tutorial text, with the longest labels', () => {
    expectProblem(patched(easy => { easy['roots-dig'].south.title = 'a'.repeat(23); }), '"title" is 23 characters with the longest labels, the budget is 22');
    expectProblem(patched(easy => { easy['roots-step'].south.text = `{jump} ${'a'.repeat(120)}`; }), 'the budget is 120');
  });

  it('an easy image must resolve, its key must be an action, and its placeholders must be known', () => {
    expectProblem(patched(easy => { easy['roots-dig'].south.image = 'lesson/nowhere'; }), 'image "lesson/nowhere" does not resolve');
    expectProblem(patched(easy => { easy['roots-dig'].south.key = 'fly'; }), 'key "fly" is not an action with a key cap');
    expectProblem(patched(easy => { easy['roots-step'].south.text = '{fly} jumps one block.'; }), 'unknown placeholder {fly}');
  });

  it('an easy slot filled in one language only fails', () => {
    const en = copyEn();
    const es = copyEs();
    delete es.easy['roots-pit'];
    expectProblem(problemsOf(en, es), 'easy roots-pit north: the slot is filled in en only');
  });

  it('an easy slot whose facts differ between the files fails', () => {
    const es = copyEs();
    es.easy['roots-pit'].north.key = 'cast';
    expectProblem(problemsOf(copyEn(), es), 'easy roots-pit north: key is "place" in en and "cast" in es');
  });

  it('an easy slot whose fields differ between the files fails', () => {
    const es = copyEs();
    delete es.easy['roots-dig'].south.key;
    expectProblem(problemsOf(copyEn(), es), 'easy roots-dig south: fields differ');
  });
});

describe('the remembered panels: resolution (EASY-LAYOUT §4)', () => {
  const book = shipped('en');
  const pages = pageCount(book);
  const pageOne = (room: RoomKey, side: Side) => book.pages[0].panels[room]?.[side];
  const own = (page: number, room: RoomKey, side: Side) => book.pages[page - 1].panels[room]?.[side];
  const remembered = (room: RoomKey, side: Side) => book.easy?.[room]?.[side];

  it('the layout defaults to the teaching layout', () => {
    for (let page = 1; page <= pages; page++) {
      for (const [room, side] of EVERY_SLOT) {
        expect(panelAt(book, page, room, side), `page ${page} ${room} ${side}`).toBe(panelAt(book, page, room, side, 'teaching'));
      }
    }
  });

  it('the teaching layout is today\'s rule on every page and every slot', () => {
    for (let page = 1; page <= pages; page++) {
      for (const [room, side] of EVERY_SLOT) {
        const expected = (page >= 2 && own(page, room, side)) || pageOne(room, side);
        expect(panelAt(book, page, room, side, 'teaching'), `page ${page} ${room} ${side}`).toBe(expected);
      }
    }
  });

  it('the teaching layout never shows a remembered panel', () => {
    for (let page = 1; page <= pages; page++) {
      for (const [room, side] of REMEMBERED) {
        expect(panelAt(book, page, room, side, 'teaching')).not.toBe(remembered(room, side));
      }
    }
  });

  it('the easy layout equals the teaching layout in every slot the easy layer does not remember', () => {
    for (let page = 1; page <= pages; page++) {
      for (const [room, side] of EVERY_SLOT) {
        if (isRemembered(room, side)) continue;
        expect(panelAt(book, page, room, side, 'easy'), `page ${page} ${room} ${side}`).toBe(panelAt(book, page, room, side, 'teaching'));
      }
    }
  });

  it('the easy layout shows the remembered panel of the four lesson walls on every page that leaves the slot out', () => {
    for (let page = 1; page <= pages; page++) {
      for (const [room, side] of [['roots-dig', 'south'], ['roots-pit', 'north'], ['roots-bridge', 'north'], ['roots-seal', 'south']] as const) {
        const expected = (page >= 2 && own(page, room, side)) || remembered(room, side);
        expect(panelAt(book, page, room, side, 'easy'), `page ${page} ${room} ${side}`).toBe(expected);
      }
    }
  });

  it('pages 1, 2 and the book pages leave the four lesson walls to the remembered panels; pages 3 to 6 fill them', () => {
    for (const [room, side] of [['roots-dig', 'south'], ['roots-pit', 'north'], ['roots-bridge', 'north'], ['roots-seal', 'south']] as const) {
      for (const page of [1, 2, 7, 8, 9]) expect(panelAt(book, page, room, side, 'easy'), `page ${page} ${room} ${side}`).toBe(remembered(room, side));
      for (let page = 3; page <= 6; page++) expect(panelAt(book, page, room, side, 'easy'), `page ${page} ${room} ${side}`).toBe(own(page, room, side));
    }
  });

  it('the easy layout shows the step room\'s remembered panel on page 1 and on the book pages (7 to 9)', () => {
    for (const page of [1, 7, 8, 9]) {
      expect(panelAt(book, page, 'roots-step', 'south', 'easy')).toBe(remembered('roots-step', 'south'));
    }
  });

  it('the easy layout shows page n\'s own panel where page n fills the step room\'s south slot (pages 2 to 6)', () => {
    for (let page = 2; page <= 6; page++) {
      expect(own(page, 'roots-step', 'south')).toBeDefined();
      expect(panelAt(book, page, 'roots-step', 'south', 'easy')).toBe(own(page, 'roots-step', 'south'));
    }
    expect(panelAt(book, 1, 'roots-step', 'south', 'easy')).toBe(remembered('roots-step', 'south'));
  });

  it('the easy layout on page 1 reads the remembered panels in the five slots, page 1\'s elsewhere', () => {
    expect(panelAt(book, 1, 'roots-dig', 'south', 'easy')).toBe(remembered('roots-dig', 'south'));
    expect(panelAt(book, 1, 'roots-dig', 'north', 'easy')).toBe(pageOne('roots-dig', 'north'));
    expect(panelAt(book, 1, 'roots-gift', 'north', 'easy')).toBe(pageOne('roots-gift', 'north'));
  });

  it('a remembered slot on page 2 in the teaching layout shows the exercise, as before', () => {
    expect(panelAt(book, 2, 'roots-dig', 'south', 'teaching')).toBe(pageOne('roots-dig', 'south'));
  });

  it('throws on a layout that does not exist', () => {
    expect(() => panelAt(book, 1, 'roots-hall', 'north', 'night' as never)).toThrow(RangeError);
  });

  it('panelById finds the remembered panels in both languages', () => {
    expect(panelById(shipped('en'), 'easy-dig-s')).toBe(shipped('en').easy?.['roots-dig']?.south);
    expect(panelById(shipped('es'), 'easy-seal-s')).toBe(shipped('es').easy?.['roots-seal']?.south);
    expect(panelById(shipped('en'), 'easy-gift-n')).toBeUndefined();
  });
});

describe('the image layout: a picture alone, with an optional caption', () => {
  /** An image panel with its id by position, the copy patched per language (undefined drops a field). */
  const imagePanel = (id: string, patch: Record<string, unknown>) => JSON.parse(JSON.stringify({ id, layout: 'image', image: 'bestiary/doubt', ...patch }));

  /** The problems of the shipped book with an image panel in a slot of page `page` (its id by position), patched per language. */
  const imageOn = (page: number, room: RoomKey, side: Side, patchEn: Record<string, unknown> = {}, patchEs: Record<string, unknown> = patchEn) => {
    const en = copyEn();
    const es = copyEs();
    const id = panelIdOf(page, room, side);
    en.pages[page - 1].panels[room] ??= {};
    es.pages[page - 1].panels[room] ??= {};
    en.pages[page - 1].panels[room][side] = imagePanel(id, patchEn);
    es.pages[page - 1].panels[room][side] = imagePanel(id, patchEs);
    return problemsOf(en, es);
  };

  /** The problems of the shipped book with an image panel in the remembered slot of `room` and `side`, patched per language. */
  const imageEasy = (room: RoomKey, side: Side, patchEn: Record<string, unknown> = {}, patchEs: Record<string, unknown> = patchEn) => {
    const en = copyEn();
    const es = copyEs();
    en.easy[room][side] = imagePanel(easyPanelIdOf(room, side), patchEn);
    es.easy[room][side] = imagePanel(easyPanelIdOf(room, side), patchEs);
    return problemsOf(en, es);
  };

  const sixty = 'a'.repeat(IMAGE_CAPTION_BUDGET);

  it('a picture alone passes on a tutorial page, on a book page and among the remembered panels', () => {
    expect(imageOn(2, 'roots-hall', 'south')).toEqual([]);
    expect(imageOn(8, 'roots-hall', 'south')).toEqual([]);
    expect(imageOn(7, 'roots-gift', 'south', { caption: 'A caption.' }, { caption: 'Un pie.' })).toEqual([]);
    expect(imageEasy('roots-dig', 'south')).toEqual([]);
  });

  it('a picture alone needs its id and its image', () => {
    expectProblem(imageOn(2, 'roots-hall', 'south', { image: undefined }), '"image" is missing');
    expectProblem(imageOn(2, 'roots-hall', 'south', { id: undefined }), '"id" is missing');
  });

  it('a picture alone has no title, text or other field: the layout refuses them', () => {
    expectProblem(imageOn(2, 'roots-hall', 'south', { title: 'A title' }), '"title" is not a field of a image panel');
    expectProblem(imageOn(2, 'roots-hall', 'south', { text: 'Some text.' }), '"text" is not a field of a image panel');
    expectProblem(imageOn(2, 'roots-hall', 'south', { key: 'move' }), '"key" is not a field of a image panel');
  });

  it('the image resolves to a lesson capture, a portrait or a game icon, and nothing else', () => {
    expect(imageOn(2, 'roots-hall', 'south', { image: 'lesson/blocks' })).toEqual([]);
    expect(imageOn(2, 'roots-hall', 'south', { image: 'icon/heart/stone' })).toEqual([]);
    expectProblem(imageOn(2, 'roots-hall', 'south', { image: 'lesson/nowhere' }), 'image "lesson/nowhere" does not resolve');
  });

  it('the caption is optional: a picture without one passes', () => {
    expect(imageOn(2, 'roots-hall', 'south', { caption: undefined })).toEqual([]);
  });

  it('a caption is within its budget of 60 characters, the longest labels counted', () => {
    expect(imageOn(2, 'roots-hall', 'south', { caption: sixty }, { caption: sixty })).toEqual([]);
    const over = 'a'.repeat(IMAGE_CAPTION_BUDGET + 1);
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: over }, { caption: over }), `"caption" is ${IMAGE_CAPTION_BUDGET + 1} characters with the longest labels, the budget is ${IMAGE_CAPTION_BUDGET}`);
    expect(IMAGE_CAPTION_BUDGET).toBe(60);
  });

  it('a caption is not empty and has no markup or stray spaces', () => {
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: '' }), '"caption" is empty');
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: '<i>Sample</i>' }), '"caption" contains markup');
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: ' Sample.' }), '"caption" has a leading or trailing space');
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: 'Two  spaces.' }), '"caption" has a double space');
  });

  it('a caption is a string and carries no placeholders: its words are drawn as written', () => {
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: 42 }), '"caption" must be a string');
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: 'Press {jump}.' }), 'placeholders are only allowed in lesson and plate text');
  });

  it('a caption may differ in words between the files, but the layout and the image are the same fact in both', () => {
    expect(imageOn(2, 'roots-hall', 'south', { caption: 'One.' }, { caption: 'Uno.' })).toEqual([]);
    expectProblem(imageOn(2, 'roots-hall', 'south', { image: 'lesson/blocks' }, { image: 'bestiary/doubt' }), 'image is "lesson/blocks" in en and "bestiary/doubt" in es');
  });

  it('a caption is in both files or in neither: its fields differ otherwise', () => {
    expectProblem(imageOn(2, 'roots-hall', 'south', { caption: 'One.' }, { caption: undefined }), 'fields differ');
  });
});
