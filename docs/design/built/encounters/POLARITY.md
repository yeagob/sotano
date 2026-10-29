[Encounters](README.md)

# Intention polarity

Built, with added rules from the review. Every intention the player casts has a polarity. A good intention is attention with care and purpose; a bad one is the same force turned to wound. The player sees only good and bad, never the code's words. The toggle flips the loaded intention between the two (the key is F), and the change applies from the next intention. The default is good. Rules are in `src/combat/polarity.ts`, applied by the game loop; the review is in [docs/reviews/polarity.md](../../../reviews/polarity.md).

## What each polarity does

| | To a projection (hostile) | To a converted projection (ally) | To a creature | To a presence |
|---|---|---|---|---|
| **Good** | Half damage, and warmth rises by a fifth a hit. At full warmth it turns to the player's side and is not destroyed. A good intention never takes its last point | Heals it: half the damage it would have done, never past its maximum | Heals it. A creature healed to full drops a heart, once | Nothing to heal. A good intention near it lifts a silence; it does not speak differently yet |
| **Bad** | Full damage, and warmth cools a quarter a hit. A projection killed this way is released | Harms it. At zero it turns hostile again, with half its health | Harms it. At zero it flees into the blocks until the room clears. It never dies | Silences it: the presence turns its light away until a good intention passes near |

## Blocks and weapons

- A good intention never breaks a block: it heals one that is damaged, and its cracks close.
- A bad intention breaks blocks as it always did.
- A weapon's stroke follows the same rule: a good blade or beam only heals.

## Rules that the review added

The owner's text does not state these; the review's mediator added them, and they are built:

- A good intention never takes a projection's last point, so warmth can always fill and convert it.
- A converted projection, or an ally that relapses, returns with at least half its maximum health.
- A target warmed by a beam gains warmth once per stroke, not per tick.
- A relapsed projection in a cleared room does not reseal the room.
- A healthy ally lets good intentions pass; a bad one always hits it.

## Open questions

- **Bosses.** A good intention can convert any boss, which ends its fight. The design gives conversion to the Threshold Guardian only. See [Fight flow](../bosses/FIGHT-FLOW.md#7-defeat).
- **Warmth decay.** A projection's warmth does not fall over time. The design has no rule yet; decide whether it should.
- **Hint.** The design asks for a hint after three good intentions in a row on the same undamaged block, saying that good intentions only heal and that the player should switch to bad ones. The build does not show it; check the design text against the toast set.
- **The bad colour.** The bad intention keeps its round shape with a darker core and a cold rim. The exact colour is the owner's ruling and is awaiting it.
- **Gifts at full health.** A converted projection at full health is meant to give a gift. The gift is not built.
