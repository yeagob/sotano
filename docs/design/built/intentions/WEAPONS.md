# Weapons: what replaces the intention

Some practices, and one combination of two, change what the cast action does. This document says how one weapon is chosen and what it does to the shot; each weapon has its own document.

Part of [intentions](README.md).

## What the player sees and feels

- Most of the time, cast fires intentions. A weapon changes that: you hold cast and something else happens. The intentions stop, unless the weapon is one that keeps them (see below).
- Only one weapon is active at a time. A weapon from a synergy outranks a weapon from a single practice, so the combination always wins. Losing the practice that gave the weapon gives the shot back at once, with nothing to clean up.
- Charged weapons charge while you hold cast. The hands glow white-gold when the charge is full. Releasing before full does nothing; releasing when full fires.
- The blade is the exception: its swings come out beside the intentions, and the intentions keep flying.
- Items that only act on the shot do nothing to the beam or the great cut. Two synergies compensate for the beam: Chorus (with Dual Process) and Choir (with Triangulation) raise its damage and mining.

The weapons that exist are the [blade](BLADE.md), the [beam](BEAM.md) and the [great cut](GREAT-CUT.md). The blade and the beam come from the boss pool at quality four; the great cut is the synergy of those two.

## The rule behind it

The owner decided that weapons replace the shot, as in the game this one is taken from, and that the combination of two weapons becomes a weapon of its own ([DESIGN.md, section "Weapons that replace the intention"](../README.md)). The owner also decided that the blade keeps the shot beside it, so the intention is not lost when the blade arrives. The full contract for weapons and for the items that touch them is in [the weapons architecture](../../../architecture/WEAPONS.md).

Code: `src/combat/weapons.ts` (the weapon classes and their charge), `src/game/events.ts` (the weapon identifiers, and the list of weapons that keep the shot, lines 14-17), `src/content/items/kiai.ts` (the beam practice), `src/content/items/occamsrazor.ts` (the blade practice), `src/content/synergies.ts` (the great cut synergy, lines 10-19).

## Open questions

1. **Shot changes on the beam and the great cut.** The architecture document leaves to the balance milestone whether pierce and phase should map onto the beam and the great cut ([WEAPONS architecture, section 2](../../../architecture/WEAPONS.md)). Should they?
