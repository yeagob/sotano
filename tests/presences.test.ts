import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { LISTENER_COUNT_WEIGHTS, LISTENER_DROPS, LISTENER_KIND_WEIGHTS, PRESENCE_BY_ID, PRESENCE_KEY, PRESENCE_TALK, answerDue, leavesAfterOffer, listenerDrops, placePresences, presenceReaction, pushedOut, rewardPicked, unlocksPresence, type ListenerDrop, type PresenceId } from '../src/content/presences';
import { PART_KINDS, PARTS } from '../src/content/parts';
import { POTION_IDS } from '../src/content/potions';

const rooms = (types: string[], enemies: string[][] = []): { type: string; enemies: string[]; presence?: PresenceId; presenceDrop?: ListenerDrop }[] =>
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

  it('a run has a Listener on each Tree floor (floors 1 to 5), one per floor, each with its own drop', () => {
    const run = new RunRandom(7);
    const listeners = [1, 2, 3, 4, 5].map(k => {
      const rs = rooms(['normal', 'normal', 'start'], [[], [], []]);
      placePresences(rs, k, run.fork('floor', k, 'presence'));
      const placed = rs.filter(r => r.presence === 'listener');
      expect(placed).toHaveLength(1);
      return placed[0];
    });
    expect(listeners).toHaveLength(5);
    for (const l of listeners) expect(LISTENER_DROPS).toContain(l.presenceDrop);
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

  it('a part of any pattern works, but only its kind opens the Listener', () => {
    for (const p of PARTS.filter(q => q.kind === 'heart')) expect(unlocksPresence('listener', p)).toBe(true);
    for (const p of PARTS.filter(q => q.kind !== 'heart')) expect(unlocksPresence('listener', p)).toBe(false);
  });
});

describe('presences: the Listener drops its reward (#65)', () => {
  it('the reward is always a drop, never a heal', () => {
    expect(PRESENCE_TALK.listener.drops).toBe(true);
    expect(PRESENCE_TALK.gardener.drops).toBe(false);
  });

  it('the drop kind is taken from the floor seed: the same seed gives the same kind, and each candidate comes up', () => {
    const kinds = new Set<ListenerDrop>();
    for (let seed = 1; seed <= 200; seed++) {
      const drawn = () => {
        const rs = rooms(['normal', 'normal', 'normal'], [[], [], []]);
        placePresences(rs, 1, new RunRandom(seed).fork('floor', 1, 'presence'));
        return rs.find(r => r.presence === 'listener')!.presenceDrop!;
      };
      const kind = drawn();
      expect(LISTENER_DROPS).toContain(kind);
      expect(drawn()).toBe(kind);
      kinds.add(kind);
    }
    expect([...kinds].sort()).toEqual([...LISTENER_DROPS].sort());
  });

  it('the drop count is weighted one 50%, two 35%, three 15%, and drawn from the runtime drops stream', () => {
    const N = 50000;
    const seen = new Map<number, number>();
    const rng = new RunRandom(7).stream('drops');
    for (let i = 0; i < N; i++) {
      const n = listenerDrops('heart', rng).length;
      seen.set(n, (seen.get(n) ?? 0) + 1);
    }
    expect([...seen.keys()].sort()).toEqual([1, 2, 3]);
    for (const [count, weight] of [[1, 0.5], [2, 0.35], [3, 0.15]] as const) {
      expect(Math.abs((seen.get(count) ?? 0) / N - weight)).toBeLessThan(0.01);
    }
    for (let seed = 1; seed <= 200; seed++) {
      expect(listenerDrops('heart', new RunRandom(seed).stream('drops'))).toEqual(listenerDrops('heart', new RunRandom(seed).stream('drops')));
    }
  });

  it('the drop kind is weighted heart 40%, bomb 35%, key 25%, and each kind still comes up', () => {
    const N = 50000;
    const seen = new Map<ListenerDrop, number>();
    for (let seed = 1; seed <= N; seed++) {
      const rs = rooms(['normal', 'normal', 'normal'], [[], [], []]);
      placePresences(rs, 1, new RunRandom(seed).fork('floor', 1, 'presence'));
      const kind = rs.find(r => r.presence === 'listener')!.presenceDrop!;
      seen.set(kind, (seen.get(kind) ?? 0) + 1);
    }
    expect([...seen.keys()].sort()).toEqual([...LISTENER_DROPS].sort());
    for (const [kind, weight] of [['heart', 0.4], ['bomb', 0.35], ['key', 0.25]] as const) {
      expect(Math.abs((seen.get(kind) ?? 0) / N - weight)).toBeLessThan(0.01);
    }
  });

  it('the suggested weights are data, one entry per kind and count, each set summing to 100', () => {
    expect(LISTENER_KIND_WEIGHTS.map(([k]) => k).sort()).toEqual([...LISTENER_DROPS].sort());
    expect(LISTENER_COUNT_WEIGHTS.map(([n]) => n)).toEqual([1, 2, 3]);
    expect(LISTENER_KIND_WEIGHTS.reduce((s, [, w]) => s + w, 0)).toBe(100);
    expect(LISTENER_COUNT_WEIGHTS.reduce((s, [, w]) => s + w, 0)).toBe(100);
  });

  it('every drop is of the kind the seed chose', () => {
    for (const kind of LISTENER_DROPS) {
      const drop = listenerDrops(kind, new RunRandom(11).stream('drops'));
      expect(drop.every(k => k === kind)).toBe(true);
    }
  });

  it('a Listener is a leaver (once its reward is picked up); a Gardener stays', () => {
    expect(leavesAfterOffer('listener')).toBe(true);
    expect(leavesAfterOffer('gardener')).toBe(false);
  });

  it('the Listener stays while any pickup of its reward lies on the floor, and leaves once every one is taken (#77)', () => {
    const reward = [{ taken: false }, { taken: false }, { taken: false }];
    expect(rewardPicked(reward)).toBe(false);
    reward[0].taken = true;
    reward[2].taken = true;
    expect(rewardPicked(reward)).toBe(false);
    reward[1].taken = true;
    expect(rewardPicked(reward)).toBe(true);
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
