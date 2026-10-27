# Review: levels L7, rooms bigger than their cell, new ceilings, deep holes, a building palette per floor

Proposal: [../architecture/LEVELS.md](../architecture/LEVELS.md) §10. As built: §11. Owner request (2026-10-27): new, less repetitive layouts; bigger rooms that keep their place on the map; vaults of different shapes; platforming; deeper holes; more difference in the materials of the first five floors.

## Critique (architect) and ruling (mediator)

| # | Point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | Doors, the fallback key and hole, clear drops, the spawn fallback and tablets must use the home cell, not the box corner | high | Done | `RoomInfo.hx, hz` everywhere |
| 2 | The walk check must treat rock (` `) as no ground and a jump blocker; no layer blocks over rock | high | Done | `standLevels`, `maxAt`, validator |
| 3 | The validator hard-coded 13 × 7 (centre, approaches, `P`/`H`, the 4 × 4) | high | Done | `homeAt`, `centreOf`, `doorApproach` by home; `flipped` flips the home |
| 4 | Claims made in carve order break "changing one room never changes another" | high | Now | `allotSpace` from the plan and `fork('floor', k, 'space')` before any room; each room picks among templates that fit its allotment; `GEN_VERSION` 11 |
| 5 | Any big boss room would open the 4 × 4 great pit | high | Done | the great pit keys off the plan's preset footprint |
| 6 | Vault shells, pool lining and the plug's upper wall assumed brick | high | Done; vault templates keep to one cell | palette substituted at carve time; `hardenShell` takes the palette |
| 7 | The shell must hug at Chebyshev distance 2; test that no room is carved into another | medium | Now (test) | test over three seeds and every floor |
| 8 | The leash aimed at the box centre; doors sealed on the box | medium | Now (the mediator added the seal) | leash to the home centre; `inRoomSpace` for seal and challenge entry; `roomAt` in a room's rock counts as the room (documented) |
| 9 | The flow field's linear Dijkstra on big rooms | medium | Later; templates stay ≤ 2 cells each way | done anyway: a bucket queue |
| 10 | Plateaus four high are not standing tiles for projections; headroom under vaults | medium | Now | plateaus are three high; validator checks two blocks over every stack under the ceiling at that tile; there is no fall damage |
| 11 | `freeSpots` scanned only the first 13 × 7 | medium | Done | the whole template, approaches by home |
| 12 | Ceilings over the box of an irregular room; the cave roof at the centre | low | Later (box); centre now | the cave roof is full height over the middle |
| 13 | Palette clashes: floor 1 trim was the obstacle stone, floor 0 loam looked like the dirt plugs, floor 0 trim was flammable; new materials reused the strata's ramps | medium | Now | the art agent gave each material its own ramp and set the palette per floor (DECISIONS §6.5, captures) |
| 14 | Tests to fix and add; the minimap read the size | low | Now | the map draws one cell per room; tests added |
| — | Mediator: the content was missing; the owner's ask needs new rooms on floors 1–5 | — | Now | eleven new templates, eight of them on floors 1–5 |

Outcome: accepted with changes; built.
