// Structure table: which projections a room's roster draws from, by floor.

import { table } from '../../core/tables';

export const ROSTER = table<string>('roster', 'structure', [
  { value: 'doubt', weight: 5 },
  { value: 'critic', weight: 3 },
  { value: 'panic', weight: 2 },
  { value: 'panic', weight: 2, minFloor: 3 },   // panic grows more common deeper down
]);

/** One normal room in this many is quiet (no projections), by floor. */
export const QUIET_ROOM = table<boolean>('quiet-room', 'structure', [
  { value: true, weight: 1 },
  { value: false, weight: 4 },
  { value: false, weight: 2, minFloor: 3 },
]);
