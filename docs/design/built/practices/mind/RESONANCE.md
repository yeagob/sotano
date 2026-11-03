# Resonance

Up: [Mind folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Mind; also none |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Sympathetic resonance (physics); a nod to attunement in therapy |
| Code | `src/content/items/resonance.ts` |

## What it means

When one thought rings true, the ones near it start to hum.

## What it does

When you fire an intention, every other intention in flight in your room adds 1% damage to it. Four others make it 4% stronger; none, nothing. The count is taken at the moment of the shot, and the bonus applies to every intention of a volley.

## Stats and events

- when you fire (`fire`, priority 90, after the other shot changes): damage × (1 + 0.01 × the other intentions in flight in your room, `intentsHere`). Intentions in flight in other rooms do not count.

## Synergies and states of being

- [Lucid](../states-of-being/LUCID.md) (counts the mind tag)

## Open questions

- None recorded.
