[Encounters](README.md)

# Omen signals

Status: **proposal** (design text, bestiary section 2.3). The omen itself, its motes, its hum and its breach are built; these are the signals around it.

An omen is heard before it is seen, and it must be found when it is out of view. The signals that help the ear and the eye are listed here.

## What the design asks

- **Edge marker.** An omen out of view shows a small cold arc at the screen edge, in its direction, with its spawn kind's glyph: a triangle up for a floor, down for a ceiling, a square for a wall, a wave for a liquid. It fades once the omen is in view. The marker sits over the world, not on the hearts.
- **Elevation in pitch.** Ceiling omens descend in pitch, floor omens rise, wall omens stay level, to help where the head-related sound is weak.
- **Transient first.** A sound meant to be found starts with a click, a crack or a knock, before its tone. The ear finds onsets, not hums.
- **Occlusion.** A sound behind two or more solid blocks is low-passed, never muted.
- **Ducking and voices.** Omens duck the room's ambience by 3 dB while open, and at most four omen voices sound at once.

## What the build has

Positioned sounds for omens, slams, breaches and telegraphs are built. The rest of this list is not.

## Open questions

- **Marker shape.** The glyphs are the spawn kinds'. Their art needs the ledger ruling (the cold ramp is the projections' side only).
- **Occlusion cost.** Occlusion needs a line test through the blocks for every sound. Check the cost first.
- **Accessibility.** The edge marker is on by default. Confirm it with the owner, since it is a visual that reads as a warning.
