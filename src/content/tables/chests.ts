// Chests (docs/design/CHESTS.md): how many keys one costs (decided at carve time, so a seed
// always gives the same locks) and what a free-standing one holds (rolled when opened).

import { table } from '../../core/tables';
import type { PickupKind } from '../../game/events';

/** Keys a chest asks for. Some open for free; deeper floors ask for more (and spend them all). */
export const CHEST_LOCK = table<number>('chest-lock', 'structure', [
  { value: 0, weight: 5 },
  { value: 1, weight: 5 },
  { value: 2, weight: 2, minFloor: 2 },
  { value: 3, weight: 1, minFloor: 5 },
]);

/** What a free-standing chest holds: one to three rolls of this table. */
export const CHEST_CONTENTS = table<PickupKind | 'item'>('chest', 'runtime', [
  { value: 'key', weight: 3, luck: 0.2 },
  { value: 'bomb', weight: 3, luck: 0.2 },
  { value: 'heart', weight: 3, luck: 0.2 },
  { value: 'item', weight: 1, luck: 0.5 },
]);

/** Share of a floor's treasure and vault practices that sit inside a chest instead of in the open. */
export const ITEM_IN_CHEST = 0.6;
/** Chance a normal room holds a free-standing chest. */
export const ROOM_CHEST = 0.4;
