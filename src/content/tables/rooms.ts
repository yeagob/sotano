// Structure tables for rooms: their mood and what fills their decor slots.
//
// Templates can mark tiles with slots that are rolled per room:
//   ?  maybe a crate          ~  maybe dirt, stone or ore          !  ore or obsidian (always solid)
// A room's mood biases how full those slots are; "reinforced" also swaps soft obstacles for
// harder materials inside the room (never the shared walls).

import { table, type Table } from '../../core/tables';

export type RoomMood = 'sparse' | 'normal' | 'cluttered' | 'reinforced';

/** Does a hostile floor keep a challenge room (three waves every time you enter)? */
export const CHALLENGE_ROOM = table<boolean>('challenge-room', 'structure', [
  { value: true, weight: 2 },
  { value: false, weight: 3 },
]);

export const ROOM_MOOD = table<RoomMood>('room-mood', 'structure', [
  { value: 'sparse', weight: 2 },
  { value: 'normal', weight: 5 },
  { value: 'cluttered', weight: 3 },
  { value: 'reinforced', weight: 2, minFloor: 2 },
]);

/** Material key or null (air), per slot character and mood. */
const slot = (name: string, entries: [string | null, number][]) =>
  table<string | null>(name, 'structure', entries.map(([value, weight]) => ({ value, weight })));

export const DECOR_SLOTS: Record<RoomMood, Record<'?' | '~' | '!', Table<string | null>>> = {
  sparse: {
    '?': slot('slot?-sparse', [['crate', 1], [null, 4]]),
    '~': slot('slot~-sparse', [['dirt', 1], [null, 4]]),
    '!': slot('slot!-sparse', [['ore', 3], ['obsidian', 1]]),
  },
  normal: {
    '?': slot('slot?-normal', [['crate', 1], [null, 1]]),
    '~': slot('slot~-normal', [['dirt', 2], ['stone', 1], ['ore', 1], [null, 2]]),
    '!': slot('slot!-normal', [['ore', 2], ['obsidian', 1]]),
  },
  cluttered: {
    '?': slot('slot?-cluttered', [['crate', 4], [null, 1]]),
    '~': slot('slot~-cluttered', [['dirt', 2], ['stone', 2], ['ore', 1], [null, 1]]),
    '!': slot('slot!-cluttered', [['ore', 1], ['obsidian', 1]]),
  },
  reinforced: {
    '?': slot('slot?-reinforced', [['stone', 2], [null, 1]]),
    '~': slot('slot~-reinforced', [['stone', 2], ['deepstone', 1], [null, 1]]),
    '!': slot('slot!-reinforced', [['obsidian', 2], ['ore', 1]]),
  },
};

/** "reinforced" rooms swap these obstacle materials for harder ones (interior only). */
export const REINFORCE: Record<string, string> = { dirt: 'stone', crate: 'stone', stone: 'deepstone' };
