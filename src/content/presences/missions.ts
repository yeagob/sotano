// The Boundary's real-world missions (docs/design/built/presences/BOUNDARY.md). A mission is asked
// once per approach to the guarded chest. The player answers the question "Have you done it?":
// a yes inside the window is taken as not really done (a tier 1 or 2 practice); a yes after the
// window is a tier 3 or 4 practice. I won't do it is a tier 1 or 2 practice. Closing the card (the ✕ or
// Back) cancels: nothing is given and the chest stays locked. A mission with guided steps (the breath)
// can run on the card as a countdown with what to do at each moment. The game never reads what the
// player writes.

import type { Rng } from '../../core/rng';
import type { MessageKey } from '../../i18n';

export const MISSION_WINDOW_MS = 30000;

export const MISSIONS = {
  phrase: { title: 'mission.phrase.title', body: 'mission.phrase.body', alt: 'mission.phrase.alt' },
  message: { title: 'mission.message.title', body: 'mission.message.body' },
  letter: { title: 'mission.letter.title', body: 'mission.letter.body', alt: 'mission.letter.alt' },
  draw: { title: 'mission.draw.title', body: 'mission.draw.body', alt: 'mission.draw.alt' },
  breathe: { title: 'mission.breathe.title', body: 'mission.breathe.body', alt: 'mission.breathe.alt', steps: 'breathe' },
} satisfies Record<string, { title: MessageKey; body: MessageKey; alt?: MessageKey; steps?: MeditationId }>;

export type MissionId = keyof typeof MISSIONS;

/** One moment of a guided meditation: what to do now (`text`), for how long (`ms`), and what the breath
 *  circle on the card does meanwhile (grows on an in-breath, shrinks on an out-breath, rests otherwise). */
export interface MeditationStep { text: MessageKey; ms: number; breath: 'in' | 'out' | 'rest' }

/** The guided meditations a mission can run on its card, with their real durations. The breath mission
 *  asks for 30 seconds: settle, two slow breaths (in 4 s, out 6 s), and come back. */
export const MEDITATIONS = {
  breathe: [
    { text: 'meditation.breathe.settle', ms: 4000, breath: 'rest' },
    { text: 'meditation.breathe.in', ms: 4000, breath: 'in' },
    { text: 'meditation.breathe.out', ms: 6000, breath: 'out' },
    { text: 'meditation.breathe.in', ms: 4000, breath: 'in' },
    { text: 'meditation.breathe.out', ms: 6000, breath: 'out' },
    { text: 'meditation.breathe.return', ms: 6000, breath: 'rest' },
  ],
} satisfies Record<string, readonly MeditationStep[]>;

export type MeditationId = keyof typeof MEDITATIONS;

/** The guided steps of a mission, or null when it has none (writing and drawing are not timed). */
export function meditationOf(id: MissionId): readonly MeditationStep[] | null {
  const m: { title: MessageKey; steps?: MeditationId } = MISSIONS[id];
  return m.steps ? MEDITATIONS[m.steps] : null;
}

export function meditationMs(steps: readonly MeditationStep[]): number {
  return steps.reduce((a, s) => a + s.ms, 0);
}

/** Where a meditation stands `elapsedMs` after it began: the step to show, how far into that step (0 to 1),
 *  the whole seconds left on the timer (rounded up, so it reads 30 at the start and 0 only at the end), and
 *  whether it has ended. */
export function meditationAt(steps: readonly MeditationStep[], elapsedMs: number) {
  const total = meditationMs(steps);
  const t = Math.min(Math.max(0, elapsedMs), total);
  let start = 0, index = steps.length - 1;
  for (let i = 0; i < steps.length; i++) {
    if (t < start + steps[i].ms) { index = i; break; }
    start += steps[i].ms;
  }
  if (t >= total) start = total - steps[index].ms;
  const step = steps[index];
  return {
    index,
    step,
    progress: Math.min(1, (t - start) / step.ms),
    secondsLeft: Math.ceil((total - t) / 1000),
    done: t >= total,
  };
}

export const MISSION_IDS = Object.keys(MISSIONS) as MissionId[];

export function pickMission(rng: Rng): MissionId {
  return rng.pick(MISSION_IDS);
}

/** The item tiers (quality 1 to 4) a guard's reward may draw from. Doing the mission (a yes) draws tier 1 or 2
 *  inside the window and tier 3 or 4 after it; not doing it (no) always draws tier 1 or 2. */
export function rewardBand(done: boolean, elapsedMs: number): [number, number] {
  return done && elapsedMs >= MISSION_WINDOW_MS ? [3, 4] : [1, 2];
}
