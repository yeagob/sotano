# The upper world: the sky realm, Totality and the endgame

Up: [Architecture](README.md)

Status: **accepted with changes, not built.** Engineer's proposal (2026-11-03), critiqued by the architect and ruled by the mediator in the three-party review: [../reviews/sky.md](../reviews/sky.md). This page is the plan the work packages of §16 build. Ids in brackets (B1, M5, m9…) point to the review's rulings.

The design this builds is in [the realm of the sky](../design/not-built/sky/README.md) (laws, [guardians](../design/not-built/sky/guardians/README.md), [minions](../design/not-built/sky/minions/README.md), [hindrances](../design/not-built/sky/abilities/README.md)), [Totality](../design/not-built/levels/TOTALITY.md), [the endgame](../design/not-built/story/ENDGAME.md), [the return](../design/not-built/levels/ENDING-AND-RETURN.md), [meta-progression](../design/not-built/story/META-PROGRESSION.md) and the [triple jump](../design/not-built/player/MOVEMENT-ABILITIES.md). Line numbers below are those of `src/game/game.ts` at `20b1d54` (checked by the mediator); a package re-finds them before editing.

## 0. In one paragraph

The run gets a **second world**. The dungeon world (the ten floors and the built giant tree with its seven stories) stays exactly as it is and is still the climb. Reaching the top of the built tree carries the player, through a short fade, into the **sky realm**: a `SkyWorld` whose shape is a formula (a list of shapes: slabs, rings, columns, runs, stairs, blobs) and which stores only its **exceptions** (blocks broken, placed or changed), materialised chunk by chunk for the mesher and evicted when far. The realm holds the **sky tree** with the five guardian floors stacked inside it (panda, koala, elephant, lion, horse); the way up from each floor opens only when its deity is won. **Totality** rises above the crown and ends at the **closed threshold of the Sun** (Unity is issue #95, not built). **The player cannot die in the sky** (owner, 2026-11-03): no sky creature takes health; a deity can capture the player and take one practice, special attacks drain spirit, and spirit at zero sends the player underground. Hindrances and minions only push, slow or hold (provisional). The game swaps a small **realm set** of per-world systems (world, chunk renderer, elements, loose cubes, pickups, projections) when the player passes, keeps the dungeon reachable only through the typed `dw` field and a guard at every dungeon-only call, and runs the sky's own systems (laws, creatures, hindrances) in place of the dungeon's room bookkeeping. New code lives in `src/sky/` and `src/endgame/`; `game.ts` gets the seams of §2.6 and no others. At the bottom, the invulnerable **Spiked Entity** waits in the chamber of silence; meeting it reveals that the way is up, carves a **staircase** through every floor to the surface and saves one flag in `localStorage`, so every later run has a staircase from **floor 0, the roots,** to the surface.

## 1. What is built and what is not

| Built by this plan | Not built (later, or another game) |
|---|---|
| The sky realm as its own formula world, both ways in and out | Unity, sky floor 7 (issue #95, a different game) |
| The sky laws 3.1–3.9 as systems, and no harm in the sky | The solar relic and any rematch with the Spiked Entity (owner decision 3) |
| A deity framework, a minion framework, eight hindrances | Solar-wind hindrances in Totality (open question 3 there) |
| Five guardian floors from their B6 layout rules | Any sky time limit (open in the sky README) |
| Totality: three strata, the triple-jump route, updraft recovery, the entrance to the Sun | Saving a run in progress |
| The Triple Jump (the horse's gift) | Other unlocks, recipes, side biomes (META-PROGRESSION ideas) |
| The Spiked Entity, its revelation, the staircase, the persisted unlock, the staircase on floor 0 | A menu option to forget the unlock (the console only, provisional) |

Where a design document leaves a question open, the build takes the proposal written there and marks it **provisional** in the design text (owner decision 4). §19 lists the owner's decisions, the provisional answers, and what is still open.

## 2. The realm model

### 2.1 Two worlds, one run

```ts
// src/sky/types.ts (contracts, K0) — implemented by src/sky/realm.ts (R1)
export type RealmKind = 'dungeon' | 'sky';

/** The systems that belong to one world. Swapping them is how the game changes worlds. */
export interface RealmSet {
  kind: RealmKind;
  root: THREE.Group;            // every scene object of this world hangs here
  world: VoxelSpace;            // VoxelWorld below, SkyWorld above (§3)
  chunks: ChunkRenderer;
  elements: ElementSim;
  debris: DebrisSystem;
  pickups: Pickups;
  enemies: Enemies;             // the sky's is an empty instance: every this.enemies call stays harmless
}
```

- `Game.begin()` builds the **dungeon set** as today, with one change: the scene objects of the dungeon's systems hang under `dungeonRoot` (a `THREE.Group`) instead of directly under `this.scene` (§2.3).
- The **sky set** is built lazily, the first time the player passes up in a run (`SkyRealm.create`), from its own forks (§2.7). It stays alive for the rest of the run: going down and coming back finds the same placed blocks, the same allies and the same won deities.
- Only one set is **active**. The inactive set is frozen: not simulated, not meshed, its group hidden. Its data stays in memory (the dungeon world is 2 × 3.9 MB; the sky world is flat, §3.6).
- A new run (death, R) disposes both sets. Nothing of the sky survives a run except the meta flag (§10.3), which is not sky state.

The game keeps its fields (`this.world`, `this.chunks`, `this.elements`, `this.debris`, `this.pickups`, `this.enemies`) and **swaps them** from a stashed `RealmSet`, because rewriting the ~110 uses of `this.world` and `this.debris` as `this.realm.world` would touch hundreds of lines for nothing. Beside them, **`dw: VoxelWorld` is always the dungeon world** [M10]: every dungeon-only caller (`carveFloor`, `openHole`, `GiantTree`, `carveSandbox`, `applyPlacement`, `mapAt`, `blockCounts`, `elementCounts`, the console and the lab) takes `dw`, so the type system refuses to hand them the sky.

The swap itself lives in `src/sky/realm.ts` over a small host interface, so it is tested headless with a fake host [M14]:

```ts
export interface RealmHost {
  install(set: RealmSet): void;     // writes the six fields
  current(): RealmSet;              // reads them
  clearTransient(): void;           // intentions, particles, blasts, hazards
  hooks(kind: RealmKind): void;     // installs or removes the sky's bus hooks (owner tag 'sky')
}
export function swapRealm(host: RealmHost, stash: RealmSet, dungeonRoot: THREE.Group, skyRoot: THREE.Group): RealmSet; // returns the new stash
```

### 2.2 What is scoped to the active world

| System | Dungeon | Sky | How it is scoped |
|---|---|---|---|
| Voxels | `VoxelWorld` | `SkyWorld` | Swapped field `world: VoxelSpace` (§3.1); `dw` always the dungeon |
| Chunk meshes and their worker | one `ChunkRenderer` | one `ChunkRenderer` | Per set. Only the active one gets `update()`; the inactive one keeps its meshes, hidden with its group. On touch devices the inactive one is disposed and rebuilt under the fade (§17, risk 3) |
| Elements | `ElementSim` | `ElementSim` | Per set; the sky's runs only the hindrances' water (§6) |
| Loose cubes | `DebrisSystem` | `DebrisSystem` | Per set: a cube stays in the world it fell in. `DebrisView` reads `this.debris`, so it follows the swap |
| Pickups | `Pickups` | `Pickups` | Per set (the horse's gift is a pickup) |
| Projections | `Enemies` | an empty `Enemies` | Per set. Sky creatures are not projections and live in `SkyCreatures` (§5) |
| Doors, chests, alembics, kitchens, labs, tablets, rooms, floors, star pads | dungeon only | none | Under `dungeonRoot`; every call that could reach them from the sky is guarded (§2.5a) |
| Sky creatures, laws, hindrances, nests | none | `SkyRealm` | Run by `SkyRealm.update` |
| Actors | one registry, one id space | | `ActorRegistry.setRealm(kind)`: `all()` yields the player and the actors of the active realm only, so a blast in the sky at (50, 30, 40) never touches a dungeon projection at the same numbers (§17, risk 2) |
| Intentions in flight, particles, blasts, hazards | shared | shared | Cleared on every passage (`Intents.clear()` and `Particles.clear()` are new [M9]) |
| Hand, items, stats, hearts, keys, bombs | the player's | | Carried across untouched |
| Event bus | one per run | | The sky laws install their hooks under the owner tag `sky` on entering; `bus.off(null, 'sky')` removes them on leaving |
| HUD | shared | | The place label, the boss bar (reused for a deity's hits), the minimap hidden in the sky |

### 2.3 Scene roots

`Doors`, `Pickups`, `Chests`, `Alembics`, `Kitchens`, `Enemies`, `Hazards` (`enemies/attacks.ts` 96), `Tablets` and `ChunkRenderer` take a `THREE.Scene` today and call `scene.add`. Their parameter type widens to `THREE.Object3D` [M9]; the game passes the realm's group. Changing worlds is then `dungeonRoot.visible = false; skyRoot.visible = true`. Particles, intentions, the debris view, cracks and hands stay on `this.scene`.

### 2.4 Passing between the worlds

| Passage | Trigger | Where the player lands |
|---|---|---|
| **Up from the crown** | The last star of the built tree's last constellation (its pad carries `up: true`), or rising past the top of the dungeon world's sky (`b.y > SURFACE_Y + SKY_LIMIT − 1.5`, line 2558) from anywhere, including outside the tree (provisional, owner) | The sky realm's arrival deck, at the sky tree's foot door, floating (`Player.float`) |
| **Down by falling** | Falling off the arrival deck: `b.y < SKY_FLOOR_OUT` (realm y 4) | The dungeon world's crown platform, floating, like the carry from silence: the cost is the height lost |
| **Within the realm** | Falling through a floor's open way up, or off Totality's lowest platforms | The floor below; falls never hurt (§4) |
| **Death** | Hearts run out in the dungeon | The death screen; the restart builds a new run (both sets disposed). The player cannot die in the sky (owner decision 8) |

**The star pads** [m2]. The pads still form one cycle (`tree.ts` 324) and `padLock` keeps `-1` as "no pad". The last pad of the last constellation gets a flag `up: true`; stepping on it starts the travel up instead of teleporting to its `to`.

**The loop.** Today the top of the sky returns you to silence once silence is known (lines 2557–2561). Now **the top of the sky always opens into the sky realm** (owner decisions 1 and 6); silence still carries you up to heaven above the crown (lines 2541–2555), from where the last star (or rising) opens the realm. The loop becomes silence → heaven → the sky.

A passage is a **travel**, run by `RealmGate` (`src/sky/gate.ts`), the same shape as the restart fade:

```ts
export interface Travel { to: RealmKind; at: [number, number, number]; float: boolean }
export class RealmGate {
  /** Pure: which travel, if any, the player's position asks for this frame. Tested without three.js. */
  static check(realm: RealmKind, pos: Pos, pad: { up: boolean } | null, sky: SkyBounds): Travel | null;
  start(t: Travel): void;      // fade out 0.45 s (RESTART_FADE)
  get busy(): boolean;         // the game freezes the world while busy (joins `transitioning`)
}
```

The sequence: fade out → `swapRealm` → clear intentions, particles, blasts and hazards → `ActorRegistry.setRealm` → install or remove the sky's bus hooks → `teleport` in the new world (it finds room to stand) → wait for `chunks.busy` to be false (at most `RESTART_HOLD_MAX`) → fade in → toast (`toast.skyEnter`, `toast.skyLeave`).

### 2.5 What a frame does in the sky

`simulate()` (line 2873) keeps its order. Steps that only make sense among rooms are skipped in the sky and replaced by one call:

```ts
const below = this.realm === 'dungeon';
...
if (below) this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));   // line 2898
...
if (below) { this.touchChests(); }                                                       // line 2907
...
if (below) { this.trackPlace(dt); this.updateLoop(dt); this.updateOmens(dt); this.updateCombat(dt); this.updateChallenges(dt); this.updateSpits(dt); }
else this.sky!.update(dt);                                                               // lines 2913–2918
if (below) this.chestViews.update(dt, this.player.keys);
```

Everything else runs unchanged on the swapped fields: the player, touching blocks, firing and weapons, placing, throwing, bombs, loose cubes, elements, intentions, the empty projection system, blasts, the bus flush, pickups, particles and the views. `SkyRealm.update` runs, in this order: the gate check, regrowth, nests, the tower and outside-the-tree watch, hindrances, sky creatures, the updraft, and the HUD place label.

In `frame()` (line 2780): `stream()` (line 2826) becomes `below ? this.stream() : this.sky!.stream(eye)`; the fog and sky colour block (lines 2833–2853) becomes `below ? <today's code> : this.sky!.atmosphere(eye, this.fogColor, fog, this.stars)`.

In the sky the player's effective `jump` is at least the base value (`Player.update` option `minJump: 1`) [M13]: practices can only make the sky easier, never the route impossible (law 3.4).

### 2.5a What the sky must never reach [B1]

Shared code reaches dungeon-only systems by coordinates; in the sky the same numbers mean nothing. Every site is guarded with `below` (or reads `dw` explicitly):

| Site (line) | Today | In the sky |
|---|---|---|
| `solid()` (683) | world OR `doors.solidAt` | world only |
| `roomAt()` (686) | `floors.get(bandOf(y))` | `null` (covers the ~20 room lookups) |
| `tryPlace()` (2062) | refuses `doors.inDoorway` | no doorway check |
| `blast()` (1491) | `blastDoors` | skipped |
| `breakBlock()` (1446–1448) | `rollLoot`, then `activate(depthOf(y))` | neither: no floor is activated and no `blockLoot` is emitted (regrowing blocks must not become a loot farm) |
| `rollLoot()` (1461) | `depthOf(y)` for crates | never called |
| `touchChests()` (2907), `updateSpits()` (2918), `chestViews.update` | every frame | skipped |
| the `land` cause and `groundBand` (2882, 2887) | `bandOf(b.y)` | cause `'sky'`; `groundBand` untouched |
| `teleport()` (2395–2402) | sets `groundBand`, `room`, `zone` | `groundBand` untouched; the sky's own `placeAt` finds room to stand |
| `carve()` / `activate()` | carve a floor ahead | never reached from the sky |

A lab scenario `sky-passage` [B1, M14] climbs into the sky, breaks, places, blasts and fires there, comes back down, and asserts that the dungeon world's hash, its pickups, its doors, its chests and the set of activated floors are exactly as they were. Grouping every dungeon system behind a `below: DungeonSystems | null` getter is a later hardening (§18), taken only if a second leak appears.

### 2.6 The seams in `game.ts`

These are the whole budget; review rejects any other edit to `game.ts` [M9]. Each seam belongs to one package (§16); only four packages edit `game.ts` (V0, R1, R2, E2), never two in one wave.

| # | Where (line) | Change | Package |
|---|---|---|---|
| 1 | fields (204–302) | `dw: VoxelWorld`; `world: VoxelSpace` | V0 |
| 2 | `begin()` (391–487) | systems built on `dungeonRoot`; `dw` passed to dungeon-only callers | V0 (types), R1 (roots) |
| 3 | fields, `begin()` | `realm`, `stash`, `sky`, `gate`, `dungeonRoot`, `skyRoot`; dispose `sky` and the stash; `ActorRegistry.setRealm('dungeon')` | R1 |
| 4 | §2.5a guard sites (683, 686, 1446–1448, 1491, 2062, 2882, 2887, 2395, 2907, 2918) | `below` guards | R1 |
| 5 | `updateLoop()` (2541–2572) | the top of the sky and the `up` pad start a travel | R1 |
| 6 | `simulate()` (2873–2925) | the branch of §2.5; `minJump` in the sky | R1 |
| 7 | `frame()` (2826, 2830, 2833–2853) | streaming, visible range and atmosphere by realm | R1 |
| 8 | `get transitioning` (2955), `get debug` (2958) | `|| this.gate.busy`; realm, exceptions, cached chunks | R1 |
| 9 | `makeSkyHost()` (new, beside `enemyHost`, 904) | the whole `SkyHost` (§5.2), written once | R1 |
| 10 | intention callback `enemyAt` (337) | asks the touch router (§5.7) | R2 |
| 11 | `damageActor()` (855), `intentTouch()` (1085) | first line: a routed actor goes to its provider | R2 |
| 12 | weapon host `targets()` and `hit()` (768–775) | targets and hits through the touch router [B2] | R2 |
| 13 | `intentHitsBlock()` (1520), positive branch | `if (this.sky?.positiveHitsBlock(hit)) return true;` (law 3.2) | R2 |
| 14 | `tryPlace()` (2082) | `world.placing = true` around the placement [M5] | R2 |
| 15 | the `jump` emit (2880) | passes `air` (§9) | R2 |
| 16 | `newSandbox()`, `begin()`, `sandboxSpawn()` | a scenario may start in the sky (§15); `debugSky(...)` | R2 |
| 17 | `carve()` (544) and floor 9's carve | the entity is placed in silence; the roots' staircase when the run option is set (§10.2) | E2 |
| 18 | `updateLoop()` silence block (2541–2555) | the encounter's update; the stillness clock held while it is active [M4] | E2 |
| 19 | touch router registration | the entity as a provider (§5.7) | E2 |
| 20 | `newRun()` options, the seed label (540) | `stair: boolean` from the meta, shown as ` · stair` [M7] | E2 |

### 2.7 Determinism and randomness

The sky's structure is decided from forks, never from player state ([RNG.md](RNG.md)). New paths, all fresh forks (so no existing draw moves):

| Path | Class | Decides |
|---|---|---|
| `fork('sky', 'tree')` | Structure | The sky tree: the trunk's knots and windows, the halls' slabs, the arrival deck's cloud edge |
| `fork('sky', 'floor', n)` | Structure | Sky floor n (1–5): its layout within the guardian's B6 rules, its graph, nests, spawns, platform tags |
| `fork('sky', 'totality', stratum)` | Structure | One stratum's platform chain (0 lower, 1 mid, 2 upper) |
| `fork('sky', 'floor', n, 'creature', seq)` | Runtime | One sky creature's choices (which attack among the allowed, which column it climbs): seeded per creature, like parts |
| `stream('ai')` | Runtime | Already reserved for enemy decisions; unused by the sky |

Generators in `src/sky/world`, `src/sky/floors` and `src/sky/totality` use integer and RNG arithmetic only, never `fx` nor three.js (the existing tests that check `src/world` and `src/content` extend to these folders). The layout is a pure function of the root seed: **the same seed grows the same sky in any order of materialisation** (tested, §3.7). The staircase draws nothing (§10.2). The meta flag is a **run option** like the seed, never read inside generation [M7]. `GEN_VERSION` goes to **24** with the first package that adds structure (W0).

## 3. A formula world with exceptions

The approach of issue #11: the shape of the world is computed from a function; only what changes is stored; geometry is described as planes and runs, never as single cubes; memory stays flat as the world grows.

### 3.1 `VoxelSpace`: what both worlds offer

`VoxelWorld` is a concrete class whose `data` and `elem` arrays are read directly in a few places. K0 writes the interface its consumers really use (`src/world/space.ts`); V0 makes `VoxelWorld` implement it and moves the consumers onto it:

```ts
export interface VoxelSpace {
  readonly sx: number; readonly sy: number; readonly sz: number;
  readonly ncx: number; readonly ncy: number; readonly ncz: number;
  readonly damaged: Map<number, number>;
  readonly dirty: Set<string>; readonly elemDirty: Set<string>;
  version: number; elemVersion: number;
  onChange: ((x: number, y: number, z: number) => void) | null;
  inside(x: number, y: number, z: number): boolean;
  idx(x: number, y: number, z: number): number;        // x + sx·(y + sy·z), the same formula in both worlds
  coords(i: number): [number, number, number];
  get(x: number, y: number, z: number): number;
  getAt(i: number): number;
  solid(x: number, y: number, z: number): boolean;
  set(x: number, y: number, z: number, m: number): void;
  elemAt(x: number, y: number, z: number): number;
  elemAtIndex(i: number): number;
  setElem(x: number, y: number, z: number, kind: number, level: number, falling?: boolean): void;
  setElemByte(x: number, y: number, z: number, v: number): void;
  markDirty(x: number, y: number, z: number): void;
  markElemDirty(x: number, y: number, z: number): void;
  hp(x: number, y: number, z: number): number;
  paddedChunk(cx: number, cy: number, cz: number, elem?: boolean): Uint8Array;
  /** True when a chunk is all air with no element (the sky is mostly air). */
  emptyChunk?(cx: number, cy: number, cz: number): boolean;
}
```

| Consumer | Today | After |
|---|---|---|
| `world/elements.ts` | `w.data[i]`, `w.elem[i]` (lines 82, 119, 143–144) | `w.getAt(i)`, `w.elemAtIndex(i)` |
| `render/debris-view.ts` cracks (113–117) | `world.data[i]`, decodes `i` with `sx`, `sy` | `world.getAt(i)`, `world.coords(i)` |
| `render/chunks.ts` | `VoxelWorld`, all chunks of a loaded row | `VoxelSpace`; skips `emptyChunk` only when no mesh exists for that key [M1] |
| `game.ts` | `world!: VoxelWorld` | `world!: VoxelSpace` and `dw!: VoxelWorld` [M10] |
| `world/floor.ts`, `world/tree.ts`, `sandbox/scenario.ts`, `sandbox/report.ts`, `sandbox/console.ts`, `sandbox/lab.ts` | `VoxelWorld` | Unchanged types; they receive `dw` |
| physics, intentions, loose cubes, flow fields | `solid` callbacks | Unchanged |

Two implementations behind one interface keep the calls polymorphic but not megamorphic; the hot paths (`solid` in collision and raycasts) already go through closures.

**The ghost mesh** [M1]. A mesh is replaced or removed only by a worker reply (chunks.ts 76–83). A chunk that becomes empty after its last block is removed must still be sent (or its mesh removed directly), so the rule is: skip an empty chunk only if no mesh exists for its key.

### 3.2 `SkyWorld`

```ts
// src/sky/world/sky-world.ts
export const SKY_SX = 256, SKY_SZ = 256;    // 16 × 16 chunks; the sky tree's axis at (128, 128)
export const SKY_SY = 1 << 16;              // a nominal height: 4096 chunk rows that cost nothing until touched

export class SkyWorld implements SkyWorldApi {   // SkyWorldApi extends VoxelSpace (K0)
  constructor(readonly layout: SkyLayout, opts?: { cacheChunks?: number });
  /** The formula alone, ignoring exceptions. */
  base(x: number, y: number, z: number): number;
  /** True only while the game places a block for the player (R2 sets it around tryPlace). */
  placing: boolean;
  kindAt(i: number): ExceptionKind | 0;
  setTransient(x: number, y: number, z: number, m: number, until: number, owner: number): boolean;
  setStory(x: number, y: number, z: number, m: number): void;   // a permanent change the game makes (a way up opens)
  restore(i: number): void;                                       // back to the formula (a placed cell is left alone)
  onBroken: ((i: number) => void) | null;                         // an original cell left its formula value: regrowth listens
  knockTower(cells: readonly number[]): number[];                 // placed cells → air, returns them for the loose cubes
  stats(): SkyWorldStats;                                         // shapes, index entries, exceptions by kind, cached chunks, bytes
}
```

- **Height.** `SKY_SY` is a constant, not a budget: nothing is allocated per row. `idx` tops near 2^32 (256 · 65 536 · 256) [m1], far inside a double's exact range, so `damaged: Map<number, number>` and every consumer that keys by index keep working.
- **The formula** is a `SkyLayout` (§3.3): an ordered list of shapes and a spatial index from chunk to the shapes that touch it. `base(x, y, z)` asks the shapes of that chunk, last one wins (so an air shape carves an opening into a slab).
- **Materialisation.** `get` reads a materialised chunk from an LRU cache (`ChunkCache`, cap 1024 chunks of 4 KB; the element layer is a second 4 KB buffer allocated only for chunks that hold an element). It memoises the last chunk read and touches the LRU order only on a miss [m4]. On a miss it rasterises the chunk's shapes into a fresh buffer (a shape fills its intersection with the chunk in one loop, never cell by cell through `base`), then applies the chunk's exceptions. Eviction drops the buffer; the exceptions are elsewhere, so nothing is lost.
- **`paddedChunk`** copies the cached chunk and reads its one-voxel border with `get` (neighbours in cache) or `edits.get(i) ?? base(…)` (neighbours not in cache, without materialising them) [M2].
- **`emptyChunk`**: no shape in the index and no exception means all air: `get` answers AIR without allocating, and the renderer skips it under the rule of §3.1.
- **Prefetch.** `SkyRealm.stream(eye)` materialises the chunks within two of the player's chunk, at most 8 a frame, so physics never waits on a miss; a miss still works synchronously.

### 3.3 Shapes: planes and runs, never single cubes

```ts
// src/sky/types.ts (K0); rasterised by src/sky/world/shapes.ts (W0)
export type Shape =
  | { k: 'box'; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; m: number; tag?: number }
  | { k: 'ring'; cx: number; cz: number; r0: number; r1: number; y0: number; y1: number; m: number; tag?: number }  // disc (r0 0), tube, slab with a hole
  | { k: 'run'; ax: number; ay: number; az: number; bx: number; by: number; bz: number; w: number; h: number; m: number; tag?: number } // a branch, a segment, a channel bed
  | { k: 'helix'; cx: number; cz: number; r: number; w: number; y0: number; y1: number; rise: number; m: number }    // a spiral stair or a thorn tree's steps
  | { k: 'ledges'; x0: number; z0: number; axis: 'x' | 'z'; y0: number; y1: number; m: number }                         // a staggered strip (the straight-up routes)
  | { k: 'blob'; cx: number; cy: number; cz: number; rx: number; ry: number; rz: number; seed: number; m: number; tag?: number } // clouds, leaves, meteor fragments: a fixed hash3 surface
  | { k: 'elem'; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; byte: number };              // a template element (the waterhole)
export interface SkyLayout {
  readonly shapes: readonly Shape[];
  readonly index: ReadonlyMap<number, Uint32Array>;   // numeric chunk key → shape ids
  tagAt(x: number, y: number, z: number): number;     // which platform a cell belongs to (fading, holding), 0 none
}
```

The layout is only shapes, the index and the tags [B3]; the floor plans and the Totality plan are held by `SkyRealm`, which builds them with the layout (`src/sky/layout.ts`, TR). `tag` names a platform (a thin branch, a run segment, a Totality stone) so hindrances act on whole platforms and allies hold them. A blob's surface is a fixed `hash3` of the cell, like the cave ceiling: no randomness is drawn while materialising.

### 3.4 Exceptions [M5]

```ts
export const enum ExceptionKind { Broken = 1, Replaced = 2, Placed = 3, Transient = 4, Story = 5 }
// edits: Map<idx, material | kind << 8>; editsByChunk: Map<chunk, Set<idx>> to apply them on materialise
// elemEdits: a separate Map<idx, byte> for the element layer (no kind)
```

The kind is decided by **who writes**, never guessed from the cell:

| Kind | Made by | Ends |
|---|---|---|
| `Placed` | `set(m)` while `placing` is true: **the player placed a block** (into air, or into a broken cell) | Only a positive intention (law 3.2: removed for good, no loose cube back, provisional), or the tower knock (§5.3). Removing it brings the formula value back through regrowth |
| `Broken` | any other `set(AIR)` over a cell whose formula is solid | Regrowth restores it (§4); `onBroken` fires |
| `Replaced` | any other `set(m)` that differs from the formula: an element reaction (elements.ts 125), the teleport's clearing (2399), a hindrance-free write the game makes | Regrowth restores it like `Broken` (law 3.1: nothing stays changed) |
| `Transient` | `setTransient`: a hindrance's cage cube, opened hole, fading platform | Its timer (`until`; a min-heap in `SkyWorld`) |
| `Story` | `setStory`: a way up opened when its deity is won | Never, in this run |

**Setting a cell back to its formula value deletes the exception** (store only what differs), except the player's own block: a block placed with `placing` stays `Placed` even when it is the formula's material (stone back into broken stone), and `restore` never removes a `Placed` cell. Transient writes refuse placed cells: hindrances never change a player block (shared terms 6.3). The element layer has no kinds: its writes go to `elemEdits`; the water-currents hindrance owns its cells as **timed sources** and removes them itself (§6), because non-source water would be recomputed to nothing by `flowAt` (elements.ts 147–158). Sky materials are not flammable (provisional), so no fire spreads through the sky tree.

### 3.5 Streaming and meshing

`SkyRealm.stream(eye)` sets the sky renderer's loaded rows: inside the tree, the current hall and the halls above and below; in Totality, from 48 below the eye to 96 above. Rows are 256 chunks wide, but `emptyChunk` drops almost all of them before a message reaches the worker. The mesher is the same (`meshChunk`, `meshElements`).

**Material ids and the atlas** [m1]. Materials go to 29 today (`kitchen`), so the sky's start at **30**. The atlas is 8 × 6 = 48 tiles and full (tiles 0–39 are materials, 40–41 grass and log tops, 44–47 the cracks), so it grows to 8 rows (64 tiles) and the special tiles move after the material range. The sky needs 13 materials (§11).

### 3.6 Memory budget

| Item | Budget | Grows with |
|---|---|---|
| Layout shapes | ~2 000 shapes × ~100 B ≈ 0.2 MB | the number of features, never the volume |
| Spatial index | ≤ 40 000 entries ≈ 0.2 MB | chunks the shapes touch |
| Exceptions | ~70 B each; 20 000 ≈ 1.4 MB | placed blocks (limited by what the hand carries) and recent breaks (they regrow) |
| Chunk cache | 1 024 × 4 KB = 4 MB (+4 KB for each chunk with an element) | fixed cap |
| Meshes (GPU) | the loaded rows only | the view, not the world |

Climbing from the deck to the Sun threshold (about 1 000 blocks) must leave the cache at its cap and the exceptions at zero once regrowth has run.

### 3.7 Tests (`tests/sky-world.test.ts`)

- `get` equals `base` for every cell of a sample of chunks with no exceptions; materialising the same chunks in two different orders gives identical bytes.
- Setting a cell to its formula value leaves no exception (unless the player places it: then it is `Placed`, and `restore` leaves it); breaking 500 original blocks and running regrowth past 6 s leaves no `Broken`; placing 100 blocks with `placing` leaves exactly 100 `Placed`; a write without `placing` into air is never `Placed`; an element-layer write leaves no block exception.
- **Memory stays flat:** walking a probe up 20 000 blocks with prefetch keeps `stats().cached ≤ cap` and the exception count unchanged; a layout with three times the Totality height has three times the shapes, not three times the bytes per block.
- Generators emit runs, not cubes: on every sky floor `shapes < solidCells / 40` (in the floor tests).
- `emptyChunk` is true for every chunk with no shape and no exception; `paddedChunk` of a chunk next to an evicted one **with exceptions** matches a fully materialised copy [M2].
- `VoxelWorld` and `SkyWorld` pass the same `VoxelSpace` contract suite (`tests/helpers/voxel-space-contract.ts`, written by K0).

## 4. The sky laws as systems (`src/sky/laws/`)

Each law is one module, pure where it can be (a host interface for effects), tested without three.js.

| Law | Module | Mechanism | Test |
|---|---|---|---|
| 3.1 **Nothing stays broken** | `regrowth.ts` `Regrowth` | `SkyWorld.onBroken` queues the cell for `REGROW = 5` s. At `REGROW − 1` s the cell **shimmers** (`host.fx('shimmer')`: pale motes and a rising chime; the crack overlay shows the block's ghost). At 5 s it returns (`restore`) only if the cell is free: no player, sky creature or loose cube in it, no placed block; otherwise it checks again every 0.25 s. **A broken original block drops no loose cube** in the sky (provisional, mediator: with regrowth every block would be an endless quarry; the player builds with what the hand carries and the nests' cubes) | breaks return at 5 s; a cell with the player in it waits; shimmer starts at 4 s; breaking gives no cube |
| 3.2 **Player blocks are the exception** | `ownership.ts` | A `blockDamage` hook (cancel band, priority 150, owner `sky`) cancels damage to placed cells of any kind (intentions, bombs, contact, hindrances). Seam 13: a **positive** intention that hits a placed cell removes it for good (gold dust, no loose cube, provisional) | a bomb does nothing to placed blocks; a positive shot removes one; a negative one does not |
| 3.3 **Negative intentions do nothing to sky creatures** | `puff.ts` (in C0) | The touch router (§5.7) sends every touch on a sky actor to `SkyCreatures.touched`: a negative intention, a blast, a thrown cube or a weapon stroke goes out in a **small puff** (cloud motes, a soft "pff") and changes nothing. The first puff of a run shows `toast.skyPuff` once | a negative hit leaves hits, side and state unchanged and emits one puff |
| 3.4 **Each floor can be passed with nothing** | the floor tests (§7.4) | Each floor's graph has a route from the ground to the deity's reach using jumps and nest cubes only | per floor |
| 3.5 **Always straight up** | the floor tests | Each floor carries its vertical route (ledge strip, knots, tusk line, thorn tree, mast) in its plan; the tower rule never triggers on it (formula cells are not placed cells) | per floor |
| 3.6 **Every hindrance warns first** | `HindranceRunner` (§6) | No effect can start without its telegraph having run for its full length | runner test |
| 3.7 **Nothing dies** | `SkyCreatures` | Sky actors have no health that can reach zero; `alive` is always true; "leaving" hides and parks them | no path sets `alive = false` |
| 3.8 **The only way up is inside the tree** | `outside.ts` `OutsideWatch` (L2) | When the player stands on a placed tower **outside the trunk's outer radius**, the guardian of the floor at that height (the panda below the first floor) comes out through the nearest trunk window and knocks it down with the tower routine, after its full warning (provisional: the guardian of that height). The trunk wall, the slabs and the gate membranes are **unbreakable heartwood** [M6], so no one mines or headbutts past a gate or out of the tree | a tower outside triggers the knock; inside it does not; heartwood takes no damage |
| 3.9 **A tower that reaches a deity is knocked down** | `tower.ts` `towerUnder(world, body): Tower \| null` | A tower is the player standing on a **placed** cell with their feet **3 or more blocks above the formula ground** under their column (the highest formula-solid cell below them) [m6]: a staircase of single placed steps counts as much as a stack. When it puts the player within 2 blocks of the deity's height, the deity framework runs the knock (§5.3). A knocked-down tower falls as **loose cubes** the player can gather again (provisional) | a stack of 2 does not count; a placed stair of 3 rises does; formula routes never count |
| Shared 6.3 **Block nests** | `nests.ts` `Nest` | A nest is a hollow from the floor plan holding 3 loose cubes of the floor's material (spawned in the sky's `DebrisSystem`). A cube farther than 1.5 blocks from the nest's centre, or gone, counts as taken; each taken cube is replaced after 6 s with a soft pop | refills at 6 s; never more than 3 |
| **No health loss in the sky** (owner, 2026-11-03) | `no-harm.ts` | An `actorDamage` hook (cancel band, the highest priority, owner `sky`) cancels **every** damage to the player's health while the sky's hooks are installed, whatever its cause and whether it was raised at once or through `bus.defer` and the flush [m5]: item self-harm, bombs, landing, water. Deities, minions and hindrances never call damage: they push, slow or hold, capture (`takeRandomPractice`) or drain spirit (`drainSpirit`), and spirit at zero sends the player underground (`sendUnderground`). The player cannot die in the sky | an item that hurts on landing does nothing; a bomb under the player does nothing; a deferred hit does nothing |
| **Fall recovery (Totality)** | `updraft.ts` `Updraft` (L2) | The last checkpoint platform the player stood on is remembered. Falling more than `CATCH = 20` blocks below it, an updraft of pale motes catches the player and carries them back to it in 1.6 s (input held, `Player.float` on): the cost of the fall is the height lost above the checkpoint | a fall below the line ends on the checkpoint |
| **Item events in the sky** [m7] | — | A sky floor is neither a room nor a floor for item events (provisional): `roomEnter`, `roomClear` and `floorEnter` are not emitted there, and potions measured in rooms wait until the player is back below | no room or floor event fires in the sky |

## 5. Sky creatures

### 5.1 What is reused and what is new

The projection system (`entities/enemies.ts`) is built around rooms: every enemy belongs to a room, steers with a per-room 2D flow field, is leashed to its home cell and is resolved by the polarity rules (warmth, relapse, conversion, health). Sky creatures share none of that: they climb, hang, levitate and leap in 3D on a floor of open space, have no health, and turn only by counting positive hits. So:

| Reused | New |
|---|---|
| `Actor`, `ActorRegistry` (one id space; `ActorKind` gains `'sky'`) | `SkyActor`, `SkyCreatures` (`src/sky/creatures/system.ts`) |
| Cube models: `ModelPart[]` and `buildModel` from `entities/enemies.ts` (the plush body and the giant head are parts) | The deity state machine, the minion rules, gaits |
| `moveBody` (`physics/voxel-collide.ts`) for walking minions | Climbing, hanging, levitation, leaps (`src/sky/creatures/gaits.ts`) |
| Particles, `sfx`, the boss bar, `presenceCard` | `HitMarks` (gold marks on the body, `src/sky/render/hit-marks.ts`) |
| `Hazards` (`enemies/attacks.ts`: rings that grow, sweeps, telegraph → live) with a **tint** parameter [m13] for the sky's rings, arcs and gust capsules; cold tints stay for projections | The floor graph for navigation (§5.6) |
| The telegraph channels of `DECISIONS.md` §8.5 (named parts `tell`, `core`) | |

Nothing in `combat/polarity.ts` changes: the sky never calls `resolveHit`.

### 5.2 Actors, the system and the host

```ts
// src/sky/types.ts (K0)
export type Animal = 'panda' | 'koala' | 'elephant' | 'lion' | 'horse';
export interface SkyActor extends Actor {
  readonly kind: 'sky';
  readonly role: 'deity' | 'minion';
  readonly animal: Animal;
  side: 'wild' | 'ally';          // faction: 'neutral' while wild, 'self' once turned
  state: string; t: number;       // the machine's state and its clock
  hits: number;                   // positive hits landed
  parked: boolean;                // left the floor (never dead)
}

// src/sky/creatures/system.ts (C0)
export class SkyCreatures implements TouchProvider {
  constructor(root: THREE.Group, host: SkyHost);
  spawnDeity(def: DeityDef, plan: SkyFloorPlan): SkyActor;
  spawnMinion(def: MinionDef, at: Place): SkyActor;
  at(x: number, y: number, z: number, r: number): number;                          // §5.7
  targets(): readonly TouchTarget[];                                                 // §5.7
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void; // §5.7: puff unless positive
  update(dt: number, floor: number): void;                                           // only the creatures of the player's floor move
  dispose(): void;
}
```

Hostile minions never attack through the projection contact pipeline: their pushes, hugs and kicks are hindrance effects (§6). A wild sky actor is `neutral`, so friendly-fire rules and `hostile()` never apply to it; turning it sets `self` directly (not through `setFaction`, which refuses neutral actors) and emits `factionChange` with source `sky` and `targetKind: 'sky'`. The synergy matrix gets that sample payload, and no item may grant a reward on a `sky` conversion until the balance milestone reviews it [m11].

`SkyHost` is the only door from `src/sky/` into the game, written once in `game.ts` by R1 (`makeSkyHost`, seam 9). There is **no health verb**; the sky's costs go through the verbs below (owner, 2026-11-03):

```ts
export interface SkyHost {
  time(): number;
  player(): { body: Body; eye: Vec3; aim: Vec3; hand: readonly Carried[]; push(vx: number, vy: number, vz: number): void;
              slow(f: number, s: number): void; hold(s: number): void; carry(to: Vec3, s: number): void };
  world(): SkyWorldApi;
  debris(): DebrisSystem;
  hazards(): Hazards;
  fork(...path: (string | number)[]): Rng;
  fx(kind: SkyFx, x: number, y: number, z: number, n?: number): void;    // puff, shimmer, hit mark, telegraph motes
  cue(kind: SkyCue, x: number, y: number, z: number): void;              // §13
  toast(key: MessageKey, params?: Params): void;
  card(name: MessageKey, lines: readonly MessageKey[]): void;
  bar(b: { name: MessageKey; ratio: number } | null): void;              // the boss bar shows a deity's hits in gold
  place(key: MessageKey): void;                                           // the HUD's place label
  gift(itemId: string, x: number, y: number, z: number): void;            // a pickup in the sky's Pickups
  travel(t: Travel): void;
  drainSpirit(amount: number): void;                                      // special attacks drain spirit, never health
  spirit(): number;                                                       // 0 to SPIRIT_MAX
  takeRandomPractice(): ItemId | null;                                    // a capture takes one practice for the run
  sendUnderground(floors: readonly number[], rng: Rng): void;             // spirit at zero: one floor, spirit refilled
}
```

### 5.3 The deity framework (`src/sky/creatures/deity.ts`)

```ts
export interface DeityDef {
  animal: Animal; floor: 1 | 2 | 3 | 4 | 5;
  hits: number;                                   // the target: 24, 30, 36, 42, 48
  telegraph: number;                              // TELEGRAPH[floor − 1]
  recover: number;                                // 2.5, 2, Drinking 2.5, 2, 2
  rest: readonly [number, number, number];        // by stage
  sight: number;                                  // Watching starts within this distance (or the doc's other trigger)
  hover: number | null;                           // levitation over the seat; null for the horse (it walks)
  teleport: boolean;                              // provisional (owner): true for the koala and the horse
  guard?(d: SkyActor, ctx: DeityCtx): boolean;    // koala Clinging, elephant's rim (counts only hits in line)
  attacks: readonly AttackDef[];                  // each with its first stage and its hindrance
  states?: readonly CustomState[];                // Napping, Asleep/Stirring, Listening, Basking/Pacing, Grazing/Sending/Leaping away
  rules?: readonly DeityRule[];                   // the rest beat, Memory, facing the roar, gentling
  ally: AllyAtDeity;                              // what an ally does at the deity: sit, hug, trumpet from below, rub, graze; its timer and cap
  knock: 'nudge' | 'hug' | 'sweep' | 'paw' | 'kick';
  won: WonOutcome;
  model: DeityModel;                              // §11
}
export const TELEGRAPH = [1.4, 1.2, 1.1, 1.0, 0.9] as const;
export const MIN_TELEGRAPH = 0.8;
```

- **The machine.** `Idle → Watching → Attacking → Recovering → Watching` (or `Idle` out of sight), with `Hurt` (0.3 s, never cancels a shown telegraph) and `Rallying` (2 s, once at each stage change). Custom states replace or extend the core ones by name (the koala's `Asleep` replaces `Idle` once; the elephant's `Drinking` is its `Recovering`). A state is a record `{ enter, tick, exit, next }`; the table is data, so a deity file reads like its B2 section.
- **Attacks never take health** (owner, 2026-11-03). Special attacks drain spirit (`drainSpirit`); the rest move, slow or hold. An `AttackDef` is `{ id, stage, telegraph: TelegraphSpec, act(ctx) }`: the telegraph is shown for the floor's length (never below `MIN_TELEGRAPH`), then `act` runs a hindrance (§6). What the design calls a lob, a bolt or a ring lands as a knockback, a slow or a hold. No attack repeats back to back when another is available.
- **Positive hits.** A positive intention or weapon stroke that touches the body or head while `guard` is false adds one hit (the horse's Gentled counts two); a beam counts once per stroke [B2]. Each hit leaves a **gold mark** where it landed (`HitMarks`: an instanced mesh of tiny light quads in the deity's local frame, at most `hits` of them), plays `Hurt` and the animal's own sign of progress (lids opening, grip loosening, ears hanging, mane softening, eyes softening: a per-animal `progress(d, ratio)`). The boss bar shows `hits / target` in gold.
- **Stages** at a third and two thirds of the target: `stage = min(2, ⌊3·hits / target⌋)`; the change runs `Rallying` and unlocks the stage's attacks.
- **Levitation.** A levitating deity floats `hover` blocks over its seat with a slow bob (±0.15, 0.5 Hz) and its drift; its box ignores gravity. The horse uses a ground gait and its great leap (a ballistic arc of up to 20 across and 8 up, landing on a paddock or open ground, never on the player).
- **Teleport far** (koala and horse, provisional). A warning of one telegraph, then the deity reappears at the place of its plan farthest from the player, never within 12 blocks.
- **The tower knock** (`knock.ts`, C1). On `towerUnder` reaching its height (or the outside watch), the deity shows a 2 s warning (the stack shakes, a warm outline runs down it, a rising grumble), leaves its seat, knocks the placed cells from the top down (`SkyWorld.knockTower` → loose cubes), pushes the player 2 blocks off them, then returns and is `Recovering`. While it is away it can be hit as usual.
- **Won.** At the target the deity is **won** to the player's side: it plays its outcome (provisional, from each document's section 6: the panda settles on its seat awake and friendly; the koala lets go of its branch; the elephant sets its weight down and the channels drain; the lion's pride lies down; the horse stops leaping and the wind stops), becomes an **ally** (`side: 'ally'`, owner clarification on issue #24), its minions follow their deity (wild ones change attitude, allies stay), and **only then** the floor's way up opens (owner decision 7; `onWon` → `tree.openGate(n)`, §7.2). The horse also gives its gift (§9).

### 5.4 The minion framework (`src/sky/creatures/minion.ts`)

```ts
export interface MinionDef {
  animal: Animal; max: number; wildMax: number;              // 4/3, 6/6, 5/3, 6/4, 5/3
  spawn: SpawnRule;                                          // clumps, sleeping clusters, waterhole, shade rocks, gate; its warning and timer
  hitsToTurn: number;                                        // 3, 3, 5, 4, 4
  gait: Gait;                                                // composed from gaits.ts
  rules: readonly MinionRule[];                              // the B5 behaviour rules, in order
  ally: readonly AllyHelp[];                                 // hold, clear, carry, help
  model: MinionModel;
}
export type MinionRule = (m: SkyActor, ctx: MinionCtx) => boolean;   // true: it acted this tick
```

- **Gaits** (`gaits.ts`): `walk(speed)`, `climbFace(perBlock)`, `hangUnder`, `roll(speed)`, `file(leader)`, `stalk(seen, unseen, cone)`, `gallopLoop(speed, turnAt)`, `bound(maxStep)`, `pounce(arc)`. Each animal composes its own (the panda walks 1.5, climbs a block every 1.2 s, rolls 4 on slopes).
- **Rules** are small functions that read the floor graph and the player and either act or pass; the first that acts wins the tick. A rule that hinders the player starts a hindrance with its own telegraph (a tucked panda, a swinging koala, a crouching lion, gathered hind legs). Nothing a minion does hurts.
- **Turning.** Each positive hit plays the animal's soft reaction (sit and munch, blink, flap ears slowly, lower the head, slow and turn an ear). At `hitsToTurn` the minion becomes an ally with a small happy motion. A negative touch is a puff (law 3.3); an ally never turns back (minions open question 4, provisional).
- **Ally helps** are the four shared forms: **hold** (`ctx.protect(cells, owner)` marks platform cells that no hindrance may change while the ally stays), **clear** (act on a wild minion: roll it down, curl it asleep, take its push, roar it down, turn it away), **carry** (the elephant's lift of one terrace, the horse's ride of 8 blocks; both through `host.player().carry`, never doing the player's jump for them) and **help** (go to the deity and add hits on a timer with the floor's cap; on the horse's floor it brings calm instead).
- **Stuck guard.** A minion that has not reached its graph target in 6 s walks back to the nearest graph node; if that fails it fades out and back in at its spawn, with its warning (nothing dies, nothing is left stuck).

### 5.5 One module per animal

| Animal | Deity file | Minion file | What is its own |
|---|---|---|---|
| Panda | `src/sky/creatures/deities/panda.ts` | `minions/panda.ts` | Napping at two thirds; the rest beat (stillness delays the next attack); bamboo stumps that are steps |
| Koala | `deities/koala.ts` | `minions/koala.ts` | Asleep/Stirring; the Clinging guard (an ally's hug lifts it); teleport to a far thick branch |
| Elephant | `deities/elephant.ts` | `minions/elephant.ts` | The rim guard (hits count only in line over the rim, or on the head while the trunk is raised); Memory (aims where the player stood longest in 10 s); the herd in file |
| Lion | `deities/lion.ts` | `minions/lion.ts` | Pacing in the air; facing the roar halves its ring; holders and stalkers; the stalk that stops when watched |
| Horse | `deities/horse.ts` | `minions/horse.ts` | Walks and leaps (no levitation); Sending; Gentled (a still player, hits count two); startle; teleport when startled; the gift |

Each file holds data and small functions only; no file reaches the game except through its context. The deity and minion registries (`deities/index.ts`, `minions/index.ts`) are written by K0 and never edited again.

### 5.6 The floor graph

Sky creatures do not path-find through voxels. Each floor plan carries a **graph of places** its generator already knows (types in `src/sky/types.ts`, helpers in `src/sky/floors/graph.ts`):

```ts
export interface Place { id: number; kind: PlaceKind; x: number; y: number; z: number; w: number; d: number; tag: number }
export type PlaceKind = 'ground' | 'top' | 'ledge' | 'branch' | 'thick' | 'segment' | 'terrace' | 'bed' | 'bank' | 'paddock' | 'seat' | 'nest' | 'spawn' | 'route' | 'gate';
export interface Link { a: number; b: number; move: 'walk' | 'step' | 'jump' | 'drop' | 'climb' | 'build' }
export interface FloorGraph { places: Place[]; links: Link[] }
```

Minions choose places (the column top nearest the player and above them, the branch over the player's path, the channel's foot) and move along links with their gait. The same graph drives the floor tests (§7.4). Blocks the player places do not enter the graph; gaits still collide with them.

### 5.7 The touch router [B2, M3]

One pure module, `src/combat/touch-router.ts` (R2), is the only way an intention, a weapon stroke, a blast or a thrown cube finds an actor that is not a projection:

```ts
export interface TouchTarget { id: number; x: number; y: number; z: number; hw: number; h: number }
export interface TouchProvider {
  owns(id: number): boolean;
  at(x: number, y: number, z: number, r: number): number;                  // -1 none
  targets(): readonly TouchTarget[];
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void;
}
export class TouchRouter { add(p: TouchProvider): void; remove(p: TouchProvider): void; /* at, targets, touch, owns over all */ }
```

- The intention callback `enemyAt` (337) asks the router first, then `enemies.at`.
- The weapon host's `targets()` (768) concatenates the router's targets with the projections; its `hit()` sends a routed id to the router, never to `intentTouch`. A beam's repeat ticks arrive with `warm = false`; providers count a positive hit only on a warm touch, so a beam counts once per stroke.
- `damageActor` (855) and `intentTouch` (1085) send a routed id to its provider on their first line (blasts and cubes become touches with polarity `negative`).
- Providers: `SkyCreatures` (registered while the sky is active) and the Spiked Entity (registered while its floor exists, E2).
- `tests/touch-router.test.ts` drives the router with fake providers for every weapon id (`blade`, `beam`, the great cut) and the plain shot: each lands a positive touch on a sky target; a beam stroke counts one.

## 6. The eight hindrances (`src/sky/hindrances/`)

Every hindrance is a module with the same three parts: a **telegraph**, an **effect** and a **positive answer**. No effect ever damages the player (owner decision 8): they push, slow or hold, and their worst outcome is a fall to a lower platform.

```ts
export interface Hindrance<P> {
  id: HindranceId;
  telegraph(ctx: HindranceCtx, p: P, seconds: number): Telegraph;       // what the player sees and hears, for the full length
  effect(ctx: HindranceCtx, p: P): Effect;                              // what it does, and for how long
  answer?(ctx: HindranceCtx, e: Effect | Telegraph, hit: PositiveHit): boolean; // a positive intention at the right place
}
export class HindranceRunner {
  start<P>(h: Hindrance<P>, p: P, telegraph: number, source: number): number;  // telegraph first, always (law 3.6)
  update(dt: number): void;
  positiveHit(hit: PositiveHit): boolean;    // offered every positive intention that ends in the sky (seam 13 and the creature touch)
}
```

Effects touch the world and the player only through `SkyEffects` (`effects.ts`), which enforces the shared rules: **never a placed block**, never a cell a holding ally protects, never a drop without its warning, never damage, and everything ends. Rings, arcs and gust capsules are drawn with `Hazards` and a sky tint [m13].

| Hindrance | Module | Effect, built from | Positive answer (provisional, from the abilities table) | Used by | Package |
|---|---|---|---|---|---|
| Knockback | `knockback.ts` | An impulse on the player's body along the shown arc; a solid block between the source and the player stops it (a raycast) | A positive shot on the source's tell softens it to a push of × 0.4 | panda (yawn, roll), elephant, lion (pounce), horse | H0 |
| Wind | `wind.ts` | A gust volume (a capsule along a line) that pushes the player while in it; a block in the line shelters (a raycast from the source) | A positive shot on the source (the tail) ends the gust | koala, lion, horse | H0 |
| Opening holes | `opening-holes.ts` | Chosen original cells crack (the crack overlay through `damaged`), then become transient air for 4 s (no loose cube), then return | A positive shot at a cracked cell closes it before it opens | panda | H1 |
| Fading platforms | `fading-platforms.ts` | A whole platform (`tag`) or chosen parts turn to mist (a transient swap: edges grey, flicker, a speeding tick), then transient air, then return with a chime; held cells never fade | A positive shot holds it for 2 s | koala (thin branches), horse (run segments; the floor's rhythm from stage two) | H1 |
| Dense ground | `dense-ground.ts` | A set of cells marked dense (a decal of glassy quads, no block change); walking on them sets `slow(0.5)` | A positive shot at a dense cell returns it at once | panda | H2 |
| Cube cage | `cube-cage.ts` | Outlines one by one, then transient cubes round the player's cell; never closed over a drop; dissolve after a few seconds; any shot breaks a cube (no loose cube) | A positive shot breaks a cube at once | koala | H2 |
| Water currents | `water-currents.ts` | Timed **source** water cells it owns, down a channel bed from its head to the first solid cell (written to `elemEdits`, removed by the hindrance itself [M5]); feet in it get a push along the bed; a placed block (a dam) stops the stretch below. No drowning damage (no harm) | A positive shot at the channel head stops it for 3 s | elephant | H3 |
| Paralysis | `paralysis.ts` | A ring that grows at a set speed; a grounded player it passes is **held** 1–1.5 s (`hold`: no walking; aiming and shooting allowed) | Holding the aim on the source during the telegraph halves the ring; a positive shot on it shortens the hold | lion | H3 |

The player's body gets three small additions (`entities/player.ts`, PL): an external push (`push(vx, vy, vz)`, added after the walk blend), `heldT` (move input ignored, look and shoot kept) and the carry (input held while `carry` lerps the body). `slowT` already exists. `spawnAt` (any travel or a new run) drops every motion in progress: the carry, the push, the hold, the jump buffer, the coyote time and the air jumps spent; `float` stays (heaven sets it before the travel), and a new run also clears `slowT`, `muteT` and `float` (`clearStates`). A test per hindrance checks: no effect before its full telegraph, a placed block is never changed, the effect ends, it deals no damage, and the positive answer works.

## 7. The sky tree and the five floors

### 7.1 The stack

The sky tree is a trunk that **widens as it rises**, a crown carrying its floors, on its own axis at (128, 128). Every floor is a hall inside the trunk (wall 3 thick of **unbreakable heartwood** [M6], knot windows at eye height), separated by a heartwood slab three blocks thick with one **way up** closed by a heartwood membrane. Heights (realm y; hall radius = the floor's B6 radius + 3; hall height = the B6 height + 4 of headroom):

| Floor | Guardian | B6 radius, height | Hall ground | Hall top | Way up (the floor's vertical route ends under it) |
|---|---|---|---|---|---|
| Deck | — | radius 48 of cloud | 32 | — | the trunk's foot door, into the foot well (radius 4, a heartwood spiral) that opens on hall 1's ground beside the Bamboo Seat, its axis at x +3, z +8 from the trunk's (provisional, to confirm) |
| 1 | Panda | 20, 28 | 36 | 67 | over the Bamboo Seat's ledge strip |
| 2 | Koala | 22, 32 | 71 | 106 | over a trunk's knots |
| 3 | Elephant | 24, 34 | 110 | 147 | over the tusk line |
| 4 | Lion | 26, 36 | 151 | 190 | over the thorn tree |
| 5 | Horse | 30, 12 (paddocks), mast to the gate | 194 | 217 | at the top of the mast |
| Totality | — | open space | 221 (the crown) | ~980 (the Sun threshold) | — |

The foot well stands off the trunk's axis so that the Bamboo Seat, at the centre of hall 1, keeps whole ground under it: the well's mouth lies in the quarter of the panda floor that holds no column, two cells clear of the seat and three of the building path, with a clear column of at least 3 over it (provisional, to confirm; `FOOT_WELL` in `tree.ts`, checked by `tests/sky-tree.test.ts`). The mouth has a rim: one block of pale stone (`palestone`) on hall 1's ground, the ring one cell out from the mouth's edge (provisional, the height to confirm; owner, 2026-11-05, with minions avoiding the mouth, PANDA B5). The foot door runs from the deck through the foot wall on +x to the well.

`src/sky/floors/tree.ts` (TR) builds the trunk, the deck, the slabs and the membranes as shapes, and calls each floor's generator (through the registry `src/sky/floors/index.ts`) with its origin. Its plan names the trunk's outer radius per height (the outside watch reads it). `src/sky/layout.ts` assembles the tree, the five floor plans and the Totality plan into the layout and the plans `SkyRealm` holds.

### 7.2 Floor generators

```ts
// src/sky/types.ts (K0)
export interface SkyFloorGen {
  animal: Animal; index: 1 | 2 | 3 | 4 | 5; radius: number; height: number;
  generate(rng: Rng, o: { x: number; y: number; z: number }): SkyFloorPlan;
}
export interface SkyFloorPlan {
  index: number; animal: Animal; y0: number; y1: number;
  shapes: Shape[]; graph: FloorGraph;
  seat: Place;                 // where the deity rests (the horse: its paddocks)
  spawns: Place[]; nests: Place[];
  route: Place[];              // the vertical route, bottom to top (laws 3.5, 3.9)
  gate: { x: number; z: number; r: number };   // the way-up opening in the slab above
  platforms: PlatformTag[];    // what may fade, and what is fixed
  extra?: { channels?: Channel[]; rim?: Box; mast?: Place[] };
}
```

| Floor | File | Generator follows (B6 of its document) |
|---|---|---|
| Panda | `src/sky/floors/panda.ts` | The Bamboo Seat (3 × 3, top at 24) in the centre; 12–16 columns of 2 × 2, tops 3–20; the gentle path (steps of 1, gaps 1–2); the building path (steps of 2) with nests at its foot; soft stairs on half the columns; the ledge strip on one face of the seat; nests at 0, 8, 16; the two bamboo clumps; the quarter at x 0 to +8, z +4 to +12 left empty for the foot well's mouth (provisional, to confirm) |
| Koala | `koala.ts` | Four 2 × 2 trunks at 14 from the centre; the branch spiral (1 wide, 4–6 long, +2 each); gaps of 2 level or 3 with a drop of 1, never more without a thick branch; every third branch thick and fixed; the central gap (radius 8) over moss; knots on every trunk; the Fork at 30 on four limbs; nests on the lower thick branches; three sleeping clusters |
| Elephant | `elephant.ts` | (Provisional layout, B6.) A 2-high base; five rings rising to the centre: the ground ring (19–24, at 2) with the waterhole (radius 2, 2 deep, a template element) opposite the tusk line, terraces at 8, 14, 20 (4 wide, walls 6 high), the Basin's mesa (radius 6) at 26 with its pool (radius 3), its 2-high rim and four culvert spouts; four switch-back channels (stairs of 6 one-block steps along the wall feet, troughs of bed 1 wide between banks 2 high, a cut every 6); the dry tusk line (five ledge strips to 33, under the way up); a nest on each ring; floor blocks in rows 110–143 |
| Lion | `lion.ts` | An open plain; 12–16 flat rocks (3 × 3 to 6 × 6) from 4 to 30, neighbours 1–3 apart; gaps of 2, 3 with a drop, or 4–5 on the nerve line; the long route; the Sunning Ledge (6 × 6 at 34); the thorn tree's spiral steps; six nests before the 4–5 gaps; two shade rocks |
| Horse | `horse.ts` | A meadow of radius 30; six fenced paddocks (5 × 5, heights 0–12, 12–20 apart); runs of segments (3 × 2, +1 every two, gaps 1–2); every fourth segment fixed with a hitching post; the central mast with rungs to the gate, its fixed spoke to the nearest paddock; four nests on fixed segments; the paddock gate |

**The way up opens only when the floor's deity is won** (owner decision 7): the membrane is heartwood until `tree.openGate(n)` writes it to air with `setStory`, with a slow opening and a chime (`toast.gateOpens`). `SkyRealm` sets the creatures' `onWon` to `openGate` for the floor of the won deity (`src/sky/sky-realm.ts`; `tests/sky-realm-gate-open.test.ts`). A new run disposes the sky, so every run starts with its membranes closed. The horse's gift must therefore come before Totality, as the design requires. Falling down through an open way up lands on the floor below.

### 7.3 What every generator guarantees

- Everything is shapes; no generator writes a single cube in a loop.
- No platform cell is inside another floor's band (`y0..y1` of its hall); the slab between halls stays whole except the way up.
- The vertical route and the gentle route are formula cells, so the tower rule and fading never touch them, and they never pass through a cell a hindrance may open (a hole never opens on the route; a route segment never fades).
- Nests sit on fixed places, never on a platform that fades.
- No platform the route uses lies under a formula block closer than 3 above its walking surface (`headBump` stops a jump under any block, line 2179).

### 7.4 Floor tests (`tests/sky-floor-<animal>.test.ts`)

For 50 seeds and every floor: the layout respects its B6 numbers (sizes, heights, gap widths read from the graph); **with nothing** (jump 1.26, running gap 2.7, coyote 0.1, constants from `physics/jump.ts`) there is a route from the ground to within shot reach of the seat using only `walk | step | jump | drop | climb` links, plus `build` links that need at most the cubes of the nests on the way; the vertical route is contiguous to the gate; no cell of the route is fadable or openable; the hall stays inside its band; the plan is the same in any order of generation; minion spawns and nests are on fixed places; `shapes < solidCells / 40`.

## 8. Totality (`src/sky/totality/`)

- **Strata.** `strata.ts` sets three bands above the crown: **lower** (221–420, the thinned exosphere: petrified leaf clusters, starlight resin, boundary stones), **mid** (420–700, the void: crystalline meteor fragments and solid star-matter, the Earth below as a sphere), **upper** (700–980, the solar approach: incandescent glass and embers, the corona filling the upper sky). Platforms are 3 × 3 and 2 × 2 low, 2 × 2 in the void, 2 × 2 narrowing to 1 × 1 near the summit.
- **The jump's numbers** (`physics/jump.ts`, J0). The constants move out of `entities/player.ts` into a pure module (walk 4.6, gravity 28, jump velocity 8.4, air control 0.35, coyote 0.1, the ladder `[1, 2, 8]`) so the generator and the player use the same numbers. With base stats one jump rises 1.26, two rise 3.78, the full sequence rises about 13.9 [M13].
- **The reach envelope** (`reach.ts`, TT, on J0's functions). `reach(dy)` is how far the 1× → 2× → 8× sequence carries for a rise `dy` with the third jump's full air control; `reach2(dy)` is the first two only, **defined for dy < 3.78 and undefined (no reach) above**. The rule is stated by rise, not by a share of a vacuous test:
  - **Climb hops** rise `dy` 4–10: they need the third jump by height alone. At least 60% of all hops are climb hops.
  - **Rest hops** rise `dy` 0–3 and stand within 0.8 · `reach2(dy)`: a breath between climbs.
  - Every hop's horizontal gap is at most **0.8 · `reach(dy)`** at base stats.
  - Every takeoff platform and every arc between two platforms has a **clear column of 15 blocks** of formula air above it (no `headBump` under a fragment overhead).
- **The chain.** `chain.ts` walks a spiral up from the crown; every sixth platform is a **checkpoint** (3 × 3, with a soft beacon) where the updraft returns the player (§4). The spiral stays within radius 100 of the axis. About 60 hops in all (about ten minutes of climbing). It passes over the dungeon footprint in numbers only: the worlds never share a cell (§2.5a).
- **The Sun's entrance** (`threshold.ts`, owner, 2026-11-05). The Sun is a sphere of 30 blocks (`SUN_RADIUS`) beyond the last checkpoint, its near surface 4 blocks past the checkpoint's far edge (`SUN_GAP`), at the checkpoint's height. The last jump, begun on the last checkpoint, that carries the body into the sphere calls the host's `enterUnity` once; the realm records it. Unity is issue #95, pending: it does nothing yet. No gate, no refusal, no toast.
- **Building.** The player may place what the hand carries; there are no nests in Totality, so the gaps are the triple jump's (Totality open question 2, provisional). A tower (§4, law 3.9) is knocked down by a gust of solar wind after the full warning (the tower routine with the Sun as its source).
- **Tests** (`tests/totality.test.ts`): every hop within its envelope by kind; the share of climb hops; the headroom columns; checkpoints every six; the plan inside the world's bounds; the same plan in any order; the Sun's entrance (only the last checkpoint's jump enters; entering calls `enterUnity` once; no refusal).

## 9. The Triple Jump

**Physics** (`entities/player.ts` on `physics/jump.ts`, PL). A new stat **`airJumps`** (base 0, limits [0, 4], `stat.airJumps` in every catalog) counts the jumps the player may make in the air. The heights follow the ladder `[1, 2, 8]`: the k-th jump's velocity is `JUMP_V · √(stats.jump · LADDER[k])`. In the air a press of `jump` spends one air jump when the coyote time has run out, the player is not swimming, and there is no ground within 0.6 blocks below (so a press just before landing stays a ground jump, kept by the buffer). Landing refills them. The third jump raises air control from 0.35 to 1 and adds **no forward speed** (MOVEMENT-ABILITIES open question 2, provisional: no boost, full steering). With practices that raise `jump`, the third jump's apex is capped at 16 blocks.

**Events.** `jump` gains `air?: number` (absent or 0 on the ground, then 1 and 2), so items can react to air jumps; the synergy matrix gets the sample payload. R2 emits it (seam 15).

**The item** (`src/content/items/triple-jump.ts`, sotano-items, TJ): a sky gift, not a practice of the basement. `PoolName` gains **`'sky'`**, a pool nothing draws from at random; the validator accepts it as the item's only pool. `ItemPools` drops every sky-only item when it is built, so its fallback to `this.all` (pool.ts 78–79) can never hand it out [M11]; the golden pedestal reservations stay byte-identical. Stats: `airJumps +2`. Name: "Triple Jump" until the owner names it (MOVEMENT-ABILITIES open question 1). Its English lives in its definition, its Spanish in `es.ts`'s `content.items` [m8]. It is given by the won horse: `host.gift('triple-jump', …)` puts it as a floating pickup on the horse's paddock, and touching it gives the usual banner.

**Controls** (sotano-controls). No new action: the air jump is a new meaning of `jump` in the air, which is how the three references do it (a second press of the jump button). Keyboard Space, gamepad A, touch the jump button: already bound. The work is the words: `controls.jump` mentions the air jumps once the item is held, the pause card's row, and the input documents ([input/README.md](input/README.md), KEYBOARD, GAMEPAD, TOUCH). `tests/controls.test.ts` stays green with no change to `BINDINGS`.

## 10. The endgame at the bottom

### 10.1 The Spiked Entity (`src/endgame/`)

- **Where** (owner decision 6). In the chamber of silence under floor 9 (`FloorResult.silence`, air y 1–4, floor.ts 481–488), the lowest place in the world: it broods at the chamber's far end from the shaft. The chamber is 4 high, so the entity stands **at most 3.5** with its spikes, low and wide [m12]; the camera never clips its spikes against the roof.
- **What it is in code** [M3]. A **standalone actor**, not a projection and not in `CREATURES`: `src/endgame/entity.ts` (state, body box, `TouchProvider`), `src/endgame/entity-view.ts` (its model), `src/endgame/encounter.ts` (the revelation). Every intention, stroke, blast and cube reaches it through the touch router (§5.7) and **bounces** (a dull "tink", cold motes, a brief shimmer on the spikes): nothing changes, whatever the polarity, and the creature branch of `intentTouch` (grow, heal, heart) is never reached. It is placed when floor 9 is carved, at a fixed place in the chamber, drawing nothing.
- **The revelation.** `Encounter.update` (called from `updateLoop`, seam 18): within 5 blocks, once per run, the entity turns toward the player and `presenceCard('endgame.entity.name', ['endgame.entity.line1', 'endgame.entity.line2'])` shows the owner's line ("The true path was not to reach this place; the true path is to go upward. All this time you were mistaken: you were meant to climb upward."). When the card is dismissed (or after 6 s) the ground rumbles, `toast.stairOpens` shows, the staircase is carved (§10.2) and the meta flag is saved (§10.3).
- **Silence still carries you to heaven** (owner decision 6), but not before the stairs [M4]. Banners do not stop the simulation and `SILENCE_STILL = 3` is shorter than the read, so while the encounter is active (from the turn to the staircase's first flight) it holds the stillness clock at 0 (`Encounter.holdsStill`). After that, standing still for 3 s carries the player up as today.
- **Encounter host.** `Encounter` reaches the game through `EncounterHost` (`card`, `rumble`, `toast`, `openStairs`, `saveMeta`, `holdStill`), so `tests/endgame.test.ts` runs it with a fake.
- **No rematch** (owner decision 3): no state, item or hook for one is built.

### 10.2 The staircase (`src/world/staircase.ts`, pure, ST0)

A **stairwell in the world's margin**, the solid rock that surrounds every floor (`MARGIN = 6`), at the north-west corner: a **two-wide** spiral [m9] round a core of living wood, rising one block per step. There is no autostep in the player, so every step is a jump; two wide keeps the climb readable and corners free of traps (autostep is later, §18). The well's geometry is the package's to fit inside the margin; a floor's landing is wherever the spiral stands at that floor's level, with headroom of 3 over every step.

```ts
export interface StairLanding { floor: number; room: number; side: 'n' | 's' | 'e' | 'w'; tunnel: [number, number, number][] }
export function stairRoute(f: FloorResult): StairLanding;                    // no randomness: the plan decides
export function carveStair(w: VoxelWorld, floors: readonly FloorResult[], from: number | 'silence', to: 'surface'): StairCarve;
export interface StairCarve { cells: number; next(budget: number): boolean } // a few hundred cells a frame, under the rumble
```

- **Landings** [M8]. On each floor a tunnel (2 wide, 3 high, at the floor's level) runs from the well along the margin, then straight in through cells the plan leaves empty and no room has claimed (`FloorResult.space`), to the nearest wall of a room **that never seals** (never a room with projections, a boss room or any room `doors.seal` can close: lines 1222, 1282), on a side that has no door. It opens there as a door-shaped gap; the room validator keeps three walkable tiles in front of every door position on every side (sotano-levels §4). If no such room is near, the tunnel ends in an alcove off the margin. The tunnel stays inside the floor's band; outside the well's footprint the three layers of rock between bands stay whole.
- **Bottom and top.** From the silence chamber a tunnel at y 1–3 runs under floor 9 (its slab and two layers of rock above it untouched) to the well's foot. At the top the well opens onto the grass at the corner of the surface.
- **When.** At the revelation the whole staircase is carved, from the chamber to the surface. In every later run with the unlock, `carve()` (seam 17) carves the **roots' flight** right after floor 0 itself: from floor 0's landing (by the start room) to the surface (owner decision 5; `STAIR_START_FLOOR = 0`).
- **Determinism.** The staircase draws nothing and is carved after everything else on its floor, so no other draw moves. It depends on the run option `stair`, an input of the run like the seed; RNG.md gets a note that a seed shared between a player with the unlock and one without differs only by the staircase.
- **Tests** (`tests/staircase.test.ts`, 300 seeds): every floor finds a landing; a walk check climbs from the chamber to the grass through every landing (steps of one, two wide, headroom of three, corners included); no door approach, centre, `P`, `H` or shaft cell is touched; **no room that can seal gains an opening**; the rock between bands is whole outside the well and the tunnels; the fixed roots plan has its landing.

### 10.3 Meta-progression (`src/game/meta.ts`, M0) [M7]

```ts
export interface MetaState { v: 1; staircase: boolean; metAt?: number }
export interface MetaStore { read(): string | null; write(s: string): void }
export const browserStore: MetaStore;                 // localStorage 'the-roots.meta', try/catch like i18n/dom.ts
export function loadMeta(store?: MetaStore): MetaState;   // a missing, broken or newer record reads as the default
export function saveMeta(s: MetaState, store?: MetaStore): void;
```

The second thing the browser keeps, after the language. Private mode, blocked storage or cleared data simply read as no unlock. **Generation never reads it**: `main.ts` loads the meta once and passes `{ stair: meta.staircase }` to every `newRun`; the sandbox and the lab always pass `false`; the seed label shows it (`· v24 · stair`); a golden test generates one seed with the option on and off and finds only staircase cells differing. `tests/meta.test.ts` uses a memory store: round trip, broken JSON, unknown version, the default. Forgetting the unlock is a console command only, `S.meta.reset()` (provisional, owner).

### 10.4 Floor 0

The owner's design text says "Floor 1"; the owner decided it means **floor 0, the roots**, where every run begins and the start room stands (decision 5). The design text is corrected by D0.

## 11. Art and visuals (sotano-art)

Every element below is drawn by the package that builds it and passes the gate **inside that package** [M12]: captures in its own `?gallery=sky-<part>` section, greyscale, the three colour-blindness filters, at distance, and the meaning test; the rulings go to its own ledger page `docs/art/sky/<part>.md` (linked once from `DECISIONS.md` by K0).

- **Sky creatures are not projections.** No cold husk, no family eye, no cold tokens (cold is reserved for projections). They are **plush**: a small round soft body of whole-texel boxes in low-contrast felt tones, under a **giant head** about 2.2 times the body's width, the animal readable from its silhouette first. A deity stands about 3 blocks tall, a minion about one. Token families `plush.<animal>.*` in the palette part of each animal. Telegraphs use the animal's own parts (lids, ears, mane, trunk, hind legs) as the `tell`, on the three channels of `DECISIONS.md` §8.5, at the floor's length.
- **Nothing in the sky is red.** `DECISIONS.md` §7.6 says what hurts is red; nothing hurts in the sky (owner decision 8), so no sky telegraph, ring or arc uses the attack red. Their colour says "this moves you", in the animal's own tones.
- **Gold marks** are the player's light (gold is the light and repair): small quads of `light.gold` that stay where each positive hit landed.
- **The puff** is a pale cloud of `bone`/`sky` motes, never gold: it must read as "nothing happened".
- **Sky materials** (ids from 30, tough like brick so breaking feels the same, none flammable): cloud, sky wood, **heartwood** (unbreakable: trunk wall, slabs, membranes), sky leaf, bamboo, moss, pale stone (terraces, rocks), fence wood, mist (fading), star resin, meteor glass, solar glass, **sun seal** (unbreakable). The shimmer of a returning block and the grey of a fading one are effects, not extra materials, except mist.
- **The sky palette**: the deck in day sky (`sky.day`, `sky.horizon`); inside the halls the light of the knot windows; Totality's strata as fog and clear colour by height (pale blue → cyan and violet → black with stars, a nebula band and the Earth below → gold wash). `src/sky/atmosphere.ts` holds the table (pure, AB); `src/sky/render/` the Earth sphere, the nebula band and the Sun (TT).
- **The Sun's warmth: a provisional exception to pillar 2** (owner, provisional). Pillar 2 says warm light that is not the player's hurts. The Sun is warm and not the player's; the ledger records it as the one stated exception, provisional: the Sun is the source the player's light comes from, so its warmth is the one warmth that is not a threat; it never lights the blocks (no warm bake), it only washes the sky. AB writes the entry in `docs/art/sky/README.md`; TT applies it.
- **The Spiked Entity**: dark, low and wide (at most 3.5 high), countless spikes as stepped thin boxes, immovable; a faint cold rim so it reads in the dark of silence (it belongs to the depths); the spikes catch the player's light when the bounce shimmers.
- **Gallery sections** (one part file each, created by K0): `sky-blocks`, `sky-panda`, `sky-koala`, `sky-elephant`, `sky-lion`, `sky-horse`, `sky-totality`, `sky-entity`, `sky-hindrances-core`, `sky-hindrances-ground`, `sky-hindrances-hold`, `sky-hindrances-flow`.

## 12. Text in every language (sotano-i18n)

Every word exists in English and Spanish **in the same change**, in the package that adds it [m8]. To let packages work in parallel without editing one big catalog, K0 adds **catalog parts**: `src/i18n/locales/sky/<part>.en.ts` and `<part>.es.ts` for `core`, `panda`, `koala`, `elephant`, `lion`, `horse`, `totality` and `endgame`, spread into `en.ts` and `es.ts` once (the `as const` objects keep `MessageKey` inference). Each package edits only its part. Content text follows the existing rule (en.ts 1–3): an item's English lives in its definition and its Spanish in `es.ts`'s `content.items`.

| Part | Keys (examples) | Package |
|---|---|---|
| `core` | `level.sky`, `level.skyDeck`, `toast.skyEnter`, `toast.skyLeave`, `toast.skyPuff`, `toast.gateOpens`, `toast.towerDown`, `sky.won` | R1 writes every `core` key up front; L1, C0, C1 and L2 only use them |
| per animal | `sky.<animal>.name` (deity), `sky.<animal>.minion`, `level.sky<n>` (the floor's name on the HUD), its outcome toast | F n (level name), B n (the rest) |
| `totality` | `level.totality.lower`, `.mid`, `.upper`, `toast.updraft` | TT, L2 |
| `endgame` | `endgame.entity.name`, `endgame.entity.line1`, `.line2`, `toast.stairOpens` | EN |
| item and stat | `content.items.triple-jump` (in the item's definition and `es.ts`), `stat.airJumps` (main catalogs) | TJ, PL |

The entity is not a bestiary entry, so it has no `content.enemies.*` key. **The Spanish revelation** is a faithful translation of the owner's English, marked in its catalog comment for the owner to confirm (owner decision 9): "El verdadero camino no era llegar a este lugar; el verdadero camino es ir hacia arriba. Todo este tiempo te equivocabas: tu camino era subir." The debug readout and the `S` console stay English. The last wave's i18n pass only reviews; it fills nothing.

## 13. Audio

Synthesised like the rest (`src/audio/sfx.ts`), through `host.cue`, in **audio parts** `src/audio/sky/<part>.ts` (K0 creates them and the index that maps a `SkyCue` to its part): `core` (AU: the puff, the shimmer and the regrowth chime, the rising gold tick of a positive hit, the gate opening, the updraft, the sky ambience: wind and far birds on the deck, wood creak in the halls, near-silence in the void), one per animal (B n: the minion's happy call, each telegraph's sound from its document: the grumble, the whump, the squeak, the rumble, the whistle, the speeding tick, the roar), `totality` (TT: the Sun's low hum near its volume), `entity` (EN: the drone, the tink, the rising chord when the staircase opens). Master volume stays as today outside silence.

## 14. Documentation (sotano-docs, sotano-design)

- This page, indexed in [README.md](README.md); the review in [../reviews/sky.md](../reviews/sky.md).
- **Each package moves its own design text** [m8] when what it describes is in the code, following sotano-design: the built part goes to `docs/design/built/…`; where only part is built, the not-built document keeps the rest and points to the built page. The moves, by package: the hindrance documents of `abilities/` (H0–H3), each guardian document and its minion section (B n), the laws of `sky/README.md` (L2, the last law), the threshold part of `levels/TOTALITY.md` (TT; Unity stays not built), the encounter, staircase and unlock out of `story/ENDGAME.md`, `levels/ENDING-AND-RETURN.md` and `story/META-PROGRESSION.md` (E2; no rematch), the triple jump out of `player/MOVEMENT-ABILITIES.md` (TJ). Within a wave no package edits a shared index: the indexes of the new `built/sky/` tree and the rows of the not-built indexes are brought up to date by DOC in the last wave, and every package keeps every link resolving.
- Changed built text: `built/levels/floors/SILENCE.md` (the loop opens into the sky: R1; the entity waits there: E2), `built/levels/giant-tree/STARS.md` (the last star opens the realm: R1).
- Architecture (DOC): OVERVIEW (module map: `src/sky/`, `src/endgame/`; frame order with the sky branch), RNG (§2.7 paths, `GEN_VERSION` 24, the staircase note, the run option), LEVELS (§13: the sky realm and the staircase), ENTITIES (sky creatures beside projections, the touch router), ACTORS (`'sky'` actors, the realm filter), ITEMS (`airJumps`, `jump.air`, the `sky` pool), input (the air jump), LOCALIZATION (catalog parts), SANDBOX (sky scenarios). Root README: what you can do, the roadmap line.

## 15. Debug and test access

- **URL** (R1 `?sky`, R2 the rest): `?sky` (the deck), `?sky=1`…`5` (a floor, standing at its foot), `?sky=6` (Totality's crown), `?sky=6&stratum=2` (the upper stratum's first checkpoint), `&won=1,2` (those deities already won, their ways up open), `&jump3` (the triple jump held). `main.ts` reads them after `new Game` and calls `game.debugSky(...)`.
- **Console** (DBG, `S.sky`): `go(n)`, `win()` (the current deity), `hits(n)`, `ally()` (the nearest minion), `hindrance(id)` (start one at the player), `stats()` (shapes, index entries, exceptions by kind, cached chunks), `layout()`; `S.meta.reset()`, `S.endgame.meet()` (the revelation now, through `game.debugMeet()` from E2). The F3 readout adds the realm, exceptions and cached chunks (R1).
- **Sandbox and lab:** a scenario may say `"sky": { "floor": 1, "at": [x, y, z], "won": [] }` instead of a room (R2's seam 16); the lab runs it at the fixed step and its report adds sky lines (exceptions by kind, hits, sides, active hindrances). Scenarios: `sky-passage` (B1: the dungeon is unchanged after a sky visit) and `sky-weapons` (every weapon lands a positive hit) from R2; `sky-laws` (break, regrow, place, puff, positive removal), `sky-tower` and one per hindrance from DBG; one per floor from B n.
- **Gallery:** §11.

## 16. Work packages

Tiers: **opus** for design, art, construction and systems; **haiku** for small mechanical work (strings, simple wiring, small tests, doc moves). Waves run in order; packages inside a wave run in parallel and **own disjoint files** (the "Owns" and "Edits" columns are exclusive within a wave). Only V0, R1, R2 and E2 edit `game.ts`, one per wave, each only in its seams of §2.6.

### 16.1 Rules every brief includes

Paste these with every brief:

1. Work on the sky branch; edit only the files your brief names. If a contract in `src/sky/types.ts` or `src/world/space.ts` must change, stop and report it to the coordinator: contracts change only through the coordinator.
2. Read this page's sections your brief cites and the design documents they link, as they are now.
3. Follow the skills your subject names (CLAUDE.md): sotano-feature for anything the player sees, hears or feels; sotano-art for anything visible (captures in your `?gallery=sky-<part>` section, greyscale, three colour-blindness filters, at distance, meaning test; rulings in your `docs/art/sky/<part>.md`); sotano-i18n for any readable text (English and Spanish in the same change, in your catalog part); sotano-items for items, stats and events; sotano-levels for floors and the staircase; sotano-controls for controls; sotano-design for design text; sotano-docs always.
4. Nothing in the sky takes the player's health; the player cannot die in the sky. Nothing in the sky dies.
5. Done means: your tests written and green, `npm run typecheck && npm test` green, the lab's existing reports unchanged unless your brief says otherwise, your design text moved if your brief says so, links resolving. Do not commit unless the coordinator asks; report the files you changed.

### 16.2 Packages

| Id | Tier | Wave | Goal | Owns (new files) | Edits | Consumes |
|---|---|---|---|---|---|---|
| **K0** contracts | opus | 1 | Every shared type, registry, stub and part file | `src/world/space.ts`, `src/sky/types.ts`, all stubs (§16.3), all part files, `tests/helpers/voxel-space-contract.ts`, `tests/sky-contracts.test.ts` | `i18n/locales/{en,es}.ts` (spreads), `content/palette.ts` (spreads), `debug/gallery.ts` (sections), `docs/art/DECISIONS.md` (one link) | — |
| **M0** meta | haiku | 1 | The meta store | `src/game/meta.ts`, `tests/meta.test.ts` | — | — |
| **J0** jump math | opus | 1 | The jump's constants and envelope as pure code | `src/physics/jump.ts`, `tests/jump.test.ts` | `entities/player.ts` (import the constants, no behaviour change) | — |
| **ST0** staircase | opus | 1 | The pure staircase generator | `src/world/staircase.ts`, `tests/staircase.test.ts` | — | — |
| **D0** decisions | haiku | 1 | The owner's decisions written into the design | — | the not-built documents of §16.4 D0 | — |
| **V0** two worlds | opus | 2 | `VoxelWorld` behind `VoxelSpace`, `dw`, scene roots widened, the ghost-mesh fix | `tests/voxel-space.test.ts`, `tests/chunk-send.test.ts` | `world/world.ts`, `world/elements.ts`, `render/debris-view.ts`, `render/chunks.ts`, `entities/{doors,pickups,chests,alembics,kitchens,enemies}.ts`, `enemies/attacks.ts`, `render/tablets.ts`, `game.ts` (seams 1–2), `sandbox/{console,lab}.ts` (`dw`) | K0 |
| **W0** sky world | opus | 2 | The formula world with exceptions | `src/sky/world/{shapes,shape-index,cache,sky-world}.ts`, `tests/sky-world.test.ts` | `core/seed.ts` (`GEN_VERSION` 24) | K0 |
| **PL** player verbs | opus | 2 | Push, hold, carry, air jumps, `minJump` | `tests/player-verbs.test.ts` | `entities/player.ts`, `core/stats.ts`, `game/events.ts`, `tests/synergy-matrix.test.ts`, `i18n/locales/{en,es}.ts` (`stat.airJumps`) | K0, J0 |
| **RP** realm prep | haiku | 2 | Realm filter, clears, the `up` pad | `tests/realm-prep.test.ts` | `entities/actors.ts`, `combat/intents.ts`, `render/particles.ts`, `world/tree.ts` | K0 |
| **AB** sky blocks | opus | 2 | The 13 sky materials, the atlas, the atmosphere table, the sky's shared art rulings | `tests/sky-materials.test.ts` | `content/materials.ts`, `content/tiles.ts`, `render/atlas.ts`, `content/patterns.ts`, `src/content/palette/sky-blocks.ts`, `sky-totality.ts`, `src/sky/atmosphere.ts`, `src/debug/gallery/sky-blocks.ts`, `docs/art/sky/{README,blocks}.md`, `tests/art.test.ts` | K0 |
| **EN** entity | opus | 2 | The Spiked Entity and the encounter, headless | `tests/endgame.test.ts` | `src/endgame/{entity,entity-view,encounter}.ts`, its parts (i18n `endgame`, palette `sky-entity`, gallery `sky-entity`, audio `entity`, ledger `entity.md`) | K0, M0 |
| **R1** realm passage | opus | 3 | The swap, the guards, the gate, the frame, the host | `tests/realm-gate.test.ts`, `tests/realm-swap.test.ts` | `game.ts` (seams 2–9), `src/sky/{realm,gate,sky-realm}.ts`, `game/hud.ts`, `main.ts` (`?sky`), i18n `core`, `built/levels/floors/SILENCE.md`, `built/levels/giant-tree/STARS.md` | V0, W0, RP, AB |
| **L1** laws | opus | 3 | Regrowth, ownership, no harm, nests, tower detection | `tests/sky-laws.test.ts` | `src/sky/laws/{regrowth,ownership,no-harm,nests,tower}.ts` | W0 |
| **H0** runner | opus | 3 | The runner, the effects' rules, knockback, wind | `tests/sky-hindrances-core.test.ts` | `src/sky/hindrances/{runner,effects,knockback,wind}.ts`, `enemies/attacks.ts` (tint), gallery and ledger `sky-hindrances-core`, `abilities/{KNOCKBACK,WIND}.md` moves | W0, PL, V0 |
| **C0** deities | opus | 3 | `SkyCreatures`, the deity machine, hit marks, the puff | `tests/sky-creatures.test.ts` | `src/sky/creatures/{system,deity,puff}.ts`, `src/sky/render/{hit-marks,creature-view}.ts`, `src/sky/floors/graph.ts`, `entities/actors.ts` (`'sky'`), `game/events.ts` (`targetKind`), `tests/synergy-matrix.test.ts` | W0, RP, PL |
| **TR** sky tree | opus | 3 | Trunk, deck, halls, slabs, membranes, the layout's assembly | `tests/sky-tree.test.ts` | `src/sky/floors/tree.ts`, `src/sky/layout.ts`, `docs/art/sky/blocks.md` (captures appended) | W0, AB |
| **F1–F5** floors | opus × 5 | 3 | One floor's generator each (panda, koala, elephant, lion, horse) | `tests/sky-floor-<animal>.test.ts` | `src/sky/floors/<animal>.ts`, i18n `<animal>` (`level.sky<n>`), gallery `sky-<animal>.ts` (the floor), ledger `<animal>.md` (the floor) | W0, J0, AB |
| **TT** Totality | opus | 3 | Strata, reach, chain, the threshold, the Earth and the Sun | `tests/totality.test.ts` | `src/sky/totality/{strata,reach,chain,threshold}.ts`, `src/sky/render/{earth,sun}.ts`, i18n `totality`, gallery `sky-totality`, ledger `totality.md`, audio `totality`, `levels/TOTALITY.md` move | W0, J0, AB |
| **TJ** item | haiku | 3 | The Triple Jump item and the `sky` pool | `src/content/items/triple-jump.ts`, `tests/triple-jump.test.ts` | `content/items/index.ts`, `items/{types,validate,pool}.ts`, `i18n/locales/{en,es}.ts` (`content.items`, `controls.jump`), `docs/architecture/input/*`, `player/MOVEMENT-ABILITIES.md` move | PL |
| **R2** touch routing | opus | 4 | The touch router and its seams, the jump emit, `placing`, the sandbox entry | `src/combat/touch-router.ts`, `tests/touch-router.test.ts`, `src/sandbox/scenarios/{sky-passage,sky-weapons}.json` | `game.ts` (seams 10–16), `main.ts` (`?sky=n`), `sandbox/scenario.ts` | R1, C0 |
| **C1** minions | opus | 4 | The minion framework, gaits, the tower knock, the stuck guard | `tests/sky-minions.test.ts` | `src/sky/creatures/{minion,gaits,knock}.ts` | C0, L1 |
| **H1** ground hindrances | opus | 4 | Opening holes, fading platforms | `tests/sky-hindrances-ground.test.ts` | `src/sky/hindrances/{opening-holes,fading-platforms}.ts`, gallery and ledger `sky-hindrances-ground`, `abilities/{OPENING-HOLES,FADING-PLATFORMS}.md` moves | H0 |
| **H2** hold hindrances | opus | 4 | Dense ground, cube cage | `tests/sky-hindrances-hold.test.ts` | `src/sky/hindrances/{dense-ground,cube-cage}.ts`, gallery and ledger `sky-hindrances-hold`, `abilities/{DENSE-GROUND,CUBE-CAGE}.md` moves | H0 |
| **H3** flow hindrances | opus | 4 | Water currents, paralysis | `tests/sky-hindrances-flow.test.ts` | `src/sky/hindrances/{water-currents,paralysis}.ts`, gallery and ledger `sky-hindrances-flow`, `abilities/{WATER-CURRENTS,PARALYSIS}.md` moves | H0 |
| **AU** sky sound | opus | 4 | The sky's shared sounds and ambience | — | `src/audio/sky/core.ts`, `tests/audio-place.test.ts` | K0 |
| **E2** endgame wiring | opus | 5 | The entity in the game, the stillness hold, the staircase job, the run option | `tests/endgame-golden.test.ts` | `game.ts` (seams 17–20), `main.ts` (meta), i18n `endgame` (additions), `story/{ENDGAME,META-PROGRESSION}.md`, `levels/ENDING-AND-RETURN.md` moves, `built/levels/floors/SILENCE.md` | R2, EN, ST0, M0 |
| **L2** updraft and watch | opus | 5 | The updraft and the outside watch; the laws' design text | `tests/sky-laws-2.test.ts` | `src/sky/laws/{updraft,outside}.ts`, `sky/README.md` move | C1, PL, TR |
| **B1–B5** beings | opus × 5 | 5 | One animal's deity, minion, models, sounds, words (panda, koala, elephant, lion, horse) | `tests/sky-<animal>.test.ts`, `src/content/sky/<animal>-models.ts`, `src/sandbox/scenarios/sky-<animal>.json` | `src/sky/creatures/deities/<animal>.ts`, `minions/<animal>.ts`, palette `sky-<animal>`, i18n `<animal>`, audio `<animal>`, gallery `sky-<animal>`, ledger `<animal>.md`, `guardians/<ANIMAL>.md` move | C1, H0–H3, F n, R2; B5 also TJ |
| **DBG** console and lab | haiku | 6 | `S.sky`, `S.meta`, `S.endgame`, sky report lines, scenarios | `src/sandbox/scenarios/{sky-laws,sky-tower,sky-hindrance-*}.json` | `sandbox/{console,report,lab}.ts`, `tests/sandbox.test.ts` | R2, E2, all systems |
| **QA** acceptance | opus | 6 | The whole climb, headless and in the browser | `tests/sky-acceptance.test.ts` | — (reports defects to the coordinator; fixes go to the owning package's files in a follow-up) | everything |
| **DOC** docs | haiku | 7 | Indexes, architecture pages, root README, the i18n review | — | the indexes of `docs/design/`, the pages of §14, `README.md`, this page's status | everything |

### 16.3 Waves

```
Wave 1:  K0 (opus) ∥ M0 (haiku) ∥ J0 (opus) ∥ ST0 (opus) ∥ D0 (haiku)
Wave 2:  V0 (opus) ∥ W0 (opus) ∥ PL (opus) ∥ RP (haiku) ∥ AB (opus) ∥ EN (opus)
Wave 3:  R1 (opus) ∥ L1 (opus) ∥ H0 (opus) ∥ C0 (opus) ∥ TR (opus) ∥ F1 ∥ F2 ∥ F3 ∥ F4 ∥ F5 (opus) ∥ TT (opus) ∥ TJ (haiku)
Wave 4:  R2 (opus) ∥ C1 (opus) ∥ H1 (opus) ∥ H2 (opus) ∥ H3 (opus) ∥ AU (opus)
Wave 5:  E2 (opus) ∥ L2 (opus) ∥ B1 ∥ B2 ∥ B3 ∥ B4 ∥ B5 (opus)
Wave 6:  DBG (haiku) ∥ QA (opus)
Wave 7:  DOC (haiku)
```

No package consumes one of its own wave; `game.ts` is edited by V0 (2), R1 (3), R2 (4) and E2 (5). Same-wave pairs that touch neighbouring areas were split by file: PL owns `player.ts` in wave 2 (J0's edit is in wave 1); C0 owns `actors.ts`, `events.ts` and the synergy matrix in wave 3 (RP and PL had them in wave 2); H0 owns `attacks.ts` in wave 3 (V0 had it in wave 2); TJ owns `en.ts` and `es.ts` in wave 3 (PL had them in wave 2, K0 in wave 1).

### 16.4 Briefs

Each brief is self-contained: paste it with the rules of §16.1.

**K0 — contracts (opus, wave 1).** *Goal:* write every type and every file that later packages fill, so no two packages ever share a file in a wave. *Files:* `src/world/space.ts` (the `VoxelSpace` interface of §3.1, no implementation); `src/sky/types.ts` with `RealmKind`, `RealmSet`, `RealmHost`, `Travel`, `SkyBounds`, `Shape`, `SkyLayout`, `ExceptionKind`, `SkyWorldApi extends VoxelSpace` (§3.2's methods), `Place`, `PlaceKind`, `Link`, `FloorGraph`, `SkyFloorGen`, `SkyFloorPlan`, `PlatformTag`, `Channel`, `TotalityPlan`, `Stratum`, `Animal`, `SkyActor`, `DeityDef`, `MinionDef`, `AttackDef`, `CustomState`, `DeityRule`, `DeityCtx`, `MinionCtx`, `MinionRule`, `Gait`, `SpawnRule`, `AllyHelp`, `AllyAtDeity`, `WonOutcome`, `DeityModel`, `MinionModel`, `Hindrance`, `HindranceId`, `HindranceCtx`, `Effect`, `Telegraph`, `TelegraphSpec`, `PositiveHit`, `SkyHost` (§5.2, no damage verb), `SkyFx`, `SkyCue`, `TouchTarget`, `TouchProvider` (§5.7), `EncounterHost` (§10.1), and the constructor signatures of every subsystem as interfaces. **Stubs** (compile, do nothing, each exports its class or function with the contract's signature): `src/sky/laws/{regrowth,ownership,no-harm,nests,tower,updraft,outside}.ts`; `src/sky/hindrances/{runner,effects,knockback,wind,opening-holes,fading-platforms,dense-ground,cube-cage,water-currents,paralysis}.ts`; `src/sky/creatures/{system,deity,puff,minion,gaits,knock}.ts`; `src/sky/creatures/deities/{panda,koala,elephant,lion,horse}.ts` and `minions/` the same; `src/sky/floors/{graph,tree,panda,koala,elephant,lion,horse}.ts`; `src/sky/totality/{strata,reach,chain,threshold}.ts`; `src/sky/{layout,atmosphere,realm,gate,sky-realm}.ts`; `src/sky/render/{hit-marks,creature-view,earth,sun}.ts`; `src/endgame/{entity,entity-view,encounter}.ts`. **Registries** (written once, never edited again): `src/sky/floors/index.ts` (the five generators in order), `src/sky/creatures/deities/index.ts`, `src/sky/creatures/minions/index.ts`, `src/audio/sky/index.ts` (cue → part). **Part files**, each empty and wired once: i18n `src/i18n/locales/sky/{core,panda,koala,elephant,lion,horse,totality,endgame}.{en,es}.ts` spread into `en.ts` and `es.ts`; palette `src/content/palette/sky-{blocks,totality,entity,panda,koala,elephant,lion,horse}.ts` spread into `PALETTE`; gallery `src/debug/gallery/sky-<part>.ts` for the twelve sections of §11, each called from `gallery.ts` under `?gallery=sky-<part>`; audio `src/audio/sky/{core,panda,koala,elephant,lion,horse,totality,entity}.ts`; ledger pages `docs/art/sky/{README,blocks,panda,koala,elephant,lion,horse,totality,entity,hindrances-core,hindrances-ground,hindrances-hold,hindrances-flow}.md` (a title, an "Up" link and "nothing ruled yet"), linked from one new line in `DECISIONS.md`. **Tests:** `tests/helpers/voxel-space-contract.ts` (the `VoxelSpace` contract suite as a function taking a factory: get/set round trip, `idx`/`coords`, dirty marking, `paddedChunk` borders, elements); `tests/sky-contracts.test.ts` (the floor registry lists five generators in order 1–5 with the animals of §7.1; the deity and minion registries cover the five animals; part keys are disjoint; every stub constructs). *Provides:* every contract of this page. *Done when:* typecheck and tests green, the game and the lab behave exactly as before.

**M0 — meta store (haiku, wave 1).** *Goal:* the persisted unlock of §10.3. *Files:* `src/game/meta.ts` exactly as §10.3 (key `the-roots.meta`, try/catch like `src/i18n/dom.ts`), `tests/meta.test.ts` with a memory store (round trip, broken JSON, unknown or newer version read as the default, the default). Nothing reads it yet. *Done when:* tests green.

**J0 — jump math (opus, wave 1).** *Goal:* one pure source for the jump's numbers. *Files:* `src/physics/jump.ts` (walk speed, gravity, jump velocity, air control, coyote time, `LADDER = [1, 2, 8]`, `velocity(k, jump)`, `apex(k, jump)`, `rise(n, jump)` for the first n jumps, `flight(dy, jumps, airControl)` giving the horizontal reach of a sequence for a rise `dy`, undefined when the rise is out of reach); `entities/player.ts` imports the constants instead of defining them, with no behaviour change; `tests/jump.test.ts` (one jump rises 1.26, two 3.78, three about 13.9 at base stats; `flight` is undefined for two jumps at dy ≥ 3.78; the player's own simulated jump matches `apex(0, 1)`). *Done when:* tests green and the lab's reports are unchanged.

**ST0 — staircase generator (opus, wave 1; sotano-levels).** *Goal:* §10.2, pure, on `VoxelWorld` and `FloorResult`. *Files:* `src/world/staircase.ts` (`stairRoute`, `carveStair` with its `next(budget)` job; from `'silence'` or a floor number up to the surface; `STAIR_START_FLOOR = 0`), `tests/staircase.test.ts` (300 seeds: every floor finds a landing; a walk check from the chamber to the grass, two wide, steps of one, headroom of three, corners included; no door approach, centre, `P`, `H` or shaft cell touched; no room that can seal gains an opening; rock between bands whole outside the well and tunnels; the fixed roots plan has its landing; the roots' flight alone reaches the surface). Nothing calls it yet. *Done when:* tests green.

**D0 — decisions into the design (haiku, wave 1; sotano-design, sotano-lore).** *Goal:* the owner's nine decisions and the provisional answers of §19 written into the design text, so builders read the decided version. *Files (edit only):* `docs/design/not-built/sky/README.md` (no harm in the sky, a mistake costs height; the way up opens when the deity is won; open questions 3, 9, 10 answered provisional; the god outside is the guardian of that height, provisional; a broken original block drops no cube, provisional and to confirm), `sky/guardians/README.md` and the guardian documents (attacks push, slow or hold; teleport koala and horse, provisional), `sky/abilities/README.md` (no hindrance damages), `story/ENDGAME.md` (the entity waits in the silence chamber; no rematch in this build; floor 0), `story/META-PROGRESSION.md` (floor 0, the roots; forget by console only, provisional), `levels/ENDING-AND-RETURN.md`, `levels/TOTALITY.md` (the threshold is closed), `player/MOVEMENT-ABILITIES.md` (no forward boost, full steering, provisional). Read each document as it is now first: other sessions edit these files. Mark each answer "decided (owner, 2026-11-03)" or "provisional". *Done when:* the link check passes.

**V0 — two worlds behind one interface (opus, wave 2).** *Goal:* §3.1 and §2.3, with no change in behaviour. *Files:* `world/world.ts` implements `VoxelSpace`; `world/elements.ts` and `render/debris-view.ts` read through `getAt`, `elemAtIndex`, `coords`; `render/chunks.ts` typed `VoxelSpace`, skips `emptyChunk` only when no mesh exists for the key (extract the decision as a pure function); constructor scene parameters widened to `THREE.Object3D` in `entities/{doors,pickups,chests,alembics,kitchens,enemies}.ts`, `enemies/attacks.ts` (`Hazards`), `render/tablets.ts`, `render/chunks.ts`; `game.ts` seams 1–2: `dw: VoxelWorld` and `world: VoxelSpace` (the same object for now), every dungeon-only caller of §3.1 handed `dw`; `sandbox/{console,lab}.ts` read `game.dw`. *Tests:* `tests/voxel-space.test.ts` runs K0's contract suite on `VoxelWorld`; `tests/chunk-send.test.ts` (an emptied chunk that has a mesh is still sent; an empty chunk with no mesh is skipped). *Done when:* tests green and every lab report byte-identical.

**W0 — sky world (opus, wave 2).** *Goal:* §3.2–§3.4 and §3.6–§3.7. *Files:* `src/sky/world/shapes.ts` (rasterise each shape kind into a chunk buffer; `base` per cell), `shape-index.ts` (`buildIndex(shapes)` → `SkyLayout` with `tagAt`), `cache.ts` (`ChunkCache`, LRU with last-chunk memo, touched only on a miss), `sky-world.ts` (`SkyWorld implements SkyWorldApi`: exceptions by kind from the `placing` flag, `Replaced`, element edits in their own map, the transient heap, `setStory`, `restore`, `onBroken`, `knockTower`, `stats`, `paddedChunk` with `edits ?? base` borders, `emptyChunk`); `GEN_VERSION` to 24. *Tests:* `tests/sky-world.test.ts` (every item of §3.7, K0's contract suite on `SkyWorld`, and a timing check that `getAt` on a memoised chunk stays within a small multiple of `VoxelWorld.getAt`). *Done when:* tests green.

**PL — player verbs (opus, wave 2; sotano-items, sotano-i18n).** *Goal:* the player's side of §6 and §9. *Files:* `entities/player.ts`: `push(vx, vy, vz)` after the walk blend, `heldT` (no move input; look and shoot kept), `carry(to, s)` (input held while the body lerps), air jumps per §9 (the `airJumps` stat, the ladder from `physics/jump.ts`, no air jump within 0.6 of ground or while swimming, refill on landing, third-jump air control 1 with no forward boost, apex cap 16), the `jump` callback receives `(velocity, air)`, and an update option `minJump` (the effective `jump` never below it); `core/stats.ts` (`airJumps`, base 0, limits [0, 4]); `game/events.ts` (`jump` payload `air?: number`); `tests/synergy-matrix.test.ts` (the sample); `i18n/locales/{en,es}.ts` (`stat.airJumps`). *Tests:* `tests/player-verbs.test.ts` (push moves the body and decays; hold stops walking and keeps shooting; carry arrives in its time; with `airJumps 2` the three apexes follow 1×, 2×, 8×; no air jump near ground; landing refills; the cap; `minJump` clamps a lowered jump). *Done when:* tests green and, with `airJumps 0`, the lab's reports unchanged.

**RP — realm prep (haiku, wave 2).** *Goal:* small pieces R1 needs. *Files:* `entities/actors.ts` (`register(a, realm = 'dungeon')`, `setRealm(kind)`, `all()` yields the player and the active realm's actors), `combat/intents.ts` (`clear()` drops every intention in flight and its meshes), `render/particles.ts` (`clear()`), `world/tree.ts` (the last pad of the last constellation gets `up: true`; the cycle and `to` stay). *Tests:* `tests/realm-prep.test.ts` (the filter; both clears leave nothing; exactly one pad is `up` and it is the last star). *Done when:* tests green, the lab unchanged.

**AB — sky blocks and atmosphere (opus, wave 2; sotano-art).** *Goal:* the sky's materials, atlas and colour, and the sky's shared art rulings. *Files:* `content/materials.ts` (the 13 materials of §11 from id 30; heartwood and sun seal `tier: Infinity, hp: Infinity` like `kitchen`; none flammable), `content/tiles.ts` (`ATLAS_ROWS` 8; the special tiles moved after the material range), `render/atlas.ts`, `content/patterns.ts` if new patterns, palette parts `src/content/palette/sky-blocks.ts` and `sky-totality.ts`, `src/sky/atmosphere.ts` (pure: fog and clear colour for the deck, the halls and Totality's strata by height), gallery `src/debug/gallery/sky-blocks.ts`, ledger `docs/art/sky/README.md` (plush, never cold; nothing in the sky is red; the puff; the Sun's warmth as a provisional exception to pillar 2) and `docs/art/sky/blocks.md`, `tests/art.test.ts` (ratchet). *Tests:* `tests/sky-materials.test.ts` (ids 30–42 unique; heartwood and sun seal unbreakable; none flammable; every material has its tile). *Done when:* the gallery gate passes for every block and the strata swatches.

**EN — the Spiked Entity (opus, wave 2; sotano-art, sotano-lore, sotano-i18n).** *Goal:* §10.1, headless. *Files:* `src/endgame/entity.ts` (body box at most 3.5 high, `TouchProvider` whose touches always bounce), `entity-view.ts` (the model of §11), `encounter.ts` (`Encounter` over `EncounterHost`: within 5 blocks once per run, the card, 6 s or dismissal, rumble, `openStairs`, `saveMeta`, `holdsStill` true from the turn until the stairs open); i18n part `endgame` (name, two lines, `toast.stairOpens`; the Spanish of §12 with a comment "faithful translation, for the owner to confirm"), palette `sky-entity`, gallery `sky-entity`, audio `entity` (drone, tink, chord), ledger `docs/art/sky/entity.md` (captures inside a 4-high chamber). *Tests:* `tests/endgame.test.ts` (a bounce of every polarity and kind changes nothing; the card shows once per run; stillness is held until `openStairs`, then released; the flag is saved once). *Done when:* tests green and the gallery gate passes.

**R1 — realm passage (opus, wave 3).** *Goal:* §2.1–§2.6 seams 2–9. *Files:* `src/sky/realm.ts` (`swapRealm` over `RealmHost`), `src/sky/gate.ts` (`RealmGate`, its pure `check`), `src/sky/sky-realm.ts` (`SkyRealm.create(host)`: builds the layout from `src/sky/layout.ts`, the sky set on `skyRoot`, composes every law, hindrance and creature system through K0's contracts in the update order of §2.5, installs and removes the sky's hooks with owner `sky`, `stream`, `atmosphere`, `placeAt`, `positiveHitsBlock`, holds the floor and Totality plans); `game.ts`: roots on `dungeonRoot` and `skyRoot`, the realm fields, every guard of §2.5a, `teleport` by realm, the passages (the `up` pad, the top of the sky from anywhere, the deck's edge), the `simulate` branch with `minJump: 1` in the sky, the `frame` branch, `transitioning` and `debug`, `makeSkyHost`; `game/hud.ts` (place label; minimap hidden in the sky); `main.ts` (`?sky` → the deck); i18n `core` (every key of §12's `core` row, both languages); built text `SILENCE.md` and `STARS.md` (the loop now opens into the sky). *Tests:* `tests/realm-gate.test.ts` (each passage of §2.4 and none in between); `tests/realm-swap.test.ts` (with a fake host: fields swapped, transient systems cleared, hooks installed and removed, the stash returned intact). *Done when:* tests green, the lab unchanged, and in the browser `?sky` shows the deck, falling off it lands on the crown, and the last star goes up.

**L1 — sky laws (opus, wave 3).** *Goal:* laws 3.1, 3.2, 3.9 (detection), the nests, no harm and the item-events rule of §4. *Files:* `src/sky/laws/regrowth.ts`, `ownership.ts`, `no-harm.ts`, `nests.ts`, `tower.ts` (`towerUnder` by height above formula ground). No strings of its own: it uses the `core` keys R1 writes (§12). *Tests:* `tests/sky-laws.test.ts` (each row of §4 for these laws, on a real `SkyWorld` and a fake host; a deferred damage is cancelled; a placed stair of three rises is a tower). *Done when:* tests green.

**H0 — hindrance runner, knockback, wind (opus, wave 3; sotano-art).** *Goal:* §6's framework and its first two hindrances. *Files:* `src/sky/hindrances/runner.ts`, `effects.ts` (`SkyEffects`: never a placed cell, never a protected cell, never damage, everything ends), `knockback.ts`, `wind.ts`; `enemies/attacks.ts` (`Hazards` takes a tint; projections keep the cold); gallery and ledger `sky-hindrances-core`; design moves of `abilities/KNOCKBACK.md` and `WIND.md`. *Tests:* `tests/sky-hindrances-core.test.ts` (no effect before the full telegraph; a placed block never changed; the effect ends; no damage; each positive answer; a block between source and player shelters). *Done when:* tests green and the gallery gate passes.

**C0 — sky creatures and deities (opus, wave 3).** *Goal:* §5.1–§5.3 without minions. *Files:* `src/sky/creatures/system.ts` (`SkyCreatures` as `TouchProvider`), `deity.ts` (the machine, stages, warm positive hits only, guards, levitation, teleport far, won → ally → `onWon`), `puff.ts` (law 3.3 and the first-puff toast), `src/sky/render/hit-marks.ts`, `creature-view.ts` (models from `ModelPart` through `buildModel`), `src/sky/floors/graph.ts` (helpers), `entities/actors.ts` (`ActorKind` `'sky'`), `game/events.ts` (`targetKind: 'sky'`), `tests/synergy-matrix.test.ts` (the `factionChange` sample). *Tests:* `tests/sky-creatures.test.ts` with a test deity: transitions, stages at a third and two thirds, a negative touch changes nothing and puffs once, a beam's cold ticks add nothing, teleport lands ≥ 12 away, won makes an ally and calls `onWon` once, nothing sets `alive = false`. *Done when:* tests green.

**TR — sky tree (opus, wave 3; sotano-levels, sotano-art).** *Goal:* §7.1 and the layout's assembly. *Files:* `src/sky/floors/tree.ts` (trunk widening as it rises, the deck of cloud, the halls, heartwood walls, slabs and membranes, knot windows, `trunkRadius(y)`, `openGate(n)`), `src/sky/layout.ts` (tree + the five generators from the registry + Totality's plan → `SkyLayout` and the plans; works while generators are stubs); captures of the trunk and deck appended to `docs/art/sky/blocks.md`. *Tests:* `tests/sky-tree.test.ts` (bands contiguous and in order; slabs whole but the way up; membranes closed until `openGate`; the trunk radius per height; the same layout in any order of materialisation). *Done when:* tests green.

**F1–F5 — one floor each (opus, wave 3; sotano-levels, sotano-art).** *Goal:* the generator of one floor (F1 panda, F2 koala, F3 elephant, F4 lion, F5 horse) per its B6 rules (§7.2 table) and §7.3. *Files:* `src/sky/floors/<animal>.ts` (`SkyFloorGen`: shapes, graph, seat, spawns, nests, route, gate, platform tags, extras); i18n `<animal>` part: `level.sky<n>` only; gallery `sky-<animal>.ts` (the floor seen from above and from the ground; the beings come later); ledger `docs/art/sky/<animal>.md` (the floor's section). *Tests:* `tests/sky-floor-<animal>.test.ts` (§7.4 for 50 seeds). *Done when:* tests green and the gallery gate passes for the floor.

**TT — Totality (opus, wave 3; sotano-levels, sotano-art).** *Goal:* §8. *Files:* `src/sky/totality/strata.ts`, `reach.ts` (on J0's `flight`), `chain.ts` (climb and rest hops, headroom columns, checkpoints every six, radius ≤ 100), `threshold.ts` (the sealed gate, its refusal), `src/sky/render/earth.ts`, `sun.ts` (applying the provisional pillar-2 exception), i18n `totality`, gallery `sky-totality`, ledger `totality.md`, audio `totality`; design move of the threshold part of `levels/TOTALITY.md`. *Tests:* `tests/totality.test.ts` (§8's list). *Done when:* tests green and the gallery gate passes.

**TJ — the Triple Jump item (haiku, wave 3; sotano-items, sotano-i18n, sotano-controls).** *Goal:* §9's item and pool. *Files:* `src/content/items/triple-jump.ts` (pool `'sky'` only, `airJumps +2`, English in the definition), `content/items/index.ts`, `items/types.ts` (`PoolName` `'sky'`), `items/validate.ts` (accepts it), `items/pool.ts` (`ItemPools` drops sky-only items), `i18n/locales/{en,es}.ts` (`content.items` Spanish; `controls.jump` mentions air jumps when held), `docs/architecture/input/*` (the air jump); design move of the triple jump out of `player/MOVEMENT-ABILITIES.md`. *Tests:* `tests/triple-jump.test.ts` (validates; never drawn by `ItemPools` from any pool or fallback; golden reservations unchanged); `controls.test.ts` green with no change to `BINDINGS`. *Done when:* tests green.

**R2 — touch routing and the sandbox entry (opus, wave 4).** *Goal:* §5.7 and seams 10–16. *Files:* `src/combat/touch-router.ts`; `game.ts`: `enemyAt`, `damageActor`, `intentTouch`, the weapon host's `targets` and `hit`, `intentHitsBlock`'s positive branch, `placing` around `tryPlace`, the `jump` emit with `air`, the sky sandbox entry and `debugSky`, `SkyCreatures` registered with the router while the sky is active; `main.ts` (`?sky=n`, `&won`, `&jump3`, `&stratum`); `sandbox/scenario.ts` (the `sky` field); scenarios `sky-passage.json` (§2.5a) and `sky-weapons.json`. *Tests:* `tests/touch-router.test.ts` (every weapon id and the plain shot land a positive touch; a beam stroke counts one; a routed id never reaches `enemies`). *Done when:* tests green; in the lab `sky-passage` reports the dungeon unchanged and `sky-weapons` a hit per weapon.

**C1 — minions, gaits, the tower knock (opus, wave 4).** *Goal:* §5.4 and the knock of §5.3. *Files:* `src/sky/creatures/minion.ts` (rules, turning, ally helps, stuck guard), `gaits.ts`, `knock.ts` (the warning, `knockTower` into loose cubes, the 2-block push, the return). *Tests:* `tests/sky-minions.test.ts` with a test minion (turns at its count; a negative touch puffs; an ally never turns back; a stuck minion returns or fades and reappears; `protect` blocks a hindrance; a tower is knocked into loose cubes and the player pushed off). *Done when:* tests green.

**H1, H2, H3 — the other hindrances (opus, wave 4; sotano-art).** *Goal:* two hindrances each from §6: H1 opening holes and fading platforms; H2 dense ground and cube cage; H3 water currents (timed sources it owns and removes) and paralysis (`hold`). *Files:* their two modules in `src/sky/hindrances/`, their gallery and ledger part (`sky-hindrances-ground`, `-hold`, `-flow`), the design moves of their two documents in `abilities/`. *Tests:* `tests/sky-hindrances-<group>.test.ts` (the four checks of §6 per hindrance, no damage, and its special rule: a hole never on the route, a held cell never fades, a cage never closed over a drop, a dam stops the stretch below, the ring halves when watched). *Done when:* tests green and the gallery gate passes.

**AU — the sky's sound (opus, wave 4).** *Goal:* the `core` sounds and ambience of §13. *Files:* `src/audio/sky/core.ts`; `tests/audio-place.test.ts` extended (every `SkyCue` maps to a sound; ambience by place). *Done when:* tests green and each sound heard in the browser at its place.

**E2 — endgame wiring (opus, wave 5).** *Goal:* §10 in the game, seams 17–20. *Files:* `game.ts`: the entity placed when floor 9 is carved and registered with the touch router, `Encounter.update` in the silence block with the stillness hold, the staircase job (`carveStair(...).next(budget)` per frame under the rumble), `newRun({ stair })`, the roots' flight in `carve(0)` when set, the seed label ` · stair`, `debugMeet()`, sandbox and lab forced to `stair: false`; `main.ts` (loads the meta once, passes it); i18n `endgame` additions; design moves out of `story/ENDGAME.md`, `story/META-PROGRESSION.md`, `levels/ENDING-AND-RETURN.md`; built `SILENCE.md` (the entity waits there). *Tests:* `tests/endgame-golden.test.ts` (one seed with `stair` on and off: only staircase cells differ; the default run is byte-identical to today). *Done when:* tests green; in the browser, meeting the entity shows the card, opens the stairs before silence can carry the player, the staircase climbs to the grass, and a new run starts with the roots' flight.

**L2 — updraft and outside watch (opus, wave 5).** *Goal:* the last two laws. *Files:* `src/sky/laws/updraft.ts` (checkpoints, `CATCH = 20`, carry back in 1.6 s), `outside.ts` (the guardian of that height knocks a tower outside the trunk's radius); i18n `totality` (`toast.updraft`); design move of the laws in `sky/README.md`. *Tests:* `tests/sky-laws-2.test.ts`. *Done when:* tests green.

**B1–B5 — one animal's beings (opus, wave 5; sotano-art, sotano-lore, sotano-i18n, sotano-feature).** *Goal:* one animal (B1 panda, B2 koala, B3 elephant, B4 lion, B5 horse): its deity and minion from its guardian document (B2–B5 sections) on the frameworks, its models, its words, its sounds. *Files:* `src/sky/creatures/deities/<animal>.ts`, `minions/<animal>.ts`, `src/content/sky/<animal>-models.ts`, palette `sky-<animal>`, i18n `<animal>` (names, outcome toast), audio `<animal>`, gallery `sky-<animal>` (the beings in every state and telegraph), ledger `<animal>.md`, scenario `src/sandbox/scenarios/sky-<animal>.json`; design move of `guardians/<ANIMAL>.md`. B5 also: the gift (`host.gift('triple-jump', …)` on the paddock when won), Gentled, startle. *Tests:* `tests/sky-<animal>.test.ts` (its own rules from §5.5; won opens the way up; the ally's help respects its cap; every attack only moves, slows or holds). *Done when:* tests green, the gallery gate passes, and the floor is winnable in the browser from `?sky=<n>` with nothing in the hand.

**DBG — console and lab (haiku, wave 6).** *Goal:* §15's console and lab lines. *Files:* `sandbox/console.ts` (`S.sky.*`, `S.meta.reset()`, `S.endgame.meet()`), `sandbox/report.ts` (sky lines), `sandbox/lab.ts`, scenarios `sky-laws.json`, `sky-tower.json`, `sky-hindrance-<id>.json` for the eight; `tests/sandbox.test.ts` covers them. *Done when:* tests green and every sky scenario runs in the lab.

**QA — acceptance (opus, wave 6).** *Goal:* prove the whole. *Files:* `tests/sky-acceptance.test.ts` (headless: the layout from ten seeds is climbable from the deck to the threshold with the floors' routes and Totality's envelope; a probe climb keeps memory flat; regrowth leaves no exceptions). In the browser: a full climb from the roots (with and without the unlock) to the Sun threshold, each floor won with nothing, the passage scenario, phone-width touch play on one floor. *Done when:* the coordinator has a defect list (empty, or with owners).

**DOC — documentation (haiku, wave 7; sotano-docs, sotano-design).** *Goal:* §14's indexes and pages. *Files:* the indexes of `docs/design/built/` (the new `sky/` tree) and `not-built/`, the architecture pages of §14, the root `README.md`, this page's status line ("built"), and a review-only pass of every sky catalog part in both languages. *Done when:* the link check passes and every index lists what exists.

## 17. Risks

1. **The interface extraction touches hot code** (elements, cracks, chunk meshing). Mitigation: V0 lands alone among `game.ts` editors, with the contract suite and the lab's existing reports unchanged byte for byte.
2. **Actors from two worlds share one registry and one coordinate range.** Mitigation: `ActorRegistry.setRealm` (RP) and the touch router (R2), tested.
3. **Two chunk renderers and two workers** cost GPU memory on phones. Mitigation: on touch devices the inactive one is disposed and rebuilt under the travel fade.
4. **A chunk miss inside physics** would materialise synchronously. Mitigation: the prefetch ring; a miss costs one rasterised chunk.
5. **`game.ts` grows.** Mitigation: the twenty seams of §2.6 are the whole budget; review rejects any other edit.
6. **The sky reaches a dungeon system** through a call nobody guarded. Mitigation: §2.5a, `dw`, the `sky-passage` scenario; the `below` grouping if it happens again (§18).
7. **3D creature behaviour gets stuck** on geometry the player built. Mitigation: graph-based navigation, the stuck guard, a lab scenario per floor.
8. **Jump practices stack with the triple jump** (jump × 5 × 8). Mitigation: the apex cap of 16; Totality is generated against base stats and the sky clamps `jump` to at least base, so practices only make it easier.
9. **The staircase meets a big room or a claimed cell.** Mitigation: only unclaimed empty cells, doorless sides of rooms that never seal, the margin alcove; 300 seeds in the test.
10. **The design is moving** (other sessions edit `not-built/` documents now). Mitigation: D0 writes the decisions first; each package reads the current text before building and moves only its own.
11. **The meta flag is lost** with browser data. Accepted: the design asks only for local storage.
12. **Forty agents, one branch.** Mitigation: disjoint ownership per wave, contracts only through the coordinator, `npm run typecheck && npm test` after every merge.

## 18. Later

- **Realm hardening**: every dungeon-only system behind `get below(): DungeonSystems | null` (B1), if a second leak appears.
- **Autostep** for the staircase and the sky's steps (m9).
- Unity (issue #95), the solar relic and any rematch with the Spiked Entity.
- Solar wind as a hindrance or an aid in Totality.
- Conversion rewards for `factionChange` with source `sky` (m11), in the balance milestone.
- A height gauge or map for the sky; music per floor.
- Minions after their floor is cleared; deities that return; a platforming-only floor switch.
- A second jump practice in the basement using `airJumps` (MOVEMENT-ABILITIES idea); flight.
- Negative shots at hindrances (abilities open question 4).
- Saving a run in progress; a "forget progress" option in the menu.
- Creatures in the built tree's stories.
- Room and floor item events in the sky (m7), if items want them.

## 19. The owner's decisions and what stays open

**Decided by the owner (2026-11-03).**

1. The sky is a separate realm above the crown, a formula world storing only exceptions; the seven built stories stay as the climb.
2. The build goes up to Totality and its last jump enters the Sun, which activates Unity (issue #95, not built; it does nothing yet).
3. The endgame is the Spiked Entity encounter, the revelation, the staircase and the permanent unlock. No rematch.
4. Open design questions take the proposals written in the docs, marked provisional.
5. The permanent staircase is on floor 0, the roots.
6. The Spiked Entity waits in the silence chamber; silence still carries the player to heaven.
7. The way up between sky floors opens only when that floor's deity is won.
8. The player cannot die in the sky (owner, 2026-11-03): no sky creature takes health. A deity can capture the player and take one practice; special attacks drain spirit; spirit at zero teleports the player to a random underground floor (the defaults below are provisional).
9. The Spanish revelation is a faithful translation (§12), for the owner to confirm.

**Provisional (the engineer's proposal, taken by the owner).** The koala and the horse teleport. The Triple Jump has no forward boost and full air steering. The Sun's warm light is the one stated exception to art pillar 2 (ledger, provisional). A knocked-down tower falls as loose cubes. A positive shot removes a player block with no cube back. The unlock is forgotten by a console command only. Rising past the top of the dungeon's sky from outside the tree also opens the realm. The god that comes outside the tree is the guardian of that height. Sky materials are not flammable. A sky floor is neither a room nor a floor for item events. The capture defaults: held 3 s (`CAPTURE_TIME`), released by the player; no move or jump while held, looking and shooting kept; one practice held at random is taken for the rest of the run, not returned on release. The spirit defaults: at most 100 (`SPIRIT_MAX`); spirit refilled to full after the teleport; the teleport lands on a random underground floor from 0 to 9, the silence chamber excluded. Which attacks are special, and the spirit each drains, are not set yet (the owner did not name them).

**For the owner to confirm.**

1. **A broken original sky block drops no loose cube** (mediator, provisional): with regrowth every block would otherwise be an endless supply, and the nests exist because cubes are scarce up there.
2. **The Spanish revelation's wording** (§12).
3. **Names:** the Triple Jump's (MOVEMENT-ABILITIES open question 1) and the Spiked Entity's (ENDGAME open question 1).
