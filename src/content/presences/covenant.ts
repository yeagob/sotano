import type { PresenceId } from './index';

/** The Covenant (COVENANT.md, proposal; the set effect is decided): a closed set of four pieces, each given by one presence.
 *  No other source gives them: no shop, no drop, no other presence. The record is kept for the run, never in the profile,
 *  and it holds no randomness: a piece is given by an exchange that is already complete, so the record moves nothing else.
 *  The pieces are not items, so no drop, destruction or theft can take one (the promise of GIFTS.md holds by construction). */

export const COVENANT_PIECES = ['thread', 'page', 'seal', 'light'] as const;
export type CovenantPiece = typeof COVENANT_PIECES[number];

/** The source of a piece: a presence, or the Listener's last Lesson (lesson.ts), which is the only way to the Light. */
export type CovenantSource = PresenceId | 'last-lesson';

/** The closed set (COVENANT.md, the reading of the owner's "cierre", decided by agent, pending owner ruling): exactly four
 *  pieces, each with exactly one source, given once and never taken back. No shop, drop, other presence, sandbox or save
 *  gives a piece. The Listener's plain exchange gives none: only its last Lesson gives the Light. Frozen, so no rule can add
 *  a source at run time. */
export const PIECE_SOURCE: Readonly<Partial<Record<CovenantSource, CovenantPiece>>> = Object.freeze({
  mender: 'thread',
  elder: 'page',
  witness: 'seal',
  'last-lesson': 'light',
});

/** The record of the Covenant in a run: the pieces held, in the order they were given. */
export type Covenant = readonly CovenantPiece[];

export const NO_COVENANT: Covenant = [];

/** The record after `from` gives its piece. A source that gives no piece, or a piece already held, changes nothing, and a
 *  complete record is closed: nothing changes it. Pure: returns the same array when nothing changes, a new one otherwise. */
export function keepPiece(record: Covenant, from: CovenantSource): Covenant {
  const piece = PIECE_SOURCE[from];
  if (piece === undefined || record.includes(piece)) return record;
  return [...record, piece];
}

/** Whether the record holds this piece. */
export function holdsPiece(record: Covenant, piece: CovenantPiece): boolean {
  return record.includes(piece);
}

/** The Covenant is complete when all four pieces are held: the set effect (every Presence remembers the player in the run). */
export function covenantComplete(record: Covenant): boolean {
  return COVENANT_PIECES.every(p => record.includes(p));
}

/** The set effect: once the Covenant is complete, every Presence remembers the player in the run (a line on its card, never a
 *  stat). Before that, no presence remembers anything from the Covenant. The same for every presence, so no id is read. */
export function remembersInRun(record: Covenant): boolean {
  return covenantComplete(record);
}
