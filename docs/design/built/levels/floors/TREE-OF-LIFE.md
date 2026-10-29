# The Tree-of-Life floors (floors 1 to 5)

Up: [floors](README.md) · Status: built.

The first five circles are laid out as the Tree of Life: ten emanation rooms on three pillars, joined by corridors. Each floor is bigger, more themed and more complex than the one above, its rooms built from its own materials. The fifth is the last of them and ends in a great pit that leads down to the random floors.

## The map

The Tree is a fixed grid of seven by seven cells. The map of one floor is the ten emanations and the paths between them. Read it north to south, row by row; a dot is an empty cell:

| Row (north first) | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 1 | · | · | · | K | · | · | · |
| 2 | · | B | + | + | + | C | · |
| 3 | · | + | · | + | · | + | · |
| 4 | · | G | + | T | + | M | · |
| 5 | · | + | · | + | · | + | · |
| 6 | · | O | + | Y | + | N | · |
| 7 | · | · | + | L | + | · | · |

Row 1 is the crown's side and row 7 the kingdom's side; columns run west to east.

- **L, the kingdom.** The start room, where you land, at the south of the map.
- **K, the crown.** The boss room and the way down, at the north.
- **T, the heart.** The treasure room, at the centre.
- **Y, the foundation.** The vault, a locked room with its practice behind a key (on floors 1 to 5, all of which keep vaults).
- **B, C, G, M, O, N.** Emanation rooms, normal rooms that hold projections.
- **+, the paths.** Corridor cells between the emanations.

Every two cells that touch are joined, so the Tree has loops, as the Tree of Life does. The map is deterministic: the same on every run. Only the rooms in it vary, through the templates that each cell may take.

## Mirrored floors

Floors alternate north and south: floor 1 is one way up, floor 2 is the other, and so on. So the crown of one floor lies over the kingdom of the next, and the way down of each floor lands in the start room below it.

## How the rooms grow

- The cells of the map are the room's place on the map. A room may spread into the empty cells beside it (see [rooms/MULTI-CELL](../rooms/MULTI-CELL.md)), so a floor grows its rooms without changing the map.
- Templates are chosen by the floor range each one names. Lava first appears on floor 3, fire on floor 2 (see [ELEMENT-ROOMS](../rooms/ELEMENT-ROOMS.md)).
- The number of projections a normal room holds grows with its open floor and with the floor's depth.
- A floor may hold one challenge room (see [rooms/CHALLENGE](../rooms/CHALLENGE.md)). On the Tree floors it takes an ordinary one-cell normal room, a dead end when the map has one, never a room next to the start.

## The great pit (floor 5)

Floor 5 is the last Tree floor. Its crown spreads into the empty cell beside it, so the boss room is two cells wide, and its way down is a four-by-four shaft under the room, not the two-by-two shaft of the floors above. The shaft lands in the centre of the start room of the floor below, which keeps it clear. Its room template is the great pit, a hall two rooms long with still water and braziers, and the crown's practice at the far end.

On floors 1 to 4 the boss room (the crown) is a dome-shaped hall with its practice on a dais, and the way down is a two-by-two shaft.

## The Tree's rules as built

- The floors are carved by the same rules as every floor: height up to 8, pits up to 2 deep, rock between bands, the shaft clear (see [levels](../README.md)).
- Half the fighting rooms with two or more doors need building on every hostile floor (tested).
- Its paths are always open: every adjacent pair of cells is joined. Variation in which paths are open, locked or hidden is not built (see [TREE-PATHS](../../../not-built/levels/TREE-PATHS.md)).

Code: `src/world/floorplan.ts` (the Tree layout, the mirroring, the wide crown), `src/world/floor.ts` (the great pit's four-by-four shaft, the floor's vault), `src/content/levels.ts` (the circles, palettes and rock of floors 1 to 5), `src/content/rooms.ts` (the templates by floor).
