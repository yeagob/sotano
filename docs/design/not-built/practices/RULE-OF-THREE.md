# Rule of Three

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/ruleofthree.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/mind/`.

| | |
|---|---|
| Path | Mind |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | The rule of three, a proportion from three known terms (classical arithmetic; public domain) |
| Code | `src/content/items/ruleofthree.ts`; the formation in `src/combat/intents.ts` (`strandOrbit`, `shoot`, `Intents.update`) |

## What it means

Three known things give the one you do not know. Three strands, each carrying its share of the answer.

## What it does

Each intention becomes three strands at the corners of an equilateral triangle, point up, around the flight line. The triangle starts 0.15 blocks from the line and widens to 0.9 blocks over the straight part of the flight (0.5 s times the range). Each strand deals 70% of the damage and mining. The strands fly parallel to the flight line, so they do not fan out from each other; only the triangle separates them.

Under Triangulation (a volley of three directions) each direction is its own triangle: nine strands per shot.

With Spiral Growth the triangle turns (see [Spiral Growth](SPIRAL-GROWTH.md)).

Positive outcome: each strand is a hit of its own, so one shot covers more of the room, and a block or a projection that the middle of the flight misses can still be reached by a side strand.

## Stats and events

- `triad`: add 1 (a flag, held at 0 or 1)
- Strands live 3 seconds (a plain intention lives 6), so three strands per direction stay under the cap of 200 intentions.
- Hooks: none. The formation is read by the intention itself when it is fired.

## Synergies and states of being

- [Spiral Growth](SPIRAL-GROWTH.md): the triangle turns. With both, a strand's share is 70% of the helix's share (strand 0: 70%, strands 1 and 2: 28%).

## Open questions

- "Strands converge on one line instead of fanning" is read as: the strands share the direction of the flight. If the owner meant that they should aim at one point, this changes.
- With both formations the shares multiply, so the Spiral's 40% and the triangle's 70% both apply. The owner may prefer one of them to take over.
