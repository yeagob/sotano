# Recipe model

Status: proposal. The brewing caps are approved (see [BREWING-RULES](BREWING-RULES.md) §1); the matching, ice, durations and scarcity list are proposed. Index: [potions](README.md).

How a bulb's contents become a potion, how long a potion lasts, and how potions stay scarce.

## 1. Inputs

- **The bulb's whole contents**, as a set of up to three cubes. Order does not matter.
- **Parts** match by **kind** (flesh, heart, mind or essence) and by **source**, at one of four levels: the exact pattern; its **lineage** (Doubt, Second-Guessing, Paralysis); its **path** (body, mind, emotion or will, from the bestiary's tables); or any.
- **Material cubes** match by their material.
- **Ice** is a modifier, not an input (§3).

## 2. Matching

- A recipe matches only if it accounts for every cube in the bulb, exactly, except ice.
- When several recipes match, the most specific wins: exact pattern, then lineage, then path, then any; and among equal specificity, more inputs beat fewer.
- A validator proves that no two recipes tie for any possible bulb ([RISKS-AND-TESTS](RISKS-AND-TESTS.md), risk 5).
- Nothing matched gives **Plain Tonic**. A brew is never nothing: the reward rule of [BESTIARY](../../presences/REQUESTS.md) §8.5 applies.
- The result is pure. There is no roll and the order of the cubes does not matter.

## 3. Ice

Ice takes a slot and keeps the brew cold. A potion counted in rooms then lasts one room more. On instant or floor-long potions, ice does nothing. Ice comes from floor 9 and cold rooms ([CARRYABLES](../../stations/CARRYABLES.md)).

## 4. Output

- One flask per brew.
- The flask's effect is installed when it is drunk, under its own source (one source per potion), and removed when its duration ends.
- Recipes are **content, not seed**. The same bulb gives the same potion in every run, so knowledge carries across runs. The brainstorm's "recipes that change with the seed" stays possible later ([OPEN-QUESTIONS](OPEN-QUESTIONS.md), question 7).

## 5. Durations

Durations never use a clock on screen. They are counted in rooms or floors.

| Duration | Ends |
|---|---|
| Instant | At once |
| *N* rooms | After *N* sealed rooms are cleared, and at the latest on the next floor entry |
| Floor | On the next floor entry |
| Run | At the end of the run |

Room counts tick on sealed rooms only. A challenge room's waves do not burn a potion faster, and a quiet floor does not stretch it ([RISKS-AND-TESTS](RISKS-AND-TESTS.md), risk 3).

## 6. Scarcity

The approved cap is three brews per alembic per run (BREWING-RULES §1). The rest is the proposal's logic, borrowed from the Compost.

1. **Three brews per alembic per run, five alembics:** at most fifteen potions in a run, whatever the supply of parts, challenge rooms included.
2. **One flask per brew.** A flask takes a hand slot, competing with blocks, parts and the toll.
3. **No stacking.** Drinking a potion that is already active refreshes its duration to the full value. It never adds a second source.
4. **Rarity by kind.** Strong and long effects need hearts (about 5 %) and essences (about 2 %). Flesh only buys instant healing.
5. **Room-counted durations** tick on sealed rooms only (§5).
6. **The parts supply keeps the Compost's falloff** (100, 75 and 50 %) and its rest after three harvests. Potions add no new source of parts ([PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md)).

## 7. Terms of the table

The table in each recipe document uses these words:

- **Heart** and **essence** are the rarest kinds; the rates are the release chances in [PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md).
- **Lineage** is a pattern's family (Doubt, Second-Guessing, Paralysis), as in the bestiary.
- **Heal a heart** means eight points of health; the health item values are in [ITEMS](../../../../architecture/ITEMS.md).
