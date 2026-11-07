# The Triple Jump (built)

The Triple Jump is a practice that gives the player two more jumps in the air, each higher than the one before. This page is what the game does with it; its gift from the fifth tree deity is not built yet ([not-built/player/MOVEMENT-ABILITIES.md](../../not-built/player/MOVEMENT-ABILITIES.md)).

Part of [the player (built)](README.md).

## What the player does

- While you hold the Triple Jump, press jump again while you are off the ground. The air jump happens only when there is no ground within 0.6 blocks below your feet, so a press just before you land is still a ground jump. It does not happen while you swim.
- The first air jump rises twice as high as a ground jump, about 2.5 blocks. The second rises eight times as high, about 10 blocks. Each one starts where the last one reached its top, so the whole climb is about 14 blocks from the ground.
- After the second air jump you steer with full control until you land. Neither air jump pushes you forward.
- Landing gives both air jumps back.
- No jump rises above 16 blocks, whatever your practices do to the jump.
- The item adds **+2 air jumps** (the `airJumps` stat, base 0, at most 4).

The rule behind it: the jump is the one button, and the air jump is a new meaning of that button in the air, so the player needs no new control. The pause card's jump row mentions the air jumps ([the input document](../../../architecture/input/README.md)).

## Name and provisional answers

The name "Triple Jump" is a working name; the owner has not named the item yet. The item's meaning is provisional too. The owner's answers that shape the jump are provisional (owner, 2026-11-03): no forward boost on the air jumps, and full steering after the second one.

## Where it is in play

The item belongs to the sky's gift pool, which the game never draws from at random, so the Triple Jump is not yet found in play. Its gift is part of the fifth tree deity, which is not built ([the horse, not built](../../not-built/sky/guardians/HORSE.md)).

Code: `src/content/items/triple-jump.ts` (the item), `src/entities/player.ts` (the air jumps, the cap), `src/physics/jump.ts` (the ladder of heights `[1, 2, 8]`).
