# Panels: four layouts on one limestone slab

Up: [the Roots as an evolving tutorial](README.md) · Status: decided (owner, issue #147, decision 5: panels stay on the walls, where they are and about the same size, never an overlay; three layouts on the same limestone slab; a fourth, `quote`, added by the owner on 2026-11-12: "a panel type for quotes from other books"). The geometry below is a proposal for the art agent and the owner to confirm through the art gate (`sotano-art`). **Renderer built** (package C1, `src/render/tablets.ts`, `src/render/panel-layout.ts`, `src/render/page-stone.ts`; review in `?gallery=book`, captures in [ART-GUIDE §15](../../../../art/ART-GUIDE.md#15-as-built-art-pass-2026-10-26)); the game reads the book since package D1 (`src/game/roots-keeper.ts`, `game.ts`). Where the build changed this geometry, the section says so and why.

Every panel is a stone tablet on a wall of a room of the Roots, as today (`src/render/tablets.ts`). What changes: the canvas doubles to **896 × 512**, the two panels of a room can differ, and a panel has one of four layouts. The tablet's size in the world stays **3.7 × 2.1 blocks**.

## 1. The slab (shared by every layout)

All colours are palette tokens; no other colour is used.

| Part | Rectangle (x, y, w, h) on the 896 × 512 canvas | Token |
|---|---|---|
| Border | 0, 0, 896, 512 | `limestone.dark` |
| Face | 16, 16, 864, 480 | `limestone.base` |
| Light edge (top, left) | 16, 16, 864, 8 and 16, 16, 8, 480 | `limestone.hi` |
| Bevel (bottom, right) | 16, 488, 864, 8 and 872, 16, 8, 480 | `ink.bevel` |
| Ink (titles, text, frames) | | `ink.line` |
| Second ink (subtitles, verbs, page number) | | `ink.bevel` |
| Mark (the diamond, the margin line) | | `light.gold` |

Fonts: the sans is `system-ui, "Segoe UI", sans-serif` (as today); the serif of the prose is `Georgia, "Times New Roman", serif`. Text is drawn in the player's language and redrawn when the language or the device changes (as today). Gold stays an accent: it never carries words.

Contrast on the face (`limestone.base`, #A39C93): `ink.line` about 6.8 : 1, `ink.bevel` about 4.7 : 1. Both pass for text at these sizes.

## 2. `lesson`: image, title, short text, the control as a key cap

| Element | Geometry | Style |
|---|---|---|
| Image frame | 40, 40, 280, 432 (4 px `ink.line` border); image area 44, 44, 272, 424 | Cover-fit, centred crop |
| Diamond | centre (356, 74), half-diagonal 12 | `light.gold` |
| Title | x 380, top 48, max width 476, one line | bold sans 52 px; shrinks in 2 px steps down to 40 px to fit |
| Rule | 352, 116, 504, 4 | `ink.bevel` |
| Text | x 352, top 136, width 504, line height 44, at most 5 lines | sans 34 px, `ink.line`; sentence case after placeholders are filled (as today) |
| Key cap (if `key`) | x 352, y 384, height 80, width = label width + 48, clamped to 80…280; corner radius 12 | fill `limestone.hi`, 4 px `ink.line` border, 6 px `ink.bevel` inner shadow at the bottom; label bold sans 36 px (down to 24 px to fit), centred |
| Verb (if `key`) | x = right edge of the cap + 20, centred on the cap, max width to x 856 | bold sans 30 px, shrinks down to 22 px, `ink.bevel` |

The key cap shows the control of the device in use: `keycap.<action>.key`, `.pad` or `.touch` (short labels, new message keys, see [BOOK-DATA](BOOK-DATA.md#key-caps)). The verb beside it is `keycap.<action>.verb` ("switch", "jump"…). On touch, the polarity cap draws the existing half-turn glyph (`halfTurn` in `tablets.ts`) instead of a label, in `ink.line` on a cap 150 px wide (gold on the pale cap did not hold). Without `key`, the area under the text stays empty: the text keeps its five lines.

## 3. `plate`: a bestiary portrait, name, kind, text and a note

For creatures, projections, bosses, presences, potions, foods, hearts and practices.

| Element | Geometry | Style |
|---|---|---|
| Portrait frame | 40, 40, 360, 432 (4 px border); area 44, 44, 352, 424 | Cover-fit, centred crop for screenshots; icons are scaled by whole multiples (nearest neighbour), centred on a `limestone.hi` field |
| Diamond | centre (444, 74), half-diagonal 12 | `light.gold` |
| Name (`title`) | x 468, top 48, max width 388, one line | bold sans 48 px, shrinks down to 32 px |
| Kind (`subtitle`) | x 432, top 108, width 424, one line | italic sans 28 px, `ink.bevel`, shrinks down to 22 px |
| Rule | 432, 150, 424, 4 | `ink.bevel` |
| Text | x 432, top 170, width 424, line height 40, at most 5 lines | sans 30 px |
| Note | small diamond centre (442, 424), half-diagonal 8; text x 458, top 408, width 398, one line | bold sans 24 px, shrinks down to 20 px |

## 4. `prose`: the book

| Element | Geometry | Style |
|---|---|---|
| Margin line | 64, 48, 6, 416 | `light.gold` |
| Text | x 96, top 56, width 744, line height 44, at most 8 lines | serif 32 px, `ink.line` |
| Page number | centred on x 448, top 436 | bold serif 30 px, `ink.bevel`, between two small gold diamonds at (404, 452) and (492, 452) |

When the text begins with a letter, that letter is a drop cap two lines high (bold serif 92 px, `ink.line`) and the first two lines start after it (its width + 12): the book opens like a book. The page number is the page's position in the book; it is drawn by the renderer, never written in the data.

## 4b. `quote`: someone else's voice

A quotation from another book: the quoted words, who wrote them and where. It must read at a glance as **another voice**, not as the book's own prose, so it changes everything the prose keeps: a paler inset page instead of the bare face, italic instead of upright, a large gold opening mark instead of the gold margin line, an attribution under the text, and no page number.

| Element | Geometry | Style |
|---|---|---|
| Inset page | 40, 34, 816, 424, with a 2 px `ink.bevel` border and a soft `limestone.dark` shadow along its top and left | fill `limestone.hi` |
| Opening mark | the glyph “ at x 52, top 30 | bold serif 96 px, `light.gold` with a 3 px `ink.bevel` keyline (a glyph, never words) |
| Text | x 112, top 58, width 712, line height 38, at most 9 lines (to 390) | italic serif 28 px, `ink.line` |
| Author | right-aligned at x 824, top 398, one line, drawn as "— Author" | bold sans 26 px, `ink.line`, shrinks down to 20 px |
| Source | right-aligned at x 824, top 428, max width 440, one line: "Work · Publisher, Year" (publisher and year only if given) | italic sans 22 px, `ink.bevel`, shrinks down to 18 px |
| Translation note | left-aligned at x 64, top 430, max width 300, one line; only when the book's language is not the quotation's original language | sans 20 px, `ink.bevel`: `book.quote.translated` ("Our translation" / "Traducción nuestra") |

Changed in the build (C1): the first proposal's page ran to y 472, and the mason's mark (§10) then crossed its lower border; the page now ends at 458 and everything on it rose by 6 to 18 px, so the mark sits on the bare face under it. The opening mark gained an ink keyline because gold alone faded on the pale page.

At 28 px a line holds about 54 characters, and nine lines hold about 440 after word-wrap losses: one quotation of up to 440 characters fits one panel at a readable size. A longer quotation does not run over two panels (the two panels of a room face opposite walls and cannot be read as one text); it is cut by the owner or split across two book pages.

**The original language is the source.** In the file of the quotation's original language (`lang`), `text` is the quotation exactly as printed, never shortened or reworded. In the other file, `text` is the game's own faithful translation, and the panel shows the translation note. Author, work, publisher, year and `lang` are facts and are identical in both files.

**Every quotation's source is recorded** in `docs/lore/SOURCES.md` (id, author, work, publisher, year, naming status, what the game quotes and where), per `sotano-lore`, in the same change that adds it to the book.

## 5. Character budgets

Every text in both languages must fit its budget. A budget counts characters after each `{placeholder}` is replaced by the **longest** label that control has on any device in that language. The book test enforces the budgets ([BOOK-DATA](BOOK-DATA.md#validation)); the gallery check in the browser enforces the real fit (no text past its last line).

| Layout | Field | Budget | Lines |
|---|---|---|---|
| lesson | `title` | 22 | 1 |
| lesson | `text` | 120 | ≤ 5 |
| plate | `title` | 22 | 1 |
| plate | `subtitle` | 30 | 1 |
| plate | `text` | 110 | ≤ 5 |
| plate | `note` | 30 | 1 |
| prose | `text` | 320 | ≤ 8 |
| quote | `text` | 440 | ≤ 9 |
| quote | `author` | 40 | 1 |
| quote | `work` | 48 | 1 |
| quote | `publisher` | 32 | 1 |
| quote | source line ("Work · Publisher, Year" as drawn) | 60 | 1 |
| quote | `book.quote.translated` (message key) | 24 | 1 |
| key cap | `keycap.<action>.<device>` | 14 | 1 |
| key cap | `keycap.<action>.verb` | 14 | 1 |

The six tutorial pages and the three book pages are inside every budget in both languages today (longest Spanish lesson text: 120; plate text: 106; note: 30; prose: 235).

## 6. Where each panel hangs

The mounts are data: one table per **layout variant** of the Roots' rooms (`MOUNT_TABLES` in `src/render/panel-layout.ts`, `panelMount(room, side, x0, y0, z0, layout)`), a default for each side plus the rooms whose own exercise asks for another place. Two variants exist, named as the book's layouts: `teaching` (today's rooms) and `easy` (the standard mount in every room, EASY-LAYOUT §5). A further set of room templates adds its own table, and `Tablets.mountRoom` takes the variant. For `teaching`, as today: the **north** panel on the north wall, west of the door (centre `x0 + 2.0`, `y0 + 2.0`, `z0 + 0.02`, facing south); the **south** panel on the south wall, east of the door (centre `x0 + 11.0`, `y0 + 2.0`, `z0 + 6.98`, facing north). Size 3.7 × 2.1 blocks.

Three rooms hide part of their panels behind their own exercise today. The geometry of the rooms does not change; the panels move a little (proposal, [open question 5](OPEN-QUESTIONS.md)):

| Room | What hides it today | Mount for this design |
|---|---|---|
| `roots-step` | The two-high brick walls (columns 3 and 9) cover the lower right of the north panel and the lower left of the south panel | Both panels rise to centre `y0 + 3.1` (bottom at `y0 + 2.05`, top at `y0 + 4.15`, under the ceiling at `y0 + 5`). Same size |
| `roots-seal` | The obsidian walls (columns 3 and 9, four blocks high) cover the right quarter of the north panel and the left quarter of the south panel | Each panel shrinks to 2.85 × 1.63 blocks and moves into its strip: north centre `x0 + 1.475`, south centre `x0 + 11.525`, both at `y0 + 2.0` |
| `roots-dig` | The full-height brick wall (row 1 after the flip) stands one block in front of the north panel | Kept as it is: the north panel is seen only after breaking through, and the design uses it as a small secret ([TUTORIAL-PAGES](TUTORIAL-PAGES.md)) |

## 7. Which wall holds the lesson

A player walking the ring forward faces one wall on entering each room. That wall holds the room's lesson on every tutorial page; the other wall holds plates and the lessons that change from page to page. The owner asked for "the south panels for bestiary plates"; taken literally, that would put the lesson behind the player in six of the eleven rooms, so the design follows the intent (the bestiary taught on the walls) and keeps each lesson where it is read first. [Open question 1](OPEN-QUESTIONS.md).

| Room | Entered forward from | Lesson wall | Plate wall |
|---|---|---|---|
| `roots-hall` | (spawn, facing north) | north | south |
| `roots-step` | west | north | south |
| `roots-dig` | south | south (the north panel is behind the wall) | north |
| `roots-mend` | south | north | south |
| `roots-pit` | south | north | south |
| `roots-bridge` | east | north | south |
| `roots-seal` | east (into the east strip) | south | north |
| `roots-crates` | north | south | north |
| `roots-spring` | north | south | north |
| `roots-gift` | north | south | north |
| `roots-door` | north (from the start room) | south | north |

On page 2, two plate-wall slots stay as page 1 has them because they belong to their room: the Sanctuary in `roots-gift` and the "come back" panel in `roots-door`, which leaves nine changing slots, all on plate walls. Pages 3 to 6 change **all 22** (owner, 2026-11-13): there the lesson wall too holds that page's panel, the order of reading (the lesson wall first, then the other) is the order of the page, and the treasure and way-down rooms keep panels that do not contradict their chest and their way down ([TUTORIAL-PAGES](TUTORIAL-PAGES.md)).

## 8. Images

Images are ids, never paths ([BOOK-DATA](BOOK-DATA.md#images)). The renderer draws a panel only when its image is loaded: the panels of the shown page are loaded during the dark of the run's start fade (the game already builds the run in the dark and reveals it only when the world is meshed), and the panels of the pages next to it are loaded in the background so a browse never waits. An image that fails to load never breaks a panel: the panel draws a neutral hatched placeholder in its frame, the console warns once, and `?gallery=book` outlines the panel and lists the image (the captures arrive in batches, package B5). The renderer's cache (`panelImages`) keeps every loaded image for the session; `panelImages.preloadPage(book, page)` loads the 22 slots of a page.

## 9. The art gate

The look of the four layouts, the key cap, the verb and the page stone is new art: it is made by the dedicated art agent (`sotano-art` §0) and passes the gate (captures in colour, greyscale and the three colour-blindness filters, and at distance in the room) before it ships. The `?gallery` gets a section that draws every panel of every page in both languages and on every device, and flags any text that does not fit.

## 10. The panel id: the mason's mark

Every panel carries its id (`1-hall-n`, `3-pit-s`, `7-gift-n`; [BOOK-DATA §2](BOOK-DATA.md#2-fields)). The renderer draws it **very small in a lower corner of the slab**, like a mason's mark cut into a block: a few pixels inside the face, in `ink.bevel`, never over the text, the image, the key cap or the page number. As built: bold sans 13 px, right-aligned at x 864 on the baseline 478, `ink.bevel` at 85 % with the pale lip of carved text. It is for the builder and the owner, who read a panel by its place, and it is not text for the reader: it takes no budget and needs no translation. Both languages show the same mark, because the ids are the same in both files.
