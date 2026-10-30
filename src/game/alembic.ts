
import type { Polarity } from '../combat/polarity';
import type { Carried } from '../entities/player';
import type { Flask } from '../content/potions';
import { resolve } from '../content/recipes';
import type { GameBus } from './events';

export const BULB = 3;
export const BREWS = 3;
export const HIT_GAP = 0.6;

export interface Alembic {
  bulb: Carried[];
  brews: number;
  cool: number;
}

export type FeedResult = 'fed' | 'full' | 'cold';
export type HitResult = 'brew' | 'boil' | 'empty' | 'cold' | 'cool';

export function newAlembic(): Alembic {
  return { bulb: [], brews: BREWS, cool: 0 };
}

export function isCold(a: Alembic) {
  return a.brews <= 0;
}

export function feed(a: Alembic, item: Carried): FeedResult {
  if (isCold(a)) return 'cold';
  if (a.bulb.length >= BULB) return 'full';
  a.bulb.push(item);
  return 'fed';
}

export function hit(a: Alembic, polarity: Polarity): HitResult {
  if (a.cool > 0) return 'cool';
  a.cool = HIT_GAP;
  if (isCold(a)) return 'cold';
  if (!a.bulb.length) return 'empty';
  a.bulb = [];
  if (polarity === 'negative') return 'boil';
  a.brews--;
  return 'brew';
}

export function tick(a: Alembic, dt: number) {
  a.cool = Math.max(0, a.cool - dt);
}

export interface BrewOutcome { result: HitResult; flask: Flask | null }

export function brew(a: Alembic, polarity: Polarity, bus: GameBus, x: number, y: number, z: number): BrewOutcome {
  const contents = a.bulb.length;
  const flask = resolve(a.bulb);
  const result = hit(a, polarity);
  if (result !== 'brew') return { result, flask: null };
  bus.emit('brew', { potion: flask.potion, iced: !!flask.iced, contents, x, y, z });
  return { result, flask };
}
