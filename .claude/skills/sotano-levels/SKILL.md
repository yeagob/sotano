---
name: sotano-levels
description: How to add or change SÓTANO floors, levels and room layouts - room templates (src/content/rooms.ts), floor plans and generators (src/world/floor.ts, floorplan.ts), height (vaults, domes, layers, terraces, pits), element rooms (water, lava, fire) and the world's vertical structure (the thirteen floors, Tree-of-Life floors, random floors, the giant tree above). Use it EVERY time a room, a floor type, a floor's depth or theme, or the world's vertical layout changes. Also use sotano-art (anything visible), sotano-feature (quality bar), sotano-docs and sotano-lore (meaning of places).
---

# SÓTANO levels skill

A level is a **place with a meaning and a verb**. Read [docs/design/LEVELS.md](../../../docs/design/LEVELS.md) (the world's shape, floor types, the room bar) and [docs/architecture/ROOMS.md](../../../docs/architecture/ROOMS.md) (the template format and the generator) before you start. Elements: [docs/architecture/ELEMENTS.md](../../../docs/architecture/ELEMENTS.md) §9–§10.

## 1. Know where you are in the world

Every room belongs to a floor, and every floor has a **depth, a type and a theme**. Answer these before drawing a single row:

| Question | Where the answer lives |
|---|---|
| Which floor(s) can this room appear on, and what does that depth mean (which layer of the unconscious, which emanation, which part of the tree)? | LEVELS.md §1, [COSMOLOGY](../../../docs/lore/COSMOLOGY.md), `sotano-lore` |
| What type of floor is it: Tree-of-Life (emanation rooms + paths), random (Isaac plan), trunk (vertical), branches (3D), leaves (star map)? | LEVELS.md §2 |
| What does the floor's rock and element theme say (F1 earth, F2 water, F3 air, F4 fire in the art ledger)? | [DECISIONS.md](../../../docs/art/DECISIONS.md) §9 |
| Which room type (start, normal, treasure, vault, boss) and what must it hold (P, T, H, K)? | ROOMS.md §3 |

Deeper floors get **bigger, more themed, more complex** rooms (owner rule): more height, more layers, more element interplay, larger footprints when multi-cell rooms land. Never put a floor-9 idea on floor 0.

## 2. Think like the masters (from sotano-feature)

Write one line each before you build:
- **Isaac:** what does the room say in one glance, with no text? Where is the risk and the reward? How does it change the fight with each projection?
- **Minecraft:** is it built from the world's grammar (whole blocks, tiers, gravity, fluids that flow by rule)? Can the player reshape it with blocks?
- **Noita:** what happens when an element meets another, a crate, a bomb, a projection? Which chain can the player discover (flood the lava, kick crates into the fire, lure Panic into water)?

## 3. The vertical rules (never break these)

Floors are stacked **16 blocks apart** in one world. A room must never touch the floor above or below, nor the surface:

- Interior height `height` ≤ **8** (`MAX_ROOM_H`); the ceiling's two brick layers sit on top of it.
- Pools and dips dig at most **2** blocks into the floor (`MAX_PIT`); deep pools get a brick lining.
- That leaves **3 rock layers** between bands. `tests/levels.test.ts` carves every element template across every band pair and fails if any of that rock is air. If you change `BAND`, `MAX_ROOM_H`, `MAX_PIT` or add floors, that test must still pass, and the shaft between floors (boss `H` → start `P`) must stay clear.
- Vaults and domes (`ceiling`) only shape height above 5; they never add more than `height` allows.
- Layers sit at `y` 1…`height − 3` (two blocks of headroom over anything you can stand on).

## 4. The room rules (the validator enforces them; know why)

| Rule | Why |
|---|---|
| Three tiles in front of every door stay walkable, on the floor and in every layer under door height (3) | Any room may get a door on any side |
| Normal rooms keep the centre tile (6,3) open up to door height | Projections materialise there, visibly (owner rule) |
| The pedestal is reachable and nothing hangs within 3 blocks above it | The practice floats over it |
| The 2×2 shaft at `H`/`P` is clear in every flip and every layer | The way down opens there and lands there |
| No water next to lava, no flame next to something that burns (`c`, `C`, `?`) | Nothing reacts the moment the room is carved: the player starts the chain |
| Layer blocks stand on a block or span between blocks; a flame on a layer needs a terrace exactly that high under it (a brazier on a pillar) | No floating single blocks; flames need fuel |
| Elements never sit on door approaches, the centre or the shaft | Doors, spawns and the way down are never hazards |

Run `npm test`: `validateTemplate` lists every broken rule with the tile.

## 5. The characters

Ground grid (13 × 7, first row north): `.` floor · `P` `T` `K` `H` markers · `r R` stone 1/2 · `c C` crate 1/2 · `o` obsidian · `d` dirt · `i` ore · `b` brick · `1`–`4` brick terraces · `#` brick to the ceiling · `X` obsidian to two under the ceiling · `?` `~` `!` decor slots · `w W` water 1/2 deep · `l L` lava 1/2 deep · `f` eternal flame · `_` a 1-deep dip · `=` a 2-deep pit · `D` `E` a door-shaped dirt plug (3 wide, 3 high) set in a `#` / `X` wall · ` ` (space) not room: the rock stays.
Layers: `.` `r` `c` `o` `d` `i` `b` `f`.
Fields: `height`, `ceiling` (`flat`, `vault-x`, `vault-z`, `dome`, `pointed-x`, `pointed-z`, `cross`, `stepped`, `cave`), `layers: [{ y, rows }]`, `floors: [first, last]`, `lesson` (floor 0), `size` (1–2 cells each way: [2, 1] = 28 × 7, [1, 2] = 13 × 16, [2, 2] = 28 × 16) and `home` (the cell that is the room on the map: its doors, centre, `P`, `H`), `weight`, `mirror` (big templates may mirror; vaults keep to one cell). Types: `start`, `normal`, `treasure`, `vault`, `boss`, `path` (the Tree's corridors).

## 5b. Building is the key (owner, 2026-10-27)

At least half of the fighting rooms on every floor must **need building** (`needsBuilding`, tested by weight per floor): isolated parts, trenches too wide to jump (three tiles or more), walls too tall to climb (two blocks or more, `X`), lava rivers to bridge. From floor 0 (where the lessons teach it step by step) to the bottom, puzzles get more original and follow the floor's theme. Know the grid: the north and south doors sit in columns 5–7, the east and west doors in rows 2–4; cut between them (trenches between columns, walls between rows) and leave the centre joined to at least one door. Every building room carries its own soft blocks. Ask: what is the clever build here (a bridge, a stair, a dam of blocks against lava, breaking the obsidian so water makes the bridge, luring Panic to a wall)?

## 6. Elements as protagonists

- **Every element is a verb**: water is waded, swum, used to quench lava and calm Panic; lava burns, consumes cubes, is bridged or quenched into obsidian; fire burns crates (and their loot, never), dies when its block breaks or when water touches it.
- **Read the room through each projection** (`EnemyDef.elements`): who avoids, who crosses slowly, who reacts on entering, and later who **dwells** (Overwhelm in water, Burnout in fire). A good element room changes how each fight plays.
- **Contain fluids on purpose**: template sources are stable until the player breaks a wall; then flows are bounded (water 7, lava 3, falling columns keep their level). A wall between water and lava is an invitation.
- **Light**: lava and fire glow and warm the blocks next to them; water never glows. Warm light that isn't the player's hurts (art pillar 2).

## 7. Make it

1. Pick the floor(s), type and theme; write the room's idea and its verb in one line each (LEVELS.md §4 table).
2. Draw the ground rows, then layers; add `height`/`ceiling`.
3. `npm test` until the validator is quiet. Add a line to `tests/levels.test.ts` if the room introduces a new kind of feature.
4. Play it: `S.game.newRun(seed)` until a floor holds it (`S.game.floors.get(k).rooms.map(r => r.template)`), teleport with `S.game.player.spawnAt(...)`, check fights with each projection, break walls, flood things.
5. Art gate (`sotano-art`): captures of the room in colour and greyscale; any new block, texture or particle passes the ledger.
6. Document it (`sotano-docs`): LEVELS.md §4 table, ROOMS.md if the format changed. If the room has player-facing text, `sotano-i18n`.

## 8. Floors and generators (when the structure changes)

New floor types (Tree-of-Life plans, multi-cell rooms, the trunk, branches and leaves) are key architecture: run the three-party review (`sotano-docs` §4) first. Keep the RNG rules: structure is decided at run start from seed paths (RNG.md), never from player state; a new random decision gets its own fork, drawn after existing ones, and bumps `GEN_VERSION`.

## 9. Feedback log (append, newest last)

- **2026-10-26, owner:** rooms where fluids and textures are the protagonists; fire, water and lava rooms; bigger rooms, open areas, vaulted ceilings, several levels; never touch the floor above or below. → §3–§6.
- **2026-10-27, owner:** breaking a flame's block puts it out; spreading lava must slope like a ramp, not step with a gap. → elements rules in §6, sloped fluid meshing.
- **2026-10-27, owner:** thirteen floors: 0–5 Tree-of-Life maps with ten emanations, ever bigger, themed and complex; 5–9 random; a giant tree of thousands of cubes above with trunk (vertical map), branches (3D map) and leaves (star map with teleport doors and cosmos views); down into the layers of the unconscious to the bottom of Dante's inferno and then silence; up to heaven. → LEVELS.md §1–§2 (open questions there).
- **2026-10-27, owner (decisions):** floor 5 is the last Tree floor and ends in a great pit; floors 1–9 are Dante's circles in order (9 frozen); floor 0 is the earth and roots with non-aggressive creatures; no house on the surface, you climb from the roots however you can; silence connects cyclically with heaven; the run's end is still open. → LEVELS.md §1.
- **2026-10-27, owner:** rooms behind locked doors are wrapped in obsidian (hard, breakable); chests (unbreakable blocks, free or costing 1–3 keys) stand in many normal rooms and shut away most treasure/vault practices. → `freeSpots` and `hardenShell` in `src/world/floor.ts`; never put a chest in a door approach, the centre, or beside `P T K H`; extra keys lie on the same tiles. GEN_VERSION 5.
- **2026-10-27, owner:** floor 0 is the friendly tutorial: everything pretty, every door open, lessons through its rooms, practices of quality 1–3 only. → `tutorial` levels, lessons per template.
- **2026-10-27, owner:** go ahead with the Tree, and redesign most levels: at least half must need building with blocks (isolated parts, great pits, walls you pass only by breaking and placing), from floor 0, with ever more original themed puzzles. → §5b, L2 (Tree floors, paths, roots tutorial, circle rooms), the walk check and its test.
- **2026-10-27, owner:** the tutorial is written on the walls (tablets), never an overlay; challenge rooms (three waves per visit, repeatable, harder each time) on any hostile floor; doors open when there are no projections and on clearing; breakthroughs destroy doors. → `src/render/tablets.ts`, `RoomType 'challenge'`, ROOMS.md §2.
- **2026-10-27, owner:** continue without asking; trust the engineer's judgement. → L3 built: the 2×1 great pit on floor 5, footprints on floors 6–9, checks per carved room.
- **2026-10-27, owner:** continue with L4, L5 and L6. → circles named on the HUD, ice on the ninth, silence and heaven looping, the giant tree (trunk, branches, leaves, stars with pads), Wonder in the roots. Creatures of the place live in `content/creatures` (not projections, faction `neutral`).
- **2026-10-27, owner:** a wall that seals a whole room must show where a door would be, with a door-shaped plug of the softest material (dirt); some walls hide a door on their far side. → `D` / `E` in `rooms.ts` (`CELL_PLUG`), set in every full `#` / `X` wall.
- **2026-10-27, owner:** the layouts were boring and repetitive; bigger rooms that keep their place on the map (the map only shows how many rooms and how they join), vaults of different shapes, platforming, deeper holes, and floors that look built from different things. → L7: rooms spread into empty cells they are allotted (`allotSpace`), any outline with ` `, five new ceilings, plateaus of `3` over `=` (holes five deep inside the band), `LevelDef.palette` per floor; eleven new rooms, most of them on floors 1–5. Lesson: the map is a graph and the space is not; never let a room's size reach the map.
