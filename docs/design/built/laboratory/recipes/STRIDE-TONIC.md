# Stride Tonic

Up: [recipes](README.md) · built (#263). Name and numbers are proposals the owner has not confirmed; the open questions are in [potions: open questions](../../../not-built/practices/potions/OPEN-QUESTIONS.md#built-recipes).

Three sealed rooms of Fartlek's run, without holding the practice. The name refers to the long step of a run.

- **Path:** body.
- **Bulb:** one mind of a body pattern, for example Impulse's hurry or Craving's wanting. Nothing else.
- **Effect:** the `run` stat +1, the same switch Fartlek gives: holding the run control moves 45 % faster ([run and crouch](../../practices/RUN-AND-CROUCH.md)). Not holding it changes nothing.
- **Control:** hold Shift; L3 on a gamepad (it toggles until the left stick returns to centre), or the left stick pushed to its edge; on touch, the stick pushed past 95 % of its radius.
- **Duration:** 3 sealed rooms (4 with ice), and at the latest the next floor entry.
- **With Fartlek:** nothing more. The stat is a switch (`run` is limited to 0 to 1), so the potion adds nothing to a body that already runs.
- **Why it is easy:** minds are left about 12 % of the time, and any body pattern's mind will do. It gives a few rooms of speed, not the practice.

Code: `src/content/potions.ts` (the effect) and `src/content/recipes.ts` (the bulb). Tests: `tests/stride-folding.test.ts`, `tests/recipes.test.ts`, `tests/potion-effects.test.ts`.
