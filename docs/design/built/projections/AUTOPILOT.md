Up: [Projections](README.md)

# Autopilot

Status: built.

## What it is

Living by routine. It walks the same route through the room and does not look up, until you cross the route.

## Where it appears

Floors 1 and 2. Code: [autopilot.ts](../../../../src/content/enemies/autopilot.ts).

## How it moves and attacks

- It walks a fixed square route, about eight by six blocks around the point where it appeared, and ignores you.
- When you come within 1.6 blocks of the leg it is on, it marks that leg as a line on the floor for 0.7 seconds, then charges along it at high speed.
- Its touch does 4 damage, so a charge that runs into you hurts.
- A block on its route stops it. It waits about a second and then tries the same leg again. It does not turn to a new route.

## How the player answers it

Step off the leg before it charges, or put a block on the route. Good intentions do half damage and warm it; bad intentions do full damage. It is easy to hit while it walks, because it does not chase you.

## Element affinities

None.

## Status

Built.
