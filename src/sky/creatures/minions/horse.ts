// The horse minions (docs/design/not-built/sky/minions/README.md). Stub (K0): B5 builds them.

import type { MinionDef } from '../../types';
import { walk } from '../gaits';

export const horseMinion: MinionDef = {
  animal: 'horse',
  max: 5, wildMax: 3,
  spawn: { where: 'gate', warning: 0, every: 0 },
  hitsToTurn: 4,
  gait: walk(0),
  rules: [],
  ally: [],
  model: { parts: [], hw: 0, h: 0, react: () => {} },
};
