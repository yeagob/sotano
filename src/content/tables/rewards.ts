// Runtime reward tables. Luck tilts them (Gratitude Journal, states of being…).

import { table } from '../../core/tables';
import type { PickupKind } from '../../game/events';

/** What a room leaves behind when its last projection dissolves (rolled per room). */
export const ROOM_CLEAR = table<PickupKind | null>('room-clear', 'runtime', [
  { value: 'heart', weight: 3, luck: 0.25 },
  { value: 'bomb', weight: 2, luck: 0.25 },
  { value: 'key', weight: 2, luck: 0.25 },
  { value: null, weight: 7 },
]);
