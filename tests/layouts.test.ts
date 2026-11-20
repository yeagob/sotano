// Open corners (issue #115, docs/design/built/levels/rooms/LAYOUT-RULES.md): projections spawn on the open floor of a
// room away from its doors and the player, which means its corners. No room hides them there, and every band of
// floors keeps at least the number of layouts the issue set.

import { describe, expect, it } from 'vitest';
import { ROOM_TEMPLATES, spawnPockets, validateTemplate, type RoomTemplate } from '../src/content/rooms';
import { LAYOUTS_115 } from '../src/content/room-layouts';

const hostile = ROOM_TEMPLATES.filter(t => !(t.floors && t.floors[1] === 0));
const room = (rows: string[], extra: Partial<RoomTemplate> = {}): RoomTemplate => ({ id: 't', types: ['normal'], rows, ...extra });
const OPEN = ['.............', '.............', '.............', '......K......', '.............', '.............', '.............'];
const withRow = (r: number, s: string) => OPEN.map((x, i) => (i === r ? s : x));

describe('open corners', () => {
  it('no room below the Roots hides a projection in a corner, snags it in a notch or clutters a corner', () => {
    for (const t of hostile) expect(spawnPockets(t), t.id).toEqual([]);
  });

  it('an open room is clean', () => {
    expect(spawnPockets(room(OPEN))).toEqual([]);
  });

  it('a loose block in a corner is clutter, a terrace that fills it is not', () => {
    expect(spawnPockets(room(withRow(0, 'c............'))).join()).toMatch(/clutters a corner/);
    expect(spawnPockets(room(withRow(0, '1............')))).toEqual([]);
  });

  it('a block one tile off the corner leaves a notch', () => {
    expect(spawnPockets(room(withRow(0, '.d...........'))).join()).toMatch(/notch at 0,0/);
  });

  it('a pillar two high between the centre and a corner hides it; a pillar on the cross does not', () => {
    expect(spawnPockets(room(withRow(2, '...R.........'))).join()).toMatch(/hidden from the centre/);
    expect(spawnPockets(room(withRow(3, '...R..K......')))).toEqual([]);
  });

  it('a corner behind a wall you must build through answers to the clutter and notch rules only', () => {
    const walled = withRow(1, 'XXXXXEEEXXXXX').map((x, i) => (i === 5 ? 'XXXXXEEEXXXXX' : x));
    expect(spawnPockets(room(walled))).toEqual([]);
  });

  it('a ledge you can only drop onto is not part of the room you fight in', () => {
    const ramparts = LAYOUTS_115.find(t => t.id === 'ramparts')!;
    expect(spawnPockets(ramparts)).toEqual([]);
  });

  it('rooms without projections (start, treasure, vault) are not held to it', () => {
    expect(spawnPockets(room(withRow(0, 'c...........c'), { types: ['treasure'] }))).toEqual([]);
  });
});

/** Fighting layouts (normal, path, challenge) per band before issue #115, and the target the issue set: double. */
const BANDS: { name: string; floors: [number, number]; before: number; target: number }[] = [
  { name: 'F1 (floors 1–2)', floors: [1, 2], before: 38, target: 76 },
  { name: 'F2 (floors 3–4)', floors: [3, 4], before: 48, target: 96 },
  { name: 'F3 (floors 5–6)', floors: [5, 6], before: 33, target: 66 },
  { name: 'F4 (floors 7–9)', floors: [7, 9], before: 19, target: 38 },
];

describe('layouts per band (issue #115)', () => {
  const inBand = (t: RoomTemplate, [a, b]: [number, number]) => !t.floors || (t.floors[0] <= b && t.floors[1] >= a);
  const fighting = (t: RoomTemplate) => t.types.some(x => x === 'normal' || x === 'path' || x === 'challenge');

  for (const band of BANDS) it(`${band.name} has at least ${band.target} fighting layouts`, () => {
    expect(hostile.filter(t => fighting(t) && inBand(t, band.floors)).length).toBeGreaterThanOrEqual(band.target);
  });

  it('every new layout passes the validator', () => {
    for (const t of LAYOUTS_115) expect(validateTemplate(t), t.id).toEqual([]);
  });

  it('template ids stay unique', () => {
    const ids = ROOM_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
