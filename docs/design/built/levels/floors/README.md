# Floors (built)

Up: [levels](../README.md) · the ten underground floors, the place each one stands for, and how each is laid out.

Each floor is one band of the world, numbered as the design numbers it: floor 0 is the roots, floors 1 to 9 are Dante's circles in order, with the ninth frozen. A floor is one of two kinds of plan: the Tree of Life (floors 1 to 5, a fixed map of ten emanations joined by paths) and the random plan (floors 6 to 9, an Isaac-style plan of rooms joined at random). The roots are a third, fixed tutorial plan. Every floor has a depth, a rock ramp, a fog, its own palette of wall, floor and trim, and a share of deepstone and obsidian in its rock that grows as you go down.

| Floor | Name on the HUD | Kind | Rock ramp | Vaults | Way down |
|---|---|---|---|---|---|
| 0 | The roots | tutorial plan | f1 | no | 1 thing |
| 1 | Limbo | Tree of Life | f1 | yes | 2 things |
| 2 | The winds | Tree of Life | f1 | yes | 3 things |
| 3 | The rain | Tree of Life | f2 | yes | 4 things |
| 4 | The weights | Tree of Life | f2 | yes | 5 things |
| 5 | The marsh | Tree of Life, ends in the great pit | f3 | yes | 1 practice |
| 6 | The walls | random | f3 | no | 2 practices |
| 7 | The rivers | random | f4 | no | 3 practices |
| 8 | The ditches | random | f4 | no | 4 practices |
| 9 | The ice | random, frozen | f4 | no | none: a hole into silence |

The HUD names come from the English catalogue (`level.*`). Vaults are a locked room that holds a practice behind a key; the deeper floors keep no vault so that the practices last the run.

## The palettes

Each floor's rooms are built from its own materials: walls and ceiling, the floor under the interior, and the trim of the pieces.

| Floor | Walls | Floor | Trim |
|---|---|---|---|
| 0 | loam | loam | flagstone |
| 1 | brick | flagstone | brick |
| 2 | rubble | rubble | brick |
| 3 | wetbrick | ashlar | wetbrick |
| 4 | ashlar | wetbrick | ashlar |
| 5 | slate | darkbrick | slate |
| 6 | darkbrick | slate | darkbrick |
| 7 | darkbrick | darkbrick | slate |
| 8 | darkbrick | slate | slate |
| 9 | darkbrick | ashlar | ashlar |

## Rock by depth

The rock of a floor's band is mostly plain stone, with more of the hard kinds the deeper you go. Each floor's share of deepstone and obsidian, and the chance of dirt pockets and ore veins, is set in the level data.

| Floor | Deepstone | Obsidian | Dirt pockets | Ore veins |
|---|---|---|---|---|
| 0 | 0 | 0 | 0.45 | 0.04 |
| 1 | 0.05 | 0 | 0.15 | 0.07 |
| 2 | 0.15 | 0 | 0.10 | 0.08 |
| 3 | 0.30 | 0.02 | 0.06 | 0.08 |
| 4 | 0.45 | 0.04 | 0.04 | 0.09 |
| 5 | 0.60 | 0.06 | 0.02 | 0.10 |
| 6 | 0.75 | 0.10 | 0 | 0.10 |
| 7 | 0.85 | 0.15 | 0 | 0.11 |
| 8 | 0.90 | 0.22 | 0 | 0.12 |
| 9 | 0.90 | 0.30 | 0 | 0.12 |

Bigger rooms become more likely as you go down: the weight of templates that spread over more than one cell grows from 1 on the roots to 4 on floors 8 and 9 (see [rooms/MULTI-CELL](../rooms/MULTI-CELL.md)).

## Ambient creatures

Creatures of the place are not projections: they do not attack, they live in rooms and keep the player company. Each kind appears on the floors it is listed for, a few of them in normal and start rooms.

| Creature | Floors |
|---|---|
| Wonder, Rootling, Mossling | 0 |
| Chirper | 1 to 2 |
| Leafling, Star-mite | 1 to 5 |
| Delver | 1 to 3 |
| Bubbler, Ferryback | 3 to 4 |
| Drifter, Inkmite | 5 to 6 |
| Cinderwalker | 7 to 8 |
| Huddler | 9 |

Their own behaviour is in the bestiary; the roots' creatures are in [ROOTS](ROOTS.md).

## Documents

| Document | Contents |
|---|---|
| [ROOTS.md](ROOTS.md) | Floor 0: the earth and the fixed tutorial, its lessons on the walls, its peaceful creatures |
| [TREE-OF-LIFE.md](TREE-OF-LIFE.md) | Floors 1 to 5: the ten emanations, the paths, the mirrored floors, the great pit |
| [CIRCLES.md](CIRCLES.md) | Floors 6 to 9: the random plans, the walls of Dis and the ice, the rules for using Dante |
| [SILENCE.md](SILENCE.md) | The chamber under the ninth floor, standing still to be carried up, and the loop back |
| [TOLL.md](TOLL.md) | The way down from each floor, and what the toll asks for |

Code: `src/content/levels.ts` (every number in these tables), `src/world/floor.ts` (how a floor is built), `src/world/floorplan.ts` (the Tree and tutorial plans and the random generator).
