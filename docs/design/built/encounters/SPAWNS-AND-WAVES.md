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

### The difficulty adds projections

Built (issue #352, `src/enemies/difficulty.ts` `moreEnemies`, called by `ENEMY_BUDGET.pick` and `pickWave` in `src/content/enemies/index.ts`). The global difficulty ([DIFFICULTY](../progression/DIFFICULTY.md)) multiplies the number of projections in a room. The budget formula above is kept: it rolls the usual roster first, exactly as at difficulty 1, and the difficulty then adds to it.

- **The multiplier**: `m = 1 + 0.5 × (difficulty − 1)`, which is `1 + 0.5 × min(level, 100) / 100` from the mastery level. 1 at level 0 (the count of today), 1.5 at level 100, linear in between.
- **The count**: the room aims at `usual × m` projections. The whole part is added for sure; the fraction is one more projection with that chance (a usual roster of 2 at m = 1.25 holds 2, and 3 one time in two).
- **The surge, now and then**: a room may hold a few more than its multiplier gives. Its chance is `10 % × (difficulty − 1)`: none at level 0, 5 % at level 50, 10 % at level 100. A surge adds 1 or 2 projections, even odds.
- **Each added projection** is drawn from the same roster table as the usual ones: it belongs to the floor and costs no more than the room's budget.
- **The cap**: a room's usual cap (5 per cell, 7 for a challenge wave) is multiplied by `m` and rounded down, and the surge may pass it by its 1 or 2.
- **A quiet room stays quiet.** An empty roster gains nothing.
- **The seed**: the added projections are drawn from the room's own roster fork, after the usual roster, and every draw is the seed's (never the mastery level's). The same seed at the same level gives the same room; a higher level keeps the usual roster and only adds to it. At difficulty 1 nothing is drawn.
- **Challenge waves** grow the same way, on the wave's own fork.

| Level | Difficulty | Multiplier | Surge chance |
|---|---|---|---|
| 0 | 1 | 1 | 0 % |
| 25 | 1.25 | 1.125 | 2.5 % |
| 50 | 1.5 | 1.25 | 5 % |
| 100 | 2 | 1.5 | 10 % |

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
