// The run's friends (issue #351, the ascent companions; ILLUMINATION.md §3): every being the player befriended in
// this run, by kind, in the order they were befriended. It is fed from the conversion events that exist, never a new
// one: `factionChange` to the player's side ('self') for the projections, the creatures, the bosses and the Mender's
// mended allies, and the sky's own record of its won guardians (a deity is never an Enemies actor, so it changes no
// faction). It lives for one run and is never saved. Pure.

/** The kinds of friend, in the order they appear around the player on the final ascent: the deities first. */
export const ALLY_KINDS = ['deity', 'projection', 'mended', 'creature', 'boss'] as const;
export type AllyKind = (typeof ALLY_KINDS)[number];

/** The parts of a `factionChange` the tally reads, and the spec kind of the actor's definition. */
export interface FactionChange { targetKind: string; def: string; from: string; to: string; source: string }

/** The kind of friend a faction change makes, or null when it makes none (another side, the sandbox, a relapse). */
export function allyKindOf(c: FactionChange, specKind: string | undefined): AllyKind | null {
  if (c.targetKind !== 'projection' || c.to !== 'self' || c.from !== 'projection' || c.source === 'sandbox') return null;
  if (c.source === 'mender') return 'mended';
  if (specKind === 'boss') return 'boss';
  if (specKind === 'creature') return 'creature';
  return 'projection';
}

export class AllyTally {
  private readonly lists: Record<AllyKind, string[]> = { deity: [], projection: [], mended: [], creature: [], boss: [] };

  /** One friend made: its kind and the id of what it is (a projection's def, a deity's animal). */
  record(kind: AllyKind, def: string) {
    this.lists[kind].push(def);
  }

  /** The sky's won guardians, read from the sky: each animal counts once, in the order given. */
  syncDeities(animals: readonly string[]) {
    for (const a of animals) if (!this.lists.deity.includes(a)) this.lists.deity.push(a);
  }

  count(kind: AllyKind): number { return this.lists[kind].length; }

  /** The ids of that kind's friends, in the order they were made (repeats kept: two Doubts are two friends). */
  defs(kind: AllyKind): readonly string[] { return this.lists[kind]; }

  get total(): number { return ALLY_KINDS.reduce((n, k) => n + this.lists[k].length, 0); }

  /** The kinds with at least one friend, in ALLY_KINDS order. */
  get kinds(): AllyKind[] { return ALLY_KINDS.filter(k => this.lists[k].length > 0); }
}
