# Vocabulary

Up: [built story](README.md)

The words the player reads in the game, and the words the design uses for them. The player's language is English or Spanish ([LANGUAGES](../feel/LANGUAGES.md)); the English term is the source.

## The core words

| Concept | In-game word | What it means | Built |
|---|---|---|---|
| **Intention** | Intention | The player's shot: focused will, flying straight while it holds, then falling | Yes |
| **Projection** | Projection | A pattern that blocks intention, given a body of the same blocks as the walls | Yes |
| **Practice** | Practice (shown as an item on a pedestal) | Something people use to grow, picked up to change what you can do and who you are | Yes |
| **Path** | Path (body, mind, emotion, will) | One of four ways a practice develops the person ([PATHS](PATHS.md)) | Yes |
| **State of being** | State of being | The bigger change at three practices of one path | Yes, as a stat change only |
| **Polarity** | Good or bad intention | The kind of your loaded intention | Yes |
| **Presence** | Presence | An immortal, non-hostile being you can meet. Its kinds are in the [presences](../presences/README.md) document | Partly: two presence kinds and one room presence are in the code |
| **Creature** | Creature | A living being of the depths, not hostile. The bestiary describes what each one does ([BESTIARY](README.md)) | Yes (fourteen kinds in the code) |

## Polarity

The loaded intention is either good or bad. The player switches it with the F key, and a short tick sounds: rising for good, falling for bad. The HUD shows the mark as a filled circle for good and a ring for bad. Good intentions heal and turn enemies into allies; bad intentions break and destroy everything in their way, creatures included. The design text is the one the player reads ([NAMING](NAMING.md#good-and-bad-intentions)).

## The objects of the world

| Concept | In-game word | Notes |
|---|---|---|
| Keys | Keys (art: a key with an eye) | Insights: they open locked doors. Built |
| Bombs | Bombs (art: a glowing seed) | Breakthroughs: they clear blocks at once and can hurt you. Built |
| Hearts | Hearts | Heart containers and their quarters. Built |
| Parts | Parts | Collectibles a projection leaves when it is released (flesh, heart, mind, essence). They take a hand slot and have no effect yet. Built as collectibles ([PARTS-PURPOSE](../../not-built/practices/PARTS-PURPOSE.md)) |
| Toll | Toll | What you give to go down, shown in its own window. Built |
| Breakthrough | Breakthrough | The name of a bomb in descriptions |
| Insight | Insight | The name of a key in descriptions |

## Decided, not built

| Concept | Word | Where |
|---|---|---|
| The pieces of matter you carry or leave behind | Shard | The owner's name for them (the Cosmere's shards), recorded in [COSMOLOGY](../../../lore/COSMOLOGY.md). The art to show them is not built |
| The run's reading | Hexagram | Decided in the cosmology, not built: [HEXAGRAM](../../not-built/feel/HEXAGRAM.md) |

## Places and levels

- The floors are numbered from 0 (the roots). The HUD shows the floor and its circle, for example "Floor 3 · The rain" (the number and the circle's image).
- The rooms have kinds: normal, treasure, boss, vault, start and challenge. The player meets them as doors and pedestals.
- The circles are Dante's, in the design. The names are shown as built. The levels documents hold the full list.

## The words the design avoids

- Never "tear" for an intention.
- Never "positive" or "negative", "gold" or "ember" for the two intentions in player text.
- Never "diagnosis", "patient" or the name of a clinical condition for a projection.
