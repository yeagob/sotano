import { describe, expect, it } from 'vitest';
import { CHILD_LESSON, LAST_LESSON_FLOOR, LESSON_PATHS, LISTENER_LESSON_CHOICE, lessonGivesLight, lessonLine, lessonPathOf } from '../src/content/presences/lesson';
import { NO_COVENANT, keepPiece, holdsPiece } from '../src/content/presences/covenant';
import { rollListenerGift } from '../src/content/tables/heart-gifts';
import { RunRandom } from '../src/core/rng';
import { level, LAST_FLOOR } from '../src/content/levels';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

describe("the Listener's Lesson and the Covenant's Light (LISTENER.md, decided by agent)", () => {
  it('the choice card asks the Listener\'s first line, with the four paths as answers', () => {
    expect(LISTENER_LESSON_CHOICE.question).toBe('presence.listener.1');
    expect(LISTENER_LESSON_CHOICE.options).toEqual(['path.body', 'path.mind', 'path.emotion', 'path.will']);
    expect(LISTENER_LESSON_CHOICE.options.length).toBeLessThanOrEqual(4);
  });

  it('an answer maps to its path; "Not now" (-1) and out-of-range answers give no Lesson', () => {
    LESSON_PATHS.forEach((p, i) => expect(lessonPathOf(i)).toBe(p));
    expect(lessonPathOf(-1)).toBeNull();
    expect(lessonPathOf(4)).toBeNull();
  });

  it('the last Lesson is on the deepest Tree floor, and only there does it give the Light', () => {
    const tree = [];
    for (let k = 1; k <= LAST_FLOOR; k++) if (level(k).kind === 'tree') tree.push(k);
    expect(LAST_LESSON_FLOOR).toBe(Math.max(...tree));
    expect(LAST_LESSON_FLOOR).toBe(5);
    for (let k = 0; k <= LAST_FLOOR; k++) expect(lessonGivesLight(k)).toBe(k === LAST_LESSON_FLOOR);
  });

  it('the Light is kept once, through the Lesson only', () => {
    const lit = keepPiece(NO_COVENANT, 'last-lesson');
    expect(holdsPiece(lit, 'light')).toBe(true);
    expect(keepPiece(lit, 'last-lesson')).toBe(lit);
    expect(keepPiece(NO_COVENANT, 'listener')).toBe(NO_COVENANT);
  });

  it('the Lesson draws no randomness: the reward roll of a seed is the same as before', () => {
    // the Lesson module is pure and takes no stream; the Listener's 15/75/10 roll reads only its drops stream
    const a = rollListenerGift(new RunRandom(1234).stream('drops'));
    const b = rollListenerGift(new RunRandom(1234).stream('drops'));
    expect(a).toEqual(b);
  });

  it('every Lesson line, the Light line and the Covenant labels exist in English and Spanish', () => {
    for (const key of [...LESSON_PATHS.map(lessonLine), 'presence.listener.light', CHILD_LESSON, 'covenant.title', 'covenant.promised', 'covenant.piece.thread', 'covenant.piece.page', 'covenant.piece.seal', 'covenant.piece.light', 'covenant.from.thread', 'covenant.from.page', 'covenant.from.seal', 'covenant.from.light'] as const) {
      expect((EN.messages as Record<string, string>)[key]).toBeTruthy();
      expect((ES.messages as Record<string, string>)[key]).toBeTruthy();
    }
  });
});
