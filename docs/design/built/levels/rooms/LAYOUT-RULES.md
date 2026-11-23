# Layout rules: open corners

Up: [rooms](README.md) · Status: built (issue #115).

Projections rise on the open floor of a room, away from its doors and away from the player. In a room thirteen blocks by seven with a door in the middle of each wall, that means mostly the corners. The owner found that many of the older rooms had cubes in or near their corners: a projection rose behind them unseen, or in a pocket the player snagged on while chasing it, while the newer rooms read cleanly. This document gives the rules every room with projections now keeps, the audit of the rooms that broke them and how each was fixed, and the layouts added so that the same rooms repeat less.

## The owner's request

Redesign many of the layouts: some have cubes in the corners that hide projections spawning there, or make moving round the room awkward. The newer layouts are much better. Fix the old ones, and add new layouts that are more varied and more fun. Above all, more variety. (Owner, 2026-11-19, issue #115.)

## What the newer rooms did right

The rooms the owner liked (the circles' rooms, the paths of the Tree, the rooms bigger than their cell) share four habits, which the rules below make binding:

1. **One idea from wall to wall.** A trench between columns, a wall between rows, a lake, a gallery: the room reads in one glance, and the obstacles span the room instead of sitting in it as scattered cubes.
2. **The corners are either open floor or filled whole.** A stair of terraces, a pool, a tower, a pit fills a corner completely; nothing stands one tile off it.
3. **Tall things sit on the cross.** Pillars and columns stand on the row through the centre or flush against the north and south walls beside the doors, not between the centre and a corner.
4. **No decor slots strewn over the floor.** The rolled slots (`?`, `~`, `!`) are used in short lines and arcs, not as a field.

## The rules

They hold for every normal room, path, challenge room and boss room below the Roots. Rooms without projections (starts, treasure rooms, vaults) and the Roots themselves (floor 0 has no hostile projections, and its rooms are the book's lessons) are not held to them.

1. **No notch.** No open floor tile is closed on three or four sides by blocks, decor slots, the pedestal, rock or walls, at least one of them a block, slot or pedestal. A notch is where a projection rises hidden and where the player snags. Walls alone make the end of a corridor, which is in plain sight along it.
2. **Clear corners.** The corner zones are the three tiles from each side wall by the two tiles from the north or south wall, at each of the four corners of the room's space. No loose block (stone, crate, dirt, ore, obsidian) and no decor slot stands in a corner zone. A corner is open floor, or it is filled whole by a feature: terraces, a wall, water, lava, a pit, a dip. A run of blocks from wall to wall is a wall, not clutter (the crate walls of the rain).
3. **Corners in sight.** Every open floor tile of a corner zone that the player can walk to from the centre of its cell and back is in line of sight of that centre over anything lower than two blocks. A tile behind a wall you must build through, or on a ledge you can only drop onto, is a place of its own and answers to rules 1 and 2 only.

Where tall things may stand, in practice: on the row through the centre (columns 1 to 4 and 8 to 11), and flush against the north and south walls from column 3 or 4 inward, beside the door. Anything two blocks high in the triangle between the centre and a corner hides part of that corner.

The rules are checked for every template by `tests/layouts.test.ts`; a template that breaks one fails the build with the tile and the rule.

## The audit

Forty-eight templates broke at least one rule. Each kept its idea; what changed is where its blocks stand.

| Template | Problem | Fix |
|---|---|---|
| pillars | Four pillars two high near the corners hid them from the centre | Pillars on the cross: by the north and south doors and either side of the centre |
| crates | Crate stacks filled the corners; a ring of dirt round the key made two notches | Crate stacks against the north and south walls by the doors; the dirt ring opened into a cross |
| quarry | Ore, obsidian and dirt clusters in the corners; stone pairs hid them; notches by the key | Clusters against the north and south walls; tall stones on the cross, low ones by the centre |
| storeroom | Crates in the corners | The rows of crates start past the corners |
| garden | Decor slots in the corners, notches along the walls | Beds pulled in from the walls, corners open |
| rubble | Slots filled the corners, stones near them hid them, notches | Slots in arcs off the walls, low stones by the centre |
| veins | Ore slots in the corners, a dozen notches, brick columns in front of the west and east doors | Four short veins running in from off the walls; the columns removed |
| checker | A checkerboard of decor slots: forty notches and every corner filled | A lattice of slots two tiles apart, clear of the walls |
| ring | The ring of slots touched the corners; two pillars by the centre hid them | Ring pulled in; the stones by the centre lowered to one block |
| colonnade | Columns against the corners made notches; crate stacks hid the corners | One line of four columns on the cross; slots by the walls |
| arena (boss, small) | Pillars near the corners | Pillars on the cross, low stones off the corners |
| pit (boss, small) | Slots and stones in the corners, notches | Dips fill the four corners; pillars on the cross |
| hearth | Crate stacks in the four corners | Stacks along the north and south walls, still a kick from the flames |
| font | Braziers on pillars two high hid the corners | Braziers on plinths one block high |
| sluice | Crates and a slot in the corners | Crates line the west ledge; the slot moved inward |
| balcony | Stair pillars one tile off the corners made notches | The stairs fill the corners and carry the galleries |
| lava-bridge | A slot in a corner | Moved inward |
| warren | Rows of obsidian posts from wall to wall hid every corner | Posts by the doors and on the cross |
| crate-stacks | Stacks two high one tile off the corners | Stacks against the north and south walls by the doors |
| roofed-garden | Dirt beds in the corners under the canopy, notches | Beds past the corners |
| ore-vein | The veins ran into the corners, notches | Veins start off the walls |
| obsidian-maze | Maze walls from wall to wall hid every corner | Two long obsidian walls on the cross and low obsidian blocks (the room never needed building: both ends of its walls were open) |
| path-trench | Dirt in the corners | Dirt on the ledges in front of the west and east doors |
| path-wall | Dirt in the corners of the door strips | Dirt in the middle hall; the plugs are the strips' material |
| bulwarks | Dirt one tile off the corners | A step of two dirt blocks in front of each bulwark |
| nave | Stones in the corners of the ledges | Moved past the corners |
| gates | Stones and dirt in the strips' corners | Stones in the middle hall |
| abyss (boss, floor 5) | Stones in the corners; brazier pillars hid the far corners | Stones past the corners; braziers flank the practice |
| antechamber | Stones in the strips' corners, dirt in the far hall's corners | Stones removed from the strips; dirt moved inward |
| giants-well | Dirt and stones in the corners | Dirt on the ledges by the doors; stones past the corners |
| long-gallery | Dirt in the corners; columns hid them | Columns on the cross; dirt by the side walls |
| cloister | Columns at the garth's corners hid the room's corners; dirt in the corners | Columns removed, a clean garth; dirt beside the north and south doors |
| wind-hall | Dirt in the corners | Moved inward |
| stepped-well | Dirt one tile off the corners | Moved inward |
| drowned-nave | Crates one tile off the corners | Moved inward |
| strongroom | Stones in the corners; a maze of great blocks whose aisles were dead-end notches | A solid mass of great blocks with the key in a chamber at its heart (break or climb in); stones by the doors and on the cross |
| crown-hall (boss, floors 1–4) | Stones in the corners; pillars hid the far corners | Stones past the corners; one pillar on the cross east of the dais |
| caldera-hall (boss, floors 6–9) | Stones in the corners | Moved inward |
| chasm | Dirt one tile off the corners | Moved inward |
| dis-hall | Stones one tile off the corners | Moved inward |
| gauntlet (challenge) | Four pillars two high near the corners | Two pillars beside the centre; low stone walls off the corners |
| colosseum (challenge) | Stones one tile off the corners | Moved inward |
| limbo | Stones one tile off the corners | On the ledges by the doors |
| gale | Dirt one tile off the corners | A dirt block in front of each plug |
| weights | Dirt in the strips' corners | Dirt in the middle hall |
| tombs | Stones in the strips' corners | Stones in the middle hall |
| river | Stones one tile off the corners | On the ledges by the doors |
| cocytus | Stones in the north strip | Removed; the plugs are the material |

## The new layouts

Sixty-two templates were added (`src/content/room-layouts.ts`), fifty-three of them fighting rooms. Each one keeps the rules above. The fighting rooms, by the floors they appear on:

| Floors | Layouts |
|---|---|
| 1 to 9 | pier, ramparts, broken-bridge, dikes, trapdoors; the challenge rooms crossfire, pool-arena and bunkers |
| 1 to 6 | galleries, quad-pools, stepping-stones, mezzanine, atrium, bleachers, rafters, planters |
| 1 to 5 | pitfalls, chapel, mud-flats, split-level, runnels, potholes, curbs, trench-ring, wells; the soft walls barricades and brick-halls; aqueduct (two cells) |
| From 2 (fire) | rotunda, canals, watchtowers, pillared-hall, braziers, fire-lanes, trials, arches, twin-courts (two cells) to 9; hypostyle (two cells) to 6 |
| From 3 (water and lava) | forge, locks, quench and the lava-ring challenge to 9; causeway and flooded-cloister to 6; cistern-hall and lake-hall (two cells) to 5 |
| From 4 | lava-lake, boilers |
| From 5 | ember-hall (two cells) |
| The deep circles, 6 to 9 | ash-field, crypt, catacombs (two cells); ice-floes on 8 and 9 |

And for the other kinds: two starts (landing, court), three treasure rooms (enclosure, lantern-hall, crate-cache), two vaults (strongbox, vigil) and two bosses' halls of two cells (throne-hall on floors 2 to 4, ember-throne on 6 to 9; floor 5 keeps the great pit).

Fifteen of the new fighting rooms need building (pier, ramparts, broken-bridge, dikes, trapdoors, fire-lanes, trials, barricades, brick-halls, locks, quench, lava-lake, twin-courts, ember-hall, catacombs) and weigh three; the open arenas weigh one, and the simplest of them stay on the first five or six floors, so at least half of every floor's fighting rooms still need building. Some carry a chain for the player to find: in the locks, breaking a plug lets the flooded side hall in; in quench, breaking the obsidian lets the pool run into the lava and make the bridge; in the ramparts, the stair onto the wall is a way you cannot walk back.

## How many layouts

The issue left the count to the owner. The target set here is **double the fighting layouts of each band** before the issue, counting normal rooms, paths and challenge rooms (a template counts in every band its floors reach). The test holds the targets; the owner may change them.

| Band | Before | Target | Now |
|---|---|---|---|
| F1, floors 1–2 | 38 | 76 | 76 |
| F2, floors 3–4 | 48 | 96 | 96 |
| F3, floors 5–6 | 33 | 66 | 85 |
| F4, floors 7–9 | 19 | 38 | 47 |

Starts went from 3 to 5 on every floor, treasure rooms from 4–5 to 7–8, vaults from 1–2 to 3–4, and the two-cell bosses' halls from one per floor to two on floors 2 to 4 and 6 to 9.

Code: `src/content/rooms.ts` (`spawnPockets`, the fixed templates), `src/content/room-layouts.ts` (the new layouts), `tests/layouts.test.ts` (the rules and the counts). How projections choose where to rise: `pickSpawnCell` in `src/game/omens.ts`.
