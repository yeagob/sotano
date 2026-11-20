# Room templates

Up: [rooms](README.md) · Status: built.

The build's 149 templates in six kinds, and the rooms of the floors that they fill. Each template lists the floors it may appear on (blank floors mean every floor), its height and ceiling (flat when none is given), its footprint in cells, its weight among templates of its kind, and what it features.

## Kinds

| Kind | Templates | Meaning |
|---|---|---|
| Start | 6 | Where you land on a floor; never needs building |
| Normal | 83 | A room with projections and doors, on its own |
| Normal or path | 31 | A normal room, or a corridor of the Tree between two emanations |
| Path | 1 | A corridor only (the ford) |
| Treasure | 9 | Holds the floor's practice on a pedestal (or in a chest) |
| Boss | 9 | Holds the way down (the hole) and the boss's practice; below the roots always a two-cell room ([MULTI-CELL](MULTI-CELL.md#boss-rooms-are-always-large)) |
| Vault | 4 | A locked room; its shell is obsidian; on floors 1 to 5 only |
| Challenge | 6 | Three waves per visit, repeatable |

Weights decide how often a template is chosen among the templates of its kind on a floor. A template with no weight counts once; the lesson rooms of the roots (except the gift) and several of the building rooms count three times or twice. Bigger rooms are chosen more often on the deeper floors (see [MULTI-CELL](MULTI-CELL.md)). Four templates keep their orientation and are never mirrored: the great pit, the antechamber, the giant well and the catacombs. Every other template may be mirrored on X or Z, so the same picture serves several rooms.

On floors 6 to 9 a vault template becomes a normal room, so the vault kind is in play on floors 1 to 5 only.

## Features

- **layers**: single blocks above the floor, as bridges, balconies and galleries.
- **terraces**: stacks of brick one to four high, as stairs and tiers.
- **pit**: a hole two blocks deep, or a plateau around one.
- **dip**: a dry hollow one block deep.
- **element**: water, lava or fire on the floor or a layer (see [ELEMENT-ROOMS](ELEMENT-ROOMS.md)).
- **door-plug**: a door-shaped plug of dirt in a wall that seals a room, showing where a door would be (see [DOORS](DOORS.md)).
- **crates**, **ore**, **stone**: blocks the player can carry, break or build with.

The roots (floor 0) are the eleven lesson templates, marked `0`. They are described with the roots in [ROOTS](../floors/ROOTS.md).

## The catalogue

| Template | Kind | Floors | Height, ceiling | Footprint | Weight | Features |
|---|---|---|---|---|---|---|
| entrance | start | all | 5 | 1×1 | 1 | crates |
| hall | start | all | 5 | 1×1 | 1 | - |
| pillars | normal | 1–4 | 5 | 1×1 | 1 | stone |
| crates | normal | 1–4 | 5 | 1×1 | 1 | crates |
| quarry | normal | 1–4 | 5 | 1×1 | 1 | ore, stone |
| split | normal | 1–5 | 5 | 1×1 | 3 | door-plug |
| storeroom | normal | 1–4 | 5 | 1×1 | 1 | crates |
| garden | normal | 1–4 | 5 | 1×1 | 1 | - |
| rubble | normal | 1–4 | 5 | 1×1 | 1 | stone |
| veins | normal | 1–4 | 5 | 1×1 | 1 | - |
| checker | normal | 1–4 | 5 | 1×1 | 1 | - |
| ring | normal | 1–4 | 5 | 1×1 | 1 | stone |
| colonnade | normal | 1–4 | 5 | 1×1 | 1 | - |
| shrine | treasure | all | 5 | 1×1 | 1 | - |
| altar | treasure | all | 5 | 1×1 | 1 | stone |
| nook | treasure | all | 5 | 1×1 | 1 | - |
| arena | boss | all | 5 | 1×1 | 1 | stone |
| pit | boss | all | 5 | 1×1 | 1 | dip, stone |
| cache | vault | all | 5 | 1×1 | 1 | crates |
| cistern | normal | 1–6 | 8 vault-x | 1×1 | 1 | layers, terraces, element |
| hearth | normal | 2–9 | 6 vault-z | 1×1 | 1 | element, crates, stone |
| moat | normal | 3–9 | 7 dome | 1×1 | 1 | element |
| steam | normal | 3–9 | 6 | 1×1 | 1 | element |
| terraces | normal | 1–5 | 8 | 1×1 | 1 | layers, terraces, element |
| font | normal | 1–5 | 8 dome | 1×1 | 1 | layers, terraces, element |
| crossing | normal | 1–5 | 7 vault-z | 1×1 | 1 | layers, terraces, element |
| sluice | normal | 1–4 | 6 | 1×1 | 1 | pit, crates |
| balcony | normal | 2–5 | 6 vault-z | 1×1 | 2 | layers, terraces |
| lava-bridge | normal | 3–5 | 7 cave | 1×1 | 1 | layers, element, crates |
| sunken-court | normal | 1–4 | 6 | 1×1 | 1 | pit, crates |
| warren | normal | 2–5 | 7 cave | 1×1 | 1 | ore |
| cave-lake | normal | 3–5 | 8 cave | 1×1 | 1 | element, stone |
| crate-stacks | normal | 1–3 | 6 stepped | 1×1 | 2 | crates |
| roofed-garden | normal | 2–5 | 6 vault-z | 1×1 | 1 | layers, terraces |
| dig-field | normal | 1–4 | 6 | 1×1 | 1 | dip |
| ore-vein | normal | 1–5 | 6 | 1×1 | 1 | ore |
| obsidian-maze | normal | 4–5 | 8 pointed-x | 1×1 | 1 | - |
| spring | treasure | all | 7 dome | 1×1 | 1 | element |
| reliquary | vault | 3–9 | 7 vault-x | 1×1 | 1 | layers, terraces, element |
| caldera | boss | 3–9 | 8 dome | 1×1 | 1 | layers, terraces, element |
| well | start | all | 7 vault-x | 1×1 | 1 | element |
| roots-hall | start | 0 | 5 | 1×1 | 1 | - |
| roots-dig | normal | 0 | 5 | 1×1 | 3 | door-plug |
| roots-step | normal | 0 | 5 | 1×1 | 3 | terraces |
| roots-pit | normal | 0 | 5 | 1×1 | 3 | pit |
| roots-bridge | normal | 0 | 6 | 1×1 | 3 | pit |
| roots-crates | normal | 0 | 5 | 1×1 | 1 | crates |
| roots-seal | normal | 0 | 6 | 1×1 | 3 | door-plug |
| roots-mend | normal | 0 | 5 | 1×1 | 1 | - |
| roots-spring | normal | 0 | 7 dome | 1×1 | 1 | element |
| roots-gift | treasure | 0 | 6 vault-x | 1×1 | 1 | terraces |
| roots-door | boss | 0 | 7 dome | 1×1 | 1 | - |
| path-trench | path or normal | 1–9 | 5 | 1×1 | 3 | pit |
| path-wall | path or normal | 1–9 | 7 | 1×1 | 3 | door-plug |
| path-span | path or normal | 3–9 | 7 vault-z | 1×1 | 3 | layers, terraces, element |
| path-ford | path | 1–9 | 6 | 1×1 | 1 | element |
| path-coals | path or normal | 3–9 | 5 | 1×1 | 3 | element, stone |
| bulwarks | normal | 1–4 | 6 | 1×1 | 3 | terraces |
| nave | normal or path | 1–5 | 7 vault-z | 1×1 | 3 | pit, stone |
| gates | normal | 4–9 | 7 vault-x | 1×1 | 3 | pit, door-plug, stone |
| abyss | boss | 5 | 8 vault-x | 2×1 | 1 | layers, terraces, element, stone |
| antechamber | normal | 6–9 | 7 | 2×1 | 3 | element, stone |
| giants-well | normal | 7–9 | 8 dome | 1×2 | 3 | pit, door-plug, stone |
| long-gallery | normal or path | 1–3 | 8 pointed-x | 2×1 | 2 | pit, terraces |
| cloister | normal or path | 1–2 | 7 cross | 1×1 | 2 | pit |
| wind-hall | normal or path | 2–3 | 8 cross | 2×1 | 2 | terraces, door-plug |
| stepped-well | normal or path | 2–4 | 8 stepped | 1×2 | 2 | pit, terraces |
| drowned-nave | normal or path | 3–4 | 8 vault-x | 2×1 | 2 | layers, terraces, element, crates, stone |
| strongroom | normal or path | 4–5 | 7 stepped | 2×1 | 2 | terraces, stone |
| styx-cavern | normal or path | 5–6 | 7 cave | 2×1 | 2 | dip, element |
| crown-hall | boss | 1–4 | 8 dome | 2×1 | 2 | terraces, stone |
| caldera-hall | boss | 6–9 | 8 dome | 2×1 | 1 | layers, terraces, element, stone |
| chasm | normal or path | 6–9 | 8 cave | 1×2 | 3 | pit, terraces |
| dis-hall | normal or path | 6–7 | 7 pointed-x | 2×1 | 2 | element, stone |
| bastions | normal or path | 1–5 | 8 pointed-z | 1×1 | 1 | pit, terraces |
| gauntlet | challenge | 1–9 | 6 dome | 1×1 | 1 | stone |
| colosseum | challenge | 1–9 | 7 vault-x | 1×1 | 1 | pit, stone |
| limbo | normal | 1–2 | 6 | 1×1 | 3 | pit, stone |
| gale | normal | 2–3 | 8 vault-x | 1×1 | 3 | layers, door-plug |
| downpour | normal | 3–4 | 5 | 1×1 | 3 | element, crates |
| weights | normal | 4–5 | 7 | 1×1 | 3 | door-plug |
| marsh | normal | 5–6 | 7 dome | 1×1 | 1 | element |
| tombs | normal | 6–7 | 6 vault-z | 1×1 | 3 | element, door-plug, stone |
| river | normal | 7–8 | 7 | 1×1 | 3 | element, stone |
| ditches | normal | 8–9 | 6 | 1×1 | 3 | pit, stone |
| cocytus | normal | 9 | 8 dome | 1×1 | 3 | element, door-plug, stone |
| islet | treasure | 3–9 | 7 dome | 1×1 | 1 | element |
| rotunda | normal | 2–9 | 7 dome | 1×1 | 1 | terraces |
| galleries | normal or path | 1–6 | 8 vault-x | 1×1 | 1 | layers, terraces |
| pier | normal or path | 1–9 | 6 | 1×1 | 3 | pit |
| quad-pools | normal | 1–6 | 6 vault-z | 1×1 | 1 | element |
| ramparts | normal | 1–9 | 6 | 1×1 | 3 | terraces, door-plug |
| stepping-stones | normal or path | 1–6 | 6 | 1×1 | 1 | pit |
| mezzanine | normal | 1–6 | 8 cross | 1×1 | 1 | layers, terraces |
| broken-bridge | normal or path | 1–9 | 7 vault-z | 1×1 | 3 | layers, terraces, pit |
| atrium | normal | 1–6 | 7 dome | 1×1 | 1 | terraces, element |
| pitfalls | normal | 1–5 | 6 | 1×1 | 1 | pit |
| chapel | normal | 1–5 | 6 vault-z | 1×1 | 1 | - |
| canals | normal or path | 2–9 | 6 vault-x | 1×1 | 1 | element |
| watchtowers | normal | 2–9 | 8 pointed-z | 1×1 | 1 | terraces |
| dikes | normal | 1–9 | 6 | 1×1 | 3 | element, stone |
| trapdoors | normal or path | 1–9 | 6 | 1×1 | 3 | pit |
| pillared-hall | normal | 2–9 | 8 cross | 1×1 | 1 | - |
| mud-flats | normal | 1–5 | 6 | 1×1 | 1 | dip, element |
| split-level | normal | 1–5 | 6 vault-x | 1×1 | 1 | terraces |
| runnels | normal | 1–5 | 6 | 1×1 | 1 | element |
| potholes | normal | 1–5 | 5 | 1×1 | 1 | dip |
| curbs | normal | 1–5 | 6 vault-z | 1×1 | 1 | terraces |
| trench-ring | normal | 1–5 | 6 dome | 1×1 | 1 | dip |
| bleachers | normal | 1–6 | 7 vault-x | 1×1 | 1 | terraces |
| wells | normal | 1–5 | 6 | 1×1 | 1 | pit |
| rafters | normal | 1–6 | 8 vault-x | 1×1 | 1 | layers, stone |
| braziers | normal | 2–9 | 7 cross | 1×1 | 1 | layers, terraces, element, crates |
| fire-lanes | normal or path | 2–9 | 6 | 1×1 | 3 | element |
| trials | normal | 2–9 | 6 | 1×1 | 3 | pit, door-plug |
| arches | normal | 2–9 | 8 pointed-x | 1×1 | 1 | layers, terraces |
| barricades | normal | 1–5 | 6 | 1×1 | 3 | crates |
| brick-halls | normal | 1–5 | 6 | 1×1 | 3 | door-plug |
| planters | normal | 1–6 | 6 vault-z | 1×1 | 1 | dip |
| forge | normal | 3–9 | 7 vault-z | 1×1 | 1 | element |
| locks | normal | 3–9 | 7 | 1×1 | 3 | element, door-plug |
| quench | normal or path | 3–9 | 7 | 1×1 | 3 | element |
| causeway | normal or path | 3–6 | 8 vault-z | 1×1 | 1 | element |
| flooded-cloister | normal | 3–6 | 7 cross | 1×1 | 1 | element |
| lava-ring | challenge | 3–9 | 7 dome | 1×1 | 1 | element |
| lava-lake | normal or path | 4–9 | 7 cave | 1×1 | 3 | element |
| boilers | normal | 4–9 | 7 vault-x | 1×1 | 1 | element |
| ash-field | normal | 6–9 | 6 cave | 1×1 | 1 | dip, element |
| crypt | normal | 6–9 | 6 vault-z | 1×1 | 1 | layers, terraces, element |
| ice-floes | normal | 8–9 | 7 dome | 1×1 | 1 | element |
| crossfire | challenge | 1–9 | 7 vault-x | 1×1 | 1 | - |
| pool-arena | challenge | 1–9 | 7 dome | 1×1 | 1 | element |
| bunkers | challenge | 1–9 | 6 | 1×1 | 1 | - |
| twin-courts | normal or path | 2–9 | 7 | 2×1 | 3 | element, door-plug, stone |
| hypostyle | normal or path | 2–6 | 8 cross | 2×1 | 1 | - |
| aqueduct | normal or path | 1–5 | 8 vault-x | 2×1 | 1 | element, stone |
| cistern-hall | normal or path | 3–5 | 8 vault-x | 2×1 | 1 | element |
| lake-hall | normal or path | 3–5 | 8 cave | 1×2 | 1 | element |
| ember-hall | normal or path | 5–9 | 8 pointed-x | 2×1 | 3 | element |
| catacombs | normal | 6–9 | 7 | 1×2 | 3 | element, door-plug, stone |
| landing | start | all | 8 vault-z | 1×1 | 1 | layers, terraces |
| court | start | all | 7 dome | 1×1 | 1 | terraces, element |
| enclosure | treasure | all | 6 vault-x | 1×1 | 1 | terraces |
| lantern-hall | treasure | 2–9 | 7 cross | 1×1 | 1 | layers, terraces, element |
| crate-cache | treasure | all | 6 | 1×1 | 1 | crates |
| strongbox | vault | all | 6 vault-x | 1×1 | 1 | crates |
| vigil | vault | 2–9 | 6 | 1×1 | 1 | layers, terraces, element |
| throne-hall | boss | 2–4 | 8 pointed-x | 2×1 | 1 | layers, terraces, element, stone |
| ember-throne | boss | 6–9 | 8 cave | 2×1 | 1 | element, stone |

"All" means every floor. The roots draw only from their own eleven templates.

## The rooms the player builds through

Each of these makes the player use blocks: a gap to bridge, a wall to climb, a pit to drop into and build out of. The verb is the design's reading of the room.

| Template | Floors | What the player does |
|---|---|---|
| sluice | 1–4 | Kick or carry the crates into the channel that cuts the hall, and build across |
| balcony | 2–5 | Build up to the galleries and fight from above |
| sunken-court | 1–4 | Build across the east pit from the crates on the west |
| warren | 2–5 | Fight between the obsidian pillars; break the ore for blocks |
| crate-stacks | 1–3 | Carry the crates into walls and stairs |
| roofed-garden | 2–5 | Dig the beds; build up under the canopy |
| dig-field | 1–4 | Dig down and up between the mounds |
| ore-vein | 1–5 | Break the veins for blocks |
| long-gallery | 1–3 | Jump the pillars; drop to the key and build your way out |
| cloister | 1–2 | Fight from the walk; whatever falls into the garth builds out |
| bastions | 1–5 | Climb the stair for a vantage; knock projections into the holes |
| wind-hall | 2–3 | Dig the plugs or climb the walls |
| stepped-well | 2–4 | Jump the rim, drop to the key, build out |
| strongroom | 4–5 | Break or climb your way to the key |
| chasm | 6–9 | Jump the bridge of pillars; drop and build out |
| giants-well | 7–9 | Build across, climb down, build out |
| pier | 1–9 | Bridge the dry dock from the east or west ledge |
| ramparts | 1–9 | Climb the stair onto a wall and drop beyond it; there is no way back up |
| broken-bridge | 1–9 | Finish the bridge over the pit |
| dikes | 1–9 | Break or climb the stone walls |
| trapdoors | 1–9 | Bridge the wide pits to the north and south doors |
| trials | 2–9 | Dig the brick wall's plug, bridge the trench, or dig the obsidian wall's plug: a different trial at each door |
| barricades, brick-halls | 1–5 | Break, burn or climb the crate walls; dig the brick walls' plugs |
| twin-courts, catacombs | 2–9, 6–9 | Dig the plug into the far court or the crypt |
| ember-hall | 5–9 | Bridge the lava to the key's island |
| gauntlet, colosseum, and the new challenge rooms | 1–9 | Farm the waves; use the pit and the cover |

The element rooms (water, lava, fire) that the player builds through are in [ELEMENT-ROOMS](ELEMENT-ROOMS.md).

Code: `src/content/rooms.ts` (every template, its fields and the validator), `src/content/room-layouts.ts` (the layouts of issue #115, [LAYOUT-RULES](LAYOUT-RULES.md)), `src/world/floor.ts` (how templates are chosen by floor, mirroring and kind).
