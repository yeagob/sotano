# Sky art: The horse's floor and beings

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-horse` (the plan from above and a section through the mast, from the seed of the generator).

Nothing ruled yet.

## Floor 5: the meadow (F5)

The floor's geometry is in `src/sky/floors/horse.ts` (B6 of [HORSE](../../design/not-built/sky/guardians/HORSE.md)). Its materials, as drawn so far (the look is for the owner to rule):

| Part | Material | Why |
|---|---|---|
| The meadow (radius 30) | `moss` | The ground the horse and the player run on |
| The six paddocks (5 × 5, heights 0 to 6) | `palestone` bodies, `fencewood` rails | Raised, fenced; the rails are cut where a run or the spoke enters |
| The hitching posts (every fourth run segment) | `fencewood` | A boundary kept with care, on the fixed segments only |
| Fixed run segments (ids 3, 7, 11, 15) and the spoke | `skywood` | Branches: the safe places to stand still |
| Fading run segments | `mist` | The swap material of fading platforms (the grey of the fade is an effect) |
| The mast (one-block ledges, ground to the way up) | `skywood` | The straight-up route; its rungs never fade |

The way up sits over the top rung of the mast (the membrane is heartwood until the horse is won).

## The beings (B5): the horse and its herd

**Status: pending owner review.** The art gate is not passed until the owner signs it off. Captures: `?gallery=sky-horse` (each pose on the meadow's moss and on the paddocks' pale stone; add `&filter=grey`, `&filter=protanopia`, `&filter=deuteranopia`, `&filter=tritanopia` for the gate's filters). Not yet checked in the browser by B5.

**Side and meaning.** Sky creature: plush, never a projection (README §2). The horse mirrors bolting, the reflex of running from a feeling the moment it appears (HORSE §1); the floor's verb is standing still. What the intention does: a positive one leaves a gold mark and gentles, a negative one only puffs.

**The deity** (`src/sky/creatures/deities/horse.ts`, `HORSE_DEITY_PARTS`, 24 parts, the cap): a small round felt body (0.875 × 0.75 × 1.125) on four short legs that swing from hip pivots, under a giant head 1.75 wide (2 times the body's width) with a jutting muzzle, wide felt eyes with one pale shine each, two ears, a dark mane along the crown and a forelock; a tail on its own pivot. About 3.1 blocks to the ears; the hit box is 0.9 × 3.1.

**A horse of the herd** (`minions/horse.ts`, `HORSE_MINION_PARTS`, 13 parts): the same plush shape at foal size (about 1.3 to the ears) in a darker bay, so a minion never reads as the deity.

**Tokens** (palette part `sky-horse`, all `plush.horse.*`):

| Token | Hex | Use |
|---|---|---|
| `coat.base`, `coat.dark`, `coat.hi` | `#D0AE8C`, `#A0846C`, `#E6D4BC` | The deity's dun coat, its legs, its muzzle. Warmer than the paddocks' pale stone (ΔE 11) so the body does not melt into the stone it stands on; the dark mane and legs carry the contrast |
| `mane` | `#5A4A40` | Mane, forelock and tail, the deity and the herd |
| `eye`, `shine` | `#2B2224`, `#EAE2D6` | Felt eyes and nostrils (inlays), the eye's shine |
| `herd.base`, `herd.dark`, `herd.hi` | `#8C7462`, `#6C5A4D`, `#BCA68E` | The herd's bay coat, legs, muzzle |

Measured (enforced in `tests/sky-horse.test.ts`): every token ΔE ≥ 20 from `life.heart`, `attack.red.*`, `attack.warn.base` and `light.gold` (the nearest: `coat.base` 41 from the gold), and ≥ 15 from the cold ramp (the nearest: `eye` 15.7 from `cold.deep`).

**Telegraphs** (three channels, DECISIONS §8.5, at the floor's 0.9 s; 1.1 s for a drain, 1.4 s for the capture): a named part to an extreme pose and a `horse.*` cue. Rear and stamp: the front legs up, the body pitched back. Tail gust: the tail swishes. Leap and land, and the startle: a crouch (body squashed 10 %), with a landing ring drawn on the far paddock. Whinny wave and Sending: head high, ears pricked. Dust roll: kneeling, head down. Snort: head up, nostrils flared, a pale cone of three rays (the wind's leaf tones). Mane shake: the mane quivers (2.5 Hz). Gallop line: head low, ears forward, a dashed line in the dust tones. Herd panic: trembling (2.5 Hz), the grass wave as a ring that rolls across the floor. Snaking: head low, ears pinned, the head swinging, the circle drawn as it runs. A herd kick: the hind legs gathered back and the tail lifted. Poses step at 12 fps; no pulse is faster than 2.5 Hz; nothing is red.

**Progress (B4, target):** the gold marks gather; the wide eyes soften (their height eases to 0.65) and the ears turn forward as hits / target rises.

**Calm feedback** (cues provisional, for the art pass): while the player stands still near the horse, motes settle round their feet every 0.4 s and the ears turn to them; when they move, a puff of dust lifts. In Herd panic's telegraph the motes thicken and `horse.settle` plays; a calm end plays `horse.chime`.

Open for the owner: the coat colours, the eye's shine, the head-to-body ratio (2.0 here, the guide asks about 2.2), the softening-eyes sign, and the calm cues. The sounds of the `horse.*` cues are not synthesised yet (the sound part `src/audio/sky/horse.ts` is still silent).
