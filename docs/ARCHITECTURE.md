# Architecture (as of M1)

How the code that exists today is organised. For the target architecture and the reasoning behind it, see [TECHNICAL.md](TECHNICAL.md); for the game itself, [DESIGN.md](DESIGN.md). Two topics have their own pages: [ITEMS.md](ITEMS.md) (items, synergies, exceptions) and [ROOMS.md](ROOMS.md) (floor plans, templates, doors).

## Overview

```
main.ts ──► Game (game/game.ts) ── owns everything, runs one frame at a time
             │
             ├─ core/        engine-agnostic rules: event bus, RNG, stats, damage
             ├─ items/       item machinery: types, Inventory (install/rebuild), ItemPools
             ├─ content/     data: materials, room templates, items (one file each), synergies, atlas layout
             ├─ world/       voxel storage, floor plan, floor builder, meshing (worker)
             ├─ physics/     voxel raycast, box-vs-grid collision, loose-cube physics
             ├─ combat/      intentions (the player's projectiles)
             ├─ entities/    player, doors, pickups (keys, pedestals, trapdoor)
             ├─ input/       keyboard + mouse (pointer lock)
             ├─ render/      atlas, chunk meshes, hands, loose cubes, cracks, particles
             ├─ audio/       synthesised sound effects
             └─ game/        event catalogue, HUD, game loop
```

`core/`, `items/`, `content/`, `world/` and `physics/` never import three.js or touch the DOM. That keeps the rules testable in Node with Vitest and lets the mesher run in a worker.

## Runs and floors

- `Game.newRun(seed)` — new `RunRng`, new `ItemPools`, empty inventory, floor 1.
- `Game.nextFloor()` — called by the trapdoor: same run, `depth + 1`, items, keys and pools carry over.
- `buildLevel()` — builds the floor (`buildFloor`), creates chunk meshes, the loose-cube system, doors and pickups (drawing pedestal items from the pools), then a **fresh event bus** and `inventory.rebuild()` so every item hook is reinstalled and no stale chain reaction leaks into the new floor. Emits `floorEnter`.

## Frame order (`Game.frame` → `simulate`)

The simulation only runs while the mouse is captured (Esc pauses). `S.game.simulateUnlocked = true` overrides that for automated tests.

1. `Player.update` — mouse look, walking, jumping (`jump` event), landing (`land` event), box-vs-grid collision against voxels **and closed doors**.
2. `touchBlocks` — walking into solid blocks emits `touchBlock`; blocks at or below the `crush` tier shatter.
3. `fire` — build an `IntentSpec` from stats, emit `fire`, spawn the intention.
4. `tryPlace` — right click places the top block on the face you look at (`blockPlace`, `drop`); with nowhere valid to place it, it throws it instead. Q throws (`throw`, `drop`).
5. `Doors.update` — slide doors up/down; a door that wants to open asks `requestDoor` (`doorOpen` event, keys).
6. `DebrisSystem.update` — loose-cube physics; tagged cubes that hit hard call back into `debrisImpact`.
7. `touchDebris` — walking into a cube emits `touchCube` (pickup if your hand has room, kick otherwise; `kick` event).
8. `touchPickups` — keys, pedestal items (`Inventory.gain` → banner with stat changes), trapdoor.
9. `Intents.update` — move intentions, push loose cubes, damage voxels (pierce up to `pierceTier`).
10. `bus.flush()` — deferred chain reactions, at most 64 per frame.
11. `trackRoom` — which plan cell you're in; `roomEnter` and the minimap.
12. Visuals: pickups, particles, loose cubes, cracks, hands; then chunk remeshing, camera, fog, render world, clear depth, render hands, HUD.

## Core systems

### Event bus (`core/events.ts`, `game/events.ts`)

- `bus.on(type, { priority, source, id, fn })`. Lower priority runs first: 0–99 modify, 100–199 cancel, 200+ side effects (no cancelling).
- `bus.emit(type, payload)` returns the payload as a context: hooks mutate it and may `cancel()`. The game acts on the result.
- A hook that throws is logged with its source/id and skipped.
- Nested emits are capped at depth 8; past that the event runs without hooks.
- `bus.defer(fn, source)` queues a chain reaction for `flush(budget)`; `bus.off(null, source)` removes a source's hooks **and** its pending calls.
- `bus.dump()` lists every hook per event (`S.hooks()` in the console); `bus.trace = true` records `ctx.touchedBy`.

The full event catalogue and what each one lets items change is in [ITEMS.md §3](ITEMS.md#3-everything-is-a-stat-or-an-event).

### Stats (`core/stats.ts`)

`StatSheet` holds modifiers `{ stat, layer, value, source }` and caches `computeStats(mods)`: base + adds, × multipliers, clamp to `STAT_LIMITS`, then final overrides. `STAT_INFO` says how to display each stat; `diffStats` produces the "what changed" list for the pickup banner.

### Items (`items/`, `content/items/`, `content/synergies.ts`)

See [ITEMS.md](ITEMS.md). In short: `Inventory.gain/lose/restore` → `rebuild()` removes the sources it installed and reinstalls items (`item:<uid>`) then active synergies (`syn:<id>`), skipping suppressed hooks. `ItemApi` is the facade items act through; `ItemPools` draws items per run without repeats.

### Damage (`core/damage.ts`)

`blockDamage(amount, mining, material) = max(amount × mining − armor, amount × mining × 0.1)`; bedrock takes 0. `Game.damageBlock` emits `blockDamage`, subtracts HP (stored sparsely in `world.damaged`), and at zero calls `breakBlock`, which emits `blockBreak` (with `source`), clears the voxel, wakes nearby cubes and spawns a loose cube. `Game.explode` emits `explosion`, damages a sphere of blocks and throws nearby cubes.

### RNG (`core/rng.ts`)

`Rng` is sfc32 seeded through splitmix32. `RunRng` derives one stream per purpose: `floorplan`, `rooms`, `loot` (pools and keys), `items` (item effects), `combat`, `fx`. Randomness spent in one never shifts another.

## World (`world/`)

- `VoxelWorld` — one `Uint8Array` of material ids (`idx = x + sx·(y + sy·z)`), a `damaged` map of remaining HP, dirty 16³ chunk keys.
- `floorplan.ts` — the Isaac-style plan (pure, seeded). See [ROOMS.md](ROOMS.md).
- `floor.ts` — `buildFloor(rng, depth, templates)`: rock layers, room shells, template interiors (with mirroring), framed doorways, pedestals, key and trapdoor positions. Rooms are on a 15×9 grid; `roomOrigin` and `cellOf` convert between grid and world.
- `mesher.ts` / `mesher.worker.ts` — visible faces only, per-vertex AO and per-face shade baked into vertex colours, run in a Web Worker on padded (16+2)³ copies.

## Physics (`physics/`)

- `raycast.ts` — Amanatides–Woo DDA: block and entry face. Used by intentions and block placement.
- `voxel-collide.ts` — moves an axis-aligned box one axis at a time in substeps, snapping to block edges.
- `debris.ts` — **loose cubes without a physics engine**, the approach from the Joel gift project: typed arrays (position, velocity, rotation, spin, material, state, age, cooldown) in a ring buffer of 2000 cubes (1000 on touch devices). Each cube is a 0.72 box moved axis by axis against the grid; resting cubes are hashed per column so falling cubes land on them and piles stack; a resting cube that loses its support falls again. Rotation is visual only (tumbling in the air, flat with a random yaw at rest). 2000 moving cubes cost about 4 ms per frame in the browser.

## Entities (`entities/`)

- `player.ts` — the 0.6 × 1.8 box, look, walk, jump with coyote time and buffering. `hand` is a stack of materials limited by `floor(carry)`; `keys` counts keys.
- `doors.ts` — Doom-style sliding slabs (one mesh each, textured per kind), `solidAt` for collision, `request` callback for locks, `unlock`.
- `pickups.ts` — keys (built from cubes), pedestal gems (coloured per item), the trapdoor.

## Rendering (`render/`)

- `atlas.ts` — every texture painted at startup: material tiles (0–15), grass top (16), four crack stages (20–23), door textures, and per-material textures for the hand and HUD.
- `chunks.ts` — sends dirty chunks to the worker (versioned so stale replies are dropped), swaps geometry. One `MeshBasicMaterial` with the atlas and vertex colours: lighting is baked.
- `debris-view.ts` — **all loose cubes in one `InstancedMesh`**: a per-instance `instTile` attribute picks the atlas tile in the vertex shader. Plus four instanced crack overlays.
- `hands.ts` — cube arms in their own scene and camera; the left one holds the top block of your hand.
- `particles.ts` — tiny cube particles for splashes, chips and explosions.

## HUD (`game/hud.ts`)

Items (top left), debug readout (top right), minimap + keys + floor (bottom right), hand slots (bottom centre, one per `carry`), the Isaac-style pickup banner (name, description, each stat change, new synergies), toasts, and the stats panel (Tab or I) with every stat, held items and active synergies.

## Debug console

`window.S` in the browser console:

| Call | What it does |
|---|---|
| `S.give('drill')` / `S.lose('drill')` | Gain / lose an item (`S.items` lists them) |
| `S.stats()` | Current computed stats |
| `S.synergies()` | Active synergies |
| `S.hooks()` | Every hook per event, in run order |
| `S.trace()` | Record which hooks touch each event (`ctx.touchedBy`) |
| `S.hold('crate', 'obsidian')` | Set the blocks in your hand |
| `S.keys(1)` | Add keys |
| `S.floor()` | Go down to the next floor |
| `S.restart(seed?)` | New run |
| `S.tp(x, y, z)` | Teleport |
| `S.debug(false)` | Hide the debug readout |
| `S.game` | The whole `Game` object (`S.game.floor.rooms`, `S.game.doors.list`…) |

URL parameter `?seed=123` picks the seed.

## Tests (`tests/`)

Vitest, Node environment, no rendering (43 tests):

- `core.test.ts` — event bus semantics, RNG determinism and stream independence, stat layering, block damage targets.
- `world.test.ts` — template validity and coverage, mesher face culling, DDA, box collision, floor plans (one start/treasure/boss, boss far from start, connected tree), floor building (walkable doorways, spawn, pedestal, trapdoor, key iff a locked door), border dirty-marking.
- `debris.test.ts` — falling, resting, stacking and falling again, ring reuse and despawn, impacts only for tagged cubes, 2000 cubes for 60 frames.
- `items.test.ts` — catalogue integrity (unique ids, valid requirements and suppressions, no double suppression), inventory (no residue after gain → lose, stat diffs, other sources survive, synergies on/off with suppression, tag-count requirements, `onGain` once, throwing hooks, serialize → restore), pools, and the **contract** test (every event emitted, every stat read).
