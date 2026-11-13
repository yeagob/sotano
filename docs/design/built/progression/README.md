# Progression

Up: [built](../README.md) · what the player keeps from one run to the next. Status: built (issue #147).

The game keeps three things between runs: the **page** the Roots have reached (the hidden book, see [levels/roots](../levels/roots/README.md)), the **achievements** unlocked, and the **mastery level** of the Roots that the achievements add up to. Before #147 the game kept almost nothing: the language, the graphics settings, and the staircase unlock record.

| Document | Contents |
|---|---|
| [MASTERY.md](MASTERY.md) | The Roots' mastery level: what it counts, its cap, when it applies, where it is shown |
| [ACHIEVEMENTS.md](ACHIEVEMENTS.md) | The 40 achievements that ship (each boss destroyed and turned to your side, six meditations, the first brew, the first meal, four pages of the book) with ids, names and rules in English and Spanish; the data model; the notice |
| [SAVE.md](SAVE.md) | The save record, version 2: its fields, the migration from version 1, reading and writing, the merge of two tabs, the reset |

What all three share:

- **Knowledge and a richer start, never a stronger body.** No achievement changes a stat or a practice. The only thing mastery changes is what the Roots lay on their floor at the start of a run ([REWARDS](../levels/roots/REWARDS.md)). The idea of "knowledge, not power" ([META-PROGRESSION](../../not-built/story/META-PROGRESSION.md)) holds for everything below the Roots.
- **Generation never reads the save.** `main.ts` loads the record once and hands the game what a run needs (the page, the mastery level). The game writes the record back when something is earned, and when a run advances the page.
- **Every word in both languages.** Names, descriptions, the notice and the step lines are message keys in `src/i18n/locales/`.
- **The sandbox and the lab write nothing** and unlock nothing.

Still to design, and not built: the other 60 achievements ([pending](../../not-built/levels/roots/PENDING.md#achievements-still-to-define), issue #179), the completion percentage (#180), the unlockables (#113). See [not-built/progression](../../not-built/progression/README.md).
