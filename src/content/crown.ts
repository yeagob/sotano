// The Leaves: the room of the crown (docs/design/built/levels/giant-tree/LEAVES.md, owner decision D14 of #149:
// the Leaves are a room). It is a room template in the floors' grammar (src/content/rooms.ts), checked by the same
// validator, but it is never drawn by a floor's generator: the giant tree carves it once, in its canopy story,
// beside the last spiral stair (src/world/tree.ts, `leavesRoomAt`). The crown's materials stand in for the
// floors' palette: walls and ceiling of leaves, floor and trim of bough, and the ring of the centre in starstone.

import type { RoomTemplate } from './rooms';

/** The Leaves: a hall of leaves under a dome, a ring of starstone round its centre and an open eye in the dome over
 *  it, where the sky comes in. Idea: seeing the whole. Verb: climb, stand in the ring, look up. The only doorway is the
 *  west one, on the stair; the leaf walls give way to any hand that wants a window. */
export const LEAVES_ROOM: RoomTemplate = {
  id: 'crown-leaves',
  // validated as a normal room: every door approach and the centre stay open (it holds no fight)
  types: ['normal'],
  mirror: false,
  height: 8,
  ceiling: 'dome',
  rows: [
    '3.b.......b.3',
    '2...........2',
    '.....ooo.....',
    '.......o.....',
    '.....ooo.....',
    '2...........2',
    '3.b.......b.3',
  ],
};

/** The crown's palette for the template's pieces (the floors' `LevelDef.palette`): `#` and the shell are leaves,
 *  the floor and the terraces are bough, and `o` (obsidian in a floor) is starstone, the tree's fixed point. */
export const CROWN_PALETTE = { wall: 'leaves', floor: 'bough', trim: 'bough', ring: 'starstone' } as const;

/** Tiles of the dome's open eye, round the centre tile (6, 3): the sky comes in over the ring. */
export const LEAVES_OCULUS = 1;

/** The Leaves' gift (issue #316): the jump practice floats over the ring's east stone (column 7, row 3 of the
 *  template, a one-high block of starstone), facing the ring's open west side. A player standing in the ring takes
 *  it; with it the star pads above the crown are the climb to the sun. The centre tile stays free for the crown's
 *  place (`CROWN_PLACE`). */
export const LEAVES_GIFT = { item: 'triple-jump', col: 7, row: 3 } as const;
