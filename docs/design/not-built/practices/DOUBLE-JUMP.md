# Double Jump

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/double-jump.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/body/`. The name is provisional: the owner names the practices later, as the Triple Jump is still unnamed ([TRIPLE-JUMP](../../built/player/TRIPLE-JUMP.md)).

| | |
|---|---|
| Path | Body |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Platform games: the double jump (a generic mechanic name). Provisional credit: no row of `docs/lore/SOURCES.md` fits a second jump |
| Code | `src/content/items/double-jump.ts`; the air jumps in `src/entities/player.ts`; the ladder of heights in `src/physics/jump.ts` |

## What it means

Leaving the ground is not the end of the lift: the body can rise once more before it has to come down. It is one more step of the "ascent in leaps" concept ([CONCEPTS](../../../lore/CONCEPTS.md)), which is our own and has no source.

## What it does

- One more air jump: while you are off the ground, a press of jump is the next air jump. The item adds **+1 air jump** (the `airJumps` stat).
- The jump rises twice a ground jump (about 2.5 blocks at base stats), steers in the air the way the first air jump of the Triple Jump does (partial control), and pushes you nowhere forward.
- Landing gives it back.
- Your practices raise every jump with no cap, as for the Triple Jump.
- It counts toward the Embodied state (it carries the `body` path tag).

Positive outcome: an air jump only adds height. Nothing it does hurts you or takes away a jump you had.

## With the Triple Jump: the order of the air jumps

The air jumps are counted, not named. The k-th air jump of a climb takes step k of the ladder `[1, 2, 8, 16]` (`physics/jump.ts`), whichever item gave it, and the body steers fully once two air jumps have been made (the check is on the count, not on the item). So with both items held (`airJumps` 3, the ground jump plus three in the air):

| Jump | Ladder step | Rise | Steering in the air after it |
|---|---|---|---|
| Ground jump | 1× | one ground jump | ground control |
| First air jump | 2× | about 2.5 blocks | partial (as the Triple Jump's first) |
| Second air jump | 8× | about 10 blocks | full (as the Triple Jump's second) |
| Third air jump | 16× (the fourth rung, as a second Triple Jump copy gives) | about 20 blocks | full |

The Triple Jump's rules hold for its first two air jumps: 2× with partial steering, then 8× with full steering, and no forward push on any of them. The extra third air jump is the one the Double Jump adds on top. Holding the Double Jump alone gives one air jump, 2× with partial steering. Holding the Triple Jump alone is unchanged.

Stacking: each held copy adds one (the `add` layer, like every stat practice). The stat is clamped to at most 3 air jumps (`src/core/stats.ts`, `airJumps` in `[0, 3]`), so a Double Jump held with two Triple Jump copies adds nothing. The stacking engine of the drink practices ([STACKING](../../built/practices/STACKING.md)) does not apply to it.

## Stats and events

- `airJumps`: add 1. No hooks, no events.

## Synergies and states of being

- **Embodied** ([states of being](../../built/practices/states-of-being/README.md)): three body practices. The Double Jump counts toward it, as the Triple Jump does.

## Open questions

- **Name** (N1): "Double Jump" in English and "Salto doble" in Spanish are provisional. The owner names the practices later.
- **Meaning and credit**: the credit "Platform games: the double jump" is provisional and flagged. A source in `docs/lore/SOURCES.md` may replace it if the owner gives one.
- **Pool**: `treasure` with weight 1, the pool of the quality-3 practices. The Triple Jump is the only quality-3 body practice and it is the sky gift, so no other body practice sets the pool. Adding it moves the seeds: the golden world (`tests/rng.test.ts`) and the easy-layout baseline (`tests/roots-easy.test.ts`) need re-recording by the orchestrator (sotano-items rule 19). They are not re-recorded here.
- **Icon**: two steps, the Triple Jump's shape with one step less, in the body palette. The art gate (sotano-art) has not passed it.
- **Recipe**: none yet (issue #112).
- **Sandbox scenario**: none yet, as for the Triple Jump.
