// The koala minions (docs/design/not-built/sky/minions/README.md). Stub (K0): B2 builds them.

import type { MinionDef } from '../../types';
import { walk } from '../gaits';

export const koalaMinion: MinionDef = {
  animal: 'koala',
  max: 6, wildMax: 6,
  spawn: { where: 'clusters', warning: 0, every: 0, asleep: true },
  hitsToTurn: 3,
  gait: walk(0),
  rules: [],
  ally: [],
  model: { parts: [], hw: 0, h: 0, react: () => {} },
};
