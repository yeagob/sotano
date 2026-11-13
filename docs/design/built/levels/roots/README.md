# The Roots: the book on the walls, two layouts and mastery

Up: [built levels](../README.md) · Status: built (issue #147). The Roots (floor 0) keep their eleven rooms, their plan and their doors. What the player meets here is built in the code named in each document. The floor itself is in [floors/ROOTS.md](../floors/ROOTS.md). What is still open is in [not-built/levels/roots](../../../not-built/levels/roots/README.md).

The walls of the Roots carry a **book**: six pages of tutorial, then the first pages of a hidden book. The walls turn pages. The page moves on by one each time a run ends after the player has walked every room of the Roots, and a full lap of the ring, forward or in reverse, lets the player leaf through the pages already reached. The current page also decides the **layout**: on page 1 the rooms hold their exercises (the **teaching layout**); from page 2 on, every run is carved in the **easy layout**, the same rooms with the work already done, crossed on foot with no block to place or break ([EASY-LAYOUT](EASY-LAYOUT.md)).

Separately, the Roots have a **mastery level** (0 to 100: the number of achievements unlocked, see [progression](../../progression/README.md)). It makes the floor's loose loot and crates start poorer, adds practices and an altar as it rises, and close to 100 prepares a well-equipped player. The two practices the Roots offer (the Sanctuary chest and the way-down pedestal) never change ([REWARDS](REWARDS.md)).

Every panel is short, warm and concrete, and true to what the room holds.

## Documents

| Document | Contents |
|---|---|
| [PAGES.md](PAGES.md) | The current page, when it advances, browsing by laps of the ring, the rule that keeps a change out of sight, the page stone |
| [TUTORIAL-PAGES.md](TUTORIAL-PAGES.md) | The six tutorial pages, slot by slot, and the fact in the code each one rests on |
| [EASY-LAYOUT.md](EASY-LAYOUT.md) | The easy layout from page 2 on: the six changed templates, the remembered panels, the panel mounts, how the layout is chosen |
| [PANELS.md](PANELS.md) | The five layouts (lesson, plate, prose, quote, image) on the 896 × 512 slab: geometry, character budgets, key caps, where each panel hangs |
| [BOOK-DATA.md](BOOK-DATA.md) | The two JSON files, every field, the validation rules, the image namespaces and the key caps |
| [REWARDS.md](REWARDS.md) | What the Roots lay at each mastery level, 0 to 100, and what stays the same everywhere else |

The achievements, the mastery level and the save record are not specific to the Roots: they are in [progression](../../progression/README.md) ([ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md), [MASTERY](../../progression/MASTERY.md), [SAVE](../../progression/SAVE.md)).

The hidden book's pages 7 to 9 and their open questions are not built as a design yet: see [not-built/levels/roots](../../../not-built/levels/roots/README.md).

## The eleven rooms (shared by every document here)

The plan is `TUTORIAL_LAYOUT` (`src/world/floorplan.ts`) with one template per cell (`TUTORIAL_CELLS`, `src/content/rooms.ts`). Every document and the book files name a room by its **room key**: the template id of its cell in the teaching layout (`rootsRoomKey(gx, gz)`). In the easy layout six cells carve another template (`roots-step-easy`…), but the room keeps its key ([EASY-LAYOUT](EASY-LAYOUT.md#7-how-the-layout-is-chosen)). The exercises below are the teaching layout's.

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

**The ring** is the ten rooms S, a, b, c, d, e, f, g, h, T, each joined to the next by a door, and T joined back to S. **Forward** is the order the rooms are read in: from the start room east into the step room, north up the east side, west along the top, south down the west side to the treasure room and back east into the start room (`roots-hall → roots-step → roots-dig → roots-mend → roots-pit → roots-bridge → roots-seal → roots-crates → roots-spring → roots-gift → roots-hall`). On the map, with north up, that is anticlockwise. **Reverse** is the other way. The way down (B) is a spur off the start room and is not on the ring.

## Words used here

- **Page**: one entry of the book files; its number is its position (page 1 is the first entry).
- **Current page**: the page the player has reached; saved between runs.
- **Shown page**: the page the walls show in this run. It starts as the current page and changes only by browsing.
- **Slot**: one of the 22 panels (11 rooms × north and south).
- **Lesson wall**: the wall a player walking forward faces on entering a room. It holds the room's lesson on pages 1 and 2 ([PANELS.md](PANELS.md#7-which-wall-holds-the-lesson)); in the easy layout, a lesson whose exercise is gone is told as a remembered panel ([EASY-LAYOUT §4](EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2)). Pages 3 to 6 fill every slot, the lesson walls included: there it is the wall read first ([BOOK-DATA §1b](BOOK-DATA.md#1b-which-pages-fill-which-slots-owner-2026-11-13)).
- **Teaching layout, easy layout**: the two shapes of the Roots. The teaching layout is carved while the current page is 1, the easy layout for every run that starts on page 2 or later ([EASY-LAYOUT](EASY-LAYOUT.md)).
- **Mastery level**: the number of achievements unlocked, at most 100 ([MASTERY](../../progression/MASTERY.md)).

## Code

`src/game/roots-book.ts` (the pure page state machine), `src/game/roots-keeper.ts` (one run's walls, the page it shows, its layout), `src/content/book/` (the book files, the validator, the image manifest), `src/render/tablets.ts`, `src/render/panel-layout.ts`, `src/render/page-stone.ts` (the panels and the page stone), `src/content/tables/roots-mastery.ts` (the mastery table), `src/game/achievement-keeper.ts` and `src/content/achievements.ts` (the achievements), `src/game/meta.ts` (the save).
