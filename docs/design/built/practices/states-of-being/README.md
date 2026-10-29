# States of being

Up: [practices](../README.md) · [built design](../../README.md)

Three practices of the same path make a **state of being**: a bigger, visible change in the person the player is becoming (STORY section 3). A practice counts toward the state of each path tag it carries. Satori carries all four, so it adds one to each state.

In code, each state is a tag-count synergy in `src/content/synergies.ts`: it turns on when three practices carry the tag, and its stat changes apply while it lasts. Nothing else is built for a state: no hand colour, no HUD mark and no aura change. Those are design (STORY section 3) and art plans (the art ledger, phase D).

| State | Path | Practices that count | Effect as built | Design text (STORY section 3) |
|---|---|---|---|---|
| [Embodied](EMBODIED.md) | Body | 10 | Move speed x1.15 and kick strength x1.3. | Faster, harder to knock back; the hands change colour (STORY section 3). |
| [Lucid](LUCID.md) | Mind | 20 | Range x1.25 and reach +1. | Intentions home in slightly; you see hidden pockets nearby (STORY section 3). |
| [Open-hearted](OPEN-HEARTED.md) | Emotion | 16 | Luck +2. | Enemies that touch you take damage too; more hearts drop (STORY section 3). |
| [Resolute](RESOLUTE.md) | Will | 13 | Damage x1.15 and mining x1.2. | Every tenth intention is a breakthrough (a small explosion) (STORY section 3). |

The design text and the code disagree for all four states. The code is what is built, and each state document keeps the design text beside it. The owner decides which effect each state keeps.

## Open questions

- S1 Embodied: [harder to knock back](EMBODIED.md) (design) or [kick strength](EMBODIED.md) (built).
- S2 Lucid: [homing and hidden pockets](LUCID.md) (design) or [range and reach](LUCID.md) (built). Hidden pockets are not built.
- S3 Open-hearted: [contact damage](OPEN-HEARTED.md) (design; already the built practice Forgiveness) or [luck](OPEN-HEARTED.md) (built).
- S4 Resolute: [every tenth intention](RESOLUTE.md) (design) or [damage and mining](RESOLUTE.md) (built).
