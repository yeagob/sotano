# The threshold of the Sun

Up: [Totality](README.md) · the place where the climb ends in this build.

At the top of the climb, past the last checkpoint, a wall of pale light stands across the way. It is six blocks high and five wide, on a floor of the same light, and nothing about it gives: it cannot be broken, placed through or opened. Touching it shows the words "The Sun is not open yet." and pushes the player a step back toward the checkpoint. Near it a low hum comes and goes. Nothing opens, and no later climb is offered; the way up past the Sun waits for Unity (issue #95, not built).

Decided by the owner on 2026-11-03: the climb ends at a closed threshold of the Sun. The gate and its refusal are the only part of Totality that is built; the platforms, the Earth and the Sun are drawn in code but are not yet reached in play, because the sky realm is not yet wired to the game.

Code: `src/sky/totality/threshold.ts` (the touch and the push), the gate's cells in `src/sky/totality/chain.ts`, the sounds in `src/audio/sky/totality.ts`, the words in `src/i18n/locales/sky/totality.en.ts` (`toast.sunClosed`).
