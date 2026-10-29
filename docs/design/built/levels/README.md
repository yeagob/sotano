# Levels (built)

Up: [built](../README.md) · the world as the player can walk it: the thirteen places from the roots to heaven, and the rooms inside them.

The world is one stack of places. Ten underground floors go down from the roots (floor 0) into the layers of the unconscious, named after Dante's circles from floor 1 to 9, the ninth frozen. Below the ninth is silence, a sealed chamber that loops back to heaven. Above the surface a giant tree rises through the sky, built as seven stories you climb, and above its crown lies heaven. Each floor is a band of 16 blocks, and a room may never touch the floor above or below it.

Vertical rules that hold for every level (the validator and the tests enforce them):

- Floors are stacked 16 blocks apart. A room's interior is 5 to 8 blocks high (`MAX_ROOM_H` is 8) and its two brick layers sit above it, so no room reaches the floor above or below.
- Pools and dips dig at most 2 blocks into the floor. Deep pools get a brick lining.
- Three rock layers separate one band from the next. The tests carve every element room across every pair of bands and fail if any of that rock is air.
- Layers (single blocks above the floor) sit at heights 1 to height minus 3, leaving two blocks of headroom over anything you can stand on.
- The shaft between floors (the boss room's hole to the next start room) stays clear in every flip of the room.
- The surface has grass at height 167, dirt under it from 159 to 166, and open sky above it up to height 427 (`src/world/floor.ts`). No house stands on the surface. The open sky above the grass counts as depth 0 for anything that asks how deep the player is (`depthOf`).

Code: the floor structure in `src/world/floor.ts` and `src/world/floorplan.ts`, the level data in `src/content/levels.ts`, the giant tree in `src/world/tree.ts`, the silence and heaven loop in `src/game/game.ts`.

| Folder or document | Contents |
|---|---|
| [floors/](floors/README.md) | The ten underground floors: the roots, the Tree-of-Life floors, the circles, the silence chamber, the way down and the toll |
| [rooms/](rooms/README.md) | The room templates, their height and ceilings, rooms bigger than their cell, challenge rooms and doors |
| [giant-tree/](giant-tree/README.md) | The giant tree above the surface: seven stories, the trunk, the branches, the canopy and the stars |

What is designed and not built (the Tree's paths, the upper kinds of map, the climb from the roots, the ending) is in [not-built/levels](../../not-built/levels/README.md).
