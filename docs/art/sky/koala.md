# Sky art: The koala's floor and beings

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-koala`.

## The floor (sky floor 2)

The floor is built of shapes in `src/sky/floors/koala.ts` (F2): a moss disc of radius 22 on the hall's ground, open at the centre down to the moss; four trunks of living wood at 14 from the centre, each with a tunnel to its limb and a square of knots on its outer face up to row 33; four thick limbs on row 28 to a 3 × 3 Fork on row 29 (walked at 30); and a square spiral of thirteen branches, every third one thick and fixed, each two rows higher than the last.

Nothing ruled yet: the floor has no captures, no greyscale or colour-blind check, and no meaning test, so its art gate is open.

## The koala deity and its minions (B2)

Built in `src/sky/creatures/deities/koala.ts` and `src/sky/creatures/minions/koala.ts`, from the tokens of `src/content/palette/sky-koala.ts`. Captures: `?gallery=sky-koala` (front, ¾, side, back; the grip loosening at 0, 10, 20 and 30 hits; the minion turning; both at distance).

- **Side and meaning.** World side: a plush guardian, never a projection (sky README §2): no cold, no family eye, no captive light. It stands for clinging (KOALA.md §1, `concept:` none yet in CONCEPTS.md; the owner to name one). A positive intention loosens its grip: that is the sign of progress.
- **Shape.** The deity is about 3.4 blocks tall with its branch: a 16-texel plush body, a 35-texel head (2.2 times the body), round ears with cream insides, a large dark nose, sleepy lids (inlays, never coplanar boxes), its arms reaching back round an upright branch of sky wood. The minion is about one block: a 7-texel body under a 15-texel head.
- **Colour.** `plush.koala.*`: warm felt greys (outline, dark, base, hi), a cream chest and inner ear, a dark nose, lids and claws. Every token is ΔE ≥ 20 from `light.gold`, the warning yellow and the reds, and ≥ 15 from the cold (`tests/sky-koala.test.ts`), so a gold mark reads on the fur.
- **Progress (B4).** `koalaProgress`: the left arm lets go over the first third of the hits, the right over the second, then the lids lift. The gold marks themselves are `HitMarks` (shared).
- **Telegraph marks.** Leaf drop and Joey ride draw small rings in the leaf darks (`LOB_PAINT`); the haze's circle is in the leaf lights (`HAZE_PAINT`); the bellow's ring is the wood's darks (`BELLOW_PAINT`); Hold fast's claws use the knockback's dust tones. None is yellow: they drain spirit or hold, they never take health (owner to rule whether a drain's warning should be yellow).
- **Not done.** The view does not pose the telegraphs yet (the `TelegraphSpec` names `armR` tap, `body` shake, `chest` rub and swell, `nose` chew and inhale, `armL` open, `head` joey and sway), nor the Asleep curl; the koala's sounds (`koala.*` cues) are silent until the sound part (`src/audio/sky/koala.ts`) is written.

### Ledger entry (pending owner review)

| Ruling | Value | Status |
|---|---|---|
| Koala plush ramp | `plush.koala.outline` #3B3733, `dark` #6D6760, `base` #958E86, `hi` #B8B1A7, `cream` #D9CFBE, `nose` #2C2825, `lid` #4A4540, `claw` #514840 | pending owner review |
| Deity proportions | body 16 texels, head 35 (2.2 ×), about 3.4 high with the branch | pending owner review |
| Minion proportions | body 7 texels, head 15, about 1.1 high | pending owner review |
| Telegraph mark tones | leaf darks (lobs), leaf lights (haze), wood darks (bellow), dust (claws) | pending owner review |

The art gate is not passed: the owner signs it off. No greyscale, colour-blind or distance capture has been reviewed yet.
