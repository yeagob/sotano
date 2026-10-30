# Build order

Status: proposal. Index: [potions](README.md).

Each step goes through [sotano-docs](../../../../../.claude/skills/sotano-docs/SKILL.md), [sotano-items](../../../../../.claude/skills/sotano-items/SKILL.md), [sotano-i18n](../../../../../.claude/skills/sotano-i18n/SKILL.md) and [sotano-art](../../../../../.claude/skills/sotano-art/SKILL.md). Step 2 adds the first station and a room type, so it needs the three-party review first: the stations brainstorm already marks stations as a key architecture decision ([stations](../../stations/README.md)).

| Step | What | Done when |
|---|---|---|
| **P1, the flask and the verb** | The potion definition and two potions (Plain Tonic and Restoring Draught); the flask as a third hand kind; the drink action on three devices; the drink event; timed effect sources with the room countdown; the HUD flasks; a way to give a potion in the sandbox | Risks 2, 3, 6, 8 and 9 are tested. A potion given in the sandbox can be drunk, thrown, placed and given at the toll |
| **P1, status** | Built: the flask in the hand, its pickup, the drink verb on three devices, and two potions (Plain Tonic and Restoring Draught). Not built: the lift before a drink, the flask given at the toll (waits for the toll change in PR #28), a flask as a sandbox command, the timed effects and the risks' tests | — |
| **P2, the alembic** | The alembic block and the laboratory room on one floor per zone; the pure resolver and its validator; the brew event; positive-only brewing, three brews, the cold rest; the path field on enemies; all eleven recipes except the Distillate; the art gate for the alembic, the flask and eleven icons | Risks 1, 4, 5 and 10 are tested. A seed brews every recipe in the sandbox |
| **P2, status** | Built: the pure resolver with its validator, eight recipes (all but the Warm Cordial, the Open-Hand Elixir and the Distillate), ice, the room and floor durations as one stat source per potion, the brew and drink events, and a path and lineage for every pattern that leaves parts (a table in the content, not a field on each enemy). Built before P2: the alembic block, the laboratory room, positive-only brewing, three brews and the cold rest. Not built: the Warm Cordial and the Open-Hand Elixir (they need the warmth field, so they move to P3), one laboratory per zone (the game places it on floors 2, 4, 6 and 8: an open conflict), the art gate for the alembic, the flask and the recipe icons (placeholders ship), the three-party review, and a sandbox seed that brews every recipe. Tested: risks 1, 4 (the order of the bulb), 5 and 9; part of 2 and 3 | — |
| **P3, into the world** | A warmth field on the damage and spawn events (Warm Cordial, Open-Hand Elixir, Distillate); the Distillate; the thrown splash; the state-of-being and Socratic Questioning hooks; codex recipes and the bulb's colour preview; agreements that ask for potions | Risk 7 is tested. The synergy matrix covers potions with every practice |

## Documents to update when built

- [BESTIARY](../../../built/projections/PARTS.md) §5.7 (where parts matter, and the stale count), §8.6 and §9.
- [STATIONS](../../stations/ALEMBIC.md) §4.4 and §8, and the alembic's entry in the stations index.
- [DESIGN](README.md) §6 and §13.8.
- [ITEMS](../../../../architecture/ITEMS.md): a new effect source and two events.
- [RNG](../../../../architecture/RNG.md): the new paths.
- The input documents and the device documents ([input](../../../../architecture/input/README.md)).
- [CONCEPTS](../../../../lore/CONCEPTS.md): preparation as mental transmutation.
- [LEVELS](../../../built/levels/README.md): the laboratory room.

When a feature is built, its text moves from this folder to built/, in the same change (sotano-design §1).
