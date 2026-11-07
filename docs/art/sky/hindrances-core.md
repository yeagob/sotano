# Sky art: Hindrances: knockback and wind

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-hindrances-core` (the warning and the live marks of a ring, a line and a cone, and of the gust's lanes, from above and from the player's eye; the palette).

Status: built (H0). Owner to confirm the two tone choices below.

## What the player sees

- **Knockback** (a kick, `src/sky/hindrances/knockback.ts`). Its warning is a dashed arc on the floor in the sky's wood darks (`mat.skywood.dark`). When it lands, the same arc turns solid in `mat.skywood.outline` for 0.6 seconds, at twice the size of the dashes. The shape is a ring around the animal, a line, or a fan of five rays (a cone).
- **Wind** (a gust, `src/sky/hindrances/wind.ts`). Its warning is three dashed lanes on the floor in the sky's leaf dark (`mat.skyleaf.dark`): the centre line and one either side. When the gust blows, the lanes turn solid in `mat.skyleaf.outline`, at twice the size, for the gust's length.
- **Telegraph motes** (the rising dust of a warning) take the tint's own pair of tones (`motes`): the wood's base and dark for a kick, the leaf's dark and base for the wind. Never the cold ramp.

The marks are darker than the stone they cross on purpose: the sky's floors are pale (sky ruling 6), so a dark mark reads where a pale one would vanish. The mark tones are the sky's own matter, not a new colour.

## Rulings

1. **The sky's own tones, never the colours of harm or warning.** Every mark in this family is a sky tone: wood for the kick, leaf for the wind. None is `attack.red.*`, `attack.warn.*`, `life.*` or `light.*`, and none is `cold.*` (the cold is the projections'). Nothing in the sky harms the player (owner decision 8), so nothing in the sky wears the colour of harm (sky ruling 3, DECISIONS §7.6).
2. **Enforced.** `tests/sky-hindrances-core.test.ts` checks every tone against `life.heart`, `attack.red.base`, `attack.warn.base` and `light.gold` (CIE76, normal vision). The nearest measured distance is **57.5** (`mat.skywood.base` against `light.gold`); the rest are between 66 and 98. So the gold marks of a positive hit (sky ruling 4) and the warning yellow read apart from every mark of these hindrances.
3. **A warning is dashed, a live mark is solid and twice the size.** The warning says *this will move you*; the live mark says *it is moving you now*. The same rule as the projections' attacks (`Hazards`, DECISIONS §8.5), so the player learns one grammar. A growing reach ring would take the reach tone of its family; the kick's ring does not grow, and the gust has no ring.
4. **Shape before colour.** The kick's ring, line and cone and the gust's three lanes are read by their shape on the floor, not by their tone. The warning and the live mark differ by their dashes and their size, not by hue alone.
5. **Gentle.** The marks do not blink or pulse. The telegraph's dust is random motes, as on every floor.
6. **A tinted strike never hits.** The sky's marks are drawn by `Hazards` with a tint (`enemies/attacks.ts`, SKY.md §6, m13); they are pictures, and the effect they belong to does the touching. Projections keep the cold and the hazards' strikes unchanged.

## Meaning test

- *Knockback*: the animal throws the dust of its own wood and stone to shove you, and you can see the arc before it lands. It stands for a weight that moves you, not for harm.
- *Wind*: leaves lift from the floor along the line the gust takes; the lines are the wind's own path. The player answers it by standing out of the line or by putting a block in it.

## Open for the owner

- Confirm the two tone choices (wood for the kick, leaf for the wind). They are the first sky tokens drawn for a hindrance; the animals' own tones come with their floors (B1–B5).
- The captures under the greyscale and the three colour-blindness filters, and at 20 blocks in fog, are not in this page yet: the gallery section draws the shapes from above and from eight blocks back.
