Up: [the design document](../../README.md)

# Projections (not built)

This folder holds what the projections are meant to do and do not do yet: the parts of each card that are not in the code, the projections that exist only as design, and the questions the owner has not answered. The built side is [built/projections](../../built/projections/README.md): one document per projection, with its built behaviour and its status (built, or partial with the built part only).

## Documents

| Document | Contents | Status |
|---|---|---|
| [GAPS.md](GAPS.md) | One row per partial projection: the mechanics its card promises that the code does not have yet | proposal |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | Stat conflicts, floor ranges, card details on built projections, the polarity and attacks question, the Pretence question, dwelling, Overwhelm | proposal |
| [STAGNATION.md](STAGNATION.md) | A projection that exists only in the element notes | idea |
| [cards/](cards/README.md) | The design card of each of the 38 projections: line, pattern, need, behaviour, release and touching moment, one document each | proposal |
| [ROOTED-VARIANTS.md](ROOTED-VARIANTS.md) | Rooted projections: the marks, the zone modifiers and the cap of one per wave | proposal |
| [SCALING.md](SCALING.md) | The table of health, speed, rooted chance and lineage forms by floor | proposal |
| [ZONES.md](ZONES.md) | The five great zones, their themes and the three ways projections grow with depth | proposal |
| [PART-NAMES.md](PART-NAMES.md) | The names of each projection's parts and what parts are for | proposal |
| [ORIGINAL-BRIEF.md](ORIGINAL-BRIEF.md) | The first enemy and boss brief and the first look notes, kept for history | idea (superseded) |

## Rules

- Every document in this folder starts with a status line: `Status: decided` (the owner decided, not built), `Status: proposal` (designed, waiting for the owner or a build) or `Status: idea` (brainstorm, no commitment).
- A partial projection stays in `built/` with its built part. Its unbuilt mechanics are rows in GAPS. When a mechanic ships, its row goes, and its words move to the built document in the same change.
- A projection that exists only in the design documents (no code) is a document here, with status `proposal` or `idea`.
- Numbers in cards are targets until a build confirms them. A stat conflict is an open question, never a silent change to either side.

## Open question: do attacks answer to polarity?

Recorded as a question, not a rule. Neither the design text nor the code says whether a projection's attacks (its bolts, lines, rings, fields and sweeps) can be answered by an intention's polarity: for example, whether a good intention can turn a bolt aside, or a bad one can break a line. Today an intention's polarity matters only when it hits a projection's body; blocks stop bolts and lobs, and one weapon (the blade of light) destroys projectiles. The full options are in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md#2-do-attacks-answer-to-polarity).

## Shared parts not built

These belong to every projection and are not in the code yet:

- **Movement kinds:** swimmer, burrower and mounted (a projection fixed in a wall or ceiling). A patrol route kind exists in the code and no projection uses it.
- **Rooted variants:** the code has the chance by floor, 1.4 times the health and one more part roll. The zone modifiers (plates, a wet trail, ink ticks, captive-light bursts, a slowing touch), their marks and the cap of one rooted projection per wave on floors 1 to 5 are not built.
- **Health and speed by floor:** the table of multipliers per floor is not in the code; every projection keeps the health and speed of its own file.
- **Spawn kinds:** the code places projections on the floor of their room. Wall face, ceiling, liquid, element source, block and burrow spawns are not in the code.
