// The ascent companions (issue #351; ILLUMINATION.md §3): from the first checkpoint of the final ascent on, the beings
// the player befriended in this run appear round the player and rise with them. The deities come first; then one of
// each other kind; then more and more as the climb goes up, until the space round the player is full. They are seen,
// never touched: no body, no collision, no actor. Pure: the roster, the schedule and the follow, all in fixed numbers
// (no seed, no clock).

import { ALLY_KINDS, type AllyKind, type AllyTally } from './ally-tally';

export const COMPANIONS = {
  /** The most companions round the player at once: the space is full. */
  MAX: 40,
  /** Seconds between the first of one kind and the first of the next, after the deities. */
  APPEAR_EVERY_S: 1.5,
  /** The share of the ascent (first checkpoint → last) at which the space is full. */
  FULL_AT: 0.85,
  /** Their places round the player: rings from RING_MIN, RING_STEP apart, RINGS of them (blocks). */
  RING_MIN: 5,
  RING_STEP: 1.8,
  RINGS: 4,
  /** How fast they follow: across (1/s), and up, slower for some, so each lags the player's height its own way. */
  FOLLOW_XZ: 2.5,
  FOLLOW_Y_MIN: 0.7,
  FOLLOW_Y_MAX: 1.8,
  /** A newcomer starts this far below its place and rises into it. */
  APPEAR_DROP: 3,
} as const;

/** One friend on the roster: its kind and what it is (a projection's def, a deity's animal). */
export interface RosterEntry { readonly kind: AllyKind; readonly def: string }

/** The roster in the order they appear: every deity, then the first of each other kind, then the rest by turns. */
export function roster(tally: AllyTally): RosterEntry[] {
  const out: RosterEntry[] = tally.defs('deity').map(def => ({ kind: 'deity' as const, def }));
  const others = ALLY_KINDS.filter(k => k !== 'deity');
  const next = new Map<AllyKind, number>(others.map(k => [k, 0]));
  for (let more = true; more && out.length < COMPANIONS.MAX;) {
    more = false;
    for (const k of others) {
      const i = next.get(k)!, list = tally.defs(k);
      if (i >= list.length || out.length >= COMPANIONS.MAX) continue;
      out.push({ kind: k, def: list[i] });
      next.set(k, i + 1);
      more = true;
    }
  }
  return out;
}

/** How many of a roster are shown `t` seconds after the first checkpoint, at `progress` (0 → 1) of the ascent. */
export function shownCount(list: readonly RosterEntry[], t: number, progress: number): number {
  const deities = list.filter(e => e.kind === 'deity').length;
  const firsts = new Set(list.filter(e => e.kind !== 'deity').map(e => e.kind)).size;
  const base = deities + firsts;
  const byTime = deities + Math.min(firsts, Math.floor(Math.max(0, t) / COMPANIONS.APPEAR_EVERY_S));
  if (byTime < base) return byTime;
  const p = Math.min(1, Math.max(0, progress) / COMPANIONS.FULL_AT);
  return Math.min(list.length, base + Math.floor(p * (list.length - base)));
}

/** A slot's place round the player (golden angle round fixed rings) and its own rate of following the player's height. */
export function slotOffset(slot: number): { dx: number; dy: number; dz: number; followY: number } {
  const a = slot * 2.399963229728653;
  const r = COMPANIONS.RING_MIN + (slot % COMPANIONS.RINGS) * COMPANIONS.RING_STEP;
  const dy = (((slot * 5) % 7) - 3) * 0.7;
  const followY = COMPANIONS.FOLLOW_Y_MIN + (COMPANIONS.FOLLOW_Y_MAX - COMPANIONS.FOLLOW_Y_MIN) * (((slot * 3) % 5) / 4);
  return { dx: Math.cos(a) * r, dy, dz: Math.sin(a) * r, followY };
}

export interface Companion { readonly slot: number; readonly kind: AllyKind; readonly def: string; x: number; y: number; z: number }

export class AscentCompanions {
  private t = 0;
  private progress = 0;
  private readonly list: Companion[] = [];
  private readonly heardKinds = new Set<AllyKind>();

  get companions(): readonly Companion[] { return this.list; }

  /**
   * One frame: the time since the first checkpoint goes on, the ascent's progress is kept at its highest (a fall takes no
   * friend away), newcomers join, and every companion follows the player. Returns the kinds whose first friend joined
   * this frame (each kind once: its sound plays).
   */
  update(dt: number, entries: readonly RosterEntry[], progress: number, player: { x: number; y: number; z: number }): AllyKind[] {
    this.t += Math.max(0, dt);
    this.progress = Math.max(this.progress, progress);
    const joined: AllyKind[] = [];
    const want = shownCount(entries, this.t, this.progress);
    for (let i = this.list.length; i < want; i++) {
      const e = entries[i], o = slotOffset(i);
      this.list.push({ slot: i, kind: e.kind, def: e.def, x: player.x + o.dx, y: player.y + o.dy - COMPANIONS.APPEAR_DROP, z: player.z + o.dz });
      if (!this.heardKinds.has(e.kind)) { this.heardKinds.add(e.kind); joined.push(e.kind); }
    }
    const kxz = 1 - Math.exp(-COMPANIONS.FOLLOW_XZ * dt);
    for (const c of this.list) {
      const o = slotOffset(c.slot), ky = 1 - Math.exp(-o.followY * dt);
      c.x += (player.x + o.dx - c.x) * kxz;
      c.z += (player.z + o.dz - c.z) * kxz;
      c.y += (player.y + o.dy - c.y) * ky;
    }
    return joined;
  }
}
