import { describe, expect, it } from 'vitest';
import { COVENANT_PIECES, NO_COVENANT, PIECE_SOURCE, covenantComplete, holdsPiece, keepPiece, remembersInRun } from '../src/content/presences/covenant';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

describe('the Covenant (COVENANT.md): a closed set of four pieces, one presence each', () => {
  it('the closed set: the Mender (Thread), the Elder (Page), the Witness (Seal) and the crown after a Lesson (Light), one source each', () => {
    expect(PIECE_SOURCE).toEqual({ mender: 'thread', elder: 'page', witness: 'seal', crown: 'light' });
    expect(Object.isFrozen(PIECE_SOURCE)).toBe(true);
    // every piece has exactly one source, and no source gives a piece outside the set
    for (const piece of COVENANT_PIECES) expect(Object.values(PIECE_SOURCE).filter(p => p === piece)).toHaveLength(1);
    expect(Object.values(PIECE_SOURCE).every(p => (COVENANT_PIECES as readonly string[]).includes(p!))).toBe(true);
    expect(COVENANT_PIECES).toEqual(['thread', 'page', 'seal', 'light']);
  });

  it('a presence that gives no piece, the Listener included, changes nothing', () => {
    for (const id of ['listener', 'gardener', 'trickster', 'echo', 'child', 'boatman', 'wanderer', 'star-reader', 'cartographer'] as const) {
      expect(keepPiece(NO_COVENANT, id)).toBe(NO_COVENANT);
    }
  });

  it('a piece is given once: a second exchange with the same presence keeps the record as it was', () => {
    const once = keepPiece(NO_COVENANT, 'mender');
    expect(once).toEqual(['thread']);
    expect(keepPiece(once, 'mender')).toBe(once);
  });

  it('the record is never mutated: each give returns a new record in the order given', () => {
    const a = keepPiece(NO_COVENANT, 'witness');
    const b = keepPiece(a, 'elder');
    expect(a).toEqual(['seal']);
    expect(b).toEqual(['seal', 'page']);
    expect(NO_COVENANT).toEqual([]);
    expect(holdsPiece(b, 'page')).toBe(true);
    expect(holdsPiece(b, 'light')).toBe(false);
  });

  it('the set is complete only with all four pieces, in any order, and the set effect follows it', () => {
    let record = NO_COVENANT;
    for (const id of ['witness', 'mender', 'elder'] as const) record = keepPiece(record, id);
    expect(covenantComplete(record)).toBe(false);
    expect(remembersInRun(record)).toBe(false);
    // the Light comes only from the crown after a Lesson, never from the Listener's plain exchange
    expect(keepPiece(record, 'listener')).toBe(record);
    const whole = keepPiece(record, 'crown');
    expect(covenantComplete(whole)).toBe(true);
    expect(remembersInRun(whole)).toBe(true);
  });

  it('a complete record is closed: no source changes it again', () => {
    let record = NO_COVENANT;
    for (const id of ['crown', 'witness', 'mender', 'elder'] as const) record = keepPiece(record, id);
    expect(covenantComplete(record)).toBe(true);
    for (const id of ['crown', 'witness', 'mender', 'elder', 'listener', 'trickster'] as const) expect(keepPiece(record, id)).toBe(record);
  });

  it('the new lines exist in English and Spanish', () => {
    for (const key of ['request.draw', 'request.draw.alt', 'request.still', 'request.still.alt', 'covenant.remembers', 'covenant.complete'] as const) {
      expect(EN.messages[key]).toBeTruthy();
      expect(ES.messages[key]).toBeTruthy();
    }
  });
});
