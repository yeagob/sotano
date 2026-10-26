# Stress test: crazy items vs. the architecture (refactoring report)

Requested by the owner before scaling further (translated): *challenge the current system, without implementing anything, with the craziest items we can imagine — the UI interacting with the scenery, a new element like wind appearing, controlling more than one character, enemies becoming friends — and see whether it holds without breaking. Reflect deeply on whether the architecture is right for every element and interaction, so that new interactions can appear, change or break without breaking the game. Damage to enemies and to cubes doesn't have to be linked. The result: an architectural improvement and refactoring report.*

Author: an adversarial architect agent (read-only), after reading all docs, reviews and code. Status: **report; refactors not started.** The next step is to agree the order of work with the owner (see the end).

## Executive summary

The item layer is good and can grow: a priority event bus, layered stats with NaN guards, an inventory that rebuilds every effect from scratch, synergies that can suppress single hooks, and a synergy-matrix test. The rest of the game is not ready for "everything can affect everything":

- **Everything is built around one player.** The player is the only actor with stats, tags, input, a camera, a hand and resources. Enemies are plain records whose numbers are fixed at spawn, and they only ever look at the player.
- **`Game` does almost everything itself.** Every interaction between two kinds of thing (intent→enemy, explosion→actor, cube→player) is a hand-written method in `game.ts`; each new kind of thing (ally, clone, wind, living cube) adds a row and a column of new code there.
- **Damage has two pipelines with different units** (`damagePlayer` in half-hearts, `damageEnemy` in HP, a hidden ×4), and the shared `damageActor()` accepted in the entities review was never built.
- **Block damage is a multiple of enemy damage** (`damage × mining`), so every damage item also digs faster.
- **Missing pieces:** no time base, no camera abstraction, no shared force/gravity query (six gravity constants), no saves, closed content lists (fixed imports, materials indexed by array position).

**Before scaling vertically:** P0 — an actor/target model with factions, split damage profiles, a status system shared by actors, cubes, blocks and intents, and fixing the bus depth cap. P1 — stats on any actor through an effect host, one interaction table, a simulation clock, a command/controller layer. P2 — camera rig, UI bridge into the world, mod registries, snapshots.

## Stress test matrix

Verdicts: **OK** = supported as-is · **Small** = small additions · **Refactor** = needs a refactor · **Breaks**

| # | Idea | Verdict | Where it breaks | Minimal change |
|---|---|---|---|---|
| 1 | Heart icons fall into the world as blocks; the minimap becomes a floor; shoot the HUD | Breaks | HUD is DOM and reads `Game` directly; no screen↔world mapping; `ItemApi` can't set blocks; hearts are a number | UI bridge (`ui.anchor`, `rig.unproject`), `api.world.setBlock`, a HUD view model, optional world-space UI |
| 2 | Wind appears mid-run | Refactor | Six integrators with their own gravity constants; nowhere to add a force; elements only react material vs material | `Forces.sample(pos, carrier)` in every integrator; elements as runtime-registered interaction entries |
| 3 | A clone; two bodies; split inputs | Breaks | One `player`; `Player.update` reads `Input`; camera/HUD/enemies/pickups use `this.player` | Actor registry + `Controller`; camera follows the focused actor |
| 4 | Enemies become friends | Breaks | No factions; contact only with the player; leash; clear = all dead; behaviours target only the player | `faction`, `blocksClear`, `ctx.target(e)`, faction-based leash |
| 5 | Separate damage to enemies and to blocks | Refactor | `blockDamage = damage × mining`; Meditations also triples digging; no "only enemies" intents | `IntentSpec.hit = { actor, block, cube }` (absolute) + an `affects` mask |
| 6 | Items that modify items (double, disable newest, reroll, transform) | Refactor | No transform pass; hooks can't be scaled; no inventory verbs in `ItemApi`; no per-instance state | Meta-effects in `rebuild`, `api.potency`, `api.inventory` |
| 7 | Enemies pick up items or cubes | Breaks | Enemies have no hand/inventory; item effects are global = the player | Actor-scoped effect host; hand/inventory as actor components |
| 8 | A broken block becomes an enemy or ally | Small | No `spawnActor`; spawns need a room | `api.spawnActor(def, pos, { faction, room? })` through `enemySpawn` |
| 9 | Inverted gravity; swapping floors | Breaks | `moveBody` assumes +y up; camera has no roll; floors are fixed in place | Per-body `up`/gravity field; floor swaps after snapshots (P2) |
| 10 | Slow motion, rewind, freeze the world | Breaks | No clock; `performance.now()` in a behaviour; state in closures | `Clock` with scale and per-actor `timeScale`; fixed step; snapshots |
| 11 | Perception changes rooms; reveal hidden blocks | Refactor | The mesher sees raw materials; no appearance layer; items can't edit the world | A perception lens (material→appearance at mesh time); `hidden` property; `setBlock` |
| 12 | Cross-run memory; save mid-run | Breaks | No persistence; closures and private RNG state can't be saved | `MetaStore`; per-system `snapshot/restore` |
| 13 | Third-person or top-down camera | Refactor | Camera inline in `game.ts`; aim from the player's eye; hands always drawn; shake in the HUD | `CameraRig`; aim ray from rig + controller |
| 14 | Every broken block explodes; chains across floors | Breaks (safety) | Synchronous recursion; at depth 8 the bus runs events **without hooks**, so shields (Radical Acceptance) silently stop working mid-chain; explosions scan all cubes | Explosions always deferred and budgeted; `cause {origin, gen}` cap; defer instead of hook-less at the depth cap |
| 15 | Mods | Refactor | Fixed imports; array-indexed materials; adding content changes old seeds | `Registry<T>`, `registerMod()`, materials by key, content hash in the seed version |
| 16 | Multishot | Small | `fire` has no origin/direction/shooter; no `fireIntent` | `fire { shooter, origin, dir, intent, extra }` or `api.fireIntent` |
| 17 | An enemy that mirrors your shots | Refactor | Events have no actor/target; `hitEnemy` hard-codes the player as owner | `actor` on action events; enemy-owned hooks |
| 18 | Projectile damage credited to its thrower | Small (bug) | `projectileHit` uses owner `'world'` | Pass `enemy:<uid>` through the projectile |
| 19 | Inverted controls, autofire, possession | Refactor | Input goes straight into the player and `fire` | Command stream per controller; items transform commands |
| 20 | A new currency; a heart as a held block | Refactor | Closed `PickupKind`; counters are player fields; HUD hard-coded | Resources registry; HUD rows from it |
| 21 | Shrink the player | Small | `size` means intent radius; body size and eye height are constants | Rename to `shotSize`; add `bodyScale` |
| 22 | Aura: projections slower while you hold X | Refactor | Enemy stats are copied once at spawn | Enemy stat sheets; effects that target a faction |
| 23 | Rooms cleared by forgiving, not killing | Small→Refactor | Clear tied to "all dead" | A `pacified` status that removes `blocksClear` |
| 24 | Enemies hear your sounds | Breaks | Audio is a global module; no perception | `noise` events; audio subscribes |
| 25 | Reframing: an item rewrites names and descriptions | Small | HUD reads `def.name` directly | `describe(def, ctx)` with a `describe` event |
| 26 | Living doors; a boss made of voxels | Refactor | Doors are a separate system; no block entities | Block entities as actors anchored to voxels |
| 27 | A stacking curse across floors | Small | Only the inventory installs effects | Effect host with sources item / synergy / curse / status / room |
| 28 | Fleeing pickups; magnets | Small | Pickups have their own integrator | Forces + pickups as lightweight actors |

## Root causes

1. **One hard-coded actor**: `Game.player` and `Game.stats` are singletons read by enemies, pickups, combat and the HUD (rows 3, 4, 7, 17, 19, 22, 23).
2. **`Game` is a god object with n×m interactions hand-coded**: the bus lets items change outcomes, but doesn't let new kinds of thing take part.
3. **Split and coupled damage**: two pipelines, two units, a ×4 constant, block damage derived from actor damage, a closed `owner` union, `api.explode` hard-coding the player as owner.
4. **Stats only on the player**: one `StatSheet`, enemy numbers frozen at spawn, `StatName` closed.
5. **Scattered tags with no behaviour**: separate tag sets on intents, cubes and enemies (the latter never read), none on the player or blocks; no duration, stacks or ticks; the elements plan would repeat this with one-off maps and element-specific events.
6. **No shared physics environment**: six gravity constants, no force query, `up` fixed.
7. **No time base**.
8. **Input, camera and UI fused to the player**.
9. **No serialization boundary**: closures and private state everywhere.
10. **Closed content**: fixed imports, array-indexed materials, validation at module load; new content changes old seeds.
11. **The bus fails the wrong way at depth**: past `MAX_DEPTH` events run without hooks, so protections vanish exactly in the chain reactions that hurt most.

## Recommended refactors

### P0 — before any new vertical feature

- **R1. Actor/target model with factions.** `Actor { id, kind, faction, body, health (one unit), stats, status, tags, controller, room?, hand?, resources? }`, `Owner = ActorId | 'world'`. Wrap `Player` and `Enemy`; enemies query actors by hostility; behaviours call `ctx.target(e)`; room clear counts `blocksClear` actors. Risk: medium. Test: an ally projection damages a hostile one and doesn't block clear.
- **R2. One damage pipeline with split profiles.** `Hit { actor, block, cube, kind, owner, source, tags, cause }`, `applyHit(target, hit)`, one `actorDamage` event (aliases for one release). Intents: `actor = damage`, `block = mining` (absolute), `cube = knock`. Rebalance items and their `effect` texts. Test: Meditations no longer changes digging; an actors-only intent leaves blocks untouched.
- **R3. Status system shared by every carrier** (actor, cube, block, intent): `defineStatus({ id, stacks, duration, tags, onTick, stats })`, events `statusApply` (cancellable) and `statusRemove`. `VOLATILE` becomes a status. Elements are built on it. Matrix: every status on every carrier.
- **R4. Bus and chain safety.** Defer at the depth cap instead of dropping hooks; explosions always deferred and budgeted; `Cause { origin, gen }` with a generation cap; spatial hash for explosion vs cubes. Test: "every break explodes" + Radical Acceptance never lets self-damage through.

### P1 — before elements E0

- **R5. Stats on any actor + EffectHost**: scoped effect sources (item, synergy, status, curse, room, env, meta), two-pass rebuild with meta-effects and potency, per-instance item state, a stat registry.
- **R6. Interaction table** matching material, status, tag or carrier on each side; an element registry (wind arriving mid-run is a registration); one generic `react` event. Rewrite ELEMENTS.md §2 and §6 before E0.
- **R7. Forces and environment**: `env.forces(pos, carrier)`, `env.gravity(pos)` used by every integrator; `moveBody` with an `up` axis.
- **R8. Clock and fixed step**: global scale, per-actor `timeScale`, fixed 60 Hz simulation with interpolated rendering.
- **R9. Commands/controllers** and a wider `ItemApi` (`fireIntent`, `spawnActor`, `world.setBlock`, `inventory.{gain, lose, reroll}`, `actors.query`); `fire` carries `{ shooter, origin, dir }`.

### P2 — later

- **R10. CameraRig** (aim ray from the rig; shake moves out of the HUD).
- **R11. UI bridge** (HUD from a view model; anchors and unproject; optional world-space UI; `hudHit`).
- **R12. Registries and mods** (`Registry<T>`, `registerMod()` before `newRun`, materials by key, content hash in the seed version, mod events with sample payloads).
- **R13. Serialization boundary** (`snapshot/restore` per system, world as deltas, item state as data, RNG state, named deferred actions, rewind ring, `MetaStore` touching only runtime RNG).
- **R14. Audio as event subscribers**; gameplay noise as a `noise` event enemies can perceive.

## What to keep

The event bus (priorities, cancellation, per-hook try/catch, owned `defer`, dump/trace); `Inventory.rebuild()` (to grow into the EffectHost); `computeStats` with layers, clamps, NaN guard and `diffStats`; synergy suppression and catalogue validation; the synergy matrix with typed samples; the RNG design; behaviour factories and one file per enemy/item; typed-array debris with pinned bombs; bombs as cubes; `explosion.actorDamage` and `owner`; one banded `VoxelWorld` with carving separated from activation.

## Proposed order of work

1. **PR1 — bus safety**: depth cap defers; explosions deferred and budgeted; `Cause`; fix `projectileHit`'s owner.
2. **PR2 — split damage**: `Hit { actor, block, cube }`, absolute `mining`, item rebalance and `effect` texts.
3. **PR3 — Actor shell**: `Actor` over `Player`/`Enemy`, `ActorRegistry`, `Owner = ActorId | 'world'`, one `actorDamage` event.
4. **PR4 — factions and targeting**: `ctx.target`, faction leash, `blocksClear`, a debug "charm" item.
5. **PR5 — StatusSet** on actors, cubes, intents and blocks; `VOLATILE` migrated; statuses in the matrix.
6. **PR6 — EffectHost**: scoped sources, meta-effects, per-instance state, stat registry.
7. **PR7 — Commands/controllers + wider ItemApi**.
8. **PR8 — Clock, fixed step, forces and environment** (`up` axis).
9. **PR9 — Interaction table and element registry**; rewrite ELEMENTS.md §2/§6; three-party review before E0.
10. **PR10+ — CameraRig → UI bridge → registries and mods → snapshots and MetaStore**, each with contract tests; every new carrier, status or reaction joins the synergy matrix.
