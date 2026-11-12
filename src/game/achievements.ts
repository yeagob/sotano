// The achievement tracker (docs/design/not-built/progression/ACHIEVEMENTS.md §2-3, MASTERY.md §1): pure. An event
// name and its payload go in with the time; the achievements that just unlocked come out, with the new state.
// It touches no game state, no DOM and no save: the caller writes `state` into the save record (SAVE.md §3).
// It takes the event by name, so it works before the events exist in GameEvents (package D2 declares them).

import { ACHIEVEMENTS, ACHIEVEMENT_CAP, ACHIEVEMENT_EVENTS, type AchievementDef } from '../content/achievements';

/** The payload of an event: the fields a `where` clause can name. */
export type Payload = Readonly<Record<string, unknown>>;

/** The part of the save record the tracker reads and writes (SAVE.md §1). */
export interface AchievementState {
  /** Unlocked id → unlock time (ms since the epoch). */
  readonly achievements: Readonly<Record<string, number>>;
  /** Id → matching events so far, kept only while a `times` achievement is still locked. */
  readonly counts: Readonly<Record<string, number>>;
}

export interface TrackResult {
  /** The new state. The same object when nothing changed. The input is never modified. */
  readonly state: AchievementState;
  /** The achievements this event unlocked, in catalogue order. Empty when none did. */
  readonly unlocked: readonly AchievementDef[];
}

const has = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key);

/** True when the event is the one the entry waits for and every `where` field matches (a list matches any of its values). */
export function matches(def: AchievementDef, event: string, payload: Payload): boolean {
  if (def.on !== event) return false;
  for (const [field, want] of Object.entries(def.where ?? {})) {
    const got = payload[field];
    if (Array.isArray(want)) {
      if (!(want as readonly unknown[]).includes(got)) return false;
    } else if (got !== want) return false;
  }
  return true;
}

/**
 * Feeds one event to the catalogue. Every matching entry that is still locked counts the event; an entry with
 * `times` unlocks when its count reaches that many. An unlocked id is never counted or unlocked again. `now` is
 * the unlock time written into `achievements`.
 */
export function track(
  state: AchievementState,
  event: string,
  payload: Payload,
  now: number,
  catalogue: readonly AchievementDef[] = ACHIEVEMENTS,
): TrackResult {
  let achievements = state.achievements;
  let counts = state.counts;
  const unlocked: AchievementDef[] = [];
  for (const def of catalogue) {
    if (!matches(def, event, payload) || has(achievements, def.id)) continue;
    const seen = (has(counts, def.id) ? counts[def.id] : 0) + 1;
    if (seen < (def.times ?? 1)) {
      counts = { ...counts, [def.id]: seen };
      continue;
    }
    achievements = { ...achievements, [def.id]: now };
    unlocked.push(def);
    if (has(counts, def.id)) {
      const rest = { ...counts };
      delete rest[def.id];
      counts = rest;
    }
  }
  if (achievements === state.achievements && counts === state.counts) return { state, unlocked };
  return { state: { achievements, counts }, unlocked };
}

/** True when the id is unlocked in the state. */
export function isUnlocked(state: Pick<AchievementState, 'achievements'>, id: string): boolean {
  return has(state.achievements, id);
}

/**
 * The Roots' mastery level: the number of unlocked ids that exist in the catalogue, capped at ACHIEVEMENT_CAP.
 * Ids the catalogue no longer has are kept in the save and not counted. Computed, never stored.
 */
export function mastery(state: Pick<AchievementState, 'achievements'>, catalogue: readonly AchievementDef[] = ACHIEVEMENTS): number {
  let n = 0;
  for (const def of catalogue) if (has(state.achievements, def.id)) n++;
  return Math.min(ACHIEVEMENT_CAP, n);
}

/**
 * The problems with a catalogue, as text; an empty list when it is well formed: ids unique and shaped
 * `^[a-z0-9.-]+$`, at most ACHIEVEMENT_CAP entries, `on` an event of ACHIEVEMENT_EVENTS, `times` a whole number from 1,
 * and every `where` a field with a string, number, boolean or list of strings and numbers.
 */
export function catalogueErrors(catalogue: readonly AchievementDef[] = ACHIEVEMENTS): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  if (catalogue.length > ACHIEVEMENT_CAP) errors.push(`${catalogue.length} achievements, the cap is ${ACHIEVEMENT_CAP}`);
  for (const def of catalogue) {
    const at = `achievement ${def.id}`;
    if (!/^[a-z0-9.-]+$/.test(def.id)) errors.push(`${at}: id must match ^[a-z0-9.-]+$`);
    if (seen.has(def.id)) errors.push(`${at}: duplicate id`);
    seen.add(def.id);
    if (!(ACHIEVEMENT_EVENTS as readonly string[]).includes(def.on)) errors.push(`${at}: unknown event ${def.on}`);
    if (def.times !== undefined && !(Number.isInteger(def.times) && def.times >= 1)) errors.push(`${at}: times must be a whole number from 1`);
    for (const [field, want] of Object.entries(def.where ?? {})) {
      const ok = Array.isArray(want)
        ? want.every(v => typeof v === 'string' || typeof v === 'number')
        : typeof want === 'string' || typeof want === 'number' || typeof want === 'boolean';
      if (!ok) errors.push(`${at}: where.${field} has a value that is not a string, number, boolean or list of them`);
    }
  }
  return errors;
}
