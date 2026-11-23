import type { MessageKey } from '../i18n';
import type { Carried } from '../entities/player';
import type { ItemIcon, StatModSpec } from '../items/types';
import { pal, type PalToken, type PathName } from './palette';
import type { PartDef } from './parts';

export const POTION_IDS = [
  'plain-tonic', 'restoring-draught', 'footing-tincture', 'spring-tonic',
  'clear-infusion', 'questioning-tincture', 'ember-tonic', 'patient-draught',
  'meal-small', 'meal-hearty', 'berserker-draught', 'rebirth-draught',
  'mending-tonic', 'full-restoring-draught',
  'nimble-tincture', 'nimble-cordial', 'nimble-elixir',
  'lucid-tincture', 'lucid-cordial', 'lucid-elixir',
  'tender-tincture', 'tender-cordial', 'tender-elixir',
  'steadfast-tincture', 'steadfast-cordial', 'steadfast-elixir',
  'echo-draught',
  'stride-tonic', 'folding-tincture',
] as const;
export type PotionId = (typeof POTION_IDS)[number];

export interface Flask { potion: PotionId; iced?: true; echo?: string }

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
  berserk?: true;
  /** Cooked in a kitchen, never brewed: it has no recipe. */
  meal?: true;
  /** Drinking it asks first, then starts a new run keeping the practices in hand (game.ts; never in the sandbox). */
  rebirth?: true;
  echo?: true;
}

const INSTANT: Duration = { kind: 'instant' };
const FLOOR: Duration = { kind: 'floor' };
const ROOMS = (rooms: number): Duration => ({ kind: 'rooms', rooms });

type Extra = Pick<PotionDef, 'heal' | 'stats' | 'locks' | 'meal' | 'berserk' | 'rebirth' | 'echo'>;

const mul = (stat: StatModSpec['stat'], value: number): StatModSpec => ({ stat, layer: 'mul', value });
const add = (stat: StatModSpec['stat'], value: number): StatModSpec => ({ stat, layer: 'add', value });

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
  'berserker-draught': potion('berserker-draught', 'will', 'heart.berserker.ember', ROOMS(2), { berserk: true }),
  'rebirth-draught': potion('rebirth-draught', 'mind', 'path.milagros.glow', INSTANT, { rebirth: true }),
  'mending-tonic': potion('mending-tonic', 'body', 'bone.dim', INSTANT, { heal: 6 }),
  'full-restoring-draught': potion('full-restoring-draught', 'body', 'heart.blood.base', INSTANT, { heal: 12 }),
  'nimble-tincture': potion('nimble-tincture', 'body', 'path.body.base', ROOMS(2), { stats: [mul('moveSpeed', 1.2)] }),
  'nimble-cordial': potion('nimble-cordial', 'body', 'path.body.glow', ROOMS(3), { stats: [mul('moveSpeed', 1.3)] }),
  'nimble-elixir': potion('nimble-elixir', 'body', 'path.body.dark', FLOOR, { stats: [mul('moveSpeed', 1.3), mul('jump', 1.2)] }),
  'lucid-tincture': potion('lucid-tincture', 'mind', 'path.mind.base', ROOMS(2), { stats: [mul('shotSpeed', 1.2)] }),
  'lucid-cordial': potion('lucid-cordial', 'mind', 'path.mind.glow', ROOMS(3), { stats: [mul('shotSpeed', 1.3)] }),
  'lucid-elixir': potion('lucid-elixir', 'mind', 'path.mind.dark', FLOOR, { stats: [mul('shotSpeed', 1.3), mul('range', 1.2)] }),
  'tender-tincture': potion('tender-tincture', 'emotion', 'path.emotion.base', ROOMS(2), { stats: [add('luck', 0.5)] }),
  'tender-cordial': potion('tender-cordial', 'emotion', 'path.emotion.glow', ROOMS(3), { stats: [add('luck', 1)] }),
  'tender-elixir': potion('tender-elixir', 'emotion', 'path.emotion.dark', FLOOR, { stats: [add('luck', 1), mul('invuln', 1.2)] }),
  'steadfast-tincture': potion('steadfast-tincture', 'will', 'path.will.base', ROOMS(2), { stats: [mul('damage', 1.2)] }),
  'steadfast-cordial': potion('steadfast-cordial', 'will', 'path.will.glow', ROOMS(3), { stats: [mul('damage', 1.3)] }),
  'steadfast-elixir': potion('steadfast-elixir', 'will', 'path.will.dark', FLOOR, { stats: [mul('damage', 1.3), mul('fireRate', 1.2)] }),
  'echo-draught': potion('echo-draught', 'mind', 'path.milagros.base', ROOMS(2), { echo: true }),
  'stride-tonic': potion('stride-tonic', 'body', 'path.body.glow', ROOMS(3), { stats: [{ stat: 'run', layer: 'add', value: 1 }] }),
  'folding-tincture': potion('folding-tincture', 'body', 'mat.dirt.hi', ROOMS(3), { stats: [{ stat: 'crouch', layer: 'add', value: 1 }] }),
};

export function isFlask(c: Carried): c is Flask {
  return typeof c === 'object' && 'potion' in c;
}

export function flaskRooms(f: Flask): number {
  const d = POTIONS[f.potion].duration;
  return d.kind === 'rooms' ? d.rooms + (f.iced ? 1 : 0) : 0;
}

export function flaskDef(f: Flask): Pick<PartDef, 'id' | 'icon' | 'color'> {
  return { id: `flask.${f.potion}${f.echo ? `.${f.echo}` : ''}${f.iced ? '.iced' : ''}`, icon: flaskIcon(f.potion), color: pal(POTIONS[f.potion].liquid) };
}

export function carriedDef(c: PartDef | Flask): Pick<PartDef, 'id' | 'icon' | 'color'> {
  return isFlask(c) ? flaskDef(c) : c;
}

/** The kitchen's meals are food, not bottles (issue #291): a chicken drumstick for the flesh meal, a bowl of soup for the hearty one. */
const MEAL_ICONS: Partial<Record<PotionId, ItemIcon>> = {
  'meal-small': {
    rows: [
      '............',
      '........bbb.',
      '........bbb.',
      '...ccccbbb..',
      '..chhcccbb..',
      '.chhccccc...',
      '.hccccccd...',
      '.ccccccccd..',
      '.ccccccccd..',
      '.cccccccd...',
      '..ccccdd....',
      '............',
    ],
    palette: { b: pal('bone.paper'), c: pal('copper.base'), h: pal('copper.hi'), d: pal('copper.dark') },
  },
  'meal-hearty': {
    rows: [
      '............',
      '............',
      '.wwwwwwwwww.',
      '.wssgsssgsw.',
      '..wssssssw..',
      '..wkkkkkkw..',
      '...kkkkkk...',
      '....kkkk....',
      '...kkkkkk...',
      '..kkkkkkkk..',
      '............',
      '............',
    ],
    palette: { w: pal('limestone.hi'), k: pal('limestone.base'), s: pal('copper.dark'), g: pal('mat.grass.hi') },
  },
};

export function flaskIcon(potion: PotionId): ItemIcon {
  const meal = MEAL_ICONS[potion];
  if (meal) return meal;
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
