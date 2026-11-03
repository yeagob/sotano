// The lion minions (docs/design/not-built/sky/minions/README.md). Stub (K0): B4 builds them.

import type { MinionDef } from '../../types';
import { walk } from '../gaits';

export const lionMinion: MinionDef = {
  animal: 'lion',
  max: 6, wildMax: 4,
  spawn: { where: 'shade', warning: 0, every: 0 },
  hitsToTurn: 4,
  gait: walk(0),
  rules: [],
  ally: [],
  model: { parts: [], hw: 0, h: 0, react: () => {} },
};
