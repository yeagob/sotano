# Hearth stove

Status: idea. Index: [stations](README.md). Food rules: [CARRYABLES](CARRYABLES.md).

The hearth stove turns an ingredient and a fire into a meal. Cooking is self-care, and it is the kitchen's first station.

## Design

- **What it does:** an ingredient and fire give a meal. Meals from husks heal more than meals from plants.
- **Verb:** place the ingredient on the stove. It cooks while the fire is on it, and the meal rolls out.
- **Recipes (placeholders):** a mushroom gives a roasted mushroom, +half a heart. A husk gives a warm meal, +1 heart, and the projection's type grants a small trait for the room: Doubt gives steadier aim, Panic gives faster movement.
- **Meaning:** care given to yourself, between fights.
- **Fire:** [STATIONS §12](README.md) proposes it reuse an eternal flame. Whether an eternal flame exists in the code is not checked here.
- **Tier:** T2.

## Open questions

1. Does the husk recipe belong here or in [HUSK](HUSK.md) alone? The owner decides how husks are used.
2. Is "a small trait for the room" a stat change, and which stats does it touch?
3. The meal is eaten with the use key; see [CARRYABLES](CARRYABLES.md) for the open choice between instant and animated eating.


## Built: the kitchen (one tile)

A first kitchen is built as one tile on floors 1, 3, 5 and 7 (see [laboratory](../../built/laboratory/README.md#the-kitchen)). Right-click with a part on top of the hand: flesh makes a half-heart meal, heart, mind or essence a one-heart meal. Three cooks per run, no polarity, no effect on projections. Meals reuse the flask system and the drink key. The brew/cook/pickup drink hint also applies. The kitchen will later give other heart kinds; the owner will decide them (not designed here). The hearth, cauldron and the rest of this note stay ideas.
