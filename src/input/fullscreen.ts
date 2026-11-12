// Fullscreen on a phone (issue #161). The Fullscreen API is only ever asked for from a tap the player
// makes, and every request ends in one of three results the game can show: entered, unsupported (the
// browser or device has no such API, as on iPhone Safari) or denied (the browser refused the request).
// DOM-free on purpose: the document and the orientation lock are passed in, so tests use plain objects.

export type FullscreenResult = 'entered' | 'unsupported' | 'denied';

/** The part of `Document` this module reads. */
export interface FullscreenDoc {
  readonly fullscreenElement: unknown;
  readonly fullscreenEnabled?: boolean;
  readonly documentElement: { requestFullscreen?: (options?: { navigationUI?: 'auto' | 'show' | 'hide' }) => Promise<void> };
}

/** Locks the screen to landscape where the browser allows it (a refused lock is not an error). */
export function landscapeLock(): Promise<void> {
  const orientation = typeof screen === 'undefined' ? undefined : (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> } | undefined);
  return orientation?.lock?.('landscape') ?? Promise.resolve();
}

export function canEnterFullscreen(doc: FullscreenDoc): boolean {
  return doc.fullscreenEnabled !== false && typeof doc.documentElement.requestFullscreen === 'function';
}

/**
 * Asks the browser for fullscreen on the page. Resolves once the answer is known; the page is then in
 * fullscreen only if the result is `entered`. Never throws.
 */
export async function enterFullscreen(doc: FullscreenDoc, lock: () => Promise<void> = landscapeLock): Promise<FullscreenResult> {
  if (doc.fullscreenElement) return 'entered';
  if (!canEnterFullscreen(doc)) return 'unsupported';
  try {
    await doc.documentElement.requestFullscreen!({ navigationUI: 'hide' });
  } catch {
    return 'denied';
  }
  if (!doc.fullscreenElement) return 'denied';
  try { await lock(); } catch { /* the phone may refuse the lock; the game still plays */ }
  return 'entered';
}

/**
 * The return button is offered on a phone while the page is not fullscreen, on every screen, but only
 * where the browser reports the Fullscreen API usable (`fullscreenEnabled`). iPhone Safari reports it
 * unusable, so the button is hidden there rather than offered for a request that cannot work.
 */
export function showFullscreenButton(touch: boolean, inFullscreen: boolean, supported: boolean): boolean {
  return touch && !inFullscreen && supported;
}
