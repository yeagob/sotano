// The Roots' book as one self-contained HTML file (docs/design/built/progression/COMPLETION.md §8). It is written in the
// browser, in the player's language, from the book files the game already ships: no network call, no images (the captures
// are not text). It is offered only at 100% of the completion percentage, on the pause card and the death screen.

import { loadBook, quoteSource, ROOM_KEYS, SIDES, type Book, type Lang, type Panel } from '../content/book';
import { locale, t } from '../i18n';
import { palCss } from '../content/palette';

// The page's colours are palette tokens (the art ledger's ratchet), never literals.
const PAPER = palCss('bone.paper');
const INK = palCss('ui.night');
const MUTED = palCss('limestone.dark');
const RULE = palCss('bone.faded');
const QUOTE = palCss('limestone.hi');

/** The completion percentage at which the book can be downloaded. */
export const BOOK_DOWNLOAD_PERCENT = 100;

/** Whether the download is offered at this completion percentage: only at 100. */
export function bookDownloadShown(percent: number): boolean {
  return percent >= BOOK_DOWNLOAD_PERCENT;
}

/** The download button for the completion block, or nothing below 100%. `data-act` is the same pattern as the other card buttons. */
export function bookButtonHtml(percent: number): string {
  return bookDownloadShown(percent) ? `<button type="button" class="book-download" data-act="book-download">${t('completion.book')}</button>` : '';
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: string) => s.replace(/[&<>"']/g, c => ESC[c]);

/** One panel's words, in the file's own order. Images and blank slabs have no words of their own. */
function panelHtml(p: Panel, lang: Lang): string {
  switch (p.layout) {
    case 'lesson': return `<h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>`;
    case 'plate': return `<h3>${esc(p.title)}</h3><p class="sub">${esc(p.subtitle)}</p><p>${esc(p.text)}</p>` +
      (p.note ? `<p class="note">${esc(p.note)}</p>` : '');
    case 'prose': return `<p>${esc(p.text)}</p>`;
    case 'title': return `<h2 class="title">${esc(p.text)}</h2>`;
    case 'quote': return `<blockquote>${esc(p.text)}</blockquote><p class="source">${esc(quoteSource(p))}` +
      (p.lang !== lang ? ` · ${esc(t('book.quote.translated'))}` : '') + '</p>';
    case 'image': return p.caption ? `<p class="caption">${esc(p.caption)}</p>` : '';
    case 'blank': return '';
  }
}

/**
 * The book's pages (`kind: 'book'`, from the title page on) as one HTML document in `lang`. The tutorial pages are the
 * prologue and are not in the book. Every slot reads in ring order, north then south, as it is carved.
 */
export function bookHtml(book: Book, lang: Lang): string {
  const title = esc(t('book.download.title'));
  const pages = book.pages.map((page, i) => ({ page, n: i + 1 })).filter(({ page }) => page.kind === 'book');
  const body = pages.map(({ page, n }) => {
    const parts: string[] = [];
    for (const room of ROOM_KEYS) {
      const slot = page.panels[room];
      if (!slot) continue;
      for (const side of SIDES) {
        const p = slot[side];
        if (p) parts.push(panelHtml(p, lang));
      }
    }
    return `<section class="page"><h1 class="num">${esc(t('book.download.page', { n }))}</h1>${parts.join('\n')}</section>`;
  }).join('\n');
  return '<!doctype html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    `<title>${title}</title>\n<style>\n` +
    `body{margin:0;background:${PAPER};color:${INK};font:17px/1.6 Georgia,"Times New Roman",serif}\n` +
    `main{max-width:40em;margin:0 auto;padding:40px 20px}\n` +
    `.page{margin:0 0 56px;padding-bottom:32px;border-bottom:1px solid ${RULE}}\n` +
    `h1.num{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:normal;margin:0 0 16px}\n` +
    `h2.title{font-size:30px;text-align:center;margin:40px 0}\n` +
    `h3{font-size:20px;margin:24px 0 4px}\n` +
    `.sub{color:${MUTED};font-style:italic;margin:0}\n` +
    `.note{color:${MUTED};font-size:14px}\n` +
    `blockquote{margin:24px 0 4px 1em;padding-left:16px;border-left:3px solid ${QUOTE};font-style:italic}\n` +
    `.source,.caption{font-size:14px;color:${MUTED};margin:0 0 16px 1em}\n` +
    '</style>\n</head>\n<body>\n<main>\n' +
    `<h1 class="num">${title}</h1>\n${body}\n</main>\n</body>\n</html>\n`;
}

/** Saves the book in the player's language as `the-roots-book-<lang>.html`. Only from a click on the download button. */
export function downloadRootsBook(): void {
  const lang: Lang = locale() === 'es' ? 'es' : 'en';
  const blob = new Blob([bookHtml(loadBook(lang), lang)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `the-roots-book-${lang}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
