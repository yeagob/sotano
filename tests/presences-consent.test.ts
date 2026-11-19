import { describe, expect, it } from 'vitest';
import { CHOICE_CONFIRM_GRACE_S, ChoiceGuard, boatmanCrossing, choiceOutcome, offerOutcome, type OfferState } from '../src/content/presences/consent';
import { PRESENCE_TALK, findPresenceOffer, leavesOnDecline, type PresenceId } from '../src/content/presences';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const valid: OfferState = { present: true, met: false, sameCarried: true, unlocks: true };
const ids = Object.keys(PRESENCE_TALK) as PresenceId[];

/** A model of the game's offer resolution over a hand and a met flag: what is taken, and how often the reward lands. */
function answer(id: PresenceId, accept: boolean, world: { hand: unknown[]; met: boolean; rewards: number; present: boolean }, index: number) {
  const outcome = offerOutcome(id, accept, { ...valid, present: world.present, met: world.met });
  if (outcome === 'accept') { if (index >= 0) world.hand.splice(index, 1); world.met = true; world.rewards++; }
  if (outcome === 'leave') world.present = false;
  return outcome;
}

describe('the consent path of the presence cards (consent.ts, used by resolvePresenceOffer and resolvePresenceChoice)', () => {
  it('a yes on a valid offer gives the reward once: a second yes on the same presence is stale and takes nothing', () => {
    const world = { hand: ['heart', 'stone'], met: false, rewards: 0, present: true };
    expect(answer('listener', true, world, 0)).toBe('accept');
    expect(world.rewards).toBe(1);
    expect(world.hand).toEqual(['stone']);
    expect(answer('listener', true, world, 0)).toBe('stale');
    expect(world.rewards).toBe(1);
    expect(world.hand).toEqual(['stone']);
  });

  it('a decline takes nothing and keeps everything, for every presence', () => {
    for (const id of ids) {
      const world = { hand: ['heart', 'stone'], met: false, rewards: 0, present: true };
      const outcome = answer(id, false, world, 0);
      expect(['wait', 'leave']).toContain(outcome);
      expect(world.hand).toEqual(['heart', 'stone']);
      expect(world.rewards).toBe(0);
      expect(world.met).toBe(false);
    }
  });

  it('a presence that leaves on decline leaves; the others wait in their place', () => {
    for (const id of ids) {
      const world = { hand: [], met: false, rewards: 0, present: true };
      expect(answer(id, false, world, -1)).toBe(leavesOnDecline(id) ? 'leave' : 'wait');
      expect(world.present).toBe(!leavesOnDecline(id));
    }
    expect(leavesOnDecline('trickster')).toBe(true);
    expect(leavesOnDecline('wanderer')).toBe(true);
  });

  it('a stale offer refuses without taking anything, whatever the answer', () => {
    for (const change of [{ present: false }, { met: true }, { sameCarried: false }, { unlocks: false }]) {
      for (const accept of [true, false]) expect(offerOutcome('trickster', accept, { ...valid, ...change })).toBe('stale');
    }
  });

  it('the offer names the thing it would take: the first match from the top of the hand', () => {
    const offer = findPresenceOffer('listener', [{ kind: 'flesh' } as never, { kind: 'heart' } as never]);
    expect(offer?.index).toBe(1);
  });

  it('a choice card: an option answers, Not now (-1) or out of range waits, and a gone or met presence is stale', () => {
    expect(choiceOutcome(0, 4, { present: true, met: false })).toBe('answer');
    expect(choiceOutcome(3, 4, { present: true, met: false })).toBe('answer');
    expect(choiceOutcome(-1, 4, { present: true, met: false })).toBe('wait');
    expect(choiceOutcome(4, 4, { present: true, met: false })).toBe('wait');
    expect(choiceOutcome(0, 4, { present: false, met: false })).toBe('stale');
    expect(choiceOutcome(0, 4, { present: true, met: true })).toBe('stale');
  });
});

describe('the choice card grace: a stray double confirm cannot pick the first answer', () => {
  it('a confirm right after the card opens is ignored, and accepted once the grace has passed on game time', () => {
    const g = new ChoiceGuard();
    expect(g.ready).toBe(true);
    g.open();
    expect(g.ready).toBe(false);
    g.tick(1 / 60);
    expect(g.ready).toBe(false);
    g.tick(CHOICE_CONFIRM_GRACE_S);
    expect(g.ready).toBe(true);
    g.open();
    expect(g.ready).toBe(false);
  });

  it('the grace is short: under half a second', () => {
    expect(CHOICE_CONFIRM_GRACE_S).toBeGreaterThan(0);
    expect(CHOICE_CONFIRM_GRACE_S).toBeLessThan(0.5);
  });
});

describe("the Boatman's toll is taken only when the ferry lands", () => {
  it('with an island the ferry crosses; with none there is no crossing', () => {
    expect(boatmanCrossing({ x: 1, y: 2, z: 3 })).toBe('ferry');
    expect(boatmanCrossing(null)).toBe('no-crossing');
  });

  it('with no crossing the block stays in hand and nothing is given', () => {
    const hand: unknown[] = [7];
    let rewards = 0;
    const cross = (landing: unknown) => { if (boatmanCrossing(landing) === 'ferry') { hand.splice(0, 1); rewards++; } };
    cross(null);
    expect(hand).toEqual([7]);
    expect(rewards).toBe(0);
    cross({ x: 0, y: 0, z: 0 });
    expect(hand).toEqual([]);
    expect(rewards).toBe(1);
  });

  it('the no-crossing line exists in English and Spanish', () => {
    expect(EN.messages['presence.boatman.nocross']).toBeTruthy();
    expect(ES.messages['presence.boatman.nocross']).toBeTruthy();
  });
});
