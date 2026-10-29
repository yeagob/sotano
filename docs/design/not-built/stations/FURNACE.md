# Furnace

Status: proposal. Designed in [ELEMENTS](../elements/FURNACE.md); this document sets its place among the stations. Index: [stations](README.md).

A furnace turns what the player breaks into something better: fuel and an input go into its mouth, and a refined cube comes out.

## Design

- **What it does:** fuel plus input gives a refined cube: stone to brick, sand to glass, ore to iron, crate to coal.
- **Verb:** feed it by throwing, kicking or placing a cube into its mouth. It answers with a cube out and a glow that shows it is working.
- **Meaning:** deliberate practice and refining. The player decides what the rubble becomes.
- **Vertical use:** refined blocks are tougher steps for a climb, and glass lets the player see the room below (see [VERTICALITY](VERTICALITY.md)).
- **Tier:** T2, a block entity with slots and a timer.
- **Overlap:** the fuel rules, outputs and burning mechanics are in [FURNACE](../elements/FURNACE.md). This document adds only the station's meaning and its links to other stations; the two must not disagree on outputs.
- **Pyre:** the burning barrel made a place is [PYRE](PYRE.md).

## Open questions

1. Is the furnace's input polarity-free, or does a positive intention speed it up?
2. Does crate-to-coal belong here, or only in the elements document?
3. Can a furnace go out, and what does a dead furnace look like (the cold-store room uses one)?
