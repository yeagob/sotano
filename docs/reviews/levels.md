# Review: levels L1 (the ten floors and the tutorial roots)

Subject: [LEVELS.md](../architecture/LEVELS.md) milestone L1, the frame for the owner's thirteen-level world ([design](../design/LEVELS.md)). Three parties: engineer (proposal and build), architect (critique), mediator (ruling for the owner). Date: 2026-10-27.

| # | Architect's point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | Door ids not offset; the HUD hard-codes `% 100` | high | **Now** | `levelIndex(floor)` (`floor + 4`, positive for tree floors too) and `roomGid` for rooms, doors and pedestal keys; HUD uses `ROOM_ID_STRIDE`; the generation test checks unique ids |
| 2 | Band 0 changes meaning (surface vs floor 0); `Math.max(1, …)` sites; HUD truthiness | high | **Now** | `bandOf` returns `SURFACE` (−1) above floor 0; `depthOf` keeps "the surface is depth 0" (owner rule); every site audited; HUD compares `>= 0` |
| 3 | Floor 0's last room inherits the boss machinery | high | **Now (reduced)** | On the tutorial floor: plain door, no boss pedestal flag, a quality-capped treasure slot instead of the boss pool. A real `exit` room type: L2 |
| 4 | Practices run out with ten floors of pedestals | high | **Now (cap + test)** | `maxQuality` in reservations; floors 6–9 keep no vault; test: 20 seeds reserve no duplicates and leave at least 3 practices free. Growing the catalogue is for the owner |
| 5 | Plan chaining vs fixed Tree positions | high (L2) | Later (L2) | Entry/exit cells per floor and `fork('plan', k, kind)` with the Tree planners |
| 6 | The plan model can't hold the Tree's 22 paths | high (L2/L3) | Later | Edges and corridors in L2, multi-cell rooms in L3; no new code on `links` in L1 |
| 7 | World x/z fixed by the 7×7 grid | medium | Later (L3) | — |
| 8 | 100 blocks of sky can't hold the tree | medium | Later (L5) | — |
| 9 | Initial meshing grows to ~680 chunks | medium | **Now** | `markAllDirty` gone: the surface is meshed at start, each floor when carved; a phone check is still owed |
| 10 | `fillRock` hard-coded to four floors | medium | **Now** | Driven by each level's `strata`, same noise forks |
| 11 | Thresholds and budgets lose their meaning; floor 0 empty by accident | medium | Peaceful **now**, tuning L4 | Tutorial floors skip the roster explicitly; budget `min(2 + floor, 8)` |
| 12 | Fog fixed to floor 1's | low | **Now (minimal)** | Each level's fog, blended to the sky near the surface. Ten floors on four art ramps: an art ruling for the owner |
| 13 | Seeds | low | **Now** | `GEN_VERSION` 4; golden structure hash for seed 0xBEEF |

Outcome: accepted with changes; L1 built. Open for the owner: whether practices may repeat once the catalogue runs out (or more practices), and the art mapping of ten floors onto the four floor ramps.
