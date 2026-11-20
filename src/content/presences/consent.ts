import { leavesOnDecline, type PresenceId } from './index';

/** The consent path of a presence's cards, as pure rules (the game applies them in resolvePresenceOffer and
 *  resolvePresenceChoice). Nothing is taken unless the answer is yes and the offer is still the one on the card. */

/** What the game sees of an offer when it is answered. */
export interface OfferState {
  /** The presence is still in the world and still a presence. */
  present: boolean;
  /** The presence has already given its exchange (its 'met' tag): a second yes gives nothing. */
  met: boolean;
  /** The hand still holds the very thing the card named, in the same slot. */
  sameCarried: boolean;
  /** That thing still opens this presence. */
  unlocks: boolean;
}

/** 'stale': the card no longer matches the world, refuse and take nothing. 'leave': a decline, and the presence leaves
 *  with nothing taken (the Trickster, the Wanderer). 'wait': a decline, nothing taken, it asks again after the player steps
 *  away. 'accept': a yes on a valid offer, the exchange happens once. */
export type OfferOutcome = 'stale' | 'leave' | 'wait' | 'accept';

export function offerOutcome(id: PresenceId, accept: boolean, s: OfferState): OfferOutcome {
  if (!s.present || s.met || !s.sameCarried || !s.unlocks) return 'stale';
  if (!accept) return leavesOnDecline(id) ? 'leave' : 'wait';
  return 'accept';
}

/** The answer of a choice card: 'stale' when the presence is gone or met, 'wait' for "Not now" or an answer out of range
 *  (nothing taken), 'answer' for one of its options. */
export type ChoiceOutcome = 'stale' | 'wait' | 'answer';

export function choiceOutcome(index: number, options: number, s: Pick<OfferState, 'present' | 'met'>): ChoiceOutcome {
  if (!s.present || s.met) return 'stale';
  return index >= 0 && index < options ? 'answer' : 'wait';
}

/** The Boatman's toll is taken only when the ferry lands: no island in the room, no crossing and nothing taken. */
export function boatmanCrossing(landing: unknown): 'ferry' | 'no-crossing' {
  return landing ? 'ferry' : 'no-crossing';
}

/** Seconds of game time after a choice card opens during which a confirm (key or button) is ignored, so a stray double
 *  confirm cannot pick the first answer by accident. A click or tap on a named answer is deliberate and is not delayed. */
export const CHOICE_CONFIRM_GRACE_S = 0.4;

/** The grace of a choice card: opened when the card opens, counted down on game time. */
export class ChoiceGuard {
  private left = 0;
  open(): void { this.left = CHOICE_CONFIRM_GRACE_S; }
  tick(dt: number): void { this.left = Math.max(0, this.left - dt); }
  get ready(): boolean { return this.left <= 0; }
}
