[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# Overwhelm

Built. Floors 3 and 4, from the Zone II pool. Code: `src/content/bosses/overwhelm.ts`.

Overwhelm is a tide with a face of foam: a tall wall of husk-coloured water that surges at the player and sends waves across the room. Its waves are low enough to jump, and it is the water's own boss.

- **Pattern:** too much at once. To be held.
- **Path:** Emotion.
- **Health:** 229 on floor 3, 293 on floor 4.

## Phases

### Phase 1: surges

It walks at the player. Its moves:

- A surge and break: a charge, then a tide across the room.
- A tide across the room, 2.2 seconds long, begun while it keeps walking.
- A charge, chosen only while the player is three or more blocks away.
- A fan of five bolts over two volleys.

### Phase 2: breaks (from two thirds of its health)

Arena `flood`: water rises across the room to level three, except near the player. Its moves:

- Crossing tides: two tides along one axis, then two along the other.
- A splash and surge: a shockwave, then a bouncing charge.
- Tides on both axes, three of them, walking.
- A double shockwave.
- A bouncing charge.

### Phase 3: recedes (from one third of its health)

Arena `drain`: the water goes. Its moves:

- The flood: three tides on both axes, a volley of twelve bolts, then a bouncing charge.
- Four tides on both axes, walking.
- A volley of twelve bolts over two volleys.
- A bouncing charge with two bounces.

## Toasts

- Entering phase 2: "It breaks: the water rises and waves come from every side. Jump them".
- Entering phase 3: "It recedes: the water drains, and it throws all it has left".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's stepping stones over still water, and the core left stranded when the water drains, are not built.

## Open questions

- **Galleries.** The design has the player fight from galleries above the flood. The build has no gallery shape for it to use; the flood reaches the player's level. Is that acceptable?
- **Core.** The design's stranded core vessel is not built; the boss simply ends.
- **Water and the level.** The flood's water level reaches the whole room. Check in play that it is never a trap with no way out.
