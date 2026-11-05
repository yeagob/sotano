// The lion deity, guardian of sky floor 4 (docs/design/not-built/sky/guardians/LION.md). Stub (K0): B4 builds it.

import { TELEGRAPH, type DeityDef } from '../../types';

export const lionDeity: DeityDef = {
  animal: 'lion', floor: 4,
  hits: 42,
  telegraph: TELEGRAPH[3],
  recover: 2,
  rest: [0, 0, 0],
  sight: 0,
  hover: 0,
  teleport: false,
  attacks: [],
  ally: { act: 'rub', every: 0, cap: 0 },
  knock: 'paw',
  won: { toast: null, play: () => {} },
  // Body size PROVISIONAL (no guardian document gives one): touches land on a body until B1–B5 build the model.
  model: { body: [], head: [], hw: 0.8, h: 1.8, progress: () => {} },
};
