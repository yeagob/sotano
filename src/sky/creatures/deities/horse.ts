// The horse deity, guardian of sky floor 5 (docs/design/not-built/sky/guardians/HORSE.md). Stub (K0): B5 builds it.

import { TELEGRAPH, type DeityDef } from '../../types';

export const horseDeity: DeityDef = {
  animal: 'horse', floor: 5,
  hits: 48,
  telegraph: TELEGRAPH[4],
  recover: 2,
  rest: [0, 0, 0],
  sight: 0,
  hover: null,
  teleport: true,
  attacks: [],
  ally: { act: 'graze', every: 0, cap: 0, calm: true },
  knock: 'kick',
  won: { toast: null, play: () => {} },
  model: { body: [], head: [], hw: 0, h: 0, progress: () => {} },
};
