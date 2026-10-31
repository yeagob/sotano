// The Boundary's real-world missions (docs/design/built/presences/BOUNDARY.md). A mission is asked
// once per approach to the guarded chest. The player answers the question "Have you done it?":
// a yes inside the window is taken as not really done (a tier 1 or 2 practice); a yes after the
// window is a tier 3 or 4 practice. Not yet gives nothing. The game never reads what the player writes.

import type { Rng } from '../../core/rng';
import type { MessageKey } from '../../i18n';

export const MISSION_WINDOW_MS = 30000;

export const MISSIONS = {
  phrase: { title: 'mission.phrase.title', body: 'mission.phrase.body', alt: 'mission.phrase.alt' },
  message: { title: 'mission.message.title', body: 'mission.message.body', alt: 'mission.message.alt' },
  letter: { title: 'mission.letter.title', body: 'mission.letter.body', alt: 'mission.letter.alt' },
  draw: { title: 'mission.draw.title', body: 'mission.draw.body', alt: 'mission.draw.alt' },
  breathe: { title: 'mission.breathe.title', body: 'mission.breathe.body', alt: 'mission.breathe.alt' },
} satisfies Record<string, { title: MessageKey; body: MessageKey; alt: MessageKey }>;

export type MissionId = keyof typeof MISSIONS;

export const MISSION_IDS = Object.keys(MISSIONS) as MissionId[];

export function pickMission(rng: Rng): MissionId {
  return rng.pick(MISSION_IDS);
}

/** The item tiers (quality 1 to 4) a guard's reward may draw from, by how long the yes took. */
export function rewardBand(elapsedMs: number): [number, number] {
  return elapsedMs < MISSION_WINDOW_MS ? [1, 2] : [3, 4];
}
