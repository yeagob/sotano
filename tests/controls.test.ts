import { describe, expect, it } from 'vitest';
import { BINDING, BINDINGS, CONTROL_ROWS, DEVICES, contextsFor, type Binding, type Context, type Device } from '../src/input/bindings';
import { LESSON_CONTROLS } from '../src/input/labels';
import { HUD_ICONS } from '../src/content/hud-icons';
import { EN } from '../src/i18n/locales/en';

const CONTEXTS: Context[] = ['play', 'prompt', 'paused', 'dead', 'inventory'];
const messages = EN.messages as Record<string, unknown>;

function inputs(b: Binding, d: Device): string[] {
  if (d === 'keyboard') return [...(b.keyboard.keys ?? []), ...(b.keyboard.mouse ?? []).map(m => `mouse${m}`), ...(b.keyboard.mouseMove ? ['mouseMove'] : [])];
  if (d === 'gamepad') return [...(b.gamepad.buttons ?? []).map(i => `button${i}`), ...(b.gamepad.stick ? [`stick-${b.gamepad.stick}`] : [])];
  return b.touch.control === 'tap' ? [] : [`${b.touch.control}-${b.action}`];
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

  it('no two actions share an input in the same context on the same device', () => {
    for (const d of DEVICES) for (const c of CONTEXTS) {
      const seen = new Map<string, string>();
      for (const b of BINDINGS) {
        if (!contextsFor(b, d).includes(c)) continue;
        for (const i of inputs(b, d)) {
          expect(seen.get(i), `${i} on ${d} in ${c}: ${seen.get(i)} and ${b.action}`).toBeUndefined();
          seen.set(i, b.action);
        }
      }
    }
  });

  it('a world tap and a half turn of the phone are live in play', () => {
    for (const b of BINDINGS.filter(x => x.touch.control === 'worldTap' || x.touch.control === 'turn')) {
      expect(contextsFor(b, 'touch'), b.action).toContain('play');
    }
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
    for (const k of ['intro.play', 'banner.continue', 'death.restart', 'inv.close']) for (const s of ['pad', 'touch']) expect(messages).toHaveProperty(`${k}.${s}`);
  });
});
