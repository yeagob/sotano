# Sky art: Totality, the Earth and the Sun

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-totality` (three frames: the Earth from the void, the Sun over the solar approach, the Sun's entrance from its last checkpoint). Code: `src/sky/render/earth.ts`, `src/sky/render/sun.ts`, the platforms and the Sun's volume in `src/sky/totality/chain.ts`, the strata's colour in `src/sky/atmosphere.ts`. Every colour is a palette token: the sky's stratum tokens in `sky-totality` (`sky.strata.*`), the Earth's in the same part (`sky.earth.*`), the matter's in `sky-blocks`.

## 1. The meaning

The Earth is the world seen from outside: what the player left, small and whole. The platforms are the matter of the climb (leaf, resin, stone, meteor glass, solar glass). The Sun is the one light the player's light comes from, and the last jump of the climb enters it (owner, 2026-11-05; Unity is pending and does nothing yet). The side of each is the world's and the sky's air (the README's shared rulings §1); nothing here is a projection, a cold colour or a harm colour.

## 2. The platforms: the strata's matter

| Stratum | Platform matter (sky material) | Size |
|---|---|---|
| Lower (221–420) | petrified leaf (`skyleaf`), starlight resin (`starresin`), boundary stone (`palestone`) | 3 × 3, then 2 × 2 |
| Mid (420–700) | meteor glass (`meteorglass`), starlight resin | 2 × 2 |
| Upper (700–980) | solar glass (`solarglass`) | 2 × 2, then 1 × 1 near the summit |

A checkpoint (every sixth platform) is 3 × 3 whatever its stratum. Each platform is two layers of its material under the walking cell, unlit like every block. Shown in the captures of `?gallery=sky-blocks` (the materials) and, in place, in the Totality frame (the last checkpoint and the Sun's volume).

## 3. The entrance: no gate

- The plan places no wall and no floor of sun seal. The sun seal (`tier` and `hp` infinite, the README's rule §6) stays a material for Unity; nothing in the climb is sealed.
- The Sun's volume is a sphere 30 blocks across, centred at the last checkpoint's height, its near surface 4 blocks past the checkpoint's far edge: the last jump reaches it. Entering it is not drawn: it calls the entrance (`threshold.ts`), which activates Unity.
- A low hum comes from the Sun while the player is near its surface (`totality.hum`). No refusal and no push exist.

## 4. The Earth

- A sphere of `sky.earth.sea` (`#2F6F8F`), 140 blocks across, hanging 300 below the eye, seen only from the middle of Totality (eye height 380–720).
- A faint rim of `sky.earth.rim` (`#9FD8F2`) round its limb, at 35 % opacity, the thin air of the world's edge.
- Never fogged: the Earth is a body in the air, not a block; it is not lit (one shading model).
- ΔE from `light.gold`, `life.heart`, `attack.red.base` and `attack.warn.base` holds (enforced by `tests/sky-materials.test.ts`).

## 5. The Sun

- A disc of `sky.strata.corona` (`#DCC497`), 30 blocks across, and a corona of the same token at 22 % opacity, 90 blocks across.
- Stands 260 above the eye, shown from the solar approach upward (eye height 640 and above).
- Never a `light.*` token (README §7): the Sun's warmth is the stated, provisional exception to pillar 2; it washes the sky only and never lights a block.
- The corona keeps ΔE 36.9 from `light.gold` (README §4), so a gold mark still reads near it.

## 6. Open, for the art pass and the owner

- The Earth is flat: one sea colour and a rim, no land or cloud. The owner decides whether the Earth shows continents.
- The strata's decoration (drifting leaf clusters, meteor fragments, embers) is not yet placed: the plan holds the platforms and the Sun's volume only. The art pass adds it with the headroom rule (no fragment within 15 blocks above a takeoff or arc).
- The checkpoint's soft beacon is not drawn yet.
- Captures: the three frames of `?gallery=sky-totality` are the gate for this page; they are attached when the browser run is done (see the change's report).
- Nothing here is ruled by the owner yet. The Spanish of the place names is a translation for the owner to review. The Sun's volume is not drawn in the game (the disc of the view stands above the eye, not at the volume, `sun.ts`): the owner rules whether the entrance shows anything.
