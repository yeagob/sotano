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

/** How long after the page leaves fullscreen an Escape still counts as the one that left it (ms). */
export const FULLSCREEN_EXIT_MS = 500;

/**
 * Escape leaves fullscreen and the open menu closes with it (issue #374). The browser takes Escape to leave
 * fullscreen, and the game reads the same key as its menu key (pause, back). An Escape that leaves fullscreen
 * is the browser's alone, so the game does not read it. The browser may report the key before the exit or
 * the exit before the key, so both orders are caught: a key that goes down while the page is fullscreen, and
 * a key that goes down just after the page left fullscreen on its own.
 */
export class FullscreenEscape {
  /** When an Escape went down while the page was fullscreen (-Infinity: none). */
  private keyAt = -Infinity;
  /** When the page left fullscreen without an Escape before it (-Infinity: none pending). */
  private exitAt = -Infinity;

  /** A key goes down at `now`: true when the game must not read it. */
  takes(code: string, inFullscreen: boolean, now: number): boolean {
    if (code !== 'Escape') return false;
    if (inFullscreen) { this.keyAt = now; return true; }
    const justLeft = now - this.exitAt <= FULLSCREEN_EXIT_MS;
    this.exitAt = -Infinity;
    return justLeft;
  }

  /** The page entered (`inFullscreen`) or left fullscreen at `now`. */
  changed(inFullscreen: boolean, now: number) {
    if (inFullscreen) { this.exitAt = -Infinity; return; }
    // the exit that an Escape already took is not a second one to wait for
    this.exitAt = now - this.keyAt <= FULLSCREEN_EXIT_MS ? -Infinity : now;
  }
}
