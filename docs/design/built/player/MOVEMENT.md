# Movement

How the player walks and jumps, and how forgiving the jump is.

Part of [the player](README.md).

## What the player sees and feels

- You walk at a steady pace on any ground. The pace is the same in every direction; diagonals are not faster.
- You jump about a block and a quarter high. The jump is not a precision tool: it still works for a tenth of a second after you walk off a ledge, and a press made a little before you land is remembered for about a tenth of a second more, so a jump pressed early still happens on landing.
- In the air you steer, but with much less control than on the ground. You cannot change direction in mid-air the way you do on foot.
- On ice you keep sliding: starting, turning and stopping take far longer than on stone.
- Water slows you while you wade through it. Swimming is described in [SWIMMING.md](SWIMMING.md).
- There is no sprint, no second jump and no flight action. Those are planned, not built: see [not-built/player/MOVEMENT-ABILITIES.md](../../not-built/player/MOVEMENT-ABILITIES.md).

## The rule behind it

The movement is kept simple on purpose: the challenge of the dungeon is in the blocks, the enemies and the choices, not in acrobatics. The forgiving jump exists so that a jump that the player meant is not lost to a frame of timing. The design text also says the player walks and jumps "with no sprint at first" ([DESIGN.md, section 4](README.md)).

## Numbers

- Walking pace: about 4.6 blocks a second at the base move-speed stat of 1.
- Jump: the jump starts at a speed of 8.4 under a gravity of 28, which is a height of about 1.26 blocks. The jump stat scales the starting speed with its square root, so the height grows with the stat.
- Coyote time: 0.1 s after leaving the ground.
- Jump buffer: 0.12 s before landing.
- Air control: about a third of the control you have on the ground.
- Ice: the grip on a slippery floor is about an eighth of the normal grip.
- Wading: you move at 60 percent of your pace in water and 40 percent in lava; a jump out of a fluid is weaker than a jump on land.

Code: `src/entities/player.ts` (the update of the body, lines 88-140; the constants at lines 14-18), `src/core/stats.ts` (the move-speed and jump stats, lines 27-49).

## Open questions

1. **Jump height.** The design text says the player jumps about one block ([DESIGN.md, section 4](README.md)). The code gives about 1.26 blocks: the stat's own comment says about 1.25 (`src/core/stats.ts`, the jump line) and the constants in `src/entities/player.ts` give 1.26. Which is the intended height? The code is the current truth; the owner should confirm the number.
