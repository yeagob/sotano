// Every probability table in the game (validated by tests/rng.test.ts).

import type { Table } from '../../core/tables';
import { CHEST_CONTENTS } from './chests';
import { QUIET_ROOM, ROSTER } from './enemies';
import { ROCK_THEME } from './floors';
import { DECOR_SLOTS, ROOM_MOOD } from './rooms';
import { ROOM_CLEAR } from './rewards';

export const ALL_TABLES: readonly Table<unknown>[] = [
  ROOM_CLEAR, ROSTER, QUIET_ROOM, ROOM_MOOD, ROCK_THEME, CHEST_CONTENTS,
  ...Object.values(DECOR_SLOTS).flatMap(m => Object.values(m)),
] as Table<unknown>[];
