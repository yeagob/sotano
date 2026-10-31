# Rooms (built)

Up: [levels](../README.md) · the room templates, the rules every room obeys, and the rooms that the player builds through.

A room is one cell of a floor's map (13 blocks by 7 inside, with a two-block wall shared with its neighbour), and it may spread into the empty cells beside it. The build has 86 room templates, chosen per cell by kind and by floor: starts, normal rooms, treasure rooms, vaults, bosses, the corridors of the Tree (paths) and two challenge rooms. A template is a picture of the room in blocks, with markers for the start, the pedestal, the key, the boss's hole and the doors. Every template passes a validator that enforces the house rules below before it may be used. The tests check the validator and the building rule on every hostile floor.

## The house rules

These hold for every room, because the validator refuses a template that breaks them.

- Three tiles in front of every door stay walkable, on the floor and in every layer under door height (3). Any room may get a door on any side.
- The centre tile stays open up to door height. Projections materialise there, where the player can see them.
- The pedestal (a practice's place) is reachable on foot, and nothing hangs within three blocks above it.
- The two-by-two shaft at the boss room's hole and the start room's landing stays clear in every flip and every layer.
- No water next to lava, and no flame next to something that burns: nothing reacts the moment the room is carved.
- Elements never sit on a door approach, in the centre or in the shaft. Doors, spawns and the way down are never hazards.
- Layers stand on a block or span between blocks; no single block floats. A flame on a layer needs a terrace under it exactly that high (a brazier on a pillar).
- Elements that hurt (lava, fire) are kept off the roots.
- Every room stays inside its band: height 5 to 8, pits at most 2 blocks deep, layers at heights 1 to the height minus 3 (see [levels](../README.md)).
- A start room never needs building; it always has a clear four-by-four centre.

## Building is the key

At least half of the fighting rooms with two or more doors need building on every hostile floor. This is tested per floor over many seeds. "Needs building" means the player cannot reach every door on foot from the centre without breaking a block, climbing a wall too tall to jump, or bridging a trench too wide to jump: isolated parts, trenches of three tiles or more, walls two blocks or higher, lava rivers to bridge. From the roots, where the lessons teach it step by step, to the bottom, the puzzles become more original and follow each floor's theme. Every building room carries its own soft blocks to build with.

## What makes a good room

1. One idea you can read at a glance, with no text: an island in lava, a bridge over deep water.
2. The elements are verbs, not decoration: every element room gives the player something to do with it.
3. Projections live in the room too: Doubt will not follow you into water, Panic calms in it and swells in fire.
4. Height means something: a gallery is a vantage point, a pit is a trap, a vault is awe.
5. The house rules hold: the validator checks them, and the reason is always the player's reading of the room.

## Documents

| Document | Contents |
|---|---|
| [TEMPLATES.md](TEMPLATES.md) | All 86 templates by kind, floors, height, ceiling, footprint and features; the rooms the player builds through |
| [ELEMENT-ROOMS.md](ELEMENT-ROOMS.md) | The 28 rooms where water, lava or fire is the protagonist, and what each asks of the player |
| [HEIGHT-AND-CEILINGS.md](HEIGHT-AND-CEILINGS.md) | Rooms taller than 5 blocks, the nine ceiling shapes, pits, dips, plateaus and layers |
| [MULTI-CELL.md](MULTI-CELL.md) | Rooms bigger than their cell: the twelve footprints, the home cell, and how space is allotted |
| [CHALLENGE.md](CHALLENGE.md) | Challenge rooms: three waves per visit, harder each time |
| [DOORS.md](DOORS.md) | Doors: their kinds, opening and sealing, locked vaults, hard walls, breakthroughs and door plugs |

Code: `src/content/rooms.ts` (the templates and the validator), `src/world/floor.ts` (carving, allotting space, doors), `src/world/floorplan.ts` (the plans the rooms fill), `src/content/tables/rooms.ts` (mood, challenge chance), `tests/levels.test.ts` (the building rule and the bands).
