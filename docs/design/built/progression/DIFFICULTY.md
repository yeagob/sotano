# The global difficulty

Up: [progression](README.md) · Status: built (issue #352). Code: [src/enemies/difficulty.ts](../../../../src/enemies/difficulty.ts) (the formulas), `Game.begin` (read once at run start), `Game.spawnEnemy` (the tier roll), `ENEMY_BUDGET.pick` and `pickWave` in `src/content/enemies/index.ts` (the count). Tests: `tests/difficulty.test.ts`.

The global difficulty starts at 1 and rises with the Roots' [mastery level](MASTERY.md) to 2, its maximum, at level 100. It makes the depths harder in two ways: more of the projections rise in the Yellow and Red [colour tiers](../projections/TIERS.md), and a room holds more projections ([SPAWNS-AND-WAVES](../encounters/SPAWNS-AND-WAVES.md#the-difficulty-adds-projections)). It is difficulty, not reward: a tier gives no extra loot.

## The formulas

| What | Formula | Level 0 | Level 50 | Level 100 |
|---|---|---|---|---|
| Difficulty `d` | `1 + min(level, 100) / 100` | 1 | 1.5 | 2 |
| Tier chances | Yellow `d × (5 % + 2.5 % × (floor − 1))`, Red `d × 1.5 % × max(0, floor − 3)` | as today | × 1.5 | × 2 |
| Projections in a room | `usual × (1 + 0.5 × (d − 1))` | × 1 | × 1.25 | × 1.5 |
| A surge of 1 or 2 more | chance `10 % × (d − 1)` per room | 0 % | 5 % | 10 % |

## Rules

- **Read once, at run start.** The game reads the mastery level when a run begins and derives the difficulty from it (`difficultyOf`). A level earned during a run changes the difficulty from the next run. Generation never reads the save: the game passes the difficulty to the carving.
- **The seed keeps its word.** Every roll is the seed's: with a fixed level, the same seed gives the same rooms, the same rosters and the same tiers. As the level rises, the same seed only adds: the tier roll is the same draw with wider bands, so a spawn never loses its tier, and the usual roster of a room is drawn first, unchanged, with the added projections after it on the same room fork.
- **Level 0 is the game of before.** At difficulty 1 no draw is added and no chance changes.
- **The sandbox and the lab** play at difficulty 1 (their mastery is 0).
- **The Shadow's achievement**: from mastery level 99 the maximum difficulty counts (owner, #353, [ACHIEVEMENTS §1](ACHIEVEMENTS.md#the-shadow-at-the-maximum-difficulty-1-issue-353)).
- **Debug**: `S.mastery(n)` then `S.restart()` plays the next runs at that level and its difficulty, in memory only; a run started that way counts as level 0 for achievements. `S.game.difficulty` reads the current run's difficulty.

## Not built

- A screen that shows the difficulty. The player feels it in the depths; no number is shown.
- Difficulty in the sky realm: its beings are not spawned through rooms and take neither tiers nor extra counts.
