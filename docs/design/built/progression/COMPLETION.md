# The completion percentage

Up: [progression](README.md) · Status: built (issue #180; the owner's second round: all three routes count, the totals cover the whole content, the final achievement and the book download). Rules still **pending owner ruling** are marked as such in §7.

One number for the whole game: the share of the game the player has done at least once. It is kept between runs, it never goes down, and it is made of first times.

## 1. What is built

- A pure function, `completion(save, content)` in `src/game/completion.ts`, computes the percentage (0 to 100, floored: 100 only when every part is complete) and each part's done count, total and weight, from the save record and the content ids. Nothing is stored as a number.
- The totals come from the content: a new floor, boss, achievement, practice, creature, potion or book page changes the totals with no code change (`contentIds()`).
- The display is one render function (`completionHtml` in `src/game/hud.ts`), shown on the pause card and on the death screen: the percentage, then each part with its own percentage (its done count over its total, floored, `partPercent`). The counts and the weights are not shown: a row's number is the real share of its part. At 100% it also shows the book's download button (§8).
- At 100% the final achievement "Made Omh" unlocks once (§8).

## 2. The parts, weights and totals

The weights are the proposal of issue #180, unchanged (they add up to 100). The totals are what the content holds today.

| Part | Weight | Counts as done | Total today | Read from |
|---|---|---|---|---|
| Floors | 25 | the floor was entered for the first time, on any of three routes | 22: the descent 10, the giant tree 7, the sky 5 | `LEVELS` (`0` to `9`), `TREE_STORIES` (`tree.<story>`), `DEITIES` (`sky.<animal>`) |
| Bosses | 20 | the boss was destroyed or turned to your side (either achievement unlocked) | 14 | `ACHIEVEMENT_BOSSES` |
| Achievements | 20 | the achievement is unlocked | 46 | `ACHIEVEMENTS`, without `completion.full` (§8) |
| Practices | 15 | the practice was held at least once | 46 | `ITEMS` |
| Bestiary | 10 | the projection, creature, presence or sky creature was met | 76 | see below |
| Recipes | 5 | the potion or meal was made at least once | 27 | `POTION_IDS` (twenty-five potions, the Echo counted once whatever practice it carries, and two meals) |
| The hidden book | 5 | the page was reached | 19 pages | the Roots' book; reached = the Roots' current page |

**The floors** are the three routes of the world (§7 decision 2):
- the **descent**: the ten underground floors, 0 (the Roots) to 9 (the frozen circle). Silence, below the ninth, is not a floor;
- the **giant tree**: its seven stories (`tree.roots`, `tree.rings`, `tree.galleries`, `tree.hollows`, `tree.branches`, `tree.canopy`, `tree.stars`), each counted when the body first enters it (the `treeStory` event);
- the **sky**: its five guardian floors (`sky.panda`, `sky.koala`, `sky.elephant`, `sky.lion`, `sky.horse`), each counted when the player first stands on it. The sky's deck and Totality are not counted: Totality's threshold is not built (SKY.md).

**The bestiary** holds every projection and creature the player can meet:
- the 40 projections of `ENEMIES` (the procrastination's two later forms included) and the 13 creatures of `CREATURES`. The bosses are not here: they are the bosses part;
- the thirteen Presences: the Gardener, the Listener, the Trickster, the Echo, the Wanderer, the Elder, the Cartographer, the Child, the Witness, the Boatman, the Mender, the Star-reader (issue #149) and the Boundary (`boundary`, the Sanctuary's presence). Each counts when it is placed in a room; the Mender, which is not placed with the floor, counts when it comes to an opened vault. Every one is reachable over runs (the Echo after a death, the Boatman on a floor with a drowned nave, the Mender after a vault on its floor). Decided at the merge of #222 into #149, pending owner ruling: the presences count like the other beings met, as the design's row says;
- the sky's guardians (`guardian-<animal>`, the deity of each guardian floor) and its herds (`herd-<animal>`, the minions of each floor), counted with their floor.

Not counted, on purpose:
- **the Spiked Entity** (`src/endgame/`): its `Encounter` class exists but nothing in the game builds it yet, so no player can meet it. It joins the bestiary when it is wired.
- **the item `boundaries`** (`src/content/items/boundaries.ts`): a practice file that is not in `ITEMS` and has no Spanish text, so no player can hold it. It joins the practices when the owner registers it and it is translated.
- **the parts** (monster parts, the sky's hindrances, the potion and meal kinds beyond the recipes): they are not practices, projections or creatures.

A part with no content counts as complete.

## 3. What is stored

Four first-time lists in the save record, optional (see [SAVE](SAVE.md) §1): `firsts.floors`, `firsts.practices`, `firsts.bestiary`, `firsts.recipes`. Each holds ids, each kept once. Bosses, achievements and the book need no list: they are read from the achievements and the Roots' page that the save already holds.

- The floor ids are `0` to `9` (the descent), `tree.<story>` and `sky.<animal>`; the bestiary ids are the content's ids plus `guardian-<animal>` and `herd-<animal>`.
- A list is only added to. On a merge of two tabs it is a union.
- A save from before this feature has no lists. It reads as none: its achievements, bosses and pages count at once, its floors, practices, creatures and recipes start counting from the next time they happen.
- The debug reset (`S.meta.reset`) forgets the lists with the rest of the Roots' progress.
- The sandbox and the lab record nothing (the keeper is not live there).

## 4. When it is shown

- The pause card shows it on every open, and it is redrawn when a first time or an achievement changes it.
- The death screen shows it above the seed.
- Nothing else shows it yet (the title screen and the Roots' main room are open questions, §7).

## 5. Rules that must hold

- **Monotone.** Each part only gains: first times are only added, achievements are never removed, the page never goes back. A step can only keep or raise the percentage. (A removed content id would lower it: ids the content no longer has are not counted.)
- **100 only when complete.** The percentage is floored, so 99.x reads 99.
- **Honest content.** A part counts the content's ids only, so an id stored by an old build and absent now is not counted.
- **Reachable.** Every counted id must be reachable by a real run, or 100% could never be read. §2 says what is left out and why.
- **The final achievement is not a part.** `completion.full` is the reward for 100%; counting it would make 100 impossible (§8).

## 6. Tests

`tests/completion.test.ts`: 0% on an empty save, a partial state with each part worked out by hand, 100% when complete (and 99 at one page short), the bosses by either ending, the book past its last page, a part with no content, the totals growing with content, the monotone steps, the shipped content reading 0% (22 floors across the three routes, 76 bestiary ids, the final achievement not counted), the migration of an older record without the lists, the union on merge, the keeper recording each first time once and nothing in the sandbox, the book download hidden below 100% and shown at 100%, and the book's page self-contained. `tests/achievements-game.test.ts` checks that `completionFull` unlocks `completion.full` once and nothing else.

## 7. Decisions, pending owner ruling

1. **Floors count as "entered", not "cleared".** The game has no floor-clear event; `floorEnter` (descent), `treeStory` (tree) and the sky's floor are the first events that say a floor was reached. A clear event would be a new emit site. Pending owner ruling. (The original proposal said "cleared".)
2. **The routes.** Round two of the owner's review: all three routes count (the descent, the tree, the sky), so 22 floors. The sky's deck and Totality do not count (Totality is not built). Pending owner ruling on Totality once it is built.
3. **Bestiary counts projections, creatures, the Presences and the sky's guardians and herds.** The owner asked for every creature the player meets; the Spiked Entity and the item `boundaries` are left out because they are not reachable or registered (§2). The owner ruled it inside (2026-11-19): every Presence counts, as the bestiary row says.
4. **Bosses and achievements overlap.** Each boss has two achievements, so a boss's two achievements count toward both parts. Kept as proposed. Pending owner ruling.
5. **Recipes include meals.** Cooking a meal counts as a recipe, as brewing a potion does.
6. **The percentage unlocks one thing: the final achievement.** At 100% "Made Omh" unlocks (§8; its name and text are proposed, pending the owner's name). The percentage unlocks nothing else (no title, no change in the Roots).
7. **Random floors count once per kind.** Not applicable yet: the random floors of the descent (6 to 9) are counted by their number, once each.
8. **Where else it shows** (the title screen, the Roots' room): not shown there. Pending owner ruling.
9. **The Roots' page as book progress.** The book's reached count is the Roots' current page, which is the page the next run starts on. Pending owner ruling.
10. **The tutorial pages count as book pages for the percentage** (they are in the file: 19 pages). The download holds only the 14 book pages (§8).

## 8. The final achievement and the book download

- **The final achievement, "Made Omh" (`completion.full`)**: one catalogue entry, `on: 'completionFull'`, whose criterion is "the completion percentage reaches 100". The event is emitted once by the game, when the percentage is 100 and the achievement is still locked (`Game.showCompletion`); the sandbox and the lab never track it. It is one mastery level like every other achievement (mastery cap 100). Name and text are **proposed, pending the owner's name**: EN "Made Omh", "Reach 100% completion: every part of the game done at least once."; ES "Made Omh", "Llega al 100% de progreso: cada parte del juego, hecha al menos una vez."
- **The book download (`src/game/book-download.ts`)**: one self-contained HTML file, text only, in the player's language (English or Spanish), written in the browser from the book files the game already ships. No network call, no script, no image (the captures are not text). It holds the book's own pages (kind `book`, from the title page on): the tutorial prologue is not in it. The file is named `the-roots-book-<lang>.html`.
- **Where it appears**: only at 100%, as a button in the completion block of the pause card and of the death screen (`bookButtonHtml`, `data-act="book-download"`). Below 100% nothing is drawn. It is a button of the card, clicked or tapped (`data-act`), and it has a key on every device: **B** on the keyboard, **X** on a pad, and the card's own button on touch (the `book` action, `src/input/bindings.ts`, live in the paused and dead contexts only). The controls test checks the binding on all three devices; the pad and the keyboard key were not run on a real controller or in the browser.
- **Format chosen**: a single HTML file (not a PDF, not a .docx), because it needs no library, opens in any browser, and the book is text. Images are not in the file.
