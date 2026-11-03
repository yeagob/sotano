// The elephant minions (docs/design/not-built/sky/minions/README.md). Stub (K0): B3 builds them.

import type { MinionDef } from '../../types';
import { walk } from '../gaits';

export const elephantMinion: MinionDef = {
  animal: 'elephant',
  max: 5, wildMax: 3,
  spawn: { where: 'waterhole', warning: 0, every: 0 },
  hitsToTurn: 5,
  gait: walk(0),
  rules: [],
  ally: [],
  model: { parts: [], hw: 0, h: 0, react: () => {} },
};
