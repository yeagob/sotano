Up: [Projections](README.md)

# Spark

Status: partial. This document holds the built part only. The rest of the card is in [GAPS](../../not-built/projections/GAPS.md).

## What it is

The pattern of being always on edge: "Is that? What was that?" It cannot be caught off guard, and it jumps at the smallest sound.

## Where it appears

Floors 7 and 8. Code: [spark.ts](../../../../src/content/enemies/spark.ts).

## How it moves and attacks

- It walks at you, quickly, and pauses for 0.6 seconds every two seconds.
- Every three seconds, while it has a target, it fires an arc: a line from its body to you, announced for 0.7 seconds, live for 1.5 seconds, doing 4 damage.
- Its touch does 2 damage. It has 24 health.

## How the player answers it

Step out of the arc's line. Good intentions do half damage and warm it; bad intentions do full damage.

## Element affinities

None.

## Status

Partial. The built part is the walk and the arc. Its jumps between conductive blocks, the arcs between Sparks and grounding are in [GAPS](../../not-built/projections/GAPS.md).
