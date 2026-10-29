[Encounters](README.md)

# Challenge rooms

Built. A challenge room is a one-cell room that holds three waves, each harder than the last, and gives a reward for each wave it clears. It is a farm of projections, not a story room. Code: `src/game/game.ts` (the challenge director), `src/world/floor.ts` (placement), `src/content/rooms.ts` (the `gauntlet` template).

## Placement

On hostile floors (1 to 9, never the tutorial floor), a floor may keep one challenge room with a chance set per floor. It is chosen among the one-cell normal rooms that are not next to the start, preferring a dead end. Its template is the `gauntlet` room: one cell, a dome ceiling, six blocks high.

## How a round goes

1. The player enters. The doors seal, and the first wave is due 0.8 seconds later.
2. Each wave's projections come in by the same omens as any room (see [Seal and omens](SEAL-AND-OMENS.md)), spaced 0.45 seconds apart.
3. When a wave is down, its reward is rolled from the room's own seed and dropped on the floor.
4. After 1.4 seconds the next wave opens. Waves are harder each time: the budget grows with the wave and with each visit.
5. After the third wave, the doors open and the room is cleared. The toast says the challenge is done.

Each entry starts a new round, and the next round is harder than the last. Rewards depend on the player's luck, plus the wave number.

## Open questions

- **Leaving mid-round.** The code's comment says the player can leave and come back. Check whether the doors hold a player in during a wave, and whether leaving resets the round.
- **Name.** The room's template is called `gauntlet`. The design's gauntlet is a corridor on the Tree with no seal, which is not built. Rename the template, or the design's corridor, before the two are confused.
- **Trial rooms.** The owner approved a trial room with a pedestal practice after four to six waves on timers. The build has the three waves and the per-wave reward, not the pedestal. See [Trial room pedestal](../../not-built/encounters/TRIAL-ROOM-PEDESTAL.md).
- **Length.** Three waves for every floor. Should the deep floors run more?
