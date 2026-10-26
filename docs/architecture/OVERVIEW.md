# Architecture overview (as of M1.5)

How the code that exists today is organised. For the target architecture and the reasoning behind it, see [../research/TECHNICAL.md](../research/TECHNICAL.md); for the game itself, [../design/DESIGN.md](../design/DESIGN.md). Topics with their own page: [ITEMS.md](ITEMS.md) (items, synergies, safety layers), [ROOMS.md](ROOMS.md) (floor plans, templates, doors), [ENTITIES.md](ENTITIES.md) (health, bombs, enemies, pickups, stacked floors), [ELEMENTS.md](ELEMENTS.md) (planned: fire, water, lava, chests, furnaces).

## Module map

```
main.ts ──► Game (game/game.ts) ── owns everything, runs one frame at a time
             │
             ├─ core/        engine-agnostic rules: event bus, RNG, stats, damage
             ├─ items/       item machinery: types, Inventory, ItemPools, validate (safety layer 1)
             ├─ enemies/     enemy types, behaviour factories, per-room flow field
             ├─ content/     data: materials, room templates, items (one file each), synergies,
             │               enemies (one file each), atlas layout
             ├─ world/       voxel storage, floor plan, stacked dungeon (carve, holes), meshing worker
             ├─ physics/     voxel raycast, box-vs-grid collision, loose cubes and bombs
             ├─ combat/      intentions (the player's projectiles)
             ├─ entities/    player, doors, pickups, enemies (system)
             ├─ input/       keyboard + mouse (pointer lock)
             ├─ render/      atlas, item icons, chunk meshes, hands, loose cubes, cracks, particles
             ├─ audio/       synthesised sound effects
             └─ game/        event catalogue, HUD (inventory window, banners, counters), game loop
```

`core/`, `items/`, `enemies/` (except nothing), `content/`, `world/` and `physics/` never import three.js or touch the DOM, so the rules are testable in Node and the mesher runs in a worker.

## Runs and floors

- `Game.newRun(seed?)` — a seed code (or a fresh crypto seed), `RunRandom`, the whole run planned (`planDungeon`) and every pedestal reserved, new `ItemPools`, a fresh dungeon world (rock column filled once), floor 1 carved and activated, floor 2 carved, counters reset (1 bomb, 3 hearts), empty inventory.
- `carve(k)` — carves floor *k* one floor ahead of the player (per-floor RNG; pedestal items drawn now). `activate(k)` — adds its doors, pedestals and keys ("the next floor loads"), on entering the boss room above or digging into its band.
- `trackPlace()` — derives `depth` from the player's height; going deeper than `maxDepth` activates that floor, carves the next one, clears deferred chain reactions and emits `floorEnter`. Entering a boss room schedules its hole to open.
- See [ENTITIES.md §1](ENTITIES.md#1-stacked-floors-worldfloorts).

## Frame order (`Game.frame` → `simulate`)

The simulation runs only while the mouse is captured, the inventory is closed and the player is alive (`S.game.simulateUnlocked = true` overrides the mouse rule for automated tests).

1. `Player.update` — look, walk, jump (`jump` event), land (`land` with `cause`), collision against voxels and closed doors.
2. `touchBlocks` — walking into blocks emits `touchBlock`; tiers ≤ `crush` shatter.
3. `fire` — `IntentSpec` from stats, `fire` event, spawn (not while holding up a new item).
4. `tryPlace` / `throwTop` / `placeBomb` — right click, Q, E (`blockPlace`, `throw`, `drop`, `bombPlace`).
5. `Doors.update` — slide doors; sealed doors stay shut; `requestDoor` handles locks (`doorOpen`).
6. `DebrisSystem.update` — loose-cube physics, depenetration, bomb fuses (→ `explode`), tagged impacts (→ `debrisImpact`).
7. `touchDebris` — `touchCube`: pick up, kick (`kick`), bombs are always kicked.
8. `touchPickups` — keys, bombs, hearts (`pickupCollect`), pedestal items (`Inventory.gain` → banner, flash, hold-up).
9. `Intents.update` — move intentions; hit enemies (`enemyDamage`), push cubes, damage voxels (pierce up to `pierceTier`).
10. `Enemies.update` — behaviours, flow-field steering, leash, contact (`enemyContact`), projectiles.
11. `bus.flush()` — deferred chain reactions (64 per frame).
12. `trackPlace` — floors, rooms (`roomEnter`), boss-room hole.
13. `updateCombat` — seal rooms, materialise projections from the centre (`enemySpawn`), clear rooms (`roomClear`).
14. Visuals: pickups, particles, loose cubes, cracks, hands; then chunk remeshing and visibility, camera (bob + shake), fog, render world, clear depth, render hands, HUD.

## Core systems

### Event bus (`core/events.ts`, `game/events.ts`)

- `bus.on(type, { priority, source, id, fn })`; lower priority first: 0–99 modify, 100–199 cancel, 200+ side effects (no cancelling).
- `bus.emit(type, payload)` returns the payload as a context (mutable, `cancel()`).
- Safety: a throwing hook is logged and skipped; a hook slower than 4 ms is reported once; nested emits past depth 8 run without hooks; the deferred queue is capped at 5000.
- `bus.defer(fn, source)`, `bus.off(null, source)` (also purges pending calls), `bus.clearDeferred()`, `bus.dump()`, `bus.trace`.
- The full catalogue of events and what each one lets items change: [ITEMS.md §3](ITEMS.md#3-everything-is-a-stat-or-an-event).

### Stats (`core/stats.ts`)

`StatSheet` caches `computeStats(mods)`: base + adds, × multipliers, clamp to `STAT_LIMITS`, final overrides; a non-finite result falls back to the base value and is logged. `STAT_INFO` formats each stat for the HUD; `diffStats` feeds the pickup banner.

### Items (`items/`, `content/items/`, `content/synergies.ts`)

See [ITEMS.md](ITEMS.md). `Inventory.gain/lose/restore` → `rebuild()` reinstalls items (`item:<uid>`) and active synergies (`syn:<id>`); `ItemApi` is the facade items act through; `ItemPools` draws per run without repeats; `validate.ts` checks the catalogue at startup and in tests.

### Damage and health

`blockDamage(amount, material) = max(amount − armor, 10%)` (block damage is its own number: an intent's `mining`, an explosion's `damage`; see [ACTORS.md](ACTORS.md)); `Game.damageBlock` → `blockDamage` event → HP in `world.damaged` → `breakBlock` (`blockBreak`, with `source`) → loose cube, `blockLoot`. Actors: `damagePlayer` (`playerDamage`, invulnerability, `death`), `heal`, `damageEnemy` (`enemyDamage`, knock-back). `explode()` queues a blast (`BlastQueue`: 8 per frame, chains capped at 12 links, each with a `Cause`) that covers blocks, actors, cubes and chained bombs. Past the bus depth cap an event is cancelled (fail closed).

### Seeds and randomness (`core/seed.ts`, `core/rng.ts`, `core/tables.ts`, `core/fx.ts`)

See [RNG.md](RNG.md). A 32-bit root shared as an 8-character code; structure from path-derived forks decided at run start (`planDungeon`, pedestal reservation) and at carve time (per-room forks); runtime streams for drops and procs; weighted tables for every choice; cosmetic randomness only through `fx`.

## World (`world/`)

- `VoxelWorld` — `Uint8Array` of materials, sparse `damaged` HP, dirty 16³ chunks, a `version` counter bumped on every change.
- `floorplan.ts` — Isaac-style plans from any start cell, with a fallback. See [ROOMS.md](ROOMS.md).
- `floor.ts` — the stacked dungeon: `createDungeonWorld`, `carveFloor`, `openHole`, `floorY`, `bandOf`, `roomOrigin`, `cellOf`.
- `mesher.ts` / `mesher.worker.ts` — visible faces, per-vertex AO and face shade baked into vertex colours, in a worker.

## Physics (`physics/`)

- `raycast.ts` — Amanatides–Woo DDA (intentions, placement).
- `voxel-collide.ts` — axis-by-axis box movement in substeps (player, enemies).
- `debris.ts` — loose cubes without a physics engine (Joel-gift approach): typed arrays in a 2000-slot ring (1000 on touch devices), per-column hash so piles stack, **depenetration** (a cube overlapping anything solid is pushed to the nearest free spot), a **separation pass** (cubes that moved are pushed apart from overlapping neighbours along the axis of least overlap, stacked when the overlap is vertical, never into walls, and re-checked until clear), visual-only tumbling, **bomb fuses** (pinned slots), tagged impacts. ≈4 ms per frame for 2000 moving cubes.

## Entities (`entities/`)

- `player.ts` — the 0.6 × 1.8 box, hand stack (`carry`), keys, bombs, half-heart `hp`, invulnerability.
- `doors.ts` — Doom-style sliding slabs per floor; locks; **sealing** for combat; `unlock`.
- `pickups.ts` — keys, bombs, hearts (fall and settle) and pedestal items (icon sprite + glow).
- `enemies.ts` — the projection system: materialise, behave, steer by flow field, leash, contact, projectiles, dissolve. Definitions in `content/enemies/`, behaviours in `enemies/behaviours.ts`.

## Rendering (`render/`)

- `atlas.ts` — every texture painted at startup (materials 0–15, grass top 16, cracks 20–23, door textures, the bomb "seed").
- `icons.ts` — item icons from their 12×12 pixel art, with outline and highlight; sprite textures; the glow sprite; quality stars.
- `chunks.ts` — worker meshing, versioned replies, visible-range culling by height.
- `debris-view.ts` — all loose cubes in **one** instanced mesh (per-instance atlas tile in the shader); crack overlays.
- `hands.ts` — cube arms in their own scene; top block in the left hand, the next one in the right; **hold-up** animation for new items.
- `particles.ts` — cube particles for splashes, chips, spawns, explosions.

## HUD (`game/hud.ts`, `index.html`)

Isaac corner (hearts, bombs, keys, item icons), hand slots, minimap and floor, debug readout, the **pickup banner** (icon, quality, description, plain effect, inspiration, every stat change, new synergies; it stays until you click, and that click doesn't fire) with a coloured screen flash, damage vignette and screen shake, toasts, the **inventory window** (Tab: practices with icons and details, synergies and states of being with progress, all stats; pauses and releases the mouse), the pause card and the **death screen**.

## Debug console

`window.S` in the browser console:

| Call | What it does |
|---|---|
| `S.give('taoteching')` / `S.lose(id)` | Gain / lose an item (`S.items` lists them) |
| `S.stats()`, `S.synergies()`, `S.hooks()`, `S.trace()` | Inspect stats, active synergies, every hook per event, which hooks touched an event |
| `S.hold('crate', 'obsidian')` | Set the blocks in your hand |
| `S.keys(n)`, `S.bombs(n)`, `S.heal(n)`, `S.hurt(n)` | Counters and health (through the normal events) |
| `S.god()` / `S.god(false)` | Invulnerable |
| `S.floor()` | Open this floor's hole and drop into the next |
| `S.enemies()`, `S.room()` | Live projections; the current room |
| `S.seed()`, `S.restart('ABCD-EFGH')` | This run's seed; replay one (no argument: fresh) |
| `S.tp(x, y, z)`, `S.debug(false)` | Teleport, hide the readout |
| `S.game` | The whole `Game` |

URL parameter `?seed=123` picks the seed.

## Tests (`tests/`)

Vitest, Node, no rendering (69 tests):

- `core.test.ts` — event bus, RNG, stats, block damage.
- `world.test.ts` — templates, mesher, DDA, collision, plans (one start/treasure/boss; from all 49 start cells), stacked dungeon (doorways, global room ids, bands), the hole landing in the next start room.
- `debris.test.ts` — falling, resting, stacking, ring reuse, despawn, tagged impacts, cubes spawned at one spot repelling each other (and never into walls), 2000 cubes.
- `items.test.ts` — catalogue integrity, inventory invariants (no residue, synergies, suppression, tag counts, `onGain` once, throwing hooks, serialize/restore), pools, the **contract** (every event emitted, every stat read).
- `rng.test.ts` — seed codes, fork purity, determinism (same seed, same four floors), isolation (runtime randomness never changes structure), pre-rolled rewards, variety over 200 seeds, tables, and the randomness discipline (only `core/fx.ts` calls `Math.random`).
- `helpers.ts` — builds a whole run's structure like `Game.newRun`, for tests.
- `synergy-matrix.test.ts` — **safety layer 3**: every item alone and every pair (378 combinations) under every event: no errors, finite stats in limits, chain reactions settle; the catalogue validates; NaN modifiers are neutralised.
