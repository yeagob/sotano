# The Roots' mastery level

Up: [progression](README.md) · Status: built (issue #147, owner's decision 8). The level is shown in the achievement notice; a screen that lists it is not built ([pending](../../not-built/progression/README.md)).

The Roots have a mastery level: **the number of achievements unlocked, capped at 100**. It is kept between runs. Each achievement adds one level, in any order. The level decides what the Roots lay on their floor ([REWARDS](../levels/roots/REWARDS.md)): at 0 the floor is poorer; at 100 it prepares a well-equipped player.

## Rules

- **The count.** `mastery = min(100, number of unlocked achievement ids that exist in the catalogue)`. An id in the save that the catalogue no longer has is kept in the save and not counted. The level is computed, never stored, so it cannot drift from the achievements (`mastery` in `src/game/achievements.ts`).
- **Any order, no sequence.** Every achievement counts the moment it is earned, however many in one run. A boss has two achievements (destroyed and turned to your side), and each first time counts.
- **No double award.** An achievement is unlocked once. A second time does nothing: no level, no notice.
- **When it applies.** The Roots are carved at the start of a run. A level earned during a run changes the Roots from the next run; the notice says "On your next waking".
- **The cap.** 100 achievements exist in total once the 60 pending of issue #179 are defined, so the cap is reached exactly when all of them are. Today 40 exist (28 for the bosses, 6 meditations, the first brew, the first meal and 4 pages of the book), and the reward table has a named step at every level from 1 to 40. Three of the four pages (54, 69 and 100) cannot be earned until the book has that many pages, so with a book of 9 pages the highest level reachable is 37.
- **Separate from the page.** The page of the book and the mastery level are two numbers that do not touch: the page moves by walking the Roots and ending a run, the level by achievements.
- **Deterministic.** The Roots of a run depend only on the seed and the level the run started with.

## Where the player sees it

- In the achievement notice: "Mastery of the Roots: 5 of 100" ([ACHIEVEMENTS §4](ACHIEVEMENTS.md#4-the-notice)).
- In the Roots themselves: more on the floor, an extra practice from level 10 and a second from level 25, an altar in the start room from level 80, a second Boundary at 100. The two practices the Roots offer (the Sanctuary chest and the way-down pedestal) are the same at every level.
- A screen that lists the achievements and the level is not built. It would come with the completion percentage of issue #180, which is not designed yet.

## Not decided

- Should the pause card show the mastery level? The default is no, until a progress screen is designed (#180). Recorded with the other open questions in [OPEN-QUESTIONS](../../not-built/progression/README.md).
