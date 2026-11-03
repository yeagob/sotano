# Lava between the floors

Up: [floors](README.md) · Status: built.

From the fifth floor down, the rock between one floor and the next holds lava: a sheet of patches on one row and pockets in the rock around it. Nothing of it is on the way down. Digging your own way down through the rock meets it, and the deeper you dig, the more of it there is. Where it lies is random in each run; how much there is follows the depth.

## How much

| Floor above the rock | Sheet (share of the floor's footprint) | Pockets | Pocket radius |
|---|---|---|---|
| 0 to 4 | none | none | |
| 5 | none | 1 | 1 block |
| 6 | a quarter | 2 | 2 blocks |
| 7 | half | 3 | 2 blocks |
| 8 | the whole floor, one sheet | 4 | 3 blocks |

Floor 9 is the frozen bottom: below it is silence, with no lava. Under floor 8 the sheet covers the whole floor, so digging straight down from floor 8 meets lava; the toll on floor 8 ([TOLL](TOLL.md)) is the way to the bottom.

## Where it is

- The sheet is one row of rock, five blocks under the floor's interior. The pockets fill that row and the row just above it. Every lava cell has rock or lava on all six sides: nothing of it touches air, so it stays where it is until the player breaks into it.
- The way down keeps two blocks of rock clear around its hole, so the shaft and its landing never meet lava.
- Breaking the rock beside lava lets it run into the new hollow, bounded like any lava. Breaking the rock above it does not: the hollow stays empty, and the lava under it is there to fall into.

Code: `src/content/levels.ts` (the `lava` field of each floor), `src/world/floor.ts` (`carveLavaBelow`, run once per floor, from its own fork `fork('floor', k, 'lava')`). Tests: `tests/levels.test.ts` ("lava between floors …").
