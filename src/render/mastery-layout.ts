import { clampLevel } from '../content/tables/roots-mastery';
import type { Mount } from './panel-layout';

export const MASTERY_ZERO = 'N';

const NUMERALS: readonly (readonly [number, string])[] = [
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function romanNumeral(level: number): string {
  let n = clampLevel(level);
  if (n === 0) return MASTERY_ZERO;
  let out = '';
  for (const [value, glyph] of NUMERALS) while (n >= value) { out += glyph; n -= value; }
  return out;
}

export const MASTERY_STONE = {
  dx: 6.5, dy: 3.6, h: 1.5, minW: 2, maxW: 4.75, snap: 0.125, inset: 0.015,
  pxPerBlock: 256, fontPx: 176, tracking: 0.06, dot: 16, dotGap: 36, margin: 48,
} as const;

const ADVANCE: Readonly<Record<string, number>> = { I: 0.44, V: 0.78, X: 0.78, L: 0.72, C: 0.74, N: 0.84 };

export function numeralEms(text: string): number {
  let em = 0;
  for (const ch of text) em += ADVANCE[ch] ?? 0.84;
  return em + Math.max(0, text.length - 1) * MASTERY_STONE.tracking;
}

export function masteryStoneWidth(level: number): number {
  const s = MASTERY_STONE;
  const px = numeralEms(romanNumeral(level)) * s.fontPx + 2 * (s.dotGap + 2 * s.dot) + 2 * s.margin;
  const w = Math.ceil(px / s.pxPerBlock / s.snap) * s.snap;
  return Math.min(s.maxW, Math.max(s.minW, w));
}

export function masteryStoneMount(x0: number, y0: number, z0: number, level: number): Mount {
  const s = MASTERY_STONE;
  return { x: x0 + s.dx, y: y0 + s.dy, z: z0 + 7 - s.inset, rotY: Math.PI, w: masteryStoneWidth(level), h: s.h };
}

export function masteryStoneBlocks(x0: number, y0: number, z0: number, level: number): [number, number, number][] {
  const s = MASTERY_STONE, w = masteryStoneWidth(level);
  const out: [number, number, number][] = [];
  for (let x = Math.floor(s.dx - w / 2); x <= Math.ceil(s.dx + w / 2) - 1; x++)
    for (let y = Math.floor(s.dy - s.h / 2); y <= Math.ceil(s.dy + s.h / 2) - 1; y++)
      out.push([x0 + x, y0 + y, z0 + 7]);
  return out;
}
