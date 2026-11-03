// Knockback: a push along the shown arc (docs/architecture/SKY.md §6). Stub (K0): H0 builds it.

import type { KnockbackParams, Hindrance } from '../types';

export const knockback: Hindrance<KnockbackParams> = {
  id: 'knockback',
  telegraph: (_ctx, p) => ({ at: p.from, update() {}, end() {} }),
  effect: (_ctx, p) => ({ at: p.from, update: () => false, end() {} }),
};
