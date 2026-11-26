# Wall Jump (built)

Up: [body practices](README.md) · [all practices](../README.md) · [built design](../../README.md)

The Wall Jump is a body practice (movement) that gives one more jump in the air, usable only from a wall: press jump while you are off the ground with a solid block touching your side. Issue #294.

Status: built in code, waits for the owner's acceptance. The name "Wall Jump" and its Spanish name ("Salto desde la pared", provisional) are working names; the owner has not named the practice. Its meaning, credit and icon are provisional, and the icon has not passed the art gate (`sotano-art`).

## What the player does

- While you hold the Wall Jump, press jump while you are off the ground and a solid block touches your side (your body is against a wall or a block). The jump happens there and nowhere else in open air.
- Like every air jump, it does not happen with ground within 0.6 blocks below your feet, so a press beside a wall just above the floor waits and becomes a ground jump on landing.
- It rises like the next air jump on the ladder: twice a ground jump as the first air jump, eight times as the second, and sixteen times at most. It pushes you nowhere forward; you keep the speed you had.
- Landing restores it, like the other air jumps.
- It counts toward the air jumps (the `airJumps` stat). With the Triple Jump held, the air jumps are the Triple Jump's own open jumps first, and the last of them is the one that needs a wall: the Wall Jump's count is the last `wallJumps` of the `airJumps` count. The stat caps at three, as the Triple Jump does.

The item adds **+1 air jump** and **+1 wall jump** for each copy (the `airJumps` and `wallJumps` stats). Two copies give two air jumps, both at walls. A `wallJumps` value of 0 means every air jump is open.

The rule behind it: the jump is the one button, and the Wall Jump is a new meaning of that button beside a wall, so the player needs no new control.

## Where it is in play

The item is a common treasure practice (quality 3, the treasure pool with weight 1). Code: `src/content/items/wall-jump.ts` (the item), `src/entities/player.ts` (`airJumpReady`, `touchesWall`: the air-jump rule), `src/core/stats.ts` (the `wallJumps` stat, range 0 to 3).

## Decisions

- **One counter.** The Wall Jump uses the `airJumps` counter. `wallJumps` only says which of those air jumps need a wall; it does not count jumps.
- **Cap interaction.** The `airJumps` stat caps at three, so with both Triple Jump copies the cap leaves no room for the Wall Jump's own jump. The wall count still marks the last of the three as wall-only. This is a design question for the owner: the Wall Jump with two Triple Jump copies makes the sixteen-times jump need a wall.
- **Wall touch.** A solid block counts as touching when it lies within 0.05 blocks of the body's side, at feet height and above.

Tests: `tests/wall-jump.test.ts` (usable on a wall, not in open air, no push forward, not a ground jump, refreshed on landing, stacks with the Triple Jump).
