[Not built](../README.md) · [Design](../../README.md)

# Presences (not built)

Status: **mixed**: decided, proposal and idea, as each document's line says.

Presences are the beings of the depths who speak: the parts of the player that already know. The built ones, the Listener, the Boundary, the Trickster, the Echo and the Wanderer, are in [built/presences](../../built/presences/README.md). This folder holds every other presence in the design, and the systems they depend on: dialogue, requests, agreements, gifts, memory across runs, the codex and the Covenant. Presences are archetypes, never gods, saints or real people; they never give orders, never diagnose and never promise a cure. The Gardener is defined in the code, and it is listed here because it is not placed.

Dwellers keep one place in the depths and remember the player across runs (see [Memory](MEMORY.md)). Messengers come once: they appear on the way, say what they came to say, and vanish.

| Document | Presence or system | Kind | Status |
|---|---|---|---|
| [GARDENER.md](GARDENER.md) | The Gardener, on one seeded floor from 1 | Dweller | partly built |
| [WITNESS.md](WITNESS.md) | The Witness, the last conversation below floor 9 (built on the ninth floor) | Dweller | partly built |
| [ELDER.md](ELDER.md) | The Elder, on one seeded floor from 1 (the Ledger Halls are not built) | Dweller | partly built |
| [CHILD.md](CHILD.md) | The Child, on one seeded floor from 1 (the Cellar of Habits is not built) | Dweller | partly built |
| [COVENANT.md](COVENANT.md) | The closed set of four gifts (its wording) | System | built |
| [CARTOGRAPHER.md](CARTOGRAPHER.md) | The Cartographer, on one seeded floor from 1 (the Tree is not built) | Dweller | partly built |
| [BOATMAN.md](BOATMAN.md) | The Boatman, by the deepest water of Zone II (built in a drowned nave) | Dweller | partly built |
| [MENDER.md](MENDER.md) | The Mender, at the first vault opened on floors 3 to 5 (Zones III and IV are not vaults yet) | Dweller | partly built |
| [STAR-READER.md](STAR-READER.md) | The Star-reader, on one seeded Tree floor from 1 (the Leaves are not built) | Dweller | partly built |
| [WANDERER.md](WANDERER.md) | The Wanderer, on one or two seeded floors from 1 | Messenger | partly built |
| [DIALOGUE.md](DIALOGUE.md) | The dialogue card and its lines | System | proposal |
| [REQUESTS.md](REQUESTS.md) | Requests from the depths, the idle window and the secret trust meter | System | decided |
| [AGREEMENTS.md](AGREEMENTS.md) | Things the player brings to a presence | System | proposal |
| [GIFTS.md](GIFTS.md) | The gifts of the depths and the promised trait | System | proposal |
| [MEMORY.md](MEMORY.md) | What dwellers remember across runs (one memory is built: the Echo's place) | System | decided |
| [CODEX.md](CODEX.md) | The codex: the presences part is built in the menu; projections, creatures and bosses are not | System | partly built |

The places some of these presences live in, the Tree and the Silence below floor 9, are not built either. The Tree's bosses are in [not-built/bosses](../bosses/README.md).

## Decisions taken by agent for issue #149 (2026-11-19, pending owner ruling)

The owner was away for the last pass of #149 and asked the build to decide what was still open. Each decision below is **decided by agent, pending owner ruling**, with its reason. Nothing here changes the Listener's 15/75/10 table, the thirteen floors or any room's band.

| # | Open item | Decision | Reason |
|---|---|---|---|
| D1 | Vaults below floor 5 | Kept on floors 1 to 5; the levels are not changed. The Mender stays on floors 3 to 5. | The Mender's design asked for Zones III and IV, but a vault on a deeper floor is a room-layout change that sotano-levels must rule on with its bands; #149 is about presences, not the vertical layout. |
| D2 | The Silence below floor 9 | Not built. The Witness keeps its quiet room on the ninth floor. | A floor below 9 changes the world's vertical layout (`LAST_FLOOR`, the loop to heaven, milestone L4), which the levels skill allows only with a band ruling. The Witness's exchange reads the same in a quiet room. |
| D3 | The closed-set reading of the Covenant | "Cierre" is a closed set: four pieces, one source each, given once, never taken back, and a complete record nothing changes. Built as a rule in code and tested. | The plainest reading of the word and of "no other source gives them"; it keeps the gift promise by construction. See [built/presences/COVENANT.md](../../built/presences/COVENANT.md). |
| D4 | The Listener's Lesson and the Light | Built: a choice card after the Listener's reward; a path gives a Lesson in words; the Lesson on floor 5 (the last Tree floor) gives the Light. | Words only, so the reward table cannot change; floor 5 is the last Listener of a run. See [built/presences/LISTENER.md](../../built/presences/LISTENER.md#the-lesson). |
| D5 | The idle window's readings | Accepted as built: a seeded 30 to 60 seconds on game time, after the exchange, for the Gardener and the Boatman. | The game sees input, not the player stepping away, so a window on idle input would pretend to know more than it does (REQUESTS.md, idle detection). |
| D6 | The reward tables (readings k to o, and t) | Accepted as built: each presence's seeded table in `heart-gifts.ts` with the weights in [GIFTS.md](GIFTS.md); one object per agreement card, on the consent pattern. | They are in code and tested; changing a weight would change seeded runs, which needs the owner's ear, not a guess. |
| D7 | The trust meter | Out of scope for #149; not built. | It counts early yeses and honest completions, and the build has no "Have you done it?" question: every request completes on Give. A hidden number with nothing feeding it would be dead code, and the safety rules keep stored data to the minimum. It is built with the question, in its own issue. |
| D8 | The Child's Lesson and the Cellar of Habits | The Lesson is built as one line in words after the gift, of no path. The Cellar is the Child's quiet room; no new room type. | The path of a build is the owner's to choose; a new room type needs a levels ruling, and a quiet room already holds no roster. |
| D9 | The Mender's integration of released projections | Not built. The Mender takes one part in hand. | A released projection dissolves for good; bringing one back as an ally needs an ally-return system and the gold-seam art, neither in #149. |
| D10 | The Thread's form | A run record, not an inventory item, shown as a labelled tile with a seam in the inventory. | A record cannot be dropped or stolen, so the promise holds; the labels and the seam are in the art ledger (DECISIONS.md §14.2). |
| D11 | Multi-part agreement cards | Not built. Every card names one object. | No built exchange asks for several objects; making one would change a built presence (the Mender's one part) or need materials that are not in the game (D13). The consent rule already holds: the card names the exact object. |
| D12 | The Boatman's pocket | The nave's island stays the pocket; the template is not changed. | Removing the stepping stones or drawing a new pocket is a room change for sotano-levels; the ferry already makes the toll the plain way across. |
| D13 | The Gardener's and the Cartographer's materials | **Owner ruling (2026-11-19, issue #228): yes.** Built: six new blocks, a living root, cave moss and the ores of Zones II to V (iron ore stays the ore of the roots and Zone I). The Gardener asks for a root and a tuft of moss instead of a flesh part; the Cartographer charts the whole floor for the ore of its zone. The earlier agent decision (no new materials) is withdrawn. | The owner said yes to the materials the designs name. The decisions the build took to make them, each with its reason, are in the table below (D13a to D13h). |
| D14 | The Leaves as a room | Not a room. The Star-reader keeps its quiet room on a Tree floor. | The Leaves are a story of the giant tree above, not a place in the floor plan; a room there is a vertical-layout change. |
| D15 | The star map | Built later, not in #149. | It is not small: a map view of the floor, the teleport doors, the pocket marks and their art. The Cartographer's and the Star-reader's words stand in for it. |
| D16 | The art needs | Recorded as owed in DECISIONS.md §14.2 with the exact check for each; the Covenant's labels and seam are built. | Bodies and portraits need the gallery gate of sotano-art, which a headless capture cannot replace. |

## D13: the presences' materials (owner ruling 2026-11-19, built)

The owner said yes to the Gardener's and the Cartographer's materials. The build decided how, and each choice below is **decided by agent, pending owner ruling**. Nothing here changes the Listener's 15/75/10 table, the thirteen floors or any room's band. Code: `src/content/materials.ts` (ids 47 to 52, `ORES`, `GARDEN_MATERIALS`), `src/content/levels.ts` (`ZONES`, `oreOf`, `zoneOf`, `garden`), `src/world/floor.ts` (`fillRock`, `zoned`), `src/content/presences/index.ts`, `src/game/game.ts`. Tests: `tests/presence-materials.test.ts`. Look: [DECISIONS.md §6.7](../../../art/DECISIONS.md).

| # | Question | Decision | Reason |
|---|---|---|---|
| D13a | Which ores | One per zone, the planetary metals of the old alchemists: iron (Zone I, and the roots), copper (II, the Flooded Rooms), tin (III, the Ledger Halls), quicksilver (IV, the Furnace), lead (V, the Frozen Bottom). | The designs name "the ores of each zone" and no list. Iron ore already existed; the metals' old meanings fit the zones (Venus and feeling by the water, Jupiter and the law in the ledgers, Mercury and the many faces in the fire, Saturn and the weight at the bottom), as above, so below. No gold: gold is the player's light. |
| D13b | The names | Living root (Raíz viva), Cave moss (Musgo de cueva), Copper ore (Mineral de cobre), Tin ore (Mineral de estaño), Quicksilver ore (Mineral de azogue), Lead ore (Mineral de plomo). | "Moss" is already the sky's block, and "Root bark" the giant tree's; the new names never collide. *Azogue* is the old Spanish word for quicksilver. |
| D13c | Where the ores are | The ore veins of a floor's rock, and every ore block a room template places (`i`, and the `~` and `!` decor slots), are the ore of that floor's zone. The share of veins per floor is unchanged. | A substitution, not a new random draw: the rooms, the plans and every seeded choice stay the same (GEN_VERSION 36 only because the blocks differ). |
| D13d | Where the root and the moss are | In the rock of every floor, a share of 3 % on the roots, 2 % on floors 1 to 2, 1.5 % on 3 to 4, 1 % on 5 to 6 and 0.8 % below; roots in strands two blocks tall. | The Gardener waits on any floor from 1 to 9, so what it asks for must be found on the floor it stands on; more near the surface, where roots belong. No room template changes, so no band is touched (sotano-levels). |
| D13e | Their blocks | The root and the moss are soft (tier 0, the root burns like wood); the four new ores are as hard as iron ore (tier 2, 18 points, heavy). | They are gathered with the hands the player already has; the ores keep one family. |
| D13f | What the Gardener asks for | A living root and a tuft of cave moss, one consent card for each (D11: every card names one object), in either order. Once it holds both it plants, says its two lines and stays, as before. It gives nothing back (unchanged open question). The flesh part is no longer asked for. | The agreement in AGREEMENTS.md asks for exactly these two; the flesh part was a stand-in while the materials did not exist. |
| D13g | What the Cartographer marks with its ore | With the ore of the zone it waits in, it asks for it on a consent card; Give charts the whole floor, the nearest vault and the nearest boss, on one card. Keep takes nothing and opens its free choice card (one mark), as before. | "One ore from every zone crossed" would need a multi-part card (D11) and a count of zones crossed; one ore of its own zone keeps one object per card and still charts the floor. The every-zone version stays in [CARTOGRAPHER.md](CARTOGRAPHER.md). |
| D13h | Rewards and recipes | No reward table gives these materials (the Listener's 15/75/10 is unchanged and tested). Every ore counts where a recipe asks for an ore (the Questioning Tincture). | The owner asked to keep them out of the Listener's table; a recipe that asked for iron ore would otherwise fail below floor 2, where no iron is found. |

## Roster status (2026-11-19, issue #149)

What is still open, and what blocks each one. A presence moves to [built/presences](../../built/presences/README.md) only when its text is in the code.

| Presence or system | Blocked by | Done in this pass |
|---|---|---|
| The Gardener | Its memory | Placed on one seeded floor from 1 (never the tutorial); asks for a root and a tuft of moss (D13f); the rest stays in its document |
| The Wanderer | Its wall walk, its hand-tied line and the corridor | Built as a messenger with a consent gift; the rest stays in its document |
| The Child | The Cellar of Habits, the path rule for a build, the Lesson, the Request and the Agreement | Built on one seeded floor from 1: the consent to build three blocks, then one gift; the rest stays in its document |
| The Elder | The Ledger Halls, the page of ledger stone and the Covenant's Page | Built on one seeded floor from 1: a path choice on the choice card and a lesson of that path; the rest stays in its document |
| The Witness | The Silence below floor 9 and the hexagram source check | Built on the ninth floor in a quiet room, a tier 2 gift by consent; the Reading, the parts and the Seal are not built |
| The Mender | A released projection that comes back (dissolve is final today), and a levels ruling for vaults below floor 5 | Built at the first vault opened on floors 3 to 5: one part for a quality-three practice or a special heart; the rest stays in its document |
| The Cartographer | The Tree's crossroads, the star map, the hidden pocket and the ore of every zone crossed | Built on one seeded floor from 1, with the vault and boss marks in words, and the whole floor charted for the ore of its zone (D13g); the rest stays in its document |
| The Boatman | A pocket that is unreachable otherwise, and a levels ruling | Built by the drowned nave of floor 3 or 4: a block as toll, a ferry to the island, a tier 2 gift; the key and bomb tolls are not built |
| The Star-reader | The Leaves of the Tree (a room a presence can stand in), the star map and the doors | Built in a quiet room of one Tree floor, a Take or Decline gift; the reading in words only, the rest stays in its document |
| Requests, the idle window, dialogue, the codex | The owner's ruling on the requesters' leave rule and on the trust meter | Requests (the Gardener, the Boatman) and the idle window (30 to 60 seconds) are built, pending a ruling; the codex lists the presences met; the choice card is built and is the first piece of dialogue; the trust meter and the other requests are not built |
| The Covenant | Nothing (D3, D4) | Built: the record, the four pieces, the closed-set rule, the set effect and the inventory labels |
| Agreements beyond the built ones | The owner's readings k to o and multi-part cards | Trickster, Echo, Mender and Boatman are built; the rest are moved to [AGREEMENTS.md](AGREEMENTS.md) with the reason |
| The Thread as an item | Nothing (D10) | A record piece with its inventory label and seam |
| The Leaves, the star map, the Boatman's pocket, the Silence below floor 9, vaults below floor 5 | Decided (D1, D2, D12, D14, D15) | Not built, by decision: the levels are not changed |

## Issue #149: status (2026-11-19, final pass)

Built in the issue: the codex, the idle window, the requests (the Gardener, the Boatman, the Child and the Elder), the choice card, the Covenant with its four pieces, its closed-set rule, its set effect and its inventory labels, the Listener's Lesson and the Light, the Child's Lesson, and the Mender, Star-reader, Witness, Boatman, Wanderer, Child, Elder, Cartographer, Trickster and Echo.

Decided and not built, with the reason in the table above: D1, D2, D7, D9, D11, D12, D14 and D15. D13 was ruled by the owner and is built (D13a to D13h). Art owed with its exact checks: D16.

Every item of the issue is built or decided in this document. The decisions are the agent's and wait for the owner's ruling.
