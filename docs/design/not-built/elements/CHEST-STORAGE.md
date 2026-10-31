# Storing things in chests

Up: [not-built elements](README.md) · Status: proposal.

The owner's brief asks that chests be containers as well as treasures: you can put things into them, not only take valuables out. The build has chests that spill what they hold once, and no storage. Keys and treasures are in chests; the player puts nothing in.

## What it would do

- **Put in.** With a chest open, a right click on it puts the top block from the player's hand inside.
- **Take out.** Pressing use with an empty hand takes the last stored block out.
- **Keeps for the run.** A chest remembers its contents for the whole run, and floors above keep their state.

## What it reacts with

Blocks in the hand (stored and taken back), a furnace (the design also lets a furnace hold what it cannot smelt).

## Open questions

1. How many blocks does a chest hold: one, a few, or as many as the player puts in? The design does not say.
2. Do stored blocks count as the player's blocks for the toll (a block from the hand pays the way down)?
3. The built chests are unbreakable (see [CHESTS](../../built/chests/CHESTS.md)). If storage comes, do they stay unbreakable?
4. Does a chest that holds a practice in its store reveal it?
