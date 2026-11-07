# The Earth and the Sun in view (built)

Up: [Totality](README.md) · what the player sees below and above while climbing Totality.

Two bodies hang in Totality's sky: the Earth below, small and whole, and the Sun above, the one light the player's light comes from.

## What the player sees

- **The strata.** The sky's colour and fog change with height: pale blue over the lower stratum, cyan and violet, then black with stars in the void, then a gold wash near the Sun.
- **The Earth.** Seen only from the middle of the climb (eye height 380 to 720), a sphere of sea blue, 280 blocks across, hanging 300 blocks below the eye, with a faint pale rim round its limb. It is never fogged and never lit. It is one sea colour today: no land, no cloud.
- **The Sun.** Seen from the solar approach upward (eye height 640 and above): a flat disc, 60 blocks across, in the corona's warm tone, with a corona of three soft steps round it that fades in as the player moves away from it (none at its edge, full from 180 blocks). The Sun stands exactly where its volume is, past the last checkpoint, so the last jump visibly enters the thing the player sees ([THRESHOLD](THRESHOLD.md)).
- **The far view.** Past 150 blocks from the eye, the Earth and the Sun are drawn on their line at 150 blocks, scaled so their size on screen is kept: the camera's far plane never cuts them. Within 150 blocks the Sun is drawn at its true size.
- **Backdrops.** Both are drawn behind the world: a block always draws over them.

## Owner decisions on the look (2026-11-06)

- **The Sun's entrance stays a flat field**: the final checkpoint's view of the Sun is its flat disc, with nothing more drawn at the entrance. Built as it is.
- **The Earth has continents**: decided, not built yet; the Earth is still one sea colour ([not-built Totality](../../../not-built/levels/TOTALITY.md)).

The art rulings and the gate are in [sky art: Totality](../../../../art/sky/totality.md).

Code: `src/sky/render/earth.ts`, `src/sky/render/sun.ts`, `src/sky/render/far.ts` (`placeFar`, `FAR_DRAW` 150), driven by `src/sky/atmosphere.ts` from `src/sky/sky-realm.ts`.
