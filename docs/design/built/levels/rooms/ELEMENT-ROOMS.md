# Element rooms

Up: [rooms](README.md) · Status: built.

Twenty-eight templates put water, lava or fire at the centre of the room: a flooded hall, a river of lava across a floor, a row of eternal flames. Each is a room where an element is a verb. The table gives each room's floors, the element it uses (`W` deep water, `w` shallow, `L` deep lava, `l` shallow, `f` an eternal flame; `on a layer` marks braziers and flames raised on blocks), and what the player does with it. Where the design gives no verb for a room yet, the last column says so and the grid is the only description.

Water, lava and fire are the three elements, and each one's behaviour is in [elements](../../elements/README.md).

| Room | Floors | Element | What the player does |
|---|---|---|---|
| `cistern` | 1–6 | deep water under a barrel vault | Swim (watch the breath); fight from the galleries over the water; kick cubes in to float the wood |
| `hearth` | 2–9 | eternal flames, crates in the corners | Kick or throw crates into the fire; lure Panic into a flame; break a flame's floor to put it out |
| `moat` | 3–9 | lava moat around an island, under a dome | Knock projections into the lava with thrown cubes; bridge the moat with blocks |
| `steam` | 3–9 | water and lava split by one obsidian wall | Break the wall: emotion meets old pain and hardens into obsidian and stone |
| `terraces` | 1–5 | shallow water in a ring, flames on the top tier | Fight from above; the water calms Panic; the flames on the top tier are the warm light |
| `font` | 1–5 | a cross of shallow water under a dome, braziers on four pillars | Wade; break a pillar to put its flame out |
| `crossing` | 1–5 | deep water across a dry centre, a brick bridge | Hold the bridge; Doubt walks around the water |
| `spring` | treasure, all | shallow water in a ring around an island with the practice | Wade to the practice; wading is the only verb |
| `reliquary` | vault, 3–9 | lava in the corners, braziers on pillars | Break the floor next to the lava and the lava spills (it slopes like a ramp) |
| `caldera` | boss, 3–9 | lava pools around the arena, braziers on pillars | The boss's arena, with the lava pools around it |
| `well` | start, all | shallow pools under a high vault | A first taste of wading |
| `roots-spring` | roots | shallow water | The roots' water lesson: the pool teaches wading, nothing hurts |
| `lava-bridge` | 3–5 | a lava river from wall to wall, one brick span across it, crates on the east bank | Cross the span, or build your own over the lava |
| `cave-lake` | 3–5 | two deep pools with a causeway between them, a stone in the middle row | Swim the pools or walk the causeway |
| `abyss` | boss, 5 | deep water at the edges of the great pit, braziers on a layer over the room | The great pit: its shaft is the way down into the random floors |
| `antechamber` | 6–9 | a river of lava across a hall two cells long | Bridge the river to the key; climb the walls |
| `drowned-nave` | 3–4 | a drowned nave, water wall to wall with galleries over it | Swim or step across the stones; fight from the galleries |
| `styx-cavern` | 5–6 | an irregular cavern with a deep pool and dry dips under an uneven roof | Wade and swim to the hummock with the key |
| `dis-hall` | 6–7 | lava in a ditch, graves of flame beyond | Bridge the lava |
| `downpour` | 3–4 | shallow pools in a lattice between two rows of crates | Carry the crates to step across the pools to the key; no other verb in the design yet |
| `marsh` | 5–6 | deep water to the west and lava to the east, split by a column of obsidian, under a dome | No verb in the design yet beyond going around the obsidian |
| `tombs` | 6–7 | eternal flames, a door plug, stone | No verb in the design yet |
| `river` | 7–8 | a lava river down the room | No verb in the design yet |
| `cocytus` | 9 | frozen water, ice on its surface, a dome | The frozen bottom: its pools are ice (see [CIRCLES](../floors/CIRCLES.md)) |
| `path-ford` | 1–9 | deep water across a corridor | A corridor of the Tree: wade or swim across |
| `path-span` | 3–9 | lava across a corridor, a brick span | A corridor of the Tree: cross the span |
| `path-coals` | 3–9 | lava and stone in a corridor | A corridor of the Tree: no verb in the design yet |
| `islet` | treasure, 3–9 | lava around an island holding the treasure | The practice on the island: reach it by bridging or swimming |

Rules that every element room follows, enforced by the validator: no water beside lava or flame beside something that burns (the room would react on load); no element on a door approach, the centre or the shaft; a flame on a layer needs a terrace exactly that high beneath it; and nothing hurts (lava, fire) on the roots. Where water and lava share a room (`steam`, `marsh`), they are kept apart by obsidian or by open ground.

Code: `src/content/rooms.ts` (the templates, the element characters `w W l L f`), `src/content/elements.ts` (what each element does), `src/world/floor.ts` (carving the pools, dips and flames).
