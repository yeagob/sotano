Up: [Projections (built)](README.md)

# Parts: what a projection leaves behind

Status: built (2026-10-28). The names of the parts are design, not built: see [PART-NAMES](../../not-built/projections/PART-NAMES.md).

A released projection may leave **parts** of itself: its **flesh**, its **heart**, its **mind** or its **essence**. A part is a collectible thing: it is carried in the hand, like a block, and it is not in the inventory.

## The chances

Flesh 30 %, mind 12 %, heart 5 %, essence 2 % per release. A rooted projection rolls once more ([ROOTED-VARIANTS](../../not-built/projections/ROOTED-VARIANTS.md)). Converted allies leave nothing: they are not released, they are integrated ([polarity](../intentions/POLARITY.md)).

The 152 parts of the built projection files are in `src/content/parts.ts`. They are rolled once per release on the projection's own random path ([RNG](../../../architecture/RNG.md)), and they drop as pickups.

## In the hand

Collecting a part lifts it into the hand, with the hold-up and no burst. A part in the hand can be given as the way down's toll on floors 0 to 4, like a block ([TOLL](../levels/floors/TOLL.md)). It is given away and does not return. No agreement, gift or shop asks for parts yet ([AGREEMENTS](../../not-built/presences/AGREEMENTS.md)).

## Icons

Twelve icons, those of the first three projections, are by the art agent and pass the gate in `src/content/part-icons.ts`. The other parts use a generated fallback (`bestiaryPartIcon`: the kind's shape, the source's colour) that has not passed the art gate.
