# Progression (not built)

Up: [not-built](../README.md) · what the player keeps from one run to the next. Status: decided (owner, issue #147, 2026-11-12), not built.

Today the game keeps almost nothing between runs: the language, the graphics settings, and a record of the staircase unlock that nothing reads yet (`src/game/meta.ts`). Issue #147 adds three things the player keeps: the **page** the Roots have reached (the hidden book, in [levels/roots](../levels/roots/README.md)), the **achievements** unlocked, and the **mastery level** of the Roots that the achievements add up to. The 78 achievements still to define are issue #179; the completion percentage (#180) and the unlockables (#113) are separate work and are not designed here.

| Document | Contents | Status |
|---|---|---|
| [MASTERY.md](MASTERY.md) | The Roots' mastery level: what it counts, its cap, when it applies | decided |
| [ACHIEVEMENTS.md](ACHIEVEMENTS.md) | The 22 achievements with ids, names and rules in English and Spanish, the data model that takes the other 78, and the notice | decided (names: proposal) |
| [SAVE.md](SAVE.md) | The save record, version 2: fields, migration from version 1, what breaks it, how it is reset | decided (reset: proposal) |

What all three share:

- **Knowledge and a richer start, never a stronger body.** No achievement changes a stat or a practice. The only thing mastery changes is what the Roots lay on their floor at the start of a run ([REWARDS](../levels/roots/REWARDS.md)). The older idea of "knowledge, not power" ([META-PROGRESSION](../story/META-PROGRESSION.md)) holds for everything below the Roots.
- **Generation never reads the save.** `main.ts` loads the record once and hands the game what a run needs (the page, the mastery level). The game writes the record back when something is earned, and at the end of a run.
- **Every word in both languages.** Names, descriptions, the notice and the step lines are message keys in `src/i18n/locales/` (`sotano-i18n`).
- The plan of the work is with the Roots: [IMPLEMENTATION-PLAN](../levels/roots/IMPLEMENTATION-PLAN.md).
