// The browser side of localization: picking the language at start, remembering the player's
// choice and filling the static text of index.html. Kept apart so i18n/index.ts stays DOM-free
// (tests run in node).

import { detectLocale, locale, onLocaleChange, setLocale, STORAGE_KEY, t, type MessageKey } from '.';

/** Starting language for this browser (URL, saved choice, browser languages, English). */
export function browserLocale() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode, blocked storage */ }
  return detectLocale({ search: location.search, saved, languages: navigator.languages ?? [navigator.language] });
}

/** The player picked a language: apply it and remember it. */
export function chooseLocale(code: string) {
  setLocale(code);
  try { localStorage.setItem(STORAGE_KEY, locale()); } catch { /* not remembered */ }
}

/**
 * Fills static HTML: `data-i18n="key"` sets the text, `data-i18n-label="key"` sets `data-label`
 * (for CSS `content: attr(data-label)`). The HTML keeps English as written, so the page reads
 * correctly before this runs. Also sets `<html lang>`.
 */
export function applyDom(root: ParentNode = document) {
  document.documentElement.lang = locale();
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n as MessageKey);
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-label]')) el.dataset.label = t(el.dataset.i18nLabel as MessageKey);
}

/** Starts localization for the page: picks the language, fills the HTML and keeps it filled. */
export function initDom() {
  setLocale(browserLocale());
  applyDom();
  onLocaleChange(() => applyDom());
}
