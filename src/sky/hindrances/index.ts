// Every hindrance by id (docs/architecture/SKY.md §6). Registry: written once (K0), never edited again.

import type { Hindrance, HindranceId, HindranceParams } from '../types';
import { cubeCage } from './cube-cage';
import { denseGround } from './dense-ground';
import { fadingPlatforms } from './fading-platforms';
import { knockback } from './knockback';
import { openingHoles } from './opening-holes';
import { pandaBamboo } from './panda-bamboo';
import { paralysis } from './paralysis';
import { waterCurrents } from './water-currents';
import { wind } from './wind';

export const HINDRANCES: { readonly [K in HindranceId]: Hindrance<HindranceParams[K]> } = {
  'knockback': knockback,
  'wind': wind,
  'opening-holes': openingHoles,
  'fading-platforms': fadingPlatforms,
  'dense-ground': denseGround,
  'cube-cage': cubeCage,
  'water-currents': waterCurrents,
  'paralysis': paralysis,
  'panda-bamboo': pandaBamboo,
};
