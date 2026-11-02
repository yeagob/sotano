# Art Therapy

Up: [Emotion folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Emotion; also Body |
| Quality | 2 of 4 |
| Found in | treasure rooms |
| Inspired by | Art therapy; the idea that making art transforms people |
| Code | `src/content/items/arttherapy.ts` |

## What it means

Making something changes the maker: four connected blocks you place in a room can heal you.

## What it does

Placing 4 connected blocks in the same room heals a quarter heart (2 damage points). Once per room, and in four rooms per floor at most.

## Stats and events

- heals: a quarter heart (`api.heal(0.5)`, half-hearts)
- when a block is placed: counts the connected placed blocks in the room
- when a room is entered: the placed-block count starts over; the record of healed rooms is kept, so a room heals once per run even after leaving and re-entering it
- when a room is entered on a floor: the floor's count of healed rooms is kept per floor, so a floor starts at zero the first time it is entered and going back up does not refill it
- the memory belongs to the run (its event bus): a new run starts clean

## Synergies and states of being

- [Open-hearted](../states-of-being/OPEN-HEARTED.md) (counts the emotion tag)
- [Embodied](../states-of-being/EMBODIED.md) (counts the body tag)

## Open questions

- None recorded.
