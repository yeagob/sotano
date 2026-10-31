import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { PRESENCE_BY_ID, PRESENCE_KEY, PRESENCE_TALK, answerDue, placePresences, presenceReaction, pushedOut, rewardFor, unlocksPresence, type PresenceId } from '../src/content/presences';
import { PART_KINDS, PARTS } from '../src/content/parts';
import { POTION_IDS } from '../src/content/potions';

const rooms = (types: string[], enemies: string[][] = []): { type: string; enemies: string[]; presence?: PresenceId }[] =>
  types.map((type, i) => ({ type, enemies: enemies[i] ?? [] }));

describe('presences: where they live', () => {
  it('the tutorial floor has no presences, and no presence ever lives in a start room', () => {
    const rs = rooms(['normal', 'start', 'normal']);
    placePresences(rs, 0, new RunRandom(1).fork('floor', 0, 'presence'));
    expect(rs.some(r => r.presence)).toBe(false);
    for (let seed = 1; seed <= 10; seed++) {
      const ts = rooms(['normal', 'start', 'normal']);
      placePresences(ts, 2, new RunRandom(seed).fork('floor', 2, 'presence'));
      expect(ts[1].presence).toBeUndefined();
    }
  });

  it('every Tree floor has exactly one Listener, in a normal room with no projections', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rs = rooms(['normal', 'normal', 'start', 'treasure'], [['doubt'], [], [], []]);
      placePresences(rs, 2, new RunRandom(seed).fork('floor', 2, 'presence'));
      const placed = rs.filter(r => r.presence);
      expect(placed).toHaveLength(1);
      expect(placed[0].presence).toBe('listener');
      expect(placed[0].type).toBe('normal');
      expect(placed[0].enemies).toEqual([]);
    }
  });

  it('when no normal room is quiet, one is emptied so the Listener still has a home', () => {
    const rs = rooms(['normal', 'normal'], [['doubt'], ['critic']]);
    placePresences(rs, 3, new RunRandom(5).fork('floor', 3, 'presence'));
    const listener = rs.find(r => r.presence === 'listener');
    expect(listener).toBeDefined();
    expect(listener!.enemies).toEqual([]);
  });

  it('floors that are not Tree floors get no Presence', () => {
    const rs = rooms(['normal', 'start'], [[], []]);
    placePresences(rs, 7, new RunRandom(2).fork('floor', 7, 'presence'));
    expect(rs.some(r => r.presence)).toBe(false);
  });
});

describe('presences: what they are', () => {
  it('a Presence never takes damage, only answers positive intentions, and is never in a roster', () => {
    for (const id of ['gardener', 'listener'] as const) {
      const def = PRESENCE_BY_ID.get(id)!;
      expect(def.kind).toBe('creature');
      expect(def.responds).toBe('positive');
      expect(def.minFloor).toBe(99);
      expect(def.hp).toBe(1);
      expect(PRESENCE_TALK[id].lines.length).toBeGreaterThan(0);
    }
  });
});

describe('presences: the part each one takes', () => {
  it('each Presence has a hint line for a player who brings the wrong thing', () => {
    expect(PRESENCE_TALK.gardener.hint).toBe('presence.gardener.hint');
    expect(PRESENCE_TALK.listener.hint).toBe('presence.listener.hint');
  });

  it('each Presence takes one kind of monster part, and no other thing', () => {
    expect(PRESENCE_KEY).toEqual({ gardener: 'flesh', listener: 'heart' });
    for (const id of ['gardener', 'listener'] as const) {
      for (const kind of PART_KINDS) {
        const part = PARTS.find(p => p.kind === kind)!;
        expect(unlocksPresence(id, part), `${id} and ${kind}`).toBe(kind === PRESENCE_KEY[id]);
      }
      expect(unlocksPresence(id, 3)).toBe(false);
      expect(unlocksPresence(id, undefined)).toBe(false);
    }
  });
});

describe('presences: every offer the Listener has', () => {
  // The Listener's offer paths (Game.updatePresences): a heart on top of the hand is accepted once; anything
  // else on top, or an empty hand, is refused with a line; a heart left under another item is not on top.
  const heart = PARTS.find(p => p.kind === 'heart')!;
  const flask = { potion: POTION_IDS[0] };
  const paths: [string, Parameters<typeof unlocksPresence>[1], boolean][] = [
    ['an empty hand', undefined, false],
    ['a block', 3, false],
    ['a flask', flask, false],
    ['a flesh part', PARTS.find(p => p.kind === 'flesh')!, false],
    ['a mind part', PARTS.find(p => p.kind === 'mind')!, false],
    ['an essence part', PARTS.find(p => p.kind === 'essence')!, false],
    ['a heart of a released pattern', heart, true],
  ];
  it.each(paths)('%s on top of the hand: accepted only when it is the heart', (_name, carried, accepted) => {
    expect(unlocksPresence('listener', carried)).toBe(accepted);
  });

  it('the reward lands when hurt (a quarter heart) and waits as a heart on the floor when whole', () => {
    expect(rewardFor(10, 24)).toBe('heal');
    expect(rewardFor(23, 24)).toBe('heal');
    expect(rewardFor(24, 24)).toBe('heart');
    expect(rewardFor(26, 24)).toBe('heart');
  });

  it('a part of any pattern works, but only its kind opens the Listener', () => {
    for (const p of PARTS.filter(q => q.kind === 'heart')) expect(unlocksPresence('listener', p)).toBe(true);
    for (const p of PARTS.filter(q => q.kind !== 'heart')) expect(unlocksPresence('listener', p)).toBe(false);
  });
});

describe('presences: they have a body the player cannot walk through', () => {
  it('a player inside the reach is moved out to the edge, along the line from the presence', () => {
    const at = pushedOut(0.2, 0, 0, 0, 0.5)!;
    expect(at.x).toBeCloseTo(0.5);
    expect(at.z).toBeCloseTo(0);
    const diag = pushedOut(0.1, 0.1, 0, 0, 1)!;
    expect(Math.hypot(diag.x, diag.z)).toBeCloseTo(1);
    expect(diag.x).toBeCloseTo(diag.z);
  });

  it('an answer is due at first, and again only after the cooldown', () => {
    expect(answerDue(undefined, 100)).toBe(true);
    expect(answerDue(1000, 1000 + 3999)).toBe(false);
    expect(answerDue(1000, 1000 + 4000)).toBe(true);
  });

  it('a player outside the reach is left alone, and one standing on the centre is not guessed at', () => {
    expect(pushedOut(2, 0, 0, 0, 0.5)).toBeNull();
    expect(pushedOut(0, 0, 0, 0, 0.5)).toBeNull();
  });
});

describe('presences: silence (BESTIARY §8.1)', () => {
  it('a negative intention within two blocks silences them; a positive one lifts silence within eight', () => {
    expect(presenceReaction('negative', 1.5)).toBe('silence');
    expect(presenceReaction('negative', 2.5)).toBe(null);
    expect(presenceReaction('positive', 7)).toBe('lift');
    expect(presenceReaction('positive', 9)).toBe(null);
  });

  it('every silence line exists in both languages', () => {
    expect(PRESENCE_TALK.gardener.silent).toBe('presence.gardener.silent');
    expect(PRESENCE_TALK.listener.silent).toBe('presence.listener.silent');
  });
});
