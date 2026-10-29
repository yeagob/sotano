# The Roots — Research and Technical Proposal (v0.2, draft)

Companion to [DESIGN.md](../design/built/story/PILLARS.md). Two parts: **what we know about how Isaac and Noita are built**, and **how we build The Roots** for the browser (WebGL), open source, deployed on Vercel. For how the code that exists *today* is organised, see [ARCHITECTURE.md](../architecture/OVERVIEW.md); the item system as built (after its review) is in [ITEMS.md](../architecture/ITEMS.md), floors and templates in [ROOMS.md](../architecture/ROOMS.md).

> **About sources.** The Isaac material comes mainly from its public modding API (documented by the community in IsaacDocs) and from the analysis of its floor generation (Boris the Brave, with input from Florian Himsl). The Noita material comes from the GDC 2019 talk *Exploring the Tech and Design of Noita* and articles by Nolla Games. Details marked *(verify)* are from memory or secondary sources.

---

## Part I — Research

### 1. The Binding of Isaac: how everything gets to interact

Isaac (Rebirth onwards) is a custom C++ engine with a Lua layer for mods. We don't have its code, but the mod API reveals its mental model very well, because mods can do almost everything official items do.

#### 1.1 Entity identity: `Type.Variant.SubType`

Everything in a room is an entity identified by three numbers: type (player, tear, enemy, pickup, bomb…), variant (which specific enemy, which kind of tear) and subtype (variation). Pickups (hearts, keys, bombs, pedestal items) are entities like any other. This enables generic rules: "any explosion damages any vulnerable entity".

**Lesson:** a single entity model for *everything*, with data identifiers, not separate classes per kind.

#### 1.2 Stats recomputed from scratch (the "cache")

When the player's items change, the game marks which stats are "dirty" (damage, fire delay, shot speed, range, speed, luck, flight, tear flags, tear colour…) and **recomputes them from base values**, applying every item in order. In the mod API this is the `MC_EVALUATE_CACHE` callback with `CacheFlag`.

Consequences:
- No accumulated errors from adding and subtracting as items come and go.
- Order matters (adds before multipliers), and Isaac's famous damage formula (square roots and final multipliers) is exactly that pipeline.

**Lesson:** stats are a *pure function* of (base, items, temporary effects). Recompute, never mutate.

#### 1.3 Tear flags: cheap composition

Projectiles carry a set of flags (`TearFlags`: homing, piercing, spectral, explosive, bouncing, splitting, slowing, poison…). Each item adds flags and the projectile *update* checks each one. Because the flags are independent, **most synergies come for free**: homing + explosive = homing explosive, with nobody coding it.

**Lesson:** behaviours as independent, orthogonal flags/modules. 80% of synergies are this.

#### 1.4 Weapon types and precedence: the exceptions

The other 20% are items that **replace** the basic shot (Brimstone, the knife, the laser, Dr. Fetus…). Flags aren't enough there: when you take two, the game decides which wins and how they combine (a beam that fires knives, bombs that release beams…). Many of these combinations are **hand-written** one by one, and the community documents them in huge synergy tables.

**Lesson:** we need (a) a **precedence table** between weapon types and (b) an explicit home for **hand-written exceptions**, instead of `if`s scattered across the codebase.

#### 1.5 Events that can modify or cancel

The API exposes events for almost everything: per-frame update, taking damage (cancellable or modifiable), firing a tear, before a tear collides, picking something up, entering a new room, starting a floor, clearing a room… Official items and mods hook into these. This is what allows items with odd rules ("on taking damage, drop a bomb", "on room clear, heal half a heart").

**Lesson:** an event bus with **priority order** and a **mutable/cancellable context**. It's the game's backbone.

#### 1.6 Floor generation

Per Boris the Brave's analysis (reviewed by Florian Himsl):
1. A **floor plan** is generated on a grid (13×13 in Rebirth *(verify)*): start from the centre room and expand with a queue, adding random neighbours, refusing a new cell that would have more than one filled neighbour (so there are no loops) and capping the room count.
2. **Dead ends** are reserved for special rooms; the farthest one for the boss.
3. Each room's interior is picked from a **catalogue of hand-made templates** by floor and type.
4. The result is a tree (no loops, except the secret room).

Templates are edited with external tools (the community uses *Basement Renovator*). In short: **procedural plan + hand-made content**.

#### 1.7 Item pools, seeds and RNG

Items come from **pools** per room type (treasure, boss, devil, secret…), weighted; once one drops it's removed from the pool. Each run has a **seed**, and the game uses separate generators per purpose so that shooting more or less doesn't change which items appear. That enables shared seeds and reproducible debugging.

### 2. Noita: a world that opens through knowledge

#### 2.1 Tech

- **Every pixel is a simulated material** (sand, water, lava, gas, wood…), with cellular-automaton-style rules: liquids check down first and then sideways, gases rise, fire spreads through flammables.
- The world is split into **chunks** (64×64 pixels *(verify)*) and each keeps a **dirty rectangle**: only what changed is simulated. Chunks update in several checkerboard passes so several threads can work without two threads touching neighbouring pixels at once.
- **Rigid bodies** (chunks of rock that break off) are created by tracing the pixels' outline (marching squares), simplifying it and creating a Box2D body; as they move, their pixels are "painted" back into the world.
- The world is generated from **templates** and tiling techniques (Herringbone Wang tiles *(verify)*) over fixed vertical biomes.

#### 2.2 Design

- The main path is a vertical line of biomes. But the world is **much wider** than it looks, and to the sides there are parallel worlds, hidden areas and secrets.
- Much of the content is never announced: orbs, tablets, alchemy with recipes that **depend on the seed**, glyphs the community spent years studying.
- What takes you further is **knowing**, not levelling up.

#### 2.3 What we take and what we don't

| From Noita | Take it? | Why |
|---|---|---|
| Per-pixel/voxel simulation of everything | **No** | In 3D the cost explodes (a floor is millions of voxels). We simulate **discrete blocks**, not particles. |
| Dirty rects / only simulate what changed | **Yes** | Essential for meshing and block physics. |
| Pieces breaking off as rigid bodies | **Partly** | Single loose blocks yes; connected groups (a whole wall falling) later. |
| Liquids | **Later** | Water/lava at block level, Minecraft-style, with a per-frame budget. |
| World wider than the path, unannounced secrets | **Yes** | It's design pillar 4. |
| Seed-dependent recipes | **Yes** | Cheap to build and adds a lot of life. |

---

## Part II — Technical proposal for The Roots

### 3. Architecture principles

1. **Data first.** Materials, enemies, items, rooms and pools live in data files (typed TypeScript or validated JSON). Code implements *mechanisms*; data defines *content*.
2. **One damage system** for enemies, player, blocks, doors and chests.
3. **One event bus** every item hooks into (§4.2).
4. **Recomputed stats**, never mutated (§4.3).
5. **Deterministic per seed**, with separate RNG streams per purpose.
6. **Hot paths outside the entity system:** voxels, loose cubes and particles live in typed arrays with their own systems. Entities (player, enemies, intentions, pickups) are few, and there flexibility wins.

### 4. Game core: how synergies happen

#### 4.1 Entities and components

A small home-grown ECS (or `bitecs` if the numbers call for it). Example components:

```ts
Transform, Velocity, Collider, Health, Faction,
Projectile { spec: IntentSpec }, Pickup { kind },
Enemy { def, state }, Door { lock }, Statuses { burning, slowed, ... }
```

Each entity has a `defId` (the equivalent of Type.Variant.SubType) pointing at its data.

#### 4.2 Event bus with priority and context

```ts
type Hook<C> = { priority: number; source: string; fn: (ctx: C) => void };

events.on('damage', { priority: 100, source: 'item:stone_heart', fn: ctx => {
  if (ctx.target === player && player.heldBlock) {
    ctx.cancel(); dropHeldBlock('shatter');
  }
}});
```

Minimum events: `tick`, `fire`, `intentHit`, `damage` (before and after), `death`, `blockDamage`, `blockBreak`, `blockPlace`, `kick`, `pickup`, `explosion`, `roomEnter`, `roomClear`, `floorEnter`, `fall`.

- The context is **mutable** (change damage, position, flags) and **cancellable**.
- Priority fixes the order: modifiers first, then cancellations, then side effects.
- Every hook carries a `source` so you can debug "why did this intention do that?" (a record of which hooks touched each event, switchable in development).
- Infinite-loop protection: a max nesting depth (an explosion breaking an explosive block that explodes…), with a deferred queue for chain reactions (like the Hockey Stick in the Joel gift project).

#### 4.3 Layered stats

```
value = clamp( (base + Σ adds) × Π multipliers , min, max ) → final overrides
```

- Each item declares modifiers `{ stat, layer: 'add'|'mul'|'final', value }` or a function for odd cases.
- Recomputed when items are gained/lost or a temporary effect changes, only for dirty stats.
- Includes `projectileFlags` and `weaponType`, just as Isaac includes flags and tear colour in its cache.

#### 4.4 Composable projectiles and weapon types

```ts
interface IntentSpec {
  damage: number; mining: number; speed: number; flight: number;
  gravity: number; radius: number;
  behaviors: Behavior[];   // homing, pierce(n), bounce(n), split, explode(r), burn, drill(n)...
}
```

- Each `Behavior` is a module with its own hooks (`onSpawn`, `onUpdate`, `onHitEntity`, `onHitBlock`, `onExpire`). **All** apply, in declaration order. That's the 80% of synergies.
- **Weapon types** (intention, beam, thrown pickaxe, drill…): a `WeaponType` decides *how* damage is delivered and **which behaviours it accepts**. The highest-precedence one from a table wins.
- **Explicit exceptions:** a `synergies.ts` registry with entries `{ requires: ['beam', 'drill'], apply(spec) }`. Every hand-written combination lives in one place, with its own test.

#### 4.5 Unified damage (blocks included)

```ts
damage({ source, target: EntityRef | BlockRef, amount, kind: 'intent'|'explosion'|'fire'|'crush'|'kick'|'melee', flags })
```

- For a block: `effective = max(amount × mining × resist[kind] − armor, amount × 0.1)`. The 10% floor guarantees "with enough intent, everything breaks".
- Damaged blocks' HP lives in a separate `Map` (only touched blocks), with visual crack stages.
- Materials react through properties: `flammable` + fire damage → a burning state that spreads to neighbours with a per-frame budget.

### 5. Voxel world

#### 5.1 Data

- **32×32×32 chunks** with a local palette (`Uint8Array` indices + per-chunk material table) or a plain `Uint16Array` past 255 materials. (M0 uses 16³ chunks over one flat array.)
- **World = deterministic generator + deltas.** Every chunk can be regenerated from the seed; only the **player's changes** (broken and placed blocks) are stored, in a `Map<chunkKey, Delta>`. Unloading and reloading a floor loses nothing and memory stays low.
- Floors as vertical bands: floor *n* occupies a fixed Y range. The current floor and its neighbours stay loaded; the rest is unloaded.

#### 5.2 Generating a floor

1. Isaac-style room plan (§1.6) on a grid of, e.g., 9×8 room cells.
2. Special rooms assigned to dead ends; boss at the farthest one.
3. For each cell, a **room template** from the catalogue (own format, editable with a simple in-browser editor or imported from MagicaVoxel `.vox`).
4. Rock fill around it with 3D noise: material veins, small caves and **hidden pockets** placed by rules (away from rooms, at certain depths).
5. Separation slab with the floor's tier.

All with separate RNG streams (`rng.floorplan`, `rng.rooms`, `rng.rock`, `rng.loot`, `rng.combat`).

#### 5.3 Meshing

- Meshing **in Web Workers**: the main thread sends the chunk (with a 1-voxel border from its neighbours) and receives transferable geometry buffers.
- Start with the Joel project's algorithm (visible faces + per-vertex AO), which already works; move to *greedy meshing* if triangle counts call for it (careful when merging faces with AO).
- Remesh budget per frame, prioritising chunks near the camera.
- Textures: an **original** 16×16 pixel-art atlas (no Mojang textures) with *nearest* filtering.

### 6. Physics

There are three distinct problems, and they shouldn't share one tool:

| What | Solution | Why |
|---|---|---|
| Player and enemies vs. the world | **Custom:** box vs. voxel grid, swept per axis | What Minecraft does; precise, cheap, no dependencies |
| Intentions | **Custom:** stepped DDA raycast through the grid (Amanatides–Woo) | Exact block and face hit |
| Loose blocks (fall, roll, get kicked, stack) | **Custom:** typed arrays + ring buffer, box vs. grid, per-column hash for stacking | Thousands of cubes at a few ms per frame |

**Decision change in M1.** M0 used Rapier (WASM) for loose blocks: nice tumbling, but capped at ~150 bodies, a 4.9 MB bundle and async start-up. The Joel gift project had shown that a custom cube system handles thousands of cubes smoothly, and the owner asked for that. M1 replaced Rapier with that approach, improved:

- One cube = an axis-aligned 0.72 box moved one axis at a time against the voxel grid (and closed doors), with substeps against tunnelling.
- Resting cubes are hashed per column; falling cubes land on them, so piles stack. A resting cube that loses its support falls again.
- Rotation is visual only: tumbling in the air, flat with a random yaw at rest.
- A ring buffer of 2000 cubes (1000 on touch devices): when full, the oldest slot is reused. Cubes despawn after 90 s, shrinking smoothly to nothing over the last 8.
- All cubes render in one `InstancedMesh`; each instance picks its atlas tile in the shader.
- Measured in the browser: 2000 moving cubes ≈ 3.7 ms per frame (median), 5.2 ms p95.

What we gave up: true rotational collisions (a cube resting on an edge). If that's ever needed for a specific mechanic, a physics engine can be added for a handful of "special" bodies without moving the mass of debris back onto it.

### 7. Rendering

- **Three.js** (WebGL2). `WebGPURenderer` as a future option, not up front.
- World chunks as `Mesh` with a single material (atlas). Loose cubes and pickups as `InstancedMesh`. Particles in a single instanced mesh.
- **First-person hands** in a second pass with their own camera and FOV, clearing only depth, so they never go through walls.
- Lighting: per-vertex light baked during meshing (AO + Minecraft-style block light level) instead of real-time shadows. Cheap and the right look.
- Per-floor fog and darkness for a sense of depth and cheaper drawing.

### 8. Enemies

- Simple, declarative **state machines** in data (`idle → chase → attack → cooldown`), parameterised per enemy.
- **Navigation:** a per-room *flow field* over walkable cells (BFS from the player), recomputed when the player changes cell or a block in the room is broken/placed. Cheap because rooms are small.
- Enemies use the same damage system against blocks: a blocked zombie "mines" the block; the exploder emits an `explosion` event that breaks blocks exactly like a bomb.
- **Bosses** made of voxels: one voxel model per body part; damaging a part breaks its voxels (like the Joel statue) into physics cubes.

### 9. Content as typed code

```ts
export default defineItem({
  id: 'fire_intent',
  pools: ['treasure'],
  weight: 1,
  stats: [{ stat: 'damage', layer: 'add', value: 0.5 }],
  behaviors: ['burn'],
  hooks: {
    blockDamage(ctx) { if (ctx.material.flammable) ctx.amount *= 2; },
  },
});
```

- One file per item/enemy/material; a generated index registers them.
- **Validation at startup** (duplicate ids, missing pools, unknown behaviours).
- This is also the seed of a **mod API**: if the official game uses the same `defineItem` a mod does, mods come almost for free (Isaac's big lesson).

### 10. Testing: insurance against synergy chaos

- **Logic tests** (Vitest) for the core without rendering: stats, flags, block damage, floor generation by seed.
- **Automatic synergy matrix:** a test walks every pair (and a sample of triples) of items, simulates N seconds of casting in a headless test room and checks for exceptions, `NaN`s, out-of-range stats and event loops.
- **Golden generation tests:** seed X always yields the same plan.
- **Browser smoke test** (Playwright): the game loads, moves, casts, breaks a block, no console errors.
- **Debug menu** in development: grant any item, list active hooks, show dirty chunks, FPS, body count.

### 11. Persistence

- **Run in progress:** seed + voxel deltas + entity state, in IndexedDB, saved on room change (so you can close the tab on mobile and resume).
- **Meta-progression** (unlocks, discovered recipes, stats): IndexedDB with export/import to file.
- No server: everything runs in the browser, consistent with a static Vercel deploy.

### 12. Stack and project

| Piece | Choice |
|---|---|
| Language | Strict TypeScript |
| Build | Vite (ESM, native workers) |
| Rendering | three.js (pinned version) |
| Block physics | Custom (typed arrays), see §6 |
| ECS | Small home-grown (or `bitecs`) |
| Audio | WebAudio synthesis, as in the Joel project (zero files, zero licensing issues) |
| Tests | Vitest + Playwright |
| CI | GitHub Actions: types, tests, build; Vercel preview per PR |
| Deploy | Vercel, static site (`vite build` → `dist/`) |

### 13. Performance budgets

| | PC | Mobile |
|---|---|---|
| Target FPS | 60 | 30–60 (adaptive) |
| Chunks remeshed per frame | 4 | 1–2 |
| Active physics bodies | 150 | 60 |
| Simultaneous enemies | 20 | 12 |
| Draw distance | current floor ±1 | current floor |

Measure early on a mid-range phone; it drives most decisions.

### 14. Open source and intellectual property (important)

- **Code:** MIT (or GPL if forks should stay open). **Original art and sound:** CC BY-SA 4.0 or CC BY 4.0.
- **Must not use** Mojang material (textures, models, sounds, names like "Creeper") or Edmund McMillen / Nicalis material (item names like Brimstone, characters like Isaac or Azazel, sprites, sounds). The *style* (blocks, room-based dungeon, synergies) isn't protectable; *assets and names* are. The Joel project is a private gift, so it doesn't matter there; a public one needs its own names and art from the first commit. (This is one more reason the shot is called *intentions*.)
- Credit the inspirations in the README without using their trademarks in the title or logo.

### 15. Roadmap

| Milestone | Content | Question it answers |
|---|---|---|
| **M0 — Toy** ✔ | Vite+TS, breakable 13×7 room, FPS controller with hands, intentions that drop, physics cubes, pick up/kick/place/throw | Is breaking, carrying and placing fun in first person? |
| **M1 — One floor** ✔ | Floor plan generator, connectable room templates, Doom-style doors and keys, treasure/vault pedestals, items + synergies on the reviewed item architecture, stats panel, minimap, custom cube physics | Does Isaac's structure work in 3D with breakable walls? |
| **M1.5 — Combat and depth** ✔ | Stacked floors descended by falling, projections (Doubt, Inner Critic, Panic) with flow-field navigation, health, bombs as fused cubes, inventory window, item icons and quality up to 4, item safety layers (validation, runtime guards, synergy matrix) | Is fighting projections in breakable rooms fun? |
| **E — Elements** | Chests, fire and barrels, water, lava, mud/sand, furnaces, electricity ([plan](../architecture/ELEMENTS.md)) | Do material interactions make the world feel alive (Noita)? |
| **M2 — Synergies** | Behaviours, weapon types, 15 items, synergy test matrix | Do surprising combinations emerge without special code? |
| **M3 — Depth** | 4 floors, slabs, streaming, digging between floors, voxel boss | Is choosing between trapdoor and digging interesting? |
| **M4 — The climb** | Special blocks, climbing to a minimal surface, run saving | Is the way back fun, or a chore? |
| **M5 — Secrets** | Hidden pockets, first lateral biome, first seed recipes, meta-progression | Does it make you want to play again to learn more? |

### 16. Main risks

1. **Readability of first-person combat.** Isaac is top-down for a reason: you see everything. Mitigation: small rooms, clear attack telegraphing, off-screen enemy indicators; and prototype an alternative camera.
2. **Digging breaks room design.** Mitigation: tiers, wall reinforcement during combat, rewards tied to clearing rooms (see DESIGN §7).
3. **The climb may be tedious.** The biggest design risk; that's why M4 is its own milestone.
4. **Physics on mobile.** Custom cube physics is cheap (≈4 ms for 2000 cubes on desktop), but meshing plus enemies on a phone is still to be measured. Cube cap halves on touch devices.
5. **Combinatorial explosion of synergies.** Mitigation: orthogonal flags, centralised exceptions, automatic test matrix.
6. **Scope.** Isaac has 700+ items after a decade. The prototype must prove the idea with 15.

---

## Sources

- IsaacDocs (community reference for Isaac's Lua API): https://wofsauge.github.io/IsaacDocs/ · overview: https://deepwiki.com/wofsauge/IsaacDocs
- REPENTOGON (API extension): https://github.com/TeamREPENTOGON/REPENTOGON
- Boris the Brave, *Dungeon Generation in Binding of Isaac*: https://boristhebrave.com/2020/09/12/dungeon-generation-in-binding-of-isaac
- Isaac wiki, floors: https://bindingofisaacrebirth.wiki.gg/wiki/Floor
- Nolla Games, *Exploring the Tech and Design of Noita* (GDC 2019), listed at: https://noita.wiki.gg/wiki/Official_Interviews_and_Videos
- 80.lv, *Noita: a game based on falling sand simulation*: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
- Rapier (WASM physics), used in M0 and replaced in M1 (see §6): https://classic.yarnpkg.com/en/package/@dimforge/rapier3d
