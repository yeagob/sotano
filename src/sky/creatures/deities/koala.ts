// The koala deity, guardian of sky floor 2 (docs/design/not-built/sky/guardians/KOALA.md). Stub (K0): B2 builds it.

import { TELEGRAPH, type DeityDef } from '../../types';

export const koalaDeity: DeityDef = {
  animal: 'koala', floor: 2,
  hits: 30,
  telegraph: TELEGRAPH[1],
  recover: 2,
  rest: [0, 0, 0],
  sight: 0,
  hover: 0,
  teleport: true,
  attacks: [],
  ally: { act: 'hug', every: 0, cap: 0 },
  knock: 'hug',
  won: { toast: null, play: () => {} },
  model: { body: [], head: [], hw: 0, h: 0, progress: () => {} },
};
