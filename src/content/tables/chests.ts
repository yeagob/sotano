// Placeholder for chest contents (elements plan, step E1). Runtime-rolled per chest when opened.

import { table } from '../../core/tables';
import type { PickupKind } from '../../game/events';

export const CHEST_CONTENTS = table<PickupKind | 'item'>('chest', 'runtime', [
  { value: 'key', weight: 3, luck: 0.2 },
  { value: 'bomb', weight: 3, luck: 0.2 },
  { value: 'heart', weight: 3, luck: 0.2 },
  { value: 'item', weight: 1, luck: 0.5 },
]);
