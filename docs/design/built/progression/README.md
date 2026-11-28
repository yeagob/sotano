# Progression

Up: [built](../README.md) · what the player keeps from one run to the next. Status: built (issue #147).

The game keeps three things between runs: the **page** the Roots have reached (the hidden book, see [levels/roots](../levels/roots/README.md)), the **achievements** unlocked, and the **mastery level** of the Roots that the achievements add up to. The mastery level also sets the **global difficulty** of a run. Before #147 the game kept almost nothing: the language, the graphics settings, and the staircase unlock record.

| Document | Contents |
|---|---|
| [MASTERY.md](MASTERY.md) | The Roots' mastery level: what it counts, its cap, when it applies, where it is shown |
| [DIFFICULTY.md](DIFFICULTY.md) | The global difficulty (#352): from 1 to 2 with the mastery level; harder tiers and more projections, with the seed kept |
| [ACHIEVEMENTS.md](ACHIEVEMENTS.md) | The 79 achievements that ship (the 40 of #147, the Shadow at the maximum difficulty (#353), six from #179 (the Roots, the way up, the crown, the pact, the book, bedrock), the seven of the blocks, projections and states, the nineteen of the owner's list (transcendence, six synergies, twelve presences) the six branches of the tree (#329), the ending of illumination (#351), the bestiary complete (#360), the dismount of the deep desert's worm (#354) and "Made Omh" at 100% completion; each boss destroyed and turned to your side, six meditations, the first brew, the first meal, four pages of the book) with ids, names and rules in English and Spanish; the data model; the notice |
| [SAVE.md](SAVE.md) | The save record, version 2: its fields, the migration from version 1, reading and writing, the merge of two tabs, the reset |
| [COMPLETION.md](COMPLETION.md) | The completion percentage (#180): seven weighted parts, what counts as a first time, the pure function, the display, and the open questions |

What all three share:

- **Knowledge and a richer start, never a stronger body.** No achievement changes a stat or a practice. Mastery changes what the Roots lay on their floor at the start of a run ([REWARDS](../levels/roots/REWARDS.md)), and, as the global difficulty, how many projections stand in the depths and how many of them are Yellow or Red ([DIFFICULTY](DIFFICULTY.md)). The idea of "knowledge, not power" ([META-PROGRESSION](../../not-built/story/META-PROGRESSION.md)) holds for everything below the Roots.
- **Generation never reads the save.** `main.ts` loads the record once and hands the game what a run needs (the page, the mastery level). The game writes the record back when something is earned, and when a run advances the page.
- **Every word in both languages.** Names, descriptions, the notice and the step lines are message keys in `src/i18n/locales/`.
- **The sandbox and the lab write nothing** and unlock nothing.

Still to design, and not built: the other 22 achievements ([pending](../../not-built/levels/roots/PENDING.md#achievements-still-to-define), issue #179; the register of the 79 is #363), the unlockables (#113). The completion percentage (#180) is built, with its open questions pending the owner. See [not-built/progression](../../not-built/progression/README.md).
