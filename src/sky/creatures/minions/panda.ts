// The panda minions (docs/design/not-built/sky/minions/README.md). Stub (K0): B1 builds them.

import type { MinionDef } from '../../types';
import { walk } from '../gaits';

export const pandaMinion: MinionDef = {
  animal: 'panda',
  max: 4, wildMax: 3,
  spawn: { where: 'clumps', warning: 0, every: 0 },
  hitsToTurn: 3,
  gait: walk(0),
  rules: [],
  ally: [],
  model: { parts: [], hw: 0, h: 0, react: () => {} },
};
