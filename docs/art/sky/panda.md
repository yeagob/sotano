# Sky art: The panda's floor and beings

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-panda`.

## The floor (F1, the Bamboo Seat)

The floor is shapes only. The beings (the panda, its minions and their models) are B1 and are not ruled here yet. Design: [PANDA.md](../../design/not-built/sky/guardians/PANDA.md) B6. Plan: [SKY.md §7](../../architecture/SKY.md).

**Meaning (proposal, owner to confirm).** A grove of bamboo that bends and keeps rising, a seat in its middle where the guardian rests, and one straight line of ledges the player climbs one block at a time. The meaning is patience: the route that rewards a slow climb.

**Side.** World and vessel. The floor carries no `light.*` and no `cold.*` token, and no projection.

**Materials.** The seat, the gentle path and the ledge strip are bamboo (`mat.bamboo`, the panda's floor in [blocks.md](blocks.md)). The building path, which the player extends with placed cubes, is skywood (`mat.skywood`). Nests and the two bamboo clumps are places, not blocks, so they carry no material yet.

**Reads without text.** From above, the seat is the tallest round mass in the grove, the gentle path is a line of steps that rises as it winds inward, and the building path is a zigzag of two-block steps on the east side. From the ground, the ledge strip is the one straight line of notches up the seat's west face.

**Value and colour.** Bamboo's chroma is a named exception in [blocks.md](blocks.md) (0.087, under the sky's 0.10 ceiling for named exceptions). Every sky token stays inside the enforced checks of `tests/sky-materials.test.ts`. The floor adds no colour of its own.

**The gate, honestly.** `?gallery=sky-panda` shows three pictures: the plan from above (nests and spawns as pale marks), the section along x through the seat, and the silhouette from the ground along z. The pictures are shape-only drawings, with no fog and no beings. **The captures in colour, greyscale, the three colour-blindness filters and at distance (20 blocks in fog) have not been taken in a browser yet; the gate is open for this floor until they are.**

**Gold.** No gold on this floor. Gold marks (ruling 4) are the player's positive hits on the panda, which are B1.

**Red lines.** No sacred names or symbols, no copied textures, no mental-health imagery. The floor is bamboo, skywood and air.

## The beings (B1, the giant panda and the little pandas)

**Ledger entry: pending owner review.** The gate is not passed: the owner signs it off. Built in `src/sky/creatures/deities/panda.ts` and `src/sky/creatures/minions/panda.ts`; tokens in the palette part `sky-panda`; design: [PANDA.md](../../design/not-built/sky/guardians/PANDA.md) B1–B5.

**Meaning (proposal, owner to confirm).** A guardian of rest: a big, sleepy, soft head that chews and asks the player to slow down (`concept:` patience, the mirror of rushing in PANDA.md §1). It is not a projection and not a threat; its look says *this moves you*, never *this hurts you*.

**Side.** Sky creature: plush, never cold (sky ruling 2). No `cold.*`, no family eye, no captive light, no red, no warning yellow, no gold of its own. The gold on it is only the player's marks (ruling 4).

**Tokens (`plush.panda.*`).** Two felts with a dark, base and hi each: an off-white (`#BDB8AD`, `#DEDAD0`, `#EAE7DF`) and a warm charcoal (`#211D1E`, `#322D2D`, `#4A4442`); the eye `#151214`; a felt glint `#BDB6A8` (not emissive: nothing in the sky glows that the player did not light); the inside of the mouth, a muted brown-grey `#5E504B`, never red. The stalk in its paw is the floor's own `mat.bamboo.base` and `mat.skyleaf.base`. *Enforced* in `tests/sky-panda.test.ts`: every plush token is ΔE ≥ 20 from `life.heart`, `attack.red.*` and `attack.warn.base`, ≥ 20 from `light.gold`, ≥ 15 from the four cold tokens and ≥ 8 from `cold.white` and `light.core`; every model part's colour is a palette colour.

**Shape and size.** Whole-texel boxes (16 to a block). The deity is 3 blocks tall: legs, a round 16-texel body with a black shoulder band and arms on shoulder pivots, under a 36-texel head (2.25 times the body), with black ears, teardrop eye patches that droop outward, heavy lids, a pale muzzle, a black nose and a small mouth. Its touch box is 1.1 half-wide and 3 high. A little panda is 1.25 blocks: the same shapes, its head 2.1 times its body.

**Telegraphs (DECISIONS §8.5).** Each attack names its tell part and pose: the right arm lifts the stalk overhead (toss), both paws press (press), the body shifts its weight (sit-down), the mouth opens wide (yawn), the left paw rises (shove), the right paw taps (thicket), the mouth chews with the lids closing (slow chew), both paws cover the eyes (peekaboo), the body tucks with the head down (tumble), the arms open (cradle). The part reaches its extreme pose as the telegraph ends; poses step at 12 fps; nothing toggles faster than 2 Hz; breathing is ±3 %. The marks on the world are the hindrances' own (the knockback's dust tones, bamboo-toned rings for the stalks, pale motes and puffs), never red.

**Sign of progress.** The heavy lids open as the gold marks gather: lids cover most of the eye at no hits and almost none at 24. Shut during the nap, drooping while the player stands still (the rest beat's calm feedback), wide open once won.

**Reads without text.** Black-and-white felt, round ears and eye patches over a giant head: a panda from the silhouette first, also in greyscale (the felts are far apart in value).

**Captures.** `?gallery=sky-panda` now shows the panda front and three-quarter in colour and greyscale, its lids at 0, 50 and 100 %, each telegraph at its extreme pose, Recovering, Rallying, Napping and won, and the little panda in colour and greyscale. Checked in the browser once (colour and greyscale only). **Not taken yet: the three colour-blindness filters and the view at 20 blocks in fog.** Seen in the capture, for the owner: under the gallery's two lights the off-white felt reads a little warm (beige) next to the sky; the arms are small against the head, so the paw tells read less than the mouth and head tells.

**Red lines.** No sacred names or symbols, no mental-health imagery, no copied model: the panda is built from the floor's own grammar of boxes.
