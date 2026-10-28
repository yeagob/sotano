# Levels: architecture of the thirteen floors

Status: **L1–L6 built (2026-10-27)**, first versions; see §9 for what is still open. Review: [../reviews/levels.md](../reviews/levels.md). Design and owner decisions: [../design/LEVELS.md](../design/LEVELS.md).

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

### 2.3b Floor 0, the tutorial: a fixed level (owner, 2026-10-28)

- The roots always have the **same plan**: `TUTORIAL_LAYOUT` in `world/floorplan.ts` (a 7 × 7 grid), built by `tutorialPlan()`, which draws nothing. Three open doors leave the start `S`: the treasure room `T` (its pedestal offers a practice of tier 1–3), the way down `B` (a dead end, its pedestal offers a practice of tier 1–4, drawn at random from the treasure pool), and the first lesson. The eight lessons `a`–`h` form a ring that goes round and comes back to `T`, so you can walk the whole level or skip it straight to `B`.
- Each letter is a fixed template in `TUTORIAL_CELLS` (`content/rooms.ts`), with a flip only where the lesson needs one: the dig room's wall stands between you and its north door (`flipZ`). Doors are open everywhere and the floor has no chests.
- Lessons in ring order from the start: move (`S`), step (`a`), intent (`b`), polarity (`c`, `roots-mend`), pit (`d`), bridge (`e`), breakthrough (`f`), kick (`g`), water (`h`), practices (`T`), the way down (`B`). Each lesson is a tablet on its room's walls (`lesson` per template).
- **Loose loot**: every run lays one key and one bomb as random rewards, each on a random free tile of a random lesson room (`fork('floor', 0, 'loot')`, `FloorResult.keys` and `FloorResult.bombs`, pickups added when the floor activates). Never in the start, the treasure room or the way down.
- `pedestalSlots` reads the cell's `maxQuality`: 3 for `T`, 4 for `B`. Tutorial pedestals never sit in chests.

### 2.3c The way down: the toll (owner, 2026-10-28)

- `content/levels.ts`: `tollOf(floor)` returns `{ count, practices }`. Floors 0–4 cost `floor + 1` things, taken from the hand (blocks), keys, bombs and hearts. From floor 5 (`PRACTICE_TOLL_FROM`) the way down costs `floor − 4` practices (1 on floor 5 … 4 on floor 8). Floor 9, which opens into silence, is free, and so is the hole of any floor without a toll.
- **The gate**: the boss room's hole stays shut on a toll floor, cracked as before. When its timer runs out and the player stands over it, `Hud.openToll(game, k)` opens the toll window, once per approach (`BossState.asked`; stepping off and on asks again).
- **The window** (`#toll` in `index.html`, `game/hud.ts`): tiles for each hand block, key, bomb, heart (`ceil(hp / 8)`) and, from floor 5, each practice. The tile ids are `hand:i`, `key:i`, `bomb:i`, `heart:i`, `item:i`. You pick exactly `count`; **Go down** stays off until you do; **Stay** closes it. It runs in context `toll` (`input/bindings.ts`), where confirm, navigate and back are live, and it pauses the simulation.
- **Payment** (`Game.payToll(k, ids)`): it refuses anything that is not exactly the toll (wrong count, duplicate, out of range, a kind the toll does not take). Then it removes the blocks from the hand (by index), the keys and bombs (by count), the practices (`Inventory.lose`), and damages the player for each heart (8 points, one `toll` damage through `damageActor`, so items see it; a death shows "the price of the way down"). If the player survives, `openHole` opens the shaft and they fall.
- **Input**: mouse and touch activate a tile by click; keyboard and pad confirm the selection. A click on an unlocked pointer while `engaged` no longer relocks it (`Input` `mousedown`), so the window keeps its cursor.
- The console shortcut `nextFloor()` still opens the hole without a toll (a development tool).

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
- Tutorial floor 0: no roster, no locked or boss doors, no boss pedestal flag, a fixed plan (§2.3b). A lesson banner (`lesson.*`, EN + ES) on first entering each room, in the order of the ring from the start.
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
- Templates: the roots' tutorial set (`roots-*`, a lesson each, placed by `TUTORIAL_LAYOUT` and `TUTORIAL_CELLS`, §2.3b), Tree paths (`path-*`, `nave`), and rooms themed on the circles (limbo, gale, downpour, weights, marsh, tombs, river, ditches, cocytus, islet, bulwarks). Old plain rooms live on floors 1–4 only; building rooms weigh 3. Test: on every floor at least half the fighting rooms need building, by weight (measured: 0.94 on floor 0, 0.55–0.70 below).
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
| **L3a** | The great pit: floor 5's crown as a 2×1 footprint (the crown cell and its empty east neighbour; owner left it to us: 2×1), a 4×4 shaft centred on the crown cell, so it lands in floor 6's start room, whose templates keep a clear 4×4 centre; `openHole` with a size; `pickTemplate` filters by size; the minimap draws a footprint's bounding box. Template `abyss`. | **Built** |
| **L3b** | Footprints on the random floors (6–9): after planning, a normal room may grow into an empty cell east (2×1) or south (1×2) (`LevelDef.grow`, 0.35 on floor 6 to 0.5 on floor 9, `fork('plan', k, 'grow')`); its doors stay on its first cell, so links, chaining and the shaft are untouched; its roster budget and cap grow with its cells; the flow field and the leash use the room's size; challenge rooms stay 1×1. Templates `antechamber` (2×1) and `giants-well` (1×2), never mirrored. Chests and key homes still use the first cell only (the chests code); a phone performance pass is still owed. | **Built** |

The owner left the crown's size to us: 2×1 (a hall 28 × 7 with a 4 × 4 pit). `GEN_VERSION` 9.

## 8. L4–L6 proposal (2026-10-27)

### L4: the circles, the ice, silence and heaven

- **Themes per circle** in `LevelDef`: an image name (`level.<key>` texts: limbo, the winds, the rain, the weights, the marsh, the walls, the rivers, the ditches, the ice), shown with the floor number on the HUD and the new-floor notice; an `enemyBudget` per level instead of `min(2 + floor, 8)`.
- **Ice** (material 17, tier 1, fragile): on the frozen floor (9), every water source a template carves is ice instead, and standing on ice you slide (less grip). Its ramp reuses the water tokens (never the projections' cold).
- **Silence**: floor 9's way down opens into a sealed chamber in the band under it (y 1–6, above the bedrock): dark, no sound (the master volume fades out), nothing to fight. **Stand still in it** for three seconds and you are carried up to **heaven**: the top of the sky, above the tree's crown, falling slowly onto the leaves. Reaching the top of the sky from below (climbing the tree past the stars) brings you down into silence. The loop is cyclic, as the owner asked; what ends a run stays open.

### L5: the giant tree

A structure built once per run in the sky band above the surface, from `fork('tree')`: a **trunk** (radius 5, wood, hollow, with a spiral stair of wood inside and openings at its foot), **branches** (6–8 thick beams radiating from its upper third, each ending in a platform), and **leaves** (a canopy of leaf blobs) with **stars** above it: small platforms of star stone floating in constellation patterns, each with a pad that carries you to another star (teleport doors), and a sky that darkens to night as you rise (the cosmos). HUD labels by height: the trunk, the branches, the leaves, heaven. All of it within `SKY_LIMIT` (the tree tops out under the sky's ceiling).

### L6: the creatures of the roots

Peaceful creatures on floor 0 (faction `neutral`, never sealing doors, never fighting): a first one, **Wonder** (a small moth-like creature of pale paper that keeps away from you; it stands for the curiosity that leads you down), two to four per tutorial floor, through the enemy system with a `flee` behaviour. You can hurt and kill it with a negative intention (owner, 2026-10-27); a positive one mends it. Its art passes the sotano-art gate (no warm glow: light is the player's).

## 9. L4–L6 as built (after the review, [../reviews/levels-l4-l6.md](../reviews/levels-l4-l6.md))

- **Circles (L4):** each level has an image name (`level.<key>`, EN + ES: the roots, limbo, the winds, the rain, the weights, the marsh, the walls, the rivers, the ditches, the ice) shown with its number on the HUD (`floorLabel`), and an `enemyBudget` (`min(2 + ⌈0.8·floor⌉, 9)`, ×cells for big rooms).
- **Ice (L4):** material 17 (`slippery`, tier 1, the water's own tokens). On the frozen floor (9) the surface layer of every pool a template digs is ice, with water still under it; standing on ice you keep sliding (grip × 0.12).
- **Silence (L4):** floor 9's way down opens into a sealed chamber on the bedrock under its exit room (air y 1–4, `FloorResult.silence`). In it the world's volume fades to nothing; **stand still three seconds** and you are carried up to heaven, above the tree, falling slowly (`Player.float`, gravity × 0.15, the first landing never hurts). Once silence is known, reaching the top of the sky takes you back down into it. Every jump goes through `teleport`, which finds room to stand (never inside blocks) and refreshes the HUD and the floor bookkeeping without counting as depth.
- **The tree (L5):** `world/tree.ts` `buildTree` from `fork('tree')` after the rock: a hollow trunk of living wood (radius 5, 50 high, doors at its foot, a spiral stair inside, an opening at its crown), 6–8 branches from its upper third that open the trunk where they leave it and end in platforms, leaf blobs over every branch and over the crown, and three constellations of star-stone platforms above the canopy whose pads carry you to the next star (re-armed once you step off). About 10k–20k cubes, meshed only when you first come near the surface. Going up, the HUD names the trunk, the branches, the leaves and heaven, and the sky turns to night with a dome of faint stars (never warm light).
- **Creatures of the roots (L6):** `content/creatures` (outside the projections' art rules: they are not projections): **Wonder**, a small paper moth that runs from you when you come within 4 blocks (`flee` behaviour). Two to four on floor 0 from `fork('floor', 0, 'creatures')`, ambient (never in a roster), faction `neutral`: they never attack and never change side, never seal or block a room. Intentions meet them: a negative one hurts them (lethal at 0), a positive one heals them when hurt, and a healthy one passes through (`meetsIntention`).
- `GEN_VERSION` 10.

Still open: what ends a run; the climb from the roots to the surface (today you dig or build up); creatures for the tree and more for the roots; the circles' own mechanics beyond their rooms (winds that push, rain that soaks); a phone performance pass over the whole world; captures in the art guide for ice, the tree and Wonder.

## 10. L7 proposal (2026-10-27): rooms bigger than their cell, new ceilings, deep holes, a building palette per floor

Owner: *"The layouts are boring and repetitive. Bigger rooms, even if they keep their place on the map; vaulted ceilings of different shapes; platforming; deeper holes. The first five floors all look the same: more difference in the materials the rooms are built from. Above all, new layouts, and spaces that are bigger but count as one room on the map: the map only says how many rooms there are and how they connect."*

### 10.1 The map is a graph, the space is not

- The plan (`FloorPlan`) keeps one grid cell per room and its links: that is **the map** (the minimap, distances, special rooms, the Tree's shape). Nothing about a room's size reaches it: the minimap draws every room as one cell (the great pit's crown included).
- A room's **space** may spread from its home cell into empty grid cells around it: any rectangle of cells that holds the home cell, every other cell empty in the plan and not claimed by another room. The extra cells hold no doors (an empty cell has no link), so links, door positions and the shaft never move.
- Claims are decided **when the floor is carved**, from the room's own `layout` fork (template, then flips that fit): rooms with a preset footprint first (the crown of the great pit), then every other room by id. `FloorResult.space` maps every grid cell to the room that owns it; `roomAt` reads it. *(Changed by the review: see §11.)*
- The old plan-time growth (`LevelDef.grow`, `fork('plan', k, 'grow')`, `growFootprint` writing the grid) goes: a level's `bigRooms` multiplies the weight of the templates bigger than one cell instead. Tree floors may grow too: the Tree's shape is its map, and the map does not change (this replaces review L3's "no footprints on Tree floors").

### 10.2 Templates of any shape

- `size: [cellsX, cellsZ]` (1–3 each; *1–2 after the review*) and `home: [cx, cz]` (default `[0, 0]`, the cell that is the room on the map). Rows are `roomDims(size)` blocks (13, 28, 43 × 7, 16, 25).
- A new character, space ` `, is **not room**: the rock stays. With it a template draws irregular halls (an L, a cross, a round cavern, a long gallery that only uses half of the next cell).
- The shell hugs the open tiles (two blocks of wall around every open tile); rock beyond it is left as the strata made it.
- Door approaches, the centre where projections materialise, `P` and `H` are the home cell's. `RoomInfo` gains `hx, hz` (the home cell's interior corner); the clear reward, the spawn fallback, the tablets and the fallback key use it.
- Big templates may be mirrored: the home cell flips with the rows.

### 10.3 Ceilings

New shapes for the height above five: `pointed-x` / `pointed-z` (a pointed, gothic barrel), `cross` (a groin vault: two barrels crossing), `stepped` (a ziggurat of terraces upside down) and `cave` (an uneven rock roof from a fixed hash of the tile: no randomness drawn). The height cap (8) and every vertical rule stay.

### 10.4 Deep holes and platforming, inside the band

The three layers of rock between floors stay. Holes get deeper by **raising the ground**, not by digging further: a plateau of terraces (3 or 4 high) with `=` pits in it gives holes five or six blocks deep, and single pillars over a pit field (jumps of one tile) make platforming. The walk check already understands steps, drops and jumps.

### 10.5 A building palette per floor

*(The table below was the proposal; the art agent's final palette and ramps are in the art ledger, [../art/DECISIONS.md](../art/DECISIONS.md) §6.6.)*

Every room was built from one dungeon brick in the colour of floor 1. Each level now names its **palette**: the material of its walls, its floor, and its trim (the `#`, `b` and `1`–`4` built pieces). New materials, appended after id 20 (saves and seeds keep their ids), with brick's toughness (tier 1, hp 12) so digging feels the same and only the look and the meaning change:

| Floor | Walls | Floor | Trim |
|---|---|---|---|
| 0 roots | loam (packed earth) | loam | living wood (roots) |
| 1 limbo | dungeon brick | flagstone | stone |
| 2 the winds | rubble masonry | flagstone | brick |
| 3 the rain | wet brick (blue rock) | slate | wet brick |
| 4 the weights | ashlar (great blocks) | slate | deepstone |
| 5 the marsh | slate | slate | ashlar |
| 6–9 | dark masonry | slate, obsidian at the bottom | as the walls |

The lining of deep pools, the obsidian of a vault's shell (`hardenShell`) and the "reinforced" mood follow the palette.

### 10.6 RNG

Template choice already draws from `floor/k/room/i/layout`; flips are now drawn only among the flips that fit, so every room's draws change: `GEN_VERSION` 11.

## 11. L7 as built (after the review, [../reviews/levels-l7.md](../reviews/levels-l7.md))

- **The map is a graph.** `plan.grid` keeps one cell per room; the minimap draws every room as one cell (the great pit's crown too). `growFootprint` only presets a footprint (`PlanRoom.size`); it never writes the grid. `LevelDef.grow` and `fork('plan', k, 'grow')` are gone; `LevelDef.bigRooms` (1 on the roots, 1.5 on floor 1 rising to 4 at the bottom) multiplies the weight of templates bigger than one cell.
- **Space is shared out first** (`allotSpace`, `fork('floor', k, 'space')`): a preset footprint takes its cells; every empty cell beside a room goes to one of them; every empty cell beside a cell given away goes to that room too. A room's template is picked only among those whose space fits its allotment (after flips), and its flips only among those that fit, so a room depends on the plan, the floor's `space` fork and its own `layout` fork, never on another room (review point 4). What a room really takes is `FloorResult.space`; `roomAt` reads it.
- **Templates** take `size` (1–2 cells each way, so at most 28 × 16 blocks) and `home` (the cell that is the room on the map). Door approaches are the home cell's, only on the sides where the home is the edge of the space; the centre, `P` and `H` are the home cell's centre (`homeAt`, `centreOf`, `flipped` flips the home too). The character space (` `, `ROCK`) is not room: the shell (Chebyshev distance 2 around open tiles) hugs the outline and the strata beyond stay. Rock never fills the home cell; layers never put a block over rock. Big templates may be mirrored. A vault keeps to one cell (its shell turns to obsidian box by box).
- **RoomInfo** gains `hx, hz` (the home cell's interior corner: doors, the clear reward, the spawn fallback, tablets, creatures, the fallback key and hole) and `open` (the room's tiles; `inRoomSpace`): the doors seal when you stand in the room's open space, not in its box, so a tunnel through an irregular room's rock never seals it. The leash pulls projections to the home centre.
- **Ceilings:** `pointed-x`, `pointed-z`, `cross`, `stepped`, `cave` (`ceilingAt` in `rooms.ts`, `ceilingRise` in `floor.ts` is the same function). The cave roof is a fixed hash of the tile and always full height over the middle.
- **Deep holes and platforming** stay inside the band: plateaus of trim three high (`3`) with `=` pits make holes five deep; single pillars one tile apart are jumped. The validator now checks two blocks of headroom over every stack under the vault or dome at that tile. There is no fall damage today, so a five-block drop is safe.
- **The flow field** uses a bucket queue (Dial's Dijkstra): a 28 × 16 room is 448 tiles.
- **A building palette per floor** (`LevelDef.palette`: wall, floor, trim): the shell's walls and ceiling, the floor under the interior, `#` and a plug's upper wall from `wall`, `b` and `1`–`4` from `trim`; the lining of deep pools is the floor; a vault's shell turns from wall and floor into obsidian. Seven materials (ids 21–27), as tough as brick. Colours and the table per floor: the art ledger ([../art/DECISIONS.md](../art/DECISIONS.md)). In game, floors 1–4: [../art/img/built/l7-rooms-floors-1-4.png](../art/img/built/l7-rooms-floors-1-4.png).
- **Rooms** (templates): `long-gallery`, `cloister`, `bastions`, `wind-hall`, `stepped-well`, `drowned-nave`, `strongroom`, `styx-cavern`, `crown-hall`, `chasm`, `dis-hall` ([../design/LEVELS.md](../design/LEVELS.md) §4).
- Tests: rooms spread only into empty cells and never into each other, the map keeps one cell per room, every open tile has air, big rooms appear on every hostile floor (Tree floors included), the new ceilings rise in the middle; deep pools are lined with their level's floor. `GEN_VERSION` 11.

Later (from the review): the chamber of silence still takes the boss room's box (no big boss on floor 9 today); `ceilingRise` over the bounding box of an irregular room; templates three cells long (the flow field is ready for them); `hardenShell` on irregular vaults.

## 12. The tree in stories, and loading by level (2026-10-27, owner)

The owner asked for the tree **at least three times bigger**, built as **stories you climb**: every story is a hall the size of a whole floor, a **spiral stair** rises from each story's floor into the next, and the tree's foot spreads over the whole surface. And: the tree must not be loaded all the time; only the current level and its neighbours are.

**The tree (`world/tree.ts`, `GiantTree`).** `SKY_LIMIT` is 260 (the world is 428 high). Seven stories (`TREE_STORIES`), heights above the grass:

| Story | Zone (HUD) | Height | Trunk radius | The hall |
|---|---|---|---|---|
| `roots` | trunk | 0–21 | 34 | Buttress roots from the trunk to the edges of the world, four great doorways at its foot, root ridges radiating from a mound of earth, six root columns |
| `rings` | trunk | 22–43 | 30 | The tree's years as low concentric walls (one and two high) with a few gaps, the pith as a central column |
| `galleries` | trunk | 44–65 | 26 | A balcony round the wall reached by two ramps along it, hanging leaves under the ceiling |
| `hollows` | trunk | 66–87 | 23 | A forest of wooden columns with bridges between them half way up |
| `branches` | branches | 88–111 | 20 | Seven to nine great branches leave through arches, rising gently, each to a platform under a blob of leaves |
| `canopy` | leaves | 112–145 | — | A floor of woven wood under a dome of leaves 108 × 72 with windows onto the sky, limbs climbing inside |
| `stars` | heaven | 146–260 | — | The crown's platform where the last stair arrives, with a star pad, and three constellations above; every pad carries you to the next star, the last one back to the crown |

Every trunk story has a two-block floor slab, a wall three blocks thick and knot windows at eye height. Each story's stair (`stairAt(i)`) turns 137° from the one below and stands inside its hall, so every hall is crossed: a core of wood, a step a block higher every two blocks of tread, three blocks of air over every step; the opening in the next floor is the air over the last steps (a fall into it is a few blocks). A story's stair is drawn by both stories it touches, each clipped to its own heights, so stories grow in any order. No projections live in the tree yet. Tested: same seed same tree in any order, ranges contiguous, the foot nearly as wide as a floor, and a walk from the grass to the crown through every story.

**Loading by level (`Game.stream`, `ChunkRenderer.setLoadedRange`).** The world has a single axis of levels: floors 0–9 below (silence counts with 9), and the tree's stories as −1 (the roots, which also holds the dirt and the grass) to −7 (the stars). Each frame the game finds the player's level `s`; when it changes, the tree's stories in `s − 1 … s + 1` grow if they never have, and the chunk renderer keeps meshes only for the chunk rows covering those three levels: meshes outside are disposed, rows coming in are queued for meshing, and replies for rows that left are dropped. Scope (owner): only the tree and the block and element meshes; voxels, doors, pickups and projections are untouched (the world is still one array; what is grown or dug stays). Seen from the grass, the tree shows its first two stories; the rest appears as you climb. `GEN_VERSION` 12.
