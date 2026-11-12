# Implementation plan: the evolving Roots, the hidden book and mastery

Up: [the Roots as an evolving tutorial](README.md) · Status: proposal (the plan for issue #147). It assigns the work to coding agents in ordered packages. Each package names its goal, the files it touches, the tests it adds, what "done" means and a size: **normal** (one agent, a focused change) or **complex** (cross-cutting; the agent works on the main build tier and runs the three-party review where `sotano-docs` §4 asks for it).

Read first, for every package: this folder, [progression](../../progression/README.md), `CLAUDE.md` and the skills it names. Every package ends with `npm run typecheck && npm test` green and its documents updated in the same commit. Branch: `feature/147-roots-book`, PRs to `develop`.

## Order and parallelism

```
Wave A   A1 i18n keys and labels                       (alone, first)
Wave B   B1 save v2 | B2 book loader | B3 pages state | B4 mastery + achievements | B5 portraits and lesson captures
         B6 quotes and page achievements (after A1, B2 and B4)
         B7 the remembered panels of the easy layout (after B6)
Wave C   C1 panel renderer (after B2)   |   C2 Roots generation by mastery (after B4)   |   C3 the easy layout (after C2)
Wave D   D1 game wiring: book, pages and layout (after B1, B3, B7, C1, C3)  →  D2 game wiring: achievements and rewards (after D1, C2)
Wave E   E1 real-game check, sandbox scenario, docs to built, cleanup (after everything)
```

Packages in the same wave touch disjoint files and can run in parallel. `src/game/game.ts` and `src/main.ts` are touched only in wave D, one package at a time. `src/i18n/locales/en.ts` and `es.ts` are touched only in A1 (every message key any package needs is listed there), in B6 (the keys added after A1 was cut) and in E1 (removing the old `lesson.*` keys). The book JSON files are changed only by B6, then B7, until E1. `src/world/floor.ts` and `src/content/rooms.ts` are touched by C2, then C3, one at a time.

## A1. Message keys and labels (normal)

- **Goal:** every new player-facing word exists in English and Spanish before code uses it, so `MessageKey` typechecks for every later package.
- **Files:** `src/i18n/locales/en.ts`, `src/i18n/locales/es.ts`, `src/input/labels.ts` (add `drink` to `LESSON_CONTROLS`).
- **Keys:** `keycap.<action>.key|pad|touch|verb` for move, jump, cast, polarity, place, throw, bomb, drink, inventory ([BOOK-DATA §5](BOOK-DATA.md#5-key-caps)); `achievement.<id>.name|desc` for the 36 ids ([ACHIEVEMENTS §1](../../progression/ACHIEVEMENTS.md#1-the-36-that-ship-with-147)); `achievement.card.kicker|gain|mastery`; every `mastery.gain.*` line ([REWARDS §7](REWARDS.md#7-what-each-step-says)), whose `{stars}` parameter is filled by `qualityStars` (`src/render/icons.ts`).
- **Tests:** the existing i18n test (completeness, placeholders, markup). Add a check that every `keycap.*` value is at most 14 characters.
- **Done:** keys present in both catalogs, i18n test green, no code reads them yet.

## B1. Save record version 2 (normal)

- **Goal:** [SAVE](../../progression/SAVE.md): fields, v1 migration, field-by-field reading, read-only newer versions, reset.
- **Files:** `src/game/meta.ts`, `tests/meta.test.ts`, `tests/endgame.test.ts` (its fake host writes a v1 record: update it to v2).
- **Tests:** round trip; v1 → v2; each broken field alone; broken JSON; v3 read-only refuses writes; throwing store; `reset` keeps the staircase.
- **Done:** pure module, not wired yet; tests green; SAVE.md accurate; fix the false header comment of `meta.ts`.

## B2. Book loader and validator (complex)

- **Goal:** load and validate the two book files ([BOOK-DATA §6](BOOK-DATA.md#6-validation)); resolve a slot with the page-1 fallback; list the lesson image manifest.
- **Files:** `src/content/book/index.ts` (types, `loadBook(lang)`, `validateBook(en, es, refs)`, `panelAt(book, page, room, side)`, `pageCount`), `src/content/book/images.ts` (the lesson manifest and the id resolver), `tests/book.test.ts`, `tsconfig.json` only if JSON imports need `resolveJsonModule`.
- **Tests:** the real files pass; one test per rule of §6 with a broken copy (unknown field, missing slot on page 1, tutorial after book, bad image, bad key, unknown placeholder, budget overflow counted at the longest label, languages that differ in shape); the fallback to page 1; the page count.
- **Done:** validation errors list every problem and throw; nothing renders yet.

## B3. Pages, laps and visibility, as a pure state machine (complex)

- **Goal:** [PAGES](PAGES.md): visited set, advance at run end (once per run, capped), browsing by laps, sight sets from the plan, the out-of-sight swap rule, page-stone number.
- **Files:** `src/game/roots-book.ts` (no DOM, no Three.js: takes room-enter events, run-end events, the camera test as a callback, and answers "which page should room X show now"), `tests/roots-book.test.ts`.
- **Tests:** forward lap from every ring room shows the next page; reverse lap shows the previous; partial laps and back-and-forth do nothing; a jump between non-adjacent rooms resets; the way-down room is ignored; never beyond the current page, never below 1; death after the whole route advances once, R after death does not advance again; an incomplete route does not advance; the cap at the last page; the sight sets equal the table in PAGES §3; a room in the player's sight set never changes page, and changes as soon as the player leaves the set; the frustum guard blocks a swap.
- **Done:** every rule of PAGES covered by a test, no game wiring.

## B4. Mastery table and achievement catalogue (complex)

- **Goal:** [REWARDS](REWARDS.md) as data and [ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md) as data, both pure.
- **Files:** `src/content/tables/roots-mastery.ts` (`rootsRewards(level)`: counts, hearts, crate factor, extra practices, altar band, second Sanctuary, and `gainsAt(level)` naming the step lines), `src/content/achievements.ts` (the 36 entries; `where` values may be lists meaning any of them), `src/game/achievements.ts` (the tracker: event in, unlocks out, counts, `mastery(save)`), `tests/roots-mastery.test.ts`, `tests/achievements.test.ts`.
- **Tests:** level 0 values exactly as REWARDS (factor 0.2, exactly one of key or bomb, no hearts, chests or extra practices); spot values at 5, 10, 15, 22, 25, 36, 50, 100; monotonic for every L in 0…99; bounded (counts, chance ≤ 0.75, bands in ★…★★★★); the table never mentions the Sanctuary chest or the way-down pedestal; every level 1…36 has exactly one named gain line, every level 37…100 at least the crate line; catalogue ids unique, total ≤ 100, every `on` an event and every `where` field present in that event's synergy-matrix sample; tracker: unlock once, `times: 3` needs three, no double award, a boss destroyed unlocks only `.destroyed` and a boss converted only `.converted`, the Shadow's stillness unlocks `boss.shadow.converted`, mastery = count capped at 100, unknown ids not counted.
- **Done:** pure modules and tests; no generation or game change.

## B5. Portraits and lesson captures (normal)

- **Goal:** the images the panels need, at their size, from the game itself ([BOOK-DATA §4](BOOK-DATA.md#4-images)).
- **Depends on:** PR #181 (the bestiary and `scripts/bestiary-capture.mjs`) merged into develop; if it is not, this package waits or rebases onto it.
- **Files:** `scripts/bestiary-capture.mjs` (add a **portrait mode**: `npm run bestiary -- --portrait [ids]`: no HUD, no hand, the camera close to the subject and framed on its height, the subject lit and centred, a square 512 × 512 crop, written as `public/book/bestiary/<entity id>.webp`; the documentation mode stays as it is), `scripts/book-captures.mjs` (the 33 lesson captures, one sandbox scenario and camera pose each, written as `public/book/lesson/<name>.webp`), `src/sandbox/scenarios/book-*.json` (the staged scenes), `public/book/**`, `package.json` (scripts), `tests/book-images.test.ts` (every id in the book files has its file; every file is used).
- **Tests:** the file test above; the capture is deterministic (fixed seed, fixed steps), so a re-run gives the same images.
- **Done:** 19 portraits and 33 lesson images in `public/book/`, each under 60 KB, reviewed against `sotano-art` (captures, the meaning test) by the art agent; sizes and the capture commands documented in BOOK-DATA.

## B6. Quotes and the page achievements (normal)

- **Goal:** the owner's two additions of 2026-11-12: the `quote` layout ([PANELS §4b](PANELS.md#4b-quote-someone-elses-voice), [BOOK-DATA §2b](BOOK-DATA.md#2b-quotations)) with page 7's quotation, and the four book-page achievements with their reward steps ([ACHIEVEMENTS, book pages](../../progression/ACHIEVEMENTS.md#book-pages-4), [REWARDS](REWARDS.md) levels 37 to 41).
- **Depends on:** A1, B2, B4 merged (it extends their files).
- **Files:**
  - `src/content/book/index.ts` and `tests/book.test.ts`: the `quote` layout (fields `text`, `author`, `work` required, `publisher`, `year`, `lang`; only on `book` pages; budgets 440, 40, 48, 32 and the 60-character source line; facts identical across languages; `year` an integer from 1000 to the current year; `lang` a shipped language).
  - `src/content/book/book.en.json`, `book.es.json`: replace the `book-1` entry with the exact JSON in [HIDDEN-BOOK](HIDDEN-BOOK.md) (the prose unchanged, the quote added on `roots-gift` → `north`; the Spanish text exactly as the owner gave it).
  - `src/game/events.ts`: the `pageReached { page: number }` event type (its emit site is D1's, in `RootsBook`'s run-end advance; if the contract test in `tests/items.test.ts` demands an emit site for every event, B6 leaves the type out and D1 adds type, sample and emit together), and its synergy-matrix sample in `tests/synergy-matrix.test.ts`.
  - `src/content/achievements.ts`, `tests/achievements.test.ts`: the four entries `book.page.7`, `book.page.54`, `book.page.69`, `book.page.100` (`on: 'pageReached'`, `where: { page: N }`); the total becomes 40.
  - `src/content/tables/roots-mastery.ts`, `tests/roots-mastery.test.ts`: the named steps of levels 37 to 40, the crate formula starting at 41, the steps at 60 and 70, the new bounds (11 hearts).
  - `src/i18n/locales/en.ts`, `es.ts`: `achievement.book.page.<n>.name|desc` for the four, and `book.quote.translated` ("Our translation" / "Traducción nuestra").
  - `docs/lore/SOURCES.md`: the `la-locura-lo-cura` row (Credit), given in [HIDDEN-BOOK](HIDDEN-BOOK.md); `docs/lore/CONCEPTS.md` if authenticity has no row.
- **Tests:** a quote passes; a quote missing `author` or `work` fails; a quote on a tutorial page fails; a quote whose facts differ between the files fails; budgets; the real files pass with page 7's quote in Spanish and English; the four achievements unlock on `pageReached` with their page and never on another; levels 37 to 40 each have one named step; monotonic and bounded from 0 to 100 with the new rows.
- **Done:** book, catalogue and table carry the additions; the i18n and book tests are green; SOURCES.md has the row.

## B7. The remembered panels of the easy layout (normal)

- **Goal:** the book's `easy` layer ([EASY-LAYOUT §4](EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2)): five remembered panels that the easy layout shows instead of page 1's in the slots whose exercise is gone, and the three-step resolution (page *n*'s own panel if *n* ≥ 2, else the remembered panel in the easy layout, else page 1's).
- **Depends on:** B2, B6 (it extends their files).
- **Files:** `src/content/book/index.ts` (the optional top-level `easy` object, its validation, `panelAt(book, page, room, side, easy = false)`), `src/content/book/book.en.json`, `book.es.json` (the five panels exactly as in EASY-LAYOUT §4), `tests/book.test.ts`, `docs/design/not-built/levels/roots/BOOK-DATA.md` (the `easy` object, its ids `easy-<room>-<side>`, the resolution rule), `PANELS.md` (§6: its exceptions hold in the teaching layout only, pointing to EASY-LAYOUT §5; §10: the `easy-` ids), `TUTORIAL-PAGES.md` (a table of the five remembered slots and what each rests on).
- **Tests:** the real files pass; `panelAt` in the easy layout returns the remembered panel for the five slots on page 1, on every tutorial page that leaves the slot out and on every book page, and page *n*'s own panel where page *n* fills the slot (the step room's south slot on pages 2 to 6); in the teaching layout it returns exactly what it returns today for every slot of every page; an `easy` slot on an unknown room or side fails; an `easy` slot in one language only fails; budgets at the longest label.
- **Done:** the layer is data and resolution only; nothing renders it until D1.

## C1. The panel renderer (complex, art)

- **Goal:** the four layouts (lesson, plate, prose, quote), key caps, verbs and the page stone at 896 × 512 ([PANELS](PANELS.md)). The quote draws its inset page, the gold opening mark, the italic text, the right-aligned author and source, and the translation note only when the book's language differs from the quote's `lang`.
- **Depends on:** B2 (types), A1 (keys), B6 (the quote layout and `book.quote.translated`).
- **Files:** `src/render/tablets.ts` (rewrite: `Tablets.show(room, side, panel, pageNumber)` draws offscreen and swaps the texture in one step; image cache with preload; icons drawn from the item, flask and heart art; the mount table of PANELS §6), `src/render/page-stone.ts`, `src/debug/gallery.ts` (a `book` section: every panel of every page, both languages, three devices, flagging overflow), `tests/tablets.test.ts` (the pure parts: wrapping, shrink-to-fit with a fake measure, mount positions, which keycap key is read per device).
- **Art:** the look is made by the dedicated art agent (`sotano-art` §0) and passes the gate: colour, greyscale, the three colour-blindness filters, at distance in each room; captures go into the art guide's as-built record.
- **Done:** the gallery shows every panel with no overflow in either language; gate passed; no game wiring yet.

## C2. The Roots carved by mastery (complex)

- **Goal:** floor 0 reads the mastery level ([REWARDS §4–6](REWARDS.md#4-the-extra-practices-the-altar-and-the-second-sanctuary)); every other floor is untouched.
- **Depends on:** B4.
- **Files:** `src/world/floor.ts` (a `mastery` field in `CarveOptions`; the Roots' loot, free chests, hearts, extra-practice pedestals, altar and second Sanctuary spots from the `floor/0/roots/*` forks; `pedestalSlots`, the Sanctuary chest and the way-down pedestal unchanged), `src/content/tables/crates.ts` (the factor and the 0.75 cap as a parameter of the chance), `src/core/seed.ts` (`GEN_VERSION` + 1, for floor 0 only), `tests/roots-mastery.test.ts` (the carving part), `tests/levels.test.ts` (adjust what the tutorial loot test expects), `docs/architecture/RNG.md` (the new forks), `docs/architecture/ROOMS.md`.
- **Tests:** same seed and level → identical floor 0; floors 1 to 9 (their reserved practices included) identical for levels 0, 36 and 100 with the same seed and identical to before this change; the Sanctuary chest and the way-down pedestal identical at every level; counts on the floor match the table at 0, 10, 25, 36, 100; at most one free chest per room and one pedestal per room, never on a door approach, the centre or the shaft, three blocks clear above a pedestal; level 0 holds exactly one of key or bomb.
- **Done:** generation reads only its options; tests green.

## C3. The easy layout (complex)

- **Goal:** the second layout of the Roots ([EASY-LAYOUT](EASY-LAYOUT.md)): six easy templates, the cell table that names them, and the carve option that picks them. Floor 0 only; the teaching layout carved byte for byte as today when the option is off.
- **Depends on:** C2 (same files; it is merged).
- **Files:**
  - `src/content/rooms.ts`: the six templates `roots-step-easy`, `roots-dig-easy`, `roots-pit-easy`, `roots-bridge-easy`, `roots-crates-easy`, `roots-seal-easy` exactly as in EASY-LAYOUT §2 (no `weight`; the twin's `lesson`); `TUTORIAL_CELLS` entries gain `easy?: string` for cells a, b, d, e, f, g; `rootsRoomKey(gx, gz)` (the teaching template id of a plan cell, the room's key for the book); an exported reachability check that lists the tiles of a template (with flips) from which some door approach cannot be reached on foot (the walk rules of `walkParts`, run from each tile or backwards from each door).
  - `src/world/floor.ts`: `easyRoots?: boolean` in `CarveOptions` (default `false`, read only where `lv.tutorial`); `fitTemplates(…, bossSmallRoom = false, easyRoots = false)` takes the cell's `easy` template when asked, with the cell's `flipZ`; `carveFloor` passes it. Nothing else: no fork, no order of draws, no `GEN_VERSION` change.
  - `src/sandbox/scenario.ts`: a scenario field for the layout, as C2 did for mastery, so the lab can carve either.
  - `tests/helpers.ts`: `buildRun` takes carve options (mastery, `easyRoots`), defaults unchanged.
  - `tests/roots-easy.test.ts`: the six tests of EASY-LAYOUT §9.
  - Docs: `docs/architecture/ROOMS.md` (the easy cells and the option), `docs/architecture/RNG.md` (floor 0 depends on seed, mastery and layout; no new fork), `docs/design/built/levels/README.md` §4 table only when E1 moves the design to built.
- **Tests:** EASY-LAYOUT §9: every easy template passes `validateTemplate`, needs no building and strands no tile; the walker crosses the easy Roots forward and in reverse with no block, and fails the same route in the teaching layout; floor 0 with the option off or absent equals hashes recorded from the code before C3 (seeds 1 and `0xBEEF`, mastery 0 and 22); floors 1 to 9 and the world outside floor 0's band are identical for both layouts at mastery 0 and 100; at mastery 100 in the easy layout the counts equal `rootsRewards(100)` and the free tiles of the eight easy lesson rooms cover the table's maximum; the six cells carve their easy template, the crates room holds 28 crates, `rootsRoomKey` gives the teaching id in both layouts; the existing suite (half-need-building by weight, the roots tests of `world.test.ts`, `roots-carving.test.ts`, `boss-rooms-large.test.ts`) stays green unchanged.
- **Art:** the easy rooms use only blocks floor 0 already has; the art agent captures each easy room in the lab in colour and greyscale and runs the meaning test (`sotano-art` §3) before C3 merges.
- **Done:** generation reads only its options; nothing in the game passes `easyRoots` yet (D1 does); tests green.

## D1. Game wiring: the book on the walls (complex)

- **Goal:** the book, the pages and the page stone in the real game, the `pageReached` event emitted when a run's end advances the page, and the layout of the Roots chosen from the saved page.
- **Depends on:** B1, B3, B7, C1, C3.
- **Files:** `src/main.ts` (load the save once, hand the game a store and the record), `src/game/game.ts` (create `RootsBook` per run from the record's page; feed it room-enter and run-end; ask it each frame which rooms may swap and call the renderer; save the advanced page; preload the shown page's images inside the start fade; sandbox and lab use an in-memory record; **at run start pass `easyRoots: record.roots.page >= 2` to the carving of floor 0, read once, from the current page and never the shown page**; **name every room of the Roots by `rootsRoomKey(gx, gz)`, never by `RoomInfo.template`, wherever it talks to `RootsBook`, the book or the renderer**), `src/render/tablets.ts` (**the mount table by layout: PANELS §6's exceptions in the teaching layout, the standard mount everywhere in the easy layout (EASY-LAYOUT §5)**; `panelAt` called with the run's layout), `tests/roots-book-game.test.ts` (with the game's headless helpers if they exist, otherwise through the walker helper of `tests/helpers/walker.ts`).
- **Tests:** a scripted walk of the whole Roots then a death advances the saved page; R after it does not advance twice; a forward lap in the game changes a far room's panel and not the current one; a run start shows the saved page; **a run started on page 1 carves the teaching layout and one started on page 2 or later the easy layout; the advance at a run's end never changes the layout of the run that ends, only the next; in the easy layout, walking every room completes the visited set (the keys are the rooms' cells, not their easy template ids); the remembered panel hangs on the dig room's south wall in the easy layout on page 2 and after browsing back to page 1; the step and seal panels hang at the standard mount in the easy layout and at PANELS §6's mount in the teaching layout**.
- **Done:** browser check: walk the ring both ways on page 3 (set by the console), watch rooms turn only behind you, cross every room without placing or breaking a block; on page 1 the exercises are there; screenshots.
- **Built (D1):** `src/game/roots-keeper.ts` (new: one run's walls, the page it shows, the layout it is carved in, `WallSink`, `openRoots` with none in the sandbox), `src/game/game.ts` (`GameSave`; `begin` ends the previous run through `endRoots`, makes the keeper, carves floor 0 with `easyRoots`; `hangRoots` mounts the eleven rooms and the page stone; `updateRoots` every frame; `setRootsPage` for the console), `src/main.ts` (`loadMeta(browserStore)`), `src/render/tablets.ts` (the `add` shim and the lesson tablets removed; `show` and `mountRoom(…, variant)`), `src/render/panel-layout.ts` (`MountVariant`: `teaching` and `easy`, the easy mount as data), `src/game/events.ts` (`pageReached`, with its sample and contract entry), `src/game/meta.ts` (`noStore`). Tests: `tests/roots-book-game.test.ts` (19). Browser check with Playwright on the worktree's Vite server (screenshots `docs/art/img/built/book-game-*.png`): page 1 teaching, page 3 easy laps forward and back with changes only out of sight, page 7 stone and quotation in English and Spanish, a death that advances and saves the page and an R that does not, the sandbox writing nothing. Movement in the check was by teleport to room centres (not on foot); the walk of the easy Roots on foot is tested by the walker in `roots-easy.test.ts`.

## D2. Game wiring: achievements, the notice and the rewards (complex)

- **Goal:** events, the tracker, the notice, and the mastery level reaching floor 0.
- **Depends on:** D1, C2.
- **Files:** `src/game/events.ts` (`bossOvercome` with `how`, `meditationComplete`, `cook`), `src/content/bosses/shadow.ts` (mark the stillness end so the game reports `how: 'stillness'`), `tests/synergy-matrix.test.ts` (samples), `tests/items.test.ts` (contract list), `src/game/game.ts` (emit in `bossDown` and the Sanctuary answers; the tracker; pending cards shown at a calm moment; the toll waits for an open card; `newRun` passes the mastery level to carving; the crate factor only inside floor 0's band; the extra practices and the altar drawn at run start after the reservation (runtime draws, band ★ to ★★★, ★★ to ★★★★ for the altar from 90); the second Sanctuary at 100), `src/game/meditation-app.ts` (report the chosen meditation with `complete`), `src/game/kitchen.ts` (emit `cook`), `src/game/hud.ts` (the presence card's `kicker` option, relocalized), `src/audio/sfx.ts` (the achievement chime), `.claude/skills/sotano-popups/SKILL.md` (registry row: the presence card's kicker), `tests/achievements-game.test.ts`.
- **Tests:** destroying a boss unlocks its `.destroyed` achievement once and shows one card; converting it unlocks only `.converted`; the Shadow's stillness unlocks `boss.shadow.converted`; two bosses in a run give two cards in order; a second destruction of the same boss gives nothing; three completed sittings of one meditation unlock it, quick rewards do not count; first brew and first cook; the sandbox writes nothing; the notice text exists in both languages; the toll window opens only after the card closes; crate chance on floor 0 at levels 0 and 100, and unchanged on floor 1 and on the surface.
- **Done:** browser check in both languages and on keyboard, pad and touch; screenshots of a card; console clean.
- **Built (D2):** `src/game/achievement-keeper.ts` (new: the session's tracker over the save, the notice queue, the notice's keys and gain text, `tollMayOpen`), `src/game/roots-draws.ts` (new: the Roots' practices and altar drawn at run start), `src/game/game.ts` (the bus listeners, `bossOvercome` emitted in `bossDown` with its `how`, `meditationComplete` in the two Sanctuary answers, `cook` in `cookAt`, `showAchievement` every frame, the mastery read at `begin`, the floor-0 placements in `activate`, crate and heart bands, the chests' draws, `setMastery`), `src/game/hud.ts` (the Presence card's kicker, redrawn on a language change), `src/game/meditation-view.ts` (reports the meditation), `src/content/bosses/shadow.ts` (the stillness tag), `src/audio/sfx.ts` (`achievement`), `src/main.ts` (`S.mastery`), `index.html` (the kicker). Tests: `tests/achievements-game.test.ts` (30 rules), the catalogue-vs-sample check moved to `tests/synergy-matrix.test.ts`. Browser check: `docs/art/img/built/book-game-achievement-*.png`, `book-game-mastery-*.png`.

## E1. Real-game check, docs to built, cleanup (normal)

- **Goal:** prove it end to end and move the design to `built/`.
- **Files:** `src/sandbox/scenarios/roots-book.json` and its report (a deterministic lab run: seed fixed, mastery 0, walk every room of the Roots in the teaching layout, using its exercises, die, restart; assert the page moved to 2, the walls show page 2 and the run was carved in the easy layout (the six changed rooms carry their easy templates); walk a full lap with no block placed or broken; read the remembered panel on the dig room's south wall; walk a reverse lap and read page 1 on a far wall, with the remembered panels still in their five slots; set mastery 36 and restart; count keys, bombs, hearts, chests and extra practices on floor 0, and check the Sanctuary chest and the way-down pedestal are as at mastery 0; overcome a boss through the console and read the card), `src/i18n/locales/en.ts`, `es.ts` (remove the old `lesson.*` keys no longer read), `src/content/rooms.ts` (drop `lesson`/`lesson2` from the roots templates, the six easy ones included, if nothing reads them), `docs/design/built/levels/floors/ROOTS.md` (the two layouts: the teaching layout on page 1, the easy layout from page 2, the remembered panels) and new `built/` documents, `docs/design/built/levels/README.md` §4 (the six easy templates in the rooms table) (move, not copy, the text of this folder and of progression; leave pointers for what stays open), `docs/architecture/` (OVERVIEW, ENTITIES, RNG, LOCALIZATION as touched), `README.md` and `CHANGELOG.md`, the feedback logs of `sotano-feature` and `sotano-levels` with this round's lessons (for `sotano-levels`: a fixed plan may have more than one layout, chosen by a carve option the game reads from the save at run start; a room's identity is its plan cell, never its template id; "no building needed" means every tile walks out to every door, which a one-way flood does not prove).
- **Tests:** `npm run sandbox -- --check` shows only the new scenario and explained moves; the full suite.
- **Done:** every acceptance criterion below is checked in the browser and in the lab; the not-built text that shipped is gone from `not-built/`.

## Acceptance criteria of the issue, and where each is met

| Criterion (in scope) | Package |
|---|---|
| Panel art and composition reviewed against `sotano-art`; tutorial text and notices in English and Spanish | A1, B5, C1, D2 |
| JSON validated against a documented schema; bad data fails clearly | B2 |
| Tests for forward and reverse laps, an incomplete route, death after a complete route, the last page (cap), the hidden transition, persistence | B3, D1 |
| Mastery deterministic, persistent, never above 100 | B1, B4, C2 |
| Reward values bounded and tested at 0, in between and at 100; other sources unchanged | B4, C2, D2 |
| Achievements persist, are localized, never double-award | B1, B4, D2 |
| The full flow in the real game and the deterministic sandbox | D1, D2, E1 |
| From page 2 the Roots are the easy layout, crossed on foot with no block placed or broken; the teaching layout unchanged on page 1; floors 1 to 9 unchanged (owner, 2026-11-12) | B7, C3, D1, E1 |

Superseded or out of scope: sequential boss steps and one step per run (owner decision 8), sky-plant first clears (decision 11), #113, #180. Controls: no new control (key caps are labels; `sotano-controls` needs no mapping). Pop-ups: no new type (the presence card gains a kicker, D2).
