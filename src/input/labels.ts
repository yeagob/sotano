import { t, type MessageKey, type Params } from '../i18n';
import type { Device } from './bindings';

const SUFFIX: Record<Device, string> = { keyboard: 'key', gamepad: 'pad', touch: 'touch' };

export function controlKey(row: string, device: Device): MessageKey {
  return `controls.${row}.${SUFFIX[device]}` as MessageKey;
}

export function forDevice(base: string, device: Device): MessageKey {
  return (device === 'keyboard' ? base : `${base}.${SUFFIX[device]}`) as MessageKey;
}

export const LESSON_CONTROLS = ['move', 'look', 'jump', 'cast', 'place', 'throw', 'bomb', 'inventory', 'pause', 'polarity', 'navigate', 'confirm', 'back'] as const;

export function controlParams(device: Device): Params {
  return Object.fromEntries(LESSON_CONTROLS.map(a => [a, inline(t(controlKey(a, device)))]));
}

function inline(label: string) {
  return label.length > 1 && label[1] === label[1].toLowerCase() ? label[0].toLowerCase() + label.slice(1) : label;
}

export function sentenceCase(text: string) {
  return text.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}
