# Pages: advancing, browsing and turning out of sight

Up: [the Roots](README.md) · Status: built (issue #147). The rules are in `src/game/roots-book.ts` (no DOM, no Three.js), the run's walls and the record in `src/game/roots-keeper.ts`, the wiring in `src/game/game.ts`. Tests: `tests/roots-book.test.ts`, `tests/roots-book-game.test.ts`.

The walls of the Roots show one page at a time. A page is a set of panels for some of the 22 slots; any slot a page leaves out shows page 1's panel, so the lessons never leave the walls. In the easy layout, five slots whose page-1 lesson describes an exercise that is gone show a remembered panel instead of page 1's ([EASY-LAYOUT §4](EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2)). Page 2 fills nine slots; pages 3 to 6 fill all 22, so on them every wall reads that page and nothing falls back ([BOOK-DATA §1b](BOOK-DATA.md#1b-which-pages-fill-which-slots-owner-2026-11-13)); the book pages (7 on) fill a few. Pages 1 to 6 are the tutorial. Page 7 is the first page of the hidden book.

The current page also decides the shape of the rooms: page 1 is carved in the teaching layout, page 2 and later in the easy layout, read once at run start ([EASY-LAYOUT](EASY-LAYOUT.md)). The geometry changes once, between the run that reaches page 2 and the next.

## 1. The current page

- Kept between runs in the save record (`roots.page`, see [SAVE](../../progression/SAVE.md)). A new player starts on page 1.
- **It advances by exactly one when a run ends and, in that run, the player visited every one of the eleven rooms of the Roots.** Otherwise it stays.
  - A room counts as visited when the player enters it (the game's room-enter moment), at any time in the run. Rooms visited stay counted after the player goes down: a run that walked the whole Roots and ended on floor 6 advances the page.
  - **A run ends** when the player dies (the moment the death screen opens), or when a new run replaces it: R, "New run" on the pause card, or a new seed. The advance is decided once per run, at the first of these moments; a death followed by R advances once.
  - The sandbox and the lab never advance the page. Closing the tab is not a run end.
  - Browsing (section 2) never changes the current page.
  - Sky plants play no part here.
- **The cap.** The current page never goes past the last page in the book files. A player on the last page stays there; when the owner adds pages, the next qualifying run moves on to the first new one. (The issue asked to wrap to page 1 after the last page; the owner's decision "never beyond the current page" and a book that grows by hand gave a cap. Open: [question 2](../../../not-built/levels/roots/OPEN-QUESTIONS.md).)
- If the save holds a page higher than the book has (pages removed), the walls show the last page and the save keeps its number.
- **The event.** When a run's end advances the current page, the game emits `pageReached { page }` with the new page number, once. Four achievements listen to it: pages 7, 54, 69 and 100 ([ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md#book-pages-4)). Because the page advances by exactly one and never past the last page, an achievement for page N can be earned only once the book has at least N pages: the book has 9 pages, so 54, 69 and 100 wait for the pages the owner will write.

## 2. Browsing: laps of the ring

- At the start of a run, the shown page is the current page.
- **A full lap forward shows the next page**, if the shown page is lower than the current page; at the current page a forward lap does nothing.
- **A full lap in reverse shows the previous page**, down to page 1; on page 1 it does nothing.
- Browsing changes only the panels and the page stone. It never changes rewards or the layout of the rooms, and it is not saved: the next run starts on the current page again. A player on page 3 who browses back to page 1 reads page 1 in the easy rooms, with the remembered panels where page 1's lessons would describe an exercise the room no longer holds ([EASY-LAYOUT §6](EASY-LAYOUT.md#6-browsing-in-the-easy-layout)).

### What a lap is (the rule a test can check)

The game keeps two numbers for the run: `last`, the last ring room the player entered, and `steps`, a signed count.

1. When the player enters a room of the Roots:
   - If it is the way down (`roots-door`), nothing changes.
   - If `last` is not set, set `last` to this room.
   - If it is the **next** room after `last` in forward order, add 1 to `steps`.
   - If it is the **previous** room before `last`, subtract 1 from `steps`.
   - If it is any other ring room (the player dug through rock or fell between rooms), set `steps` to 0.
   - Set `last` to this room.
2. When `steps` reaches +10, a forward lap is complete: show the next page (if allowed) and set `steps` to 0.
3. When `steps` reaches −10, a reverse lap is complete: show the previous page (if allowed) and set `steps` to 0.
4. Leaving the Roots (going down) leaves both numbers as they are; climbing back and walking on continues the count.

Because the count is net, walking back and forth does not complete a lap; going all the way round once does, from any room. A lap that is only nine rooms (a shortcut dug through the rock) resets.

## 3. Panels change only out of sight

A room's panels are re-carved for a new shown page only while **the player's current room is not in that room's sight set**. Until then the room keeps the page it was showing. A panel is therefore never seen changing, and no blank, mixed or half-drawn panel is ever shown: a panel is drawn in full to its canvas before its texture is swapped, and the swap happens only under the rule above.

**The sight set** of a room is the room itself and every room joined to it by a straight line of open doors (same row or same column of the plan, each pair in the line linked). Neighbours alone are not enough: from `roots-dig`, looking north through the open doors of `roots-mend`, the player can see the right edge of the north panel of `roots-pit` (doors are three blocks wide and rooms seven deep, so a sight line through two doors spreads about 2.3 blocks into the third room, and the panel reaches 3.85 blocks from the corner).

The sight sets of the Roots, from the plan:

| Room | Sight set |
|---|---|
| `roots-hall` | hall, gift, step, door |
| `roots-step` | step, hall, gift, dig, mend, pit |
| `roots-dig` | dig, step, mend, pit |
| `roots-mend` | mend, step, dig, pit |
| `roots-pit` | pit, step, dig, mend, bridge, seal |
| `roots-bridge` | bridge, pit, seal |
| `roots-seal` | seal, bridge, pit, crates, spring, gift |
| `roots-crates` | crates, seal, spring, gift |
| `roots-spring` | spring, seal, crates, gift |
| `roots-gift` | gift, seal, crates, spring, hall, step |
| `roots-door` | door, hall |

The sets are computed from the plan, not written by hand, so a test checks them against this table. They are the same in both layouts: the plan and its doors do not change, and the sets assume every line of doors open. A hole the player digs through a wall is not part of the rule; a second guard covers it: a panel is also never re-carved while it lies inside the camera's view frustum.

What the player sees after a forward lap that ends in the start room: the rooms out of sight of the start room (dig, mend, pit, bridge, seal, crates, spring) turn at once; the step room, the treasure room and the way down turn as soon as the player has walked out of their sight. The page turns behind the player, never in front of them.

## 4. The page stone

From page 7 on, one block in the start room shows the shown page's number.

- **Where:** the wall block in the middle of the start room's north wall (column 6 of `roots-hall`, the first block of the wall, at height `y0 + 2`), on its face toward the room. The start room has no north door, so this block is always wall.
- **What:** a square of limestone set in the block's face, the number cut in ink in the serif of the prose panels, with the gold diamond above it (the palette of [PANELS](PANELS.md)). It is a decal on the block's face, not a new block: the geometry does not change.
- **When:** it shows a number only while the shown page is a book page (`kind: "book"`); on tutorial pages the block is plain. It changes under the same rule as the start room's panels (section 3).
- If the player breaks the block, the stone goes with it until the next run.

## 5. What the player learns about all this

Nothing is explained by a menu. The door room's north panel on page 1 says that the Roots remember and that walking every room before leaving lets the walls say more ([TUTORIAL-PAGES](TUTORIAL-PAGES.md)). The page stone appears when the book begins. Browsing is a secret a curious player finds by walking the ring backwards.

## Not decided

The cap instead of a wrap, which run endings count, and the page stone's place are the owner's to confirm; each has the default built here. See [the open questions](../../../not-built/levels/roots/OPEN-QUESTIONS.md): 2, 3 and 4.
