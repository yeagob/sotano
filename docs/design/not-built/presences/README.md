[Not built](../README.md) · [Design](../../README.md)

# Presences (not built)

Status: **mixed**: decided, proposal and idea, as each document's line says.

Presences are the beings of the depths who speak: the parts of the player that already know. The built ones, the Listener, the Boundary, the Trickster, the Echo and the Wanderer, are in [built/presences](../../built/presences/README.md). This folder holds every other presence in the design, and the systems they depend on: dialogue, requests, agreements, gifts, memory across runs, the codex and the Covenant. Presences are archetypes, never gods, saints or real people; they never give orders, never diagnose and never promise a cure. The Gardener is defined in the code, and it is listed here because it is not placed.

Dwellers keep one place in the depths and remember the player across runs (see [Memory](MEMORY.md)). Messengers come once: they appear on the way, say what they came to say, and vanish.

| Document | Presence or system | Kind | Status |
|---|---|---|---|
| [GARDENER.md](GARDENER.md) | The Gardener, on one seeded floor from 1 | Dweller | partly built |
| [WITNESS.md](WITNESS.md) | The Witness, the last conversation below floor 9 | Dweller | proposal |
| [ELDER.md](ELDER.md) | The Elder, on one seeded floor from 1 (the Ledger Halls are not built) | Dweller | partly built |
| [CHILD.md](CHILD.md) | The Child, in the Cellar of Habits | Dweller | decided |
| [COVENANT.md](COVENANT.md) | The closed set of four gifts | System | proposal |
| [CARTOGRAPHER.md](CARTOGRAPHER.md) | The Cartographer, on one seeded floor from 1 (the Tree is not built) | Dweller | partly built |
| [BOATMAN.md](BOATMAN.md) | The Boatman, by the deepest water of Zone II | Dweller | proposal |
| [MENDER.md](MENDER.md) | The Mender, in the vaults of Zones III and IV | Dweller | proposal |
| [STAR-READER.md](STAR-READER.md) | The Star-reader, on the Tree | Dweller | proposal |
| [WANDERER.md](WANDERER.md) | The Wanderer, on one or two seeded floors from 1 | Messenger | partly built |
| [DIALOGUE.md](DIALOGUE.md) | The dialogue card and its lines | System | proposal |
| [REQUESTS.md](REQUESTS.md) | Requests from the depths, the idle window and the secret trust meter | System | decided |
| [AGREEMENTS.md](AGREEMENTS.md) | Things the player brings to a presence | System | proposal |
| [GIFTS.md](GIFTS.md) | The gifts of the depths and the promised trait | System | proposal |
| [MEMORY.md](MEMORY.md) | What dwellers remember across runs (one memory is built: the Echo's place) | System | decided |
| [CODEX.md](CODEX.md) | The codex in the inventory window | System | proposal |

The places some of these presences live in, the Tree and the Silence below floor 9, are not built either. The Tree's bosses are in [not-built/bosses](../bosses/README.md).

## Roster status (2026-11-19, issue #149)

What is still open, and what blocks each one. A presence moves to [built/presences](../../built/presences/README.md) only when its text is in the code.

| Presence or system | Blocked by | Done in this pass |
|---|---|---|
| The Gardener | Its memory and its root-and-moss agreement | Placed on one seeded floor from 1 (never the tutorial); asks for a flesh part; the rest stays in its document |
| The Wanderer | Its wall walk, its hand-tied line and the corridor | Built as a messenger with a consent gift; the rest stays in its document |
| The Child | Its room in the Cellar of Habits, its lines and the path rule for a build (the placement counter is built) | Counter built (`src/game/build-count.ts`); the presence is not built |
| The Elder | The Ledger Halls, the page of ledger stone and the Covenant's Page | Built on one seeded floor from 1: a path choice on the choice card and a lesson of that path; the rest stays in its document |
| The Witness | The Silence below floor 9 and the hexagram source check | Not built |
| The Mender | A released projection that comes back (dissolve is final today) and the one vault rule | Not built |
| The Cartographer | The Tree's crossroads, the star map and the hidden pocket | Built on one seeded floor from 1, with the vault and boss marks in words; the rest stays in its document |
| The Boatman | Deep water in Zone II, a pocket that is unreachable otherwise, and a levels ruling | Not built |
| The Star-reader | The Leaves of the Tree and the star map | Not built |
| Requests, the idle window, dialogue, the codex | Their own systems (not designed for the build) | Not built; the choice card (a question with answers) is built and is the first piece of dialogue |
| Covenant and agreements beyond the two built ones | The owner's ruling on the four pieces and their costs | Not built |
