# Architecture (as of M0)

How the code that exists today is organised. For the target architecture and the reasoning behind it, see [TECHNICAL.md](TECHNICAL.md); for the game itself, [DESIGN.md](DESIGN.md).

## Overview

```
main.ts ──► Game (game/game.ts) ── owns everything, runs one frame at a time
             │
             ├─ core/        engine-agnostic rules: events, RNG, stats, damage
             ├─ content/     data: materials, room templates, items, atlas layout
             ├─ world/       voxel storage, generation, meshing (worker)
             ├─ physics/     voxel raycast, box-vs-grid collision, Rapier debris
             ├─ combat/      intentions (the player's projectiles)
             ├─ entities/    the player
             ├─ input/       keyboard + mouse (pointer lock)
             ├─ render/      atlas, chunk meshes, hands, debris, cracks, particles
             ├─ audio/       synthesised sound effects
             └─ game/        event catalogue, HUD, game loop
```

`core/` and `content/` never import three.js or touch the DOM (except `render/atlas.ts`, which paints textures). That keeps the rules testable in Node with Vitest and lets the mesher run in a worker.

## Frame order (`Game.frame`)

1. `Player.update` — mouse look, walking, jumping, box-vs-grid collision.
2. `fire` — if the button is held and the cooldown allows, build an `IntentSpec` from stats, emit `fire` (items may modify or cancel it) and spawn the intention.
3. `tryPlace` / `tryThrow` — right click places the held block on the face you're looking at; Q throws it.
4. `DebrisSystem.update` — fixed-step Rapier (60 Hz), ageing and despawning of loose cubes.
5. `touchDebris` — walking over a cube picks it up (free hand) or kicks it (hand full).
6. `Intents.update` — move intentions, collide with cubes (push them) and with voxels (damage them).
7. `bus.flush()` — run deferred chain reactions, at most 64 per frame.
8. Visuals: particles, chunk remeshing, debris and crack instancing, hands.
9. Camera, fog (dungeon colour below, sky colour near the surface), render world, clear depth, render hands.

## Core systems

### Event bus (`core/events.ts`, `game/events.ts`)

- `bus.on(type, { priority, source, fn })`. Lower priority runs first: 0–99 modifiers, 100–199 cancellations, 200+ side effects.
- `bus.emit(type, payload)` returns the payload as a context: hooks mutate it and can `cancel()`. The caller acts on the result.
- `bus.off(null, source)` removes everything an item installed.
- Nested emits are capped at depth 8. Chain reactions use `bus.defer(fn)` and run in `flush(budget)`, outside the stack that caused them.
- `bus.trace = true` records which hooks touched each event (`ctx.touchedBy`).
- Events today: `fire`, `blockDamage`, `blockBreak`, `blockPlace`, `pickup`, `kick`, `intentHit` (declared, not emitted yet).

### Stats (`core/stats.ts`)

`StatSheet` holds a list of modifiers `{ stat, layer: 'add' | 'mul' | 'final', value, source }` and caches `computeStats(mods)`. Order: base + adds, × multipliers, clamp to `STAT_LIMITS`, then final overrides. Nothing ever mutates a stat directly.

### Damage (`core/damage.ts`)

`blockDamage(amount, mining, material) = max(amount × mining − armor, amount × mining × 0.1)`; bedrock (infinite HP) takes 0. `Game.damageBlock` runs it, emits `blockDamage` (hooks may change the amount or cancel), subtracts from the block's HP in `world.damaged`, and on zero calls `breakBlock`, which emits `blockBreak`, clears the voxel (world + Rapier collider) and spawns a debris cube.

### RNG (`core/rng.ts`)

`Rng` is sfc32 seeded through splitmix32. `RunRng` derives one independent stream per purpose (`rooms`, `loot`, `combat`…) from the run seed, so randomness spent in one system never shifts another. `hash3` is deterministic value noise for world generation.

## Content (`content/`)

- `materials.ts` — one row per block material: tier, HP, armor, flags, three colours and a texture pattern. `MAT.<key>` gives ids.
- `rooms.ts` — 13×7 ASCII room templates plus a validator (`validateTemplate`). The legend is at the top of the file.
- `items.ts` — `ItemDef`: stat modifiers and/or an `install(ctx)` that hooks into the bus. Granted with `Game.give(id)`.
- `tiles.ts` — atlas layout shared by the mesher (in the worker) and the atlas painter.

## World (`world/`)

- `VoxelWorld` — one `Uint8Array` of material ids (`idx = x + sx·(y + sy·z)`), a `damaged` map of remaining HP, and a set of dirty 16³ chunk keys. `set()` marks the chunk dirty, plus its neighbours when the voxel sits on a border.
- `gen.ts` — `generateM0(seed, rng, templates)` builds the 41×26×33 test world: layered rock, a brick room with two corridors, the interior from a template, two hidden pockets, and grass at y = 25 with open sky above.
- `mesher.ts` — pure function: for each solid voxel, emit faces whose neighbour is air, with per-vertex ambient occlusion and per-face shade baked into vertex colours, flipping the quad diagonal to avoid AO artefacts. Input is a padded (16+2)³ copy so borders are correct.
- `mesher.worker.ts` — runs the mesher off the main thread and transfers the buffers back.

## Physics (`physics/`)

- `raycast.ts` — Amanatides–Woo DDA. Returns the block and the entry face normal. Used by intentions and block placement.
- `voxel-collide.ts` — moves an axis-aligned box one axis at a time (Y, X, Z) in substeps of at most 0.4 blocks, snapping to block edges.
- `debris.ts` — Rapier world with the whole terrain as one voxel collider (`ColliderDesc.voxels`), kept in sync with `setVoxel`. Loose cubes are dynamic 0.72-unit cuboids with CCD, capped (150 desktop / 60 touch), despawning after 90 s with a 10 s blink.

## Rendering (`render/`)

- `atlas.ts` — paints every texture at startup on a canvas (original pixel art from each material's colours and pattern), plus four crack stages.
- `chunks.ts` — sends dirty chunks to the worker (versioned so stale replies are dropped) and swaps in the new geometry. One `MeshBasicMaterial` with the atlas and vertex colours: lighting is baked, not computed.
- `hands.ts` — two cube arms in their own scene and camera; the right one swings on cast, the left one rises holding the carried block.
- `debris-view.ts` — one `InstancedMesh` per material for loose cubes; four instanced crack overlays for damaged blocks.
- `particles.ts` — tiny cube particles for splashes and chips.

## Debug console

`window.S` in the browser console:

| Call | What it does |
|---|---|
| `S.give('drill')` | Grant an item (`S.items` lists them) |
| `S.stats()` | Current computed stats |
| `S.restart(seed?)` | New run |
| `S.hold('obsidian')` | Put a block in your hand |
| `S.tp(x, y, z)` | Teleport |
| `S.debug(false)` | Hide the debug readout |
| `S.trace()` | Record which hooks touch each event |
| `S.game` | The whole `Game` object |

URL parameter `?seed=123` picks the seed.

## Tests (`tests/`)

Vitest, Node environment, no rendering: event bus semantics, RNG determinism and stream independence, stat layering, block damage targets (dirt 1 hit, brick 4, deepstone 13 with starting intentions), template validity, mesher face culling, DDA hits, box collision, deterministic generation and border dirty-marking.
