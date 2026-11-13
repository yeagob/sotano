// The Roots' achievements in one session (docs/design/not-built/progression/ACHIEVEMENTS.md §2-4, MASTERY.md §1,
// SAVE.md §3): the tracker over the save record, the notices queued for the calm moments, and the words each
// notice shows. Pure: no DOM, no WebGL, no game state. The game (game.ts) makes one keeper for the session, feeds
// it the events its bus emits, takes one notice at a time when the player is calm, and shows it on the Presence card.
//
// An unlock is written to the record and the store at once (through saveMeta), so a closed tab never loses it.
// Notices are queued in order and kept across runs: a page achievement is earned at a run's end, and its card waits
// for the next run's calm start. The sandbox and the lab never track (`live` is false): they unlock nothing and
// write nothing. A record from a newer build is read-only: nothing is tracked or written.

import { ACHIEVEMENT_CAP, ACHIEVEMENTS } from '../content/achievements';
import { gainsAt, type GainLine } from '../content/tables/roots-mastery';
import type { MessageKey } from '../i18n';
import type { Params } from '../i18n';
import { qualityStars } from '../render/icons';
import { mastery, track, type Payload } from './achievements';
import { adoptMeta, resetMeta, saveMeta, type LoadedMeta, type MetaStore } from './meta';

/** One achievement earned, waiting for its card. `level` is the mastery level once it counts (1 to 100). */
export interface AchievementNotice {
  readonly id: string;
  readonly level: number;
  /** The step lines the new level brings (REWARDS §7): empty at the cap, where no step is left. */
  readonly gains: readonly GainLine[];
}

/** The payload of a finished sitting: a `complete` outcome only, never a quick reward or a cancel (ACHIEVEMENTS §1). */
export function sittingPayload(outcome: 'cancel' | 'quick' | 'complete', meditation: string, source: 'roots' | 'vault'): { meditation: string; source: 'roots' | 'vault' } | null {
  return outcome === 'complete' ? { meditation, source } : null;
}

export class AchievementKeeper {
  private queue: AchievementNotice[] = [];
  /** False in the sandbox and the lab: nothing is tracked, queued or written. */
  live = true;

  constructor(private readonly record: LoadedMeta, private readonly store: MetaStore) {}

  /** The Roots' mastery level now: the achievements unlocked, capped at 100 (MASTERY §1). */
  get level(): number { return mastery(this.record); }

  /** Notices waiting for their card, in the order they were earned. */
  get pending(): number { return this.queue.length; }

  /**
   * The notices that can be shown from this session: none while the keeper is not live (the sandbox and the lab show no
   * card), so a notice a real run queued never holds back a toll in a sandbox (ACHIEVEMENTS §4).
   */
  get showable(): number { return this.live && !this.record.readOnly ? this.queue.length : 0; }

  /**
   * Feeds one event to the catalogue. Counts and unlocks are saved at once when they change. Every achievement that
   * unlocks is queued as one notice, in catalogue order, with the level it brings. Returns the new notices.
   */
  track(event: string, payload: Payload, now: number): AchievementNotice[] {
    if (!this.live || this.record.readOnly) return [];
    const before = { achievements: this.record.achievements, counts: this.record.counts };
    const r = track(before, event, payload, now, ACHIEVEMENTS);
    if (r.state === before) return [];
    this.record.achievements = { ...r.state.achievements };
    this.record.counts = { ...r.state.counts };
    // the save merges with what the store holds now (another tab's unlocks, page), and this tab takes that over
    const merged = saveMeta(this.record, this.store);
    if (merged) adoptMeta(this.record, merged);
    // the level before this track's unlocks, as the record now stands (the store may hold unlocks this tab did not see)
    const base = mastery(this.record) - r.unlocked.length;
    const fresh = r.unlocked.map((def, i): AchievementNotice => {
      const level = Math.min(ACHIEVEMENT_CAP, base + i + 1);
      return { id: def.id, level, gains: gainsAt(level) };
    });
    this.queue.push(...fresh);
    return fresh;
  }

  /**
   * Debug (the console's S.meta.reset, SAVE §4): forgets the Roots. The default record is written at once (resetMeta, which
   * replaces the stored progress rather than merging it), this tab takes that record over, so its old unlocks and page are
   * not merged back by the next save, and the notices still queued are cleared. Refused, and nothing changes, in the sandbox
   * and the lab, on a read-only record, and when the store holds a newer build's record. Returns whether it was reset.
   */
  reset(): boolean {
    if (!this.live || this.record.readOnly) return false;
    const out = resetMeta(this.record, this.store);
    if (out.readOnly) return false;
    adoptMeta(this.record, out);
    this.queue.length = 0;
    return true;
  }

  /**
   * The notice to show next, still queued: it leaves the queue only when the player confirms its card (`confirm`). A card
   * cut off before that (a restart, a death, another banner) is the same notice at the next calm moment. Undefined when
   * none waits.
   */
  peek(): AchievementNotice | undefined {
    return this.queue[0];
  }

  /**
   * The player read the card of `notice`: it leaves the queue. Only the head of the queue can leave, so a card's late
   * confirmation never removes another notice.
   */
  confirm(notice: AchievementNotice): void {
    if (this.queue[0] === notice) this.queue.shift();
  }
}

/** The message keys a notice's card uses: its name, description, kicker, the gain line(s), and the mastery line. */
export function noticeKeys(n: AchievementNotice): MessageKey[] {
  const keys: MessageKey[] = [`achievement.${n.id}.name` as MessageKey, `achievement.${n.id}.desc` as MessageKey, 'achievement.card.kicker'];
  if (n.gains.length) keys.push('achievement.card.gain');
  keys.push('achievement.card.mastery');
  for (const g of n.gains) keys.push(g.key as MessageKey);
  return keys;
}

/** The gain line parameters with the star counts drawn with `qualityStars` (the same stars the item banner shows). */
export function gainParams(params: Readonly<Record<string, number>>): Params {
  const out: Params = {};
  for (const [k, v] of Object.entries(params)) out[k] = k === 'stars' ? qualityStars(v) : v;
  return out;
}

/** The step sentences of a notice in the given translator, joined by a space. */
export function gainText(gains: readonly GainLine[], tr: (key: MessageKey, params?: Params) => string): string {
  return gains.map(g => tr(g.key as MessageKey, gainParams(g.params))).join(' ');
}

/**
 * Whether the toll window may open now. It waits while an achievement card that can be shown is queued or on screen, so
 * the card is read first (ACHIEVEMENTS §4). `showableCards` is the keeper's `showable`, never `pending`: a card no
 * session can show must not block. Pure, so the rule is tested without the game.
 */
export function tollMayOpen(showableCards: number, cardOpen: boolean): boolean {
  return showableCards === 0 && !cardOpen;
}
