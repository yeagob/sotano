[Built](../README.md) · [Design](../../README.md)

# Bosses (built)

The bosses are the large patterns behind the small ones: each is built from its floor's own breakable blocks, has three phases, and fights by moving across the room. The game holds fourteen, one per floor from a zone's pool: each floor's boss is drawn from its zone's pool by the run's seed, and a boss already fought in the run is not drawn again. Floors 5 and 9 are keystones with a fixed boss: the Threshold Guardian and the Shadow. Shared rules (the seal, the rise, phases, moves, defeat and the toll) are in [Fight flow](FIGHT-FLOW.md); the arenas that change the room are in [Arenas](ARENAS.md). The code is in `src/content/bosses/`, and the pool and the health curve in `src/content/bosses/index.ts`.

| Document | Contents |
|---|---|
| [FIGHT-FLOW.md](FIGHT-FLOW.md) | The shared fight: seal, rise, health, phases, moves, defeat, toll |
| [ARENAS.md](ARENAS.md) | The twenty arena names: eight change the room, twelve only announce |
| [RESISTANCE.md](RESISTANCE.md) | Floors 1 to 2. Zone I pool |
| [INERTIA.md](INERTIA.md) | Floors 1 to 2. Zone I pool |
| [INSATIABLE.md](INSATIABLE.md) | Floors 1 to 2. Zone I pool |
| [OVERWHELM.md](OVERWHELM.md) | Floors 3 to 4. Zone II pool |
| [HOARD.md](HOARD.md) | Floors 3 to 4. Zone II pool |
| [DOWNPOUR.md](DOWNPOUR.md) | Floors 3 to 4. Zone II pool |
| [THRESHOLD-GUARDIAN.md](THRESHOLD-GUARDIAN.md) | Floor 5. Keystone. Shadow route only |
| [VERDICT.md](VERDICT.md) | Floor 6. Zone III pool |
| [GRUDGE.md](GRUDGE.md) | Floor 6. Zone III pool |
| [OLD-RULE.md](OLD-RULE.md) | Floor 6. Zone III pool |
| [FURNACE.md](FURNACE.md) | Floors 7 to 8. Zone IV pool |
| [IMPOSTOR.md](IMPOSTOR.md) | Floors 7 to 8. Zone IV pool |
| [MANY-FACES.md](MANY-FACES.md) | Floors 7 to 8. Zone IV pool |
| [SHADOW.md](SHADOW.md) | Floor 9. Keystone |

## Pools by zone

A boss is drawn from its floor's zone pool by the floor's seed, and a boss is never repeated in a run. Floors 5 and 9 are keystones with a fixed boss.

| Zone | Floors | Pool (random per seed) | Keystone |
|---|---|---|---|
| I, the Cellar of Habits | 1 to 2 | Resistance, Inertia, The Insatiable | none |
| II, the Flooded Rooms | 3 to 4 | Overwhelm, The Hoard, The Downpour | none |
| III, the Ledger Halls | 5 to 6 | The Verdict, The Grudge, The Old Rule | floor 5: The Threshold Guardian |
| IV, the Furnace | 7 to 8 | The Furnace, The Impostor, The Many Faces | none |
| V, the frozen bottom | 9 | none | floor 9: The Shadow |

A run therefore meets two of the three Cellar bosses on floors 1 and 2, two of the three Flooded bosses on floors 3 and 4, the Threshold Guardian on floor 5, one Ledger boss on floor 6, two of the three Furnace bosses on floors 7 and 8, and the Shadow on floor 9.

Bosses on floors 1 to 5 use the full move system (windups, combos, recoveries). Bosses on floors 6 to 9 use the older emitter and charge behaviours for some moves: each of their documents says where.

Designed but not built (voxel bodies, the light route of the Guardian, the Tree's bosses and the design of the seven later bosses) is in [not-built/bosses](../../not-built/bosses/README.md).
