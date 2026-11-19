# Affirmation

Up: [Emotion folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Emotion; also none |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Autosuggestion and self-talk (Émile Coué, early 1900s) |
| Code | `src/content/items/affirmation.ts` |

## What it means

What you affirm you make a little more real, one copy at a time.

## What it does

A positive intention that hits a block places a copy of that block beside it, of the same material. The copy goes only into empty space inside the room: never into you, a wall, a door, a doorway, a body, an element, or a block that may not be copied (chests, the alembic, the kitchen, door frames, the pedestal, the bomb, the unbreakable blocks). At most one copy per intention. Affirmation no longer aims at all.

## Stats and events

- homing: none (it had +3 before)
- when an intention hits a block: a positive one places a copy of that block in the empty cell beside the face it hit (`placeBlock`; no `blockPlace` or `blockPlaced` event)

## Synergies and states of being

- [Open-hearted](../states-of-being/OPEN-HEARTED.md) (counts the emotion tag)

## Open questions

- The copy stays inside the room's interior. Confirm this is the reach the owner wants (see [AIM-PRACTICES](../AIM-PRACTICES.md)).
