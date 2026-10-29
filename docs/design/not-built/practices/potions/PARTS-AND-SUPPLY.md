# Parts and supply

Status: proposal for the potion links; the facts about parts are as the code states them today, and the claims marked unverified are not checked. Index: [potions](README.md).

What a part is, where it comes from, how the player holds it, and what it does today. Parts are the raw material of every potion.

## 1. What a part is

A projection that is released leaves a **part**: captive matter named after the pattern it came from (*Panic's captive ember*, *Doubt's question*). There are four kinds, the four depths of one pattern: **flesh** (matter), **heart** (feeling), **mind** (thought) and **essence** (what the pattern was protecting). The code defines the kinds and the release chances: flesh 30 %, mind 12 %, heart 5 %, essence 2 % per release (src/content/parts.ts).

Parts carry no polarity mark. Every part is released matter, so every part comes from a negative intention. A converted ally leaves nothing ([BESTIARY](../../../built/projections/PARTS.md) §5.7). A positive part would need a new source and a doubled icon set, and the proposal says it is not worth it ([HOW-IT-FITS](HOW-IT-FITS.md) §1).

## 2. How a part is held

The proposal says a part is held **in the hand**, like a block: player.hand holds a material or a part. A part is placed as a pickup with the right click, thrown with Q, and never goes in the inventory. Ground pickups do not expire.

**Contradiction (to record, not decided):** src/content/parts.ts says in its header that parts are collectible and "sit in the inventory", and in the same sentence that they "never enter the Inventory". The proposal says the hand. The owner must say which is true, or the code must change. The built document says parts take a hand slot and have no effect when carried, which agrees with the proposal: [built hands](../../../built/player/HANDS.md). The inventory question is still open, because the code's header disagrees with that built document too.

## 3. What parts do today

Nothing. Agreements (BESTIARY §8.6) and the Compost (BESTIARY §8.8) are designed and not built. [DESIGN](README.md) §13.8 asks for a use, and DESIGN §4 says "no coins, no shop". The potions give parts their first use.

## 4. Supply

- Parts are **not scarce**: challenge rooms ([LEVELS](../../../built/levels/README.md) §4) give endless waves, and every release rolls the chances.
- So **potions are scarce by the station, not by the parts**: three brews per alembic per run ([RECIPE-MODEL](RECIPE-MODEL.md) §6).
- Parts supply keeps the Compost's falloff and rest; potions add no new source.

## 5. Built facts this link depends on

- [Hands: what you carry](../../../built/player/HANDS.md) (built): parts take a slot in the hand like a block; walking into one lifts it when there is room; they have no effect when carried; picking one up raises the hands for about 1.5 seconds, during which the player cannot cast.
- The code location is src/content/parts.ts (the kinds and the release chances) and the hand logic in src/entities/player.ts as the hands document cites it.

The proposal's facts about the hand and the alembic's placement agree with that document. The brew steps themselves are not built.

## 6. Claims to check

| Claim | Where | Status |
|---|---|---|
| "152 parts from 38 projection files" | POTIONS §0 | **Unverified.** Not counted here |
| "12 have hand-drawn icons, 140 a generated fallback" | POTIONS §0 | **Unverified** |
| The bestiary says "twelve parts" and is stale | POTIONS §0 and [BESTIARY](../../../built/projections/PARTS.md) §5.7 | **Unverified** that the count is stale |
| EnemyDef has no path field | POTIONS §0 | **Unverified** (the code was not searched for this field) |
| No event exposes warmth | POTIONS §0 | **Consistent** with the event list in [ITEMS](../../../../architecture/ITEMS.md) §3, which has no warmth event |
| Parts sit in the hand, never in the inventory | POTIONS §0 | **Contradicted** by the code's header (§2) |
