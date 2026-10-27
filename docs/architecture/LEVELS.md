# Levels: architecture of the thirteen floors

Status: **L1, L2 and L3c built (2026-10-27)**; L3a, L3b and L4–L6 planned. Review: [../reviews/levels.md](../reviews/levels.md). Design and owner decisions: [../design/LEVELS.md](../design/LEVELS.md).

## 1. Goal

Turn the four-floor dungeon into the owner's world, in milestones that each ship on their own:

| Milestone | What | Depends on |
|---|---|---|
| **L1** | Thirteen-level frame: one data table of levels; ten underground floors (0–9) stacked in one world; the surface above floor 0; floor 0 peaceful (no projections), where the run starts; per-level rock, fog and element themes; templates tagged with the floors they belong to | — |
| **L2** | Tree-of-Life plans for floors 1–5: ten emanation rooms at the Tree's positions joined by the 22 paths as corridors; seeded variation (open, locked, hidden paths) | L1 |
| **L3** | Multi-cell rooms (2×1, 1×2, 2×2) and larger templates growing with depth; floor 5's great pit | L2 |
| **L4** | Random floors 6–9 as circles six to nine (themes; the ninth frozen: ice); silence below 9 and its loop to heaven | L1 |
| **L5** | The giant tree above the surface: trunk (vertical map), branches (3D map), leaves (star map, teleport doors, cosmos views) | L1 |
| **L6** | The roots' peaceful creatures (art gate) | L1 |

This review covers L1 in detail and the shape of L2–L5 only as far as L1 must leave room for them.

## 2. L1 in detail

### 2.1 One table of levels (`src/content/levels.ts`)

```ts
export interface LevelDef {
  floor: number;                 // the owner's number: 0 roots … 9 the frozen bottom (tree floors later: -1 trunk, -2 branches, -3 leaves)
  key: string;                   // 'roots', 'tree1' … 'circle9'
  kind: 'roots' | 'tree' | 'random' | 'trunk' | 'branches' | 'leaves';
  circle?: number;               // Dante's circle (1–9)
  rock: 'f1' | 'f2' | 'f3' | 'f4'; // which floor rock ramp and fog (art ledger §9) until each level gets its own
  peaceful?: boolean;            // no projections (floor 0)
  plan: { minRooms: number; maxRooms: number };
  /** Rock mix in its band: the share of deepstone and obsidian, dirt pockets, ore. */
  strata: { deep: number; obsidian: number; pockets: number; ore: number };
}
```

Everything that today reads "floor k of 4" reads the table instead: plans, rock fill, fog, enemy budgets, decor and mood tables (`minFloor` keeps working with 0–9), the HUD label.

### 2.2 Vertical layout (`world/floor.ts`)

- Floors 0–9 stacked `BAND` = 16 apart, floor 9 at the bottom: `floorY(k) = BOTTOM + (LAST - k) × BAND`, `LAST` = 9. Under floor 9: a sealed band reserved for **silence** (L4), then bedrock. Above floor 0: dirt, the grass surface (`SURFACE_Y` = `floorY(0) + 15`) and the open sky (`SKY_LIMIT` 100, reserved for the tree in L5).
- `bandOf(y)`: the floor whose band contains `y` (0–9), or **−1** above floor 0's band (the surface and sky; the tree's levels will split it in L5). Everything that used `Math.max(1, bandOf(...))` uses `Math.max(0, …)`.
- World height ≈ 8 + 10 × 16 + 100 ≈ 270 (≈ 2.5 M voxels × 2 bytes ≈ 5 MB). The rock column is filled once per run, as today.
- Room ids `(floor + 1) × ROOM_ID_STRIDE + index` so they stay positive when tree floors (−1…−3) arrive.
- `MAX_ROOM_H` / `MAX_PIT` and the rock-between-bands test hold for every pair of the ten bands.

### 2.3 Runs

- The run starts on **floor 0** (the roots), in its start room. Floor 0 has no projections (`peaceful`): its normal rooms are quiet; its last room (today's boss slot) is the way down: it opens its shaft into floor 1 as boss rooms do now.
- `carve(k)` stays one floor ahead; `activate(k)` unchanged; `maxDepth` counts from 0.
- Enemy budget `2 + floor` is capped (e.g. `min(2 + floor, 8)`) until L4 rebalances deep floors.
- `GEN_VERSION` → 4 (every seed's world changes).

### 2.3b Floor 0, the tutorial (owner)

- `LevelDef.tutorial`: doors never lock or seal (no vault padlock: its key-less vault becomes a plain treasure room), no projections.
- **Lessons**: each floor-0 room carries one lesson (move, break, pick up and place, throw and kick, bombs, wade and swim, practices and the inventory, the way down). A lesson is a text key (`tutorial.*`, both languages, `sotano-i18n`) shown when you first enter the room, as an information banner that stays until clicked (owner rule), and written on a stone **tablet** in the room (a template marker, the art gate for its look). Order is fixed by the plan's distance from the start, so the first rooms teach the first things.
- **Pedestals** draw only practices of quality 1–3 (`ItemPools` reserve with a quality cap for floor-0 slots).

### 2.4 Where rooms may appear

`RoomTemplate.floors?: [min, max]` limits a template to a range of floors (default: all underground floors). Element rooms: water from floor 1, lava from floor 3, the cistern and caldera deeper. Floor 0 gets its own small set (roots, soil, quiet hollows).

### 2.5 Rock and fog by depth

Rock bands follow `strata` (dirt and roots near the top, stone, deepstone, obsidian at the bottom). Fog and rock ramps reuse the four art ramps (F1 earth for 0–2, F2 water 3–4, F3 air 5–6, F4 fire 7–9) **as a placeholder**: the art ledger maps four floors to four elements; ten floors need an art ruling (sotano-art), flagged for the owner.

## 3. Risks we know of

- Tests and helpers assume 4 floors (`FLOORS`, `floorY(1)`, room id 1xx). They move to the table.
- Meshing at run start: `markAllDirty` doubles the chunk count; the restart fade waits for meshes (`RESTART_HOLD_MAX` 2 s).
- Seeds: every existing seed code changes (GEN_VERSION 4).
- Depth semantics for items: `floorEnter.depth` and anything that reads depth now starts at 0.

## 4. L1 as built (after the review)

- `src/content/levels.ts`: `LEVELS` (floors 0–9), `level(floor)`, `FIRST_FLOOR`, `LAST_FLOOR`; per level `kind`, `circle`, `rock`, `fog`, `tutorial`, `maxQuality`, `vaults` (floors 6–9 keep none: the third dead end stays a quiet room), `plan`, `strata`.
- `world/floor.ts`: `floorY(k)` from `LAST_FLOOR`; `bandOf` → 0–9 or `SURFACE` (−1); `depthOf` (the surface is depth 0); `levelIndex(floor) = floor + 4` and `roomGid` for room, door and pedestal ids (positive even for tree floors −3…−1); `planDungeon` indexes plans and themes by floor; `pedestalSlots` carries `maxQuality`; `fillRock` reads `strata` (same two noise forks); only the surface is meshed at start, floors when carved.
- Tutorial floor 0: no roster, no locked or boss doors (the last room is a plain door and only opens the way down), no boss pedestal flag, pedestals from the treasure pool capped at quality 3 (`ItemPools.reserve` drops the cap only if nothing that gentle is left). A lesson banner (`lesson.*`, EN + ES) on first entering each room, in order of steps from the start, the way down last.
- `RoomTemplate.floors`: hazards (fire, lava, deep water) can't be on floor 0 (validator); lava from floor 3.
- Fog per level (`LEVEL_FOG`), blended to the sky near the surface. `GEN_VERSION` 4; golden test on seed 0xBEEF.

Not built in L1 (with their milestone): a real `exit` room type and entry/exit cells per floor (L2); plan edges and corridors (L2), multi-cell rooms and grid sizes from the table (L3); per-level enemy budgets and threshold re-tuning (L4; the budget is `min(2 + floor, 8)` for now); silence and heaven (L4); a world height from per-level bands and the tree (L5); the roots' creatures and the lesson tablets' look (L6, art gate); a phone performance check of the larger world.

## 5. L2 proposal (2026-10-27): Tree-of-Life floors and rooms you build your way through

Owner, 2026-10-27: *"Go ahead with the tree, and redesign a large part of the levels: at least half must require building with blocks to get through, because something is isolated, because there are great pits, or because there are walls you can't pass unless you destroy and place blocks. Building must be key to many layouts, starting from floor 0, with ever more original puzzles and themed mechanics tied to each layout."*

### 5.1 The Tree on the grid

Floors 1–5 use a fixed Tree layout on the 7×7 grid instead of the Isaac planner (`kind: 'tree'`). Ten **emanation** rooms sit at the Tree's positions on three pillars; the **paths** between them are corridor cells (`RoomType 'path'`, their own templates). Two rooms connect when their cells touch (the Tree has loops: so do these plans).

```
. . . K . . .      K crown (exit: the way down)      C wisdom    B understanding
. B + + + C .      M mercy (chesed)   G severity     T beauty (the heart: treasure)
. + . + . + .      N victory          O splendour    Y foundation (vault)
. G + T + M .      L kingdom (entry: you land here)
. + . + . + .      + a path
. O + Y + N .
. . + L + . .      (the kingdom opens onto two paths, so the vault never stands between you and the floor)
```

- **Entry and exit.** You land in the kingdom (L, the start) and leave through the crown (K, the exit: today's boss room and its shaft). The soul climbs the Tree on every floor while the run descends. To land under the crown above, **every other Tree floor is mirrored north–south** (as above, so below): the crown of floor k sits over the kingdom of floor k+1.
- **Roles from the layout**, not from dead ends: L start, K exit, T treasure, Y vault (locked) where the floor keeps one, the other emanations normal rooms with projections, paths `path`. Names are English meanings, never sacred names (lore respect rule).
- **Floor 0** must end above floor 1's kingdom: its planner grows **from the exit cell** and makes the farthest dead end the start (the same Isaac rules, reversed roles).
- RNG: `fork('plan', k, kind)`; the Tree layout itself draws nothing; templates, moods and rosters as before. `GEN_VERSION` 5.

### 5.2 Rooms you build your way through

- New cells: `X` an obsidian wall up to two blocks under the ceiling (you climb over it), `=` a 2-deep dry pit (you need a block to climb out). With `W`, `L` and `_`, rooms can split into parts that walking alone can't join.
- **`reachable(t)`** (rooms.ts): a 2.5-D walk over the template (standing heights from stacks, pits, terraces and layer tops; step up 1, drop any, jump gaps of up to 2 at the same height or lower; fire and lava block; water is swum). A room **needs building** when some door approach or the centre can't reach another. Tests: at least half of the normal and path templates need building; every template that needs building has breakable supply (soft blocks) on every part, and everything is solvable with blocks (no unbreakable walls: bedrock never appears in templates).
- Templates carry an optional `lesson` (floor 0 teaches building step by step) and their `floors`. Puzzles grow with depth and follow the circles' images (structure and images, never people):

| Floors | Building idea |
|---|---|
| 0 roots | one block to climb a step; a 2-deep dip to climb out of; a dirt wall to break through; a short gap to bridge |
| 1 limbo | wide dry trenches between grey ledges: bridges |
| 2 winds | thin bridges across deep water; galleries you reach by stairs you build |
| 3 rain | mud-coloured soil and shallow water; walls of crates to burn or break; lava begins |
| 4 weights | heavy obsidian walls splitting the room: climb over them with what you break |
| 5 marsh | deep water and lava side by side: break the obsidian between them and the water builds the bridge |
| 6 tombs | rows of eternal flames and fire pits: build stepping stones over them |
| 7 rivers | a lava river across the room: bridge it |
| 8 ditches | ten-ditch rooms: many narrow trenches, bridges of single blocks |
| 9 ice | (ice is not built yet: deep cold water, sealed walls) |

## 6. L2 as built (after the review, [../reviews/levels-l2.md](../reviews/levels-l2.md))

- `floorplan.ts`: `TREE_LAYOUT` (the kingdom opens onto two paths of its own, so the vault never stands between you and the floor), `treePlan(mirrored, vault)`, `TREE_ENTRY` / `TREE_EXIT`, `treeCell`; `generatePlan(…, fromExit)` grows floor 0 from its way down, right over floor 1's kingdom, and recomputes distances from the start. Tree floors 1–5 alternate north–south. `RoomType` gains `path`; the minimap draws paths as narrow bands. `GEN_VERSION` 6.
- `rooms.ts`: cells `X` (obsidian to two under the ceiling, carved per tile under vaults) and `=` (a 2-deep dry pit); `walkParts` / `needsBuilding` (steps of 1, any drop, jumps over one-tile gaps only, all three tiles of each door approach, the centre, `K`, `P`, `H` and the pedestal's best side); validator: `P` and `H` at the centre, start rooms never need building, the centre reaches a door on foot, a room that needs building carries soft blocks to build with, hazards off floor 0.
- Templates: the roots' tutorial set (`roots-*`, a lesson each, assigned in the order the rooms are reached: break, step, kick, pit, bridge, breakthrough; floor 0 uses only its own rooms), Tree paths (`path-*`, `nave`), and rooms themed on the circles (limbo, gale, downpour, weights, marsh, tombs, river, ditches, cocytus, islet, bulwarks). Old plain rooms live on floors 1–4 only; building rooms weigh 3. Test: on every floor at least half the fighting rooms need building, by weight (measured: 0.94 on floor 0, 0.55–0.70 below).
- Later: walk checks per carved room over its real doors (L3), a phone performance pass (Tree floors carve 23 rooms), the floor-5 great pit and multi-cell rooms (L3).

## 7. L3 proposal (2026-10-27): rooms that span several cells, the great pit, checks per carved room

### 7.1 Merged rooms

- The plan stays cell-based (one `PlanRoom` per grid cell, its links per side). A new structure decision **merges** groups of touching cells into one room: 2×1, 1×2 or 2×2 cells (interiors 28×7, 13×16, 28×16). Floors decide how much they merge (`LevelDef.merge`: none on the roots, growing on deeper Tree floors, most on the random floors), from `fork('plan', k, 'merge')`, drawn after the challenge room. Only `normal` and `path` cells merge, and only with cells of the same type, so start, exit, treasure, vault and challenge rooms stay 1×1 (the shaft and the pedestals keep their rules).
- `FloorResult.rooms` holds one `RoomInfo` per merged room, with `w`, `d` (interior blocks) and `cells`; `FloorResult.roomOfCell[planId]` maps every cell to its room. `roomAt`, the minimap and door carving go through it. No door is carved between cells of one room: their shared walls are carved away.
- Everything sized by `ROOM_W`/`ROOM_D` reads the room's `w`/`d`: combat bounds, the spawn centre, the clear reward, the enemies' leash, the flow field, mirroring (`cellAt`), the validator and the walk check.
- Templates gain `size: [cellsX, cellsZ]` (default `[1, 1]`); their door approaches are those of every outer cell side (`doorApproaches(size)`).

### 7.2 The great pit (floor 5)

Floor 5's exit is a 2×2 room whose middle is a shaft four blocks wide into floor 6: the way down to the next layer of the world. Its template is a `boss` template with `size: [2, 2]`, the only exit allowed to merge, and the hole is 4×4.

### 7.3 Checks per carved room

`walkParts` runs on the carved room with the doors it really has: a test over many seeds checks that every carved room's real doors are joined either on foot or by building (never by nothing), and that at least half of each floor's fighting rooms that have two or more doors need building.

### 7.4 After the review ([../reviews/levels-l3.md](../reviews/levels-l3.md)): footprints, not merges, in three steps

The review dropped "merge separate plan cells": a big room is **one plan room with a footprint** (`size: [cellsX, cellsZ]`, its id is its anchor cell, `cells`, and `roomOfCell` for grid lookups). Indices, forks and pedestal slots stay as they are. No footprints on Tree floors (the Tree's shape is its meaning).

| Step | What | Status |
|---|---|---|
| **L3c** | The walk check as carved: `flipped(t, flipX, flipZ)` and `needsBuildingIn(t, flipX, flipZ, sides)` (memoized) restrict the check to the doors a room really has. Test: over 24 seeds, on every floor, at least half the fighting rooms with two or more doors need building (aggregate per floor, so no single seed can flake). To meet it on the random floors, the trench, wall, lava-bridge and ember corridors also serve as normal rooms there, `tombs` gained tomb walls you climb (a single row of flame can be jumped), a new `gates` room shuts three sides away, and the gentlest element rooms (amphitheatre, font, water bridge) live on floors 1–5. `GEN_VERSION` 8. | **Built** |
| **L3a** | The great pit: floor 5's crown as a 2×1 footprint (the crown cell and its empty east neighbour), a 4×4 shaft centred on the crown cell, so it lands in floor 6's start room, whose templates keep a clear 4×4 centre; `openHole` with a size; `pickTemplate` filters by size; doors as a list; the minimap draws a footprint's bounding box. | Next |
| **L3b** | Footprints on the random floors (6–9): growth inside the planner, density per level, rosters, rewards, chests and key homes scaled by cell count, the flow field over bigger rooms, a phone performance pass. Touches the chests code: coordinate with it. | Later |

Open for the owner: is a 2×1 crown (an arena 28 × 7 with a 4 × 4 pit) great enough, or should floor 5 get its own Tree layout so the crown can be 2×2?
