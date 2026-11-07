# Knockback

Up: [Abilities](README.md) · [The realm of the sky](../README.md)

The kick itself is built: [KNOCKBACK, as built](../../../built/sky/abilities/KNOCKBACK.md) (the warning arc, the single push, the shelter, the positive answer, nothing that hurts). This document keeps what is not built: which animal uses it, and the open questions.

Status: proposal for the animals that use it; the owner has decided that nothing in the sky takes the player's health.

## Which animal uses it

Open. The owner named the hindrance but not the animal. Proposal: the elephant (its trunk, see [ELEPHANT](../guardians/ELEPHANT.md)) and the horse (its rear, see [HORSE](../guardians/HORSE.md)).

## Open questions

1. Does a kick do damage, or only move the player? Answered (owner, 2026-11-03): nothing in the sky takes the player's health; a kick only moves them ([sky law 3.10](../README.md#310-the-player-cannot-die-in-the-sky)). Built as such.
2. Is the kick's strength the same on every floor, or does it grow with the sky floor? The strength is a parameter of each kick; the floors set it when they are built.
3. Does a kick over a ledge always land on a block, or can it send the player off a floor with no route back? (The realm's law 3.5 says a route up is always there.) Not built: a kick does not yet check where the arc lands.
4. Which animal uses it: the guardian, the minion, or both?
5. The soft push of a positive answer (0.4 of the push) is provisional. Is 0.4 the right share, or does the answer need its own tuning per animal?
