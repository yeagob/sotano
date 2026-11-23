// The Roots' call (issue #295, docs/design/built/levels/roots/CALL.md): from mastery level 50 what the Roots lay flies
// to the player at run start and is absorbed by the touch rules; the Sanctuary's practice never answers. The Game needs
// WebGL, so its wiring is checked in the browser; the table step, the movement and the rules it calls are checked here.

import { describe, expect, it } from 'vitest';
import { gainsAt, ROOTS_CALL_AT, rootsRewards } from '../src/content/tables/roots-mastery';
import { CALL_WAIT, callActive, chestAnswersCall, RootsCall, type CallHost, type CallPickup } from '../src/game/roots-call';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { buildRun } from './helpers';

const DT = 1 / 60;

function pickup(type: string, x: number, z: number, y = 10): CallPickup {
  return { type, x, y, z, vx: 0, vy: 0, vz: 0, flying: false, taken: false, delay: 0 };
}

/** A host whose player stands at the origin of floor 0; `fits` says what can be absorbed now. */
function host(fits: (p: CallPickup) => boolean = () => true, over: Partial<CallHost> = {}) {
  const absorbed: CallPickup[] = [];
  const h: CallHost & { absorbed: CallPickup[] } = {
    player: { x: 0, y: 10, z: 0 }, inRoots: true, calm: true,
    canAbsorb: fits,
    absorb: p => { if (!fits(p)) return false; p.taken = true; absorbed.push(p); return true; },
    absorbed, ...over,
  };
  return h;
}

function run(call: RootsCall, h: CallHost, seconds: number) {
  for (let t = 0; t < seconds; t += DT) call.update(DT, h);
}

describe('the step of level 50 (REWARDS §2, §7)', () => {
  it('the table calls from level 50, never below', () => {
    expect(ROOTS_CALL_AT).toBe(50);
    expect(rootsRewards(49).rootsCall).toBe(false);
    expect(rootsRewards(50).rootsCall).toBe(true);
    expect(rootsRewards(100).rootsCall).toBe(true);
    for (let L = 0; L <= 100; L++) expect(rootsRewards(L).rootsCall, `level ${L}`).toBe(L >= 50);
  });

  it('level 50 names the call before the crate line; no other level names it', () => {
    expect(gainsAt(50).map(g => g.key)).toEqual(['mastery.gain.call', 'mastery.gain.crates']);
    for (let L = 1; L <= 100; L++) if (L !== 50) expect(gainsAt(L).map(g => g.key), `level ${L}`).not.toContain('mastery.gain.call');
  });

  it('the gain line and the run-start toast read the same in both languages', () => {
    expect(EN.messages['mastery.gain.call']).toBe('The Roots call: at every waking, what they lay comes to you. The meditation still waits for you.');
    expect(ES.messages['mastery.gain.call']).toBe('Las raíces te llaman: cada vez que despiertas, lo que guardan viene a ti. La meditación sigue esperándote.');
    expect(EN.messages['roots.call']).toBe('The Roots call: what they hold comes to you.');
    expect(ES.messages['roots.call']).toBe('Las raíces te llaman: lo que guardan viene a ti.');
  });

  it('the call is active from level 50 only, and never in the sandbox or the lab', () => {
    expect(callActive(49, false)).toBe(false);
    expect(callActive(50, false)).toBe(true);
    expect(callActive(100, true)).toBe(false);
  });
});

describe('the call draws what the Roots laid', () => {
  it('waits for the run to be revealed, then brings keys, bombs, hearts and practices to the player and absorbs them', () => {
    const laid = [pickup('key', 20, 5), pickup('bomb', -15, 30), pickup('heart', 40, -8), pickup('item', 8, 8)];
    const call = new RootsCall(laid);
    const h = host();
    run(call, h, CALL_WAIT * 0.9);
    expect(h.absorbed).toHaveLength(0);
    expect(laid.every(p => !p.homing)).toBe(true);
    run(call, h, 12);
    expect(h.absorbed).toHaveLength(4);
    expect(call.pending).toBe(0);
  });

  it('flies through the rock: an object a floor away still arrives', () => {
    const far = pickup('key', 60, 60, 3);
    const call = new RootsCall([far]);
    const h = host();
    run(call, h, 10);
    expect(far.taken).toBe(true);
  });

  it('parts and flasks are never called: they are the player\'s own, not the Roots\'', () => {
    const part = pickup('part', 3, 3), flask = pickup('flask', 4, 4);
    const call = new RootsCall([part, flask]);
    run(call, host(), 8);
    expect(part.taken || flask.taken).toBe(false);
    expect(call.pending).toBe(0);
  });

  it('a practice sets off only when no banner is open, one at a time', () => {
    const a = pickup('item', 5, 0), b = pickup('item', 6, 0);
    const call = new RootsCall([a, b]);
    const h = host(() => true, { calm: false });
    run(call, h, 6);
    expect(h.absorbed).toHaveLength(0);
    h.absorbed.length = 0;
    const calm = host(() => true);
    // one arrives, then the banner opens: the second waits
    let banner = false;
    const gated: CallHost = { ...calm, get calm() { return !banner; }, absorb: p => { banner = true; return calm.absorb(p); } };
    run(call, gated, 6);
    expect(calm.absorbed).toHaveLength(1);
    banner = false;
    run(call, gated, 6);
    expect(calm.absorbed).toHaveLength(2);
  });

  it('sends nothing new while the player is outside the Roots', () => {
    const k = pickup('key', 5, 5);
    const call = new RootsCall([k]);
    run(call, host(() => true, { inRoots: false }), 6);
    expect(k.taken).toBe(false);
    expect(k.homing).toBeFalsy();
  });

  it('a free chest\'s contents, added after it opens, are called too', () => {
    const call = new RootsCall([]);
    const h = host();
    run(call, h, CALL_WAIT + DT);
    const spat = pickup('item', 4, -4);
    call.add(spat);
    run(call, h, 6);
    expect(spat.taken).toBe(true);
  });
});

describe('what cannot be absorbed stays where it lies', () => {
  it('a heart refused now does not move; it comes when it can be taken', () => {
    const heart = pickup('heart', 12, 3);
    let full = true;
    const call = new RootsCall([heart]);
    const h = host(() => !full);
    run(call, h, 6);
    expect(heart.taken).toBe(false);
    expect([heart.x, heart.y, heart.z]).toEqual([12, 10, 3]);
    expect(heart.homing).toBeFalsy();
    full = false;
    run(call, h, 6);
    expect(heart.taken).toBe(true);
  });

  it('one refused on arrival is left at the player\'s feet, never removed', () => {
    const heart = pickup('heart', 10, 0);
    let arrived = false;
    const call = new RootsCall([heart]);
    const h = host(() => true, { absorb: () => { arrived = true; return false; } });
    run(call, h, 6);
    expect(arrived).toBe(true);
    expect(heart.taken).toBe(false);
    expect(heart.homing).toBe(false);
    expect(Math.hypot(heart.x, heart.z)).toBeLessThan(0.5);
    expect(call.pending).toBe(0);
  });
});

describe('the meditation practice is never called', () => {
  it('a Sanctuary chest and a guarded chest never answer; a free chest of the Roots does', () => {
    expect(chestAnswersCall({ keys: 0, meditation: true })).toBe(false);
    expect(chestAnswersCall({ keys: 0, meditation: true, draws: { min: 1, max: 3 } })).toBe(false);
    expect(chestAnswersCall({ keys: 0, guard: true })).toBe(false);
    expect(chestAnswersCall({ keys: 0, draws: { min: 1, max: 3 } })).toBe(true);
    expect(chestAnswersCall({ keys: 2 })).toBe(false);
  });

  it('on floor 0 at level 100 every Sanctuary is a shut chest, never a loose practice, and no Sanctuary answers', () => {
    for (const seed of [1, 7, 42]) {
      const f = buildRun(seed, 1, undefined, { mastery: 100 }).floors[0];
      const sanctuaries = f.chests.filter(c => c.meditation);
      expect(sanctuaries.length, `seed ${seed}`).toBe(2);
      for (const c of sanctuaries) {
        expect(chestAnswersCall(c)).toBe(false);
        // its pedestal (if any) is shut in the chest: the game never places it as a pickup
        const ped = f.pedestals.find(p => p.room === c.room && p.x === c.x && p.z === c.z);
        if (ped) expect(ped.chest).toBe(true);
      }
      // the free chests answer
      expect(f.chests.filter(chestAnswersCall).length, `seed ${seed}`).toBe(rootsRewards(100).freeChests);
    }
  });
});
