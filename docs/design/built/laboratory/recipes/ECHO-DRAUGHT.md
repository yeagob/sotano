# Echo

Up: [recipes](README.md) · built (issue #259). The name, the duration and the rule of which practices can be echoed are proposals the owner has not confirmed; the open questions are in [potions: open questions](../../../not-built/practices/potions/OPEN-QUESTIONS.md#potion-types-variants-and-the-echo-issue-259).

A mixed bulb, of parts from patterns of different paths, brews an Echo: for a while the player carries the effect of a practice they may never have held. The flask is named after the practice ("Echo of Deep Focus") and its effect line quotes the practice's own effect.

- **Bulb:** parts of two or more paths, with at least one part deeper than flesh (a mind, a heart or an essence), that no named recipe matches. Flesh of several paths alone is still the [tonic type](TYPES-AND-VARIANTS.md#the-tonic-type-flesh-alone).
- **Effect:** the stats of one practice, exactly as the practice gives them.
- **Duration:** two sealed rooms (three with ice). Drinking a second Echo ends the first: one Echo at a time.
- **Which practice:** one whose path is one of the bulb's paths. Which one is fixed by the bulb itself, never by a roll: the same bulb, in any order, echoes the same practice in every run. Blocks in the bulb change which practice it is; ice does not.

## Which practices can be echoed

The Echo copies stats, never anything else, so it stays safe with every practice and every synergy. A practice can be echoed when all of this is true:

- its whole effect is stat changes: no event hooks, no stacks, no one-shot gift on pickup, no weapon, no suppressed hooks;
- it changes neither heart containers nor how many blocks the hand carries (a borrowed heart or a borrowed slot would leave something behind when it ends);
- it is one of the four paths (body, mind, emotion, will): miracles are not echoed;
- it can be found in a treasure, boss or vault pool (gifts of the sky and the Covenant are not echoed).

About twenty practices pass today (for example Deep Focus, Fartlek, Gratitude Journal, Stoic Resolve). The Echo does not give the practice: it is not in the inventory, it counts toward no state of being and no synergy, it is not saved, and when it ends every stat it changed is back where it was.

Code: `src/content/echo.ts` (which practices, which one a bulb echoes), `src/content/recipes.ts` (`echoOf`), `src/game/potion-effects.ts` (the stats while it lasts), `src/content/potion-text.ts` (its name and effect line). Tests: `tests/potion-variants.test.ts`, `tests/potion-effects.test.ts`, `tests/recipes.test.ts`.
