# How potions fit the existing systems

Status: proposal. Index: [potions](README.md).

How a flask touches polarity, the hand, the item contract, the states of being, agreements and the codex, and where the random streams come in.

## 1. Polarity and the splash

- **The brew's polarity is what counts.** Only a positive intention brews; a negative one boils the bulb off without spending a brew ([BREWING-RULES](BREWING-RULES.md)).
- **A thrown flask** shatters into a small splash of good intention, radius one: one positive intention hit on everything in range. It warms projections, heals allies and creatures, mends damaged blocks, and never kills. The positive-intention floor of one point holds. The potion is lost, so throwing is a choice: drink it for yourself, or spend it on someone else.
- **Keeping the rule players know.** Good intentions mend and make; bad ones break.

## 2. Promised gifts

Potions are never promised. The gold seam means "given" ([BESTIARY](../../presences/GIFTS.md) §8.7), and a potion is made, not given. A flask can be lost: thrown, given at the toll (it counts as a thing from the hand, [LEVELS](../../../built/levels/floors/TOLL.md) §1c), swallowed by Craving's pull and returned on release, or taken by a theft once one is built. Promised gifts are inventory items, not hand cubes, so they can never go into the bulb.

## 3. The hand

A flask is a third kind of hand cube, beside materials and parts. It is picked up by walking onto it, placed with the right click (it stands as a pickup), thrown with Q, counted by the carry stat, and handed to presences and the toll like any carried thing. It is not a practice, never enters the inventory, and never counts toward a state of being.

The HUD shows active potions as small flasks beside the hearts, with one dot per room left. Floor and run potions show no dots. No timer, no flicker, no mood ([ART-GUIDE](../../../../art/ART-GUIDE.md) §11).

## 4. Practices and synergies

- **Effects use the item contract.** A potion is an effect (stats and hooks) with a path, a duration, a recipe, a colour, an icon, a name, a description and an effect line. Drinking installs it under its own source; the inventory rebuild removes only its own sources, so potions survive pickups ([ITEMS](../../../../architecture/ITEMS.md) §6).
- **Two new events**, each with an emit site (the contract test): brew (contents, result and cancel; practices may change the result) and drink (potion, duration and cancel; practices may change the duration).
- **States of being:** each state synergy gains one drink hook: a potion of its own path lasts one room more. Floor and run potions are unchanged. All four live in the synergy file, where exceptions belong ([ITEMS](../../../../architecture/ITEMS.md) §5).
- **Socratic Questioning** with the Questioning Tincture: the tincture covers two locks instead of one. A synergy entry.
- **Symbolic Act:** a thrown flask carries the throw event like a block, so a volatile flask bursts as well as splashing. The synergy matrix must cover it ([RISKS-AND-TESTS](RISKS-AND-TESTS.md), risk 2).
- **A future practice,** Alchemy (mind) from the stations brainstorm ([PRACTICES-USING-STATIONS](../../stations/PRACTICES-USING-STATIONS.md)): each alembic keeps a fourth brew. It goes through [sotano-items](../../../../../.claude/skills/sotano-items/SKILL.md).

## 5. Agreements, the codex and the Compost

- **The codex.** The first time a recipe is brewed, the codex ([BESTIARY](../../presences/GIFTS.md) §9) draws it as icons (parts to flask), kept across runs as knowledge, never power. It also drives the bulb's colour preview: a bulb matching a known recipe takes that potion's colour; otherwise it stays grey.
- **Agreements.** From Zone III, an agreement may ask for a potion instead of a part: "the Mender asks for a Restoring Draught, to mend a vessel". The doability rule of BESTIARY §8.6 still holds: only potions whose parts the floor can give.
- **The Compost** stays the steady source of parts. The laboratory is the zone's other half. (The station named Compost in [stations](../../stations/COMPOST.md) is a different thing; see [OPEN-QUESTIONS](OPEN-QUESTIONS.md).)

## 6. Random streams

| What | Class | Source |
|---|---|---|
| Which room of the zone's lab floor is the laboratory | Structure | A fork of the floor's seed, drawn with the plan. A new room type needs a generation version bump and a new golden hash ([RNG](../../../../architecture/RNG.md)) |
| Recipe resolution | None | A pure function of the bulb's contents: no roll, order-independent |
| Potion effects with a chance (none today) | Runtime | A fork of the potion's id and the run's brew count; never the loot or drops streams |
| Steam, drops in the glass, the splash | Cosmetic | Visual effects only |
