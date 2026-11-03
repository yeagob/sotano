// Fog and clear colour by place and height: the deck, the halls, Totality's strata (docs/architecture/SKY.md §11). Pure. Stub (K0): AB builds it.

import type { AtmosphereSample, SkyPlace } from './types';

export const atmosphereAt = (_place: SkyPlace, _y: number): AtmosphereSample => ({ fog: 0, clear: 0, near: 0, far: 0, stars: 0 });
