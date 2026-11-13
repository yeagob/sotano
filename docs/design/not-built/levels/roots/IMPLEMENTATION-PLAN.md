# Record of the work: issue #147 (the Roots' book, mastery and achievements)

Up: [the Roots: what is still open](README.md) · Status: record. The packages of the plan (A1 to E1) are all committed on `feature/147-roots-book`; this page keeps what each one left behind and what is still open. It is not a plan any more: the built behaviour is in [built/levels/roots](../../../built/levels/roots/README.md) and [built/progression](../../../built/progression/README.md).

## What was built, by package

| Package | What it built | Where it is written down |
|---|---|---|
| A1 | The message keys and labels | `src/i18n/locales/` |
| B1 | Save record version 2 and the migration | [SAVE](../../../built/progression/SAVE.md) |
| B2 | Book loader and validator | [BOOK-DATA](../../../built/levels/roots/BOOK-DATA.md) |
| B3 | Pages, laps and visibility as a pure state machine | [PAGES](../../../built/levels/roots/PAGES.md) |
| B4 | Mastery table and achievement catalogue (40 entries) | [REWARDS](../../../built/levels/roots/REWARDS.md), [ACHIEVEMENTS](../../../built/progression/ACHIEVEMENTS.md) |
| B5 | Portraits and lesson captures | [BOOK-DATA §4](../../../built/levels/roots/BOOK-DATA.md#4-images) |
| B6 | Quotation layout, page 7's quotation, the four page achievements | [PANELS §4b](../../../built/levels/roots/PANELS.md), [HIDDEN-BOOK](HIDDEN-BOOK.md) |
| B7 | The remembered panels of the easy layout | [EASY-LAYOUT §4](../../../built/levels/roots/EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2) |
| C1 | Panel renderer | [PANELS](../../../built/levels/roots/PANELS.md) |
| C2 | Roots carved by mastery | [REWARDS §4 to §6](../../../built/levels/roots/REWARDS.md#4-the-extra-practices-the-altar-and-the-second-sanctuary) |
| C3 | The easy layout | [EASY-LAYOUT](../../../built/levels/roots/EASY-LAYOUT.md) |
| D1 | Game wiring: the book on the walls, the page stone, the layout by page | [PAGES](../../../built/levels/roots/PAGES.md) |
| D2 | Game wiring: achievements, the notice, the mastery draws | [ACHIEVEMENTS](../../../built/progression/ACHIEVEMENTS.md) |
| E1 | Cleanup (the old `lesson.*` texts and fields removed), the design moved to `built/`, the records, the acceptance check | this folder's README and [PENDING](PENDING.md) |

## What is left

- The eleven pictures and the four pages 3 to 6 pictures listed in [PENDING](PENDING.md#lesson-pictures-not-captured-yet).
- The 60 achievements of issue #179, and the names awaiting the owner ([PENDING](PENDING.md#achievements-still-to-define)).
- The three first pages of the hidden book and page 7's quotation ([HIDDEN-BOOK](HIDDEN-BOOK.md)).
- The open questions of the owner ([OPEN-QUESTIONS](OPEN-QUESTIONS.md)).
- No lab scenario for the whole Roots flow: the lab carves sealed single rooms and moves the player only by teleport, so it cannot run the Roots (`docs/architecture/SANDBOX.md` §6). The flow is covered by the node tests `tests/roots-book-game.test.ts` (including the whole chain: walk, death, page 2 in the easy layout, a reverse lap), `tests/achievements-game.test.ts` and `tests/roots-streams.test.ts`.
