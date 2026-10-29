# Polarity

Every intention is positive or negative. The player switches it with one action, and the two behave differently against blocks, projections, allies and creatures.

Part of [intentions](README.md).

## What the player sees and feels

- Every run starts positive. The player switches with the polarity action; the switch makes a sound and a message: "Good intention: it heals" or "Bad intention: it breaks and destroys".
- After three positive hits on the same block that is not damaged, a hint appears once: "Good intentions only heal. To break, switch to bad ones."
- **Positive** against a block: a damaged block is mended by the intention's mining each hit, and a positive intention never breaks a block. On an undamaged block it does nothing.
- **Negative** against a block: it damages the block as any intention does, and armour counts, so the stone breaks where a positive one would only mend it.
- **Positive** against a hostile projection: it deals half its damage, and it builds warmth, one fifth per hit. When the warmth is full, the projection turns to your side. The conversion keeps at least half its maximum health, and a positive intention never takes the projection's last point, so warmth, not a kill, is how a projection of light is won.
- **Negative** against a hostile projection: full damage, and each hit cools its warmth by a quarter. A kill is a release: the projection dissolves.
- **Positive** against an ally (a converted projection or a creature): it heals the ally by half the damage, up to its maximum. A healthy ally lets positive intentions pass through it. A creature healed to full for the first time drops a heart.
- **Negative** against an ally: full damage. An ally that reaches zero turns hostile again with half its maximum health, at least one point, and its warmth reset. A room that was cleared stays cleared.
- **Negative** against a creature: it wounds the creature, but a creature that reaches zero does not die. It hides at one point of health. Explosions do not hurt creatures at all; they only push them.
- Converting a boss to your side counts as beating the boss on its floor.

## The rule behind it

The design text says good intentions mend, can turn projections to your side, and that bad ones break blocks and wound everything that is yours, creatures included ([DESIGN.md, section 4](README.md)). The built rules do the mending and the breaking as written. For projections, a good intention halves its damage and converts it, and for creatures a bad one wounds without killing; the open questions below record where that differs from the text. The rules cite the polarity review in the architecture reviews.

Code: `src/combat/polarity.ts` (the pure rules: damage share, warmth, ceiling, conversion, relapse and the ally heal, lines 1-60), `src/game/game.ts` (the applied rules on projections and allies, lines 1048-1124; the block rules, lines 1473-1490 and 1592-1602), `src/entities/enemies.ts` (a creature at zero hides, line 193).

## Open questions

1. **Healing projections.** The design text says good intentions heal projections and damaged blocks ([DESIGN.md, section 4](README.md)). The code does not heal a hostile projection: a positive intention halves its damage and builds warmth until it converts (`src/combat/polarity.ts`, lines 10-15, 24-25; `src/game/game.ts`, lines 1048-1063, where only allies are healed). Which is the intent? The current code is the one that is playable.
2. **Killing creatures.** The design text says bad intentions wound "everything that is yours too, creatures included" ([DESIGN.md, section 4](README.md)). The code wounds creatures but never kills them: a creature at zero hides at one point of health (`src/entities/enemies.ts`, line 193). Should a negative intention be able to kill a creature, or is hiding the rule?
3. **Names.** The game's messages say good and bad intentions, the design text says the same, and the code and this document say positive and negative. The owner should choose the words the player reads, and the naming rules should follow.
4. **The hint.** The hint says good intentions only heal. Against a projection a good intention halves damage and converts it, as built (point 1 above). The hint's wording should follow the decision on point 1.
