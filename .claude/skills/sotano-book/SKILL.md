---
name: sotano-book
description: The Roots' book and its wall panels. Use it EVERY time a wall panel of the Roots, a tutorial page or a page of the hidden book is added, changed or removed, or a panel image is added or recaptured (for example when the owner says "change panel 3-pit-s"). Covers how the book works for the player, the two JSON files, panel ids, the four layouts and their character budgets, placeholders and key caps, quotations, images (where they live, sizes, capture), how to check a change, the owner's writing rules and step-by-step recipes. Also use sotano-i18n (both languages), sotano-art (anything visible), sotano-lore (quotations, names), sotano-levels (the Roots' rooms) and sotano-docs.
---

# The Roots book skill

The eleven rooms of the Roots (floor 0) carry **22 stone panels**, a north and a south one per room. Together they are a book: pages 1 to 6 teach the game, and from page 7 the walls show the **hidden book**, the game's own voice. Everything a panel says is data in two JSON files, checked by a validator; the renderer carves it into the stone.

Design, for depth (built in `docs/design/built/levels/roots/`; what is still open in `docs/design/not-built/levels/roots/`): [BOOK-DATA](../../../docs/design/built/levels/roots/BOOK-DATA.md) (the files, fields, images, key caps, validation), [PANELS](../../../docs/design/built/levels/roots/PANELS.md) (the look, §5 budgets), [PAGES](../../../docs/design/built/levels/roots/PAGES.md) (advance, laps, out of sight, the page stone), [TUTORIAL-PAGES](../../../docs/design/built/levels/roots/TUTORIAL-PAGES.md), [HIDDEN-BOOK](../../../docs/design/not-built/levels/roots/HIDDEN-BOOK.md), [EASY-LAYOUT](../../../docs/design/built/levels/roots/EASY-LAYOUT.md).

## 1. How the book works for the player

- **The current page** is saved between runs (`roots.page` in the save, `src/game/meta.ts`). A run's end (death, R, a new run, a new seed) **advances it by one when every room of the Roots was entered in that run** and it is below the last page of the files. Once per run, saved at once (`RootsBook.endRun`, `RootsKeeper.endRun`).
- **Pages 1 to 6 are tutorial pages; page 7 is the first page of the book** (`FIRST_BOOK_PAGE` in `src/game/roots-book.ts`). Reaching page 7 is an achievement (`sotano-achievements`).
- **Browsing by laps.** A run starts showing the current page. Ten net steps forward around the ring of ten rooms (`LAP_STEPS`; forward is from the start room east into the step room) turn the walls one page on, never past the current page; ten back turn one page back, never below 1. A step to a room that is not a ring neighbour resets the count.
- **Panels never change in sight.** A room keeps the page it shows while the player is in it or in a room joined to it by a straight line of open doors, or while the camera sees it (`RootsBook.wallPage`).
- **Two layouts.** With the current page at 1 the Roots are carved in the **teaching** layout (each room holds its exercise: a wall to dig, a pit, a bridge…). From current page 2 on they are carved in the **easy** layout, fixed for the whole run. So **every panel of page 2 and later is only ever seen in the easy rooms**. In the easy layout five slots whose page-1 lesson names an exercise the easy room no longer holds show a **remembered panel** where a page leaves the slot out (the `easy` object of the files, ids `easy-<room>-<n|s>`): `roots-step` south, `roots-dig` south, `roots-pit` north, `roots-bridge` north, `roots-seal` south. Since pages 3 to 6 fill every slot, a remembered panel now shows only on page 1 browsed back to, on page 2 and on the book pages.
- **The page stone** in the start room shows the page number on book pages (7 on) and is hidden on tutorial pages (`RootsBook.pageStone`, drawn by `src/render/page-stone.ts`).

### Which pages fill which slots (owner's rule)

- **Page 1** fills all 22 slots (the validator requires it).
- **Page 2** changes the nine plate walls: the south or north wall of every room except `roots-gift` (the Sanctuary) and `roots-door`, which belong to their room. The owner likes page 2 as it is.
- **Pages 3 to 6 fill every one of the 22 slots**, so no panel repeats from an earlier page (owner, 2026-11-13). Each page reads in ring order, the wall faced first in each room, then the other: it opens in the hall and closes by the way down; the treasure room keeps making sense with its Sanctuary chest and the way-down room with its way down. Slot by slot, with the code each fact rests on: TUTORIAL-PAGES. `tests/book.test.ts` checks the rule in both languages. A change to one of these pages keeps all 22 slots filled.
- **A book page (7 on) may fill any slots** and usually fills one or two.
- **The fallback** is what the code does for a slot a page leaves out (`panelAt` in `src/content/book/index.ts`): (1) the page's own panel, from page 2 on; (2) in the easy layout, the slot's remembered panel; (3) page 1's panel. A page 3 to 6 that fills every slot never falls back; a book page falls back on every slot it leaves out.

## 2. The two files

`src/content/book/book.en.json` and `src/content/book/book.es.json`. **Both always change together**, in the same commit: same pages in the same order, same page `id` and `kind`, same slots, and in each slot the same `layout`, `id`, `image`, `key` and the same set of fields (for a quote also `author`, `work`, `publisher`, `year`, `lang`). **Only the words differ.** Shape: `{ "version": 1, "language": "en", "pages": [ { "id": "tutorial-3", "kind": "tutorial", "panels": { "roots-pit": { "south": { …panel… } } } } ], "easy": { "roots-pit": { "north": { … } } } }`. Rooms: `roots-hall, -step, -dig, -mend, -pit, -bridge, -seal, -crates, -spring, -gift, -door` (`ROOM_KEYS`). Sides: `north`, `south`.

## 3. The panel id

Every panel carries a small unique id: **`<page>-<room without roots->-<n|s>`**, e.g. `3-pit-s` is page 3, room `roots-pit`, south wall. Remembered panels: `easy-<room>-<n|s>` (e.g. `easy-pit-n`). The id is the panel's position: the validator refuses an id that does not match its page, room and side (`panelIdOf`, `easyPanelIdOf`), so **moving a panel means changing its id**.

- **On the slab** the id is carved small, as a mason's mark, at the bottom-right corner (`masonMark` in `src/render/tablets.ts`). The owner reads it in the game and names the panel by it.
- **To find it:** search the id in both JSON files (`"id": "3-pit-s"`); in code, `panelById(book, id)`; in the browser, `?gallery=book&id=3-pit-s`.

## 4. The four layouts, their fields and budgets

Budgets are **characters, in both languages**, enforced by the validator (`BUDGET` in `src/content/book/index.ts`), with **every `{placeholder}` counted at its longest label** on any device in that language.

**`lesson`**: a mechanic, with a capture and optionally a key cap. Fields `id`, `title` (22), `text` (120), `image`; optional `key`. From `book.en.json`:
```json
{ "id": "1-hall-n", "layout": "lesson", "title": "The roots", "text": "Everything down here is made of blocks. Throw an intention at one and see what happens.", "image": "lesson/blocks", "key": "cast" }
```

**`plate`**: a creature, boss, item or potion, with a portrait or icon. Fields `id`, `title` (22), `subtitle` (30), `text` (110), `image`; optional `note` (30).
```json
{ "id": "3-pit-n", "layout": "plate", "title": "Resistance", "subtitle": "A boss · floors 1–2", "text": "A door that walks. It comes at you and rams, and what it rams breaks.", "image": "bestiary/resistance", "note": "Leaves a practice." }
```

**`prose`**: the hidden book's own voice, with its page number. Fields `id`, `text` (320). No image.
```json
{ "id": "7-hall-s", "layout": "prose", "text": "You came down into the basement of your own mind. Down here, what you set your will on changes. Every wall was something you built to stay safe. Once it kept you safe. Now it keeps you small, and you are allowed to break it." }
```

**`quote`**: someone else's words, **only on a book page**. Fields `id`, `text` (440), `author` (40), `work` (48), `lang`; optional `publisher` (32), `year` (1000 to this year). The drawn source line "Work · Publisher, Year" ≤ 60.
```json
{ "id": "7-gift-n", "layout": "quote", "text": "Authenticity is not changing what one is, and marking out what one has. It is the capacity to show oneself just as one is, without hiding. What is authentic is, and has worth. Authenticity is not trying to be better. That is a sense of duty, an obligation, an order, a façade. True authenticity is showing oneself, without judgement, without fear of being disqualified.", "author": "Guillermo Borja", "work": "La locura lo cura (extractos)", "publisher": "Editorial La Llave", "year": 1995, "lang": "es" }
```

Every string: not empty, no `<` or `>`, no leading, trailing or double space. A budget fits the validator, not always the stone: wide letters can still overflow, so the gallery check (section 8) is the real fit.

## 5. Placeholders and key caps

- **`{action}`** in the `text` of a lesson or plate only: it is replaced with the control's label on the player's device, in the book's language (`controls.<action>.key|pad|touch`). Allowed: the lesson controls of `LESSON_CONTROLS` (`src/input/labels.ts`) plus `drink`. Budgets count the longest label: `{cast}` counts as "The bead of light (hold; drag to aim)", 37 characters in English, so a lesson text with `{cast}` has about 86 left.
- **`key`** on a lesson draws a key cap: the control on the player's device and a verb. Allowed: `move, jump, cast, polarity, place, throw, bomb, drink, inventory` (`KEY_ACTIONS`). Its labels are message keys `keycap.<action>.key|pad|touch|verb`, each ≤ 14 characters in both languages (BOOK-DATA §5). A key cap labels an existing binding; a new control goes through `sotano-controls` first.

## 6. Quotations

- **The original text** goes in the file of its language; **our translation** in the other file. `lang` is the original language in both files; when the reader's language differs, the panel adds the note `book.quote.translated` ("Our translation" / "Traducción nuestra").
- `author`, `work`, `publisher`, `year` are the same in both files (the work keeps its original title).
- **The source is recorded in `docs/lore/SOURCES.md`** in the same change (id, author, work, publisher, year, naming status, what is quoted and where), per `sotano-lore`. Example row: `la-locura-lo-cura`.
- Quote slots are on book pages only; the validator refuses a quote on a tutorial page or among the remembered panels. By convention the first one hangs on `roots-gift` north.

## 7. Images

An image is an **id**, never a path (`src/content/book/images.ts`, `resolveImage`, `knownImageIds`):

| Id | Draws | File |
|---|---|---|
| `lesson/<name>` | a capture of a mechanic; `<name>` in `LESSON_IMAGES` | `public/book/lesson/<name>.webp`, 960 × 540 (crops of HUD elements are 3× their on-screen size) |
| `bestiary/<entity id>` | a portrait; the id in `BESTIARY_PORTRAITS` | `public/book/bestiary/<id>.webp`, 512 × 512 |
| `icon/item/<id>`, `icon/potion/<id>`, `icon/heart/<kind>` | the game's own icon art | nothing to capture |

- **Every file is a WebP under 60 KB** (`tests/book-images.test.ts`); the capture scripts step the quality down until it fits.
- **The frame crops the centre.** The image is cover-fitted into a portrait window (lesson 272 × 424 px, plate 352 × 424 px on the 896 × 512 slab), so of a 960 × 540 lesson capture only about the **central third of the width** shows. Keep the lesson in the middle of the frame.
- **Capturing.** Lessons: `npm run book:captures -- <name>` (`scripts/book-captures.mjs`; each lesson is an entry of `LESSONS` there: a staged sandbox room, an optional lab script and prep, the eye and the point it looks at; fixed seed and step, so a re-run gives the same file). Portraits: `npm run bestiary -- --portrait <id>` (`scripts/bestiary-capture.mjs`). Both need Playwright with Chromium.
- **Look at every image** after capturing (open the WebP, then the panel in the gallery): the lesson must be visible inside the crop, true to what the game does today, and readable at panel size.
- **Pending images.** Lesson ids the sandbox cannot stage (or nobody has captured) yet are listed with their reason in `PENDING` in both `scripts/book-captures.mjs` and `tests/book-images.test.ts` (the two lists must match; that is where the truth is). Portraits not captured yet are in `PENDING_PORTRAITS` in `tests/book-images.test.ts` and `scripts/bestiary-capture.mjs`; the sky's portraits (`guardian-*`, `herd-*`) are in the script's `SKY_PORTRAITS` and are framed by the sky route of portrait mode (the real game on the sky seed, paused, at rest). BOOK-DATA §4 says, one line each, what every pending image must show. **A pending id must have no file**; a panel using it draws a neutral placeholder (pale stone, hatching, an empty diamond, no words) and the gallery flags it yellow. Never fake a pending image with a different scene; to capture one, stage it, write the file and remove the id from both `PENDING` lists.
- **Every file is used** by a panel and every used id has a file (the test checks both ways), so a removed panel may leave an image to delete, and a new image needs a panel.

## 8. How to check a change

1. `npx vitest run tests/book.test.ts tests/book-images.test.ts tests/tablets.test.ts`: the validator lists **every** problem at once (budget, id, shape mismatch between languages, unknown image, placeholder).
2. **The gallery**: `npm run dev`, open `?gallery=book` (filters: `&lang=en|es`, `&device=keyboard|gamepad|touch`, `&page=3`, `&id=3-pit-s`, `&scale=1`). Every panel of every page is carved by the game's renderer in both languages, and on keyboard, gamepad and touch when it has a key cap or a placeholder. A panel outlined **red** overflows (named in the summary); **yellow** has a missing image. `window.__book` holds the same lists for scripts. Look at the panel in **both languages and all three devices**. The gallery shows the pages' own panels; the remembered panels (`easy`) are not in it, so check those in the game.
3. **The real game**: `S.roots(3)` then `S.restart()` starts on page 3 (in memory, never saved); walk to the panel. Page 2 and later are in the easy layout.
4. `npm run typecheck && npm test`.

## 9. Writing rules (from the owner)

- **Short, warm, concrete, for a child and an adult at once.** One idea per panel.
- **Good and bad, never "positive" and "negative"** in player text (bueno / malo).
- **A bomb is a bomb** ("bomba"). Never call it a breakthrough or "avance", in either language.
- **A wall never describes an obstacle its room does not hold.** Page 2 and later are seen only in the easy rooms: never tell the player to dig, cross a pit or a bridge that is not there.
- **Everything stated about a creature, a drop, a recipe or a control must be true in the code today.** Check it (the enemy or boss file in `src/content`, the floors it appears on, what it leaves, the binding) before writing it, and say in the commit what you checked. A change to that code must update the panel.
- **Spanish must read as native Spanish**, written for a Spanish reader, not translated word by word. Same facts, same numbers.
- **An image shows the lesson, not the HUD**, unless the lesson is about the HUD. Avoid captures with on-screen text in one language (they would be wrong in the other); captures run in English, so frame text out.
- Names follow `sotano-lore`; a quotation is credited (section 6).

## 10. Recipes

**Change a panel's text** ("change panel 3-pit-s"): find `"id": "3-pit-s"` in both files; edit the words in both, keeping the facts and fields equal; check the facts in code; run the book tests; look at it in `?gallery=book&id=3-pit-s` in both languages (and every device if it has a key cap or placeholder).

**Add a panel to a book page**: in both files, under that page's `panels`, add the room and side with a panel whose id is its position (`8-mend-n`). Any slot may be used; prose, or a quote with its source. Run the tests, check the gallery.

**Add a book page**: append a page to `pages` in both files with the same `id` (`book-4`), `kind: "book"` and one or more panels; its number is its position (page 10). Ids `10-<room>-<n|s>`. Players reach it from page 9 with a run that enters every room of the Roots, and the page stone will show 10. Page achievements at 54, 69 and 100 become earnable once the book has that many pages.

**Add a quotation**: section 6, on a book page; the original in its language's file, our translation in the other, `lang` the original; the SOURCES.md row in the same commit.

**Add an image**: add the name to `LESSON_IMAGES` (or the entity to `BESTIARY_PORTRAITS`), add its staged entry to `LESSONS` in `scripts/book-captures.mjs` (a lesson the sandbox cannot stage is a `REAL` entry there instead: the real game at its seed, set up and posed from the console, see `captureReal`) (a portrait: add the id to the script's own `PORTRAITS` list too, and the entity must be one of its `SUBJECTS`), capture it, look at it, check it under 60 KB, then use it in a panel in both files. If it cannot be staged yet, add it to both `PENDING` lists with the reason and no file.

**Add a tutorial page**: tutorial pages come before every book page (the validator refuses a tutorial page after a book page), so a new one shifts every book page's number and therefore every book panel's id, the page stone's numbers and the meaning of `FIRST_BOOK_PAGE` and the page-7 achievement. **Ask the owner first.** Then, in both files: insert the page, renumber every later panel id, update `FIRST_BOOK_PAGE`, the page achievements' pages and the tests that count pages (`tests/book.test.ts` "has nine pages…"), and TUTORIAL-PAGES.

## 11. Checklist

- [ ] Both JSON files changed together: same slots, ids, layouts, images, keys and fields.
- [ ] Every id is its position (`<page>-<room>-<n|s>` or `easy-<room>-<n|s>`).
- [ ] Within budget with placeholders at their longest label; no overflow in the gallery in either language or on any device.
- [ ] Every fact checked in the code today; no obstacle the easy room lacks; good and bad; a bomb is a bomb.
- [ ] Spanish reads as native Spanish.
- [ ] Images: id in the manifest, WebP ≤ 60 KB, looked at, lesson inside the centre crop, no one-language text; pending ids in both lists with no file.
- [ ] A quotation: original and translation, `lang`, source row in `docs/lore/SOURCES.md`.
- [ ] Pages 3 to 6 fill all 22 slots; no quote on a tutorial page.
- [ ] Docs updated (TUTORIAL-PAGES, HIDDEN-BOOK or BOOK-DATA's image list) (`sotano-docs`, `sotano-design`).
- [ ] `npm run typecheck && npm test`.
