# Meta-progression, secrets and side biomes

Up: [not-built story](README.md) · [ENDGAME](ENDGAME.md)

Status: mixed. Decided: the permanent unlock of the upward staircase on Floor 1 leading directly to the surface after meeting the Spiked Entity at the bottom of the world. Other unlocks, recipes, and pockets remain ideas.

## What is built

A run is kept nowhere today. Death ends it, and a new run begins with nothing from the last one but what the player remembers. The only saved state in the browser is the language choice. There are no hidden caves, no secret rooms and no unlocks yet.

## What is decided (The Endgame Shortcut)

- **The Upward Staircase Unlock (Status: decided)**:
  - Once the player descends to the lowest floor and encounters the invulnerable Spiked Entity ([ENDGAME](ENDGAME.md)), a grand staircase is revealed that pierces through all floors upward to the surface.
  - From that point onward, in every subsequent run, **Floor 1 contains an upward staircase** allowing the player to ascend directly to the surface and the Giant Tree, bypassing the descent if they choose.
  - The flag must last between runs. Proposed: browser storage under the key `the-roots:stairs-unlocked`; where it is finally kept is open (see open question 1).

## The ideas (Other meta-progression)

- **Knowledge, not power.** Between runs you do not get stronger; you learn. The design's principle is persistent knowledge, not persistent power ([DESIGN, section 9](../levels/HIDDEN-LAYER.md)).
- **Death leaves an insight.** The story asks whether the next run carries a small insight from the death, which fits the design's knowledge principle ([STORY, open question 3](../../built/story/PREMISE.md)).
- **Unlocks in the pools.** New practices enter the pools (the treasure and boss pools, as in Isaac) when the player learns something.
- **Hidden pockets.** Small caves with an item or an altar, with no hint on any map.
- **Side biomes.** Whole side areas that open through special rituals or knowledge.

## Open questions

1. **Storage**: Is the unlock flag kept in browser storage under `the-roots:stairs-unlocked`, as proposed, and what happens when the player clears their browser data or plays on another device?
2. **Floor 1 Staircase Appearance**: What does the upward staircase look like on Floor 1, and does it feature an omen or inscription reminding the player of the spiked entity's words?
