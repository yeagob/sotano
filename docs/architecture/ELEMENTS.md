# Elements: architecture and implementation plan

Status: **plan.** What the player experiences is in [../design/ELEMENTS.md](../design/ELEMENTS.md). Before step E0 is built, this design goes through the three-party review ([../reviews/](../reviews/README.md)), as for items and entities.

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

- Breaking blocks drops nothing but the block (done: `blockLoot` now starts empty).
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
