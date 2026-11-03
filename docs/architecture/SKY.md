# The upper world: the sky realm, Totality and the endgame

Up: [Architecture](README.md)

Status: **proposal** (engineer, 2026-11-03), waiting for the three-party review ([sotano-docs](../../.claude/skills/sotano-docs/SKILL.md) §4). Nothing here is in the code yet. When the review rules, its record goes to `docs/reviews/sky.md` and this page keeps only what was accepted.

The design this builds is in [the realm of the sky](../design/not-built/sky/README.md) (laws, [guardians](../design/not-built/sky/guardians/README.md), [minions](../design/not-built/sky/minions/README.md), [hindrances](../design/not-built/sky/abilities/README.md)), [Totality](../design/not-built/levels/TOTALITY.md), [the endgame](../design/not-built/story/ENDGAME.md), [the return](../design/not-built/levels/ENDING-AND-RETURN.md), [meta-progression](../design/not-built/story/META-PROGRESSION.md) and the [triple jump](../design/not-built/player/MOVEMENT-ABILITIES.md). Line numbers below are those of `src/game/game.ts` on `develop` at `75d51f2`.

## 0. In one paragraph

The run gets a **second world**. The dungeon world (the ten floors and the built giant tree) stays exactly as it is. Reaching the top of the built tree carries the player, through a short fade, into the **sky realm**: a `SkyWorld` whose shape is a formula (a list of shapes: slabs, rings, columns, runs, stairs, blobs) and which stores only its **exceptions** (blocks broken, placed or changed by a hindrance), materialised chunk by chunk for the mesher and evicted when far. The realm holds the **sky tree** with the five guardian floors stacked inside it (panda, koala, elephant, lion, horse) and **Totality** above its crown, ending at the closed threshold of the Sun. The game swaps a small **realm set** of per-world systems (world, chunk renderer, elements, loose cubes, pickups, projections) when the player passes, and runs the sky's own systems (laws, creatures, hindrances) in place of the dungeon's room bookkeeping. New code lives in `src/sky/` and `src/endgame/`; `game.ts` gets about a dozen seams. At the bottom, the invulnerable **Spiked Entity** waits in the chamber of silence; meeting it carves a **staircase** up through every floor to the surface and saves one flag in `localStorage`, so every later run starts with a staircase from the first floor to the surface.

## 1. What is built and what is not

| Built by this proposal | Not built (later or another game) |
|---|---|
| The sky realm as its own formula world, both ways in and out | Unity, sky floor 7 (issue #95, pending the owner) |
| The sky laws 3.1–3.9 as systems | The solar relic and the rematch with the Spiked Entity |
| A deity framework, a minion framework, eight hindrances | Solar-wind hindrances in Totality (open question 3 there) |
| Five guardian floors from their B6 layout rules | Any sky time limit (open in the sky README) |
| Totality: three strata, the triple-jump route, updraft recovery, the closed Sun threshold | Saving a run in progress |
| The Triple Jump (the horse's gift) | Other unlocks, recipes, side biomes (META-PROGRESSION ideas) |
| The Spiked Entity, its revelation, the staircase, the persisted unlock, the first-floor staircase | |

Where a design document leaves a question open, the build takes the proposal written there and marks it **provisional** in the design text (owner decision 4). Section 19 lists what only the owner can decide.

## 2. The realm model

### 2.1 Two worlds, one run

```ts
// src/sky/realm.ts
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
- The **sky set** is built lazily, the first time the player passes up in a run (`SkyRealm.create`), from its own forks (§2.7). It stays alive for the rest of the run: going down and coming back finds the same broken blocks, the same allies and the same won deities.
- Only one set is **active**. The inactive set is frozen: not simulated, not meshed, its group hidden. Its data stays in memory (the dungeon world is 2 × 3.9 MB; the sky world is flat, §3.6).
- A new run (death, R) disposes both sets. Nothing of the sky survives a run except the meta flag (§10.3), which is not sky state.

The game keeps its fields (`this.world`, `this.chunks`, `this.elements`, `this.debris`, `this.pickups`, `this.enemies`): there are 68 uses of `this.world` and 40 of `this.debris` in `game.ts`, and rewriting them as `this.realm.world` would touch hundreds of lines for nothing. Changing worlds **swaps the fields** from a stashed `RealmSet`:

```ts
// game.ts (new, ~30 lines)
private realm: RealmKind = 'dungeon';
private stash: RealmSet | null = null;          // the inactive world's set
sky: SkyRealm | null = null;                    // the sky's own systems (§4–§8), null until first visit
private swapRealm(to: RealmSet) { /* stash the current fields, install `to`, toggle groups */ }
```

### 2.2 What is scoped to the active world

| System | Dungeon | Sky | How it is scoped |
|---|---|---|---|
| Voxels | `VoxelWorld` | `SkyWorld` | Swapped field, typed `VoxelSpace` (§3.1) |
| Chunk meshes and their worker | one `ChunkRenderer` | one `ChunkRenderer` | Per set. Only the active one gets `update()`; the inactive one keeps its meshes, hidden with its group (no remesh on return). On touch devices the inactive one is disposed and rebuilt under the fade (§17, risk 3) |
| Elements | `ElementSim` | `ElementSim` | Per set; the sky's runs only the hindrances' water (§6) |
| Loose cubes | `DebrisSystem` | `DebrisSystem` | Per set: a cube stays in the world it fell in. `DebrisView` reads `this.debris`, so it follows the swap |
| Pickups | `Pickups` | `Pickups` | Per set (the horse's gift is a pickup) |
| Projections | `Enemies` | an empty `Enemies` | Per set. Sky creatures are not projections and live in `SkyCreatures` (§5) |
| Doors, chests, alembics, kitchens, tablets | dungeon only | none | Under `dungeonRoot`; their per-frame calls sit in steps the sky skips (§2.5) |
| Sky creatures, laws, hindrances, nests | none | `SkyRealm` | Run by `SkyRealm.update` |
| Actors | one registry, one id space | | `ActorRegistry` learns the active realm: `all()` yields the player and the actors of the active realm only, so a blast in the sky at (50, 30, 40) never hurts a dungeon projection that stands at the same numbers (§17, risk 2) |
| Intentions in flight, particles | shared | shared | Cleared on every passage |
| Hand, items, stats, hearts, keys, bombs | the player's | | Carried across untouched |
| Event bus | one per run | | The sky laws install their hooks under the owner tag `sky` when the player enters and `bus.off(null, 'sky')` removes them on leaving |
| HUD | shared | | The place label, the boss bar (reused for a deity's hits), the minimap hidden in the sky |

### 2.3 Scene roots

`Doors`, `Pickups`, `Chests`, `Alembics`, `Kitchens`, `Enemies`, `Tablets` and `ChunkRenderer` take a `THREE.Scene` today and call `scene.add`. Their parameter type widens to `THREE.Object3D`; the game passes the realm's group. Changing worlds is then `dungeonRoot.visible = false; skyRoot.visible = true`. Particles, intentions, the debris view, cracks and hands stay on `this.scene`.

### 2.4 Passing between the worlds

| Passage | Trigger | Where the player lands |
|---|---|---|
| **Up from the crown** | The last star of the built tree's last constellation (its pad's `to` becomes `GATE_UP = -1` in `world/tree.ts`), or rising past the top of the dungeon world's sky (`b.y > SURFACE_Y + SKY_LIMIT − 1.5`, line 2558) | The sky realm's arrival deck, at the sky tree's foot door, floating (`Player.float`) |
| **Down by falling** | Falling off the arrival deck: `b.y < SKY_FLOOR_OUT` (realm y 4) | The dungeon world's crown platform, floating, like the carry from silence |
| **Within the realm** | Falling through a floor's way-up opening, or off Totality's lowest platforms | The floor below; falls never hurt (§4) |
| **Death** | Hearts run out anywhere | The death screen; the restart builds a new run (both sets disposed) |

The silence loop changes in one place: today the top of the sky returns you to silence once silence is known (lines 2557–2561). In the proposal **the top of the sky always opens into the sky realm**; silence still carries you up to heaven above the crown (lines 2541–2555), from where the last star opens the realm. The loop becomes silence → heaven → the sky. This needs the owner's yes (§19, question 3).

A passage is a **travel**, run by `RealmGate` (`src/sky/gate.ts`), the same shape as the restart fade:

```ts
export interface Travel { to: RealmKind; at: [number, number, number]; float: boolean }
export class RealmGate {
  /** Pure: which travel, if any, the player's position asks for this frame. Tested without three.js. */
  static check(realm: RealmKind, pos: Pos, pads: PadHit | null, sky: SkyBounds): Travel | null;
  start(t: Travel): void;      // fade out 0.45 s (RESTART_FADE)
  get busy(): boolean;         // the game freezes the world while busy (joins `transitioning`)
}
```

The sequence: fade out → `swapRealm` → clear intentions and particles → `intents.clear()` → install or remove the sky's bus hooks → `teleport` in the new world (it finds room to stand) → wait for `chunks.busy` to be false (at most `RESTART_HOLD_MAX`) → fade in → toast (`toast.skyEnter`, `toast.skyLeave`).

### 2.5 What a frame does in the sky

`simulate()` (line 2873) keeps its order. Steps that only make sense among rooms are skipped in the sky and replaced by one call:

```ts
const below = this.realm === 'dungeon';
...
if (below) this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));   // line 2898
...
if (below) { this.trackPlace(dt); this.updateLoop(dt); this.updateOmens(dt); this.updateCombat(dt); this.updateChallenges(dt); }
else this.sky!.update(dt);                                                               // lines 2913–2917
```

Everything else runs unchanged on the swapped fields: the player, touching blocks, firing, placing, throwing, bombs, loose cubes, elements, intentions, the empty projection system, blasts, the bus flush, pickups, particles and the views. `SkyRealm.update` runs, in this order: the gate check, regrowth, nests, the tower and outside-the-tree watch, hindrances, sky creatures, the updraft, and the HUD place label.

In `frame()` (line 2780): `stream()` (line 2826) becomes `below ? this.stream() : this.sky!.stream(eye)`; the fog and sky colour block (lines 2833–2853) becomes `below ? <today's code> : this.sky!.atmosphere(eye, this.fogColor, fog, this.stars)`.

### 2.6 The seams in `game.ts`

Every other line of the upper world lives in new modules. The seams, all small:

| # | Where (line) | Change | Package |
|---|---|---|---|
| 1 | imports (83) | `SkyRealm`, `RealmGate`, `VoxelSpace`, endgame modules | P2 |
| 2 | fields (204–302) | `world!: VoxelSpace`; `realm`, `stash`, `sky`, `gate`, `dungeonRoot` | P0, P2 |
| 3 | `begin()` (391–488) | `dungeonRoot` passed to the dungeon systems (414, 434, 444–449); dispose `sky` and the stash; `ActorRegistry.setRealm('dungeon')` | P2 |
| 4 | intention callback `enemyAt` (328) | `this.realm === 'sky' ? this.sky!.creatureAt(x, y, z, r) : this.enemies.at(...)` | P4 |
| 5 | `damageActor()` (855) | first line: `if (t.kind === 'sky') return this.sky!.touched(t, kind, source, intent)`; and the invulnerable rule for the Spiked Entity (§10.1) | P4, P11 |
| 6 | `intentTouch()` (1085) | first line: a sky actor goes to `this.sky!.intentTouch(id, polarity, warm)` | P4 |
| 7 | `intentHitsBlock()` (1520), positive branch | `if (this.sky?.positiveHitsBlock(hit)) return true;` (law 3.2, §4) | P3 |
| 8 | `teleport()` (2395) | `groundBand` only below; in the sky `this.sky!.placeAt(...)` | P2 |
| 9 | `updateLoop()` (2557–2572) | the top of the sky and the last star start a travel (§2.4); the Spiked Entity's update (§10) | P2, P11 |
| 10 | `simulate()` (2873–2917) | the branch of §2.5; the `land` hook marks the landing for the falls law | P2, P3 |
| 11 | `frame()` (2826, 2830, 2833–2853) | streaming, visible range and atmosphere by realm | P2 |
| 12 | `carve()` (544) | after `carveFloor`: the staircase when the meta flag is set (§10.2) | P12 |
| 13 | `get transitioning` (2955), `get debug` (2958) | `|| this.gate.busy`; realm, exceptions, cached chunks | P2 |
| 14 | `makeSkyHost()` (new, beside `enemyHost`, 904) | the whole `SkyHost` (§5.2), written once by P2 so later packages never edit it | P2 |

### 2.7 Determinism and randomness

The sky's structure is decided from forks, never from player state ([RNG.md](RNG.md)). New paths, all fresh forks (so no existing draw moves):

| Path | Class | Decides |
|---|---|---|
| `fork('sky', 'tree')` | Structure | The sky tree: the trunk's knots and windows, the halls' slabs, the arrival deck's cloud edge |
| `fork('sky', 'floor', n)` | Structure | Sky floor n (1–5): its layout within the guardian's B6 rules, its graph, nests, spawns, platform tags |
| `fork('sky', 'totality', stratum)` | Structure | One stratum's platform chain (0 lower, 1 mid, 2 upper) |
| `fork('sky', 'floor', n, 'creature', seq)` | Runtime | One sky creature's choices (which attack among the allowed, which column it climbs): seeded per creature, like parts |
| `stream('ai')` | Runtime | Already reserved for enemy decisions; unused by the sky |

Generators in `src/sky/world`, `src/sky/floors` and `src/sky/totality` use integer and RNG arithmetic only, never `fx` nor three.js (the existing tests that check `src/world` and `src/content` extend to these folders). The layout is a pure function of the root seed: **the same seed grows the same sky in any order of materialisation** (tested, §3.7). The staircase draws nothing (§10.2). `GEN_VERSION` goes to **24** with the first package that adds structure.

## 3. A formula world with exceptions

The approach of issue #11: the shape of the world is computed from a function; only what changes is stored; geometry is described as planes and runs, never as single cubes; memory stays flat as the world grows.

### 3.1 `VoxelSpace`: what both worlds offer

`VoxelWorld` is a concrete class whose `data` and `elem` arrays are read directly in a few places. The first package extracts the interface its consumers really use (`src/world/space.ts`) and makes `VoxelWorld` implement it:

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
  /** True when a chunk is all air with no element: the renderer never sends it (the sky is mostly air). */
  emptyChunk?(cx: number, cy: number, cz: number): boolean;
}
```

What changes in the consumers (the only places that reach inside the arrays):

| Consumer | Today | After |
|---|---|---|
| `world/elements.ts` | `w.data[i]`, `w.elem[i]` (lines 82, 119, 143–144) | `w.getAt(i)`, `w.elemAtIndex(i)` |
| `render/debris-view.ts` cracks (113–117) | `world.data[i]`, decodes `i` with `sx`, `sy` | `world.getAt(i)`, `world.coords(i)` |
| `render/chunks.ts` | `VoxelWorld`, all chunks of a loaded row | `VoxelSpace`; skips `emptyChunk` |
| `game.ts` | `world!: VoxelWorld` | `world!: VoxelSpace` (lab and kitchen maps keyed by `idx` stay dungeon-only) |
| `world/floor.ts`, `world/tree.ts`, `sandbox/scenario.ts` | write `w.data` directly | Unchanged: they only ever build the dungeon, and keep `VoxelWorld` |
| physics, intentions, loose cubes, flow fields | `solid` callbacks | Unchanged |

Two implementations behind one interface keep the calls polymorphic but not megamorphic; the hot paths (`solid` in collision and raycasts) already go through closures.

### 3.2 `SkyWorld`

```ts
// src/sky/world/sky-world.ts
export const SKY_SX = 256, SKY_SZ = 256;    // 16 × 16 chunks; the sky tree's axis at (128, 128)
export const SKY_SY = 1 << 16;              // a nominal height: 4096 chunk rows that cost nothing until touched

export class SkyWorld implements VoxelSpace {
  constructor(readonly layout: SkyLayout, opts?: { cacheChunks?: number });
  /** The formula alone, ignoring exceptions. */
  base(x: number, y: number, z: number): number;
  /** Exceptions (§3.4). */
  placedAt(i: number): boolean;
  setTransient(x: number, y: number, z: number, m: number, until: number, cause: TransientCause): boolean;
  setStory(x: number, y: number, z: number, m: number): void;   // a permanent change the game makes (a way-up gate opens)
  restore(i: number): void;                                       // back to the formula
  onBroken: ((i: number) => void) | null;                         // an original block went to air: regrowth listens
  knockTower(cells: readonly number[]): number[];                 // placed cells → air, returns them for the loose cubes
  stats(): SkyWorldStats;                                         // shapes, index entries, exceptions by kind, cached chunks, bytes
}
```

- **Height.** `SKY_SY` is a constant, not a budget: nothing is allocated per row. `idx` stays below 2^37, safe in a double, so `damaged: Map<number, number>` and every consumer that keys by index keep working. Raising it is changing one number.
- **The formula** is a `SkyLayout` (§3.3): an ordered list of shapes and a spatial index from chunk to the shapes that touch it. `base(x, y, z)` asks the shapes of that chunk, last one wins (so an air shape carves an opening into a slab).
- **Materialisation.** `get` reads a materialised chunk from an LRU cache (`ChunkCache`, cap 1024 chunks of 4 KB; the element layer is a second 4 KB buffer allocated only for chunks that hold an element). On a miss it rasterises the chunk's shapes into a fresh buffer (a shape fills its intersection with the chunk in one loop, never cell by cell through `base`), then applies the chunk's exceptions. Eviction drops the buffer; the exceptions are elsewhere, so nothing is lost.
- **`paddedChunk`** copies the cached chunk and reads its one-voxel border with `get` (neighbours in cache) or `base` (neighbours not in cache, without materialising them).
- **`emptyChunk`**: no shape in the index and no exception means all air: the renderer skips it and `get` answers AIR without allocating.
- **Prefetch.** `SkyRealm.stream(eye)` materialises the chunks within two of the player's chunk, at most 8 a frame, so physics never waits on a miss; a miss still works synchronously.

### 3.3 Shapes: planes and runs, never single cubes

```ts
// src/sky/world/shapes.ts
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
  readonly floors: readonly SkyFloorPlan[];            // §7
  readonly totality: TotalityPlan;                     // §8
  tagAt(x: number, y: number, z: number): number;     // which platform a cell belongs to (fading, holding), 0 none
}
export function buildLayout(shapes: Shape[]): Pick<SkyLayout, 'shapes' | 'index' | 'tagAt'>;
```

`tag` names a platform (a thin branch, a run segment, a Totality stone) so hindrances act on whole platforms and allies hold them. A blob's surface is a fixed `hash3` of the cell, like the cave ceiling: no randomness is drawn while materialising.

### 3.4 Exceptions

```ts
const enum Edit { Broken = 1, Placed = 2, Transient = 3, Story = 4 }
// edits: Map<idx, material | kind << 8>, and editsByChunk: Map<chunk, Set<idx>> to apply them on materialise
```

| Kind | Made by | Ends |
|---|---|---|
| `Broken` | `set(AIR)` over a cell whose formula is solid: an original block broke | Regrowth deletes it (§4); `onBroken` fires |
| `Placed` | `set(m)` over a cell whose formula is air: **the player placed a block** | Only a positive intention (law 3.2), or the tower knock (§5.3) |
| `Transient` | A hindrance: a cage cube, an opened hole, a fading platform, a current's water | Its timer (`until`); a min-heap in `SkyWorld` |
| `Story` | The game: a way-up gate opened when its deity is won | Never, in this run |

`set` decides the kind by itself: a block placed into formula air is the player's; nothing else in the sky places blocks without `setTransient` or `setStory`. **Setting a cell back to its formula value deletes the exception** (store only what differs). Transient writes refuse placed cells: hindrances never change a player block (shared terms 6.3).

### 3.5 Streaming and meshing

`SkyRealm.stream(eye)` sets the sky renderer's loaded rows: inside the tree, the current hall and the halls above and below; in Totality, from 48 below the eye to 96 above. Rows are 256 chunks wide, but `emptyChunk` drops almost all of them before a message reaches the worker. The mesher is the same (`meshChunk`, `meshElements`): the sky's materials are ordinary materials with ids appended after 27.

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
- Setting a cell to its formula value leaves no exception; breaking 500 original blocks and running regrowth past 6 s leaves `stats().edits.broken === 0`; placing 100 blocks leaves exactly 100 placed.
- **Memory stays flat:** walking a probe up 20 000 blocks with prefetch keeps `stats().cached ≤ cap` and the exception count unchanged; a layout with three times the Totality height has three times the shapes, not three times the bytes per block (`indexEntries / shapes` stays bounded).
- Generators emit runs, not cubes: on every sky floor `shapes < solidCells / 40`.
- `emptyChunk` is true for every chunk with no shape and no exception; `paddedChunk` of a chunk next to an evicted one matches a fully materialised copy.
- `VoxelWorld` and `SkyWorld` pass the same `VoxelSpace` contract suite (`tests/voxel-space.test.ts`, written in P0).

## 4. The sky laws as systems (`src/sky/laws/`)

Each law is one module, pure where it can be (a host interface for effects), tested without three.js.

| Law | Module | Mechanism | Test |
|---|---|---|---|
| 3.1 **Nothing stays broken** | `regrowth.ts` `Regrowth` | `SkyWorld.onBroken` queues the cell for `REGROW = 5` s. At `REGROW − 1` s the cell **shimmers** (`host.shimmer`: pale motes and a rising chime; the crack overlay shows the block's ghost). At 5 s it returns (`restore`) only if the cell is free: no player, sky creature or loose cube in it, no placed block; otherwise it waits and checks again every 0.25 s | breaks return at 5 s; a cell with the player in it waits; shimmer starts at 4 s |
| 3.2 **Player blocks are the exception** | `ownership.ts` | A `blockDamage` hook (cancel band, priority 150, owner `sky`) cancels damage to placed cells of any kind (intentions, bombs, contact, hindrances). Seam 7: a **positive** intention that hits a placed cell removes it for good (gold dust, no loose cube, provisional) | a bomb does nothing to placed blocks; a positive shot removes one; a negative one does not |
| 3.3 **Negative intentions do nothing to sky creatures** | `puff.ts` | Seams 5 and 6 route every touch on a sky actor to `SkyCreatures.touched`: a negative intention, a blast, a thrown cube or a weapon stroke goes out in a **small puff** (cloud motes, a soft "pff") and changes nothing. The first puff of a run shows `toast.skyPuff` once | a negative hit leaves hits, side and state unchanged and emits one puff |
| 3.4 **Each floor can be passed with nothing** | the floor tests (§7.4) | Each floor's graph has a route from the ground to the deity's reach using jumps and nest cubes only | per floor |
| 3.5 **Always straight up** | the floor tests | Each floor carries its vertical route (ledge strip, knots, tusk line, thorn tree, mast) in its plan; the tower rule never triggers on it (formula cells are not placed cells) | per floor |
| 3.6 **Every hindrance warns first** | `HindranceRunner` (§6) | No effect can start without its telegraph having run for its full length | runner test |
| 3.7 **Nothing dies** | `SkyCreatures` | Sky actors have no health that can reach zero; `alive` is always true; "leaving" hides and parks them | no path sets `alive = false` |
| 3.8 **The only way up is inside the tree** | `outside.ts` `OutsideWatch` | When the player stands on a placed tower (below) **outside the trunk's outer radius**, the guardian of the floor at that height (the panda below the first floor) comes out through the nearest trunk window and knocks it down with the tower routine, after its full warning. Which god comes is open; the guardian of that height is the provisional answer | a tower outside triggers the knock; inside it does not |
| 3.9 **A tower that reaches a deity is knocked down** | `tower.ts` `towerUnder(world, body): Tower \| null` | A tower is a contiguous stack of **3 or more placed cells** under the player's feet. When its top puts the player within 2 blocks of the deity's height, the deity framework runs the knock (§5.3). Formula cells never count, so a floor's own route never triggers it | stacks of 2 do not count; formula columns do not count |
| Shared 6.3 **Block nests** | `nests.ts` `Nest` | A nest is a hollow from the floor plan holding 3 loose cubes of the floor's material (spawned in the sky's `DebrisSystem`). A cube farther than 1.5 blocks from the nest's centre, or gone, counts as taken; each taken cube is replaced after 6 s with a soft pop | refills at 6 s; never more than 3 |
| **Falls never hurt** | `falls.ts` | There is no fall damage in the game, and the sky keeps it so for items too: seam 10 marks the frame's `land` emit, and an `actorDamage` hook (owner `sky`) cancels any damage to the player raised during it | an item that hurts on landing does nothing in the sky |
| **Fall recovery (Totality)** | `updraft.ts` `Updraft` | The last checkpoint platform the player stood on is remembered. Falling more than `CATCH = 20` blocks below it, an updraft of pale motes catches the player and carries them back to it in 1.6 s (input held, `Player.float` on, no harm) | a fall below the line ends on the checkpoint |

A knocked-down tower's blocks fall as **loose cubes** the player can gather again (sky open question 10, provisional): nothing in the sky is destroyed for good except by a positive intention.

## 5. Sky creatures

### 5.1 What is reused and what is new

The existing projection system (`entities/enemies.ts`) is built around rooms: every enemy belongs to a room, steers with a per-room 2D flow field, is leashed to its home cell and is resolved by the polarity rules (warmth, relapse, conversion, health). Sky creatures share none of that: they climb, hang, levitate and leap in 3D on a floor of open space, have no health, and turn only by counting positive hits. Forcing them into `Enemies` would bend its room assumptions in a dozen places. So:

| Reused | New |
|---|---|
| `Actor`, `ActorRegistry` (one id space; `ActorKind` gains `'sky'`) | `SkyActor`, `SkyCreatures` (`src/sky/creatures/system.ts`) |
| Cube models: `ModelPart[]` and `buildModel` from `entities/enemies.ts` (the plush body and the giant head are parts) | The deity state machine, the minion rules, gaits |
| `moveBody` (`physics/voxel-collide.ts`) for walking minions | Climbing, hanging, levitation, leaps (`src/sky/creatures/gaits.ts`) |
| Particles, `sfx`, the boss bar, `presenceCard` | `HitMarks` (gold marks on the body, `src/sky/render/hit-marks.ts`) |
| The telegraph art channels of `DECISIONS.md` §8.5 (named parts `tell`, `core`) | The floor graph for navigation (§5.6) |

Nothing in `combat/polarity.ts` changes: the sky never calls `resolveHit`.

### 5.2 Actors, the system and the host

```ts
// src/sky/creatures/types.ts
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

// src/sky/creatures/system.ts
export class SkyCreatures {
  constructor(root: THREE.Group, host: SkyHost);
  spawnDeity(def: DeityDef, plan: SkyFloorPlan): SkyActor;
  spawnMinion(def: MinionDef, at: Place): SkyActor;
  at(x: number, y: number, z: number, r: number): number;            // for intentions (seam 4)
  intentTouch(id: number, polarity: Polarity, p: Vec3): void;          // seam 6
  touched(a: Actor, kind: DamageKind, source: string, intent?: { polarity: Polarity }): boolean; // seam 5: puff unless positive
  update(dt: number, floor: number): void;                             // only the creatures of the player's floor move
  dispose(): void;
}
```

Hostile minions never attack through the projection contact pipeline: their pushes, hugs and kicks are hindrance effects (§6). A wild sky actor is `neutral`, so friendly-fire rules and `hostile()` never apply to it; turning it sets `self` directly (not through `setFaction`, which refuses neutral actors) and emits `factionChange` with source `sky`.

`SkyHost` is the only door from `src/sky/` into the game, written once in `game.ts` (`makeSkyHost`, seam 14):

```ts
export interface SkyHost {
  time(): number;
  player(): { body: Body; eye: Vec3; aim: Vec3; hand: readonly Carried[]; push(vx: number, vy: number, vz: number): void;
              slow(f: number, s: number): void; freeze(s: number): void; carry(to: Vec3, s: number): void };
  world(): SkyWorld;
  debris(): DebrisSystem;
  fork(...path: (string | number)[]): Rng;
  damagePlayer(points: number, source: `sky:${string}`): void;          // deity attacks only (harm 2, provisional)
  fx(kind: SkyFx, x: number, y: number, z: number, n?: number): void;    // puff, shimmer, hit mark, telegraph motes
  cue(kind: SkyCue, x: number, y: number, z: number): void;              // §13
  toast(key: MessageKey, params?: Params): void;
  card(name: MessageKey, lines: readonly MessageKey[]): void;
  bar(b: { name: string; ratio: number } | null): void;                   // the boss bar shows a deity's hits in gold
  place(key: MessageKey): void;                                           // the HUD's place label
  gift(itemId: string, x: number, y: number, z: number): void;            // a pickup in the sky's Pickups
  travel(t: Travel): void;
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
  teleport: boolean;                              // which deity: open (§19); provisional true for the koala and the horse
  guard?(d: SkyActor, ctx: DeityCtx): boolean;    // koala Clinging, elephant's rim (counts only hits in line)
  attacks: readonly AttackDef[];                  // each with its first stage and its hindrance
  states?: readonly CustomState[];                // Napping, Asleep/Stirring, Listening, Basking/Pacing, Grazing/Sending/Leaping away
  rules?: readonly DeityRule[];                   // the rest beat, Memory, facing the roar, gentling
  ally: AllyAtDeity;                              // what an ally does at the deity: sit, hug, trumpet from below, rub, graze; its timer and cap
  knock: 'nudge' | 'hug' | 'sweep' | 'paw' | 'kick';
  won: WonOutcome;                                // §5.3 defeat
  model: DeityModel;                              // §11
}
export const TELEGRAPH = [1.4, 1.2, 1.1, 1.0, 0.9] as const;
export const MIN_TELEGRAPH = 0.8;
```

- **The machine.** `Idle → Watching → Attacking → Recovering → Watching` (or `Idle` out of sight), with `Hurt` (0.3 s, never cancels a shown telegraph) and `Rallying` (2 s, once at each stage change). Custom states replace or extend the core ones by name (the koala's `Asleep` replaces `Idle` once; the elephant's `Drinking` is its `Recovering`). A state is a record `{ enter, tick, exit, next }`; the table is data, so a deity file reads like its B2 section.
- **Attacks.** An `AttackDef` is `{ id, stage, telegraph: TelegraphSpec, act(ctx) }`: the telegraph is shown for the floor's length (never below `MIN_TELEGRAPH`), then `act` runs a hindrance or a lob/ring. No attack repeats back to back when another is available.
- **Positive hits.** A positive intention that touches the body or head while `guard` is false adds one hit (the horse's Gentled counts two). Each hit leaves a **gold mark** where it landed (`HitMarks`: an instanced mesh of tiny light quads in the deity's local frame, at most `hits` of them), plays `Hurt` and the animal's own sign of progress (lids opening, grip loosening, ears hanging, mane softening, eyes softening: a per-animal `progress(d, ratio)`). The boss bar shows `hits / target` in gold.
- **Stages** at a third and two thirds of the target: `stage = min(2, ⌊3·hits / target⌋)`; the change runs `Rallying` and unlocks the stage's attacks.
- **Levitation.** A levitating deity floats `hover` blocks over its seat with a slow bob (±0.15, 0.5 Hz) and its drift; its box ignores gravity. The horse uses a ground gait and its great leap (a ballistic arc of up to 20 across and 8 up, landing on a paddock or open ground, never on the player).
- **Teleport far.** A warning of one telegraph, then the deity reappears at the place of its plan farthest from the player, never within 12 blocks.
- **The tower knock.** On `towerUnder` reaching its height (or the outside watch), the deity shows a 2 s warning (the stack shakes, a warm outline runs down it, a rising grumble), leaves its seat, knocks the stack from the top down (`SkyWorld.knockTower` → loose cubes), pushes the player 2 blocks off it, then returns and is `Recovering`. While it is away it can be hit as usual.
- **Defeat.** At the target the deity is **won**: it plays its outcome (provisional, from each document's section 6: the panda settles on its seat awake and friendly; the koala lets go of its branch; the elephant sets its weight down and the channels drain; the lion's pride lies down; the horse stops leaping and the wind stops), becomes an **ally** (`side: 'ally'`, owner clarification on issue #24), its minions follow their deity (wild ones change attitude, allies stay), and the floor's **way-up gate** opens (§7.2). The horse also gives its gift (§9).

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
- **Rules** are small functions that read the floor graph and the player and either act or pass; the first that acts wins the tick. A rule that hinders the player starts a hindrance with its own telegraph (a tucked panda, a swinging koala, a crouching lion, gathered hind legs).
- **Turning.** Each positive hit plays the animal's soft reaction (sit and munch, blink, flap ears slowly, lower the head, slow and turn an ear). At `hitsToTurn` the minion becomes an ally with a small happy motion. A negative touch is a puff (law 3.3); an ally never turns back (minions open question 4, provisional).
- **Ally helps** are the four shared forms: **hold** (`ctx.protect(cells, owner)` marks platform cells that no hindrance may change while the ally stays: a sitting panda, a hanging koala, a damming elephant, a lion's back as a step, a horse under a segment), **clear** (act on a wild minion: roll it down, curl it asleep, take its push, roar it down, turn it away), **carry** (the elephant's lift of one terrace, the horse's ride of 8 blocks; both through `host.player().carry`, never doing the player's jump for them) and **help** (go to the deity and add hits on a timer with the floor's cap; on the horse's floor it brings calm instead).
- **Stuck guard.** A minion that has not reached its graph target in 6 s walks back to the nearest graph node; if that fails it fades out and back in at its spawn, with its warning (nothing dies, nothing is left stuck).

### 5.5 One module per animal

| Animal | Deity file | Minion file | What is its own |
|---|---|---|---|
| Panda | `src/sky/creatures/deities/panda.ts` | `minions/panda.ts` | Napping at two thirds; the rest beat (stillness delays the next attack); bamboo stumps that are steps |
| Koala | `deities/koala.ts` | `minions/koala.ts` | Asleep/Stirring; the Clinging guard (an ally's hug lifts it); teleport to a far thick branch |
| Elephant | `deities/elephant.ts` | `minions/elephant.ts` | The rim guard (hits count only in line over the rim, or on the head while the trunk is raised); Memory (aims where the player stood longest in 10 s); the herd in file |
| Lion | `deities/lion.ts` | `minions/lion.ts` | Pacing in the air; facing the roar halves its ring; holders and stalkers; the stalk that stops when watched |
| Horse | `deities/horse.ts` | `minions/horse.ts` | Walks and leaps (no levitation); Sending; Gentled (a still player, hits count two); startle; teleport when startled; the gift |

Each file holds data and small functions only; no file reaches the game except through its context.

### 5.6 The floor graph

Sky creatures do not path-find through voxels. Each floor plan carries a **graph of places** its generator already knows (`src/sky/floors/graph.ts`):

```ts
export interface Place { id: number; kind: PlaceKind; x: number; y: number; z: number; w: number; d: number; tag: number }
export type PlaceKind = 'ground' | 'top' | 'ledge' | 'branch' | 'thick' | 'segment' | 'terrace' | 'bed' | 'bank' | 'paddock' | 'seat' | 'nest' | 'spawn' | 'route' | 'gate';
export interface Link { a: number; b: number; move: 'walk' | 'step' | 'jump' | 'drop' | 'climb' | 'build' }
export interface FloorGraph { places: Place[]; links: Link[] }
```

Minions choose places (the column top nearest the player and above them, the branch over the player's path, the channel's foot) and move along links with their gait. The same graph drives the floor tests (§7.4). Blocks the player places do not enter the graph; gaits still collide with them.

## 6. The eight hindrances (`src/sky/hindrances/`)

Every hindrance is a module with the same three parts: a **telegraph**, an **effect** and a **positive answer**.

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
  positiveHit(hit: PositiveHit): boolean;    // offered every positive intention that ends in the sky (seam 7 and the creature touch)
}
```

Effects touch the world and the player only through `SkyEffects` (`effects.ts`), which enforces the shared rules: **never a placed block**, never a cell a holding ally protects, never a fatal drop without its warning, and everything ends.

| Hindrance | Module | Effect, built from | Positive answer (provisional, from the abilities table) | Used by |
|---|---|---|---|---|
| Knockback | `knockback.ts` | An impulse on the player's body along the shown arc; a solid block between the source and the player stops it (a raycast) | A positive shot on the source's tell softens it to a push of × 0.4 | panda (yawn, roll), elephant, lion (pounce), horse |
| Dense ground | `dense-ground.ts` | A set of cells marked dense (a decal of glassy quads, no block change); walking on them sets `slow(0.5)` | A positive shot at a dense cell returns it at once | panda |
| Water currents | `water-currents.ts` | Transient water (`setTransient` element cells) down a channel bed from its head to the first solid cell; feet in it get a push along the bed; a placed block (a dam) stops the stretch below | A positive shot at the channel head stops it for 3 s | elephant |
| Paralysis | `paralysis.ts` | A ring that grows at a set speed; a grounded player it passes is frozen 1–1.5 s (`freeze`: no walking, aiming and shooting allowed) | Holding the aim on the source during the telegraph halves the ring; a positive shot on it shortens the freeze | lion |
| Cube cage | `cube-cage.ts` | Outlines one by one, then transient cubes round the player's cell; never closed over a drop; dissolve after a few seconds; any shot breaks a cube (no loose cube) | A positive shot breaks a cube at once | koala |
| Wind | `wind.ts` | A gust volume (a capsule along a line) that pushes the player while in it; a block in the line shelters (a raycast from the source) | A positive shot on the source (the tail) ends the gust | koala, lion, horse |
| Opening holes | `opening-holes.ts` | Chosen original cells crack (the crack overlay through `damaged`), then become transient air for 4 s (no loose cube), then return | A positive shot at a cracked cell closes it before it opens | panda |
| Fading platforms | `fading-platforms.ts` | A whole platform (`tag`) or chosen parts turn to a grey mist material (a transient swap: edges grey, flicker, a speeding tick), then transient air, then return with a chime; held cells never fade | A positive shot holds it for 2 s | koala (thin branches), horse (run segments; the floor's rhythm from stage two) |

The player's body needs three small additions (`entities/player.ts`): an external push (`push(vx, vy, vz)`, added after the walk blend), `frozenT` (move input ignored, look and shoot kept) and the carry (input held while `carry` lerps the body). `slowT` already exists. A test per hindrance checks: no effect before its full telegraph, a placed block is never changed, the effect ends, and the positive answer works.

## 7. The sky tree and the five floors

### 7.1 The stack

The sky tree is a trunk that **widens as it rises**, a crown carrying its floors, on its own axis at (128, 128). Every floor is a hall inside the trunk (wall 3 thick, knot windows at eye height), separated by a slab three blocks thick with one **way-up gate**. Heights (realm y; hall radius = the floor's B6 radius + 3; hall height = the B6 height + 4 of headroom):

| Floor | Guardian | B6 radius, height | Hall ground | Hall top | Way up (the floor's vertical route ends under it) |
|---|---|---|---|---|---|
| Deck | — | radius 48 of cloud | 32 | — | the trunk's foot door |
| 1 | Panda | 20, 28 | 36 | 67 | over the Bamboo Seat's ledge strip |
| 2 | Koala | 22, 32 | 71 | 106 | over a trunk's knots |
| 3 | Elephant | 24, 34 | 110 | 147 | over the tusk line |
| 4 | Lion | 26, 36 | 151 | 190 | over the thorn tree |
| 5 | Horse | 30, 12 (paddocks), mast to the gate | 194 | 217 | at the top of the mast |
| Totality | — | open space | 221 (the crown) | ~980 (the Sun threshold) | — |

`src/sky/floors/tree.ts` builds the trunk, the deck, the slabs and the gates as shapes, and calls each floor's generator with its origin. Its plan names the trunk's outer radius per height (the outside watch reads it).

### 7.2 Floor generators

```ts
// src/sky/floors/types.ts
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
| Panda | `src/sky/floors/panda.ts` | The Bamboo Seat (3 × 3, top at 24) in the centre; 12–16 columns of 2 × 2, tops 3–20; the gentle path (steps of 1, gaps 1–2); the building path (steps of 2) with nests at its foot; soft stairs on half the columns; the ledge strip on one face of the seat; nests at 0, 8, 16; the two bamboo clumps |
| Koala | `koala.ts` | Four 2 × 2 trunks at 14 from the centre; the branch spiral (1 wide, 4–6 long, +2 each); gaps of 2 level or 3 with a drop of 1, never more without a thick branch; every third branch thick and fixed; the central gap (radius 8) over moss; knots on every trunk; the Fork at 30 on four limbs; nests on the lower thick branches; three sleeping clusters |
| Elephant | `elephant.ts` | Five rings: the ground with the waterhole (radius 6, 3 deep, a template element), terraces at 6, 12, 18, 24 (4 wide, walls 6 high); the Basin's mesa at 30 with its 2-high rim; four switch-back channel beds (1 wide, steps of 1) between banks 2 high with a cut every 6; the dry tusk line; a nest by each channel head |
| Lion | `lion.ts` | An open plain; 12–16 flat rocks (3 × 3 to 6 × 6) from 4 to 30, neighbours 1–3 apart; gaps of 2, 3 with a drop, or 4–5 on the nerve line; the long route; the Sunning Ledge (6 × 6 at 34); the thorn tree's spiral steps; six nests before the 4–5 gaps; two shade rocks |
| Horse | `horse.ts` | A meadow of radius 30; six fenced paddocks (5 × 5, heights 0–12, 12–20 apart); runs of segments (3 × 2, +1 every two, gaps 1–2); every fourth segment fixed with a hitching post; the central mast with rungs to the gate, its fixed spoke to the nearest paddock; four nests on fixed segments; the paddock gate |

The way-up gate is a membrane of living sky wood across the slab's opening. Owner decision 4 and the design leave open whether the way up waits for the deity; the proposal is that **the gate opens when the floor's deity is won** (`setStory` to air, with a slow opening and a chime), because the horse's gift must come before Totality (§19, question 4). Falling down through an open gate lands on the floor below.

### 7.3 What every generator guarantees

- Everything is shapes; no generator writes a single cube in a loop.
- No platform cell is inside another floor's band (`y0..y1` of its hall); the slab between halls stays whole except the gate.
- The vertical route and the gentle route are formula cells, so the tower rule and fading never touch them, and they never pass through a cell a hindrance may open (a hole never opens on the route; a route segment never fades).
- Nests sit on fixed places, never on a platform that fades.

### 7.4 Floor tests (`tests/sky-floors.test.ts`)

For 50 seeds and every floor: the layout respects its B6 numbers (sizes, heights, gap widths read from the graph); **with nothing** (jump 1.26, running gap 2.7, coyote 0.1) there is a route from the ground to within shot reach of the seat using only `walk | step | jump | drop | climb` links, plus `build` links that need at most the cubes of the nests on the way; the vertical route is contiguous to the gate; no cell of the route is fadable or openable; the hall stays inside its band; the plan is the same in any order of generation; minion spawns and nests are on fixed places.

## 8. Totality (`src/sky/totality/`)

- **Strata.** `strata.ts` sets three bands above the crown: **lower** (221–420, the thinned exosphere: petrified leaf clusters, starlight resin, boundary stones), **mid** (420–700, the void: crystalline meteor fragments and solid star-matter, the Earth below as a sphere), **upper** (700–980, the solar approach: incandescent glass and embers, the corona filling the upper sky). Platforms are 3 × 3 and 2 × 2 low, 2 × 2 in the void, 2 × 2 narrowing to 1 × 1 near the summit.
- **The reach envelope.** `reach.ts` computes, from the jump's own constants, how far the 1× → 2× → 8× sequence carries for a rise `dy`: `reach(dy)` (all three jumps) and `reach2(dy)` (the first two only). The constants move from `entities/player.ts` into a pure `physics/jump.ts` (walk 4.6, gravity 28, jump velocity 8.4, air control 0.35, the ladder) so the generator and the player use the same numbers. With base stats the full sequence rises about 13.9 blocks and, at the same height, crosses about 11–12 blocks (versus 2.7 for a plain jump).
- **The chain.** `chain.ts` walks a spiral up from the crown: each next platform rises 4–10 and stands within 85% of `reach(dy)`; at least 60% of the hops need the third jump (farther than `reach2`); every sixth platform is a **checkpoint** (3 × 3, with a soft beacon) where the updraft returns the player (§4). The spiral stays within radius 100 of the axis. About 60 hops in all (about ten minutes of climbing).
- **The Sun threshold.** The last checkpoint stands before a ring of solar glass and a **sealed gate of light** (an unbreakable material, `sun-seal`). Touching it shows `toast.sunClosed` ("The Sun is not open yet.") and a soft push back; nothing opens. Unity is issue #95.
- **Building.** The player may place what the hand carries; there are no nests in Totality, so the gaps are the triple jump's (Totality open question 2, provisional). A tower of 3 or more placed blocks is knocked down by a gust of solar wind after the full warning (the tower routine with the Sun as its source).
- **Tests** (`tests/totality.test.ts`): every hop within the envelope with its margin; the share of third-jump hops; checkpoints every six; the plan inside the world's bounds; the same plan in any order; the threshold sealed and unbreakable.

## 9. The Triple Jump

**Physics** (`entities/player.ts`, `physics/jump.ts`). A new stat **`airJumps`** (base 0, limits [0, 4], `stat.airJumps` in every catalog) counts the jumps the player may make in the air. The heights follow the **ladder** `[1, 2, 8]` (jump 1 on the ground, jump 2 at twice the height, jump 3 at eight times): the k-th jump's velocity is `JUMP_V · √(stats.jump · LADDER[k])`. In the air a press of `jump` spends one air jump when the coyote time has run out, the player is not swimming, and there is no ground within 0.6 blocks below (so a press just before landing stays a ground jump, kept by the buffer). Landing refills them. The third jump also raises air control from 0.35 to 1 (horizontal momentum: MOVEMENT-ABILITIES open question 2; the provisional answer keeps the walk's speed, no boost, and lets the player steer). With practices that raise `jump`, the third jump's apex is capped at 16 blocks.

**Events.** `jump` gains `air: number` (0 on the ground, then 1 and 2), so items can react to air jumps; the synergy matrix gets the sample payload.

**The item** (`src/content/items/triple-jump.ts`, sotano-items): a sky gift, not a practice of the basement. `PoolName` gains **`'sky'`**, a pool nothing draws from at random; the validator accepts it as the item's only pool. Stats: `airJumps +2`. Name: "Triple Jump" until the owner names it (MOVEMENT-ABILITIES open question 1; §19). It is given by the won horse: `host.gift('triple-jump', …)` puts it as a floating pickup on the horse's paddock, and touching it gives the usual banner.

**Controls** (sotano-controls). No new action: the air jump is a new meaning of `jump` in the air, which is how the three references do it (a second press of the jump button). Keyboard Space, gamepad A, touch the jump button: already bound. The work is the words: `controls.jump` mentions the air jumps once the item is held, the pause card's row, and the input documents ([input/README.md](input/README.md), KEYBOARD, GAMEPAD, TOUCH). `tests/controls.test.ts` stays green with no change to `BINDINGS`.

## 10. The endgame at the bottom

### 10.1 The Spiked Entity (`src/content/endgame/spiked-entity.ts`, `src/endgame/encounter.ts`)

- **Where.** In the chamber of silence under floor 9 (`FloorResult.silence`), the lowest place in the world, low and wide to fit its four-block height: it broods at the chamber's far end from the shaft. (The alternative, the boss room of floor 9 after the Shadow, is §19, question 2.)
- **What it is in code.** A being in the projection system (it lives in the dungeon world among rooms), `kind: 'creature'`, faction `neutral` (it never seals, never attacks), a still behaviour, and the tag `INVULNERABLE`. Seam 5 handles the tag before any damage: every intention, blast and cube **bounces** (a dull "tink", cold motes, a brief shimmer on the spikes) and nothing changes. It is spawned when floor 9 is carved, from no fork (a fixed place in the chamber).
- **The revelation.** `Encounter.update` (called from `updateLoop`, seam 9): within 5 blocks, once per run, the entity turns toward the player and `presenceCard('endgame.entity.name', ['endgame.entity.line1', 'endgame.entity.line2'])` shows the owner's line ("The true path was not to reach this place; the true path is to go upward. All this time you were mistaken: you were meant to climb upward."). When the card is dismissed (or after 6 s) the ground rumbles, `toast.stairOpens` shows, the staircase is carved (§10.2) and the meta flag is saved (§10.3). Standing still in silence still carries the player up to heaven.

### 10.2 The staircase (`src/world/staircase.ts`, pure)

A **stairwell in the world's margin**, the solid rock that surrounds every floor (`MARGIN = 6`), at the north-west corner (x 1–5, z 1–5): a one-wide spiral round a 3 × 3 core of living wood inside a 5 × 5 well. Its 16 cells per turn rise one block each, so **one turn is one band** (`BAND = 16`): every floor's landing is at the same corner of the well, with 15 blocks of air over every step.

```ts
export interface StairLanding { floor: number; room: number; side: 'n' | 's' | 'e' | 'w'; tunnel: [number, number, number][] }
export function stairRoute(f: FloorResult): StairLanding;                    // no randomness: the plan decides
export function carveStair(w: VoxelWorld, floors: readonly FloorResult[], from: number, to: 'surface'): StairCarve;
export interface StairCarve { cells: number; next(budget: number): boolean } // carved a few hundred cells a frame, under the rumble
```

- **Landings.** On each floor a tunnel (2 wide, 3 high, at the floor's level) runs from the well along the margin, then straight in through cells the plan leaves empty and no room has claimed (`FloorResult.space`), to the nearest room's wall on a side that has **no door**. It opens there as a door-shaped gap. That is always safe: the room validator keeps three walkable tiles in front of every door position on every side, because any room may get a door on any side (sotano-levels §4). The tunnel stays inside the floor's band; outside the well's footprint the three layers of rock between bands stay whole.
- **Bottom and top.** From the silence chamber a tunnel at y 1–3 runs under floor 9 (its slab and two layers of rock above it untouched) to the well's foot. At the top the well opens onto the grass at the corner of the surface.
- **When.** At the revelation the whole staircase is carved, from the chamber to the surface. In every later run, if the meta flag is set, `carve()` (seam 12) carves the first floor's flight right after the floor itself: from the start floor's landing to the surface.
- **Determinism.** The staircase draws nothing and is carved after everything else on its floor, so no other draw moves. It depends on the meta flag, which is an input of the run like the seed; RNG.md gets a note that a seed shared between a player with the unlock and one without differs only by the staircase.
- **Tests** (`tests/staircase.test.ts`, 300 seeds): every floor finds a landing; a walk check climbs from the chamber to the grass through every landing (steps of one, headroom of two); no door approach, centre, `P`, `H` or shaft cell is touched; the rock between bands is whole outside the well and the tunnels; the fixed roots plan has its landing.

### 10.3 Meta-progression (`src/game/meta.ts`)

```ts
export interface MetaState { v: 1; staircase: boolean; metAt?: number }
export interface MetaStore { read(): string | null; write(s: string): void }
export const browserStore: MetaStore;                 // localStorage 'the-roots.meta', try/catch like i18n/dom.ts
export function loadMeta(store?: MetaStore): MetaState;   // a missing, broken or newer record reads as the default
export function saveMeta(s: MetaState, store?: MetaStore): void;
```

The second thing the browser keeps, after the language. Private mode, blocked storage or cleared data simply read as no unlock. `tests/meta.test.ts` uses a memory store: round trip, broken JSON, unknown version, the default. The console gets `S.meta.reset()`; a menu option to forget is the owner's call (§19).

### 10.4 "Floor 1"

The owner's text says the staircase appears on Floor 1 in every later run. In the code the run starts on floor 0, the roots, and floor 1 is limbo, below it. The proposal reads "Floor 1" as **the first floor of the run, the roots**, because that is where the shortcut means something ("without needing to clear the descent first"). This is §19, question 1; the code takes the floor from one constant (`STAIR_START_FLOOR`).

## 11. Art and visuals (sotano-art)

Every element below is drawn by the art agent and passes the gate (captures in `?gallery`, greyscale, the three colour-blindness filters, at distance) and the meaning test; the ledger records the rulings.

- **Sky creatures are not projections.** No cold husk, no family eye, no cold tokens (cold is reserved for projections). They are **plush**: a small round soft body of whole-texel boxes in low-contrast felt tones, under a **giant head** about 2.2 times the body's width, the animal readable from its silhouette first. A deity stands about 3 blocks tall, a minion about one. New token families `plush.<animal>.*` in `content/palette.ts`. Telegraphs use the animal's own parts (lids, ears, mane, trunk, hind legs) as the `tell`, on the three channels of `DECISIONS.md` §8.5, at the floor's length.
- **Gold marks** are the player's light (gold is the light and repair): small quads of `light.gold` that stay where each positive hit landed until the body is covered.
- **The puff** is a pale cloud of `bone`/`sky` motes, never gold: it must read as "nothing happened".
- **Sky materials** (ids after 27, tough like brick so breaking feels the same): cloud, sky wood (the trunk), sky leaf, bamboo, moss, pale stone (terraces, rocks), fence wood, mist (fading), star resin, meteor glass, solar glass, sun seal. The shimmer of a returning block and the grey of a fading one are effects, not extra materials, except mist.
- **The sky palette**: the deck in day sky (`sky.day`, `sky.horizon`); inside the halls the light of the knot windows; Totality's strata as fog and clear colour by height (pale blue → cyan and violet → black with stars, a nebula band and the Earth below → gold wash). `src/sky/atmosphere.ts` holds the table (pure); `src/sky/render/` the Earth sphere, the nebula band and the Sun (a billboard and a corona that fills the upper hemisphere).
- **One ruling for the ledger.** Art pillar 2 says warm light that is not the player's hurts. The Sun is warm light and not the player's. The proposal is a stated exception in the ledger: the Sun is the source the player's light comes from (Unity), so its warmth is the one warmth that is not a threat; it never lights the blocks (no warm bake), it only washes the sky (§19, question 8).
- **The Spiked Entity**: dark, low and wide, countless spikes as stepped thin boxes, immovable; a faint cold rim so it reads in the dark of silence (it belongs to the depths); the spikes catch the player's light when the bounce shimmers.
- **Gallery** sections: `?gallery=deities`, `minions`, `sky-blocks`, `totality`, `entity`.

## 12. Text in every language (sotano-i18n)

Every word exists in English and Spanish in the same change. To let packages work in parallel without editing one big catalog, P2 adds **catalog parts**: `src/i18n/locales/sky/<part>.en.ts` and `<part>.es.ts` for `core`, `panda`, `koala`, `elephant`, `lion`, `horse`, `totality` and `endgame`, spread into `en.ts` and `es.ts` once (the `as const` objects keep `MessageKey` inference). Each package edits only its part.

| Part | Keys (examples) |
|---|---|
| `core` | `level.sky`, `level.skyDeck`, `toast.skyEnter`, `toast.skyLeave`, `toast.skyPuff`, `toast.gateOpens`, `toast.towerDown`, `sky.won` |
| per animal | `sky.<animal>.name` (deity), `sky.<animal>.minion`, `level.sky<n>` (the floor's name on the HUD), its outcome toast |
| `totality` | `level.totality.lower`, `.mid`, `.upper`, `toast.sunClosed`, `toast.updraft` |
| `endgame` | `endgame.entity.name`, `endgame.entity.line1`, `.line2`, `toast.stairOpens`, `content.enemies.spiked-entity` |
| item and stat | `content.items.triple-jump` (name, description, effect with its numbers 1, 2, 8), `stat.airJumps` |

The revelation is the owner's own sentence: the Spanish should be the owner's own words too (§19, question 6). The debug readout and the `S` console stay English.

## 13. Audio (`src/audio/sky.ts`)

Synthesised like the rest (`audio/sfx.ts`), through `host.cue`: the puff (a soft breath), the shimmer and the regrowth chime, a positive hit on a deity (a soft gold tick that rises in pitch with the count), a minion turning (a small happy call per animal), each telegraph's sound from its document (the grumble, the whump, the squeak, the rumble, the whistle, the speeding tick, the roar), the gate opening, the updraft, the Sun's low hum near the threshold and the sealed gate's refusal, the Spiked Entity's drone and the rising chord when the staircase opens. A sky ambience: wind and far birds on the deck, wood creak in the halls, near-silence in the void, the hum in the upper stratum. Master volume stays as today outside silence.

## 14. Documentation (sotano-docs, sotano-design)

- This page, indexed in [README.md](README.md); after the review, `docs/reviews/sky.md` and its line in `docs/reviews/README.md`.
- When a package ships, its design text **moves** from `not-built/` to `built/`, split where only part is built: a new `docs/design/built/sky/` (README with the laws, `guardians/` with the five documents, `minions/`, `abilities/`), `built/levels/TOTALITY.md` (the threshold part only; Unity stays not built), the encounter and staircase out of `not-built/story/ENDGAME.md` and `not-built/levels/ENDING-AND-RETURN.md` (the rematch stays), the unlock out of `META-PROGRESSION.md`, the triple jump out of `MOVEMENT-ABILITIES.md` into `built/player/`. Provisional answers are marked "provisional" there.
- Changed built text: `built/levels/floors/SILENCE.md` (the loop now opens into the sky), `built/levels/giant-tree/STARS.md` (the last star opens the realm).
- Architecture: OVERVIEW (module map: `src/sky/`, `src/endgame/`; frame order with the sky branch), RNG (§2.7 paths, `GEN_VERSION` 24, the staircase note), LEVELS (§13: the sky realm and the staircase), ENTITIES (sky creatures beside projections), ACTORS (`'sky'` actors, the realm filter), ITEMS (`airJumps`, `jump.air`, the `sky` pool), input (the air jump), LOCALIZATION (catalog parts), SANDBOX (sky scenarios).
- Root README: what you can do, the roadmap line.

## 15. Debug and test access

- **URL:** `?sky` (the deck), `?sky=1`…`5` (a floor, standing at its foot), `?sky=6` (Totality's crown), `?sky=6&stratum=2` (the upper stratum's first checkpoint), `&won=1,2` (those deities already won, their gates open), `&jump3` (the triple jump held). `main.ts` reads them after `new Game` and calls `game.debugSky(...)`.
- **Console** (`S.sky`): `go(n)`, `win()` (the current deity), `hits(n)`, `ally()` (the nearest minion), `hindrance(id)` (start one at the player), `stats()` (shapes, index entries, exceptions by kind, cached chunks), `layout()`; `S.meta.reset()`, `S.endgame.meet()` (the revelation now). The F3 readout adds the realm, exceptions and cached chunks.
- **Sandbox and lab:** a scenario may say `"sky": { "floor": 1, "at": [x, y, z], "won": [] }` instead of a room; the lab runs it at the fixed step and its report adds sky lines (exceptions by kind, hits, sides, active hindrances). Scenarios `sky-laws` (break, regrow, place, puff, positive removal), `sky-tower` and one per hindrance guard against regressions.
- **Gallery:** §11.

## 16. Work packages

Tiers: **opus** for design, art, construction and systems; **haiku** for small mechanical tasks. Every package runs `npm run typecheck && npm test`, follows the skills its subject names, and writes its own documentation (moves included) except where P16 is named. Packages in the same wave own disjoint files and may run in parallel; arrows are hard dependencies.

| Id | Tier | Goal | Owns (new) | Edits | Depends on | Tests it adds |
|---|---|---|---|---|---|---|
| **P0** voxel-space | opus | Extract `VoxelSpace`; consumers read through it | `src/world/space.ts` | `world/world.ts`, `world/elements.ts`, `render/debris-view.ts`, `render/chunks.ts`, `game.ts` (field type) | — | `voxel-space.test.ts` (the contract suite, on `VoxelWorld`) |
| **P1** sky-world | opus | The formula world with exceptions, cache, index, stats | `src/sky/world/{shapes,layout,sky-world,cache}.ts` | — | P0 | `sky-world.test.ts` (§3.7); the contract suite on `SkyWorld` |
| **P10a** sky-palette | opus (art agent) | Sky materials (ids after 27), atlas tiles, palette tokens (plush families, strata), ledger entries | — | `content/materials.ts`, `content/palette.ts`, `content/tiles.ts`, `render/atlas.ts`, `docs/art/DECISIONS.md` | P1 | `art.test.ts` ratchet updated |
| **P2** realm | opus | Realm sets, scene roots, the gate and travel, the sky branch of the frame, `SkyRealm` shell with system slots, `SkyHost`, the atmosphere table, catalog parts, `?sky` | `src/sky/{realm,gate,sky-realm,systems,atmosphere}.ts`, `src/sky/render/atmosphere-view.ts`, `src/i18n/locales/sky/*.ts` (all parts, `core` filled), `tests/realm-gate.test.ts` | `game.ts` (seams 1–3, 8–11, 13, 14), `entities/{doors,pickups,chests,alembics,kitchens,enemies,actors}.ts`, `render/tablets.ts`, `world/tree.ts` (last pad), `i18n/locales/{en,es}.ts` (spreads), `main.ts`, `game/hud.ts` (place label) | P1, P10a | gate checks (both ways, the last star, the deck edge, death), realm filter of `ActorRegistry` |
| **P3** sky-laws | opus | Regrowth, ownership, puff hook point, tower detection, outside watch, nests, falls, updraft | `src/sky/laws/*.ts`, `tests/sky-laws.test.ts`, `src/sandbox/scenarios/sky-laws.json` | `game.ts` (seam 7, the land mark of seam 10) | P2 | §4 table |
| **P4** creatures | opus | `SkyActor`, `SkyCreatures`, the deity machine, the minion framework, gaits, hit marks, the floor graph type, the tower knock | `src/sky/creatures/{types,system,deity,minion,gaits,knock}.ts`, `src/sky/floors/graph.ts`, `src/sky/render/{hit-marks,creature-view}.ts`, `tests/sky-creatures.test.ts` | `game.ts` (seams 4–6), `entities/actors.ts` (`ActorKind`), `game/events.ts` (`targetKind`) | P3 | machine transitions, stages at ⅓ ⅔, puff changes nothing, teleport lands ≥ 12 away, a tower is knocked into loose cubes, nothing dies |
| **P5** hindrances | opus | The runner, `SkyEffects`, the eight hindrances, the player's push, freeze and carry | `src/sky/hindrances/*.ts`, `tests/sky-hindrances.test.ts` | `entities/player.ts` (push, `frozenT`, carry) | P3 (parallel with P4) | §6: telegraph first, placed blocks untouched, ends, positive answer |
| **P6** triple-jump | opus | `physics/jump.ts`, air jumps, `airJumps`, `jump.air`, the `sky` pool, the item, its words and controls docs | `src/physics/jump.ts`, `src/content/items/triple-jump.ts`, `tests/triple-jump.test.ts` | `entities/player.ts`, `core/stats.ts`, `game/events.ts`, `items/types.ts`, `items/validate.ts`, `content/items/index.ts`, `tests/synergy-matrix.test.ts`, `i18n/locales/{en,es}.ts` (stat label, item text), `docs/architecture/input/*` | P5 (both edit `player.ts`), P4 (events) | heights 1×/2×/8×, refill on landing, no air jump near ground, the cap, validator accepts the sky pool |
| **P7** sky-tree | opus | The trunk, deck, halls, slabs, gates, floor contract, the stack of §7.1 | `src/sky/floors/{types,tree}.ts`, `tests/sky-tree.test.ts` | — | P4 (graph), P10a | bands contiguous, slabs whole but the gate, trunk radius per height, same in any order |
| **P8a** panda | opus (+ art agent) | Floor 1: generator, deity, minion, models, words | `src/sky/floors/panda.ts`, `src/sky/creatures/deities/panda.ts`, `src/sky/creatures/minions/panda.ts`, `src/content/sky/panda-models.ts`, `src/i18n/locales/sky/panda.*`, `tests/sky-floor-panda.test.ts` | — | P4, P5, P7 | §7.4 for the floor; its rules (rest beat, nap) |
| **P8b** koala | opus (+ art) | Floor 2 | the same files for `koala` | — | P4, P5, P7 | §7.4; the guard and the ally's hug |
| **P8c** elephant | opus (+ art) | Floor 3 | the same files for `elephant` | — | P4, P5, P7 | §7.4; channels and dams; the rim; Memory |
| **P8d** lion | opus (+ art) | Floor 4 | the same files for `lion` | — | P4, P5, P7 | §7.4; facing the roar; holders and stalkers |
| **P8e** horse | opus (+ art) | Floor 5, the gift | the same files for `horse` | — | P4, P5, P6, P7 | §7.4; Gentled; the gift appears when won |
| **P9** totality | opus (+ art) | Strata, reach, chain, checkpoints, the Sun threshold, the Earth and Sun views | `src/sky/totality/*.ts`, `src/sky/render/{earth,sun}.ts`, `src/i18n/locales/sky/totality.*`, `tests/totality.test.ts` | — | P6, P7, P3 (updraft) | §8 |
| **P13** meta | haiku | Persistence | `src/game/meta.ts`, `tests/meta.test.ts` | — | — (any time) | §10.3 |
| **P11** entity | opus (+ art) | The Spiked Entity, invulnerability, the revelation | `src/content/endgame/spiked-entity.ts`, `src/endgame/encounter.ts`, `src/i18n/locales/sky/endgame.*`, `tests/endgame.test.ts` | `game.ts` (seam 5's invulnerable line, seam 9's encounter call), `content/creatures/index.ts` or the spawn in `addFloor` | P13, P2 (catalog parts); may run beside P3–P9, its `game.ts` lines merge after P4 | bounces leave it unchanged; the card once per run; the flag saved |
| **P12** staircase | opus | The stairwell, the landings, the carve job, the first-floor flight | `src/world/staircase.ts`, `tests/staircase.test.ts` | `game.ts` (seam 12, and the carve job in the encounter) | P11, P13 | §10.2 |
| **P14** audio | opus | The sky's sounds and ambience | `src/audio/sky.ts` | — (cues already named in `SkyHost`) | P4, P5 (cue names) | `audio-place.test.ts` extended |
| **P10b** gallery | opus (art agent) | The gallery sections and the captures | — | `src/debug/gallery.ts`, `docs/art/` captures | P8a–e, P9, P11 | `art.test.ts` |
| **P17** debug-lab | haiku | `S.sky`, `S.meta`, `S.endgame`, the sandbox's sky scenarios and report lines | `src/sandbox/scenarios/sky-*.json` | `main.ts`, `sandbox/scenario.ts`, `sandbox/report.ts`, `sandbox/lab.ts` | P4, P5 | `sandbox.test.ts` covers the new scenarios |
| **P15** i18n pass | haiku | Fill and review every sky part in Spanish; the owner's wording for the revelation | — | `src/i18n/locales/sky/*.es.ts` | all content | `i18n.test.ts` |
| **P16** docs | haiku | Move the built design text, update the architecture pages and the root README | the new `docs/design/built/sky/` tree | the documents of §14 | all | the link check |

**Order.**

```
Wave 1 (sequential foundation):  P0 → P1 → P10a → P2 → P3
Wave 2 (parallel):               P4 ∥ P5 ∥ P13
Wave 3:                          P6 (after P5) ∥ P7 (after P4) ∥ P11 (after P13)
Wave 4 (parallel):               P8a ∥ P8b ∥ P8c ∥ P8d ∥ P9 ∥ P12 ∥ P14 ∥ P17      (P8e after P6)
Wave 5:                          P10b → P15 → P16
```

The foundation (realm, formula world, laws, creature framework) lands before any floor. `game.ts` is edited by P0, P2, P3, P4, P11 and P12 only, in that order, each in its own seams.

## 17. Risks

1. **The interface extraction touches hot code** (elements, cracks, chunk meshing). Mitigation: P0 lands alone with the contract suite and the lab's existing reports unchanged byte for byte.
2. **Actors from two worlds share one registry and one coordinate range.** Without the realm filter a blast in the sky would hurt a dungeon projection at the same numbers. Mitigation: `ActorRegistry.setRealm`, tested in P2.
3. **Two chunk renderers and two workers** cost GPU memory on phones. Mitigation: on touch devices the inactive one is disposed and rebuilt under the travel fade (a second or two of meshing, hidden).
4. **A chunk miss inside physics** would materialise synchronously. Mitigation: the prefetch ring; a miss costs one rasterised chunk (microseconds for a few shapes).
5. **`game.ts` grows.** Mitigation: the fourteen seams of §2.6 are the whole budget; review rejects any other edit.
6. **3D creature behaviour gets stuck** on geometry the player built. Mitigation: graph-based navigation, the stuck guard, and the lab scenarios per floor.
7. **Jump practices stack with the triple jump** (jump × 5 × 8). Mitigation: the apex cap of 16 blocks; Totality is generated against base stats, so practices only make it easier (law 3.4).
8. **The staircase meets a big room or a claimed cell.** Mitigation: the route uses only unclaimed empty cells and doorless sides; 300 seeds in the test; a fallback that tunnels along the margin to the start room's free side.
9. **The design is moving** (other sessions edit `not-built/` documents now). Mitigation: doc moves come last (P16), and each package reads the current text before building.
10. **The meta flag is lost** with browser data. Accepted: the design asks only for local storage; another device starts fresh.
11. **The Sun's warmth against art pillar 2.** Needs the ledger ruling before P9's art.

## 18. Later

- Unity (issue #95), the solar relic and the rematch with the Spiked Entity.
- Solar wind as a hindrance or an aid in Totality.
- A height gauge or map for the sky; music per floor.
- Minions after their floor is cleared; deities that return; a platforming-only floor switch (each floor already works without its minions).
- A second jump practice in the basement using `airJumps` (MOVEMENT-ABILITIES idea); flight.
- Negative shots at hindrances (abilities open question 4).
- Saving a run in progress; a "forget progress" option in the menu.
- Creatures in the built tree's stories.

## 19. What only the owner can decide

1. **"Floor 1."** Does the staircase of later runs start on the roots (floor 0, where every run begins: the proposal) or on floor 1 (limbo)?
2. **Where the Spiked Entity waits:** in the chamber of silence (the proposal) or in floor 9's boss room after the Shadow?
3. **The loop.** The top of the built sky now opens into the sky realm instead of returning to silence (silence still carries you up). Yes?
4. **The way up between sky floors** opens only when the floor's deity is won (the proposal), or is always open?
5. **Which deities teleport:** the proposal enables the koala and the horse.
6. **The revelation in Spanish:** the owner's own words.
7. **The Triple Jump:** its name, and whether the third jump carries more speed forward (the proposal: no boost, full steering).
8. **The Sun's warm light** as the one stated exception to art pillar 2.
9. **A knocked-down tower** falls as loose cubes the player can gather again (proposal); **a positive shot at a player block** removes it with no cube back (proposal).
10. **Harm in the sky:** the deity's lobs, bolts and rings take 2 points (proposal), so a player can still die up there.
11. **A menu option to forget the unlock**, or only the console?
