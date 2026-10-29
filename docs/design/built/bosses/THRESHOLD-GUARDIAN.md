[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Threshold Guardian

Built, on its shadow route only. Floor 5, the keystone of the great pit. Code: `src/content/bosses/threshold-guardian.ts`.

The Guardian is a tall gate of stone with two pillars and a lintel, standing at the edge of the great pit. In the build it is a boss like the others, and it is fought the way they are. The design gives it a second way through, the route of light, which is not built (see [The Threshold Guardian's light route](../../not-built/bosses/THRESHOLD-GUARDIAN-LIGHT.md)).

- **Pattern:** the fear at the edge of change. It keeps the player safe from the unknown.
- **Path:** all paths.
- **Health:** 374 on floor 5.

## Phases

### Phase 1: bars

It walks at the player. Its moves:

- A closing gate: three sets of bars, one after another (parallel, crossed, then two parallels).
- Two parallel bars, spaced three blocks apart.
- A crossed bar grid.
- A fan of five bolts over two volleys, walking.

### Phase 2: tests (from two thirds of its health)

Arena `rockfall`. It keeps a distance of six blocks and sends volleys across the room. Its moves:

- A volley chain: a fan of seven, a nova of sixteen, a fan of nine.
- A fan of seven, walking.
- A nova of sixteen bolts over three volleys, spiralling.
- A double crossed bar grid.

### Phase 3: steps aside (from one third of its health)

Arena `rockfall`, again. It charges and crushes. Its moves:

- A charge and crush: a bouncing charge, a slam with four stones, then a crossed bar grid.
- A charge with two bounces.
- A slam with three stones around the landing.
- A double crossed bar grid.

## Toasts

- Entering phase 2: "It tests you: volleys and bars cross the whole room".
- Entering phase 3: "It steps aside and charges along the edge of the pit".

## Defeat

Its defeat is the same as any boss's: the boss room opens and the way down is cracked open after the usual delay. The shadow route's pit stays shut in the design, with a hole dug beside it instead; the build has one hole, the same as every floor.

## Open questions

- **The way through.** In the build the Guardian starts hostile, and a positive intention can convert it like any boss (see [Fight flow](FIGHT-FLOW.md#7-defeat)). The design says it starts as a gate that asks, and only turns hostile when attacked with negative intentions. Which one is the keystone?
- **Light route.** The route of light (a five-second test, the arch over the pit) is not built. See [its document](../../not-built/bosses/THRESHOLD-GUARDIAN-LIGHT.md).
- **Phase 3 charges.** The design has the charges run along the pit's edge. The build's charges run toward the player.
