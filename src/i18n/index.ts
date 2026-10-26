// Localization: every word the player reads goes through here (docs/architecture/LOCALIZATION.md).
// English is the source language; other locales are catalogs of the same shape. A missing
// message falls back to English, so a gap in a translation never breaks the game.
//
// This module is a leaf: it never reads game state, and nothing in the simulation reads it.
// Changing language mid-run cannot change the run.

import { EN, type MessageKey } from './locales/en';
import { LOCALES, type Catalog, type Message } from './locales';

export type { MessageKey } from './locales/en';
export type Params = Record<string, string | number>;

export const STORAGE_KEY = 'sotano.locale';
const BY_CODE = new Map(LOCALES.map(l => [l.code, l]));

let current: Catalog = EN;
const listeners = new Set<() => void>();

/** The active locale's code ('en', 'es'…). */
export const locale = () => current.code;
/** The active catalog (content translations live here; see i18n/content.ts). */
export const catalog = () => current;

/**
 * Picks the starting locale: `?lang=xx`, then the saved choice, then the browser's languages
 * (matched by primary subtag: 'es-AR' → 'es'), then English. Pure: the browser wrapper is
 * `browserLocale()` in i18n/dom.ts.
 */
export function detectLocale(env: { search?: string; saved?: string | null; languages?: readonly string[] }): string {
  const wanted = [
    new URLSearchParams(env.search ?? '').get('lang'),
    env.saved,
    ...(env.languages ?? []),
  ];
  for (const w of wanted) {
    const code = w?.toLowerCase().split(/[-_]/)[0];
    if (code && BY_CODE.has(code)) return code;
  }
  return EN.code;
}

/** Switches language and notifies (saving the choice and the DOM are i18n/dom.ts's job). */
export function setLocale(code: string) {
  const next = BY_CODE.get(code) ?? EN;
  if (next === current) return;
  current = next;
  for (const fn of listeners) fn();
}

/** Called after every language change (re-render anything that shows text). Returns an unsubscribe. */
export function onLocaleChange(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * The message `key` in the current locale. `{name}` placeholders take `params.name` (numbers
 * are formatted for the locale). Plural messages pick their form from `params.count ?? params.n`.
 * The result is plain text: escape it before putting it into HTML.
 */
export function t(key: MessageKey, params?: Params): string {
  const msg: Message | undefined = current.messages[key] ?? EN.messages[key];
  return fill(pick(msg ?? key, params), params);
}

function pick(msg: Message, params?: Params): string {
  if (typeof msg === 'string') return msg;
  const n = Number(params?.count ?? params?.n ?? 0);
  return msg[plurals().select(n)] ?? msg.other;
}

/** Replaces `{name}` placeholders (numbers formatted for the locale). */
export function fill(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => {
    const v = params[name];
    return v === undefined ? all : typeof v === 'number' ? fmtNum(v) : v;
  });
}

const pluralCache = new Map<string, Intl.PluralRules>();
function plurals() {
  let p = pluralCache.get(current.code);
  if (!p) { p = new Intl.PluralRules(current.code); pluralCache.set(current.code, p); }
  return p;
}

const numCache = new Map<string, Intl.NumberFormat>();
/**
 * A number in the current locale ('1.25' / '1,25'). With `digits`, exactly that many decimals;
 * without, up to two.
 */
export function fmtNum(v: number, digits?: number): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
  const k = `${current.code}:${digits ?? ''}`;
  let f = numCache.get(k);
  if (!f) {
    f = new Intl.NumberFormat(current.code, digits === undefined
      ? { maximumFractionDigits: 2, useGrouping: false }
      : { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false });
    numCache.set(k, f);
  }
  return f.format(v);
}

/** Every shipped locale, for the language selector. */
export const locales = () => LOCALES.map(l => ({ code: l.code, name: l.name }));
