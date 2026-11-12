# The Roots' mastery level

Up: [progression](README.md) · Status: decided (owner, issue #147, decision 8). Not built.

The Roots have a mastery level: **the number of achievements unlocked, capped at 100**. It is kept between runs. Each achievement adds one level, in any order. The level decides what the Roots lay on their floor ([REWARDS](../levels/roots/REWARDS.md)): at 0 the floor is poorer than today; at 100 it prepares a well-equipped player.

## Rules

- **The count.** `mastery = min(100, number of unlocked achievement ids that exist in the catalogue)`. An id in the save that the catalogue no longer has is kept in the save and not counted. The level is computed, never stored, so it can never drift from the achievements.
- **Any order, no sequence.** Every achievement counts the moment it is earned, however many in one run (the issue's sequential "one boss step per run" is superseded by the owner's decision: every first boss defeat counts, several in one run too).
- **No double award.** An achievement is unlocked once. A second time does nothing: no level, no notice.
- **When it applies.** The Roots are carved at the start of a run. A level earned during a run changes the Roots from the next run; the notice says so. The level a run uses is fixed at its start.
- **The cap.** 100 achievements exist in total once #179 is done, so the cap is reached exactly when all of them are. Today 22 exist, so a player can reach level 22.
- **Separate from the page.** The page of the book and the mastery level are two numbers that do not touch: the page moves by walking the Roots and ending a run, the level by achievements.
- **Deterministic.** The Roots of a run depend only on the seed and the level the run started with.

## Where the player sees it

- In the achievement notice: "Mastery of the Roots: 5 of 100" ([ACHIEVEMENTS §4](ACHIEVEMENTS.md#4-the-notice)).
- In the Roots themselves: more on the floor, a pedestal that is no longer bare, a second Boundary at 100.
- A screen that lists achievements and the level is not part of #147 (it would come with #180, the completion percentage).

## Open questions

- Should the pause card show the mastery level? Default: no, until #180 designs a progress screen.
