import type { MessageKey } from '../i18n';
import type { Carried } from '../entities/player';
import type { ItemIcon } from '../items/types';
import { pal, type PalToken } from './palette';
import type { PartDef } from './parts';

export const POTION_IDS = ['plain-tonic', 'restoring-draught'] as const;
export type PotionId = (typeof POTION_IDS)[number];

export interface Flask { potion: PotionId }

export interface PotionDef {
  id: PotionId;
  heal: number;
  liquid: PalToken;
  name: MessageKey;
  effect: MessageKey;
}

export const POTIONS: Record<PotionId, PotionDef> = {
  'plain-tonic': { id: 'plain-tonic', heal: 4, liquid: 'bone.faded', name: 'potion.plain-tonic.name', effect: 'potion.plain-tonic.effect' },
  'restoring-draught': { id: 'restoring-draught', heal: 8, liquid: 'living.glow', name: 'potion.restoring-draught.name', effect: 'potion.restoring-draught.effect' },
};

export function isFlask(c: Carried): c is Flask {
  return typeof c === 'object' && 'potion' in c;
}

export function brewOf(bulb: readonly Carried[]): PotionId {
  const flesh = bulb.filter(c => typeof c === 'object' && !isFlask(c) && c.kind === 'flesh').length;
  return bulb.length === 2 && flesh === 2 ? 'restoring-draught' : 'plain-tonic';
}

export function flaskDef(f: Flask): Pick<PartDef, 'id' | 'icon' | 'color'> {
  return { id: `flask.${f.potion}`, icon: flaskIcon(f.potion), color: pal(POTIONS[f.potion].liquid) };
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
