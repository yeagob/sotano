// The Boundary's mission card (docs/design/built/presences/GUARD-MISSIONS.md): the close ✕ cancels with no
// reward and the chest stays locked; a guided breath runs a countdown with the step to follow; a completed
// mission still gives its reward. The card's rules run on GuardCard (DOM-free); the outcome runs on the real
// Game.answerGuard, on a stand-in object that holds only what it reads (as in alembic.test.ts).

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GuardCard } from '../src/game/guard-card';
import { MEDITATIONS, MISSION_IDS, MISSION_WINDOW_MS, meditationAt, meditationMs, meditationOf } from '../src/content/presences/missions';
import { ITEMS } from '../src/content/items';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
});

describe('the close ✕ on the mission card', () => {
  it('cancels from every phase and every mission', () => {
    for (const id of MISSION_IDS) {
      const card = new GuardCard(id);
      expect(card.act('close', 0)).toBe('cancel');
    }
    const guided = new GuardCard('breathe');
    guided.act('begin', 0);
    expect(guided.phase).toBe('guide');
    expect(guided.act('close', 5000)).toBe('cancel');
  });

  it('a cancel gives no reward, keeps the chest locked and lets the Boundary ask again later', () => {
    const rig = stand();
    const chest = { spec: {}, opened: false, refused: false, view: {} };
    (Game.prototype as any).answerGuard.call(rig, chest, 0, 'cancel');
    expect(chest.opened).toBe(false);
    expect(chest.refused).toBe(true);
    expect(rig.openChest).not.toHaveBeenCalled();
    expect(rig.releaseBoundary).not.toHaveBeenCalled();
    expect(rig.pools.drawRuntime).not.toHaveBeenCalled();
    expect(rig.hud.toast).toHaveBeenCalledWith('mission.cancelled');
  });
});

describe('the guided breath', () => {
  const steps = MEDITATIONS.breathe;

  it('is the breath mission only, and lasts exactly the mission window (30 s)', () => {
    expect(MISSION_IDS.filter(id => meditationOf(id))).toEqual(['breathe']);
    expect(meditationMs(steps)).toBe(MISSION_WINDOW_MS);
  });

  it('Begin starts the countdown at 30 and it reaches 0, then asks the question with I did it selected', () => {
    const card = new GuardCard('breathe');
    expect(card.answers).toEqual(['begin', 'yes', 'no']);
    expect(card.first).toBe('begin');
    expect(card.act('begin', 1000)).toBeNull();
    expect(card.guide(1000)!.secondsLeft).toBe(30);
    expect(card.guide(1000 + 12500)!.secondsLeft).toBe(18);
    expect(card.tick(1000 + 29999)).toBe(false);
    expect(card.guide(1000 + 29999)!.secondsLeft).toBe(1);
    expect(card.tick(1000 + 30000)).toBe(true);
    expect(card.phase).toBe('question');
    expect(card.guide(1000 + 30000)).toBeNull();
    expect(card.answers).toEqual(['yes', 'no']);
    expect(card.first).toBe('yes');
  });

  it('no answer is taken while the countdown runs, only the close', () => {
    const card = new GuardCard('breathe');
    card.act('begin', 0);
    expect(card.answers).toEqual([]);
    expect(card.act('yes', 1000)).toBeNull();
    expect(card.act('no', 1000)).toBeNull();
    expect(card.phase).toBe('guide');
  });

  it('the instruction changes at each step, at the step\'s real time', () => {
    let start = 0;
    const seen: string[] = [];
    for (const [i, s] of steps.entries()) {
      expect(meditationAt(steps, start).index).toBe(i);
      expect(meditationAt(steps, start).step.text).toBe(s.text);
      expect(meditationAt(steps, start + s.ms - 1).index).toBe(i);
      seen.push(meditationAt(steps, start + 1).step.text);
      start += s.ms;
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(meditationAt(steps, start).done).toBe(true);
  });

  it('missions without steps have no Begin and no countdown', () => {
    const card = new GuardCard('draw');
    expect(card.answers).toEqual(['yes', 'no']);
    expect(card.act('begin', 0)).toBeNull();
    expect(card.phase).toBe('ask');
    expect(card.guide(0)).toBeNull();
  });
});

describe('a completed mission still gives its reward', () => {
  it('I did it after the window draws a tier 3 or 4 practice from the chest and the Boundary leaves', () => {
    const rig = stand();
    const chest = { spec: { room: 4 }, opened: false, refused: false, view: {} };
    vi.spyOn(performance, 'now').mockReturnValue(100000);
    try {
      (Game.prototype as any).answerGuard.call(rig, chest, 100000 - MISSION_WINDOW_MS, 'yes');
    } finally {
      vi.restoreAllMocks();
    }
    expect(rig.pools.drawRuntime.mock.calls[0][2]).toEqual([3, 4]);
    expect(rig.openChest).toHaveBeenCalledWith(chest, 0, ITEMS[0]);
    expect(rig.releaseBoundary).toHaveBeenCalledWith(4);
  });

  it('I won\'t do it still draws a tier 1 or 2 practice', () => {
    const rig = stand();
    const chest = { spec: { room: 2 }, opened: false, refused: false, view: {} };
    (Game.prototype as any).answerGuard.call(rig, chest, 0, 'no');
    expect(rig.pools.drawRuntime.mock.calls[0][2]).toEqual([1, 2]);
    expect(rig.openChest).toHaveBeenCalledTimes(1);
  });
});

function stand() {
  return {
    hud: { toast: vi.fn() },
    rng: { stream: () => ({}) },
    pools: { drawRuntime: vi.fn((_pool: string, _rng: unknown, _band: [number, number]) => ITEMS[0].id) },
    openChest: vi.fn(),
    releaseBoundary: vi.fn(),
  };
}
