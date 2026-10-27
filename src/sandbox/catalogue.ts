// The sandbox's scenarios: one JSON file each in ./scenarios (docs/architecture/SANDBOX.md).
// The file name is the id unless the file says otherwise.

import type { Scenario } from './scenario';

const files = import.meta.glob<Omit<Scenario, 'id'> & { id?: string }>('./scenarios/*.json', { eager: true, import: 'default' });

export const SCENARIOS: readonly Scenario[] = Object.keys(files).sort().map(path => ({
  ...files[path],
  id: files[path].id ?? path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
}));

export const SCENARIO_BY_ID: ReadonlyMap<string, Scenario> = new Map(SCENARIOS.map(s => [s.id, s]));

/** The empty creative room `?sandbox` opens with no scenario named. */
export const BLANK: Scenario = {
  id: 'blank',
  note: 'An empty 13 × 7 room: build anything',
  rows: Array(7).fill('.............'),
  god: true,
};
