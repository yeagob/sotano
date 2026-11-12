# The Roots as an evolving tutorial and a hidden book

Up: [not-built levels](../README.md) · Status: decided (the owner's decisions on issue #147, 2026-11-12), with the parts marked *proposal* awaiting the owner. What is built today is in [built/levels/floors/ROOTS.md](../../../built/levels/floors/ROOTS.md).

The Roots (floor 0) keep their eleven fixed rooms and their exercises for ever. What changes is what their walls say and what the floor gives. The walls turn **pages**: six pages of tutorial, then the first pages of a **hidden book**. The page moves on by one each time a run ends after the player has walked every room of the Roots. A full lap of the ring, forward or in reverse, lets the player leaf through the pages already reached. Separately, the Roots have a **mastery level** (0 to 100, one level per achievement, see [progression](../../progression/README.md)) that makes the floor richer: its loose loot and crates start poorer than today, the two practices it offers today never change, and close to 100 it prepares a well-equipped player.

The game should be one a parent is glad to see a child play, that an adult can use to know themselves and to rest, and that is simply fun. The Roots are where that promise is made: every panel is short, warm and concrete, and true to what the room holds.

## Documents

| Document | Contents | Status |
|---|---|---|
| [PAGES.md](PAGES.md) | The page counter, when it advances, browsing by laps of the ring, the rule that keeps a change out of sight, the page stone | decided |
| [PANELS.md](PANELS.md) | The three layouts (lesson, plate, prose) on the 896 × 512 slab, exact geometry, character budgets, key caps, where each panel hangs | decided (geometry: proposal) |
| [BOOK-DATA.md](BOOK-DATA.md) | The two JSON files, every field, the validation rules, the image ids and which are new captures | decided |
| [TUTORIAL-PAGES.md](TUTORIAL-PAGES.md) | The six tutorial pages, slot by slot, and why each slot says what it says | proposal |
| [HIDDEN-BOOK.md](HIDDEN-BOOK.md) | The first three pages of the hidden book (pages 7 to 9) | proposal, awaiting the owner |
| [REWARDS.md](REWARDS.md) | What the Roots give at each mastery level, 0 to 100, and what stays as it is everywhere else | decided (numbers: proposal) |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | The work in ordered packages for coding agents, with files, tests and the definition of done | proposal |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | What the owner's decisions leave open, each with the default the design uses | open |

The achievements, the mastery level and the save record are not specific to the Roots; they are in [progression](../../progression/README.md).

## The eleven rooms (shared by every document here)

The plan is `TUTORIAL_LAYOUT` (`src/world/floorplan.ts`) with one template per cell (`TUTORIAL_CELLS`, `src/content/rooms.ts`). Every document and the book files name a room by its **template id**.

| Cell | Room key (template) | Grid (x, z) | Exercise it holds | Doors |
|---|---|---|---|---|
| S | `roots-hall` | (3, 5) | The start: the spawn, facing north | W, E, S |
| a | `roots-step` | (4, 5) | Two-high brick walls: build a step and climb | W, N |
| b | `roots-dig` (flipped north–south) | (4, 4) | A full-height brick wall with a dirt plug between you and the north door | S, N |
| c | `roots-mend` | (4, 3) | An open room with dirt blocks to crack and mend | S, N |
| d | `roots-pit` | (4, 2) | Two trenches, too wide to jump and too deep to climb | S, W |
| e | `roots-bridge` | (3, 2) | Two wide trenches to bridge, block by block | E, W |
| f | `roots-seal` | (2, 2) | Obsidian walls with dirt plugs: dig, climb or break through | E, S |
| g | `roots-crates` | (2, 3) | Twenty-eight crates | N, S |
| h | `roots-spring` | (2, 4) | Shallow pools under a dome | N, S |
| T | `roots-gift` | (2, 5) | The Sanctuary chest with the Boundary over it | N, E |
| B | `roots-door` | (3, 6) | The way down and its pedestal | N |

**The ring** is the ten rooms S, a, b, c, d, e, f, g, h, T, each joined to the next by a door, and T joined back to S. **Forward** is the order the lessons were made to be read in: from the start room east into the step room, north up the east side, west along the top, south down the west side to the treasure room and back east into the start room (`roots-hall → roots-step → roots-dig → roots-mend → roots-pit → roots-bridge → roots-seal → roots-crates → roots-spring → roots-gift → roots-hall`). On the map, with north up, that is anticlockwise. **Reverse** is the other way. The way down (B) is a spur off the start room and is not on the ring.

## Words used here

- **Page**: one entry of the book files; its number is its position (page 1 is the first entry).
- **Current page**: the page the player has reached; saved between runs.
- **Shown page**: the page the walls show in this run. It starts as the current page and changes only by browsing.
- **Slot**: one of the 22 panels (11 rooms × north and south).
- **Lesson wall**: the wall a player walking forward faces on entering a room. It holds the room's lesson on every tutorial page ([PANELS.md](PANELS.md#which-wall-holds-the-lesson)).
- **Mastery level**: the number of achievements unlocked, at most 100 ([MASTERY](../../progression/MASTERY.md)).
