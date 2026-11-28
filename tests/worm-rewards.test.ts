import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { WORM_KILL_PRACTICE, WORM_RIDE_PRACTICE, wormReward } from '../src/game/worm-rewards';

const none = () => false;

describe('what the deep desert\'s worm gives, by the way it was met (#354, owner)', () => {
  it('ridden: Prescience at once and the rider\'s event; never the knife', () => {
    expect(wormReward('ridden', none, false)).toEqual({ event: 'wormDismount', give: WORM_RIDE_PRACTICE, pedestal: null });
    expect(WORM_RIDE_PRACTICE).toBe('prescience');
  });

  it('slain: Cut Ties with Toxic Relationships on a pedestal and the kill\'s event; never Prescience', () => {
    const r = wormReward('slain', none, false);
    expect(r).toEqual({ event: 'wormKilled', give: null, pedestal: WORM_KILL_PRACTICE });
    expect(r.give).not.toBe(WORM_RIDE_PRACTICE);
    expect(r.pedestal).not.toBe(WORM_RIDE_PRACTICE);
    expect(ITEM_BY_ID.get(WORM_KILL_PRACTICE)?.name).toBe('Cut Ties with Toxic Relationships');
  });

  it('the knife is laid once per run, and not for a player who already holds it; the kill\'s event comes anyway', () => {
    expect(wormReward('slain', none, true).pedestal).toBeNull();
    expect(wormReward('slain', id => id === WORM_KILL_PRACTICE, false).pedestal).toBeNull();
    expect(wormReward('slain', none, true).event).toBe('wormKilled');
    expect(wormReward('ridden', id => id === WORM_RIDE_PRACTICE, false)).toEqual({ event: 'wormDismount', give: null, pedestal: null });
  });

  it('the knife keeps its effect: only its icon is the worm\'s tooth', () => {
    const knife = ITEM_BY_ID.get(WORM_KILL_PRACTICE)!;
    expect(knife.weapon).toEqual({ id: 'blade', priority: 10 });
    expect(knife.pools).toEqual({ boss: 1 });
    expect(knife.icon.rows).toHaveLength(12);
  });
});
