// The kinds of heart (docs/art/DECISIONS.md §10.6): their HUD glyphs, their pickup in the world,
// the colour of their particles and halo, and the frames the star and the berserker heart put on screen.

import type { PalToken } from './palette';
import { HUD_ICONS, type HudIcon } from './hud-icons';

export type HeartKind = 'red' | 'blue' | 'black' | 'stone' | 'blood' | 'star' | 'berserker';

export const HEART_KINDS: readonly HeartKind[] = ['red', 'blue', 'black', 'stone', 'blood', 'star', 'berserker'];

export const HEART_HUD: Record<HeartKind, HudIcon> = {
  red: HUD_ICONS.heart,
  blue: HUD_ICONS.heartBlue,
  black: HUD_ICONS.heartBlack,
  stone: HUD_ICONS.heartStone,
  blood: HUD_ICONS.heartBlood,
  star: HUD_ICONS.heartStar,
  berserker: HUD_ICONS.heartBerserker,
};

/**
 * The pickup: a pixel heart of cubes, 9 wide × 8 tall, one palette key per cube ('.' is empty).
 * `emissive` is the whole mesh's emissive; `lit` lists the keys that are light and are best drawn
 * unlit at full colour (the gold crack, the star, the burning core).
 */
export interface HeartPickupArt { rows: string[]; palette: Record<string, PalToken>; emissive: PalToken; lit: string }

const RED_ROWS = [
  '.ff...ff.',
  'fhff.ffff',
  'fffffffff',
  'ffffffffd',
  '.ffffffd.',
  '..fffdd..',
  '...fdd...',
  '....d....',
];

export const HEART_PICKUP: Record<HeartKind, HeartPickupArt> = {
  red: { rows: RED_ROWS, palette: { f: 'life.heart', h: 'bone.paper', d: 'life.dark' }, emissive: 'life.dark', lit: '' },
  blue: { rows: RED_ROWS, palette: { f: 'heart.blue.base', h: 'bone.paper', d: 'heart.blue.dark' }, emissive: 'heart.blue.dark', lit: '' },
  black: { rows: RED_ROWS, palette: { f: 'heart.black.base', h: 'bone.paper', d: 'heart.black.dark' }, emissive: 'heart.black.dark', lit: '' },
  stone: {
    rows: [
      '.hh...ff.',
      'hhff.ffff',
      'hgffcfffd',
      'ffggffgfd',
      '.fffggfd.',
      '..ffgdd..',
      '...gdd...',
      '....d....',
    ],
    palette: { f: 'heart.stone.base', h: 'heart.stone.hi', d: 'heart.stone.dark', g: 'light.gold', c: 'light.core' },
    emissive: 'heart.stone.dark',
    lit: 'gc',
  },
  blood: {
    rows: [
      '.ff...ff.',
      'fhff.ffff',
      'ffrrfrrfd',
      'ffrrrrrfd',
      '.ffrrrfd.',
      '..ffrdd..',
      '...fdd...',
      '....d....',
    ],
    palette: { f: 'heart.blood.base', h: 'life.heart', r: 'life.heart', d: 'life.dark' },
    emissive: 'life.dark',
    lit: '',
  },
  star: {
    rows: [
      '.ff...ff.',
      'fhff.ffff',
      'ffffsfffd',
      'ffsssssfd',
      '.ffsssfd.',
      '..fsfsd..',
      '...fdd...',
      '....d....',
    ],
    palette: { f: 'light.ember', h: 'light.gold', s: 'light.core', d: 'light.dusk' },
    emissive: 'light.ember',
    lit: 's',
  },
  berserker: {
    rows: [
      '.bb...bb.',
      'gbeb.bebb',
      'bbbyyybbb',
      'eeyycyyee',
      '.bbyyybb.',
      '..bebeb..',
      '...beb...',
      '....e....',
    ],
    palette: { b: 'mat.obsidian.dark', g: 'mat.obsidian.hi', e: 'heart.berserker.ember', y: 'light.hot', c: 'light.core' },
    emissive: 'mat.obsidian.base',
    lit: 'eyc',
  },
};

/** The colour of a heart's particles when it is picked up or lost, and of its halo in the world. */
export const HEART_FX: Record<HeartKind, PalToken> = {
  red: 'life.heart',
  blue: 'heart.blue.base',
  black: 'heart.black.base',
  stone: 'light.gold',
  blood: 'life.heart',
  star: 'light.gold',
  berserker: 'heart.berserker.ember',
};

/** The frame round the screen while the berserker heart is held: an obsidian edge with an ember glow. */
export const BERSERKER_FRAME: { edge: PalToken; glow: PalToken } = { edge: 'mat.obsidian.dark', glow: 'heart.berserker.ember' };

/** The outline and vignette of the star heart's invulnerability. */
export const STAR_GLOW: PalToken = 'light.hot';
