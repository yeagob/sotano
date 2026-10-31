# The art, as built

Up: [built feel](README.md)

What the art pass of 26 October 2026 made of the build, against the guide. The guide and its ledger are the authority: [ART-GUIDE](../../../art/ART-GUIDE.md) and [DECISIONS](../../../art/DECISIONS.md). This document records what now follows them, and what still waits for its phase ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)).

## Colour

- **Every colour is a palette token.** No colour is written as a literal outside the palette module (`src/content/palette.ts`). A search for colour values in the code finds none outside it. The numeric hex constants in the seed, random-number and effect modules are hash constants, not colours.
- **The ratchet.** The guide says a test fails on any new colour literal; that test is not reviewed in this document.

## The world

- **Materials.** All fifteen materials were repainted from their colour ramps with the shape grammar of the guide: running-bond brick, stone plates, dirt clumps, deepstone strata, crates with a rope band, obsidian facets, bedrock cobble without highlights, and copper nuggets in ore. Rammed earth replaces the packed earth of the first floors.
- **Cracks of light.** A crack has an ink edge and a gold core. Its intensity grows with the stage of the damage.
- **Frames and doors.** The bone frame became the obsidian frame, with one long crack of captive light; the gilded frame became the brass frame. Door leaves are built of boards with iron bands. The boss door has a crack of captive light instead of a skull.
- **Release.** A released projection's host chips fall and gold motes rise. There is no gore.

## The projections

Three projections are rebuilt to their final specs: Doubt (a dark husk with a cold rim), the Lectern (the Inner Critic, a pale ruled page on a post) and Panic (a near-black husk with captive light in its cracks). Each has one family eye: two cold lights in dark sockets. A projection takes no warm light and no true path hue. Its hit flash is a short cold lift.

## The intentions and the practices

- **Intentions** are a bead of light: a white-hot core, a gold shell and an ember halo. Hostile projectiles are red cubes that tumble (the attack red: they hurt), with pale chips on impact. An attack that hurts warns in yellow before it lands and is red when it lands; particles and decoration are pale blue-white, never red or yellow.
- **Practices** are coloured by their first path's glow. Their icon palettes use tokens and never life or cold; light appears only where the concept is light: Satori, Cut Ties with Toxic Relationships, and Remember Breathing.
- **Pickups.** A gold key with an eye (an insight), a bomb drawn as a glowing seed (never a cartoon bomb), and a red heart.

## The hands

The hands are whole texels in the guide's skin tone, with a knitted jumper (rib-knit, with a cuff band) and a thumb. They are the only body the player sees ([PROTAGONIST](../../not-built/story/PROTAGONIST.md)).

## The HUD

- The slate panels: bevelled corners, no radius, the cellar's colour on every panel.
- The toasts sit at the top centre. The minimap is at the top right, with glyph marks and cleared rooms in gold.
- Hearts, the seed and the key are drawn from pixel strings. Path chips carry their glyph: ■ body, ● emotion, ◆ mind, ▲ will.

## The gallery

`?gallery` in the address shows deterministic captures of everything the player sees, instead of the game: the materials, the items, the parts, the enemies, the pickups, the chests, the HUD and the palette. It uses the same palette and painters as the game, with no world and no randomness, so the captures can be compared. Code: `src/debug/gallery.ts`.

## Open questions

- The ledger names three art paths that do not exist in the code. They are recorded in [ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md) as an open question.
- The record of the hands says the jumper comes from the house above. The levels say there is no house on the surface. The owner decides whether the jumper stays.
