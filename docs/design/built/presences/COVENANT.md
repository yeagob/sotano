[Presences](README.md)

# The Covenant (built)

Status: **built** (issue #149). The record, the four pieces, the closed-set rule and the set effect are in the code. The closed-set reading, the Light's floor and the set effect's wording are decided by agent, pending owner ruling (see [not-built/presences/COVENANT.md](../../not-built/presences/COVENANT.md)).

## What is built

- **Four pieces, one presence each.** The Mender gives the Thread (after a Give on its card), the Elder gives the Page (on its choice card, with its lesson), and the Witness gives the Seal (after a Take on its card). The Light is given by the Listener's last Lesson: an answered Lesson on the deepest floor of the Tree (floor 5), see [LISTENER.md](LISTENER.md#the-lesson).
- **A run record.** The pieces held are kept for the run only, in the order given, and reset at a new run with the codex. Nothing is kept in the profile save, and no randomness is read: the same exchanges give the same record.
- **Promised by construction.** A piece is not an item, so no drop, destruction or theft can take it. Giving a piece twice changes nothing.
- **The closed set (decided by agent, pending owner ruling).** The owner's word "cierre" is read as a closed set, and it is a rule in code: exactly four pieces, each with exactly one source (`PIECE_SOURCE`, frozen), given once, never taken back, and a complete record that no source changes again. No shop, drop, other presence, sandbox or save gives a piece; the Listener's plain exchange gives none. Reason: it is the plainest reading of the word and of the design's "no other source gives them", and it keeps the gift promise by construction.
- **The set effect.** Holding all four is the Covenant complete: a toast says so once, and from then on every presence's exchange card ends with a line that it remembers the player. It gives no stat.
- **Code.** `src/content/presences/covenant.ts`, read by the game in `keepCovenantPiece` and `exchangeLines`. Tested in `tests/covenant.test.ts`.

## Checked (issue #149)

- Unit tests: the sources (one per piece, frozen), idempotence, immutability, the order, the closed record, and the completion rule with all four pieces (`tests/covenant.test.ts`, `tests/presences-lesson.test.ts`).
- Not checked in the game: a full run that gives all four pieces by play.
