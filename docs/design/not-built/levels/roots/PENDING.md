# Pending: pictures, achievements and words awaiting the owner

Up: [the Roots: what is still open](README.md) · Status: open. What the built Roots still lack, and what waits for the owner's word. Each item names where its built part is.

## Lesson pictures not captured yet

The book's images are built from the game itself ([BOOK-DATA §4](../../../built/levels/roots/BOOK-DATA.md#4-images)). Eleven lesson pictures have no file yet. A panel that names one of them draws the neutral placeholder and the gallery flags it, so nothing breaks; the list is `PENDING` in `tests/book-images.test.ts`, and a pending id must have no file.

| Picture | What it must show | Why it is not captured |
|---|---|---|
| `ring` | The minimap of the whole Roots, with the ring of rooms | The minimap of a real run of floor 0 shows only the rooms near the player; the sandbox is one room |
| `drink` | A flask on top of the hand, the drink button on touch | The sandbox hand carries blocks and parts, not potions |
| `recipe` | The alembic and the potion it made | The floor generator places the alembic; the capture does not stage one |
| `paths` | The practices tab with its path chips | The capture does not open the inventory screen |
| `state` | The banner of a state of being | The banner shows only after three practices of one path |
| `boss-room` | A boss room after its fight, the pedestal lit | The lit pedestal needs a defeated boss |
| `chests` | A locked chest with two keyholes | The floor generator places it and the capture has not found one |
| `sky` | The sky above the great tree | On the sky seed the camera sits inside the trunk in every view tried |
| `seal` | A room sealed, its doors shut, a projection inside | The sandbox room has no doors to shut |
| `omen` | The cold motes of an omen gathering | An omen must be started and paused mid-gather |
| `room-clear` | A cleared room and what it left | The clear drop must be rolled and paused |

The pictures for pages 3 to 6 that are still missing (`sky`, `seal`, `omen`, `room-clear`) are the four last lines of the table. Their wanted content is in [BOOK-DATA §4](../../../built/levels/roots/BOOK-DATA.md#new-images-for-pages-3-to-6).

## Achievements still to define

The catalogue has 40 achievements ([ACHIEVEMENTS](../../../built/progression/ACHIEVEMENTS.md)). The other **60** (the issue said 78; with two achievements per boss and four for pages of the book, 40 ship and 60 remain) are in GitHub issue **#179**. They enter the catalogue only when the owner defines them, one by one, with their criterion. No placeholder is added to fill the slots. The data model takes them without a change ([ACHIEVEMENTS §2](../../../built/progression/ACHIEVEMENTS.md)).

The two other issues that touch progress are out of this folder: the completion percentage (#180) and the unlockables (#113).

## Names awaiting the owner

- **The achievement names**, in both languages, are the proposal the game ships. Only the owner's "Lucky Number" (page 54) and "Nice" (page 69) are final. The rest may change; the ids never do ([ACHIEVEMENTS §1](../../../built/progression/ACHIEVEMENTS.md)).
- **The three first pages of the hidden book** (pages 7 to 9) and page 7's quotation, with the length of the quotation from a book still under copyright. See [HIDDEN-BOOK](HIDDEN-BOOK.md) and [OPEN-QUESTIONS](OPEN-QUESTIONS.md), questions 15 and 16.
