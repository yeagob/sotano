# Open questions: potions

Status: proposal. The owner decided three brewing rules on 2026-10-28. The rest of this list is open, each with the proposal's default where there is one. Index: [potions](README.md).

## Approved and to confirm

These follow from the approved rules but were not named by the owner.

1. **Boil-off.** A negative intention on a loaded bulb boils it off, with no brew spent. Default: yes. Part of approved question 3 by implication; the owner must confirm ([BREWING-RULES](BREWING-RULES.md) §2).
2. **The bulb's limits.** Three cubes per bulb, and fed cubes never come back. Default: yes (POTIONS §2); not in the approval text.

## Proposed defaults, not decided

These are the questions 4 to 12 of the proposal's §7 (the original POTIONS document, now split into this folder). Each default is the proposal's, not the owner's.

4. **Holding.** A flask in the hand, competing with blocks and parts, rather than a pocket counter like keys and bombs? Default: the hand.
5. **Durations in rooms cleared**, never seconds on screen? Default: yes.
6. **The Distillate** lasts the whole run, one per pattern? Default: yes.
7. **Recipes fixed in every run**, or some that change with the seed ([DESIGN](README.md) §9)? Default: fixed now; one seeded recipe can come later.
8. **The codex** keeps brewed recipes across runs? Default: yes, as knowledge only.
9. **The shop.** Does the alembic, with the agreements, close the "parts need a purpose" task and keep "no coins, no shop"? Default: yes; the Trickster's trades stay the only exchange. The owner approved "no shop"; the Trickster part is the default only.
10. **A care route to parts.** Should a converted ally's gift at full health (BESTIARY §1.1, not built) be its pattern's essence? Default: no; force gives parts, care gives a friend (BESTIARY §8.8).
11. **Drinking leaves the player exposed** for 0.4 seconds, with no casting? Default: yes.
12. **Agreements may ask for potions** from Zone III on? Default: yes.

Questions 1 to 3 of the proposal are approved (one alembic per zone, three brews, positive intentions only); see [BREWING-RULES](BREWING-RULES.md) §1.

## Conflicts between documents

| Conflict | Documents | Needed |
|---|---|---|
| The alembic brews parts, or makes an essence from water and a husk | This folder against [STATIONS §4.4](../../stations/ALEMBIC.md) | The owner names the alembic's one purpose |
| "Eat with F" | [POTIONS §0 and §5](README.md) say STATIONS uses F to eat. The STATIONS text says the use key | None here; the controls skill chooses the key. F is polarity ([KEYBOARD](../../../../architecture/input/KEYBOARD.md)) |
| Laboratory floors | [STATIONS themed rooms](../../stations/THEMED-ROOMS.md) put the laboratory on floors 3 and 8; this folder puts it on 2, 4, 6 and 8 | Which floors |
| The name Compost | [BESTIARY §8.8](../../encounters/COMPOST.md) (a farming room) and [the station](../../stations/COMPOST.md) | One name |
| Parts held in the hand, or in the inventory | This folder and src/content/parts.ts header disagree | The owner decides which is true; see [PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md) §2 |
| The Distillate's contents | Table (heart, mind and essence) against the text ("the whole bulb") | [DISTILLATE](DISTILLATE.md), question 1 |

## Unverified claims

- "152 parts from 38 projection files" and the 12 hand-drawn icons: not counted here.
- The bestiary's "twelve parts" and its staleness.
- EnemyDef has no path field (POTIONS §0): not searched for here.
- No warmth event: consistent with [ITEMS](../../../../architecture/ITEMS.md) §3.

## Technical questions (for the architecture, not decided here)

- A warmth field on the damage and spawn events, needed by Warm Cordial, Open-Hand Elixir and the Distillate.
- A path field on enemies, needed by the lineage and path matching.
- The three-party review before the laboratory room is added.

## Found while splitting the proposal

| Finding | Where | Needed |
|---|---|---|
| Zone V's laboratory (floor 9) is on the same floor as its Compost; the proposal's own rule puts the laboratory on a floor without the Compost | [ALEMBIC](../../stations/ALEMBIC.md), where the table is | The owner or the proposal's author chooses floor 9 or another floor |
| The proposal says "only a gold intention prepares a potion"; the rest of the text says "positive" | [POTIONS §1](README.md) | Confirm that gold is the positive colour in the intentions folder ([built/intentions](../../../built/intentions/POLARITY.md)); not checked here |
| The proposal's step 4 names a "codex" that the bestiary also names; the bestiary's codex is not checked here | [BESTIARY §9](../../presences/CODEX.md) | Check the bestiary before the codex is built |
