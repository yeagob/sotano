// Issue #160 (docs/design/built/presences/MEDITATION-APP.md §2, §3, §5): repeated sittings, adding time, leaving
// early and at completion, one reward per visit, and the same visit kept through pause and reload.

import { describe, expect, it } from 'vitest';
import { MeditationApp } from '../src/game/meditation-app';
import { EXTEND_STEPS_SEC, MAX_LENGTH_SEC, MAX_SITTING_SEC, MIN_LENGTH_SEC, SEQUENCE, SEQUENCE_IDS, extendPlan, extensionSec, momentAt, planSitting, type SequenceId } from '../src/content/presences/meditations';
import { BINDING } from '../src/input/bindings';

const S = 1000;

/** A roll that gives `seconds` as the length of the next sitting. */
const rollFor = (seconds: number) => (seconds - MIN_LENGTH_SEC + 0.5) / (MAX_LENGTH_SEC - MIN_LENGTH_SEC + 1);

/** An app in a sitting of `seq` and `seconds`, begun at time 0. */
function sitting(seq: SequenceId = 'night', seconds = 20) {
  const app = new MeditationApp(undefined, () => rollFor(seconds));
  app.act('meditate', 0);
  app.act(`seq:${seq}`, 0);
  return app;
}

/** Runs the app's clock to `ms` in steps, as frames would. */
function runTo(app: MeditationApp, ms: number, from = 0) {
  for (let t = from; t <= ms; t += 100) app.tick(t);
  app.tick(ms);
}

describe('the time meditated in a visit', () => {
  it('counts every finished sitting at its full length, added time included, and never a sitting left early', () => {
    const app = sitting('night', 20);
    app.act('extend', 0); // 20 s -> 50 s
    runTo(app, 50 * S);
    expect(app.screen).toBe('end');
    expect(app.meditatedMs).toBe(50 * S);
    app.act('repeat', 50 * S);
    runTo(app, 60 * S, 50 * S); // the second sitting is 20 s: only 10 s of it run
    expect(app.meditatedMs).toBe(50 * S);
    app.back(60 * S);
    expect(app.act('quick', 60 * S)).toBe('complete'); // the reward of the first sitting is kept
  });
});

describe('adding time', () => {
  it('lengthens the sitting by the first step and keeps the clock where it was', () => {
    const app = sitting('night', 20);
    runTo(app, 5 * S);
    expect(app.act('extend', 5 * S)).toBeNull();
    expect(app.plan!.totalMs).toBe((20 + EXTEND_STEPS_SEC[0]) * S);
    expect(app.seconds).toBe(20 + EXTEND_STEPS_SEC[0]);
    expect(app.extensions).toBe(1);
    expect(app.elapsed).toBeCloseTo(5 * S, -1);
    expect(app.screen).toBe('session');
  });

  it('keeps the part in course and shares the added time among the parts that follow', () => {
    const plan = planSitting(SEQUENCE.night, 20, () => 0);
    const at = 3 * S; // inside the first part (the arrival, 10%)
    const longer = extendPlan(plan, at, 20 * S);
    expect(longer.totalMs).toBe(40 * S);
    expect(longer.bounds[1]).toBe(plan.bounds[1]);
    expect(longer.bounds.at(-1)).toBe(40 * S);
    expect(longer.bounds.length).toBe(plan.bounds.length);
    for (let i = 1; i < longer.bounds.length; i++) expect(longer.bounds[i]).toBeGreaterThan(longer.bounds[i - 1]);
  });

  it('adds to the last part when the sitting is in its last part', () => {
    const plan = planSitting(SEQUENCE.night, 20, () => 0);
    const last = extendPlan(plan, plan.totalMs - 1 * S, 20 * S);
    expect(last.bounds.slice(0, -2)).toEqual(plan.bounds.slice(0, -2));
    expect(last.bounds.at(-1)).toBe(40 * S);
  });

  it('adds 30 seconds, then 1 minute, 5 minutes and 10 minutes, and then 10 minutes at a time', () => {
    const app = sitting('box', 20);
    const steps: number[] = [];
    for (let i = 0; i < 6; i++) { steps.push(app.nextExtendSec); app.act('extend', 0); }
    expect(steps).toEqual([30, 60, 300, 600, 600, 600]);
    expect(app.seconds).toBe(20 + 30 + 60 + 300 + 600 + 600 + 600);
  });

  it('stops at one hour: the last press is cut short so the sitting ends on the hour, and the label says so', () => {
    const app = sitting('box', 20);
    let presses = 0;
    while (app.canExtend) { app.act('extend', 0); presses++; }
    expect(presses).toBe(9);
    expect(app.seconds).toBe(MAX_SITTING_SEC);
    expect(app.plan!.totalMs).toBe(MAX_SITTING_SEC * S);
    expect(app.nextExtendSec).toBe(0);
    const before = app.seconds;
    app.act('extend', 0);
    expect(app.seconds).toBe(before);
  });

  it('extensionSec gives the next step, cut to the hour', () => {
    expect(extensionSec(0, 20)).toBe(30);
    expect(extensionSec(3, 1000)).toBe(600);
    expect(extensionSec(9, 3410)).toBe(190);
    expect(extensionSec(0, MAX_SITTING_SEC)).toBe(0);
  });

  it('a sitting finishes at its new length, and the reward is the same band', () => {
    const app = sitting('warm', 20);
    app.act('extend', 0); // 20 s + 30 s
    runTo(app, 30 * S);
    expect(app.screen).toBe('session');
    runTo(app, 50 * S, 30 * S);
    expect(app.screen).toBe('end');
    expect(app.act('receive', 50 * S)).toBe('complete');
  });

  it('a new sitting starts with no additions', () => {
    const app = sitting('dusk', 20);
    app.act('extend', 0);
    app.act('extend', 0); // 20 s + 30 s + 60 s
    runTo(app, 110 * S);
    expect(app.screen).toBe('end');
    app.act('repeat', 110 * S);
    expect(app.extensions).toBe(0);
    expect(app.seconds).toBe(20);
    expect(app.plan!.totalMs).toBe(20 * S);
  });
});

describe('the reward of a visit', () => {
  it('a sitting finished earns the better reward and it is kept whatever comes next', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    expect(app.screen).toBe('end');
    expect(app.earned).toBe('night');
    expect(app.rewardSeq).toBe('night');
    expect(app.outcome).toBeNull();
    expect(app.act('receive', 20 * S)).toBe('complete');
  });

  it('after a finished sitting, leaving early still gives the earned reward, never the quick one', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    app.act('repeat', 20 * S);
    runTo(app, 22 * S, 20 * S);
    app.act('leave', 22 * S);
    expect(app.act('quick', 22 * S)).toBe('complete');
  });

  it('an unfinished sitting alone gives the quick reward when left', () => {
    const app = sitting('river', 20);
    runTo(app, 5 * S);
    app.act('leave', 5 * S);
    expect(app.act('quick', 5 * S)).toBe('quick');
  });

  it('not now, after a finished sitting, still gives the earned reward', () => {
    const app = sitting('ground', 20);
    runTo(app, 20 * S);
    app.act('another', 20 * S);
    expect(app.back(20 * S)).toBeNull();
    expect(app.screen).toBe('home');
    expect(app.back(20 * S)).toBe('complete');
  });

  it('the reward is for the meditation finished first, however many follow', () => {
    const app = sitting('box', 20);
    runTo(app, 20 * S);
    app.act('another', 20 * S);
    app.act('seq:warm', 20 * S);
    runTo(app, 40 * S, 20 * S);
    expect(app.seq).toBe('warm');
    expect(app.rewardSeq).toBe('box');
  });

  it('a second finished sitting does not change the earned meditation or give a second reward', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    app.act('repeat', 20 * S);
    runTo(app, 40 * S, 20 * S);
    expect(app.rewardSeq).toBe('night');
    expect(app.act('receive', 40 * S)).toBe('complete');
    expect(app.act('receive', 40 * S)).toBeNull();
  });
});

describe('repeat and another practice', () => {
  it('Sit again starts a new sitting of the same meditation, with a fresh clock', () => {
    const app = sitting('dusk', 20);
    runTo(app, 20 * S);
    app.act('repeat', 20 * S);
    expect(app.screen).toBe('session');
    expect(app.seq).toBe('dusk');
    expect(app.elapsed).toBe(0);
    expect(app.paused).toBe(false);
    expect(app.moment!.part).toBe(0);
  });

  it('Choose another meditation goes to the library, on the same visit', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    app.act('another', 20 * S);
    expect(app.screen).toBe('library');
    expect(app.selected).toBe('seq:night');
    app.act('seq:ground', 20 * S);
    expect(app.screen).toBe('session');
    expect(app.seq).toBe('ground');
    expect(app.earned).toBe('night');
  });

  it('the end offers receive, repeat and another, with receive selected first', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    expect(app.tiles).toEqual(['receive', 'repeat', 'another']);
    expect(app.selected).toBe('receive');
  });

  it('a repeat keeps the random length of the new sitting within 20 to 40 seconds', () => {
    let roll = 0;
    const app = new MeditationApp(undefined, () => roll);
    app.act('meditate', 0);
    app.act('seq:ground', 0);
    roll = 0.999;
    runTo(app, 40 * S);
    app.act('repeat', 40 * S);
    expect(app.seconds).toBeGreaterThanOrEqual(MIN_LENGTH_SEC);
    expect(app.seconds).toBeLessThanOrEqual(MAX_LENGTH_SEC);
  });
});

describe('leaving', () => {
  it('leaving at any time keeps the earned reward and never grants an unearned completion', () => {
    const app = sitting('night', 20);
    runTo(app, 10 * S);
    app.act('leave', 10 * S);
    expect(app.act('quick', 10 * S)).toBe('quick');
    expect(app.rewardSeq).toBe('night');
  });

  it('leaving on Home after a not-now finished sitting never grants cancel', () => {
    const app = sitting('night', 20);
    runTo(app, 20 * S);
    app.act('another', 20 * S);
    expect(app.back(20 * S)).toBeNull();
    expect(app.back(20 * S)).toBe('complete');
  });
});

describe('pause and reload', () => {
  it('a paused sitting does not move, and resuming continues from the same moment', () => {
    const app = sitting('warm', 30);
    runTo(app, 8 * S);
    app.act('pause', 8 * S);
    const at = app.elapsed;
    runTo(app, 60 * S, 8 * S);
    expect(app.elapsed).toBe(at);
    app.act('pause', 60 * S);
    runTo(app, 60 * S + 2 * S, 60 * S);
    expect(app.elapsed).toBeCloseTo(at + 2 * S, -2);
  });

  it('a paused sitting keeps its added time', () => {
    const app = sitting('warm', 20);
    app.act('pause', 0);
    app.act('extend', 0);
    expect(app.plan!.totalMs).toBe((20 + EXTEND_STEPS_SEC[0]) * S);
    app.act('pause', 0);
    expect(app.paused).toBe(false);
  });

  it('a reload begins a new visit: nothing of the old one is kept, and no reward is given again', () => {
    const before = sitting('night', 20);
    runTo(before, 20 * S);
    expect(before.earned).toBe('night');
    const after = new MeditationApp();
    expect(after.screen).toBe('home');
    expect(after.earned).toBeNull();
    expect(after.act('quick', 0)).toBe('quick');
  });

  it('the moment of a sitting depends only on its elapsed time, so a reload at the same time shows the same part', () => {
    const a = sitting('river', 25), b = sitting('river', 25);
    runTo(a, 13 * S);
    b.elapsed = a.elapsed;
    expect(momentAt(b.plan!, b.elapsed)).toEqual(momentAt(a.plan!, a.elapsed));
  });
});

describe('the controls of the visit', () => {
  it('the add-time choice reaches every device: a tile on the bar, a press on the keyboard or gamepad', () => {
    const app = sitting('night', 20);
    app.selected = 'pause';
    app.move(1, 0, 1); // skip
    app.move(1, 0, 1); // extend
    expect(app.selected).toBe('extend');
    expect(app.press({ hit: a => a === 'confirm', navigate: () => ({ x: 0, y: 0 }) }, 0, 1)).toBeNull();
    expect(app.extensions).toBe(1);
  });

  it('the voice switch is a binding on every device, and flips the preference', () => {
    expect(BINDING.voice.keyboard.keys).toEqual(['KeyV']);
    expect(BINDING.voice.gamepad.buttons).toEqual([4]);
    const app = new MeditationApp({ mute: false, calm: false, voice: false });
    app.press({ hit: a => a === 'voice', navigate: () => ({ x: 0, y: 0 }) }, 0, 1);
    expect(app.prefs.voice).toBe(true);
  });

  it('every sitting is one of the six meditations, unchanged by the visit', () => {
    expect(SEQUENCE_IDS).toHaveLength(6);
  });
});
