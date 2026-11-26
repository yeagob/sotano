import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BINDING, BINDINGS, CONTROL_ROWS, DEVICES, SHARED_TOUCH, contextsFor, type Binding, type Context, type Device } from '../src/input/bindings';
import SNAPSHOT from './controls.keyboard-gamepad.json';
import { LESSON_CONTROLS } from '../src/input/labels';
import { HUD_ICONS } from '../src/content/hud-icons';
import { EN } from '../src/i18n/locales/en';

const CONTEXTS: Context[] = ['play', 'prompt', 'paused', 'dead', 'inventory', 'toll', 'meditation'];
const messages = EN.messages as Record<string, unknown>;

function inputs(b: Binding, d: Device): string[] {
  if (d === 'keyboard') return [...(b.keyboard.keys ?? []), ...(b.keyboard.mouse ?? []).map(m => `mouse${m}`), ...(b.keyboard.mouseMove ? ['mouseMove'] : []), ...(b.keyboard.wheel ? [`wheel${b.keyboard.wheel}`] : []), ...(b.keyboard.doubleTap ? [`doubleTap-${b.keyboard.doubleTap}`] : [])];
  if (d === 'gamepad') return [...(b.gamepad.buttons ?? []).map(i => `button${i}`), ...(b.gamepad.stick ? [`stick-${b.gamepad.stick}`] : []), ...(b.gamepad.doubleFlick ? [`doubleFlick-${b.gamepad.doubleFlick}`] : [])];
  // a shared context button is one input for every action it carries (`button-body`), so sharing shows as a clash
  return b.touch.control === 'tap' ? [] : [`${b.touch.control}-${b.touch.shared ?? b.action}`];
}

/** Every input claimed twice in one context on one device, as `input on device in context: a and b`. */
function clashes(list: readonly Binding[]): string[] {
  const out: string[] = [];
  for (const d of DEVICES) for (const c of CONTEXTS) {
    const seen = new Map<string, string>();
    for (const b of list) {
      if (!contextsFor(b, d).includes(c)) continue;
      for (const i of inputs(b, d)) {
        if (seen.has(i)) out.push(`${i} on ${d} in ${c}: ${seen.get(i)} and ${b.action}`);
        else seen.set(i, b.action);
      }
    }
  }
  return out;
}

describe('controls contract', () => {
  it('every action is mapped on keyboard and mouse, gamepad and touch', () => {
    for (const b of BINDINGS) for (const d of DEVICES) {
      const mapped = d === 'touch' ? !!b.touch.control : inputs(b, d).length > 0;
      expect(mapped, `${b.action} on ${d}`).toBe(true);
    }
  });

  it('every action names its Minecraft, Noita and Isaac reference', () => {
    for (const b of BINDINGS) for (const r of ['minecraft', 'noita', 'isaac'] as const) expect(b.refs[r].length, `${b.action}.${r}`).toBeGreaterThan(3);
  });

  it('no two actions share an input in the same context on the same device, except the shared touch buttons', () => {
    // the only shared input is the body button (#377): crouch and dash, on touch, in play
    expect(SHARED_TOUCH.body).toEqual(['dash', 'crouch']);
    expect(clashes(BINDINGS)).toEqual(['button-body on touch in play: dash and crouch']);
    expect(clashes(BINDINGS.filter(b => !b.touch.shared))).toEqual([]);
  });

  it('the keyboard, mouse and gamepad mappings are unchanged by the touch review (#377)', () => {
    const now = Object.fromEntries(BINDINGS.map(b => [b.action, JSON.parse(JSON.stringify({ keyboard: b.keyboard, gamepad: b.gamepad }))]));
    expect(now).toEqual(SNAPSHOT);
  });

  it('the touch audit table has a row for every action and no empty touch cell', () => {
    const doc = readFileSync('docs/architecture/input/README.md', 'utf8');
    const rows = new Map<string, string[]>();
    for (const line of doc.split(/\r?\n/)) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length === 6 && !rows.has(cells[0])) rows.set(cells[0], cells);
    }
    for (const b of BINDINGS) {
      const row = rows.get(b.action);
      expect(row, `${b.action} has a row in the action table`).toBeDefined();
      for (const [i, d] of [[3, 'keyboard'], [4, 'gamepad'], [5, 'touch']] as const) expect(row![i].length, `${b.action} on ${d}`).toBeGreaterThan(0);
    }
  });

  it('crouch and dash have a visible touch control in play: the body button, with their swipes kept', () => {
    for (const b of [BINDING.crouch, BINDING.dash]) {
      expect(b.touch.control, b.action).toBe('button');
      expect(b.touch.shared, b.action).toBe('body');
      expect(b.touch.gesture, b.action).toBe('swipe');
      expect(contextsFor(b, 'touch'), b.action).toEqual(['play']);
    }
  });

  it('every action live in play on touch has a visible control or a named gesture there', () => {
    const visible = new Set(['stick', 'stickEdge', 'lookPad', 'button', 'systemButton', 'tap', 'worldTap', 'turn']);
    for (const b of BINDINGS.filter(x => contextsFor(x, 'touch').includes('play'))) {
      expect(visible.has(b.touch.control) || b.touch.control === 'none', `${b.action}: ${b.touch.control}`).toBe(true);
    }
  });

  it('the play screen shows at most seven touch buttons when no practice adds one', () => {
    const buttons = BINDINGS.filter(b => (b.touch.control === 'button' || b.touch.control === 'systemButton') && contextsFor(b, 'touch').includes('play'));
    const onScreen = new Set(buttons.map(b => b.touch.shared ?? b.action));
    // drink (a flask on top), miracle (Kairos) and the body button (crouch or dash) appear only in their state
    const conditional = new Set(['drink', 'miracle', 'body']);
    expect([...onScreen].filter(k => !conditional.has(k)).length).toBeLessThanOrEqual(7);
    // the worst case, every conditional button at once, is eight: an open question for the owner (TOUCH.md §1.1)
    expect(onScreen.size).toBe(8);
  });

  it('a double tap of a direction does not clash with the movement keys, but two gestures on the same direction would', () => {
    // the dash's double tap is a gesture of `move`, not a key: the real table is clean
    const dash = BINDING.dash;
    expect(inputs(dash, 'keyboard')).toEqual(['doubleTap-move']);
    expect(clashes([BINDING.move, dash])).toEqual([]);
    // a second action on the same gesture is a clash
    expect(clashes([dash, { ...dash, action: 'move' as const }]).length).toBeGreaterThan(0);
    expect(clashes([{ ...dash, action: 'move' as const }, dash]).length).toBeGreaterThan(0);
  });

  it('the dash is a gesture on keyboard and gamepad; on touch the body button and the swipe', () => {
    expect(BINDING.dash.keyboard.doubleTap).toBe('move');
    expect(BINDING.dash.gamepad.doubleFlick).toBe('left');
    expect(BINDING.dash.gamepad.buttons).toBeUndefined();
    expect(BINDING.dash.touch.control).toBe('button');
    expect(BINDING.dash.touch.gesture).toBe('swipe');
    expect(contextsFor(BINDING.dash, 'touch')).toEqual(['play']);
  });

  it('a world tap and a half turn of the phone are live in play', () => {
    for (const b of BINDINGS.filter(x => x.touch.control === 'worldTap' || x.touch.control === 'turn')) {
      expect(contextsFor(b, 'touch'), b.action).toContain('play');
    }
  });

  it('back declines a presence offer on keyboard and gamepad; touch uses the card buttons', () => {
    expect(contextsFor(BINDING.back, 'keyboard')).toContain('prompt');
    expect(contextsFor(BINDING.back, 'gamepad')).toContain('prompt');
    expect(contextsFor(BINDING.back, 'touch')).not.toContain('prompt');
  });

  it('the book download is reachable on every device on the pause card and the death screen', () => {
    const b = BINDING.book;
    for (const c of ['paused', 'dead'] as const) {
      expect(contextsFor(b, 'keyboard'), 'keyboard').toContain(c);
      expect(contextsFor(b, 'gamepad'), 'gamepad').toContain(c);
      expect(contextsFor(b, 'touch'), 'touch').toContain(c);
    }
    expect(inputs(b, 'keyboard')).toEqual(['KeyH']);
    expect(inputs(b, 'gamepad')).toEqual(['button2']);
    expect(b.touch.control).toBe('menuButton');
  });

  it('a touch action with no button of its own is reached through another control', () => {
    for (const b of BINDINGS.filter(x => x.touch.control === 'none')) {
      expect(BINDING.inventory.touch.control, b.action).toBe('systemButton');
    }
  });

  it('every touch glyph exists', () => {
    for (const b of BINDINGS) if (b.touch.icon) expect(HUD_ICONS, b.action).toHaveProperty(b.touch.icon);
  });

  it('every control row and lesson control has its words for every device', () => {
    for (const r of new Set<string>([...CONTROL_ROWS, ...LESSON_CONTROLS])) {
      expect(messages, r).toHaveProperty(`controls.${r}`);
      for (const s of ['key', 'pad', 'touch']) expect(messages, `${r}.${s}`).toHaveProperty(`controls.${r}.${s}`);
    }
    for (const b of BINDINGS) if (b.touch.control === 'button' || b.touch.control === 'systemButton') expect(messages).toHaveProperty(`controls.${b.action}`);
  });

  it('every prompt the player reads has a gamepad and a touch version', () => {
    for (const k of ['intro.play', 'banner.continue', 'death.restart', 'inv.close', 'presence.offer.controls']) for (const s of ['pad', 'touch']) expect(messages).toHaveProperty(`${k}.${s}`);
  });
});
