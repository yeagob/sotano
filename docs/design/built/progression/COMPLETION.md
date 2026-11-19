# The completion percentage

Up: [progression](README.md) · Status: built (issue #180). Several rules below are **decided by the agent, pending owner ruling**: they are marked as such and listed in §7.

One number for the whole game: the share of the game the player has done at least once. It is kept between runs, it never goes down, and it is made of first times.

## 1. What is built

- A pure function, `completion(save, content)` in `src/game/completion.ts`, computes the percentage (0 to 100, floored: 100 only when every part is complete) and each part's done count, total and weight, from the save record and the content ids. Nothing is stored as a number.
- The totals come from the content: a new floor, boss, achievement, practice, creature, potion or book page changes the totals with no code change (`contentIds()`).
- The display is one render function (`completionHtml` in `src/game/hud.ts`), shown on the pause card and on the death screen: the percentage, then each part with its done count and its weight.

## 2. The parts and weights

The weights are the proposal of issue #180, unchanged (they add up to 100):

| Part | Weight | Counts as done | Total |
|---|---|---|---|
| Floors | 25 | the floor was entered at least once (see §7, decision 1) | the floors of the descent (`LEVELS`, 10) |
| Bosses | 20 | the boss was destroyed or turned to your side (either achievement unlocked) | the bosses of `ACHIEVEMENT_BOSSES` (14) |
| Achievements | 20 | the achievement is unlocked | `ACHIEVEMENTS` (46) |
| Practices | 15 | the practice was held at least once | `ITEMS` |
| Bestiary | 10 | the projection or creature was met (spawned) at least once | `ENEMIES` and `CREATURES` |
| Recipes | 5 | the potion or meal was made at least once | `POTION_IDS` (potions and meals) |
| The hidden book | 5 | the page was reached | the pages of the Roots' book; reached = the Roots' current page |

A part with no content counts as complete.

## 3. What is stored

Four first-time lists in the save record, optional (see [SAVE](SAVE.md) §1): `firsts.floors`, `firsts.practices`, `firsts.bestiary`, `firsts.recipes`. Each holds ids, each kept once. Bosses, achievements and the book need no list: they are read from the achievements and the Roots' page that the save already holds.

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

## 6. Tests

`tests/completion.test.ts`: 0% on an empty save, a partial state with each part worked out by hand, 100% when complete (and 99 at one page short), the bosses by either ending, the book past its last page, a part with no content, the totals growing with content, the monotone steps, the shipped content reading 0% at the start, the migration of an older record without the lists, the union on merge, and the keeper recording each first time once and nothing in the sandbox.

## 7. Open questions, decided by the agent, pending owner ruling

1. **Floors count as "entered", not "cleared".** The game has no floor-clear event; `floorEnter` is the first event that says a floor was reached. A clear event would be a new emit site. Pending owner ruling.
2. **The routes.** The floors counted are the descent (ten floors). The Tree and the sky (issue #180 "the Tree, the sky") are not counted yet: they have no first-time event. Pending owner ruling.
3. **Bestiary counts projections and creatures** (`ENEMIES`, `CREATURES`), not the two presences (the Gardener and the Listener), which are not spawned through the same path. Pending owner ruling.
4. **Bosses and achievements overlap.** Each boss has two achievements, so a boss's two achievements count toward both parts. Kept as proposed. Pending owner ruling.
5. **Recipes include meals.** Cooking a meal counts as a recipe, as brewing a potion does.
6. **The percentage unlocks nothing.** It is only a record (issue #180, open question 3). Pending owner ruling.
7. **Random floors count once per kind.** Not applicable yet: only the descent's ten floors are counted, by their number.
8. **Where else it shows** (the title screen, the Roots' room): not shown there. Pending owner ruling.
9. **The Roots' page as book progress.** The book's reached count is the Roots' current page, which is the page the next run starts on. Pending owner ruling.
