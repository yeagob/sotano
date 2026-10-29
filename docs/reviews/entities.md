# Review: health, bombs, enemies, loot and stacked floors (M1.5)

Three-party review of the proposal in [../architecture/ENTITIES.md](../architecture/ENTITIES.md).

The owner's goals (translated): keys and bombs drop from broken blocks by probability, with Isaac-style counters; bombs; basic enemies that are metaphorical projections of mental blocks ([../design/STORY.md](../design/built/projections/README.md) §4); enemies always spawn visibly from the room centre, never beside doors; Isaac-like health; floors are stacked and you go down by gravity, with the next floor loaded when you enter the boss room; everything modifiable by items; reasonable complexity for a prototype.

---

## 1. Architect's critique

### Verdict

Right direction (events everywhere, one world, enemies as data), but three of the new systems each carry a design flaw that will show up in the first playtest: lazy floor generation that destroys player tunnels and can be farmed, per-break loot that breaks the key/bomb economy, and enemies that are neither modifiable at spawn nor effect sources. Each fix is smaller than what it replaces.

### Critiques

1. **(High) Generate one floor ahead.** Digging into the next band before it exists, then generating it, writes shells over your tunnel and can trap you inside a block. The hitch risk is overstated (carving a floor is ~18k voxels; 16-block bands align with chunks). *Change:* invariant "in band k, bands k and k+1 exist"; carve k+1 on arriving at k; the boss room only opens the hole and reveals that band. Per-floor RNG so a layout never depends on when it was generated.
2. **(High) `floorEnter` by band crossing can be farmed; room ids collide across floors.** Climbing back up and dropping again re-fires "new floor" hooks; per-plan room ids make floor 1 room 0 and floor 2 room 0 the same, breaking `firstVisit`. *Change:* `maxDepth`, `floorEnter` only when going deeper; global room ids; one `Doors`/`Pickups` with appended specs; `bus.clearDeferred()` on `floorEnter` (and update ITEMS.md §4's "fresh bus per floor").
3. **(High) Per-break loot breaks the economy.** Hundreds of breaks per floor at ~4.5% gives dozens of keys and bombs; a bomb pays for itself; chain items turn it into a printer. *Change:* bounded drops (soft cap per floor that luck scales), or seeded hidden loot blocks per floor plus a luck bonus roll. Roll after the break's cancel check on a `drops` stream; carry a cause/owner so items can decide whether chain breaks count.
4. **(High) Enemies can't be modified or act as effect sources.** No mutable spawn payload ("projections are slower"), no contact event (Open-hearted), no way for Comparison to hook `fire`. *Change:* mutable `enemySpawn { def, hp, speed, contactDamage, tags, x, y, z }`; `enemyContact { toPlayer, toEnemy }`; enemies may declare hooks installed as `enemy:<uid>` and removed on death; `tags` on enemies and intentions.
5. **(Medium) Behaviour as a string enum is a closed world.** *Change:* behaviours as function factories (`chase({...})`) plus optional `onDeath`; one file per enemy.
6. **(Medium) The spawn rule doesn't fit 13×7 rooms** (radius 3 from centre and ≥3 from doorways leaves a strip; some templates have obstacles at the centre). `roomEnter` fires mid-doorway. *Change:* spawn at the centre column on the first free height, staggered; seal doors only once the player is fully inside; `roomClear` counts the room's spawned enemies wherever they are.
7. **(Medium) Navigation:** straight-line steering jams on pillars and is cheesed by one placed block. *Change:* a tiny 2D BFS flow field per room (≈91 cells), recomputed when the player changes cell or a voxel in the room changes.
8. **(Medium) Damage units, ownership, contract.** Explosion damage has no mapping to half-hearts; "your own bombs" needs an owner, not a free-form source string; health should be a shared `Actor` pipeline (`damageActor`) for player and enemies; add stats `maxHearts`, `invuln`, `bombRadius`, `bombDamage` (so losing an item can't leave a container behind); list the `ItemApi` additions.
9. **(Medium) Bombs as loose cubes with a fuse,** not a new entity: falling, stacking, push, kick, throw and existing synergies for free; bombs default to kick on touch; pickups only need a vertical settle.
10. **(Low) Shaft and landing underspecified.** `generatePlan` starting from edge/corner cells fails more often (add a fallback and a test over all start cells); carve a clear 2×2 shaft to the start room floor; fog keys on `SURFACE_Y`; hide chunk rows more than one band away.
11. **(Low) Merge `keyPickup` into `pickupCollect { kind, amount }`** with mutable `amount`.

### Keep as is

One `VoxelWorld` with 16-block bands; floors above remember what you broke; events for damage, heal, death, room clear; enemies as data, one file each; visible materialise effect with spawn invulnerability; half-heart health with 1 s invulnerability; bombs and Panic through `explode()`; luck finally read; straight enemy projectiles that break tier-0 blocks; the contract test extended to new events.

---

## 2. Mediator's ruling

### Summary

The architect is right on the three high-severity points (all confirmed in the code), and they become requirements now, in their cheapest form. The owner's literal requirements stay: "the next floor loads when entering the boss room" is satisfied by separating **carving** (done one floor ahead) from **activation** (at the boss room: reveal, doors, pickups, the hole); "drops from broken blocks by probability" stays, with a per-floor soft cap. Only flow-field refinements and enemy-owned hooks are deferred, with hedges now.

### Fact-checks

- Carving a floor ≈ 18.5k voxels (rock fill ≈ 146k per band, done once at run start); remesh ≈ 40–80 chunks in the worker. Confirmed.
- A body inside a block can't move on any axis (`axis()` restores the previous position). Confirmed.
- `roomEnter` fires mid-doorway (cells split in the middle of the wall); sealing then would close a door on the player. Confirmed.
- "Radius 3 from centre, ≥3 from doors" leaves a 7×1–7×3 strip; several templates have obstacles at the centre. Confirmed.
- Room ids restart at 0 per floor. Confirmed.
- The planner always starts at the grid centre; edge starts are untested. Confirmed.
- One bomb breaks ≈60 blocks; at 2–3% it returns ≈1.3 bombs: a printer. Confirmed.

### Decisions

| # | Critique | Decision | Action |
|---|---|---|---|
| 1 | Generate one ahead | **Now (reconciled)** | Fill the rock column at run start; carve floor k+1 on arrival at k (floor 2 at run start) with a per-floor RNG. "Loaded at the boss room" = **activation**: reveal band, create doors/pickups/pedestals, open the hole. Digging into band k+1 first also activates it. |
| 2 | Farmable `floorEnter`, id collisions | **Now** | `maxDepth`; `floorEnter` only when going deeper; global room ids; one `Doors`/`Pickups`; one bus with `clearDeferred()` on `floorEnter`; update ITEMS.md §4. |
| 3 | Loot economy | **Now** | Per-break roll on a `drops` stream after the cancel check; chance = base × (1 + 0.5·luck) × 0.5^(dropsThisFloor / (3 + luck)); explosion and chain breaks roll at ×0.25; `blockLoot` carries source/owner; hooks can lift the limits (quality-4 items). |
| 4 | Enemies not modifiable | **Now**, enemy-owned hooks **later (M2)** | Mutable `enemySpawn`, `enemyContact`, tags on enemies and intentions; reserve source `enemy:<uid>` and `bus.off` it on death. |
| 5 | Behaviour enum | **Now** | Behaviour factories + optional `onDeath`; one file per enemy. |
| 6 | Spawn rule / mid-doorway | **Now** | Spawn at the centre column on the first free height, staggered ≈0.4 s, small outward push; seal only when the player's box is fully inside; `roomClear` counts the room's spawned enemies wherever they are. |
| 7 | Navigation | **Now** | Per-room 13×7 BFS flow field (step ≤ 1), recomputed when the player changes cell or the world changes; straight-line fallback. |
| 8 | Damage units / ownership / stats | **Now** | Half-hearts; explosions deal a flat 2 half-hearts to actors; `owner` field; shared `damageActor()`; stats `maxHearts`, `invuln`, `bombRadius`, `bombDamage`; list `ItemApi` additions. |
| 9 | Bombs as loose cubes | **Now, with guards** | Bomb = debris cube with a fuse; never recycled by the ring, never despawns by age; `touchCube` defaults to kick for bombs; floor pickups only settle vertically. |
| 10 | Shaft / landing | **Now** | `generatePlan(startCell)` with fallback + test over all 49 start cells; clear 2×2 shaft to the start room floor; fog keyed to the new `SURFACE_Y`; hide chunk rows far from the player. |
| 11 | Merge `keyPickup` | **Now** | `pickupCollect { kind, amount }`, mutable amount. |

### Missed by both

- **Leaving a sealed room by digging** is the game's identity: allow it, leash enemies to their room, keep its doors sealed until cleared, reseal on return.
- **Arriving without a door** (falling, tunnelling, maybe onto the centre): spawn invulnerability also cancels contact damage; push spawns away from the player.
- **One debris system spans all floors**: per-floor logic must use position/band, not "current floor".
- **Enemies vs thousands of cubes**: don't loop every cube per enemy; ignore loose cubes for enemy collision in M1.5.
- **Counters** cap at 99; counts change only through `pickupCollect`, `bombPlace`, `doorOpen`.
- **The shaft fall** must not count as fall damage (`land.cause = 'descent'`).
- **Determinism**: draw pedestal items at carve time from the per-floor stream.

## 3. Engineer's resolution

Everything ruled "now" is built (see [../architecture/ENTITIES.md](../architecture/ENTITIES.md)), with one change of direction from the owner afterwards:

- **Floors**: column filled once; floor k+1 carved on arrival at k with per-floor RNG streams; activated on entering the boss room (or digging into its band); `generatePlan(startCell)` with a relaxing fallback, tested from all 49 cells; 2×2 shaft to the start room; `maxDepth`, `floorEnter` only when going deeper, `clearDeferred()`; global room ids; one `Doors`/`Pickups`; chunk rows culled by height; fog keyed to the new `SURFACE_Y`.
- **Loot (#3)**: built as ruled (soft cap, ×0.25 for explosion/chain breaks), then **removed by the owner's decision**: breaking blocks drops nothing but the block; keys and treasures move into chests (planned in [../architecture/ELEMENTS.md](../architecture/ELEMENTS.md)). `blockLoot` stays, empty by default.
- **Enemies (#4, #5)**: mutable `enemySpawn`, `enemyContact`, tags on enemies and intentions, `enemy:<uid>` removed from the bus on death; behaviour factories (`chase`, `ranged`, `burst`); one file per enemy.
- **Spawning (#6)**: centre column on the first free height, 0.45 s apart, visible 0.9 s materialise (harmless, unhittable), step-off push, side-step if the player stands on the centre; seal only when fully inside; clear by the room's whole roster; leash; reseal on return.
- **Navigation (#7)**: per-room BFS flow field keyed by player cell and `VoxelWorld.version`.
- **Damage (#8)**: half-hearts; explosions `actorDamage` (2) with ×4 for enemies; `owner`; stats `maxHearts`, `invuln`, `bombRadius`, `bombDamage`; `ItemApi` gained `heal`, `damagePlayer`, `collect`, `counts`, `spawnPickup`. (A shared `Actor` type was not needed yet: the two damage paths share invulnerability/knock-back logic in their systems; revisit when bosses arrive.)
- **Bombs (#9)**: loose cubes with a fuse, pinned in the ring, never aged out, always kicked on touch, chain in blasts.
- **#10, #11**: done (`pickupCollect` replaces `keyPickup`).
- **Missed by both**: all handled (dig-out/reseal, side-step spawns, position-based logic for cubes across floors, enemies ignore loose cubes, counters capped at 99, `land.cause = 'descent'`, pedestal items drawn at carve time).
