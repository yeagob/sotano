// Omens and waves: how a projection announces itself before it exists (docs/design/BESTIARY.md §2).
// Pure rules only: where a spawn may happen and how a room's roster splits into waves. The game
// draws the particles, plays the spatial sound and spawns the projection when the omen breaches.

import type { PalToken } from '../content/palette';
import type { Rng } from '../core/rng';

/** Seconds of gathering motes before the crack, then the breach that lets the projection out. */
export const OMEN_GATHER = 1.3;
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

/** Motes one omen gathers in all (owner, 2026-10-27: more and clearer than the 24 of DECISIONS §7.3). */
export const OMEN_MOTES = 72;
/** A light mote lives at least this long (DECISIONS §7.3), so none is born in the gather's last 0.3 s. */
export const MOTE_MIN_LIFE = 0.3;
/** The longest frame the game runs (Game.frame clamps dt): the schedule ends this early, so a slow frame never skips a mote. */
const MAX_FRAME = 0.05;
/** The part of the gather that motes are born in: the last MOTE_MIN_LIFE and a frame stay free. */
export const MOTE_WINDOW = OMEN_GATHER - MOTE_MIN_LIFE - MAX_FRAME;
/** Share of the motes born at the steady start rate (the rest accelerate toward the crack). */
export const MOTE_EARLY = 0.5;
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
  const u = Math.min(1, o.t / MOTE_WINDOW);
  const target = Math.floor(OMEN_MOTES * (MOTE_EARLY * u + (1 - MOTE_EARLY) * u * u));
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
 * Picks one spawn cell from the room's standable cells, seeded through `rng`: never within
 * DOOR_CLEARANCE of a door, and never within PLAYER_CLEARANCE of the player. Null when no cell is
 * clear of both.
 */
export function pickSpawnCell(cells: readonly Cell[], doors: readonly Cell[], player: Cell, rng: Rng): Cell | null {
  const far = cells.filter(c => doors.every(d => dist(c, d) >= DOOR_CLEARANCE) && dist(c, player) >= PLAYER_CLEARANCE);
  return far.length > 0 ? rng.pick(far) : null;
}

export const spawnBlocked = (o: Cell, player: Cell) => dist(o, player) < PLAYER_CLEARANCE;
