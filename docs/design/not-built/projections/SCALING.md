Up: [Projections (not built)](README.md)

# Scaling with depth

Status: proposal. Numbers are targets until a build confirms them. The code gives every projection the health and speed of its own file: the table below is not in the code (see [GAPS](GAPS.md), "Health and speed by floor").

Player damage starts at 3.5 per intention and grows with practices; the numbers below assume that.

| Floor | Budget (`2 + floor`) | Health × | Speed × | Rooted chance | Lineage forms in the pool |
|---|---|---|---|---|---|
| 1 | 3 | 1.0 | 1.0 | 0 % | I |
| 2 | 4 | 1.1 | 1.0 | 3 % | I |
| 3 | 5 | 1.2 | 1.05 | 5 % | I, II |
| 4 | 6 | 1.3 | 1.05 | 7 % | I, II |
| 5 | 7 | 1.45 | 1.1 | 9 % | II |
| 6 | 8 | 1.6 | 1.1 | 11 % | II, III |
| 7 | 9 | 1.8 | 1.15 | 13 % | II, III |
| 8 | 10 | 2.0 | 1.15 | 15 % | III |
| 9 | 11 | 2.3 | 1.2 | 18 % | III |

- **Health multiplies** the projection's base health (its card gives it on the floor-1 scale).
- **The budget** is the number of projection points a room may spend; it is split across the waves of the room ([SPAWNS-AND-WAVES](../../built/encounters/SPAWNS-AND-WAVES.md)).
- **The rooted chance** is the chance that a projection spawns rooted ([ROOTED-VARIANTS](ROOTED-VARIANTS.md)).
- **The lineage forms** are the forms of each pattern that the pool of a floor draws from (see [ZONES](ZONES.md)).

Contact damage stays 4 points (half a heart) on floors 1 to 4, and becomes 8 (a heart) only for Line, Leap and Sweep attacks from floor 5 on, so damage stays readable: **big telegraphs hurt more**.
