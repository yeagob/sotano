[Encounters](README.md)

# Spawns and waves

Built for the floor. Where a projection rises, how a room's roster comes in waves, and the breath between them. Code: `src/game/game.ts` (announce, spawn spot, wave director), `src/game/omens.ts` (spawn clearance, wave splitting, patience).

## The roster

A normal room's roster is rolled once, when the floor is carved, from its own seed. The budget for a normal room's roster is set per floor:

| Floor | Budget | Floor | Budget |
|---|---|---|---|
| 0 | 2 (no roster: tutorial) | 5 | 6 |
| 1 | 3 | 6 | 7 |
| 2 | 4 | 7 | 8 |
| 3 | 5 | 8 | 9 |
| 4 | 6 | 9 | 9 |

The budget grows with the room's open floor, a cell at a time. Some rooms are quiet and have no roster at all. Vault rooms have none either.

## Where a projection rises

Each projection gets its own spawn point, chosen when its omen opens:

- It is a standable floor cell of the room: solid under it, open at its head, and no water or fire on it.
- It is at least 3 blocks from every door of the room.
- It is at least 3.5 blocks from the player at the moment of the choice.
- Among the cells that qualify, the choice is seeded by the room, the floor and the spawn's number, so a seed plays the same.

If no cell qualifies, the omen uses the room's centre, which may be closer to the player than 3.5 blocks; the omen then holds until the player moves away.

The spawn is by a floor cell only. Walls, ceilings, liquids, flames, blocks in the room and burrows are not built (see [not-built spawn kinds](../../not-built/encounters/spawn-kinds/README.md)).

## Waves

A roster is split into waves of at most three projections, in roster order.

1. Wave one begins half a second after the seal.
2. Each projection of a wave is announced by its own omen, spaced 0.45 seconds apart.
3. The next wave opens when the current one is nearly down: when one projection or fewer remains, or when the wave has stood for 25 seconds (patience). Stalling never empties a room.
4. Between waves comes a breath of 1.5 seconds, with a low swell (unpositioned) that says more are coming, and then the omens of the next wave.
5. The last wave's last projection clears the room.

## Not built here

- Pacing by depth: one wave in some floors, three in others. Every normal room uses the same wave split.
- Room triggers other than "remaining" and "patience": a wave that opens on a health share, on a timer, or on an event such as a pedestal touched.
- The fairness rules for spawns beyond the ones above: at most four open omens at once, a point used at most once per wave, a point resting after it spawns, and walkers reaching the player's area by the flow field. See [fairness rules](../../not-built/encounters/FAIRNESS-RULES.md).

## Open questions

- **The room's centre fallback.** When no cell is clear of the player, the centre is used even if the player stands next to it. Is holding the omen enough, or should the fallback be another cell?
- **Patience.** A wave of one projection left for 25 seconds opens the next. Is 25 seconds the right patience on every floor?
- **Budget.** The design's budget is 2 plus the floor; the level data uses 2 plus 80 percent of the floor, rounded up, capped at 9. The level data is the build's rule.
- **Depth pacing.** The design wants the first floors to teach with one wave and the deep floors to run two or three waves with mixed spawn kinds. Not built.
