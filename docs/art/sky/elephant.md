# Sky art: The elephant's floor and beings

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-elephant`.

## The floor (F3, the channels)

The floor is shapes only. The beings are B3 (below). Design: [ELEPHANT.md](../../design/not-built/sky/guardians/ELEPHANT.md) B6, as resolved on 2026-11-04 (provisional). Plan: [SKY.md §7](../../architecture/SKY.md).

**Meaning (proposal, owner to confirm).** A stepped mountain of pale stone rising to a pool at its top, where the herd's water sits at the foot. The floor is about carrying: what the player carries, and what the floor carries away. The way up is a dry line of ledges beside the water, the only route that is not a channel.

**Side.** World and vessel. The floor carries no `light.*` and no `cold.*` token, and no projection.

**Materials (provisional, from the generator).** The base and the rings are pale stone (`mat.palestone`). The rim is fence wood (`mat.fencewood`). The tusk line's ledges are sky wood (`mat.skywood`). The Basin's pool and the waterhole are the template water (`el.water.*`). Nests, the spawn and the seat are places, not blocks.

**Reads without text.** From above, the Basin is the round pool on a mesa in the middle, ringed by a rim; the waterhole is a second pool on the outer ring, opposite the tusk line; the tusk line is the one diagonal of ledges, from the ground ring to the shore. From the ground, the rings are a stepped mountain, six blocks to each step.

**The gate, honestly.** `?gallery=sky-elephant` shows three pictures: the plan from above (water in its blue, nests and the spawn as pale marks), the section along x through the Basin, and the silhouette from the ground along z. The pictures are shape-only drawings, with no fog and no beings. **The captures in colour, greyscale, the three colour-blindness filters and at distance have not been taken in a browser for the approved look yet; the gate is open for this floor until they are.** The four channels are not built (see the report of the F3 package); this floor's rulings wait for them.

**Still to rule.** The parts the player must read, each waiting for its ruling: the terraces and their 6-high walls; the channel troughs (bed, banks and bank cuts), dry and wet, once the channels are built; the Basin's pool, its rim and the four culvert spouts under the rim's upper row; the shore round the rim; the waterhole, which must read as the herd's pool and not as a channel's foot; the tusk line's ledge strips, which must read as the dry way up.

**Gold.** No gold in the floor's matter. Gold marks (ruling 4) are the player's positive hits on the elephant (B3, below).

**Red lines.** No sacred names or symbols, no copied textures, no mental-health imagery. The floor is pale stone, fence wood, sky wood and water.

## The beings (B3): ledger entry, pending owner review

Status: **pending owner review**. The art gate is not passed: the owner signs it off. Captures: `?gallery=sky-elephant`, the sections after the floor (turntable, the telegraph poses, the sign of progress, a calf, scale). Code: `src/sky/creatures/deities/elephant.ts` (the deity's model and `poseModel`), `src/sky/creatures/minions/elephant.ts` (the calf's model and `reactModel`), tokens in `src/content/palette/sky-elephant.ts`.

**Meaning.** The elephant carries an old weight (ELEPHANT.md §1): a great head, heavy with memory, on a small soft body. `concept:` the mirror of carrying an old weight, to confirm with the owner in CONCEPTS.md (not added: naming a concept is the owner's). The positive intention does not break it: each hit leaves a gold mark, and its ears hang a little looser, as if a weight were set down.

**Side.** A sky creature: plush, never a projection (sky ruling 2). No cold token, no family eye, no captive light, no red.

**Tokens (`plush.elephant.*`, `sky.elephant.*`).** Warm felt greys `plush.elephant.dark` `#6F675F`, `.body` `#9C948B`, `.hi` `#B8B0A6`; the inside of the ears a dusty mauve `plush.elephant.ear` `#A88F8A`; ivory tusks `plush.elephant.tusk` `#E6DCC6`; a small dark warm eye `plush.elephant.eye` `#2E2924`. The marks: `sky.elephant.mark` `#C9B48E` (the remembered place) and `sky.elephant.heavy` `#7D776B` (the grey of Heavy water); the dust uses the floor's own pale stone darks. Measured (CIE76, normal vision; enforced in `tests/sky-elephant.test.ts`): every token is ΔE ≥ 20 from `life.heart`, `attack.red.*`, `attack.warn.base` and `light.gold` (nearest: the mark at 40.9 from the gold), and ≥ 15 from `cold.body`, `cold.rim`, `cold.dim`, `cold.deep` (nearest: the dark felt at 21.3 from `cold.dim`). The tusks are 12.1 from `light.core` and 17.9 from `cold.white`, above the sky's floor of 8.

**Shapes.** The deity: a body one block wide, a head 2.19 wide (2.2 times), ears like sails that stand open from the head, a trunk of three narrowing segments under a pivot, two short tusks; about 3 blocks tall, levitating one block over the Basin. A calf: about 1.2 high, its head 1.6 times its body. Every size is whole texels; inlays (eyes, brow, inner ears) sit half a texel out on their host's face (`inlay`, so they never z-fight).

**Telegraph channels (DECISIONS §8.5).** Each attack names its part and its pose (`tell`, `pose` on its `AttackDef`): the trunk curls up (Trunk spray), swings back (Trunk swat), blows (Mud wallow), sweeps (Dust bath, 1.2 Hz), lifts the stone, presses the floor (Low rumble, the head lowered a little), rises straight up (Trumpet, the ears open); the ears beat (Ear fan, 1.5 Hz, under the 3 Hz rule); the head lowers and goes still (Heavy water); the trunk reaches down (Trunk lift). The marks on the floor are hazards in the sky's tints, never red or yellow: the remembered place's warm ring, the dust's pale ring, the rumble's dark felt ring, the heavy water's grey line. The sounds are named (`elephant.water`, `.swat`, `.squelch`, `.hiss`, `.stone`, `.whoosh`, `.rumble`, `.trumpet`, `.toll`, `.note`, `.lift`, `.thud`, `.settle`, `.call`), but the sound part (`src/audio/sky/elephant.ts`) is still silent, as every sky part is.

**Still open for the owner.** The ears read as sails from the ¾ view but are thin from the front; the trunk's raised pose is hidden behind the head from some angles (Trumpet should read from the shore); the captures in greyscale, the three colour-blindness filters and at distance in the hall's fog have not been taken; the model faces the player by turning its body, while the gold marks stay where they landed.
