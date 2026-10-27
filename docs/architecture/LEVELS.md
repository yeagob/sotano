# Levels: architecture of the thirteen floors

Status: **L1 built (2026-10-27)**; L2–L6 planned. Review: [../reviews/levels.md](../reviews/levels.md). Design and owner decisions: [../design/LEVELS.md](../design/LEVELS.md).

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
