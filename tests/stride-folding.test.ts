import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { MAT } from '../src/content/materials';
import { PARTS, type PartKind } from '../src/content/parts';
import { POTIONS } from '../src/content/potions';
import { RECIPES, brewOf } from '../src/content/recipes';
import { BASE_STATS, StatSheet, type Stats } from '../src/core/stats';
import { Player } from '../src/entities/player';
import { CROUCH_H, CROUCH_SPEED, RUN_SPEED, STAND_H } from '../src/entities/stance';
import { PotionEffects } from '../src/game/potion-effects';
import { BINDING, PAD } from '../src/input/bindings';
import type { Input } from '../src/input/input';
import { EN } from '../src/i18n/locales/en';
import { LOCALES } from '../src/i18n/locales';

type Solid = (x: number, y: number, z: number) => boolean;
type Move = { x: number; y: number };

const part = (source: string, kind: PartKind) => PARTS.find(p => p.source === source && p.kind === kind)!;
const floor: Solid = (_x, y) => y < 0;
const hooks = { jump: (v: number) => v, land: () => {}, bump: (s: number) => s };

function fakeInput(held: string[], move: Move): Input {
  return {
    lookDX: 0, lookDY: 0, sensitivity: 0.0022, dashDir: null,
    hit: () => false,
    held: (a: string) => held.includes(a),
    move,
  } as unknown as Input;
}

function frames(p: Player, s: Stats, input: Input, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) p.update(1 / 60, input, s, floor, hooks);
}

function walked(s: Stats, held: string[]) {
  const p = new Player();
  p.spawnAt(0.5, 0, 0.5);
  frames(p, s, fakeInput(held, { x: 0, y: 0 }), 0.5);
  frames(p, s, fakeInput(held, { x: 1, y: 0 }), 0.5);
  const x0 = p.body.x;
  frames(p, s, fakeInput(held, { x: 1, y: 0 }), 0.5);
  return { distance: p.body.x - x0, height: p.body.h };
}

function drunk(potion: 'stride-tonic' | 'folding-tincture') {
  const sheet = new StatSheet();
  const fx = new PotionEffects(sheet);
  fx.drink({ potion });
  return { sheet, fx };
}

describe('run and crouch: the practices and their easy potions', () => {
  it('the practices Fartlek and Child\'s Pose are in the item list with their stats', () => {
    const fartlek = ITEMS.find(i => i.id === 'fartlek');
    const balasana = ITEMS.find(i => i.id === 'balasana');
    expect(fartlek?.stats).toEqual([{ stat: 'run', layer: 'add', value: 1 }]);
    expect(balasana?.stats).toEqual([{ stat: 'crouch', layer: 'add', value: 1 }]);
  });

  it('a single body mind brews a Stride Tonic, and with dirt a Folding Tincture', () => {
    expect(brewOf([part('impulse', 'mind')])).toBe('stride-tonic');
    expect(brewOf([part('craving', 'mind')])).toBe('stride-tonic');
    expect(brewOf([part('impulse', 'mind'), MAT.dirt])).toBe('folding-tincture');
    expect(brewOf([MAT.dirt, part('craving', 'mind')])).toBe('folding-tincture');
    expect(brewOf([MAT.dirt])).toBe('plain-tonic');
    expect(brewOf([MAT.dirt, MAT.stone])).toBe('plain-tonic');
  });

  it('both recipes are easy: one or two inputs, no flesh, no heart, no essence', () => {
    for (const id of ['stride-tonic', 'folding-tincture'] as const) {
      const r = RECIPES.find(x => x.potion === id)!;
      expect(r.slots.length, id).toBeLessThanOrEqual(2);
      for (const s of r.slots) if ('part' in s) expect(s.part, id).toBe('mind');
      expect(POTIONS[id].duration, id).toEqual({ kind: 'rooms', rooms: 3 });
    }
  });

  it('the run and crouch controls are bound on keyboard, gamepad and touch in play', () => {
    expect(BINDING.run.keyboard.keys).toEqual(['ShiftLeft', 'ShiftRight']);
    expect(BINDING.run.gamepad.buttons).toEqual([PAD.LS]);
    expect(BINDING.run.touch.control).toBe('stickEdge');
    expect(BINDING.crouch.keyboard.keys).toEqual(['ControlLeft', 'ControlRight']);
    expect(BINDING.crouch.keyboard.toggle).toEqual(['KeyC']);
    expect(BINDING.crouch.gamepad.buttons).toEqual([PAD.RS]);
    expect(BINDING.crouch.touch.control).toBe('swipe');
    expect(BINDING.run.when).toContain('play');
    expect(BINDING.crouch.when).toContain('play');
  });

  it('the Stride Tonic runs 45% faster only while the run control is held, and ends after 3 sealed rooms', () => {
    const { sheet, fx } = drunk('stride-tonic');
    expect(sheet.get('run')).toBe(1);
    const walk = walked(sheet.all, []);
    const run = walked(sheet.all, ['run']);
    expect(run.distance / walk.distance).toBeCloseTo(RUN_SPEED, 1);
    expect(walked({ ...BASE_STATS }, ['run']).distance).toBeCloseTo(walk.distance, 3);
    for (let i = 0; i < 3; i++) fx.roomCleared();
    expect(sheet.get('run')).toBe(BASE_STATS.run);
  });

  it('the Folding Tincture crouches only while the crouch control is held: a block shorter at 45% speed', () => {
    const { sheet, fx } = drunk('folding-tincture');
    expect(sheet.get('crouch')).toBe(1);
    const stand = walked(sheet.all, []);
    const crouch = walked(sheet.all, ['crouch']);
    expect(stand.height).toBe(STAND_H);
    expect(crouch.height).toBeCloseTo(CROUCH_H);
    expect(crouch.distance / stand.distance).toBeCloseTo(CROUCH_SPEED, 1);
    expect(walked({ ...BASE_STATS }, ['crouch']).height).toBe(STAND_H);
    for (let i = 0; i < 3; i++) fx.roomCleared();
    expect(sheet.get('crouch')).toBe(BASE_STATS.crouch);
  });

  it('a potion on top of the practice changes nothing more: the stat stays a switch', () => {
    const sheet = new StatSheet();
    sheet.add({ stat: 'run', layer: 'add', value: 1, source: 'item:fartlek' });
    new PotionEffects(sheet).drink({ potion: 'stride-tonic' });
    expect(sheet.get('run')).toBe(1);
  });

  it('both potions have their name and effect in every language, with the same numbers', () => {
    for (const id of ['stride-tonic', 'folding-tincture'] as const) {
      for (const l of LOCALES) {
        expect(l.messages[POTIONS[id].name], `${l.code} ${id}`).toBeTruthy();
        expect(l.messages[POTIONS[id].effect], `${l.code} ${id}`).toContain('45%');
      }
    }
    expect(EN.messages['potion.stride-tonic.effect']).toContain('Shift');
    expect(EN.messages['potion.folding-tincture.effect']).toContain('1 block shorter');
  });
});
