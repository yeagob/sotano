# Elements: architecture and implementation plan

Status: **E-core (fire, water, lava) built** (§9, §10); chests, furnaces, sand, mud and electricity are still plan. §9–§10 win where they differ from §2–§3. Review: [../reviews/elements.md](../reviews/elements.md). What the player experiences is in [../design/ELEMENTS.md](../design/not-built/elements/ELECTRICITY.md). Before step E0 is built, this design goes through the three-party review ([../reviews/](../reviews/README.md)), as for items and entities.

## 1. Principles

1. **Materials stay data.** Reactions are a table, not code paths: "fire + flammable → burning", "water + lava → obsidian", "furnace + sand → glass". New materials and reactions are rows.
2. **Simulate only what's active** (the Noita lesson). A sparse set of active cells is ticked at a fixed rate with a per-tick budget; everything else costs nothing. The voxel array and meshing stay as they are.
3. **Discrete blocks, not particles.** Fluids are levels per block (1–8), fire is a state of a block, charge is a flood fill. No per-pixel or per-voxel physics.
4. **Everything through events.** Ignite, extinguish, burn out, react, shock, fluid enter/leave, container put/take, smelt: each is an event items and enemies can hook, and the contract test covers them.
5. **Containers are block entities.** A chest, furnace or barrel is a voxel (for collision, breaking, meshing) plus a small record keyed by position (contents, fuel, timers).

## 2. Data model

### Per-voxel state

| Array | Type | Meaning |
|---|---|---|
| `data` (exists) | `Uint8Array` | Material id |
| `level` (new) | `Uint8Array` | Fluid level 0–8 for fluid materials (8 = full block); 0 otherwise |
| `burning` (new) | `Map<idx, seconds>` | Burning blocks and time left (sparse) |
| `charge` (new) | `Map<idx, seconds>` | Electrified cells (sparse, short-lived) |
| `entities` (new) | `Map<idx, BlockEntity>` | Chests, furnaces, barrels |

Water and lava are materials whose cells carry a level. Loose cubes keep their own state (`tags` already exists: `'burning'`, `'wet'`, `'charged'`).

### Material properties (extend `MaterialDef`)

```ts
flammable?: { burnTime: number; spread: number; becomes?: MatKey | null; fuel?: number };
conducts?: boolean;
fluid?: { viscosity: number; flowEvery: number; damage?: number; light?: number };
wettable?: MatKey;          // dirt → mud, sand → mud
gravity?: boolean;          // sand
fragile?: boolean;          // glass: breaks without a cube
floats?: boolean;           // in water (loose cubes)
smelt?: { into: MatKey; time: number };
melt?: { into: MatKey; time: number };  // in lava
```

### Reactions (`content/reactions.ts`)

```ts
defineReaction({ id: 'quench', when: { a: 'water', b: 'lava' }, result: { b: 'obsidian', sourceOnly: true, else: 'stone' }, fx: 'steam' })
defineReaction({ id: 'soak', when: { a: 'water', b: { wettable: true } }, after: 4, result: { b: '$wettable' } })
defineReaction({ id: 'dry', when: { a: 'fire', b: 'mud' }, after: 3, result: { b: 'brick' } })
defineReaction({ id: 'fulgurite', when: { a: 'charge', b: 'sand' }, result: { b: 'glass' } })
```

Reactions run on active cells against their 6 neighbours, emit `materialReact` (cancellable / changeable), and are covered by tests per row.

## 3. Systems

| System | Tick | What it does |
|---|---|---|
| `ElementScheduler` | 20 Hz, budget N cells per tick | Holds the active set; wakes cells around any `world.set`, explosion, fluid move or fire; drops cells that settled |
| `Fluids` | water every tick, lava every 4th | Levels flow down first, then share sideways towards lower neighbours; finite volume (sum conserved); a cell settles when nothing moved for 2 ticks |
| `Fire` | 5 Hz | Burning timers, spread rolls to flammable neighbours, burn-out → `breakBlock` (source `fire`) or `becomes`; extinguish next to water; damage to actors inside/adjacent |
| `Electricity` | on demand | Flood fill over conductive cells from a source (capped, e.g. 400 cells), marks `charge`, shocks actors touching charged cells, triggers charge reactions |
| `GravityBlocks` | on wake | Sand (and later gravel) with nothing below becomes a loose cube that falls and re-solidifies when it rests |
| `BlockEntities` | per frame (few) | Furnace smelting timers and ejection; barrel intake; chest open/close animation and contents |

All of them push their changes through the existing pipelines (`world.set` → remesh, `breakBlock`, `damagePlayer`, `damageEnemy`), so items and the HUD see them for free.

## 4. Player, enemies and cubes in fluids

- `fluidAt(x, y, z)` → `{ material, level }`. The player samples feet and head cells:
  - feet in fluid, head out → **wading**: `moveSpeed × 0.6`, jump × 0.7 (water); mud × 0.4;
  - head in fluid → **swimming**: gravity × 0.2, terminal sink speed 1.5, Space = swim up, no ground friction; **breath** stat (new, seconds) drains; at 0, `playerDamage` (kind `drown`) every 1.5 s.
- Lava: `actorDamage` (kind `burn`) 8 points (a heart) per second + `burning` status.
- Enemies use the same sampling (Overwhelm is the exception: it swims).
- Loose cubes: `floats` materials rise to the surface in water and bob; others sink at reduced speed; in lava they burn (flammable) or are destroyed.
- Intentions slow down in water (×0.5 speed) and fizzle in lava.

## 5. Rendering

- **Fluid mesh**: the mesher gets a second output per chunk: fluid surfaces with heights from `level`, rendered in a transparent pass (water) and an emissive pass (lava), UV-scrolled. Underwater: blue fog tint while the eye is submerged.
- **Fire**: billboard flame sprites on burning blocks (instanced), embers as particles, a warm point-light budget (max 4 nearest) or baked emissive tint.
- **Electricity**: short-lived line segments along the charged path + flash.
- **Block entities**: chest lid animation (separate mesh on top of the voxel), furnace mouth glow when lit, barrel flames.

## 6. Events (new)

`ignite`, `extinguish`, `burnOut`, `materialReact`, `fluidEnter` / `fluidLeave` (player, enemy, cube), `breath`, `shock`, `containerOpen`, `containerPut`, `containerTake`, `smelt`, `incinerate` (barrel). All with mutable payloads where it makes sense; all in the contract test and the synergy-matrix samples.

## 7. Chests and keys (replaces loot from blocks)

- Breaking blocks drops nothing but the block (done: `blockLoot` now starts empty), except crates, which sometimes drop a key, heart or small bomb (issue #6).
- Room templates get chest markers (`h` chest, `H` is taken: use `$` for a locked gold chest). Floor generation rolls chest contents from a `chest` table on the per-floor RNG at carve time (keys, bombs, hearts; rarely a practice from a `chest` pool).
- The vault key moves from the floor into a chest.
- Chest storage: `{ items: (PickupKind | { material }) [] }`, capacity 9, persisted for the run.

## 8. Step-by-step implementation plan

Each step is a mergeable unit with its own tests, docs and browser check (per the `sotano-feature` skill).

### E0 — Groundwork *(review first)*
- [ ] Three-party review of this document; record it in `docs/reviews/elements.md`.
- [ ] Extend `MaterialDef` with the properties above; validator for materials (like items).
- [ ] `VoxelWorld`: `level` array, sparse `burning` / `charge` / `entities` maps, `wake(x, y, z)` hook on `set`.
- [ ] `ElementScheduler` with active set, fixed tick, per-tick budget, perf counter in the debug HUD.
- [ ] `content/reactions.ts` + reaction runner + `materialReact` event; tests per reaction.
- [ ] New events added to the catalogue, contract test and synergy-matrix samples.

### E1 — Chests (keys move here)
- [ ] Chest material + block entity + lid mesh; `F` to use (input).
- [ ] Template markers and chest placement; contents table and `chest` item pool; vault key placed in a chest.
- [ ] Open: contents pop out as pickups/cubes; locked chests use a key.
- [ ] Put/take: right click deposits the top block; F with an empty hand takes the last one; capacity 9; breaking spills.
- [ ] Events `containerOpen/Put/Take`; tests (contents determinism, capacity, spill).

### E2 — Fire, flammables and burning barrels
- [ ] `Fire` system: ignite, burn timers, spread, burn-out via `breakBlock`/`becomes`; actor damage.
- [ ] Burning loose cubes (tag), kicking/throwing spreads fire; burn-out destroys the cube.
- [ ] Lit barrel material + template marker; any cube entering it is incinerated (`incinerate` event).
- [ ] Flame sprites, embers, sounds; extinguish by water (stubbed until E3).
- [ ] Tests: spread on a crate pile, barrel destroys a stone cube, fire never spreads to non-flammables, budget respected.

### E3 — Water
- [ ] `Fluids` system (finite, levels, down-then-sideways, settling); water material.
- [ ] Fluid mesh + transparent pass + underwater fog.
- [ ] Player wading (1 deep) / swimming (2+ deep) / breath stat + HUD meter + drowning damage.
- [ ] Cubes float/sink; intentions slow in water; enemies wade.
- [ ] Wettable blocks → mud (reaction); fire extinguished by water.
- [ ] Template water features (pools, flooded rooms) and water pockets in the rock.
- [ ] Tests: volume conservation, a 2-deep pool makes you swim, a crate floats, drain through a hole.

### E4 — Lava
- [ ] Lava material (slow flow, emissive, light); damage and burning status.
- [ ] Water + lava → obsidian / stone with steam; lava ignites flammables and destroys cubes.
- [ ] Lava pockets on deeper floors (floor 3–4).
- [ ] Tests: quench reaction, cube destruction, no infinite lava growth.

### E5 — Sand, mud, glass
- [ ] Sand (gravity block), mud (slow, weak kicks), glass (fragile).
- [ ] Reactions: soak (dirt/sand + water → mud), dry (mud + heat → brick).
- [ ] Tests for each reaction and for falling sand.

### E6 — Furnaces
- [ ] Furnace block entity: fuel, input, timer, ejection; recipes table (stone→brick, sand→glass, ore→iron, dirt/mud→brick, crate→coal).
- [ ] Insert by throwing/placing into its mouth; unsmeltable things are stored and handed back.
- [ ] Mouth glow, smoke, sounds; `smelt` event.
- [ ] Template marker; tests for each recipe and for storage.

### E7 — Electricity
- [ ] Conductive materials, `Electricity` flood fill with cap, `shock` event, stun + damage.
- [ ] Water conducts; sand → glass; ignites flammables.
- [ ] Spark visuals and sound; charged blocks in some rooms as sources.
- [ ] Tests: propagation cap, water conduction, no charge through non-conductors.

### E8 — Practices and projections that use elements
- [ ] Items: Breathwork (breath), Fire Walking (fire immunity), Cold Exposure (extinguish on touch), Alchemy (better furnace results), Insight (electric intentions), plus synergies.
- [ ] Enemies: Burnout, Overwhelm, Stagnation, Spark (one file each, new behaviours where needed).
- [ ] Synergy matrix extended with element events.

### E9 — Polish and performance
- [ ] Budgets measured on desktop and a mid-range phone; scheduler limits tuned.
- [ ] Docs, README and STORY updated; owner playtest; feedback recorded in the `sotano-feature` skill.

## 9. E-core proposal (2026-10-26): fire, water and lava first

The owner asked for the elements first (fire, water, lava), then rooms built around them, then
projections that react to or live in each element. Chests, furnaces, sand, mud and electricity
stay in E1/E5–E7. This section replaces E0, E2–E4 where it differs from §2–§3.

### 9.1 One element layer, not fluid materials

`VoxelWorld.elem: Uint8Array`, one byte per voxel. *As built (review point 2):* bits 6–7 kind, bit 5 falling, bits 0–3 level; helpers `elemByte`, `elemKind`, `elemLevel`, `isFalling`, `isSource`, `fluidHeight` in [`content/elements.ts`](../../src/content/elements.ts).

| kind | Name | level |
|---|---|---|
| 0 | none | 0 |
| 1 | water | 1–7 flowing (7 = falling), 8 = source |
| 2 | lava | same as water |
| 3 | fire | 1–7 seconds-ish of fuel left, 8 = eternal (a template brazier) |

A cell with an element is **air in `data`**. Every `solid()` / `!== AIR` check stays exactly as it
is (collision, raycasts, mining, meshing of blocks, flow fields), which is the main reason for
this choice over §2's "water and lava are materials". Setting a solid block into an element cell
displaces the element (`set` clears `elem`). Breaking a block next to an element wakes it.

### 9.2 Simulation (`src/world/elements.ts`)

- An active set of voxel indices; `world.set` and `setElem` wake the cell and its 6 neighbours.
- Fixed tick 10 Hz; water every tick, lava every 3rd, fire every tick. Budget 3000 cells per tick;
  overflow carries to the next tick. Cells drop from the set when nothing changed.
- **Flow is Minecraft-style and bounded**, not finite (owner question 2 stays open): sources never
  change; a flowing cell's level is recomputed from its neighbours (falling if the same fluid is
  above; otherwise max(horizontal neighbour − drop)), drop 1 for water (reach 7), 2 for lava
  (reach 3). Fluids go down first; they only spread sideways from cells that rest on something.
  Remove the source and the flow recedes. A template pool is all sources, so it never drains;
  breaking its wall spills a bounded tongue.
- **Reactions are data** (`src/content/reactions.ts`), checked on active cells against their 6
  neighbours: water + lava source → obsidian, water + lava flow → stone (steam, hiss); water next
  to non-eternal fire → put out; fire/lava next to a flammable block → it ignites (block becomes a
  fire cell with level 6 and breaks through `breakBlock(kind 'fire')`, no loose cube); fire
  decays 1 level per 0.5 s unless eternal; fire spreads to flammables with a chance per tick
  (table + `elements` stream, cosmetic timing is fx).
- Events (new, all in the contract test): `ignite` (cancellable), `materialReact` (cancellable,
  result changeable), `elementEnter` / `elementLeave` for actors (react only).

### 9.3 Actors, cubes, intentions

- `elementAt(x,y,z)` sampled at feet and eyes. Player: **wading** (feet only, water) × 0.6 speed,
  jump × 0.7; **swimming** (head under) gravity × 0.2, sink cap 1.5 b/s, Space swims up, breath
  drains (new stat `breath`, seconds, base 8) then `drown` damage (half a heart per 1.5 s). Lava:
  × 0.4 speed, swim-like, 1 heart per hit (`fire` kind, source `lava`). Fire: half a heart.
  All through `damageActor`.
- Projections get `EnemyDef.elements` (affinity per element: `harm` multiplier, `speed` multiplier,
  `path: 'avoid' | 'cross' | 'dwell'`, optional `enter` reaction). Defaults: water cross ×0.6
  harm 0; lava and fire avoid, harm 1. The flow field reads a `hazard` callback: avoided cells are
  not walkable; `dwell` cells cost less (projections that live there stay in them).
- Loose cubes: lava destroys any non-obsidian cube (flammable ones flare); fire burns flammable
  cubes; water drags all cubes and floats flammable ones.
- Intentions slow in water (× 0.5 per second, exponential) and go out in lava.

### 9.4 Rendering

- The mesher returns a second mesh per chunk: element faces with heights from `level` (source top
  at 7/8, full when the same fluid is above), drawn in three geometry groups: water (transparent
  α 0.7, double-sided, no depth write), lava (opaque, full-bright, scrolling), fire (two crossed
  quads per cell, alpha-tested, 4 frames at 8 fps). Textures painted from palette tokens added
  from DECISIONS §3.8.
- Until block light (Phase B) lands, solid faces next to lava or fire get a baked warm tint in
  their vertex colours (radius 1). Eye under water: fog `#0D2A3A`, far 10; in lava: lava fog.

### 9.5 Rooms that use height and elements

Templates gain optional `height` (5–9, interior), `ceiling` (`flat` | `vault-x` | `vault-z` |
`dome`), `layers` (extra 13×7 grids at a height above the floor, for bridges and balconies) and
new cell chars: `w`/`W` water 1/3 deep (dug into the floor), `l`/`L` lava 1/2 deep, `f` eternal
fire, `_` a 1-deep dip, `1`–`4` rock terraces of that height. The validator keeps doors, centre,
pedestal and shaft rules, forbids water next to lava and fire next to flammables at carve time,
and caps vertical reach so a room never touches the floor above or below (test: rock buffer
between bands is intact for every template).

## 10. As built (2026-10-26)

| Piece | Where | Notes |
|---|---|---|
| Element data | [`content/elements.ts`](../../src/content/elements.ts) | Water, lava, fire: flow drop and beat, harm, wade speed, swim, breath, emissive, palette ramp, fog. `DEFAULT_AFFINITY` for projections |
| Reactions | [`content/reactions.ts`](../../src/content/reactions.ts) | `quench` (water + lava source → obsidian, + flow → stone), `douse` (water puts fire out) |
| Layer | [`world/world.ts`](../../src/world/world.ts) | `elem`, `setElem`, `elemDirty`, `elemVersion`, `onChange`; a block placed in a cell displaces its element (intended, review point 7) |
| Simulation | [`world/elements.ts`](../../src/world/elements.ts) | 10 Hz, 3000 cells per tick, at most 3 ticks per frame; read-then-apply; flames need a block under them; at most 12 blocks catch per tick |
| Meshing | [`world/elem-mesher.ts`](../../src/world/elem-mesher.ts), [`render/chunks.ts`](../../src/render/chunks.ts) | Corner heights averaged with neighbours (flows slope like ramps); fire as crossed quads; water α 0.72 after opaque; lava full-bright; textures in [`render/element-textures.ts`](../../src/render/element-textures.ts) animated by offset (fire 4 frames at 8 fps); block faces next to lava or fire get a baked warm glow |
| Game | [`game/game.ts`](../../src/game/game.ts) "elements" section | Ignite through `ignite` → `breakBlock(kind 'fire')` (no loot); reactions through `materialReact`; player wading/swimming/breath/burns; projections' senses; loose cubes (lava consumes all but obsidian, fire burns wood, water drags and floats wood, a bomb in fire or lava goes off); intentions slow in water and go out in lava; fog of the element your eyes are in |
| Events | [`game/events.ts`](../../src/game/events.ts) | `ignite`, `materialReact`, `elementEnter`, `elementLeave` |
| Stat | `breath` (8 s) | HUD: eight bubbles under the hearts while breath isn't full |

### Projections in the elements

`EnemyDef.elements` overrides `DEFAULT_AFFINITY` per element: `harm` (multiplier, 0 = immune), `speed` (inside it), `path` (`avoid`: its flow field won't step there; `cross`; `dwell`: cheap cells, it keeps to them) and `enter(e)` (a reaction when its body goes in). Flow fields are per room, target and kind of projection. Element hits on a projection come at most every 0.5 s.

| Projection | Water | Fire / lava | Why |
|---|---|---|---|
| Doubt | avoids it; × 0.35 if it falls in | default (avoid, hurts) | It keeps you still because still is safe: it won't follow you into your feelings |
| Inner Critic | crosses at × 0.45 | avoids; hurts × 2 | A stack of paper: soaked pages shuffle, paper burns |
| Panic | crosses at × 0.5; entering **calms** it for 2.5 s, even mid-swell | avoids; entering sets it off at once | An alarm that rings when nothing is on fire: feeling it calms it; real fire is what it was waiting for |

No projection dwells in an element yet: the first dwellers (Overwhelm in deep water, Burnout in fire) come with their art ([../design/ELEMENTS.md](../design/not-built/elements/ELECTRICITY.md) §3).

### Later

Band freezing (review 16), a distance-from-source cap if playtests show runaway cascades (3), block light (art Phase B) replacing the baked glow, burning status on actors, steam as a gas.
