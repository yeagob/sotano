// Drink stacks for the nine practices of the drink family (docs/design/built/practices/STACKING.md).
// Each practice holds one copy's stacks; every drink of its kind adds one stack to that copy and
// toasts its `stack` message. A meal is a drink whose potion is `meal` in content/potions.ts.

import type { Params } from '../../i18n';
import { POTIONS } from '../potions';
import { hook, type HookSpec, type StatModSpec } from '../../items/types';

export type DrinkKind = 'potion' | 'meal' | 'any';

/** A percentage of a stack total, one decimal at most (0.05 per stack, 3 stacks: 15). */
export const pct = (n: number, perStack: number) => Math.round(n * perStack * 1000) / 10;
/** A plain amount of a stack total, two decimals at most (0.35 per stack, 3 stacks: 1.05). */
export const amt = (n: number, perStack: number) => Math.round(n * perStack * 100) / 100;

/** The drink hook: a drink of `kind` adds one stack to this copy and toasts `stack`. `params`
 *  gives the message's numbers from the new count (the count itself is always `n`). */
export function stackOnDrink(kind: DrinkKind, params: (n: number) => Params): HookSpec<'drink'> {
  return hook('drink', (e, api) => {
    if (!isDrinkOf(kind, e.potion)) return;
    const n = api.addStack(1);
    if (n > 0) api.toast('stack', { n, ...params(n) });
  }, { id: 'stack', priority: 60 });
}

function isDrinkOf(kind: DrinkKind, potion: string): boolean {
  if (kind === 'any') return true;
  const meal = POTIONS[potion as keyof typeof POTIONS]?.meal === true;
  return kind === 'meal' ? meal : !meal;
}

/** The stack def of a practice: `max` stacks, each adding `stats` once more. */
export const stackOf = (max: number, stats: StatModSpec[]) => ({ max, stats });
