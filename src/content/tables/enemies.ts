// Structure table: which projections a room's roster draws from, by floor.

import { table } from '../../core/tables';

export const ROSTER = table<string>('roster', 'structure', [
  { value: 'doubt', weight: 5 },
  { value: 'critic', weight: 3 },
  { value: 'panic', weight: 2 },
  { value: 'panic', weight: 2, minFloor: 3 },
  { value: 'autopilot', weight: 3, minFloor: 1, maxFloor: 2 },
  { value: 'craving', weight: 3, minFloor: 1, maxFloor: 2 },
  { value: 'impulse', weight: 3, minFloor: 1, maxFloor: 2 },
  { value: 'avoidance', weight: 2, minFloor: 1, maxFloor: 2 },
  { value: 'distraction', weight: 3, minFloor: 1, maxFloor: 5 },
  { value: 'procrastination', weight: 2, minFloor: 2, maxFloor: 5 },
  { value: 'undertow', weight: 2, minFloor: 3, maxFloor: 4 },
  { value: 'rumination', weight: 2, minFloor: 3, maxFloor: 4 },
  { value: 'scarcity', weight: 2, minFloor: 3, maxFloor: 4 },
  { value: 'resentment', weight: 2, minFloor: 3, maxFloor: 4 },
  { value: 'gloom', weight: 2, minFloor: 3, maxFloor: 4 },
  { value: 'second-guessing', weight: 3, minFloor: 3, maxFloor: 7 },
  { value: 'alarm', weight: 3, minFloor: 3, maxFloor: 6 },
  { value: 'perfectionism', weight: 2, minFloor: 3, maxFloor: 6 },
  { value: 'comparison', weight: 2, minFloor: 3, maxFloor: 6 },
  { value: 'margin', weight: 2, minFloor: 3, maxFloor: 6 },
  { value: 'noise', weight: 2, minFloor: 4, maxFloor: 9 },
  { value: 'reactivity', weight: 3, minFloor: 5, maxFloor: 6 },
  { value: 'sulk', weight: 2, minFloor: 5, maxFloor: 6 },
  { value: 'shoulds', weight: 2, minFloor: 5, maxFloor: 6 },
  { value: 'dogma', weight: 1, minFloor: 5, maxFloor: 6 },
  { value: 'backlog', weight: 2, minFloor: 5, maxFloor: 9 },
  { value: 'tribunal', weight: 2, minFloor: 6, maxFloor: 9 },
  { value: 'dread', weight: 2, minFloor: 6, maxFloor: 9 },
  { value: 'not-yet', weight: 2, minFloor: 6, maxFloor: 9 },
  { value: 'paralysis', weight: 2, minFloor: 6, maxFloor: 9 },
  { value: 'hall-of-mirrors', weight: 2, minFloor: 7, maxFloor: 9 },
  { value: 'burnout', weight: 3, minFloor: 7, maxFloor: 8 },
  { value: 'spark', weight: 2, minFloor: 7, maxFloor: 8 },
  { value: 'pretence', weight: 2, minFloor: 7, maxFloor: 8 },
  { value: 'shortcut', weight: 1, minFloor: 7, maxFloor: 8 },
  { value: 'numbness', weight: 2, minFloor: 9, maxFloor: 9 },
  { value: 'cynicism', weight: 2, minFloor: 9, maxFloor: 9 },
  { value: 'isolation', weight: 2, minFloor: 9, maxFloor: 9 },
  { value: 'what-if', weight: 2, minFloor: 9, maxFloor: 9 },
]);

/** One normal room in this many is quiet (no projections), by floor. */
export const QUIET_ROOM = table<boolean>('quiet-room', 'structure', [
  { value: true, weight: 1 },
  { value: false, weight: 4 },
  { value: false, weight: 2, minFloor: 3 },
]);
