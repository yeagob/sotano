import type { MessageKey } from '../i18n';
import type { Carried } from '../entities/player';
import type { ItemIcon, StatModSpec } from '../items/types';
import { pal, type PalToken, type PathName } from './palette';
import type { PartDef } from './parts';

export const POTION_IDS = [
  'plain-tonic', 'restoring-draught', 'footing-tincture', 'spring-tonic',
  'clear-infusion', 'questioning-tincture', 'ember-tonic', 'patient-draught',
  'meal-small', 'meal-hearty',
] as const;
export type PotionId = (typeof POTION_IDS)[number];

export interface Flask { potion: PotionId; iced?: true }

export type Duration =
  | { kind: 'instant' }
  | { kind: 'rooms'; rooms: number }
  | { kind: 'floor' };

export interface PotionDef {
  id: PotionId;
  path: PathName;
  liquid: PalToken;
  name: MessageKey;
  effect: MessageKey;
  duration: Duration;
  heal?: number;
  stats?: readonly StatModSpec[];
  locks?: number;
  /** Cooked in a kitchen, never brewed: it has no recipe. */
  meal?: true;
}

const INSTANT: Duration = { kind: 'instant' };
const FLOOR: Duration = { kind: 'floor' };
const ROOMS = (rooms: number): Duration => ({ kind: 'rooms', rooms });

type Extra = Pick<PotionDef, 'heal' | 'stats' | 'locks' | 'meal'>;

const potion = (id: PotionId, path: PathName, liquid: PalToken, duration: Duration, extra: Extra = {}): PotionDef =>
  ({ id, path, liquid, duration, name: `potion.${id}.name` as MessageKey, effect: `potion.${id}.effect` as MessageKey, ...extra });

export const POTIONS: Record<PotionId, PotionDef> = {
  'plain-tonic': potion('plain-tonic', 'body', 'bone.faded', INSTANT, { heal: 4 }),
  'restoring-draught': potion('restoring-draught', 'body', 'living.glow', INSTANT, { heal: 8 }),
  'footing-tincture': potion('footing-tincture', 'body', 'mat.deepstone.hi', ROOMS(3), { stats: [{ stat: 'kick', layer: 'mul', value: 1.5 }] }),
  'spring-tonic': potion('spring-tonic', 'body', 'mat.grass.hi', FLOOR, { stats: [{ stat: 'jump', layer: 'mul', value: 1.4 }] }),
  'clear-infusion': potion('clear-infusion', 'mind', 'el.water.surface', ROOMS(3), {
    stats: [{ stat: 'range', layer: 'mul', value: 1.3 }, { stat: 'shotSpeed', layer: 'mul', value: 1.2 }],
  }),
  'questioning-tincture': potion('questioning-tincture', 'mind', 'iron.hi', FLOOR, { locks: 1 }),
  'ember-tonic': potion('ember-tonic', 'will', 'el.ember.hot', ROOMS(3), { stats: [{ stat: 'fireRate', layer: 'mul', value: 1.3 }] }),
  // meals: cooked in a kitchen (game/kitchen.ts), eaten with the drink key like any flask
  'meal-small': potion('meal-small', 'body', 'bone.faded', INSTANT, { heal: 4, meal: true }),
  'meal-hearty': potion('meal-hearty', 'body', 'copper.base', INSTANT, { heal: 8, meal: true }),
  'patient-draught': potion('patient-draught', 'will', 'copper.base', FLOOR, { stats: [{ stat: 'mining', layer: 'mul', value: 1.6 }] }),
};

export function isFlask(c: Carried): c is Flask {
  return typeof c === 'object' && 'potion' in c;
}

export function flaskRooms(f: Flask): number {
  const d = POTIONS[f.potion].duration;
  return d.kind === 'rooms' ? d.rooms + (f.iced ? 1 : 0) : 0;
}

export function flaskDef(f: Flask): Pick<PartDef, 'id' | 'icon' | 'color'> {
  return { id: `flask.${f.potion}${f.iced ? '.iced' : ''}`, icon: flaskIcon(f.potion), color: pal(POTIONS[f.potion].liquid) };
}

export function carriedDef(c: PartDef | Flask): Pick<PartDef, 'id' | 'icon' | 'color'> {
  return isFlask(c) ? flaskDef(c) : c;
}

export function flaskIcon(potion: PotionId): ItemIcon {
  return {
    rows: [
      '............',
      '....oooo....',
      '.....oo.....',
      '.....oo.....',
      '....oggo....',
      '...ogllgo...',
      '..ogllllgo..',
      '..ogllllgo..',
      '..ogllllgo..',
      '..ogllllgo..',
      '...oggggo...',
      '....oooo....',
    ],
    palette: { o: pal('ink.void'), g: pal('bone.paper'), l: pal(POTIONS[potion].liquid) },
  };
}
