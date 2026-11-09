# World storage: a formula with exceptions

Up: [not-built levels](README.md) · Status: proposal (issue #11). The owner approves the storage format before anything is built.

The giant tree, the surface and the floors under it are computed from the run's seed by a formula, and only what differs from the formula is stored. Memory then grows with the number of features and with what the player changes, never with the size of the world. Issue #10 (a larger surface) depends on it.

When this is built, the format and the engine move to the architecture section (`docs/architecture/`), and this document keeps only what the player can notice.

## 1. What the player notices

Nothing, if it works. The tree, the surface and the floors look exactly as they do now; every block the player breaks or places stays broken or placed; a saved run comes back exactly as it was left. What changes is that the world can be much wider (issue #10) without the game running out of memory on a phone, and the tree no longer needs to "grow" a story when the player comes near it, because every story already exists as a formula.

## 2. What the code does today

Everything below was read from the code; the numbers are computed from the constants it cites.

| Fact | Where |
|---|---|
| The dungeon is one flat array: one byte of material and one byte of element per cell, allocated whole at the start of a run | `src/world/world.ts:34-35` |
| Its size is `sx = MARGIN·2 + 2 + GRID·PITCH_X = 119`, `sy = SURFACE_Y + 1 + SKY_LIMIT = 428`, `sz = MARGIN·2 + 2 + GRID·PITCH_Z = 77` | `src/world/floor.ts:38-48` |
| So the array holds 119 × 428 × 77 = 3 921 884 cells, about **7.8 MB** (blocks + elements), whatever happens in the run | `src/world/world.ts:34-35` |
| 260 of its 428 rows are the open sky above the grass: 2 382 380 cells (61 %) that are air until the tree grows into them | `src/world/floor.ts:47`, `floor.ts:758` |
| The rock under the grass is already a formula: a pure function of the cell, two seeds and the floor themes (`hash3` noise), but it is written into the array cell by cell once per run | `src/world/floor.ts:757-777` (`fillRock`) |
| The grass is the plane `y = SURFACE_Y = 167`, dirt under it down to floor 0's band | `src/world/floor.ts:44`, `floor.ts:763-764` |
| Floors are carved into the array from their plans and room templates, one write at a time | `src/world/floor.ts:259` (`carveFloor`), `floor.ts:796-799` (`fillBox`) |
| The giant tree writes each voxel with `put` straight into the array when a story is first approached | `src/world/tree.ts:62-86`, `src/game/game.ts:3134-3145` |
| The mountains outside the array are a formula baked into a heightmap: 377 × 377 columns × 4 bytes ≈ **0.57 MB**, read-only (nothing there can be broken or built on) | `src/world/mountains.ts:1-6`, `mountains.ts:71-74` |
| Damaged blocks already keep only the cells that were hit (`damaged: Map`) | `src/world/world.ts:21` |
| The sky realm already is a formula world with exceptions: shapes, a chunk index, an LRU chunk cache, exceptions keyed by cell and kind | `src/sky/world/sky-world.ts:1-22`, `docs/architecture/SKY.md` §3 |
| Both worlds already share one interface (`VoxelSpace`) and one contract test | `src/world/space.ts`, `tests/voxel-space.test.ts` |
| There is no run save today: only meta-progression is stored (`localStorage`) | `src/game/meta.ts:15-45` |
| A run save is planned as seed + voxel deltas + entity state, in IndexedDB, on room change | `docs/research/TECHNICAL.md:174`, `:259` |

**Why it matters for issue #10.** The array costs two bytes per cell of the whole box. A surface four times wider on each side (476 × 308 columns) with the same height would cost 476 × 428 × 308 × 2 ≈ **125 MB**, almost all of it air and rock nobody touches.

## 3. The proposal in one paragraph

Use the sky's engine for the dungeon too. The world becomes an ordered list of **layers** (a formula, evaluated per chunk when the chunk is needed) plus a store of **exceptions** (what the player and the game changed). A chunk of 16³ cells is materialised into a small LRU cache by rasterising its layers and then applying its exceptions; evicting it loses nothing. Nothing is allocated per cell of the world box.

```
cell = exception ?? story change ?? last layer that covers the cell ?? AIR
```

## 4. The formula: what is computed, what is stored

Each layer is computed from the seed and a few stored parameters. The parameters are the only per-run storage of the formula.

### 4.1 The layers, in order (the last one that covers a cell wins)

| # | Layer | Covers | Formula | Stored |
|---|---|---|---|---|
| 1 | Strata | every cell from bedrock to the grass | today's `fillRock` per cell: bedrock at `y = 0` and on the four outer walls below the grass; deepstone and obsidian for `y ≤ 5`; each floor's band from its level's strata and the run's rock theme; dirt in the surface band; grass at `y = SURFACE_Y` | two `u32` noise seeds and the floor themes (10 small records): under 1 KB |
| 2 | Surface | every column of the surface, inside and outside today's array | `top(x, z) = SURFACE_Y + H(x, z)`; air above `top`, the top material `T(x, z)` at `top`, dirt or stone below it down to `top - DEPTH` (§4.3) | the mountain parameters already drawn from `fork('mountains')`: pass angles, ridges, phases, a noise seed (under 200 bytes) |
| 3 | Floors | each floor's band | the floor as a plane: brick floor slab, room shells and their interiors as boxes, doors, then each room's template as a stamp (§4.4) | per floor: the plan and, per room, the template id, flips, origin and the decisions drawn from its forks (tens of bytes a room) |
| 4 | Tree | the tree's stories | the trunk, the floors of each story and every feature as shapes (§4.2) | the shapes, built once per run from `fork('tree', i)` |
| 5 | Elements | template water, lava, fire | `elem` boxes, as in the sky | the boxes |

The materialisation of a chunk loops over the layers whose bounds cross it; a shape fills its intersection with the chunk in one loop (as `rasterise` does for the sky, `src/sky/world/shapes.ts`). Strata cost one `hash3` per cell, as now, but only for chunks that are actually loaded.

### 4.2 The tree: circumference and bark

The tree's centre is `(cx, cz) = (sx >> 1, sz >> 1)` and its base is `SURFACE_Y + 1` (`src/world/tree.ts:43-44`). Each story `i` has a floor height `fy`, a ceiling `ceil` and a radius `r` from `TREE_STORIES` (`tree.ts:14-22`; roots 34, rings 30, galleries 26, hollows 23, branches 20). With `d = hypot(x - cx, z - cz)` and the wall `WALL = 3`:

- **Bark (the trunk's wall).** A cell of story `i` is log when `r - WALL + 0.5 < d ≤ r + 0.5` and `fy ≤ y ≤ ceil`, unless it is a knot (`tree.ts:107-118`). This is one `ring` shape per story (`r0 = r - WALL + 0.5`, `r1 = r + 0.5`), the shape the sky already has.
- **The circumference** is therefore not stored: it is the ring's radii. The tree tapers story by story through `r`, and the formula gives every story's circumference as `2π(r + 0.5)` with no cell stored.
- **Knots** (openings in the bark, 3 to 6 blocks above the floor, `tree.ts:105-106`, `:115`) are air shapes after the ring: one short ring sector per knot (a new shape kind, `arc`: a ring limited to an angle range), so the angle test stays a formula.
- **A story's floor** (`tree.ts:111`) is a disc of log two blocks thick under `fy`: one `ring` shape with `r0 = 0`.
- **Bark texture**, if the art wants variation, is a `hash3` of the cell inside the formula, never stored (the same trick as the sky's blobs, `docs/architecture/SKY.md` §3.3).
- **Features** become the shapes they already are in the code: the spiral stair is a `helix` and a `ring` core (`tree.ts:121-143`); root arms, branches and canopy limbs are `run`s (`tree.ts:157-165`, `:263-273`, `:294-299`); columns are `ring`s (`tree.ts:337-341`); the rings story's walls are thin `ring`s with air `arc` gaps (`tree.ts:190-201`); the canopy shell and leaf blobs are `blob`s (`tree.ts:287-292`, `:343-349`); door cuts are air `run`s (`tree.ts:147-151`); star pads are 3 × 3 `box`es (`tree.ts:308-310`).

**Order matters today.** Some writes only fill air (`canopy` at `tree.ts:291`, `blob` at `tree.ts:347`) and later writes overwrite earlier ones. Shapes keep the order of the code, and a shape gets one flag, `fill: 'air'`, meaning "only where the layers before me left air". With that, the shapes reproduce the current tree; the golden test (§7.1) proves it.

**Growth.** `GiantTree.grow` stops writing cells. A story "grows" by adding its shapes to the layer the first time it is needed, or all stories are added at the start of the run (open question 3). Either way the player sees the same tree.

**Estimate.** The busiest story (roots) is about 10 arms × 80 steps as runs, 8 floor ribs, 6 columns, 4 doors and the stair: a few hundred shapes. The whole tree is under 2 000 shapes, about 0.2 MB at the sky's 100 bytes a shape (`SKY.md` §3.6), against the cells it covers today (the canopy shell alone spans 109 × 34 × 73 cells, `tree.ts:281-292`).

### 4.3 The surface

The surface is one height function over the whole plane, inside and outside today's array:

- `H(x, z) = 0` on the plain (`r ≤ PLAIN_R`), where the dungeon's square sits.
- Beyond it, today's mountain profile (`mountains.ts:101-113`): crest height by angle, inner and outer wall profiles, the passes and the trails, and the rugged `hash3` step. Each of these is already a function of `(x, z)` and the stored parameters.
- Two parts of today's bake are not per-column: the three peak columns pinned to `PEAK` (`mountains.ts:116-119`) and the grass-or-stone top, which looks at the four neighbours' heights (`mountains.ts:120-129`). The first is a list of three columns (stored, 12 bytes); the second is computed per chunk column from an 18 × 18 window of heights (the chunk's 16 × 16 plus a one-column border).
- When a chunk column is materialised, its 18 × 18 heights are computed once and kept with the chunk (648 bytes), so the global 377 × 377 heightmap is no longer needed. A surface of any size then costs nothing until it is seen.

### 4.4 A floor as a plane with exceptions

A floor (16 blocks of band, `floor.ts:38`, `floor.ts:63`) is mostly flat: strata rock, a brick slab, and a 7 × 7 grid of rooms of the same shell. The floor layer stores **decisions**, not cells:

- The floor plane: the slab and each room's shell and interior are boxes from the plan's grid (pitch 15 × 9, interior 13 × 5 × 7, `floor.ts:39-40`, `src/content/rooms.ts:35-37`).
- Each room's template is a **stamp**: a reference to a shared template (its cells live once, in `src/content/rooms.ts`) plus `flipX`, `flipZ`, origin and the decor choices drawn from the room's forks (`floor.ts:262-300`). Fifty rooms share a few dozen templates.
- Doors, chests, pedestals and stations are small boxes.
- What `carveFloor` decides is kept as it is: the decisions are taken once, from the same forks, in the same order, so the seeds keep giving the same floors (`docs/architecture/RNG.md`). Only the writing of cells moves to materialisation.

A deviation of the floor from its plane is therefore one of two things, and they are stored differently:

| Deviation | Example | Stored as | Saved? |
|---|---|---|---|
| **Designed** | a room's pillars, a pit, a water pool, a stair | a shape or a stamp in the floor layer, regenerated from the seed | no, the seed rebuilds it |
| **Exception** | a block the player broke, placed, or a bomb blew out | an exception (§5) | yes |

## 5. Exceptions

### 5.1 What counts as an exception

An exception is a cell whose content differs from the formula because of something that happened during the run. The kinds are the sky's (`src/sky/types.ts:123`), decided by **who writes**, never guessed from the cell:

| Kind | Made by | In the dungeon |
|---|---|---|
| `Placed` | the player placing a block | stays until the player removes it |
| `Broken` | any other write of air over a cell whose formula is solid (digging, a bomb, an intention) | stays (no regrowth below the sky, open question 4) |
| `Replaced` | a write of another material (an element reaction, a game effect) | stays |
| `Story` | a permanent change the game makes (a boss room's shaft opening, a door unlocked into rock) | becomes the cell's new baseline |
| `Transient` | a timed change | not used below the sky today |

Rules, as in the sky (`SKY.md` §3.4):

- Writing a cell back to its formula value deletes its exception, except a `Placed` cell, which stays `Placed`.
- The element layer has no kinds: an element cell that differs from the formula is one entry in its own store.
- Crack damage (`damaged`) stays a separate sparse map of hit cells, as today.

### 5.2 How exceptions are stored in memory

Per chunk, not per cell, so that the cost per changed cell is small and a heavily changed chunk does not cost more than a raw chunk:

- `edits: Map<chunkKey, ChunkEdits>`; a chunk with no edit has no entry.
- **Sparse form** (few edits): two parallel sorted arrays, the local index (12 bits of a `u16`) and the value (material `u8` and kind `u8` in a `u16`). **4 bytes a cell**, plus a small fixed cost per chunk.
- **Dense form** (many edits): when a chunk passes a threshold of edited cells, its edits switch to runs (§6). The threshold is set where runs become cheaper; the target is **64 cells** (1.6 % of a chunk), tuned by the memory test.
- Element edits use the same two forms in a second map.

For comparison, the sky's `Map<idx, number>` costs about 70 bytes an entry (`SKY.md` §3.6). The per-chunk form is a refinement the sky can adopt too; it does not change the sky's behaviour.

### 5.3 How exceptions are merged on load

Loading a chunk (materialising it) is always the same four steps:

1. Rasterise the layers that cross the chunk, in order (§4.1).
2. Apply the chunk's `Story` changes.
3. Apply the chunk's other block exceptions (sparse: write each cell; dense: walk the runs).
4. Apply the chunk's element edits.

Loading a saved run is the same: rebuild the layers from the seed, read the exceptions into the store (§5.4), and let chunks materialise as they are seen. No cell of the world is written at load time.

### 5.4 The save format

A save holds the seed and the exceptions, nothing else of the voxels:

| Part | Content |
|---|---|
| Header | format version; the run's seed; a **formula hash** (a hash of the layers' parameters and the generator version); the world's size in chunks |
| Block exceptions | for each chunk with edits, in chunk-key order: the chunk key (`u32`), the form (sparse or runs), the count, the payload (sparse: `u16` local index + `u8` material + `u8` kind per cell; runs: §6) |
| Element exceptions | the same, for the element layer |
| Damage | optional (open question 5): `u32` cell index + `u8` HP per damaged cell |

On load, a save whose formula hash does not match the current generator is not merged silently (open question 6). Entity state, the inventory and the floors' progress belong to the run save as a whole (`TECHNICAL.md:259`); this document covers only the voxels.

## 6. Repeated content: runs and chunks

Content that repeats is never stored cell by cell:

- **In the formula**, repetition is a shape: a slab is one `box`, a trunk wall one `ring`, a branch one `run`. A shape costs about 100 bytes whatever its size.
- **In a cached chunk**, a materialised chunk is a 4 KB buffer, only while it is in the LRU cache. All-air chunks are not allocated at all (`emptyChunk`, `src/world/space.ts:200-201`). The cache has a fixed cap (the sky uses 1 024 chunks, 4 MB, `src/sky/world/cache.ts:13`).
- **In the exceptions**, a chunk with many edits stores them as **runs** along the chunk's local index order (`x` fastest, then `y`, then `z`): each run is a start (`u16`), a length (`u16`) and a value (`u16`), 6 bytes for any number of equal cells in a row. A crater from a bomb, a dug corridor or a wall the player built become a few runs per row instead of hundreds of cells.

**The memory argument.**

| Item | Today | Proposed | Grows with |
|---|---|---|---|
| Rock, grass, sky of the dungeon box | 7.8 MB, fixed per box size | 0 (formula) + the cache | nothing; the cache is capped |
| Mountains | 0.57 MB heightmap, grows with the square of the surface radius | under 1 KB of parameters + 648 bytes per cached chunk column | nothing |
| Tree | written into the array | under 2 000 shapes ≈ 0.2 MB | the number of features |
| Floors | written into the array | plans and stamps: tens of KB | the number of rooms |
| Player changes | already inside the 7.8 MB | 4 bytes a changed cell (sparse), or 6 bytes a run | what the player changes |
| Chunk cache | none | capped (target 4 MB, open question 7) | fixed |

For the surface of issue #10 four times wider on each side: about 125 MB as an array (§2), against the same few MB as now with the formula. Doubling the world's width again changes only the parameters and the shapes that the new space holds.

**The cost moved elsewhere.** Materialising a chunk spends CPU (one `hash3` per strata cell, plus the shapes). Today that work is done once for the whole box at run start (`floor.ts:757-777`); after the change it is done per chunk when it comes into view, and again after eviction. The test plan sets a time budget for it (§7.5).

## 7. Test plan

### 7.1 The golden test: the formula gives today's world

For a set of fixed seeds, build today's `VoxelWorld` (strata, the mountains, every floor carved, every tree story grown) and the new formula world from the same seeds. Every cell of the dungeon box, and every surface column out to the mountains' edge, must hold the same material and the same element byte. This guards the migration: until it passes, nothing in the game changes. (If the owner accepts small visual differences in the tree, open question 2, the test compares counts per material and story instead.)

### 7.2 Memory does not grow with world size

- Build the world with the surface at 1×, 2× and 4× its width. With no player changes, the formula's stored bytes (`stats().bytes` minus the cache) grow only by the shapes the new space holds, and **never by a term proportional to the area or the volume**. No typed array is allocated with the size of the world box.
- Walk a probe across the whole surface and up the whole tree with prefetch: the cache never passes its cap, and the exception count stays at zero.
- Break 10 000 blocks in one chunk region: memory grows by at most 4 bytes a cell, and less once the chunk switches to runs.

### 7.3 Round-trip

- Make random edits of every kind (break, place, replace, story, element) across many chunks, including a cell set back to its formula value (no exception left, unless `Placed`).
- Serialise, then load into a fresh world built from the same seed: every chunk is byte-identical to the original, and `kindAt` is the same for every cell.
- `serialise(load(save))` equals `save` byte for byte.
- A chunk evicted from the cache and materialised again is identical to before eviction.

### 7.4 Save

- A run with no changes saves only the header (under 100 bytes), whatever the size of the world.
- A run with N changed cells saves at most about 4N bytes plus a fixed cost per chunk; a dense chunk saves runs and never more than the sparse form.
- A save whose formula hash does not match is refused (or handled as open question 6 decides), never merged silently.

### 7.5 Behaviour and speed

- The new world passes the `VoxelSpace` contract suite (`tests/voxel-space.test.ts`), as the sky does.
- The existing level, floor, tree and mountain tests pass unchanged (`npm test`).
- Materialising a chunk stays under a time budget (target: 1 ms median on the test machine, to be measured), so streaming never stalls a frame.

## 8. How it could be built (for the review, not decided)

1. Generalise the sky's engine (`SkyWorld`, its shapes and cache) into a formula world both realms use, with the per-chunk exception store of §5.2.
2. Move `fillRock` and the mountains into layers; pass the golden test for the rock and the surface.
3. Turn `GiantTree` into a shape builder (same forks, same order); pass the golden test for the tree.
4. Turn `carveFloor`'s writes into the floor layer; pass the golden test for the floors.
5. Switch the game to the formula world; delete the flat array.
6. Add the save format and its tests (only if the run save is in scope, open question 1).

A change of this size is a key architecture decision: it goes through the three-party review (engineer, architect, mediator) before step 1, and its record goes to `docs/reviews/`.

## 9. Open questions for the owner

1. **Run save.** Is saving and resuming a run in scope now, or is the save format (§5.4) only a design for later? Today nothing but meta-progression is saved.
2. **Exactness of the tree.** Must the formula tree be identical block for block to today's tree, or is "looks the same" enough if a shape rounds a few cells differently (for example the rotated door cuts in the roots)?
3. **Growth.** Should all stories of the tree exist from the start of the run (simpler, and the tree is whole when seen from far away), or keep appearing story by story as today?
4. **Regrowth below the sky.** In the sky, broken blocks grow back. In the dungeon and on the surface, should broken blocks stay broken for the whole run, as now?
5. **What a save remembers.** Should a save keep the cracks of damaged blocks and the state of flowing water and lava, or only blocks, with elements settling again on load?
6. **Saves across versions.** When an update changes the generator, an old save's exceptions sit on a different world. Refuse old saves, keep old generators, or accept that the world around the player's changes may shift?
7. **Memory target.** What is the ceiling for the world's memory on the weakest device we support (a proposal: 16 MB for voxels, cache included)?
8. **The surface becomes editable?** The mountains are read-only today. With exceptions they can be broken and built on like the plain. Should they be?
9. **Engine.** One engine for the dungeon and the sky (recommended here), or a separate formula world for the dungeon? This also goes through the three-party review.
