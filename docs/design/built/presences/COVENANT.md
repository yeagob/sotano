[Presences](README.md)

# The Covenant (built, partly)

Status: **built in part** (issue #149). The record, the pieces the built presences give, and the set effect are in the code. The Light is not given: it waits on the Listener's Lesson, which is not built. The owner's reading of the closed set and the set effect's wording are proposed, pending owner ruling (see [not-built/presences/COVENANT.md](../../not-built/presences/COVENANT.md)).

## What is built

- **Four pieces, one presence each.** The Mender gives the Thread (after a Give on its card), the Elder gives the Page (on its choice card, with its lesson), and the Witness gives the Seal (after a Take on its card). The Light has no source yet.
- **A run record.** The pieces held are kept for the run only, in the order given, and reset at a new run with the codex. Nothing is kept in the profile save, and no randomness is read: the same exchanges give the same record.
- **Promised by construction.** A piece is not an item, so no drop, destruction or theft can take it. Giving a piece twice changes nothing.
- **The set effect.** Holding all four is the Covenant complete: a toast says so once, and from then on every presence's exchange card ends with a line that it remembers the player. It gives no stat.
- **Code.** `src/content/presences/covenant.ts`, read by the game in `keepCovenantPiece` and `exchangeLines`. Tested in `tests/covenant.test.ts`.

## Checked (issue #149)

- Unit tests: the sources, idempotence, immutability, the order, and the completion rule with all four pieces.
- Not checked in the game: a full run that gives all four pieces (the Light cannot be given), and the set effect's line on a real card in a browser.
