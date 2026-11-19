import type { MessageKey } from '../../i18n';

/** The Listener's Lesson (docs/design/built/presences/LISTENER.md, decided by agent, pending owner ruling). Once its heart
 *  is accepted and its 15/75/10 reward has dropped (unchanged), the Listener asks on the choice card which path weighs on
 *  the player, and answers with one Lesson of that path, in words. The Lesson gives no item and draws no randomness: the
 *  answer is the player's, so it moves no random stream and the reward table stays exactly as it was. */

export const LESSON_PATHS = ['body', 'mind', 'emotion', 'will'] as const;
export type LessonPath = typeof LESSON_PATHS[number];

/** The Listener's choice card: its first line as the question, and the four paths as the answers. */
export const LISTENER_LESSON_CHOICE: { question: MessageKey; options: readonly MessageKey[] } = {
  question: 'presence.listener.1',
  options: LESSON_PATHS.map(p => `path.${p}` as MessageKey),
};

/** The path of an answer on the Listener's choice card, or null for "Not now" or an index out of range. */
export function lessonPathOf(index: number): LessonPath | null {
  return index >= 0 && index < LESSON_PATHS.length ? LESSON_PATHS[index] : null;
}

/** The Lesson's line for a path. */
export function lessonLine(path: LessonPath): MessageKey {
  return `presence.listener.lesson.${path}` as MessageKey;
}

/** The story of the giant tree where the Light waits: its canopy, the crown of the tree above the surface (owner, #228, D4:
 *  "la copa del árbol"). The crown's layout belongs to the tree; the Light only reads the story the body enters. */
export const LIGHT_STORY = 'canopy';

/** The one rule of the Light (COVENANT.md): the Covenant's Light is kept when the body enters the crown of the giant tree in a
 *  run that has heard a Listener's Lesson (any path, on any floor). A Lesson declined ("Not now") is not heard. The Light is
 *  what was heard, carried up to the crown. Pure, and it draws no randomness. */
export function crownGivesLight(story: string, heardLesson: boolean): boolean {
  return heardLesson && story === LIGHT_STORY;
}
