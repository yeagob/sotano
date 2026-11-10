// The Sanctuary's rules (docs/design/built/presences/MEDITATION-APP.md): the flow of its screens, its own
// clock, the reward each way out gives, every control on every input type, and calm visuals. The app runs on
// MeditationApp (DOM-free); the outcome runs on the real Game.answerGuard, on a stand-in object that holds only
// what it reads (as in alembic.test.ts); the scenes are painted on a counting stand-in for the canvas.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MeditationApp, PARTICLE_CAP, PARTICLE_CAP_SMALL, TOUCH_TILE, particleCap, sceneBudget } from '../src/game/meditation-app';
import { LENGTHS_SEC, SEQUENCES, SEQUENCE_IDS, momentAt, planSitting } from '../src/content/presences/meditations';
import { BINDING, BINDINGS, DEVICES, contextsFor, type Action, type Device } from '../src/input/bindings';
import { makeScene, paintEnding, paintHome, type SceneFrame } from '../src/render/meditation-scenes';
import { ITEMS } from '../src/content/items';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {}, audioContext: () => null };
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

const S = 1000;

/** An app in a sitting of `seconds`, begun at time 0. */
function sitting(seq = SEQUENCE_IDS[0], seconds: number = 20) {
  const app = new MeditationApp();
  app.act('meditate', 0);
  app.act(`seq:${seq}`, 0);
  app.act(`len:${seconds}`, 0);
  return app;
}

describe('the flow', () => {
  it('opens on the choice of reward, with Meditate first and the quick reward one press away', () => {
    const app = new MeditationApp();
    expect(app.screen).toBe('home');
    expect(app.tiles).toEqual(['meditate', 'quick']);
    expect(app.selected).toBe('meditate');
    expect(app.act('quick', 0)).toBe('quick');
  });

  it('goes Home, Library, Length, Session, and Back retraces it', () => {
    const app = new MeditationApp();
    expect(app.act('meditate', 0)).toBeNull();
    expect(app.screen).toBe('library');
    expect(app.tiles).toEqual(SEQUENCE_IDS.map(id => `seq:${id}`));
    app.act('seq:river', 0);
    expect(app.screen).toBe('length');
    expect(app.tiles).toEqual(['len:20', 'len:30', 'len:40']);
    expect(app.selected).toBe('len:20');
    expect(app.back(0)).toBeNull();
    expect(app.screen).toBe('library');
    expect(app.selected).toBe('seq:river');
    expect(app.back(0)).toBeNull();
    expect(app.screen).toBe('home');
    app.act('meditate', 0);
    app.act('seq:river', 0);
    app.act('len:30', 0);
    expect(app.screen).toBe('session');
    expect(app.plan!.seq.id).toBe('river');
    expect(app.plan!.totalMs).toBe(30 * S);
    expect(app.running).toBe(true);
    expect(app.selected).toBe('pause');
  });

  it('ignores a press that is not a choice of the screen', () => {
    const app = new MeditationApp();
    expect(app.act('receive', 0)).toBeNull();
    expect(app.act('len:20', 0)).toBeNull();
    expect(app.act('stay', 0)).toBeNull();
    expect(app.screen).toBe('home');
  });
});

describe("the app's own clock", () => {
  it('reaches the chosen length, whatever the frame rate, and then shows the end', () => {
    for (const seconds of LENGTHS_SEC) for (const step of [16, 1000, 7300]) {
      const app = sitting('box', seconds);
      let now = 0, done = 0;
      while (app.screen === 'session') {
        now += step;
        if (app.tick(now).done) done++;
        expect(now).toBeLessThan(seconds * S + step + 1);
      }
      expect(done).toBe(1);
      expect(now).toBeGreaterThanOrEqual(seconds * S);
      expect(app.elapsed).toBe(seconds * S);
      expect(app.screen).toBe('end');
      expect(app.selected).toBe('receive');
      expect(app.moment!.secondsLeft).toBe(0);
    }
  });

  it('does not end a second before: at 19 s of 20 the sitting still runs', () => {
    const app = sitting('ground', 20);
    app.tick(20 * S - 1000);
    expect(app.screen).toBe('session');
    expect(app.moment!.secondsLeft).toBe(1);
    expect(app.act('receive', 20 * S - 1000)).toBeNull();
  });

  it('stops while paused and on the leave sheet, and goes on from where it was', () => {
    const app = sitting();
    app.tick(2 * S);
    app.act('pause', 2 * S);
    expect(app.running).toBe(false);
    app.tick(8 * S);
    expect(app.elapsed).toBe(2 * S);
    app.act('pause', 8 * S);
    app.tick(9 * S);
    expect(app.elapsed).toBe(3 * S);
    app.act('leave', 9 * S);
    expect(app.screen).toBe('leave');
    app.tick(15 * S);
    expect(app.elapsed).toBe(3 * S);
    expect(app.act('stay', 15 * S)).toBeNull();
    expect(app.screen).toBe('session');
    app.tick(16 * S);
    expect(app.elapsed).toBe(4 * S);
  });

  it('reports each new part, line and beat once', () => {
    const app = sitting('box', 20);
    let parts = 0, beats = 0, lines = 0;
    for (let now = 0; app.screen === 'session'; now += 250) {
      const k = app.tick(now);
      if (k.part) parts++;
      if (k.beat) beats++;
      if (k.line) lines++;
    }
    expect(parts).toBe(5);
    expect(lines).toBeGreaterThanOrEqual(13);
    const plan = planSitting(SEQUENCES.find(s => s.id === 'box')!, 20);
    const boxBeats = momentAt(plan, plan.bounds[2] - 1).beat + 1;
    // The 'four' part is 5 seconds: one box breath of four beats, each beat 1.25 seconds.
    expect(boxBeats).toBe(4);
    expect(beats).toBeGreaterThan(boxBeats * 2);
  });

  it('Next part moves on without moving the timer, and cannot pass the last part', () => {
    const app = sitting('warm', 20);
    app.tick(1000);
    expect(app.moment!.part).toBe(0);
    const left = app.moment!.secondsLeft;
    for (let i = 1; i <= 4; i++) {
      app.act('skip', 1000);
      expect(app.moment!.part).toBe(i);
      expect(app.moment!.secondsLeft).toBe(left);
    }
    app.act('skip', 1000);
    expect(app.moment!.part).toBe(4);
    expect(app.screen).toBe('session');
    app.tick(19 * S);
    expect(app.screen).toBe('session');
    app.tick(20 * S);
    expect(app.screen).toBe('end');
  });
});

describe('the reward of each way out', () => {
  it('leaving early gives the quick reward, never the better one, at any moment of any sitting', () => {
    for (const seconds of LENGTHS_SEC) for (const at of [0, 1, 10 * S, seconds * S - 1]) {
      const byButton = sitting('dusk', seconds);
      byButton.tick(at);
      expect(byButton.act('leave', at)).toBeNull();
      expect(byButton.selected).toBe('stay');
      expect(byButton.act('quick', at)).toBe('quick');
      const byBack = sitting('dusk', seconds);
      byBack.tick(at);
      expect(byBack.back(at)).toBeNull();
      expect(byBack.act('receive', at)).toBeNull();
      expect(byBack.act('quick', at)).toBe('quick');
    }
  });

  it('leaving takes two presses, and Back on the leave sheet stays', () => {
    const app = sitting();
    app.tick(1000);
    expect(app.back(1000)).toBeNull();
    expect(app.screen).toBe('leave');
    expect(app.back(1000)).toBeNull();
    expect(app.screen).toBe('session');
    expect(app.outcome).toBeNull();
  });

  it('completing gives the better reward, by Receive or by any way out of the end', () => {
    const a = sitting('night', 20);
    a.tick(20 * S);
    expect(a.act('receive', 20 * S)).toBe('complete');
    const b = sitting('night', 40);
    b.tick(40 * S);
    expect(b.back(40 * S)).toBe('complete');
    const c = sitting('night', 30);
    c.tick(30 * S);
    expect(c.act('close', 30 * S)).toBe('complete');
  });

  it('a paused sitting never completes by waiting', () => {
    const app = sitting();
    app.act('pause', 0);
    app.tick(500 * S);
    expect(app.screen).toBe('session');
    expect(app.act('receive', 500 * S)).toBeNull();
  });

  it('not now, on Home, gives nothing', () => {
    expect(new MeditationApp().back(0)).toBe('cancel');
    expect(new MeditationApp().act('close', 0)).toBe('cancel');
  });

  it('is granted once only: after an outcome the app takes no more presses', () => {
    const app = sitting();
    app.tick(20 * S);
    expect(app.act('receive', 20 * S)).toBe('complete');
    expect(app.act('receive', 20 * S)).toBeNull();
    expect(app.back(20 * S)).toBeNull();
    expect(app.act('quick', 20 * S)).toBeNull();
    expect(app.press({ hit: () => true, navigate: () => ({ x: 0, y: 0 }) }, 20 * S, 1)).toBeNull();
    expect(app.outcome).toBe('complete');
    const quick = new MeditationApp();
    expect(quick.act('quick', 0)).toBe('quick');
    expect(quick.act('quick', 0)).toBeNull();
    expect(quick.act('meditate', 0)).toBeNull();
    expect(quick.screen).toBe('home');
  });
});

describe('what the Boundary gives', () => {
  const chestOf = (room: number) => ({ spec: { room }, opened: false, refused: false, view: {} });

  it('a finished meditation draws a tier 3 or 4 practice from the chest and the Boundary leaves', () => {
    const rig = stand(), chest = chestOf(4);
    (Game.prototype as any).answerGuard.call(rig, chest, 'complete');
    expect(rig.pools.drawRuntime.mock.calls[0][2]).toEqual([3, 4]);
    expect(rig.openChest).toHaveBeenCalledWith(chest, 0, ITEMS[0]);
    expect(rig.releaseBoundary).toHaveBeenCalledWith(4);
  });

  it('the quick reward draws a tier 1 or 2 practice', () => {
    const rig = stand(), chest = chestOf(2);
    (Game.prototype as any).answerGuard.call(rig, chest, 'quick');
    expect(rig.pools.drawRuntime.mock.calls[0][2]).toEqual([1, 2]);
    expect(rig.openChest).toHaveBeenCalledTimes(1);
    expect(rig.releaseBoundary).toHaveBeenCalledWith(2);
  });

  it('not now gives no reward, keeps the chest locked and lets the Boundary ask again later', () => {
    const rig = stand(), chest = chestOf(1);
    (Game.prototype as any).answerGuard.call(rig, chest, 'cancel');
    expect(chest.opened).toBe(false);
    expect(chest.refused).toBe(true);
    expect(rig.openChest).not.toHaveBeenCalled();
    expect(rig.releaseBoundary).not.toHaveBeenCalled();
    expect(rig.pools.drawRuntime).not.toHaveBeenCalled();
    expect(rig.hud.toast).toHaveBeenCalledWith('sanctuary.cancelled');
  });

  it('an opened chest ignores a second answer: one reward', () => {
    const rig = stand(), chest = chestOf(3);
    rig.openChest.mockImplementation((c: { opened: boolean }) => { c.opened = true; });
    (Game.prototype as any).answerGuard.call(rig, chest, 'quick');
    (Game.prototype as any).answerGuard.call(rig, chest, 'complete');
    (Game.prototype as any).answerGuard.call(rig, chest, 'quick');
    expect(rig.pools.drawRuntime).toHaveBeenCalledTimes(1);
    expect(rig.openChest).toHaveBeenCalledTimes(1);
    expect(rig.releaseBoundary).toHaveBeenCalledTimes(1);
  });
});

/** The physical inputs of one device, pressed one at a time, read through the real binding table. */
class Pressed {
  private down = new Set<string>();
  private nav = { x: 0, y: 0 };
  constructor(readonly device: Exclude<Device, 'touch'>) {}
  /** Presses the device's input for `action` (its first key or button), as the player would. */
  press(action: Action) {
    const b = BINDING[action];
    expect(contextsFor(b, this.device), `${action} is live in the meditation context on ${this.device}`).toContain('meditation');
    const input = this.device === 'keyboard' ? b.keyboard.keys?.[0] : b.gamepad.buttons?.[0];
    expect(input, `${action} has an input on ${this.device}`).toBeDefined();
    this.down = new Set([`${input}`]);
    this.nav = { x: 0, y: 0 };
    return this;
  }
  steer(x: number, y: number) { this.down = new Set(); this.nav = { x, y }; return this; }
  hit = (a: Action) => {
    const b = BINDING[a];
    const inputs = this.device === 'keyboard' ? b.keyboard.keys ?? [] : b.gamepad.buttons ?? [];
    return inputs.some(i => this.down.has(`${i}`));
  };
  navigate = () => this.nav;
}

describe('every control on every input type', () => {
  it('maps the six actions of the context on keyboard, gamepad and touch, with no shared input', () => {
    const live = BINDINGS.filter(b => b.when.includes('meditation')).map(b => b.action).sort();
    expect(live).toEqual(['back', 'calm', 'confirm', 'mute', 'navigate', 'skip']);
    for (const d of DEVICES) {
      const seen = new Map<string, string>();
      for (const b of BINDINGS.filter(x => contextsFor(x, d).includes('meditation'))) {
        const inputs = d === 'keyboard' ? [...(b.keyboard.keys ?? []), ...(b.keyboard.mouse ?? []).map(m => `mouse${m}`)]
          : d === 'gamepad' ? (b.gamepad.buttons ?? []).map(String) : b.touch.control === 'tap' ? [] : [`${b.touch.control}-${b.action}`];
        if (d !== 'touch') expect(inputs.length, `${b.action} on ${d}`).toBeGreaterThan(0);
        else expect(b.touch.control, b.action).toMatch(/^(tap|menuButton)$/);
        for (const i of inputs) { expect(seen.get(i), `${i} on ${d}`).toBeUndefined(); seen.set(i, b.action); }
      }
    }
  });

  for (const device of ['keyboard', 'gamepad'] as const) {
    it(`${device}: start, next, pause, mute, calm, leave and choose the reward`, () => {
      const inp = new Pressed(device), app = new MeditationApp();
      const go = (now = 0) => app.press(inp, now, 3);
      inp.press('confirm'); expect(go()).toBeNull();
      expect(app.screen).toBe('library');
      inp.steer(1, 0); go();
      expect(app.selected).toBe(`seq:${SEQUENCE_IDS[1]}`);
      inp.steer(0, 1); go();
      expect(app.selected).toBe(`seq:${SEQUENCE_IDS[4]}`);
      inp.press('confirm'); go();
      expect(app.screen).toBe('length');
      inp.steer(1, 0); go();
      expect(app.selected).toBe('len:30');
      inp.press('confirm'); go();
      expect(app.screen).toBe('session');
      expect(app.plan!.totalMs).toBe(30 * S);
      expect(app.seq).toBe(SEQUENCE_IDS[4]);
      inp.press('skip'); go(1000);
      expect(app.moment!.part).toBe(1);
      inp.press('confirm'); go(2000);
      expect(app.paused).toBe(true);
      inp.press('confirm'); go(3000);
      expect(app.paused).toBe(false);
      inp.press('mute'); go(3000);
      expect(app.prefs.mute).toBe(true);
      inp.press('calm'); go(3000);
      expect(app.prefs.calm).toBe(true);
      inp.press('back'); expect(go(4000)).toBeNull();
      expect(app.screen).toBe('leave');
      inp.press('confirm'); go(4000);
      expect(app.screen).toBe('session');
      inp.press('back'); go(5000);
      inp.steer(1, 0); go(5000);
      expect(app.selected).toBe('quick');
      inp.press('confirm');
      expect(go(5000)).toBe('quick');
    });

    it(`${device}: the quick reward and not now from the first screen, and Receive at the end`, () => {
      const inp = new Pressed(device);
      const quick = new MeditationApp();
      inp.steer(1, 0); quick.press(inp, 0, 2);
      expect(quick.selected).toBe('quick');
      inp.press('confirm');
      expect(quick.press(inp, 0, 2)).toBe('quick');
      inp.press('back');
      expect(new MeditationApp().press(inp, 0, 2)).toBe('cancel');
      const done = sitting();
      done.tick(20 * S);
      inp.press('confirm');
      expect(done.press(inp, 20 * S, 1)).toBe('complete');
    });
  }

  it('touch and the mouse: every action is a button on the screen that takes it', () => {
    const app = new MeditationApp();
    expect(app.tiles).toContain('meditate');
    expect(app.tiles).toContain('quick');
    app.act('meditate', 0);
    app.act('seq:river', 0);
    app.act('len:40', 0);
    for (const a of ['skip', 'mute', 'calm'] as const) expect(app.tiles, a).toContain(TOUCH_TILE[a]);
    expect(app.tiles).toEqual(['pause', 'skip', 'mute', 'calm', 'leave']);
    app.act('skip', 1000);
    expect(app.moment!.part).toBe(1);
    app.act('pause', 1000);
    expect(app.paused).toBe(true);
    app.act('pause', 1000);
    app.act('mute', 1000);
    app.act('calm', 1000);
    expect(app.prefs).toEqual({ mute: true, calm: true });
    app.act('leave', 1000);
    expect(app.tiles).toEqual(['stay', 'quick']);
    expect(app.act('quick', 1000)).toBe('quick');
    expect(TOUCH_TILE.back).toBe('close');
    expect(new MeditationApp().act('close', 0)).toBe('cancel');
  });

  it('the switches work on every screen and never move the flow', () => {
    const app = new MeditationApp({ mute: false, calm: false });
    for (const step of ['meditate', 'seq:ground', 'len:20']) {
      const screen = app.screen;
      expect(app.act('mute', 0)).toBeNull();
      expect(app.act('calm', 0)).toBeNull();
      expect(app.screen).toBe(screen);
      app.act(step, 0);
    }
    expect(app.prefs).toEqual({ mute: true, calm: true });
  });

  it('the selection stays inside the choices of the screen', () => {
    const app = new MeditationApp();
    app.move(-1, 0, 2);
    expect(app.selected).toBe('meditate');
    app.move(5, 5, 2);
    expect(app.selected).toBe('quick');
    app.act('meditate', 0);
    app.move(0, 1, 3);
    expect(app.selected).toBe(`seq:${SEQUENCE_IDS[3]}`);
    app.move(0, 1, 3);
    expect(app.selected).toBe(`seq:${SEQUENCE_IDS[5]}`);
  });
});

/** A stand-in for the 2D canvas that counts what is drawn. */
function canvas() {
  const calls: Record<string, number> = {};
  const gradient = { addColorStop() {} };
  const target = { calls } as Record<string, unknown>;
  return new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => { calls[k] = (calls[k] ?? 0) + 1; return gradient; };
      return (..._a: unknown[]) => { calls[k] = (calls[k] ?? 0) + 1; };
    },
    set(t, k: string, v) { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D & { calls: Record<string, number> };
}

const frame = (over: Partial<SceneFrame>): SceneFrame => ({ p: 2.5, lung: 0.5, breath: 'in', breathT: 0.5, beat: 0, t: 0, dt: 1 / 30, cap: PARTICLE_CAP, effects: true, sway: true, gather: 0, ...over });

describe('calm visuals and the particle caps', () => {
  it('caps the motes: 160, 70 on a small screen, none with calm visuals', () => {
    expect(PARTICLE_CAP).toBe(160);
    expect(PARTICLE_CAP_SMALL).toBe(70);
    expect(particleCap(1366, 768, false)).toBe(160);
    expect(particleCap(812, 375, false)).toBe(70);
    expect(particleCap(375, 812, false)).toBe(70);
    expect(particleCap(1366, 768, true)).toBe(0);
    expect(particleCap(812, 375, true)).toBe(0);
    expect(sceneBudget(1366, 768, true)).toEqual({ particles: 0, sway: false, effects: false });
    expect(sceneBudget(1366, 768, false)).toEqual({ particles: 160, sway: true, effects: true });
  });

  it('every scene stays under its cap through a whole sitting, on a big and a small screen', () => {
    for (const s of SEQUENCES) for (const [w, h] of [[1366, 768], [812, 375]] as const) {
      const scene = makeScene(s.scene), c = canvas(), cap = particleCap(w, h, false);
      let peak = 0;
      for (let i = 0; i < 3000; i++) {
        const t = i / 10;
        scene.paint(c, w, h, frame({ p: 5 * i / 3000, t, dt: 0.1, cap, beat: Math.floor(t / 5), breath: i % 100 < 50 ? 'in' : 'out', breathT: (i % 50) / 50 }));
        peak = Math.max(peak, scene.motes.length);
      }
      expect(peak, `${s.id} at ${w}x${h}`).toBeLessThanOrEqual(cap);
      expect(peak, `${s.id} has motes`).toBeGreaterThan(0);
    }
  });

  it('calm visuals removes the motes and the scene motion, and draws far less', () => {
    for (const s of SEQUENCES) {
      const full = canvas(), calm = canvas();
      const a = makeScene(s.scene), b = makeScene(s.scene);
      for (let i = 0; i < 300; i++) {
        a.paint(full, 1366, 768, frame({ p: 2.6, t: i / 30, beat: Math.floor(i / 120) }));
        b.paint(calm, 1366, 768, frame({ p: 2.6, t: i / 30, beat: Math.floor(i / 120), ...sceneBudget(1366, 768, true), cap: 0 }));
      }
      expect(a.motes.length, s.id).toBeGreaterThan(0);
      expect(b.motes.length, s.id).toBe(0);
      expect(calm.calls.translate ?? 0, `${s.id}: no sway`).toBe(0);
      expect(calm.calls.scale ?? 0, `${s.id}: no zoom`).toBe(0);
      expect(calm.calls.arc, `${s.id}: the breath shape is still drawn`).toBeGreaterThan(0);
      const drawn = (c: { calls: Record<string, number> }) => (c.calls.arc ?? 0) + (c.calls.fillRect ?? 0) + (c.calls.stroke ?? 0) + (c.calls.fill ?? 0);
      expect(drawn(calm), s.id).toBeLessThan(drawn(full) / 3);
    }
    const still = canvas(), moving = canvas();
    paintHome(still, 800, 600, 10, false);
    paintHome(moving, 800, 600, 10, true);
    expect(still.calls.arc).toBeLessThan(moving.calls.arc);
    const end = canvas();
    paintEnding(end, 800, 600, 6, 6, false);
    expect(end.calls.arc).toBeLessThanOrEqual(2);
  });

  it('calm visuals keeps the timer, the part, the instruction and the breath exactly as they are', () => {
    const calm = new MeditationApp({ mute: false, calm: true }), full = new MeditationApp({ mute: false, calm: false });
    for (const app of [calm, full]) { app.act('meditate', 0); app.act('seq:box', 0); app.act('len:20', 0); }
    for (let now = 0; now <= 20 * S; now += 333) {
      calm.tick(now); full.tick(now);
      expect(calm.moment).toEqual(full.moment);
      expect(calm.screen).toBe(full.screen);
    }
    calm.tick(20 * S); full.tick(20 * S);
    expect(calm.screen).toBe('end');
    expect(calm.act('receive', 20 * S)).toBe('complete');
  });

  it('switching calm visuals in a sitting does not touch its clock', () => {
    const app = sitting();
    app.tick(3 * S);
    app.act('calm', 3 * S);
    app.tick(4 * S);
    expect(app.elapsed).toBe(4 * S);
    expect(app.prefs.calm).toBe(true);
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
