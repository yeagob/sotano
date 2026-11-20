// The wall panels' redraw (render/tablets.ts): a language or device change carves each slot's last REQUESTED panel, so a
// panel still waiting for its image is not dropped and the wall reaches the page the keeper recorded. The canvas is a
// stub and the image store a fake that settles only when the test says so.

import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadBook, pageCount, panelAt, SIDES, type Book, type Panel, type RoomKey, type Side } from '../src/content/book';
import { panelImageIds } from '../src/render/panel-layout';
import { PanelImages, Tablets } from '../src/render/tablets';
import { setLocale } from '../src/i18n';

/** A canvas context that accepts every call and reads as zero-sized text: enough for the carving to run. */
function stubContext(): CanvasRenderingContext2D {
  const ctx: unknown = new Proxy(function stub() {}, {
    get: (_t, key) => (key === 'measureText' ? () => ({ width: 0 }) : ctx),
    apply: () => ctx,
    set: () => true,
  });
  return ctx as CanvasRenderingContext2D;
}

/** The image store of the test: an image is ready only once `settle()` runs, so a show can wait on it. */
class LaterImages extends PanelImages {
  readonly ready = new Set<string>();
  private waiting: (() => void)[] = [];
  settled(ids: Iterable<string>): boolean {
    for (const id of ids) if (!this.ready.has(id)) return false;
    return true;
  }
  preload(ids: Iterable<string>): Promise<void> {
    const list = [...ids];
    return new Promise(resolve => this.waiting.push(() => { for (const id of list) this.ready.add(id); resolve(); }));
  }
  settle() {
    const w = this.waiting;
    this.waiting = [];
    for (const f of w) f();
  }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const room = 'roots-hall' as RoomKey;

/**
 * Page 1's panel and a later page's panel on the same side, the later one with an image of its own (not page 1's): the
 * image is what the store holds back.
 */
function panels(book: Book): { side: Side; first: Panel; later: Panel } {
  for (const side of SIDES) {
    const first = panelAt(book, 1, room, side, 'teaching');
    for (let page = 2; page <= pageCount(book); page++) {
      const later = panelAt(book, page, room, side, 'teaching');
      const own = panelImageIds(later).filter(id => !panelImageIds(first).includes(id));
      if (own.length) return { side, first, later };
    }
  }
  throw new Error('no page of the book shows an image in the start room');
}

describe('a redraw carries the last requested panel (tablets.ts redraw)', () => {
  const realDocument = (globalThis as { document?: unknown }).document;
  beforeAll(() => {
    (globalThis as { document?: unknown }).document = {
      createElement: () => ({ width: 0, height: 0, getContext: () => stubContext() }),
    };
  });
  afterAll(() => {
    (globalThis as { document?: unknown }).document = realDocument;
    setLocale('en');
  });

  it('a panel waiting for its image is carried on by a language change: the wall reaches the requested page', async () => {
    const book = loadBook('en');
    const { side, first, later } = panels(book);
    const images = new LaterImages();
    const tablets = new Tablets(new THREE.Group(), images);
    tablets.mountRoom(room, 0, 0, 0, 'teaching');

    images.ready.add(panelImageIds(first)[0] ?? '');
    await tablets.show(room, side, first, 1);
    expect(tablets.shownAt(room, side)?.page).toBe(1);

    // page 2 asks for its image: the wall keeps page 1 until the image settles
    void tablets.show(room, side, later, 2);
    expect(tablets.shownAt(room, side)?.page).toBe(1);

    // the player changes language before the image arrives
    setLocale('es');
    tablets.redraw();
    images.settle();
    await flush();

    expect(tablets.shownAt(room, side)?.page).toBe(2);
    expect(tablets.shownAt(room, side)?.panel.id).toBe(later.id);
  });

  it('a redraw with nothing requested does nothing, and a settled panel is redrawn at once', async () => {
    const book = loadBook('en');
    const { side, first } = panels(book);
    const images = new LaterImages();
    const tablets = new Tablets(new THREE.Group(), images);
    tablets.mountRoom(room, 0, 0, 0, 'teaching');
    expect(() => tablets.redraw()).not.toThrow();
    expect(tablets.shownAt(room, side)).toBeUndefined();

    images.ready.add(panelImageIds(first)[0] ?? '');
    await tablets.show(room, side, first, 1);
    setLocale('es');
    tablets.redraw();
    expect(tablets.shownAt(room, side)?.page).toBe(1);
    expect(tablets.shownAt(room, side)?.panel.id).toBe(first.id);
    setLocale('en');
  });
});
