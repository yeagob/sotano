// Omens and waves: how a projection announces itself before it exists (docs/design/BESTIARY.md §2).
// Pure rules only: where a spawn may happen and how a room's roster splits into waves. The game
// draws the particles, plays the spatial sound and spawns the projection when the omen breaches.

import type { PalToken } from '../content/palette';
import type { Rng } from '../core/rng';

/** Seconds of gathering motes before the crack, then the breach that lets the projection out. */
export const OMEN_GATHER = 1.0;
export const OMEN_BREACH = 0.2;
/** Projections per wave at most (BESTIARY §2.4: a wave is one clear announcement, not a flood). */
export const WAVE_SIZE = 3;
/** A spawn point is never closer than this to a door (BESTIARY §2.2, rule 1). */
export const DOOR_CLEARANCE = 3;
/** A spawn point is preferably this far from the player (BESTIARY §2.2, rule 2). */
export const PLAYER_CLEARANCE = 3.5;

export interface Cell { x: number; z: number }

export interface Omen {
  def: string;
  room: number;
  /** The room's spawn count when this omen opened: the seed path of the projection's parts. */
  seq: number;
  x: number; y: number; z: number;
  /** Seconds since the omen opened. */
  t: number;
  breached: boolean;
  /** Gather motes already emitted (the schedule's accumulator, see gatherMotesDue). */
  emitted: number;
}

// ── The omen's motes (art: DECISIONS §3.6, §7.3) ──

/** Motes one omen gathers in all (DECISIONS §7.3 cap: an omen is a whisper, not a swarm). */
export const OMEN_MOTES = 24;
/** A light mote lives at least this long (DECISIONS §7.3), so none is born in the gather's last 0.3 s. */
export const MOTE_MIN_LIFE = 0.3;
/** The longest frame the game runs (Game.frame clamps dt): the schedule ends this early, so a slow frame never skips a mote. */
const MAX_FRAME = 0.05;
/** Seconds between two motes: the 24 are spread evenly over the part of the gather that leaves them a full life. */
export const MOTE_STEP = (OMEN_GATHER - MOTE_MIN_LIFE - MAX_FRAME) / OMEN_MOTES;
/** The cold ramp an omen is drawn from (projections' side only; never warm, never gold). */
export const OMEN_COLORS: readonly PalToken[] = ['cold.dim', 'cold.body', 'cold.white'];
/** The breach flare: the family eye's colour. */
export const OMEN_BREACH_COLOR: PalToken = 'cold.white';

/**
 * How many gather motes are due this frame (call it after advancing `o.t`); it counts them into
 * `o.emitted`. Exactly OMEN_MOTES per omen at any frame rate the game runs, and none once less than
 * MOTE_MIN_LIFE of the gather remains (a late mote is dropped rather than born to live a frame).
 */
export function gatherMotesDue(o: Omen): number {
  if (o.t < 0 || OMEN_GATHER - o.t < MOTE_MIN_LIFE) return 0;
  const target = Math.min(OMEN_MOTES, Math.floor(o.t / MOTE_STEP) + 1);
  const due = Math.max(0, target - o.emitted);
  o.emitted += due;
  return due;
}

/** A gather mote's colour: `cold.dim` in the first half of the gather, `cold.body` as the crack nears. */
export function gatherMoteColor(t: number): PalToken {
  return t < OMEN_GATHER / 2 ? 'cold.dim' : 'cold.body';
}

// ── The seal: doors slam when a room's fight starts (DECISIONS §7.3, §7.4) ──

/** Dust motes per slamming door at most. */
export const SLAM_MOTES = 12;
/** No event spawns more than this many particles (DECISIONS §7.3). */
export const EVENT_PARTICLE_CAP = 60;
/** Shake of the slam, in seconds of the HUD's shake (gentle: a nudge, not a blow). */
export const SLAM_SHAKE = 0.12;

/** Motes per door when `doors` doors slam at once: 12, fewer when many doors share the 60 cap. */
export function slamMotesPerDoor(doors: number): number {
  return doors <= 0 ? 0 : Math.min(SLAM_MOTES, Math.floor(EVENT_PARTICLE_CAP / doors));
}

/** Splits a roster into waves of at most `size` projections, keeping its order. */
export function splitWaves(roster: readonly string[], size = WAVE_SIZE): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < roster.length; i += size) out.push(roster.slice(i, i + size));
  return out;
}

const dist = (a: Cell, b: Cell) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * Picks one spawn cell from the room's standable cells, seeded through `rng`:
 * never within DOOR_CLEARANCE of a door; preferably PLAYER_CLEARANCE away from the player.
 * When no cell is far enough from the player, the farthest one is used. Returns null only when
 * no cell is clear of the doors at all.
 */
export function pickSpawnCell(cells: readonly Cell[], doors: readonly Cell[], player: Cell, rng: Rng): Cell | null {
  const clear = cells.filter(c => doors.every(d => dist(c, d) >= DOOR_CLEARANCE));
  if (clear.length === 0) return null;
  const far = clear.filter(c => dist(c, player) >= PLAYER_CLEARANCE);
  if (far.length > 0) return rng.pick(far);
  let best = clear[0];
  for (const c of clear) if (dist(c, player) > dist(best, player)) best = c;
  return best;
}
