// The phone's return to fullscreen (issue #161, src/input/fullscreen.ts): every request ends in one of
// three results, never throws, never reports success without a fullscreen element, and the button is
// offered on a phone only while the page is not fullscreen. Fake documents only, no DOM.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { canEnterFullscreen, enterFullscreen, showFullscreenButton, type FullscreenDoc } from '../src/input/fullscreen';
import { Input } from '../src/input/input';

/** A document whose fullscreen state the test controls; `request` decides how a request ends. */
function fakeDoc(opts: {
  enabled?: boolean;
  api?: boolean;
  request?: (doc: { fullscreenElement: unknown }) => Promise<void>;
} = {}) {
  const doc = {
    fullscreenElement: null as unknown,
    fullscreenEnabled: opts.enabled,
    requests: 0,
    exits: 0,
    documentElement: {
      requestFullscreen: undefined as undefined | ((o?: unknown) => Promise<void>),
    },
  };
  if (opts.api !== false) {
    doc.documentElement.requestFullscreen = () => {
      doc.requests++;
      return opts.request ? opts.request(doc) : granted(doc);
    };
  }
  return doc;
}

function granted(doc: { fullscreenElement: unknown }): Promise<void> { doc.fullscreenElement = {}; return Promise.resolve(); }
const refused = () => Promise.reject(new Error('NotAllowedError'));
const noLock = () => Promise.resolve();

describe('fullscreen request (#161)', () => {
  it('enters fullscreen when the browser grants the request', async () => {
    const doc = fakeDoc({ request: granted });
    const result = await enterFullscreen(doc as unknown as FullscreenDoc, noLock);
    expect(result).toBe('entered');
    expect(doc.fullscreenElement).not.toBeNull();
    expect(doc.requests).toBe(1);
  });

  it('is unsupported where the Fullscreen API is missing (no uncaught error, no fake success)', async () => {
    const doc = fakeDoc({ api: false });
    expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('unsupported');
    expect(doc.fullscreenElement).toBeNull();
  });

  it('is unsupported where the document reports fullscreen disabled (phone browsers without it)', async () => {
    const doc = fakeDoc({ enabled: false, request: granted });
    expect(canEnterFullscreen(doc as unknown as FullscreenDoc)).toBe(false);
    expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('unsupported');
    expect(doc.requests).toBe(0);
  });

  it('is denied when the browser refuses the request, and the page stays usable', async () => {
    const doc = fakeDoc({ request: refused });
    expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('denied');
    expect(doc.fullscreenElement).toBeNull();
  });

  it('is denied, not entered, when the request resolves without a fullscreen element', async () => {
    const doc = fakeDoc({ request: () => Promise.resolve() });
    expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('denied');
  });

  it('asks for the landscape lock once the page is fullscreen', async () => {
    const doc = fakeDoc({ request: granted });
    let locks = 0;
    await enterFullscreen(doc as unknown as FullscreenDoc, () => { locks++; return Promise.resolve(); });
    expect(locks).toBe(1);
  });

  it('still counts as entered when the phone refuses the orientation lock', async () => {
    const doc = fakeDoc({ request: granted });
    const result = await enterFullscreen(doc as unknown as FullscreenDoc, () => Promise.reject(new Error('refused')));
    expect(result).toBe('entered');
  });

  it('does not ask again while the page is already fullscreen', async () => {
    const doc = fakeDoc({ request: granted });
    doc.fullscreenElement = {};
    expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('entered');
    expect(doc.requests).toBe(0);
  });

  it('works again after each exit: repeated enter and exit cycles', async () => {
    const doc = fakeDoc({ request: granted });
    for (let i = 0; i < 3; i++) {
      expect(await enterFullscreen(doc as unknown as FullscreenDoc, noLock)).toBe('entered');
      // the browser or the device leaves fullscreen (Esc, the system gesture, the browser's own control)
      doc.fullscreenElement = null;
      doc.exits++;
    }
    expect(doc.requests).toBe(3);
    expect(doc.exits).toBe(3);
  });
});

describe('return button visibility (#161)', () => {
  it('is offered on a phone while the page is not fullscreen and the API is usable', () => {
    expect(showFullscreenButton(true, false, true)).toBe(true);
  });

  it('is hidden while the page is fullscreen', () => {
    expect(showFullscreenButton(true, true, true)).toBe(false);
  });

  it('is hidden where the Fullscreen API is unusable (iPhone: fullscreenEnabled false), even on touch', () => {
    const iphone = fakeDoc({ enabled: false, request: granted });
    expect(showFullscreenButton(true, false, canEnterFullscreen(iphone as unknown as FullscreenDoc))).toBe(false);
  });

  it('is never offered on keyboard or pad, fullscreen or not', () => {
    expect(showFullscreenButton(false, false, true)).toBe(false);
    expect(showFullscreenButton(false, true, true)).toBe(false);
  });
});

// Escape and fullscreen (issue #374): the browser takes Escape to leave fullscreen, and the game reads the
// same key to close a menu. The keyboard input is driven through its real listeners, with the document stubbed.
describe('Escape and fullscreen (#374)', () => {
  type Listener = (e: Record<string, unknown>) => void;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** A keyboard input with its window and document listeners, and a document whose fullscreen the test sets. */
  function menu() {
    const win = new Map<string, Listener[]>();
    const doc = {
      fullscreenElement: null as unknown,
      pointerLockElement: null,
      listeners: new Map<string, Listener[]>(),
      addEventListener(type: string, fn: Listener) { doc.listeners.set(type, [...(doc.listeners.get(type) ?? []), fn]); },
    };
    vi.stubGlobal('addEventListener', (type: string, fn: Listener) => { win.set(type, [...(win.get(type) ?? []), fn]); });
    vi.stubGlobal('document', doc);
    vi.stubGlobal('matchMedia', undefined);
    const inp = new Input({} as HTMLElement);
    vi.unstubAllGlobals();
    // the document stays stubbed for the test: the keydown listener reads `document.fullscreenElement` when it runs
    vi.stubGlobal('document', doc);
    const clock = vi.spyOn(performance, 'now');
    const fire = (type: string, e: Record<string, unknown>) => win.get(type)?.forEach(fn => fn(e));
    /** The browser's fullscreen change: `on` is the state after it. */
    const fullscreenChange = (on: boolean) => {
      doc.fullscreenElement = on ? {} : null;
      doc.listeners.get('fullscreenchange')?.forEach(fn => fn({}));
    };
    /** One press and release of Escape; reports what the menus would read from it. */
    const escape = () => {
      fire('keydown', { code: 'Escape', repeat: false, preventDefault() {} });
      const read = { back: inp.hit('back'), pause: inp.hit('pause') };
      inp.endFrame();
      fire('keyup', { code: 'Escape' });
      return read;
    };
    return { inp, clock, fullscreenChange, escape };
  }

  it('the first Escape with fullscreen on leaves fullscreen only: the open menu does not close', () => {
    const { clock, fullscreenChange, escape } = menu();
    clock.mockReturnValue(1000);
    fullscreenChange(true);
    expect(escape()).toEqual({ back: false, pause: false });
    fullscreenChange(false);
  });

  it('a second Escape, once fullscreen is left, closes the menu as before', () => {
    const { clock, fullscreenChange, escape } = menu();
    clock.mockReturnValue(1000);
    fullscreenChange(true);
    escape();
    fullscreenChange(false);
    clock.mockReturnValue(1400);
    expect(escape()).toEqual({ back: true, pause: true });
  });

  it('with fullscreen off, Escape closes the menu as before', () => {
    const { escape } = menu();
    expect(escape()).toEqual({ back: true, pause: true });
  });

  it('an Escape that reaches the page just after the browser left fullscreen is still the browser\'s', () => {
    const { clock, fullscreenChange, escape } = menu();
    clock.mockReturnValue(1000);
    fullscreenChange(true);
    fullscreenChange(false);
    clock.mockReturnValue(1100);
    expect(escape()).toEqual({ back: false, pause: false });
    // the next press is an ordinary one again
    clock.mockReturnValue(1200);
    expect(escape()).toEqual({ back: true, pause: true });
  });

  it('a press long after the browser left fullscreen on its own closes the menu', () => {
    const { clock, fullscreenChange, escape } = menu();
    clock.mockReturnValue(1000);
    fullscreenChange(true);
    fullscreenChange(false);
    clock.mockReturnValue(5000);
    expect(escape()).toEqual({ back: true, pause: true });
  });
});
