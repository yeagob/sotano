# Dialectic

Up: [Mind folder](README.md) · [all practices](../README.md) · [Bounce family](../BOUNCE.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Mind; also none |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | The dialectical method (Hegel; Socratic dialogue) |
| Code | `src/content/items/dialectic.ts` |

## What it means

Every clash of ideas gives birth to two new ones.

## What it does

Intentions bounce once more. Each time one rebounds off a block, it splits into two that go opposite ways, each at half damage. A split intention can split once more, so one shot makes at most four intentions: the second generation does not split again.

- Positive outcome: the total damage of the shot is kept (two halves at half each), and the halves cover more of the room. A positive intention mends with both halves.

## Stats and events

- when you fire (`fire`, priority 20, the rebound): bounces + 1.
- on each rebound (`intentBounce`, priority 200, after Reframing's aim): the reflected heading turns 40° either side around the face normal; the original takes the +40° heading and a twin, launched from the bounce point, takes the −40° heading. Both get damage × 0.5 and mining × 0.5 of their current values. The twin copies the spec (tags in a new set), keeps the remaining bounces and the polarity, and keeps the rebound count.
- Lineage: the first split marks both halves `dialectic-1`; a split of a marked intention marks its halves `dialectic-2` and they never split again. At most two splits per lineage, so one shot makes at most four intentions.
- Degenerate case: when the reflected heading is within 10° of the normal, the turn is around world up instead, or around world X when the face is a ceiling or floor.

## Synergies and states of being

- [Lucid](../states-of-being/LUCID.md) (counts the mind tag)
- Compatibility with Bounce Back and Reframing: see [the Bounce family](../BOUNCE.md#compatibility).

## Open questions

- See the [Bounce family's questions](../BOUNCE.md#open-for-the-owner).
