# Review: levels L3 (big rooms, the great pit, checks per carved room)

Subject: [LEVELS.md](../architecture/LEVELS.md) §7. Engineer, architect, mediator. Date: 2026-10-27.

| # | Architect's point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | No generator can produce 2×2 groups (random plans are trees; Tree emanations never touch) | critical | Now (partly) | No footprints on Tree floors; growth inside the random planner: L3b |
| 2 | A 2×2 great pit doesn't fit floor 5's Tree | critical | Now | A 2×1 crown (the crown and its empty east neighbour); owner asked whether to go 2×2 with a floor-5 layout |
| 3 | A shaft centred on a big room lands on floor 6's walls | critical | Now, simplified | The 4×4 shaft is centred on the crown cell, so it lands on floor 6's start cell; start templates keep a clear 4×4 centre |
| 4 | Merged cells duplicate the boss and its slot | critical | Now | Footprint model: one plan room per room |
| 5 | Room indexing assumes index = cell | high | Now (minimal) | Anchor ids stay; `roomOfCell`; doors as a list from the cell's origin |
| 6 | 13×7 literals everywhere | high | Now for what the crown touches; the rest L3b | `w`/`d` on rooms; chests, key homes and vault armour (another session's code) in L3b |
| 7 | Economy per merged room | high | Later (L3b) | Rosters and rewards scale with cells |
| 8 | Minimap | high | Now (L3a) | Bounding box of a footprint |
| 9 | RNG, sizes in `pickTemplate`, GEN_VERSION | medium | Now | Size filter (L3a); GEN_VERSION 8 now for L3c's template changes |
| 10 | The per-room check as written was vacuous | medium | Now (L3c), with a concrete rule | Real doors only; aggregate per floor over fixed seeds; memoized |
| 11 | Flow field size and allocation | low | Later (L3b) | With the phone performance pass |

Split and order: **L3c first** (rooms and tests only, no overlap with the chests work), then **L3a**, then **L3b**. Outcome: accepted with changes; L3c built.
