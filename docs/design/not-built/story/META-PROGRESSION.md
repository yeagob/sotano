# Meta-progression, secrets and side biomes

Up: [not-built story](README.md)

Status: idea (story question 3, and the design's ideas for what carries between runs and for the hidden world). Nothing here is decided.

## What is built

A run is kept nowhere. Death ends it, and a new run begins with nothing from the last one but what the player remembers. The only saved state in the browser is the language choice. There are no hidden caves, no secret rooms and no unlocks. The word "pockets" in the code is a rock density, the share of soft material in a floor's stone, not a hidden place.

## The ideas

- **Knowledge, not power.** Between runs you do not get stronger; you learn. The design's principle is persistent knowledge, not persistent power ([DESIGN, section 9](../levels/HIDDEN-LAYER.md)).
- **Death leaves an insight.** The story asks whether the next run carries a small insight from the death, which fits the design's knowledge principle ([STORY, open question 3](../../built/story/PREMISE.md)).
- **Unlocks in the pools.** New practices enter the pools (the treasure and boss pools, as in Isaac) when the player learns something.
- **Recipes.** Placing a certain block on a certain altar while holding a certain item makes a recipe, like the alchemy of another game. Some recipes change with the run's seed, so they cannot be copied from a wiki.
- **Hidden pockets.** Small caves with an item or an altar, with no hint on any map. The player finds them by digging where nobody told them to, or because an item or a sound hints at them.
- **All the way down.** Below floor 4 something is sealed with tier 3 material. Opening it takes a specific combination of practices, or a ritual.
- **Side biomes.** Whole side areas that open the way the hidden pockets do.

## Why it is open

A run that keeps something is a run that can be unfair, and the design promises that the toll never traps a player who has played fair. A save of any kind is also a question of storage: the game keeps no run data today, so a persistent store would be a design decision of its own.

## Open questions

1. What, if anything, carries between runs: knowledge, unlocks, the recipes, or nothing?
2. Where is the kept state stored? The browser's storage is per viewer and can be cleared, so anything that must survive needs a decision about storage.
3. Does a death give an insight, and what is the insight: a hint, a recipe, or a line of the story?
4. How does a hidden pocket hint at itself without a map marker? An item, a sound, or a wall that is slightly wrong?
5. Do the recipes change with the seed, as the design says, and how does the player learn that they changed?
6. Which hidden places are part of the endgame, and which are side places? See [ENDGAME](ENDGAME.md).
