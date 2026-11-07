# Sky art rulings

Up: [Art decisions](../DECISIONS.md)

The binding art rulings for the sky realm, Totality and the Spiked Entity ([architecture: SKY.md §11](../../architecture/SKY.md)). Each package that draws a part of the sky rules it in its own page, with its captures from `?gallery=sky-<part>`. Where a page here and [DECISIONS.md](../DECISIONS.md) disagree, DECISIONS.md wins unless the page records a stated exception.

## The sky's shared rulings (art agent, 2026-11-03; OWNER to confirm)

These hold for every part of the sky. The pages below add their own; none may undo these.

### 1. The sides in the sky

The three sides of DECISIONS §2 hold, with one change: **there are no projections in the sky.**

| Side | In the sky | Colour |
|---|---|---|
| World / vessels | The tree, its halls, the deck, the floors' matter, Totality's platforms ([blocks.md](blocks.md)) | Sky materials (`mat.<sky material>.*`, palette part `sky-blocks`) and the air (`sky.*`) |
| The light / the player | Intentions, shards, seams, practices, the **gold marks** (§4) | `light.*` as everywhere |
| Sky creatures (deities and minions) | Plush beings, never projections (§2) | Their own `plush.<animal>.*` tokens, in the animal's palette part |

### 2. Sky creatures are plush, never cold

Sky creatures are not projections ([SKY.md §11](../../architecture/SKY.md)). They take **no** cold husk, no family eye, no `cold.*` token, no captive light and no `path.*.shadow` tint: the cold is the projections' (DECISIONS §3.12 rule 3) and nothing in the sky is a projection. They are **plush**: a small round soft body of whole-texel boxes in low-contrast felt tones under a **giant head** about 2.2 times the body's width, the animal readable from its silhouette first; a deity about 3 blocks tall, a minion about one. Each animal's tokens are `plush.<animal>.*` in its own palette part. Telegraphs use the animal's own parts (lids, ears, mane, trunk, hind legs) as the tell, on the three channels of DECISIONS §8.5, at the floor's length.

### 3. Nothing in the sky is red

Nothing in the sky damages the player (owner decision 8), so nothing in the sky wears the colour of harm (DECISIONS §7.6). No sky token, telegraph, ring, arc or particle uses `attack.red.*`, `life.*` or the warning yellow `attack.warn.*` (the warning of a blow that hurts; no sky blow hurts). A sky telegraph says *this moves you*, in the animal's own tones.

*Enforced:* every token of the sky's palette parts is ΔE ≥ 20 (CIE76, normal vision) from `life.heart`, `attack.red.base`, `attack.red.dim` and `attack.warn.base` (`tests/sky-materials.test.ts`). The nearest is `mat.heartwood.hi` at 47.3 from `life.heart`. Under protanopia and deuteranopia some browns, olives and greens fall within 4–7 of the reds (the red–green axis collapses for everyone on it); nothing in the sky means harm, so nothing there depends on that hue.

### 4. Gold marks are the player's light

A positive hit on a sky creature leaves a **gold mark**: a small quad of `light.gold` that stays where it landed (gold is the light and repair, DECISIONS §3.12 rule 1). So that a mark reads on anything in the sky, every sky token is ΔE ≥ 20 from `light.gold` in normal vision (enforced; the nearest is `mat.bamboo.base` at 34.7). Under tritanopia the corona (`sky.strata.corona`) comes within 14.9 of the gold: near the Sun a mark is told by its value and its square shape on the creature, not by hue against the sky.

### 5. The puff: "nothing happened"

A hit that changes nothing (a neutral or warm intention on a sky creature, SKY.md §5.7) shows the **puff**: a small pale cloud of `bone.paper` and `bone.dim` motes with a few of `sky.day`, rising slowly and fading. Never gold (gold would say the light landed), never `cold.*` (the cold is the projections'), never red. On cloud the puff is nearly the cloud's own colour: it shows by its motion, which is right: nothing happened.

### 6. Sky matter is pale: a stated exception to pillar 1 (OWNER to confirm)

Pillar 1 (DECISIONS §1.1) keeps found matter dull: OKL ≤ 0.62, chroma ≤ 0.06. Below the surface that is the husk: dark matter that the light must earn. **The sky is the vessel in daylight.** As above, so below (`emerald-tablet`, `kybalion` correspondence): under bedrock the source is the albedo, the white crack (DECISIONS §4); above the world the matter itself is pale. So in the sky:

- **Value is lifted:** sky matter may reach OKL 0.97 (cloud, mist, pale stone, solar glass, the sun seal are pale; the woods, moss, resin and meteor glass stay in the world's band).
- **Chroma stays low:** ≤ 0.06, named exceptions ≤ 0.10 (heartwood, bamboo, meteor glass, solar glass, the sun seal), as crate and obsidian below. Enforced.
- **Nothing in the sky's matter is emissive.** Nothing glows that the player did not light: the Sun's wash is fog and clear colour, never baked into blocks (§7).
- **Sky matter keeps clear of the cold and of the light's white:** ΔE ≥ 15 from `cold.body`, `cold.rim`, `cold.dim`, `cold.deep`, and ≥ 8 from `cold.white` and `light.core` (enforced; pale matter near white can only keep a small distance from the two whites, and keeps it).

### 7. The Sun's warmth: a provisional exception to pillar 2 (owner, 2026-11-03, provisional)

Pillar 2 says warm light that is not the player's hurts (*warmth that isn't yours burns*). The Sun is warm and it is not the player's. **It is the one stated exception, provisional:** the Sun is the source the player's light comes from, so its warmth is the one warmth that is not a threat.

- It **only washes the sky**: the fog and clear colour of Totality's upper stratum (`sky.strata.dawn` → `sky.strata.corona`, [blocks.md](blocks.md)) and the Sun's own render (TT, `src/sky/render/sun.ts`).
- It **never lights the blocks**: no warm bake, no emissive texel, no warm light pool; the solar glass and the sun seal keep their own ramps.
- It is **never a `light.*` token**: the corona is a pale sand-gold (`#DCC497`) kept ΔE 36.9 from `light.gold`, so the player's gold marks still read against it.
- It never flashes: the wash eases in over about 200 blocks of climbing (no step of one block changes the colour by more than 3 ΔE, enforced).

Recorded here by AB; applied by TT ([totality.md](totality.md)). The design text: [TOTALITY.md](../../design/not-built/levels/TOTALITY.md) §3.

### 8. Colour by height

The sky changes as the player climbs, so no two heights look alike (issue #12): the halls' dusk grows lighter from the first floor to the fifth, the open air beside the trunk clears from the deck's haze to the day blue at the crown, and Totality goes pale blue → cyan → violet → black with stars → plum and rose dusk → the corona. The table and the numbers: [blocks.md](blocks.md#the-air-srcskyatmospherets).

## Pages

| Page | Contents |
|---|---|
| [blocks.md](blocks.md) | Sky blocks and atmosphere |
| [panda.md](panda.md) | The panda's floor and beings |
| [koala.md](koala.md) | The koala's floor and beings |
| [elephant.md](elephant.md) | The elephant's floor and beings |
| [lion.md](lion.md) | The lion's floor and beings |
| [horse.md](horse.md) | The horse's floor and beings |
| [totality.md](totality.md) | Totality, the Earth and the Sun |
| [entity.md](entity.md) | The Spiked Entity |
| [hindrances-core.md](hindrances-core.md) | Hindrances: knockback and wind |
| [hindrances-ground.md](hindrances-ground.md) | Hindrances: opening holes and fading platforms |
| [hindrances-hold.md](hindrances-hold.md) | Hindrances: dense ground and cube cage |
| [hindrances-flow.md](hindrances-flow.md) | Hindrances: water currents and paralysis |
