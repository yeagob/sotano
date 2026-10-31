# Recipe model

Status: proposal. The brewing caps are approved (see [BREWING-RULES](BREWING-RULES.md) §1). Index: [potions](README.md).

The matching of the bulb (inputs, the four levels, most specific wins, the Plain Tonic fallback), ice, the output and the room and floor durations are built: they moved to [built/laboratory/recipes](../../../built/laboratory/recipes/README.md). This document keeps what is not built.

## 1. The run-long duration

| Duration | Ends |
|---|---|
| Run | At the end of the run |

Only the [Distillate](DISTILLATE.md) uses it. A floor entry must keep it ([RISKS-AND-TESTS](RISKS-AND-TESTS.md), risk 3).

## 2. Recipes that change with the seed

Recipes are content, not seed, and that is built. The brainstorm's "recipes that change with the seed" stays possible later ([OPEN-QUESTIONS](OPEN-QUESTIONS.md), question 7).

## 3. Scarcity

The approved cap is three brews per alembic per run (BREWING-RULES §1). The rest is the proposal's logic, borrowed from the Compost.

1. **Three brews per alembic per run, four alembics:** at most twelve potions in a run, whatever the supply of parts, challenge rooms included. The owner decided on 2026-10-30 to keep four alembics (floors 2, 4, 6 and 8), not one per zone.
2. **One flask per brew.** A flask takes a hand slot, competing with blocks, parts and the toll. Built.
3. **No stacking.** Drinking a potion that is already active refreshes its duration to the full value. Built.
4. **Rarity by kind.** Strong and long effects need hearts (about 5 %) and essences (about 2 %). Flesh only buys instant healing, with one exception: the Footing Tincture, by the owner's decision of 2026-10-30. The Patient Draught takes a heart instead, and a test keeps the rule.
5. **Room-counted durations** tick on sealed rooms only. Built.
6. **The parts supply keeps the Compost's falloff** (100, 75 and 50 %) and its rest after three harvests. Potions add no new source of parts ([PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md)).

## 4. Terms of the table

The table in each recipe document uses these words:

- **Heart** and **essence** are the rarest kinds; the rates are the release chances in [PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md).
- **Lineage** is a pattern's family (Doubt, Second-Guessing, Paralysis), as in the bestiary.
- **Heal a heart** means eight points of health; the health item values are in [ITEMS](../../../../architecture/ITEMS.md).
