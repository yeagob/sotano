# Review: elements E-core (fire, water, lava)

Subject: [ELEMENTS.md §9](../architecture/ELEMENTS.md#9-e-core-proposal-2026-10-26-fire-water-and-lava-first), the element layer, its simulation, rendering, actors in elements and rooms that use height. Three parties: engineer (proposal and build), architect (critique), mediator (ruling for the owner). Date: 2026-10-26.

## Critique and ruling

| # | Architect's point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | Closed doors are air in the block data; fluids would pass sealed and locked doors | high | **Now** | `ElementHost.blocked()` = blocks + closed doors; test "a closed door holds a source back" |
| 2 | Level 7 meant both "falling" and "one step from a source": sideways spread without limit | high | **Now** (worse than stated) | New byte: kind (2 bits) · falling bit · level (4 bits), helpers in `content/elements.ts` shared with the worker; test "reach is exactly 7 / 3" |
| 3 | Falling columns reset the spread: reach unbounded down stairs and the shaft | high | Test **now**, cap later (E9) | Falling cells keep the level that fed them (stricter than the ruling); test "a pool spilling down steps floods a bounded area and goes quiet" |
| 4 | In-place updates in Set order: order-dependent, reactions can ping-pong | medium | Settle test now, double buffer later | Built now anyway: each tick reads, then applies changes in a fixed order (flows, reactions, catches), batch sorted by index |
| 5 | `src/world` can't import `fx`; a shared stream couples fires | medium | **Now** | Spread rolls are `hash3(fork('elements').u32(), cell, tick, side)`: stateless; documented in [RNG.md](../architecture/RNG.md) |
| 6 | Carving writes blocks directly: elements could survive inside new brick; sources never woken | medium | **Now** | `fillBox` clears the element layer; rooms are woken after carving; test "no element ever sits inside a block" |
| 7 | Placing a block into a source deletes it for good; placing into lava is a free bridge | medium | **Reject** the change | Intended: blocks displace elements (Minecraft's verb). Documented |
| 8 | Element changes flood the shared remesh queue; flow fields never see new hazards | high | **Now** | Separate `elemDirty` set with its own budget; `elemVersion` in the flow-field key; animation by texture offsets, never by re-meshing |
| 9 | The worker needs both layers; water drawn after opaque; visibility | medium | **Now** | Each request carries both padded layers; element meshes have `renderOrder` 2 and follow `setVisibleRange` |
| 10 | Flow field and room bounds assume flat 5-high rooms; spawns into lava | high | Hazard and spawn **now**; heights with the rooms work | Flow field: per-projection hazard, standing heights from 2 below to 4 above the floor; `RoomInfo.height`; combat bounds use it; spawns pick the nearest dry tile |
| 11 | Vertical budget between 16-block bands | high | Gate for tall rooms | `MAX_ROOM_H` 8, `MAX_PIT` 2: 3 rock layers left; test over every band pair and five seeds |
| 12 | Fire through `breakBlock` fires loot hooks (loot farm) and can chain | medium | **Now** | Burnt blocks skip `blockLoot`; at most 12 blocks catch per tick |
| 13 | Projections have no invulnerability: element damage every frame | medium | **Now** | One element hit per projection every 0.5 s |
| 14 | New events need matrix samples; causes in both languages; validate `materialReact` | low (mandatory) | **Now** | Samples and contract list updated; `cause.lava/fire/drown` in EN and ES; a hook's result must be a real material id |
| 15 | Validator: flames next to decor that may roll a crate | low | With the rooms work | `?` counts as flammable next to `f` |
| 16 | Tick only the bands near the player | low | **Later** (E9, if profiling asks) | Not built |

## Outcome

Accepted with changes; built. Later items: double buffering is done; band freezing (16) and a distance cap (3) wait for profiling in E9.
