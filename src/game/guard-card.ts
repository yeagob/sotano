// The Boundary's mission card, as state (docs/design/built/presences/GUARD-MISSIONS.md). DOM-free, so the
// rules are tested without a page: the HUD draws whatever `view` says and sends every press through `act`.
//
// Phases: `ask` shows the mission with its answers; a mission with guided steps (the breath) also offers
// Begin, which starts `guide`: a countdown and the instruction for each moment. When the countdown ends the
// card goes to `question` ("Have you done it?"). The close ✕ (and Back) cancels from any phase: no reward,
// the chest stays locked, and the Boundary asks again when the player comes back.

import { meditationAt, meditationOf, type MeditationStep, type MissionId } from '../content/presences/missions';

export type GuardPhase = 'ask' | 'guide' | 'question';
export type GuardOutcome = 'yes' | 'no' | 'cancel';

export class GuardCard {
  phase: GuardPhase = 'ask';
  readonly steps: readonly MeditationStep[] | null;
  private began = 0;

  constructor(readonly mission: MissionId) {
    this.steps = meditationOf(mission);
  }

  /** The answer tiles of the current phase, in order. The close ✕ is not a tile: it is always there. */
  get answers(): string[] {
    if (this.phase === 'guide') return [];
    if (this.phase === 'ask' && this.steps) return ['begin', 'yes', 'no'];
    return ['yes', 'no'];
  }

  /** The tile selected when a phase opens: Begin for a guided mission, I did it after the countdown,
   *  I won't do it otherwise (the old default). */
  get first(): string | null {
    if (this.phase === 'guide') return null;
    if (this.phase === 'question') return 'yes';
    return this.steps ? 'begin' : 'no';
  }

  /** A press on a tile or the close ✕. Returns the outcome that ends the card, or null if the card stays. */
  act(id: string, now: number): GuardOutcome | null {
    if (id === 'close') return 'cancel';
    if (id === 'begin' && this.phase === 'ask' && this.steps) {
      this.phase = 'guide';
      this.began = now;
      return null;
    }
    if ((id === 'yes' || id === 'no') && this.phase !== 'guide') return id;
    return null;
  }

  /** Moves the countdown on; returns true when this call ended it (the card turns to the question). */
  tick(now: number): boolean {
    if (this.phase !== 'guide' || !this.steps) return false;
    if (!meditationAt(this.steps, now - this.began).done) return false;
    this.phase = 'question';
    return true;
  }

  /** What the guide shows now, or null outside the countdown. */
  guide(now: number) {
    if (this.phase !== 'guide' || !this.steps) return null;
    return meditationAt(this.steps, now - this.began);
  }
}
