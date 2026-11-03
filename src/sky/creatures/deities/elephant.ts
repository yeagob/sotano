// The elephant deity, guardian of sky floor 3 (docs/design/not-built/sky/guardians/ELEPHANT.md). Stub (K0): B3 builds it.

import { TELEGRAPH, type DeityDef } from '../../types';

export const elephantDeity: DeityDef = {
  animal: 'elephant', floor: 3,
  hits: 36,
  telegraph: TELEGRAPH[2],
  recover: 2.5,
  rest: [0, 0, 0],
  sight: 0,
  hover: 0,
  teleport: false,
  attacks: [],
  ally: { act: 'trumpet', every: 0, cap: 0 },
  knock: 'sweep',
  won: { toast: null, play: () => {} },
  model: { body: [], head: [], hw: 0, h: 0, progress: () => {} },
};
