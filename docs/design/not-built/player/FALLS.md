# Fall damage

Whether falling far should hurt the player, and how far is far.

Status: idea

Part of [the player (not built)](README.md).

## The design

The design leaves falling open: "falling far hurts (TBD; maybe half a heart beyond N blocks)" ([DESIGN.md, section 7](README.md)). It also marks fall damage as an open question, because it strongly affects the freedom to dig down ([DESIGN.md, section 13, question 5](../README.md)).

## What the game does today

A fall, or a descent from one band to the next, makes a landing event with the fall speed in it, and nothing else. No damage is taken ([built/player/HEALTH.md](../../built/player/HEALTH.md)).

## Open questions

1. **Yes or no.** Should a long fall hurt? The design asks; the owner has not answered.
2. **How far is far.** If yes, the design suggests about half a heart beyond a number of blocks. What number?
3. **Digging down.** Fall damage makes digging down a choice with a cost. Is that the intent, or should digging stay free and the cost be somewhere else?
