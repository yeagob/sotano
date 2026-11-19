import type { MessageKey } from '../../i18n';
import { LAST_FLOOR, level } from '../levels';

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

/** The floor of the Listener's last Lesson: the deepest floor of the Tree, where the last Listener of a run waits (floor 5
 *  today). Read from the level table, so it follows the Tree if the levels change. */
export const LAST_LESSON_FLOOR: number = (() => {
  let last = 0;
  for (let k = 1; k <= LAST_FLOOR; k++) if (level(k).kind === 'tree') last = k;
  return last;
})();

/** Whether a Lesson given on this floor is the Listener's last one, which gives the Covenant's Light (COVENANT.md). A Lesson
 *  declined ("Not now") gives nothing, so only an answered Lesson on the last floor reaches this. */
export function lessonGivesLight(floor: number): boolean {
  return floor === LAST_LESSON_FLOOR;
}
