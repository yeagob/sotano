// The world's time for one simulated frame (docs/design/built/practices/body/WALK-SLOWLY.md). DOM-free, so a test runs the
// same rule Game.simulate runs. Two things bend the world's time, and they never mix:
//  - Kairos stops it (game/kairos.ts): the stopped frame gets the real dt for its own countdown and nothing else moves.
//  - Walk Slowly (the `walkSlow` stat) halves it while the body is crouched and on the ground: every system the frame
//    steps (the body, intentions, projections, loose cubes, elements, doors, timers) gets the halved dt.
// The HUD, the input and the menus are stepped outside the simulation and keep the real dt. The sound follows the scale on
// its own terms (audio/sfx.ts `setWorldTimeScale`: pitch down and a low-pass).

/** The world's speed while the Roots walks slowly: crouched, on the ground, holding the practice. */
export const WALK_SLOW_SCALE = 0.5;

export interface TimeState {
  /** Kairos has stopped time. */
  kairosStopped: boolean;
  /** The `walkSlow` stat (1 while Walk Slowly is held). */
  walkSlow: number;
  /** The body's feet are on the ground (read before the frame moves it). */
  onGround: boolean;
  /** The body is crouched (read before the frame moves it). */
  crouching: boolean;
}

export type WorldFrame =
  | { kind: 'stopped'; dt: number }
  | { kind: 'running'; dt: number; scale: number };

/** 0.5 while the practice is held and the body is crouched on the ground; 1 otherwise. */
export function worldTimeScale(s: Omit<TimeState, 'kairosStopped'>): number {
  return s.walkSlow >= 1 && s.onGround && s.crouching ? WALK_SLOW_SCALE : 1;
}

/** The frame the world runs: Kairos's stop first and untouched, else the step under the time scale. At scale 1 the step is
 *  the very same number, so a run without the practice steps exactly as it did before the scale existed. */
export function worldFrame(dt: number, s: TimeState): WorldFrame {
  if (s.kairosStopped) return { kind: 'stopped', dt };
  const scale = worldTimeScale(s);
  return { kind: 'running', dt: scale === 1 ? dt : dt * scale, scale };
}
