# Reframing

Up: [Emotion folder](README.md) · [all practices](../README.md) · [Bounce family](../BOUNCE.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Emotion; also none |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Cognitive reframing (cognitive therapy) |
| Code | `src/content/items/reframing.ts` |

## What it means

Looked at again, a setback points at what matters.

## What it does

Intentions bounce once more. After each rebound an intention turns toward the nearest projection within 8 blocks of the bounce point, keeping its speed, and deals 25% more damage. The bonus applies at every rebound, so the bonuses stack: after two rebounds the intention deals 1.25 × 1.25 = 1.5625 times its damage.

- Positive outcome: a miss becomes a hit. A rebound that would have flown past a projection now points at it.

## Stats and events

- when you fire (`fire`, priority 20, the rebound): bounces + 1.
- on each rebound (`intentBounce`, priority 50, before Dialectic's split): if `api.nearestProjection` finds a projection within 8 blocks of the bounce point, the velocity points at its centre with the speed it had at the rebound. In any case the damage × 1.25.

## Synergies and states of being

- [Open-hearted](../states-of-being/OPEN-HEARTED.md) counts the emotion tag.
- Compatibility with Bounce Back and Dialectic: see [the Bounce family](../BOUNCE.md#compatibility).

## Open questions

- See the [Bounce family's questions](../BOUNCE.md#open-for-the-owner).
