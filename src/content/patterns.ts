import type { PathName } from './palette';

export const PATTERN_PATH: Readonly<Record<string, PathName>> = {
  doubt: 'mind', 'second-guessing': 'mind', paralysis: 'mind',
  critic: 'mind', margin: 'mind', tribunal: 'mind',
  distraction: 'mind', noise: 'mind',
  cynicism: 'mind', dogma: 'mind', rumination: 'mind', shoulds: 'mind', 'what-if': 'mind',
  panic: 'will', alarm: 'will', dread: 'will',
  procrastination: 'will', backlog: 'will',
  autopilot: 'will', burnout: 'will', scarcity: 'will', shortcut: 'will',
  comparison: 'emotion', 'hall-of-mirrors': 'emotion',
  avoidance: 'emotion', gloom: 'emotion', isolation: 'emotion', numbness: 'emotion', pretence: 'emotion',
  resentment: 'emotion', sulk: 'emotion', undertow: 'emotion',
  perfectionism: 'body', 'not-yet': 'body',
  craving: 'body', impulse: 'body', reactivity: 'body', spark: 'body',
};

export const LINEAGE: Readonly<Record<string, string>> = {
  doubt: 'doubt', 'second-guessing': 'doubt', paralysis: 'doubt',
  critic: 'critic', margin: 'critic', tribunal: 'critic',
  panic: 'panic', alarm: 'panic', dread: 'panic',
  procrastination: 'procrastination', backlog: 'procrastination',
  comparison: 'comparison', 'hall-of-mirrors': 'comparison',
  distraction: 'distraction', noise: 'distraction',
  perfectionism: 'perfectionism', 'not-yet': 'perfectionism',
};

export const pathOf = (pattern: string): PathName | null => PATTERN_PATH[pattern] ?? null;
export const lineageOf = (pattern: string): string | null => LINEAGE[pattern] ?? null;
