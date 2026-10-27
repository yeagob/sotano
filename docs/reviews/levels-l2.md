# Review: levels L2 (Tree-of-Life floors and rooms you build your way through)

Subject: [LEVELS.md](../architecture/LEVELS.md) §5. Engineer, architect, mediator. Date: 2026-10-27.

| # | Architect's point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | The kingdom touched only the foundation (a locked vault): softlock | blocker | **Now** | The kingdom opens onto two paths; test: from where you land you reach the way down and every key without the vault |
| 2 | `path` half-wired; 25 rooms per Tree floor | high | **Now (partial)** | `RoomType 'path'`, path templates on every Tree floor, a corridor glyph on the minimap; the crown's redundant side paths dropped (23 rooms). Lazy carving if a phone profile says so: L3 |
| 3 | `X` carved and checked at different heights | high | **Now** | Carved per tile to two under the (vaulted) ceiling; the check uses the room's height |
| 4 | Blind spots in the walk check | high | Correctness **now**, per-room sweep later | Jumps only over one-tile gaps; shallow water stands at −1; all three tiles of every door approach, `K`, `P`, `H`, the pedestal; per carved room over real doors: L3 |
| 5 | Supply, centre, start rooms | medium | Supply and centre **now**; start rooms stay safe | Building rooms carry soft blocks; the centre reaches a door on foot; start rooms never need building |
| 6 | H/P at the centre; mirroring; alignment | medium | **Now** | Validator rule; plan mirroring rebuilds links and never flips a start template; test: every crown lies over the next kingdom, floors 0–6 |
| 7 | Floor 0's reversed planner | medium | **Now** | Distances from the start; floor 0 plans 10–11 rooms; test: never fewer than 9 |
| 8 | Tree plan tests | low | **Now** | Ten emanations, symmetric links, one door per touching pair; "plans are trees" only for random floors |
| 9 | GEN_VERSION | low | **Now** | 6 (past the 4 and 5 already in snapshots); golden updated |
| 10 | Fixed roles are predictable | low | **Reject** for L2 | The heart holds the treasure and the foundation the vault: that is the Tree's meaning; revisit in L4 if playtests ask |

Outcome: accepted with changes; built.
