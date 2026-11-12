# Implementation plan: the evolving Roots, the hidden book and mastery

Up: [the Roots as an evolving tutorial](README.md) · Status: proposal (the plan for issue #147). It assigns the work to coding agents in ordered packages. Each package names its goal, the files it touches, the tests it adds, what "done" means and a size: **normal** (one agent, a focused change) or **complex** (cross-cutting; the agent works on the main build tier and runs the three-party review where `sotano-docs` §4 asks for it).

Read first, for every package: this folder, [progression](../../progression/README.md), `CLAUDE.md` and the skills it names. Every package ends with `npm run typecheck && npm test` green and its documents updated in the same commit. Branch: `feature/147-roots-book`, PRs to `develop`.

## Order and parallelism

```
Wave A   A1 i18n keys and labels                       (alone, first)
Wave B   B1 save v2 | B2 book loader | B3 pages state | B4 mastery + achievements | B5 portraits and lesson captures
Wave C   C1 panel renderer (after B2)   |   C2 Roots generation by mastery (after B4)
Wave D   D1 game wiring: book and pages (after B1, B3, C1)  →  D2 game wiring: achievements and rewards (after D1, C2)
Wave E   E1 real-game check, sandbox scenario, docs to built, cleanup (after everything)
```

Packages in the same wave touch disjoint files and can run in parallel. `src/game/game.ts` and `src/main.ts` are touched only in wave D, one package at a time. `src/i18n/locales/en.ts` and `es.ts` are touched only in A1 (every message key any package needs is listed there) and in E1 (removing the old `lesson.*` keys).

## A1. Message keys and labels (normal)

- **Goal:** every new player-facing word exists in English and Spanish before code uses it, so `MessageKey` typechecks for every later package.
- **Files:** `src/i18n/locales/en.ts`, `src/i18n/locales/es.ts`, `src/input/labels.ts` (add `drink` to `LESSON_CONTROLS`).
- **Keys:** `keycap.<action>.key|pad|touch|verb` for move, jump, cast, polarity, place, throw, bomb, drink, inventory ([BOOK-DATA §5](BOOK-DATA.md#5-key-caps)); `achievement.<id>.name|desc` for the 22 ids ([ACHIEVEMENTS §1](../../progression/ACHIEVEMENTS.md#1-the-22-that-ship-with-147)); `achievement.card.kicker|gain|mastery`; every `mastery.gain.*` line ([REWARDS §6](REWARDS.md#6-what-each-step-says)).
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
- **Files:** `src/content/tables/roots-mastery.ts` (`rootsRewards(level)`: counts, hearts, factor, bands, altar, second Sanctuary, and `gainsAt(level)` naming the step lines), `src/content/achievements.ts` (the 22 entries), `src/game/achievements.ts` (the tracker: event in, unlocks out, counts, `mastery(save)`), `tests/roots-mastery.test.ts`, `tests/achievements.test.ts`.
- **Tests:** level 0 values exactly as REWARDS (factor 0.2, one of key or bomb, bare pedestal, bands 1 / 2); spot values at 5, 10, 15, 22, 50, 100; monotonic for every L in 0…99; bounded (counts, chance ≤ 0.75, bands in 1…4); every level 1…22 has at least one gain line, every level 23…100 at least the crate line; catalogue ids unique, total ≤ 100, every `on` an event and every `where` field present in that event's synergy-matrix sample; tracker: unlock once, `times: 3` needs three, no double award, mastery = count capped at 100, unknown ids not counted.
- **Done:** pure modules and tests; no generation or game change.

## B5. Portraits and lesson captures (normal)

- **Goal:** the images the panels need, at their size, from the game itself ([BOOK-DATA §4](BOOK-DATA.md#4-images)).
- **Depends on:** PR #181 (the bestiary and `scripts/bestiary-capture.mjs`) merged into develop; if it is not, this package waits or rebases onto it.
- **Files:** `scripts/bestiary-capture.mjs` (add a **portrait mode**: `npm run bestiary -- --portrait [ids]`: no HUD, no hand, the camera close to the subject and framed on its height, the subject lit and centred, a square 512 × 512 crop, written as `public/book/bestiary/<entity id>.webp`; the documentation mode stays as it is), `scripts/book-captures.mjs` (the 33 lesson captures, one sandbox scenario and camera pose each, written as `public/book/lesson/<name>.webp`), `src/sandbox/scenarios/book-*.json` (the staged scenes), `public/book/**`, `package.json` (scripts), `tests/book-images.test.ts` (every id in the book files has its file; every file is used).
- **Tests:** the file test above; the capture is deterministic (fixed seed, fixed steps), so a re-run gives the same images.
- **Done:** 19 portraits and 33 lesson images in `public/book/`, each under 60 KB, reviewed against `sotano-art` (captures, the meaning test) by the art agent; sizes and the capture commands documented in BOOK-DATA.

## C1. The panel renderer (complex, art)

- **Goal:** the three layouts, key caps, verbs and the page stone at 896 × 512 ([PANELS](PANELS.md)).
- **Depends on:** B2 (types), A1 (keys).
- **Files:** `src/render/tablets.ts` (rewrite: `Tablets.show(room, side, panel, pageNumber)` draws offscreen and swaps the texture in one step; image cache with preload; icons drawn from the item, flask and heart art; the mount table of PANELS §6), `src/render/page-stone.ts`, `src/debug/gallery.ts` (a `book` section: every panel of every page, both languages, three devices, flagging overflow), `tests/tablets.test.ts` (the pure parts: wrapping, shrink-to-fit with a fake measure, mount positions, which keycap key is read per device).
- **Art:** the look is made by the dedicated art agent (`sotano-art` §0) and passes the gate: colour, greyscale, the three colour-blindness filters, at distance in each room; captures go into the art guide's as-built record.
- **Done:** the gallery shows every panel with no overflow in either language; gate passed; no game wiring yet.

## C2. The Roots carved by mastery (complex)

- **Goal:** floor 0 reads the mastery level ([REWARDS §4–5](REWARDS.md#4-where-things-go-placement)); every other floor is untouched.
- **Depends on:** B4.
- **Files:** `src/world/floor.ts` (a `mastery` field in `CarveOptions`; the Roots' loot, free chests, hearts, altar and second Sanctuary spots from the `floor/0/roots/*` forks; the two Roots slots leave `pedestalSlots`), `src/content/tables/crates.ts` (the factor and the 0.75 cap as a parameter of the chance), `src/core/seed.ts` (`GEN_VERSION` + 1), `tests/roots-mastery.test.ts` (the carving part), `tests/levels.test.ts` (adjust what the tutorial loot test expects), `docs/architecture/RNG.md` (the new forks), `docs/architecture/ROOMS.md`.
- **Tests:** same seed and level → identical floor 0; floors 1 to 9 identical for levels 0, 22 and 100 with the same seed; counts on the floor match the table at 0, 10, 22, 100; at most one free chest per room, never on a door approach, the centre or the shaft; level 0 holds exactly one of key or bomb.
- **Done:** generation reads only its options; tests green.

## D1. Game wiring: the book on the walls (complex)

- **Goal:** the book, the pages and the page stone in the real game.
- **Depends on:** B1, B3, C1.
- **Files:** `src/main.ts` (load the save once, hand the game a store and the record), `src/game/game.ts` (create `RootsBook` per run from the record's page; feed it room-enter and run-end; ask it each frame which rooms may swap and call the renderer; save the advanced page; preload the shown page's images inside the start fade; sandbox and lab use an in-memory record), `tests/roots-book-game.test.ts` (with the game's headless helpers if they exist, otherwise through the walker helper of `tests/helpers/walker.ts`).
- **Tests:** a scripted walk of the whole Roots then a death advances the saved page; R after it does not advance twice; a forward lap in the game changes a far room's panel and not the current one; a run start shows the saved page.
- **Done:** browser check: walk the ring both ways on page 3 (set by the console), watch rooms turn only behind you; screenshots.

## D2. Game wiring: achievements, the notice and the rewards (complex)

- **Goal:** events, the tracker, the notice, and the mastery level reaching floor 0.
- **Depends on:** D1, C2.
- **Files:** `src/game/events.ts` (`bossOvercome`, `meditationComplete`, `cook`), `tests/synergy-matrix.test.ts` (samples), `tests/items.test.ts` (contract list), `src/game/game.ts` (emit in `bossDown` and the Sanctuary answers; the tracker; pending cards shown at a calm moment; the toll waits for an open card; `newRun` passes the mastery level to carving; the crate factor only inside floor 0's band; pedestal, altar and second Sanctuary runtime draws), `src/game/meditation-app.ts` (report the chosen meditation with `complete`), `src/game/kitchen.ts` (emit `cook`), `src/game/hud.ts` (the presence card's `kicker` option, relocalized), `src/audio/sfx.ts` (the achievement chime), `.claude/skills/sotano-popups/SKILL.md` (registry row: the presence card's kicker), `tests/achievements-game.test.ts`.
- **Tests:** overcoming a boss unlocks once and shows one card; two bosses in a run give two cards in order; a second defeat of the same boss gives nothing; three completed sittings of one meditation unlock it, quick rewards do not count; first brew and first cook; the sandbox writes nothing; the notice text exists in both languages; the toll window opens only after the card closes; crate chance on floor 0 at levels 0 and 100, and unchanged on floor 1 and on the surface.
- **Done:** browser check in both languages and on keyboard, pad and touch; screenshots of a card; console clean.

## E1. Real-game check, docs to built, cleanup (normal)

- **Goal:** prove it end to end and move the design to `built/`.
- **Files:** `src/sandbox/scenarios/roots-book.json` and its report (a deterministic lab run: seed fixed, mastery 0, walk every room of the Roots, die, restart; assert the page moved to 2 and the walls show page 2; walk a reverse lap and read page 1 on a far wall; set mastery 22 and restart; count keys, bombs, hearts and chests on floor 0; overcome a boss through the console and read the card), `src/i18n/locales/en.ts`, `es.ts` (remove the old `lesson.*` keys no longer read), `src/content/rooms.ts` (drop `lesson`/`lesson2` from the roots templates if nothing reads them), `docs/design/built/levels/floors/ROOTS.md` and new `built/` documents (move, not copy, the text of this folder and of progression; leave pointers for what stays open), `docs/architecture/` (OVERVIEW, ENTITIES, RNG, LOCALIZATION as touched), `README.md` and `CHANGELOG.md`, the feedback logs of `sotano-feature` and `sotano-levels` with this round's lessons.
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

Superseded or out of scope: sequential boss steps and one step per run (owner decision 8), sky-plant first clears (decision 11), #113, #180. Controls: no new control (key caps are labels; `sotano-controls` needs no mapping). Pop-ups: no new type (the presence card gains a kicker, D2).
