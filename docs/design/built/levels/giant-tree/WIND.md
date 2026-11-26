# The wind above the crown

Up: [giant tree](README.md) · Status: built (issue #373). What is still open is in [not-built/levels/WIND-ABOVE-THE-CROWN](../../../not-built/levels/WIND-ABOVE-THE-CROWN.md).

From the crown of the tree upward the wind always blows. It is drawn as thin white streaks that drift along it, and it pushes you whenever your feet leave the ground. It is strong: a little stronger than you are in the air.

## Where it blows

- **Not on the tree.** The giant tree and its stars route to the sky have no wind: the crown, the disc and the star pads are calm.
- **On the Totality, after the horse.** The wind blows over the Totality, the climb of small platforms from the crown of the sky tree up to the Sun. It starts at the Totality's first stratum and goes on to the Sun. The halls and the guardians' floors have their own gusts ([sky WIND](../../sky/abilities/WIND.md)), not this wind.

## What it does

- **Only in the air.** Standing on anything (the disc, a star pad, a block you laid, a summit) the wind does nothing at all. The moment your feet leave it, the push begins; it ends the moment you land. Swimming, a dash and being carried are not touched either.
- **As strong as your own air control, and a tenth more.** In the air you steer with a pull toward the direction you hold. The wind pulls with 1.1 times that same pull, so it grows and shrinks with you: a faster walk (a practice, running) steers harder and is blown harder. At base stats your pull is 22.5 blocks/s² and the wind's 24.8.
- **What that feels like.** Holding nothing, you drift with the wind at 1.1 times your walking speed. Holding straight against it, you still drift with it, slowly, at a tenth of your walking speed: you can slow it, never beat it. Holding with it, you fly at 2.1 times your walking speed. Every hop above the crown has to be aimed into the wind.
- **One direction at a time.** The wind holds one direction for 3 seconds, then turns. Each turn is at least 60 degrees from the last (anything from 60 to 300), so every change is one you notice. The streaks swing round with it in about a third of a second; the push changes on the turn itself.
- **The same for the same seed.** The run's seed decides every direction: a run started again on the same seed has the same winds at the same times. The wind's clock starts with the run.

## How it looks

Thin streaks of the pale white the game uses for drifting motes, half a block long, drifting along the wind past you. They are born round you, a few at a time, only above the crown, and fade in and out; they shrink away before they come within a block of your eyes, so they never cover the view. Below the crown you see none. The art record is [DECISIONS §14.12](../../../../art/DECISIONS.md).

## The shield that will stop it

The wind is one force of the air, and a practice can cancel it. The Lion's practice, which makes you untouchable in the air, is meant to stop it; that practice is not built in this change (see the not-built page above).

Code: `src/game/wind.ts` (where it starts, its clock and its force), `src/physics/air-forces.ts` (the air's forces and their filters), `src/entities/player.ts` (the push, only while airborne), `src/render/wind-view.ts` (the streaks), `src/game/game.ts` (one wind per run). Tested in `tests/wind.test.ts`.
