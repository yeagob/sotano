Up: [Projections](README.md)

# Impulse

Status: built.

## What it is

Acting before thinking. It leaps before it has looked.

## Where it appears

Floors 1 and 2. Code: [impulse.ts](../../../../src/content/enemies/impulse.ts).

## How it moves and attacks

- Within six blocks, it crouches for 0.6 seconds. A ring on the floor marks the spot where you stood when it began to crouch, and the ring strikes there (4 damage) when the crouch ends.
- It then leaps across the room in about 0.7 seconds and lands with a short ring of its own (4 damage) where it comes down.
- After a leap it waits about 2.2 seconds before the next one.
- It breaks the softest blocks around it.

## How the player answers it

Move after it starts to crouch: the first ring is where you stood, not where you are going. Stay out of the landing ring. Good intentions do half damage and warm it; bad intentions do full damage. It is most vulnerable while it waits between leaps.

## Element affinities

None.

## Status

Built. Whether it leads your position is an open question ([OPEN-QUESTIONS](../../not-built/projections/OPEN-QUESTIONS.md)).
