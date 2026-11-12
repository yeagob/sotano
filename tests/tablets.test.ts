// The pure parts of the Roots' wall panels (docs/design/not-built/levels/roots/PANELS.md): wrapping, shrink-to-fit
// against a fake measure, the mounts per layout variant, which key cap a device reads, the translation note rule,
// the control placeholders, and the images a page needs. The drawing itself is checked in ?gallery=book.

import { describe, expect, it } from 'vitest';
import { KEY_ACTIONS, ROOM_KEYS, SIDES, loadBook, pageCount, panelAt, type QuotePanel } from '../src/content/book';
import {
  MOUNT_TABLES, SLAB_H, SLAB_W, authorLine, fillControls, fitBlock, fitLine, inlineLabel, keycapGlyph, keycapLabelKey,
  keycapVerbKey, keycapWidth, pageStoneMount, pageStoneShows, panelImageIds, panelMount, seededRandom, sizesOf,
  showsTranslationNote, wrapText, wrapIndented, hashString, type MeasureAt,
} from '../src/render/panel-layout';
import { PanelImages } from '../src/render/tablets';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

/** Every character is `px / 2` wide: a monospace stand-in for the canvas. */
const mono: MeasureAt = (text, px) => [...text].length * px / 2;
const at = (px: number) => (s: string) => mono(s, px);

describe('wrapping', () => {
  it('breaks at spaces, never inside a word, and keeps every word', () => {
    const text = 'the walls of the roots remember you';
    const lines = wrapText(text, 10 * 10, at(20)); // 10 characters a line
    expect(lines).toEqual(['the walls', 'of the', 'roots', 'remember', 'you']);
    expect(lines.join(' ')).toBe(text);
  });

  it('keeps a word longer than the line whole on its own line (the caller flags it)', () => {
    expect(wrapText('a extraordinarily b', 50, at(10))).toEqual(['a', 'extraordinarily', 'b']);
  });

  it('ignores doubled spaces and returns nothing for an empty text', () => {
    expect(wrapText('one  two', 1000, at(10))).toEqual(['one two']);
    expect(wrapText('', 100, at(10))).toEqual([]);
  });

  it('narrows the first lines for a drop cap', () => {
    // 10 characters a line, the first two lines 4 characters narrower
    expect(wrapIndented('aaa bbb ccc ddd eee fff', 100, 40, 2, at(20))).toEqual(['aaa', 'bbb', 'ccc ddd', 'eee fff']);
  });
});

describe('shrink to fit', () => {
  it('lists the sizes of a range from the largest, always ending on the smallest', () => {
    expect(sizesOf({ from: 52, to: 40 })).toEqual([52, 50, 48, 46, 44, 42, 40]);
    expect(sizesOf({ from: 30, to: 25, step: 2 })).toEqual([30, 28, 26, 25]);
    expect(sizesOf({ from: 34, to: 34 })).toEqual([34]);
  });

  it('takes the largest size that fits one line', () => {
    // 10 characters: 52 px is 260 wide; 476 is the lesson title's width
    expect(fitLine('0123456789', 476, { from: 52, to: 40 }, mono)).toEqual({ px: 52, fits: true });
    // 20 characters need ≤ 47.6 px: 46 is the first even size under it
    expect(fitLine('01234567890123456789', 476, { from: 52, to: 40 }, mono)).toEqual({ px: 46, fits: true });
  });

  it('flags a line that does not fit even at the smallest size, and gives that size', () => {
    expect(fitLine('x'.repeat(40), 476, { from: 52, to: 40 }, mono)).toEqual({ px: 40, fits: false });
  });

  it('fits a block within its lines, shrinking only inside its range', () => {
    const words = Array.from({ length: 12 }, () => 'word').join(' '); // 59 characters
    const fit = fitBlock(words, 200, 5, { from: 20, to: 10 }, mono);
    expect(fit.fits).toBe(true);
    expect(fit.px).toBe(20);
    expect(fit.lines.length).toBeLessThanOrEqual(5);
    const tight = fitBlock(words, 200, 2, { from: 20, to: 10 }, mono);
    expect(tight.fits).toBe(true);
    expect(tight.px).toBeLessThan(20);
  });

  it('flags a block that runs past its last line and still keeps every word', () => {
    const words = Array.from({ length: 40 }, () => 'word').join(' ');
    const fit = fitBlock(words, 200, 5, { from: 34, to: 34 }, mono);
    expect(fit.fits).toBe(false);
    expect(fit.lines.join(' ')).toBe(words);
  });
});

describe('key caps', () => {
  it('reads the label of the device in use', () => {
    expect(keycapLabelKey('jump', 'keyboard')).toBe('keycap.jump.key');
    expect(keycapLabelKey('jump', 'gamepad')).toBe('keycap.jump.pad');
    expect(keycapLabelKey('jump', 'touch')).toBe('keycap.jump.touch');
    expect(keycapVerbKey('bomb')).toBe('keycap.bomb.verb');
  });

  it('draws the half-turn glyph only for the polarity on touch', () => {
    for (const action of KEY_ACTIONS) {
      for (const device of ['keyboard', 'gamepad', 'touch'] as const) {
        expect(keycapGlyph(action, device)).toBe(action === 'polarity' && device === 'touch' ? 'half-turn' : undefined);
      }
    }
  });

  it('every label and verb a cap reads exists in both languages', () => {
    for (const action of KEY_ACTIONS) {
      for (const device of ['keyboard', 'gamepad', 'touch'] as const) {
        for (const key of [keycapLabelKey(action, device), keycapVerbKey(action)]) {
          expect(EN.messages[key as keyof typeof EN.messages], key).toBeTypeOf('string');
          expect(ES.messages[key as keyof typeof ES.messages], key).toBeTypeOf('string');
        }
      }
    }
  });

  it('is the label plus 48, between 80 and 280', () => {
    expect(keycapWidth(10)).toBe(80);
    expect(keycapWidth(100)).toBe(148);
    expect(keycapWidth(400)).toBe(280);
  });
});

describe('placeholders', () => {
  it('fills a control in the middle of a sentence in lower case and capitalises sentence starts', () => {
    const label = (a: string) => (a === 'jump' ? 'The arrow' : 'WASD');
    expect(fillControls('{jump} jumps one block.', label)).toBe('The arrow jumps one block.');
    expect(fillControls('in deep water, {jump} swims you up. {move} walks.', label)).toBe('In deep water, the arrow swims you up. WASD walks.');
    expect(inlineLabel('A')).toBe('A');
    expect(inlineLabel('Space')).toBe('space');
  });
});

describe('quotes', () => {
  it('carry the translation note only when the book is not in the quotation’s language', () => {
    expect(showsTranslationNote('en', { lang: 'es' })).toBe(true);
    expect(showsTranslationNote('es', { lang: 'es' })).toBe(false);
    expect(showsTranslationNote('en', { lang: 'en' })).toBe(false);
    expect(showsTranslationNote('es', { lang: 'en' })).toBe(true);
  });

  it('page 7’s quote is noted in English and not in Spanish', () => {
    const en = panelAt(loadBook('en'), 7, 'roots-gift', 'north') as QuotePanel;
    const es = panelAt(loadBook('es'), 7, 'roots-gift', 'north') as QuotePanel;
    expect(en.layout).toBe('quote');
    expect(showsTranslationNote('en', en)).toBe(true);
    expect(showsTranslationNote('es', es)).toBe(false);
    expect(authorLine(en.author)).toBe('— Guillermo Borja');
  });
});

describe('mounts (PANELS §6)', () => {
  const x0 = 100, y0 = 40, z0 = 200;

  it('hangs north west of the door facing south, and south east of it facing north', () => {
    expect(panelMount('roots-hall', 'north', x0, y0, z0)).toEqual({ x: 102, y: 42, z: 200.02, rotY: 0, w: SLAB_W, h: SLAB_H });
    expect(panelMount('roots-hall', 'south', x0, y0, z0)).toEqual({ x: 111, y: 42, z: 206.98, rotY: Math.PI, w: SLAB_W, h: SLAB_H });
  });

  it('lifts both panels of roots-step over its two-high walls, under its ceiling', () => {
    for (const side of SIDES) {
      const m = panelMount('roots-step', side, x0, y0, z0);
      expect(m.y).toBeCloseTo(y0 + 3.1);
      expect(m.y - m.h / 2).toBeGreaterThanOrEqual(y0 + 2);
      expect(m.y + m.h / 2).toBeLessThanOrEqual(y0 + 5);
    }
  });

  it('narrows both panels of roots-seal into the strips beside its obsidian walls (columns 3 and 9)', () => {
    const n = panelMount('roots-seal', 'north', x0, y0, z0), s = panelMount('roots-seal', 'south', x0, y0, z0);
    expect([n.w, n.h]).toEqual([2.85, 1.63]);
    expect(n.x - n.w / 2).toBeGreaterThanOrEqual(x0);
    expect(n.x + n.w / 2).toBeLessThanOrEqual(x0 + 3);
    expect(s.x - s.w / 2).toBeGreaterThanOrEqual(x0 + 10);
    expect(s.x + s.w / 2).toBeLessThanOrEqual(x0 + 13);
  });

  it('keeps every panel inside its 13 × 7 room and clear of the door columns 4–8', () => {
    for (const room of ROOM_KEYS) for (const side of SIDES) {
      const m = panelMount(room, side, x0, y0, z0);
      expect(m.x - m.w / 2, `${room} ${side}`).toBeGreaterThanOrEqual(x0);
      expect(m.x + m.w / 2, `${room} ${side}`).toBeLessThanOrEqual(x0 + 13);
      const clearOfDoor = m.x + m.w / 2 <= x0 + 4 || m.x - m.w / 2 >= x0 + 9;
      expect(clearOfDoor, `${room} ${side}`).toBe(true);
      expect(m.w / m.h).toBeCloseTo(SLAB_W / SLAB_H, 1);
    }
  });

  it('reads its numbers from a table per layout variant, so another set of rooms is data', () => {
    expect(Object.keys(MOUNT_TABLES)).toEqual(['classic']);
    expect(panelMount('roots-pit', 'north', 0, 0, 0, 'classic')).toEqual(panelMount('roots-pit', 'north', 0, 0, 0));
    expect(MOUNT_TABLES.classic.rooms['roots-step']?.north?.dy).toBe(3.1);
  });
});

describe('the page stone (PAGES §4)', () => {
  it('sits on the middle block of the start room’s north wall, at y0 + 2, facing the room', () => {
    const m = pageStoneMount(10, 20, 30);
    expect(m.x).toBe(16.5);
    expect(m.y).toBe(22.5);
    expect(m.z).toBeGreaterThan(30);
    expect(m.z).toBeLessThan(30.02); // behind the panels' plane, in front of the wall
    expect(m.w).toBeLessThan(1);
  });

  it('shows a number only on book pages', () => {
    expect(pageStoneShows('book')).toBe(true);
    expect(pageStoneShows('tutorial')).toBe(false);
  });
});

describe('images', () => {
  it('a lesson or a plate needs its image; prose and quotes need none', () => {
    const book = loadBook('en');
    expect(panelImageIds(panelAt(book, 1, 'roots-hall', 'north'))).toEqual(['lesson/blocks']);
    expect(panelImageIds(panelAt(book, 1, 'roots-hall', 'south'))).toEqual(['bestiary/doubt']);
    expect(panelImageIds(panelAt(book, 7, 'roots-hall', 'south'))).toEqual([]);
    expect(panelImageIds(panelAt(book, 7, 'roots-gift', 'north'))).toEqual([]);
  });

  it('a page preloads every image its 22 slots show, page 1’s where it leaves a slot out', () => {
    const book = loadBook('es');
    for (let page = 1; page <= pageCount(book); page++) {
      const ids = PanelImages.pageIds(book, page);
      expect(new Set(ids).size).toBe(ids.length);
      for (const room of ROOM_KEYS) for (const side of SIDES) {
        for (const id of panelImageIds(panelAt(book, page, room, side))) expect(ids).toContain(id);
      }
    }
    expect(PanelImages.pageIds(book, 7)).toContain('lesson/blocks'); // page 7 keeps page 1's lessons
  });

  it('icons are always ready and an unknown id never blocks a panel', () => {
    const images = new PanelImages('/');
    expect(images.state('icon/heart/stone')).toBe('icon');
    expect(images.state('nowhere/x')).toBe('unknown');
    expect(images.settled(['icon/heart/stone', 'nowhere/x'])).toBe(true);
    expect(images.state('bestiary/doubt')).toBe('loading');
    expect(images.settled(['bestiary/doubt'])).toBe(false);
  });
});

describe('the stone’s grain', () => {
  it('is seeded by the panel id: the same id carves the same stone, another id another', () => {
    const a = seededRandom(hashString('1-hall-n')), b = seededRandom(hashString('1-hall-n')), c = seededRandom(hashString('1-hall-s'));
    const take = (r: () => number) => Array.from({ length: 5 }, r);
    const first = take(a);
    expect(take(b)).toEqual(first);
    expect(take(c)).not.toEqual(first);
    for (const v of first) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});
