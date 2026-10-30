# Potions

Status: proposal, owner-approved brewing rules. Built so far: the laboratory's alembic with those rules, the flask, the drink and two recipes (Plain Tonic and Restoring Draught), in [built/laboratory](../../../built/laboratory/README.md). The other nine recipes, the Distillate, the warmth field and the codex are not built. The owner approved three brewing rules on 2026-10-28 (see [BREWING-RULES](BREWING-RULES.md)); the recipes, durations, the drink verb and the rest of the system are proposed.

A potion is a preparation of what a released pattern left behind. The alembic in a laboratory takes the captive matter (the parts) and brews it into a flask. Drinking the flask is a short state, never medicine. The proposal answers the owner's request to find a use for parts and to give the alchemy of the descent a hands-on form. It also gives one answer to the design question that asks for a purpose for items and parts ([DESIGN](../README.md) §13, item 8).

Read with: [BESTIARY](../README.md) (parts, agreements, the Compost, the codex), [STATIONS](../../stations/ALEMBIC.md) (the alembic, which this folder owns the brewing of), [ITEMS](../../../../architecture/ITEMS.md) and [RNG](../../../../architecture/RNG.md).

## What is approved and what is proposed

| Item | Status | Source |
|---|---|---|
| Only a positive intention brews | **Approved** 2026-10-28 | POTIONS §7, question 3 |
| Three brews per alembic per run | **Approved** 2026-10-28 | POTIONS §7, question 2 |
| One laboratory and one alembic per zone (five per run) | **Approved** 2026-10-28 | POTIONS §7, question 1 |
| No shop: the alembic closes the "parts need a purpose" task; trades stay with the Trickster | **Approved** 2026-10-28 for "no shop"; the Trickster is the default | POTIONS §7, question 9 |
| A negative intention boils the bulb off without spending a brew | Part of question 3's default; to confirm | [BREWING-RULES](BREWING-RULES.md) §2 |
| The drink verb, its timing, flask in the hand | Proposal | [BREWING-RULES](BREWING-RULES.md) §3 |
| The eleven recipes, their numbers and durations | Proposal | this folder, one document per recipe |
| Room-counted durations, the Distillate, the codex, agreements asking for potions | Proposal | [RECIPE-MODEL](RECIPE-MODEL.md), [HOW-IT-FITS](HOW-IT-FITS.md) |

## Documents

| Document | Contents |
|---|---|
| [BREWING-RULES](BREWING-RULES.md) | The approved brewing rules, the rules that follow from them, and the proposed drink verb |
| [RECIPE-MODEL](RECIPE-MODEL.md) | How a bulb's contents match a recipe, ice, outputs, durations, and how potions stay scarce |
| [PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md) | Where parts come from, how they are held, what they do today, and the claims to check |
| [HOW-IT-FITS](HOW-IT-FITS.md) | Polarity and the splash, promised gifts, the hand, practices and synergies, agreements and the codex |
| [RISKS-AND-TESTS](RISKS-AND-TESTS.md) | The ten risks and the test that catches each one |
| [BUILD-ORDER](BUILD-ORDER.md) | Three steps, and the documents to update when they are built |
| [OPEN-QUESTIONS](OPEN-QUESTIONS.md) | Questions for the owner, conflicts between documents, and unverified claims |

### The eleven recipes

Each recipe is its own document, because each one has its own contents, effect and reason to be scarce.

| # | Potion | Path | Duration | Document |
|---|---|---|---|---|
| 1 | Plain Tonic | body | instant | [PLAIN-TONIC](PLAIN-TONIC.md) |
| 2 | Restoring Draught | body | instant | [RESTORING-DRAUGHT](RESTORING-DRAUGHT.md) |
| 3 | Footing Tincture | body | 3 rooms | [FOOTING-TINCTURE](FOOTING-TINCTURE.md) |
| 4 | Spring Tonic | body | floor | [SPRING-TONIC](SPRING-TONIC.md) |
| 5 | Clear Infusion | mind | 3 rooms | [CLEAR-INFUSION](CLEAR-INFUSION.md) |
| 6 | Questioning Tincture | mind | one lock, or the floor | [QUESTIONING-TINCTURE](QUESTIONING-TINCTURE.md) |
| 7 | Warm Cordial | emotion | 3 rooms | [WARM-CORDIAL](WARM-CORDIAL.md) |
| 8 | Open-Hand Elixir | emotion | floor | [OPEN-HAND-ELIXIR](OPEN-HAND-ELIXIR.md) |
| 9 | Ember Tonic | will | 3 rooms | [EMBER-TONIC](EMBER-TONIC.md) |
| 10 | Patient Draught | will | floor | [PATIENT-DRAUGHT](PATIENT-DRAUGHT.md) |
| 11 | Distillate of (a pattern) | the pattern's path | run | [DISTILLATE](DISTILLATE.md) |

## The fiction in brief

A released pattern leaves captive matter: the light it held shut, still in the shape the pattern gave it. Releasing the pattern frees the player, but the matter keeps its shape. A potion is a preparation of that matter. In the alembic, the matter is moved along its own pole until it gives back the quality the pattern was guarding. The four kinds of part are four depths of one pattern: flesh is its matter, mind its thought, heart its feeling, and essence what it was protecting.

Only a positive intention prepares a potion, because preparation is care. Drinking is integration: what blocked the player, prepared with attention, is taken back in. The names of the kinds and the philosophy behind them are in [CONCEPTS](../../../../lore/CONCEPTS.md) and [COSMOLOGY](../../../../lore/COSMOLOGY.md).

## Rules for every potion

- **A short state, never medicine.** No text calls a potion a cure, a treatment, a therapy, a medicine, a medication or a dose of anything real. Tests catch the words ([RISKS-AND-TESTS](RISKS-AND-TESTS.md), risk 9).
- **Names are proposals.** Every name, line and number needs Spanish through [sotano-i18n](../../../../../.claude/skills/sotano-i18n/SKILL.md).
- **Art gate.** The flask, the alembic and the eleven icons pass [sotano-art](../../../../../.claude/skills/sotano-art/SKILL.md) before they ship.

## Terms

- **Alembic:** the station that brews. A block entity with a bulb, a coil and a flask stand ([stations](../../stations/ALEMBIC.md)).
- **Bulb:** the alembic's glass top, where cubes go in. It holds three cubes.
- **Brew:** one completed preparation. Each alembic has three per run.
- **Flask:** the potion as an object in the hand, before and after it is drunk.
- **Warmth:** the conversion meter of a projection, used here for positive hits. This proposal uses the word; its definition is not checked here, and no event exposes it today.

## Unverified claims

- "152 parts from 38 projection files" (POTIONS §0) is not verified here; see [PARTS-AND-SUPPLY](PARTS-AND-SUPPLY.md).
- The bestiary's "twelve parts" count is called stale by POTIONS §0; not checked here.
