// The panda deity, guardian of sky floor 1 (docs/design/not-built/sky/guardians/PANDA.md). Stub (K0): B1 builds it.

import { TELEGRAPH, type DeityDef } from '../../types';

export const pandaDeity: DeityDef = {
  animal: 'panda', floor: 1,
  hits: 24,
  telegraph: TELEGRAPH[0],
  recover: 2.5,
  rest: [0, 0, 0],
  sight: 0,
  hover: 0,
  teleport: false,
  attacks: [],
  ally: { act: 'sit', every: 0, cap: 0 },
  knock: 'nudge',
  won: { toast: null, play: () => {} },
  model: { body: [], head: [], hw: 0, h: 0, progress: () => {} },
};
