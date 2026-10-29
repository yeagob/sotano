Up: [Projections (not built)](README.md)

# Rooted projections

Status: proposal (the owner's direction, Isaac's champions). The rooted spawn roll, the extra health and the extra part are built: see [built/projections](../../built/projections/README.md). The mark, the zone modifier and the cap of one per wave are not.

Any projection may spawn **rooted**: the same pattern, more deeply held. A rooted projection has one modifier from its zone, a visible mark, more health, and a better drop. Never more than one rooted projection per wave on floors 1 to 5.

"The deeper the root, the more light it was holding."

| Root (zone) | Mark (shape first) | Modifier |
|---|---|---|
| **Stone-rooted** (I) | Plates of the host rock on its back | The first 3 hits only crack the plates; ×1.4 hp |
| **Water-rooted** (II) | A dripping hem; it leaves wet cells | Leaves shallow water where it walks (slows you, calms Panic); ×1.3 hp |
| **Ledger-rooted** (III) | Ink ticks crawl over it | When hurt, writes an ✗ mark on the floor under you (3 s, a Field that slows) |
| **Ember-rooted** (IV) | Cracks of captive light | Releases into a small burst (breaks soft blocks, no damage to you if you're 2+ blocks away) |
| **Frost-rooted** (V) | A rime of pale texels | Its touch slows your casting for 2 s (a status, never trembling hands) |

A rooted projection's release shard is bigger, and it drops one more reward roll.

The chance of a rooted projection by floor is in [SCALING](SCALING.md). The zones the roots belong to are in [ZONES](ZONES.md).

## Built part

The spawn roll, the 1.4 times health and the extra part roll are built (`src/content/rooted.ts`). The mark, the zone modifiers and the cap are open: see [GAPS](GAPS.md).
