[Movement](README.md)

# Swimmer

Status: **proposal** (design text, bestiary section 3.1).

A swimmer lives in liquid and moves only through liquid cells. It surfaces to attack and sinks again. Out of the liquid it is slow and small.

## What the design asks

- **Liquid only.** It moves through water (and mud, for the Sulk) on liquid cells only.
- **Surfacing.** It rises as a wave to cross the room (Undertow), or erupts by the player (Sulk).
- **Out of liquid.** Slow and small.

## What the build has

Undertow walks, and sends a wave across the room. Sulk waits under its marsh and erupts when the player comes within three blocks. Neither swims.

## Open questions

- **Navigation.** Liquid cells need their own flow field, separate from the room's walkers.
- **Elements.** The swimmer needs the elements rule that water and mud are dwelling cells (ELEMENTS).
- **The Grudge.** The Grudge's sulks depend on swimmers (see [the Grudge](../../bosses/GRUDGE.md)).
