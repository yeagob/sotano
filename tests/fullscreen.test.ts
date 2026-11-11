// The phone's return to fullscreen (issue #161, src/input/fullscreen.ts): every request ends in one of
// three results, never throws, never reports success without a fullscreen element, and the button is
// offered on a phone only while the page is not fullscreen. Fake documents only, no DOM.

import { describe, expect, it } from 'vitest';
import { canEnterFullscreen, enterFullscreen, showFullscreenButton, type FullscreenDoc } from '../src/input/fullscreen';

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
  it('is offered on a phone while the page is not fullscreen', () => {
    expect(showFullscreenButton(true, false)).toBe(true);
  });

  it('is hidden while the page is fullscreen', () => {
    expect(showFullscreenButton(true, true)).toBe(false);
  });

  it('is never offered on keyboard or pad, fullscreen or not', () => {
    expect(showFullscreenButton(false, false)).toBe(false);
    expect(showFullscreenButton(false, true)).toBe(false);
  });
});
