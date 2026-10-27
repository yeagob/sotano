// The lab's text report (docs/architecture/SANDBOX.md): what is in the sandbox room, as short,
// stable lines, so two runs of a scenario compare with a plain diff. Headless.

import { elemKind, isSource } from '../content/elements';
import { AIR, MATERIALS } from '../content/materials';
import type { RoomInfo } from '../world/floor';
import type { VoxelWorld } from '../world/world';

/** One character per material on the maps (elements use w/W, l/L and f). */
export const MAP_CHAR: Record<string, string> = {
  air: '.', dirt: 'd', grass: 'g', brick: 'b', stone: 'r', deepstone: 'D', crate: 'c', obsidian: 'o', bedrock: 'B', ore: 'i',
  frame: 'n', goldframe: 'G', bossframe: 'O', pedestal: 'T', bomb: 'x', chest: 'H', chestopen: 'h', ice: 'I', log: 'k',
  leaves: 'v', starstone: 's',
};
const ELEMENT_CHAR = ['', 'w', 'l', 'f'];
const ELEMENT_NAME = ['', 'water', 'lava', 'fire'];

/** The room's interior box; `below` layers under the floor too (pools and pits dig two). */
export function roomBox(r: RoomInfo, below = 0): [number, number, number, number, number, number] {
  return [r.x0, r.y0 - below, r.z0, r.x0 + r.w - 1, r.y0 + r.height - 1, r.z0 + r.d - 1];
}

/** "brick 12 · crate 4": every material inside the room (above its floor), by count. */
export function blockCounts(w: VoxelWorld, r: RoomInfo): string {
  const n = new Map<number, number>();
  const [x0, y0, z0, x1, y1, z1] = roomBox(r);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const m = w.get(x, y, z);
    if (m !== AIR) n.set(m, (n.get(m) ?? 0) + 1);
  }
  return [...n].sort((a, b) => a[0] - b[0]).map(([m, c]) => `${MATERIALS[m].key} ${c}`).join(' · ') || '—';
}

/** "water 10 (2 src) · fire 3": every element cell in the room, its pools included. */
export function elementCounts(w: VoxelWorld, r: RoomInfo): string {
  const n = [0, 0, 0, 0], src = [0, 0, 0, 0];
  const [x0, y0, z0, x1, y1, z1] = roomBox(r, 2);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = w.elemAt(x, y, z);
    if (!b) continue;
    n[elemKind(b)]++;
    if (isSource(b)) src[elemKind(b)]++;
  }
  return [1, 2, 3].filter(k => n[k]).map(k => `${ELEMENT_NAME[k]} ${n[k]}${src[k] ? ` (${src[k]} src)` : ''}`).join(' · ') || '—';
}

/** The room top-down at one room-local height: a block's character, else its element (upper case = source), else '.'. */
export function mapAt(w: VoxelWorld, r: RoomInfo, h: number): string[] {
  const rows: string[] = [];
  for (let z = r.z0; z < r.z0 + r.d; z++) {
    let line = '';
    for (let x = r.x0; x < r.x0 + r.w; x++) {
      const y = r.y0 + h, m = w.get(x, y, z), b = w.elemAt(x, y, z);
      if (m !== AIR) line += MAP_CHAR[MATERIALS[m].key] ?? '?';
      else if (b) { const c = ELEMENT_CHAR[elemKind(b)]; line += isSource(b) ? c.toUpperCase() : c; }
      else line += '.';
    }
    rows.push(line);
  }
  return rows;
}

/** The characters used on some maps, explained. */
export function legend(maps: string[][]): string {
  const used = new Set(maps.flat().join(''));
  const names: string[] = [];
  for (const [k, c] of Object.entries(MAP_CHAR)) if (k !== 'air' && used.has(c)) names.push(`${c} ${k}`);
  for (let i = 1; i < 4; i++) {
    if (used.has(ELEMENT_CHAR[i])) names.push(`${ELEMENT_CHAR[i]} ${ELEMENT_NAME[i]}`);
    if (used.has(ELEMENT_CHAR[i].toUpperCase())) names.push(`${ELEMENT_CHAR[i].toUpperCase()} ${ELEMENT_NAME[i]} source`);
  }
  return names.join(' · ');
}

/** A number for the report: one decimal, never "-0.0". */
export const num = (v: number) => { const s = v.toFixed(1); return s === '-0.0' ? '0.0' : s; };
