import { describe, expect, it } from 'vitest';
import { LESSON_PATHS, LIGHT_STORY, LISTENER_LESSON_CHOICE, crownGivesLight, lessonLine, lessonPathOf } from '../src/content/presences/lesson';
import { TREE_STORIES } from '../src/world/tree';
import { NO_COVENANT, keepPiece, holdsPiece } from '../src/content/presences/covenant';
import { rollListenerGift } from '../src/content/tables/heart-gifts';
import { RunRandom } from '../src/core/rng';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

describe("the Listener's Lesson and the Covenant's Light (LISTENER.md, COVENANT.md)", () => {
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

  it('the Light waits in the crown of the giant tree, and only for a run that has heard a Lesson (owner, #228, D4)', () => {
    expect(LIGHT_STORY).toBe('canopy');
    expect(TREE_STORIES.some(s => s.key === LIGHT_STORY)).toBe(true);
    for (const s of TREE_STORIES) {
      expect(crownGivesLight(s.key, true)).toBe(s.key === LIGHT_STORY);
      expect(crownGivesLight(s.key, false)).toBe(false);
    }
  });

  it('the Light is kept once, through the Lesson only', () => {
    const lit = keepPiece(NO_COVENANT, 'crown');
    expect(holdsPiece(lit, 'light')).toBe(true);
    expect(keepPiece(lit, 'crown')).toBe(lit);
    expect(keepPiece(NO_COVENANT, 'listener')).toBe(NO_COVENANT);
  });

  it('the Lesson draws no randomness: the reward roll of a seed is the same as before', () => {
    // the Lesson module is pure and takes no stream; the Listener's 15/75/10 roll reads only its drops stream
    const a = rollListenerGift(new RunRandom(1234).stream('drops'));
    const b = rollListenerGift(new RunRandom(1234).stream('drops'));
    expect(a).toEqual(b);
  });

  it('every Lesson line, the Light line and the Covenant labels exist in English and Spanish', () => {
    for (const key of [...LESSON_PATHS.map(lessonLine), 'presence.listener.crown', 'covenant.light.crown', 'covenant.title', 'covenant.promised', 'covenant.piece.thread', 'covenant.piece.page', 'covenant.piece.seal', 'covenant.piece.light', 'covenant.from.thread', 'covenant.from.page', 'covenant.from.seal', 'covenant.from.light'] as const) {
      expect((EN.messages as Record<string, string>)[key]).toBeTruthy();
      expect((ES.messages as Record<string, string>)[key]).toBeTruthy();
    }
  });
});

describe("the Child's Lesson is discarded (owner, #228, D8)", () => {
  it('no Child Lesson line exists in any catalog', () => {
    expect((EN.messages as Record<string, string>)['presence.child.lesson']).toBeUndefined();
    expect((ES.messages as Record<string, string>)['presence.child.lesson']).toBeUndefined();
  });
});
