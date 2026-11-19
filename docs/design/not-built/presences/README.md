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
| [CARTOGRAPHER.md](CARTOGRAPHER.md) | The Cartographer, on one seeded floor from 1 (its mark goes on the star map) | Dweller | partly built |
| [BOATMAN.md](BOATMAN.md) | The Boatman, by the deepest water of Zone II (built in a drowned nave) | Dweller | partly built |
| [MENDER.md](MENDER.md) | The Mender, at the first vault opened on floors 3 to 5 (Zones III and IV are not vaults yet) | Dweller | partly built |
| [STAR-READER.md](STAR-READER.md) | The Star-reader, on one seeded Tree floor from 1 (its reading draws the stars' chain on the star map) | Dweller | partly built |
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
| D4 | The Listener's Lesson and the Light | Built: a choice card after the Listener's reward; a path gives a Lesson in words; the Lesson on floor 5 (the last Tree floor) gives the Light. **Owner ruling (2026-11-19): the Light goes at the top of the tree.** The crown's place is built as one constant, `CROWN_PLACE` (`src/world/crown.ts`), the centre of the Leaves; the Light's trigger is placed there by its own change, which reads that constant. | Words only, so the reward table cannot change; floor 5 is the last Listener of a run. See [built/presences/LISTENER.md](../../built/presences/LISTENER.md#the-lesson) and [the Leaves](../../built/levels/giant-tree/LEAVES.md). |
| D5 | The idle window's readings | Accepted as built: a seeded 30 to 60 seconds on game time, after the exchange, for the Gardener and the Boatman. | The game sees input, not the player stepping away, so a window on idle input would pretend to know more than it does (REQUESTS.md, idle detection). |
| D6 | The reward tables (readings k to o, and t) | Accepted as built: each presence's seeded table in `heart-gifts.ts` with the weights in [GIFTS.md](GIFTS.md); one object per agreement card, on the consent pattern. | They are in code and tested; changing a weight would change seeded runs, which needs the owner's ear, not a guess. |
| D7 | The trust meter | Out of scope for #149; not built. | It counts early yeses and honest completions, and the build has no "Have you done it?" question: every request completes on Give. A hidden number with nothing feeding it would be dead code, and the safety rules keep stored data to the minimum. It is built with the question, in its own issue. |
| D8 | The Child's Lesson and the Cellar of Habits | The Lesson is built as one line in words after the gift, of no path. The Cellar is the Child's quiet room; no new room type. | The path of a build is the owner's to choose; a new room type needs a levels ruling, and a quiet room already holds no roster. |
| D9 | The Mender's integration of released projections | Not built. The Mender takes one part in hand. | A released projection dissolves for good; bringing one back as an ally needs an ally-return system and the gold-seam art, neither in #149. |
| D10 | The Thread's form | A run record, not an inventory item, shown as a labelled tile with a seam in the inventory. | A record cannot be dropped or stolen, so the promise holds; the labels and the seam are in the art ledger (DECISIONS.md §14.2). |
| D11 | Multi-part agreement cards | Not built. Every card names one object. | No built exchange asks for several objects; making one would change a built presence (the Mender's one part) or need materials that are not in the game (D13). The consent rule already holds: the card names the exact object. |
| D12 | The Boatman's pocket | The nave's island stays the pocket; the template is not changed. | Removing the stepping stones or drawing a new pocket is a room change for sotano-levels; the ferry already makes the toll the plain way across. |
| D13 | The Gardener's and the Cartographer's materials | No new materials. The Gardener keeps its flesh part; the Cartographer marks in words. | A root, a moss and the ores of each zone are not materials of the run; adding blocks needs items, levels and art rulings. |
| D14 | The Leaves as a room | **Owner ruling (2026-11-19): the owner refused "not a room", so the Leaves are a room.** Built: a room template carved in the crown, beside the last stair, inside the canopy's band ([LEAVES](../../built/levels/giant-tree/LEAVES.md)). The Star-reader keeps its quiet room on its Tree floor (decided by agent: the Leaves hold no presence yet). | The tree holds no projections, presences or elements yet; moving the Star-reader up would change who meets it and when, which needs the owner's ear. |
| D15 | The star map | **Owner ruling (2026-11-19): it goes in the crown, and Opus designs it.** Built: the menu's third tab, the floor as a constellation with the Cartographer's mark and the Star-reader's room, and the crown from above with the Leaves and the stars, whose chain is drawn once the Star-reader has read it ([STAR-MAP](../../built/levels/giant-tree/STAR-MAP.md)). The hidden pocket is not built. | The doors of the design are the star pads, which already carry you; the map shows them, it does not move you. |
| D16 | The art needs | Recorded as owed in DECISIONS.md §14.2 with the exact check for each; the Covenant's labels and seam are built. | Bodies and portraits need the gallery gate of sotano-art, which a headless capture cannot replace. |

## Roster status (2026-11-19, issue #149)

What is still open, and what blocks each one. A presence moves to [built/presences](../../built/presences/README.md) only when its text is in the code.

| Presence or system | Blocked by | Done in this pass |
|---|---|---|
| The Gardener | Its memory and its root-and-moss agreement | Placed on one seeded floor from 1 (never the tutorial); asks for a flesh part; the rest stays in its document |
| The Wanderer | Its wall walk, its hand-tied line and the corridor | Built as a messenger with a consent gift; the rest stays in its document |
| The Child | The Cellar of Habits, the path rule for a build, the Lesson, the Request and the Agreement | Built on one seeded floor from 1: the consent to build three blocks, then one gift; the rest stays in its document |
| The Elder | The Ledger Halls, the page of ledger stone and the Covenant's Page | Built on one seeded floor from 1: a path choice on the choice card and a lesson of that path; the rest stays in its document |
| The Witness | The Silence below floor 9 and the hexagram source check | Built on the ninth floor in a quiet room, a tier 2 gift by consent; the Reading, the parts and the Seal are not built |
| The Mender | A released projection that comes back (dissolve is final today), and a levels ruling for vaults below floor 5 | Built at the first vault opened on floors 3 to 5: one part for a quality-three practice or a special heart; the rest stays in its document |
| The Cartographer | The Tree's crossroads, the star map and the hidden pocket | Built on one seeded floor from 1, with the vault and boss marks in words; the rest stays in its document |
| The Boatman | A pocket that is unreachable otherwise, and a levels ruling | Built by the drowned nave of floor 3 or 4: a block as toll, a ferry to the island, a tier 2 gift; the key and bomb tolls are not built |
| The Star-reader | The Leaves of the Tree (a room a presence can stand in), the star map and the doors | Built in a quiet room of one Tree floor, a Take or Decline gift; the reading in words only, the rest stays in its document |
| Requests, the idle window, dialogue, the codex | The owner's ruling on the requesters' leave rule and on the trust meter | Requests (the Gardener, the Boatman) and the idle window (30 to 60 seconds) are built, pending a ruling; the codex lists the presences met; the choice card is built and is the first piece of dialogue; the trust meter and the other requests are not built |
| The Covenant | Nothing (D3, D4) | Built: the record, the four pieces, the closed-set rule, the set effect and the inventory labels |
| Agreements beyond the built ones | The owner's readings k to o and multi-part cards | Trickster, Echo, Mender and Boatman are built; the rest are moved to [AGREEMENTS.md](AGREEMENTS.md) with the reason |
| The Thread as an item | Nothing (D10) | A record piece with its inventory label and seam |
| The Boatman's pocket, the Silence below floor 9, vaults below floor 5 | Decided (D1, D2, D12) | Not built, by decision: the levels are not changed |
| The Leaves and the star map | Owner rulings (D14, D15) | Built: the Leaves in the crown, the star map as the menu's third tab |

## Issue #149: status (2026-11-19, final pass)

Built in the issue: the codex, the idle window, the requests (the Gardener, the Boatman, the Child and the Elder), the choice card, the Covenant with its four pieces, its closed-set rule, its set effect and its inventory labels, the Listener's Lesson and the Light, the Child's Lesson, and the Mender, Star-reader, Witness, Boatman, Wanderer, Child, Elder, Cartographer, Trickster and Echo.

Decided and not built, with the reason in the table above: D1, D2, D7, D9, D11 to D13. Built after the owner's rulings: D14 (the Leaves are a room) and D15 (the star map, in the crown); D4's Light has its place at the top of the tree. Art owed with its exact checks: D16.

Every item of the issue is built or decided in this document. The decisions are the agent's and wait for the owner's ruling.
