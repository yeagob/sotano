# A second chance at death

A practice that keeps the player alive once, when their health reaches zero.

Status: idea

Part of [the player (not built)](README.md).

## The idea

When the player would die, a second-chance practice could let them live on, with a little health. What it costs, how often it can happen, and whether it is a practice the player finds or one that is granted at a moment, are all open.

## What the game does today

Death is a cancellable event: an item can cancel it, and the player stays at one point of health ([built/player/DEATH.md](../../built/player/DEATH.md)). No practice listens to it yet, so nothing saves the player today.

## Open questions

1. **Source.** This idea is not in the design text that the repository holds. The read-only audit that prepared this document listed it; the owner should confirm it was asked for, or drop it.
2. **Cost and limit.** Once per run, or once per floor? Does it cost something, such as a key, a bomb or a practice?
3. **What it restores.** One point, a heart, or the full health?
