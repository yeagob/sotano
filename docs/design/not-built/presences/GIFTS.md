[Presences](README.md)

# Gifts of the depths

Status: **proposal** (design text, bestiary section 8.7). Names are proposals; effects go through the items skill when built.

The presences give gifts: objects with a name, a line of text and a plain effect line, like practices, shown in the inventory. A gift is the reward of a request or an agreement.

## Reward distribution

Every Presence reward is selected from a seeded probability distribution with outcomes of different value, from a lesser result to a better one. The roll belongs to the run's deterministic seeded sequence, so the same seed and preceding sequence of events reproduce the same result. Each Presence has its own table and weights; the exact tables remain open until that Presence is designed. The built Listener's guaranteed reward and its existing 15/75/10 table are not changed by this future rule.

The tables of the built presences (all rolled from the `drops` stream when the offer is accepted):

| Presence | Table (`heart-gifts.ts`) | Outcomes and weights | Status |
|---|---|---|---|
| The Listener | `listener-heart-gift` | practice with maximum-health 15; special hearts 75 (one heart 90%, two different 10%); two red hearts 10 | built, unchanged |
| The Trickster | `trickster-deal` | quality-three practice 4; quality-three health practice 1 | built, proposed pending owner ruling |
| The Echo | `echo-gift` | key 1; bomb 1 | built, proposed pending owner ruling |

The Trickster's gift is a practice, not the Trickster's Coin of the tier list below; the coin is not built.

Decided by agent for #149 (README D6): the tables above are accepted as built, pending the owner's ear.

## Tiers

| Tier | Gift names (proposals) | Given by |
|---|---|---|
| 1 | Gardener's Seed, Stone from the Way, Small Promise | The Gardener, the Child, the Wanderer, the Echo |
| 2 | Listener's Ear, Cartographer's Ore, Ledger Page, Trickster's Coin | The Listener, the Cartographer, the Elder, the Boatman, the Trickster |
| 3 | Mender's Thread, Witness's Mirror | The Mender, the Witness |

## The promised trait

Every gift bears a thin gold seam, the mark of kintsugi: what was mended is stronger. A promised item cannot be dropped, destroyed or stolen (Scarcity cannot take it), and it stays in the pack when the rest is thrown away. Its label says "promised" in small type. The mark belongs only to gifts, so a seam means "given".

## Inventory labels

Every inventory slot shows a small label with the item's name, always visible, in the player's language. This covers practices, blocks, parts, gifts and the Covenant. Labels exist only in the inventory: the world never writes names over the items. The labels are text, so they go through the translations.

## Open questions

- **Effects.** Each gift's effect is designed with the items skill and is not chosen yet.
- **Names.** The names are proposals; the owner has not approved them.
- **Labels.** Whether the build's inventory already shows labels for practices, and what it does for the other kinds, must be checked before the labels for gifts are written.
- **Promise and loss.** A promised item that the player throws away must not be lost by any other rule. Check the rule against every drop and every theft.
