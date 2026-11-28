// What the deep desert's worm gives (issue #354, docs/design/built/levels/worm-desert/WORM.md), by the way the run met
// it. The owner's rule: ridden (calmed, then the dismount) gives Prescience and the achievement desert.worm.ridden;
// slain (three explosions in its mouth) gives Cut Ties with Toxic Relationships on a pedestal by its mouth and the
// achievement desert.worm.slain. Never both: the worm itself allows one way a run (SandWorm). Pure, so the tests read it.

/** The practice the dismount gives (unique, the 'secret' pool). */
export const WORM_RIDE_PRACTICE = 'prescience';
/** The practice the kill lays by the worm's mouth: the tooth knife, Cut Ties with Toxic Relationships. */
export const WORM_KILL_PRACTICE = 'occamsrazor';

export type WormWay = 'ridden' | 'slain';

/** What the game does for one way: the achievement's event, a practice given at once, a practice laid on a pedestal. */
export interface WormReward {
  event: 'wormDismount' | 'wormKilled';
  give: string | null;
  pedestal: string | null;
}

/**
 * The reward of a way. `holds(id)`: the player already holds that practice (nothing is given or laid twice);
 * `laid`: the kill's pedestal was already laid this run (once per run). Each way always has its achievement's event.
 */
export function wormReward(way: WormWay, holds: (id: string) => boolean, laid: boolean): WormReward {
  if (way === 'ridden') return { event: 'wormDismount', give: holds(WORM_RIDE_PRACTICE) ? null : WORM_RIDE_PRACTICE, pedestal: null };
  return { event: 'wormKilled', give: null, pedestal: laid || holds(WORM_KILL_PRACTICE) ? null : WORM_KILL_PRACTICE };
}
