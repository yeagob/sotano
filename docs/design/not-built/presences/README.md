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
| [REQUESTS.md](REQUESTS.md) | Requests from the depths: what is not built (the trust meter and the question are built, see built/presences/REQUESTS.md) | System | partly built |
| [AGREEMENTS.md](AGREEMENTS.md) | Things the player brings to a presence (multi-part cards are built) | System | partly built |
| [GIFTS.md](GIFTS.md) | The gifts of the depths and the promised trait | System | proposal |
| [MEMORY.md](MEMORY.md) | What dwellers remember across runs (one memory is built: the Echo's place) | System | decided |
| [CODEX.md](CODEX.md) | The codex: the presences part is built in the menu; projections, creatures and bosses are not | System | partly built |

The places some of these presences live in, the Tree and the Silence below floor 9, are not built either. The Tree's bosses are in [not-built/bosses](../bosses/README.md).

## Decisions taken by agent for issue #149 (2026-11-19), and the owner's rulings (issue #228)

The owner was away for the last pass of #149 and asked the build to decide what was still open. Each decision below was **decided by agent, pending owner ruling**, with its reason. The owner answered on #228; the rows marked **Owner ruling** carry the answer and what was built from it (D4, D7 to D11, D16). The other rows are still pending. Nothing here changes the Listener's 15/75/10 table, the thirteen floors or any room's band.

| # | Open item | Decision | Reason |
|---|---|---|---|
| D1 | Vaults below floor 5 | Kept on floors 1 to 5; the levels are not changed. The Mender stays on floors 3 to 5. | The Mender's design asked for Zones III and IV, but a vault on a deeper floor is a room-layout change that sotano-levels must rule on with its bands; #149 is about presences, not the vertical layout. |
| D2 | The Silence below floor 9 | Not built. The Witness keeps its quiet room on the ninth floor. | A floor below 9 changes the world's vertical layout (`LAST_FLOOR`, the loop to heaven, milestone L4), which the levels skill allows only with a band ruling. The Witness's exchange reads the same in a quiet room. |
| D3 | The closed-set reading of the Covenant | "Cierre" is a closed set: four pieces, one source each, given once, never taken back, and a complete record nothing changes. Built as a rule in code and tested. | The plainest reading of the word and of "no other source gives them"; it keeps the gift promise by construction. See [built/presences/COVENANT.md](../../built/presences/COVENANT.md). |
| D4 | The Listener's Lesson and the Light | **Owner ruling (#228): the Light goes at the top of the tree.** Built: the Lesson stays on its choice card; a run that has heard a Lesson keeps the Light when the body enters the crown (the canopy) of the giant tree, once. One trigger, `reachCrown`, reads the story the body is in; the crown's layout is the tree's. | The owner's words. Needing a heard Lesson is the agent's reading: the Light is what was heard, and the crown alone would give it on the first climb from the Roots to a run that never listened. See [built/presences/LISTENER.md](../../built/presences/LISTENER.md#the-lesson). |
| D5 | The idle window's readings | Accepted as built: a seeded 30 to 60 seconds on game time, after the exchange, for the Gardener and the Boatman. | The game sees input, not the player stepping away, so a window on idle input would pretend to know more than it does (REQUESTS.md, idle detection). |
| D6 | The reward tables (readings k to o, and t) | Accepted as built: each presence's seeded table in `heart-gifts.ts` with the weights in [GIFTS.md](GIFTS.md); one object per agreement card, on the consent pattern. | They are in code and tested; changing a weight would change seeded runs, which needs the owner's ear, not a guess. |
| D7 | The trust meter | **Owner ruling (#228): "Opus decides".** Built (issue #235): "Have you done it?" at the end of the Gardener's and the Boatman's idle window, a hidden step per run (0 to 3) moved by honest completions and early yeses, a gift per step (never nothing, no randomness), and only the count of requests answered in the save. | It was small once the question existed: one pure module, the choice card that already maps every control, and one number in the save. The safety rules hold: Not now, alternatives, no timer, the same words for both readings, minimum data. See [built/presences/REQUESTS.md](../../built/presences/REQUESTS.md). |
| D8 | The Child's Lesson and the Cellar of Habits | **Owner ruling (#228): "descártalo".** The Child's one-line Lesson is removed (its code, its lines in both languages and its tests). The Cellar stays the Child's quiet room; the rest of the Child is unchanged. | Read as discarding the Lesson, the one thing of D8 that was added; the quiet room was already the Cellar and needs no change. |
| D9 | The Mender's integration of released projections | **Owner ruling (#228): yes.** Built (issue #232): the last projection released on the Mender's floor comes back beside it as an ally, once, on a Give, with repair's gold glow and a slow gold mote (DECISIONS.md §14.3). | The last release is the plainest choice and draws no randomness. Bosses and presences are never brought back, and a mended ally released again stays released, so it returns once. |
| D10 | The Thread's form | **Owner ruling (#228): "No" to a run record.** Built: the Thread is an inventory item, the Mender's Thread, dropped beside the Mender's gift once a run and picked up like a practice; picking up that Thread keeps the Covenant's piece. Promised: no toll, capture or other rule takes it; it is in no pool and has no recipe. | Read as an item held like the others. The Covenant's rule holds: four pieces, one source each (only the Thread the Mender dropped is the piece), never taken back (promised). The presence tables and pedestals are unchanged. |
| D11 | Multi-part agreement cards | **Owner ruling (#228): yes.** Built (issue #233): one card names up to three objects in one sentence; on Give every named object must still be in its slot or nothing is taken; declining keeps everything. The Mender asks for two parts of different kinds. | The consent pattern of every card, extended. The Mender is the presence whose design asks for several shards; two on floors 3 to 5 follows the agreements' rule that complexity grows with depth. |
| D12 | The Boatman's pocket | The nave's island stays the pocket; the template is not changed. | Removing the stepping stones or drawing a new pocket is a room change for sotano-levels; the ferry already makes the toll the plain way across. |
| D13 | The Gardener's and the Cartographer's materials | No new materials. The Gardener keeps its flesh part; the Cartographer marks in words. | A root, a moss and the ores of each zone are not materials of the run; adding blocks needs items, levels and art rulings. |
| D14 | The Leaves as a room | Not a room. The Star-reader keeps its quiet room on a Tree floor. | The Leaves are a story of the giant tree above, not a place in the floor plan; a room there is a vertical-layout change. |
| D15 | The star map | Built later, not in #149. | It is not small: a map view of the floor, the teleport doors, the pocket marks and their art. The Cartographer's and the Star-reader's words stand in for it. |
| D16 | The art needs | **Owner ruling (#228): yes.** Every new visible thing of this pass has a ledger entry: DECISIONS.md §14.3 (the Thread's icon, the mended ally's gold, the gold of repair in an icon). The bodies of §14.2 stay owed. | Recorded with the exact check owed for each (issue #236). |

## Roster status (2026-11-19, issue #149)

What is still open, and what blocks each one. A presence moves to [built/presences](../../built/presences/README.md) only when its text is in the code.

| Presence or system | Blocked by | Done in this pass |
|---|---|---|
| The Gardener | Its memory and its root-and-moss agreement | Placed on one seeded floor from 1 (never the tutorial); asks for a flesh part; the rest stays in its document |
| The Wanderer | Its wall walk, its hand-tied line and the corridor | Built as a messenger with a consent gift; the rest stays in its document |
| The Child | The path rule for a build, the Request and the Agreement (the Lesson is discarded, D8; the Cellar is its quiet room) | Built on one seeded floor from 1: the consent to build three blocks, then one gift; the rest stays in its document |
| The Elder | The Ledger Halls, the page of ledger stone and the Covenant's Page | Built on one seeded floor from 1: a path choice on the choice card and a lesson of that path; the rest stays in its document |
| The Witness | The Silence below floor 9 and the hexagram source check | Built on the ninth floor in a quiet room, a tier 2 gift by consent; the Reading, the parts and the Seal are not built |
| The Mender | A levels ruling for vaults below floor 5, and its own body | Built at the first vault opened on floors 3 to 5: two parts of different kinds on one card (D11), a gift, the Thread as an item (D10) and one released projection back as an ally (D9) |
| The Cartographer | The Tree's crossroads, the star map and the hidden pocket | Built on one seeded floor from 1, with the vault and boss marks in words; the rest stays in its document |
| The Boatman | A pocket that is unreachable otherwise, and a levels ruling | Built by the drowned nave of floor 3 or 4: a block as toll, a ferry to the island, a tier 2 gift; the key and bomb tolls are not built |
| The Star-reader | The Leaves of the Tree (a room a presence can stand in), the star map and the doors | Built in a quiet room of one Tree floor, a Take or Decline gift; the reading in words only, the rest stays in its document |
| Requests, the idle window, dialogue, the codex | The owner's ruling on the requesters' leave rule | Requests (the Gardener, the Boatman) and the idle window (30 to 60 seconds) are built, pending a ruling; the codex lists the presences met; the choice card is built and is the first piece of dialogue; the trust meter and "Have you done it?" are built (D7); the other requests are not built |
| The Covenant | Nothing (D3, D4, D10) | Built: the record, the four pieces, the closed-set rule, the set effect and the inventory labels; the Light in the crown (D4) and the Thread as an item (D10) |
| Agreements beyond the built ones | The owner's readings k to o | Trickster, Echo, Mender (two parts, the first multi-part card, D11) and Boatman are built; the rest are moved to [AGREEMENTS.md](AGREEMENTS.md) with the reason |
| The Thread as an item | Nothing (D10) | Built: the Mender's Thread, a promised inventory item |
| The Leaves, the star map, the Boatman's pocket, the Silence below floor 9, vaults below floor 5 | Decided (D1, D2, D12, D14, D15) | Not built, by decision: the levels are not changed |

## Issue #149: status (2026-11-19, final pass)

Built in the issue: the codex, the idle window, the requests (the Gardener, the Boatman, the Child and the Elder), the choice card, the Covenant with its four pieces, its closed-set rule, its set effect and its inventory labels, the Listener's Lesson and the Light, and the Mender, Star-reader, Witness, Boatman, Wanderer, Child, Elder, Cartographer, Trickster and Echo.

Built after the owner's rulings on #228: the Light in the crown of the tree (D4), the trust meter and its question (D7), the Child's Lesson removed (D8), the Mender's released projection back as an ally (D9), the Thread as an inventory item (D10), multi-part agreement cards (D11), and the art ledger entries (D16).

Decided and not built, with the reason in the table above: D1, D2, D12 to D15, pending the owner's ruling.
