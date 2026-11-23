# The Recipe Book

Up: [Practices](README.md) · Code: `src/game/recipe-book.ts` (the book), `src/content/items/bookofsecrets.ts` (the practice that opens it), the `recipes` action in `src/input/bindings.ts`. The practice itself waits for the owner's acceptance: [BOOK-OF-SECRETS](../../not-built/practices/BOOK-OF-SECRETS.md).

The Recipe Book is a tab of the menu screen that explains everything the player can make or give: every potion of the alembic, every meal of the kitchen, and what each presence takes from the hand. It opens only while the player holds the **Book of Secrets**, a practice the Roots lay on a pedestal from mastery level 30.

## How the player meets it

- **The tab.** While the Book of Secrets is held, the menu screen shows a fourth tab, **Recipes**, beside Menu, Practices and Star map. Until the book is first opened the tab carries a small gold diamond, so going to the menu says the book is new. Without the practice the tab is not there and the book's key does nothing.
- **Opening it.** **J** on the keyboard (in play, on the pause card or on another tab), **D-pad Down** on a pad (in play; on the screen the d-pad scrolls the book), and on touch the Recipes tab of the menu. J again, Esc, B or the ✕ close it. The controls are in [input](../../../architecture/input/README.md).
- **What it shows.** Three chapters, in the finish of the star map's card:
  1. **Potions: the alembic.** One page per potion with its flask, its name, its path and its effect, then every way to brew it: a named recipe (its parts and blocks, with their path, line or projection, and whether the parts must come from one projection or from different ones), a family (only parts of one path, named by the deepest part), the flesh tonics (only flesh parts, by count), the echo (parts of two or more paths) and the Plain Tonic (anything else). The chapter opens with three notes: how the bulb works (up to three things, a positive intention brews, a negative one boils it off, three brews per alembic), which rule wins (an exact recipe, then the families, then the echo, then the Plain Tonic), and that ice adds one room to a potion that lasts for rooms.
  2. **Meals: the kitchen.** One page per meal with the part kinds that cook into it, and a note on the kitchen's three cooks.
  3. **Offerings: what the presences take.** One page per presence that takes something from the hand: a kind of part (the Listener and the Trickster a heart, the Echo any part, the Mender two parts of different kinds), any block (the Boatman), a living root or a tuft of cave moss (the Gardener, one card each) or the ore of a zone (the Cartographer, floor by floor). Each page also says what the presence gives back. Presences that take nothing (the Wanderer, the Elder, the Child, the Witness, the Star-reader) are not listed. Projections, creatures and bosses take nothing from the hand today, so they have no page.
- **Language.** Every word is in English and Spanish; the book follows a language change at once.

## Rules behind it

- **Nothing in the book is copied by hand.** Each page is read from the game's own tables (the recipes, the families, the flesh tonics, the potions, the kitchen's meals, what each presence takes, the zones' ores). A new recipe or a presence that takes something appears in the book by itself, and a test fails if the book misses one (`tests/recipe-book.test.ts`).
- **The book is knowledge, not power.** It changes nothing in the world; it only tells. The practice that opens it is a ★ practice of the mind path.
- **It belongs to the Roots.** The Book of Secrets is never drawn from a pool: from mastery level 30 the Roots always lay it on the third extra pedestal ([REWARDS §4](../levels/roots/REWARDS.md#4-the-extra-practices-the-altar-and-the-second-sanctuary)).
