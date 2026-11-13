# The roots (floor 0)

Up: [floors](README.md) · Status: built (issue #147). The Roots' book, their two layouts and their mastery are in [levels/roots](../roots/README.md); this document is the floor as the player walks it.

The roots are the earth the player starts in: a friendly, lit, safe floor where the game teaches itself. Everything is pretty, every door is open, no projection ever appears, and the lessons are written on the walls as a book.

## How the player meets it

- **A fixed plan.** The roots are the same plan every run: eleven rooms, the start room with the treasure room and the way down beside it, and eight rooms around them in a ring. The plan is a character grid with one template per cell (`TUTORIAL_LAYOUT`).
- **Two layouts of the same rooms.** While the player's current page is 1, the rooms hold their exercises (the **teaching layout**). From page 2 on, every run is carved in the **easy layout**: six of the rooms have their work already done, crossed on foot with no block to place or break ([EASY-LAYOUT](../roots/EASY-LAYOUT.md)).
- **Open doors.** Every door opens. Doors never lock, never seal, and the way down is a plain door. A locked vault becomes a treasure door.
- **The book on the walls.** Each room has two panels, on its north and south walls beside the doors, so the player reads whichever way they come in. Pages 1 to 6 are the tutorial; the page moves on each time a run ends after the player has walked every room, and a lap of the ring, forward or in reverse, leafs through the pages reached ([PAGES](../roots/PAGES.md)). The text is drawn in the player's language and redrawn when the language changes. The tutorial is never an overlay.
- **The page stone.** From page 7 a square of limestone in the start room's north wall shows the page number ([PAGES §4](../roots/PAGES.md#4-the-page-stone)).
- **Eleven rooms, each with its lesson.** In order of the ring from the start: the start room (moving); the step room (a step); the dig room (intentions, the wall and its plug); the mend room (good and bad intentions); the pit (a way out of a trench); the bridge; the seal (bombs); the crates (kicking cubes); the spring (water, fire and lava); the treasure room (the practices); and the way down.
- **Two practices.** The treasure room offers a practice of quality up to 3 from one free chest, with the Boundary standing above it: approach opens the Sanctuary, where a quick reward or a completed meditation opens the chest; cancelling leaves it closed until the player steps away and returns. The way down offers a practice of quality up to 4 from its pedestal. These two are the same at every mastery level.
- **Loose rewards that grow with mastery.** A new run lays the Roots' loose keys, bombs, hearts, free chests and extra practices by the Roots' mastery level, which is the number of achievements unlocked ([REWARDS](../roots/REWARDS.md), [MASTERY](../../progression/MASTERY.md)). At level 0 the floor lays one key or one bomb.
- **Peaceful creatures.** The roots hold no projections. Wonder (a paper moth of curiosity that keeps you company), Rootling and Mossling wander the rooms, and they do not attack.
- **Rest with a Mossling.** Stand still within about two and a half blocks of a Mossling for three seconds and it rests with you: you heal a quarter of a heart, once for each Mossling.

## Rules that hold on the roots

- Lava and fire never appear here (they can hurt, and the validator keeps them off the tutorial). Water is allowed: the spring room shows it.
- The validator checks each room like every other room (three tiles in front of each door walkable, a centre open, the pedestal reachable), and the easy rooms must be crossable on foot.
- Breaking blocks drops nothing but the block. The loose loot of the floor is what the mastery level lays, never what a block gives.
- Generation never reads the save: the page and the mastery level reach the floor only through the run's start.

## Not built here

- A climb from the roots to the surface is not built. Above the roots lies dirt, then the grass at height 167. The player can dig or build through the dirt, but there is no stair or shaft (see [ROUTE-FROM-ROOTS](../../../not-built/levels/ROUTE-FROM-ROOTS.md)).
- The room chests that the design plans for the roots are not built beyond the free chests of the mastery table (see [ROOT-CHESTS](../../../not-built/chests/ROOT-CHESTS.md)).
- The hidden book's pages 7 to 9 and their quotation await the owner ([HIDDEN-BOOK](../../../not-built/levels/roots/HIDDEN-BOOK.md)); their panels are in the book files and show on their pages.
- The Gardener, a presence the design planned for the roots, is not built; it is described with the bestiary's presences, not here.

Code: `src/world/floorplan.ts` (the tutorial plan), `src/content/rooms.ts` (the roots templates, the easy twins and `rootsRoomKey`), `src/world/floor.ts` (no projections, open doors, the loose loot by mastery and the easy layout), `src/content/book/` (the book), `src/render/tablets.ts` (the panels), `src/game/roots-keeper.ts` (the run's walls and layout), `src/content/tables/roots-mastery.ts` (the mastery table), `src/content/creatures/index.ts` (the roots' creatures), `src/game/game.ts` (the Mossling rest).
