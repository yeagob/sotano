// The Roots' book: two JSON files, one per language, loaded and validated at start
// (docs/design/not-built/levels/roots/BOOK-DATA.md). The validator is pure: it takes the parsed files
// and what they refer to, and lists every problem before it throws. Nothing falls back silently.

import bookEn from './book.en.json';
import bookEs from './book.es.json';
import { EN, type MessageKey } from '../../i18n/locales/en';
import { ES } from '../../i18n/locales/es';
import { LESSON_CONTROLS } from '../../input/labels';
import { knownImageIds } from './images';

export type Lang = 'en' | 'es';

/** The eleven rooms of the Roots that carry panels (their template ids). */
export const ROOM_KEYS = [
  'roots-hall', 'roots-step', 'roots-dig', 'roots-mend', 'roots-pit', 'roots-bridge',
  'roots-seal', 'roots-crates', 'roots-spring', 'roots-gift', 'roots-door',
] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export const SIDES = ['north', 'south'] as const;
export type Side = (typeof SIDES)[number];

/** The actions a key cap can draw (BOOK-DATA §5). */
export const KEY_ACTIONS = ['move', 'jump', 'cast', 'polarity', 'place', 'throw', 'bomb', 'drink', 'inventory'] as const;
export type KeyAction = (typeof KEY_ACTIONS)[number];

/** The actions a `{placeholder}` may name: the lesson controls, plus drink (BOOK-DATA §3). */
export type PlaceholderAction = (typeof LESSON_CONTROLS)[number] | 'drink';
export const PLACEHOLDER_ACTIONS: readonly PlaceholderAction[] = [...new Set<PlaceholderAction>([...LESSON_CONTROLS, 'drink'])];

export type ImageId = string;

export interface LessonPanel {
  readonly layout: 'lesson';
  readonly title: string;
  readonly text: string;
  readonly image: ImageId;
  readonly key?: KeyAction;
}

export interface PlatePanel {
  readonly layout: 'plate';
  readonly title: string;
  readonly subtitle: string;
  readonly text: string;
  readonly image: ImageId;
  readonly note?: string;
}

export interface ProsePanel {
  readonly layout: 'prose';
  readonly text: string;
}

export type Panel = LessonPanel | PlatePanel | ProsePanel;

export type Slot = Partial<Record<Side, Panel>>;

export interface BookPage {
  readonly id: string;
  readonly kind: 'tutorial' | 'book';
  readonly panels: Partial<Record<RoomKey, Slot>>;
}

export interface Book {
  readonly version: 1;
  readonly language: Lang;
  readonly pages: readonly BookPage[];
}

export interface BookPair {
  readonly en: Book;
  readonly es: Book;
}

/** What the files refer to, passed in so the validator stays pure. */
export interface BookRefs {
  /** Every image id that may be used (images.ts `knownImageIds`; file existence is checked elsewhere). */
  readonly images: ReadonlySet<string>;
  /** The message text of a key in a language, or `undefined` when the catalog lacks it. */
  readonly message: (lang: Lang, key: string) => string | undefined;
}

export class BookValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`The book does not validate (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n- ${problems.join('\n- ')}`);
    this.name = 'BookValidationError';
    this.problems = problems;
  }
}

/** The real catalogs as the validator's `message` reference. */
export function bookMessage(lang: Lang, key: string): string | undefined {
  const message = (lang === 'en' ? EN : ES).messages[key as MessageKey];
  return typeof message === 'string' ? message : undefined;
}

/** The references of the shipped book: the real image ids and the real catalogs. */
export function bookRefs(): BookRefs {
  return { images: knownImageIds(), message: bookMessage };
}

// ── the layouts and their budgets (BOOK-DATA §2, PANELS §5) ──

type Layout = Panel['layout'];

const LAYOUTS: Record<Layout, { required: readonly string[]; optional: readonly string[] }> = {
  lesson: { required: ['title', 'text', 'image'], optional: ['key'] },
  plate: { required: ['title', 'subtitle', 'text', 'image'], optional: ['note'] },
  prose: { required: ['text'], optional: [] },
};

/** Characters per text field, counted with each placeholder at its longest label. */
const BUDGET: Record<Layout, Partial<Record<string, number>>> = {
  lesson: { title: 22, text: 120 },
  plate: { title: 22, subtitle: 30, text: 110, note: 30 },
  prose: { text: 320 },
};

const KEYCAP_BUDGET = 14;
const KEYCAP_PARTS = ['key', 'pad', 'touch', 'verb'] as const;
const DEVICE_PARTS = ['key', 'pad', 'touch'] as const;
const PAGE_FIELDS: readonly string[] = ['id', 'kind', 'panels'];
const TOP_FIELDS: readonly string[] = ['version', 'language', 'pages'];
const PAGE_ID = /^[a-z0-9-]+$/;
const ROOM_SET: ReadonlySet<string> = new Set<string>(ROOM_KEYS);
const SIDE_SET: ReadonlySet<string> = new Set<string>(SIDES);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isLayout = (v: unknown): v is Layout => typeof v === 'string' && v in LAYOUTS;
const isKeyAction = (v: unknown): v is KeyAction => typeof v === 'string' && (KEY_ACTIONS as readonly string[]).includes(v);
const isPlaceholder = (v: string): v is PlaceholderAction => (PLACEHOLDER_ACTIONS as readonly string[]).includes(v);
const show = (v: unknown): string => JSON.stringify(v) ?? String(v);
const length = (s: string) => [...s].length;

/** The longest label a control has on any device in a language (BOOK-DATA §3). */
function longestLabel(refs: BookRefs, lang: Lang, action: string): string | undefined {
  let longest: string | undefined;
  for (const part of DEVICE_PARTS) {
    const label = refs.message(lang, `controls.${action}.${part}`);
    if (label !== undefined && (longest === undefined || length(label) > length(longest))) longest = label;
  }
  return longest;
}

/** The text's length with each valid placeholder replaced by its longest label, or undefined if one has none. */
function measured(refs: BookRefs, lang: Lang, text: string): number | undefined {
  let complete = true;
  const filled = text.replace(/\{([^{}]*)\}/g, (all: string, name: string) => {
    const label = isPlaceholder(name) ? longestLabel(refs, lang, name) : undefined;
    if (label === undefined) { complete = false; return all; }
    return label;
  });
  return complete ? length(filled) : undefined;
}

function checkText(where: string, field: string, text: string, problems: string[]) {
  if (text.length === 0) problems.push(`${where}: "${field}" is empty`);
  if (/[<>]/.test(text)) problems.push(`${where}: "${field}" contains markup (< or >)`);
  if (text !== text.trim()) problems.push(`${where}: "${field}" has a leading or trailing space`);
  if (/ {2}/.test(text)) problems.push(`${where}: "${field}" has a double space`);
}

function checkPlaceholders(where: string, lang: Lang, text: string, refs: BookRefs, problems: string[]) {
  if (/[{}]/.test(text.replace(/\{[^{}]*\}/g, ''))) problems.push(`${where}: malformed placeholder (braces must hold one action name)`);
  for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
    const name = match[1];
    if (!isPlaceholder(name)) problems.push(`${where}: unknown placeholder {${name}}`);
    else if (longestLabel(refs, lang, name) === undefined) problems.push(`${where}: no ${lang} label for {${name}}`);
  }
}

function checkKeyCaps(where: string, lang: Lang, action: KeyAction, refs: BookRefs, problems: string[]) {
  for (const part of KEYCAP_PARTS) {
    const key = `keycap.${action}.${part}`;
    const label = refs.message(lang, key);
    if (label === undefined) problems.push(`${where}: message ${key} is missing in ${lang}`);
    else if (length(label) > KEYCAP_BUDGET) problems.push(`${where}: ${key} is ${length(label)} characters, the key cap budget is ${KEYCAP_BUDGET}`);
  }
}

function checkPanel(where: string, lang: Lang, raw: unknown, refs: BookRefs, problems: string[]) {
  if (!isRecord(raw)) { problems.push(`${where}: the panel is not an object`); return; }
  const layout = raw.layout;
  if (!isLayout(layout)) { problems.push(`${where}: unknown layout ${show(layout)}`); return; }
  const spec = LAYOUTS[layout];
  for (const field of Object.keys(raw)) {
    if (field !== 'layout' && !spec.required.includes(field) && !spec.optional.includes(field)) {
      problems.push(`${where}: "${field}" is not a field of a ${layout} panel`);
    }
  }
  for (const field of spec.required) {
    if (raw[field] === undefined) problems.push(`${where}: "${field}" is missing`);
  }
  for (const field of [...spec.required, ...spec.optional]) {
    const value = raw[field];
    if (value === undefined) continue;
    if (field === 'key') {
      if (!isKeyAction(value)) problems.push(`${where}: key ${show(value)} is not an action with a key cap`);
      else if (layout === 'lesson') checkKeyCaps(where, lang, value, refs, problems);
      continue;
    }
    if (typeof value !== 'string') { problems.push(`${where}: "${field}" must be a string`); continue; }
    checkText(where, field, value, problems);
    if (field === 'image') {
      if (!refs.images.has(value)) problems.push(`${where}: image "${value}" does not resolve`);
      continue;
    }
    if (field === 'text' && (layout === 'lesson' || layout === 'plate')) {
      checkPlaceholders(where, lang, value, refs, problems);
    } else if (/[{}]/.test(value)) {
      problems.push(`${where}: "${field}" has braces; placeholders are only allowed in lesson and plate text`);
    }
    const budget = BUDGET[layout][field];
    const count = budget === undefined ? undefined : measured(refs, lang, value);
    if (budget !== undefined && count !== undefined && count > budget) {
      problems.push(`${where}: "${field}" is ${count} characters with the longest labels, the budget is ${budget}`);
    }
  }
}

function checkFile(lang: Lang, raw: unknown, refs: BookRefs, problems: string[]) {
  const file = `book.${lang}.json`;
  if (!isRecord(raw)) { problems.push(`${file}: the file is not an object`); return; }
  for (const field of Object.keys(raw)) {
    if (!TOP_FIELDS.includes(field)) problems.push(`${lang}: unknown top-level field "${field}"`);
  }
  if (raw.version !== 1) problems.push(`${lang}: version must be 1, is ${show(raw.version)}`);
  if (raw.language !== lang) problems.push(`${file}: language must be "${lang}", is ${show(raw.language)}`);
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    problems.push(`${lang}: pages must be a list with at least one page`);
    return;
  }
  const seenIds = new Set<string>();
  const state = { seenBook: false };
  raw.pages.forEach((page: unknown, index: number) => checkPage(lang, index, page, refs, problems, seenIds, state));
}

function checkPage(
  lang: Lang, index: number, page: unknown, refs: BookRefs, problems: string[],
  seenIds: Set<string>, state: { seenBook: boolean },
) {
  const number = index + 1;
  const head = `${lang}: page ${number}`;
  if (!isRecord(page)) { problems.push(`${head}: the page is not an object`); return; }
  for (const field of Object.keys(page)) {
    if (!PAGE_FIELDS.includes(field)) problems.push(`${head}: unknown field "${field}"`);
  }
  const id = page.id;
  if (typeof id !== 'string' || !PAGE_ID.test(id)) problems.push(`${head}: id ${show(id)} must match ^[a-z0-9-]+$`);
  else if (seenIds.has(id)) problems.push(`${head}: id "${id}" is not unique`);
  else seenIds.add(id);
  const where = `${head} "${String(id)}"`;
  if (page.kind !== 'tutorial' && page.kind !== 'book') problems.push(`${where}: kind must be "tutorial" or "book", is ${show(page.kind)}`);
  if (index === 0 && page.kind !== 'tutorial') problems.push(`${where}: page 1 must be a tutorial page`);
  if (page.kind === 'tutorial' && state.seenBook) problems.push(`${where}: a tutorial page follows a book page`);
  if (page.kind === 'book') state.seenBook = true;
  if (!isRecord(page.panels)) { problems.push(`${where}: panels must be an object`); return; }
  const panels = page.panels;
  for (const room of Object.keys(panels)) {
    if (!ROOM_SET.has(room)) { problems.push(`${where}: unknown room "${room}"`); continue; }
    const slot = panels[room];
    if (!isRecord(slot)) { problems.push(`${where}: ${room} must hold north and/or south panels`); continue; }
    if (Object.keys(slot).length === 0) problems.push(`${where}: ${room} has no panel`);
    for (const side of Object.keys(slot)) {
      if (!SIDE_SET.has(side)) { problems.push(`${where}: ${room}: unknown side "${side}"`); continue; }
      checkPanel(`${where} ${room} ${side}`, lang, slot[side], refs, problems);
    }
  }
  if (index === 0) {
    for (const room of ROOM_KEYS) {
      for (const side of SIDES) {
        if (slotOf(panels, room, side) === undefined) problems.push(`${where}: page 1 has no panel for ${room} ${side}`);
      }
    }
  }
}

/** The panel at a room and side of a raw `panels` object, or undefined. */
function slotOf(panels: Record<string, unknown>, room: string, side: string): unknown {
  const slot = panels[room];
  return isRecord(slot) ? slot[side] : undefined;
}

/** The two files must have the same shape: same pages, ids and kinds, same slots, layouts, images, keys and fields. */
function checkShape(en: unknown, es: unknown, problems: string[]) {
  const pagesEn = isRecord(en) && Array.isArray(en.pages) ? en.pages : undefined;
  const pagesEs = isRecord(es) && Array.isArray(es.pages) ? es.pages : undefined;
  if (!pagesEn || !pagesEs) return;
  if (pagesEn.length !== pagesEs.length) {
    problems.push(`the languages differ in page count: en ${pagesEn.length}, es ${pagesEs.length}`);
  }
  const count = Math.min(pagesEn.length, pagesEs.length);
  for (let index = 0; index < count; index++) {
    const a = pagesEn[index];
    const b = pagesEs[index];
    if (!isRecord(a) || !isRecord(b)) continue;
    const head = `page ${index + 1}`;
    if (a.id !== b.id) problems.push(`${head}: id is ${show(a.id)} in en and ${show(b.id)} in es`);
    if (a.kind !== b.kind) problems.push(`${head}: kind is ${show(a.kind)} in en and ${show(b.kind)} in es`);
    const panelsA = isRecord(a.panels) ? a.panels : {};
    const panelsB = isRecord(b.panels) ? b.panels : {};
    for (const room of ROOM_KEYS) {
      for (const side of SIDES) {
        const slotA = slotOf(panelsA, room, side);
        const slotB = slotOf(panelsB, room, side);
        const where = `${head} ${room} ${side}`;
        if (slotA === undefined || slotB === undefined) {
          if (slotA !== slotB) problems.push(`${where}: the slot is filled in ${slotA === undefined ? 'es' : 'en'} only`);
          continue;
        }
        if (!isRecord(slotA) || !isRecord(slotB)) continue;
        const fieldsA = Object.keys(slotA).sort();
        const fieldsB = Object.keys(slotB).sort();
        if (fieldsA.join(',') !== fieldsB.join(',')) {
          problems.push(`${where}: fields differ: en [${fieldsA.join(', ')}], es [${fieldsB.join(', ')}]`);
          continue;
        }
        for (const field of ['layout', 'image', 'key'] as const) {
          if (slotA[field] !== slotB[field]) problems.push(`${where}: ${field} is ${show(slotA[field])} in en and ${show(slotB[field])} in es`);
        }
      }
    }
  }
}

/**
 * Checks both book files against the rules of BOOK-DATA §6 and returns them typed. Every problem is
 * collected; if there is any, throws a BookValidationError that lists all of them.
 */
export function validateBook(en: unknown, es: unknown, refs: BookRefs): BookPair {
  const problems: string[] = [];
  checkFile('en', en, refs, problems);
  checkFile('es', es, refs, problems);
  checkShape(en, es, problems);
  if (problems.length > 0) throw new BookValidationError(problems);
  // The checks above prove the shape; the cast only gives it the type.
  return { en: en as Book, es: es as Book };
}

let checked: BookPair | undefined;

/** The book of a language. Validates both shipped files on first use; throws if either is broken. */
export function loadBook(lang: Lang): Book {
  checked ??= validateBook(bookEn, bookEs, bookRefs());
  return checked[lang];
}

/** The number of pages (page 1 is the first tutorial page). */
export function pageCount(book: Book): number {
  return book.pages.length;
}

/**
 * The panel a slot shows on page `page` (1-based): that page's panel if it has one, otherwise page 1's.
 * Throws on a page, room or side that does not exist; a validated book always has page 1's panel.
 */
export function panelAt(book: Book, page: number, room: RoomKey, side: Side): Panel {
  if (!Number.isInteger(page) || page < 1 || page > book.pages.length) {
    throw new RangeError(`page ${page} is outside 1..${book.pages.length}`);
  }
  if (!ROOM_SET.has(room)) throw new RangeError(`unknown room "${room}"`);
  if (!SIDE_SET.has(side)) throw new RangeError(`unknown side "${side}"`);
  const own = book.pages[page - 1].panels[room]?.[side];
  if (own) return own;
  const first = book.pages[0].panels[room]?.[side];
  if (!first) throw new RangeError(`page 1 has no panel for ${room} ${side}`);
  return first;
}
