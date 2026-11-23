[Presences](README.md)

# The codex (presences)

Built, in part: the presences met. The menu (the pause card, under the controls) lists every presence the player has met in this run, in the order met: its name, what it asks and what it gives, in English and Spanish. Code: `src/game/game.ts` (`meet`, `codex`, reset in `newRun`), `src/game/hud.ts` (`setCodex`, `renderCodex`), `index.html` (`#codex`), the lines `codex.<id>.asks` and `codex.<id>.gives` in `src/i18n/locales/`.

- **Run-scoped.** The list is kept in the run, not in the save, so a new run starts empty. Memory across runs is not built (see [MEMORY](../../not-built/presences/MEMORY.md)).
- **Met means completed.** A presence is listed once its exchange is completed: the part given, the gift taken, the choice made, the toll paid. A declined offer is not listed, and a build that has only started (the Child) is not listed until its gift is given.
- **Text only.** No portrait is drawn. Art need: one small portrait per presence for the list (see the bestiary's pictures). Until then the list is words.
- **Not built:** the projections' and creatures' entries, the bosses' release images, and the rooted mark (see [not-built CODEX](../../not-built/presences/CODEX.md)).

## Checked

- Headless Chromium, the real menu: the empty line in English and Spanish; with three presences met, the entries in both languages; no horizontal scroll at 375 px and 1280 px.
- Not checked: a presence met in the game itself (the sandbox report is text and does not show the card or the list); the keyboard and gamepad moves over the list (it is text, with no control of its own); the list at 375 px with many entries.
