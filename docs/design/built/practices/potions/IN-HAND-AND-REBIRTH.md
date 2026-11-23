# Potions in hand, and the Rebirth Draught

Up: [practices](../README.md) · built (issue #52, the potions part). The owner's additions to #52 are validated here by the orchestrator on the owner's behalf; the decisions are listed under "Open for the owner".

Potions are the active-item system of the hand: whatever flask or meal is chosen in the hand is the one the drink key uses, and the player must always know which it is.

## In hand

- **Held label.** While a flask or a meal is the active carried item, its name and what it does sit above the hand as a persistent label (the `#held` element; sotano-popups "Held label"). The recipe is never shown. Changing the choice updates it at once.
- **Crafted, held up.** A meal cooked in a kitchen, and a flask the alembic brews, are held up in both hands for a moment, as a part taken from the floor is, and a toast names them (issue #290). Each meal has its own food icon in the hand (issue #291); the potions keep the bottle.
- **Inventory (Tab, every device).** With a flask or meal in hand, the inventory opens with an "In hand" block at the top: the name, the effect, and the duration ("Takes effect at once.", "Lasts N sealed rooms.", "Lasts until the next floor.").
- **Choosing among six or more carried items.** The number keys 1 to 9 choose slot 1 to 9; the wheel and the D-pad left and right step through the hand, wrapping round; a tap on a slot of the hand (touch) and a click in the inventory choose a slot. The unit tests cover choosing and stepping through six slots (`tests/rebirth-draught.test.ts`). The live check at carry 6 or more on each device is not done yet (see the report of the change).

## The Rebirth Draught

- **Name and effect:** "Rebirth Draught", "Starts the run again from the first floor, keeping every practice you hold."
- **Path:** mind. **Liquid:** the milagros glow (`path.milagros.glow`). **Duration:** at once.
- **Recipe (hard):** one heart of will, one mind of mind and one flesh of body, in any order (three parts, three paths). Brewed in the alembic like the other eleven recipes.
- **Drinking it asks first.** The offer card (the presence offer type, reused: a question with two answers) asks "Begin again from the first floor?" with "Begin again" and "Not yet". The flask stays in hand until the player says yes. "Not yet" keeps the flask and the run.
- **What a yes does.** The flask leaves the hand. The run restarts from the first floor with a new seed. Every practice held is kept, with its stacks (`Inventory.serialize()` read before the restart, `restore()` after the run begins, so the practices' effects are installed again and no achievement or banner runs). Keys, bombs, hearts and the carried items start as a new run's: the hand is empty, keys 0, bombs 1, and the hearts are full at the new maximum. Potion effects end (a new run clears them).
- **Never in the sandbox.** In the sandbox the draught does nothing and the toast says so; the flask stays in hand.
- **No save write from generation.** The restart is the same new-run path as R; the save is not written by the draught's generation.

## Open for the owner

These are the orchestrator's decisions made while the owner was asleep. Each can be changed in one place.

1. The recipe: heart of will, mind of mind, flesh of body, any order. The owner asked for a hard recipe; the three paths are the reason it is hard.
2. The confirm card reuses the presence offer type (a yes or no question), so its look and its controls are the offer card's. Its answers are "Begin again" and "Not yet"; the touch control text names those buttons.
3. The label shows the name and the effect only (no duration): the duration is in Tab.
4. A Rebirth Draught in the sandbox says "Here the Rebirth Draught does nothing" and changes nothing.
5. The new run's hearts are full at the new maximum; the practices that raise the maximum are kept, so the maximum is the kept one.
6. The validation the issue asks for: the owner has not reviewed this text yet.

Related: [potions (not built)](../../../not-built/practices/potions/README.md), [recipes](../../laboratory/recipes/README.md), [HUD](../../feel/HUD.md).
