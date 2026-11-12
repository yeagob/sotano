# Open questions for the owner

Up: [the Roots as an evolving tutorial](README.md) · Status: open. Only what the owner's decisions on issue #147 (and the corrections of 2026-11-12) do not settle. Each question has the default the design uses, so no work waits on it.

Answered by the owner on 2026-11-12 and removed: level 0 gives exactly one key or one breakthrough; "five times lower" is the chance a crate gives anything; a converted boss has its own achievement, separate from destroying it; step lines speak in stars (`qualityStars`).

1. **Lesson wall or "south for plates".** Taken literally, plates on every south wall would put the lesson behind a forward walker in six rooms. *Default:* each room's lesson hangs on the wall a forward walker faces; plates go on the other wall ([PANELS §7](PANELS.md#7-which-wall-holds-the-lesson)).
2. **After the last page.** The issue says wrap to page 1; the owner said "never beyond the current page". *Default:* the current page stops at the last page and moves on when the owner adds pages; browsing still reaches every page ([PAGES §1](PAGES.md#1-the-current-page)).
3. **The page stone.** "One block in the start room" does not say which, nor whether it shows the current or the shown page. *Default:* the middle block of the start room's north wall at eye height, showing the shown page's number on book pages ([PAGES §4](PAGES.md#4-the-page-stone)).
4. **Which run endings count.** *Default:* death, R, "New run" and a new seed; not the sandbox, not closing the tab; at most once per run.
5. **Panels hidden by their room.** In `roots-step` and `roots-seal` part of each panel is behind the room's own walls today. *Default:* raise the step-room panels 1.1 blocks and shrink the seal-room panels to fit their strips; keep the dig-room north panel as a secret behind its wall ([PANELS §6](PANELS.md#6-where-each-panel-hangs)).
6. **The notice.** *Default:* a blocking card (the presence card with an "Achievement" kicker), shown at the next calm moment, rather than a toast that vanishes ([ACHIEVEMENTS §4](../../progression/ACHIEVEMENTS.md#4-the-notice)).
7. **What counts as a completed meditation.** *Default:* the Sanctuary's `complete` outcome from a Boundary (the Roots or a vault); the quick reward and the debug console do not count.
8. **When mastery applies.** *Default:* from the next run; the notice says "Next time you wake in the Roots".
9. **A player-facing reset.** *Default:* none in #147; a console command forgets the page and achievements and keeps the staircase ([SAVE](../../progression/SAVE.md)).
10. **Seeds change once on floor 0.** The Roots' new loot and forks change floor 0 for every existing seed code (`GEN_VERSION` + 1); floors 1 to 9 replay exactly as before, because `pedestalSlots` no longer needs to change ([REWARDS §6](REWARDS.md#6-rules-the-table-keeps)). *Default:* accept.
11. **"Knowledge, not power".** The older meta-progression idea says runs make you wiser, not stronger. Mastery makes the Roots richer. *Default:* the owner's decision wins; the idea is read as "no stat or practice is kept", which still holds.
12. **The quality of the extra practices.** The owner fixed when they appear (levels 10 and 25), not their tier. *Default:* ★ to ★★★, the Roots' gentle band; the altar reaches ★★★★ from level 90.
13. **The Shadow's stillness ending.** *Default:* it counts as turning the Shadow to your side (`boss.shadow.converted`), not as destroying it ([ACHIEVEMENTS §1](../../progression/ACHIEVEMENTS.md#1-the-36-that-ship-with-147)).
14. **Issue #179's count.** With two achievements per boss, 36 ship now and 64 remain, not 78. *Default:* the issue is updated to 64.
15. **The 36 names and the three book pages.** Proposals in both languages ([ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md), [HIDDEN-BOOK](HIDDEN-BOOK.md)).
