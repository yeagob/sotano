[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Downpour

Built. Floors 3 and 4, from the Zone II pool. Code: `src/content/bosses/downpour.ts`.

The Downpour is a low ceiling of cloud the size of the arena. It hovers over the player, never as fast as they run, and rains cold drops and stinging puddles on the place they are going. It comes down as the fight goes on: three steps, from 3.5 blocks to 1.6 blocks above the floor. Low enough, it can be reached.

- **Pattern:** a cloud that keeps the room grey. To be left alone.
- **Path:** Emotion, grown old.
- **Health:** 229 on floor 3, 293 on floor 4.

## Phases

### Phase 1: rains (3.5 blocks up)

It hovers over the player. Its moves:

- A storm front: stinging puddles, then a barrage of ten drops, marked as they fall.
- A barrage of eight drops, walking.
- Three puddles, walking.

### Phase 2: comes down (2.4 blocks up, from two thirds of its health)

Arena `puddle`: shallow water covers the floor. Its moves:

- A lightning storm: two bar grids (one straight, one crossed), then a barrage of eight.
- A barrage of ten drops, walking.
- Bars, walking.
- Four puddles, walking.

### Phase 3: thins (1.6 blocks up, from one third of its health)

Arena `drain`: the water goes. Its moves:

- A cloudburst: a nova of ten bolts over two volleys, a barrage of fourteen drops, then a crossed bar grid.
- A barrage of twelve drops, walking.
- A crossed bar grid, walking.
- A nova of ten bolts over two volleys.

## Toasts

- Entering phase 2: "It comes down: rain floods the floor and lightning bars the room".
- Entering phase 3: "It thins: low enough to reach, it throws the rest of its rain".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's shaft of light down into the room, and the holes in the cloud through which its core shows, are not built.

## Open questions

- **The cloud's core.** The design has holes open in the cloud in the last phase. The build only lowers it. Keep it, or open the holes?
- **Drops in the open.** Every drop is marked as it falls. Confirm that the marks are readable in the rain the phase 3 floor makes.
- **Puddles.** Puddles sting while the player stands in them. The effect is a sting, not a slow, so check the balance of walking through them.
