# Burning status

Up: [not-built elements](README.md) · Status: proposal.

Burning would be a state an actor (the player or a projection) carries after touching fire or lava: a few seconds of damage over time, and a visible state. The build has none. Touching lava or fire hurts at once and sets nothing alight.

## What it would do

- **Sets alight.** Touching fire, or lava, puts the actor on fire for a moment.
- **Hurts over time.** The burning actor takes small, steady damage until it goes out.
- **Goes out.** Water, or leaving the fire, puts it out.
- **Spreads.** Enemies burn too, and a burning actor could light flammable cubes it touches.

## What it reacts with

Fire (sets alight), lava (sets alight, plus its harm), water (puts out), flammable cubes (catch from a burning actor).

## Open questions

1. How long does the burning last, and how much damage a second?
2. Does a burning player spread fire to crates, or only the enemies?
3. Is burning a state of being for the player or only a status of the element (the practice Fire walking would make the player immune)?
4. Does a projection's burning reuse the same status, and which projections can catch fire at all (Burnout is immune in the build)?
