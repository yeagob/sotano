Up: [Projections](README.md)

# Distraction

Status: built.

## What it is

Scattered attention: "Ooh, what is that?" A small flyer that cannot hold still.

## Where it appears

Floors 1 to 5. Code: [distraction.ts](../../../../src/content/enemies/distraction.ts).

## How it moves and attacks

- It flies about three blocks around you, at eye height (one block over the surface under it, so its touch can reach you), and changes its angle every 1.2 seconds, so its path looks random. It climbs a step before it reaches it and turns off walls instead of pressing on them.
- Every three seconds it stops and snaps its wings flat for half a second (the telegraph), darts through the place where you stood, then rests for a moment, open to a hit. Only the dart touches: it does 2 damage.
- Allied (turned to your side), it keeps you company the same way and darts at the projections that are hostile to it.

## How the player answers it

Its path is erratic, so wait for a clear moment and throw. Good intentions do half damage and warm it; bad intentions do full damage. It has twelve health: four full hits, or seven good ones.

## Element affinities

None.

## Status

Built. Its card's attraction to lights is an open question ([OPEN-QUESTIONS](../../not-built/projections/OPEN-QUESTIONS.md)).
