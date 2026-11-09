# Rooms bigger than their cell

Up: [rooms](README.md) · Status: built.

A room is one cell on the map, but its space may spread into the empty cells beside it. The map says how many rooms there are and how they join; the space says how big each one is. The owner's rule (2026-10-27): bigger spaces that still count as one room on the map.

## The footprint

A template declares its size in cells, east and south, from one to two each way. Each cell is thirteen blocks by seven. So a room two cells wide is 28 blocks by 7; two cells deep is 13 by 16; two by two would be 28 by 16. The build authors thirteen templates: ten two-cell-wide rooms and three two-cell-deep rooms. None is two by two yet, though the validator allows it.

| Footprint | Template | Floors | Kind |
|---|---|---|---|
| 2×1 | long-gallery | 1–3 | normal or path (pointed ceiling, holes, terraces) |
| 2×1 | wind-hall | 2–3 | normal or path (cross ceiling, walls with dirt plugs) |
| 1×2 | stepped-well | 2–4 | normal or path (stepped ceiling, a pit five deep) |
| 2×1 | drowned-nave | 3–4 | normal or path (water wall to wall) |
| 2×1 | strongroom | 4–5 | normal or path (blocks packed with aisles) |
| 2×1 | styx-cavern | 5–6 | normal or path (cave roof, a deep pool) |
| 2×1 | crown-hall | 1–4 | boss (the crown, a long dome) |
| 2×1 | abyss | 5 | boss (the great pit) |
| 2×1 | caldera-hall | 6–9 | boss (lava pools and braziers on pillars round the boss's practice) |
| 2×1 | antechamber | 6–9 | normal (a river of lava) |
| 2×1 | dis-hall | 6–7 | normal or path (a ditch of lava) |
| 1×2 | chasm | 6–9 | normal or path (a plateau of holes, a bridge of pillars) |
| 1×2 | giants-well | 7–9 | normal (trenches and a ring of pits) |

## The home cell

Every multi-cell room has a home cell: the one cell that is the room on the map. Its doors, its centre, its start or pedestal (`P`), and its hole (`H`) all sit in the home cell. The rest of the footprint is space the room spreads into.

## How space is allotted

After the plan of a floor is drawn, the empty cells of the map are allotted to the rooms beside them: a room's preset footprint takes its cells first, then the boss room takes the empty cells east and west of it, then every empty cell beside a room goes to one of them, and a room takes only the cells that fit its shape. The space is the room's; the map never shows it.

## Boss rooms are always large

On floor 0 and every floor below it, a boss room is always a template of two cells (issue #131), unless the floor's boss asks for a small room in its definition (`EnemyDef.smallRoom`, see [Fight flow](../../bosses/FIGHT-FLOW.md#1-the-room-seals)). Three things make sure it always fits:

- On the random floors (6 to 9), the boss is the farthest dead end that has an empty cell east or west of it (`wideBoss` in `generatePlan`). On the Tree floors the crown always has empty cells on both sides.
- The boss room claims those cells before any other room (`allotSpace`).
- Only templates of two cells or more are chosen for it (`pickTemplate` with `large`); if none fits, generation fails loudly instead of falling back to a small room. Every floor from 1 to 9 has one: `crown-hall` (1–4), `abyss` (5), `caldera-hall` (6–9).

The roots' last room (floor 0) is the way down, not a boss room, and keeps its fixed one-cell template.

## Weights on the deeper floors

Multi-cell templates are chosen more often on deeper floors. The weight multiplier per floor is 1 on the roots, 1.5 on floor 1, 2 on floor 2, 2.5 on floor 3, 3 on floors 4 to 6, 3.5 on floor 7, and 4 on floors 8 and 9. The bigger rooms appear where they fit and where their weight allows.

## What stays the same

- A vault keeps to one cell: its shell is hardened box by box, and a vault cannot spread.
- A start room's four-by-four centre stays clear, and the start room never needs building.
- The great pit is the one boss room whose two-cell footprint is decided with the plan: a two-cell hall over a four-by-four shaft (see [TREE-OF-LIFE](../floors/TREE-OF-LIFE.md)). Every other boss room is two cells wide too, but opens the usual two-by-two shaft.
- The map is the graph; the space is not. A room's size never reaches the map.

Code: `src/content/rooms.ts` (the size and home fields, the validator), `src/world/floor.ts` (allotting space to rooms, carving the footprints), `src/content/levels.ts` (the weight multiplier per floor).
