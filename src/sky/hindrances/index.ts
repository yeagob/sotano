// Every hindrance by id (docs/architecture/SKY.md §6). Registry: written once (K0), never edited again.

import type { Hindrance, HindranceId, HindranceParams } from '../types';
import { cubeCage } from './cube-cage';
import { denseGround } from './dense-ground';
import { fadingPlatforms } from './fading-platforms';
import { horseRing } from './horse-ring';
import { knockback } from './knockback';
import { koalaBellow, koalaHaze, koalaHold, koalaHug, koalaLob, koalaLullaby } from './koala-set';
import { lionRing } from './lion-ring';
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
  'koala-lob': koalaLob, 'koala-hug': koalaHug, 'koala-haze': koalaHaze, 'koala-lullaby': koalaLullaby, 'koala-bellow': koalaBellow, 'koala-hold': koalaHold,
  'lion-ring': lionRing,
  'horse-ring': horseRing,
  'panda-bamboo': pandaBamboo,
};
