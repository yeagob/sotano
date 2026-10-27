# Review: levels L4–L6 (the circles, silence and heaven, the giant tree, the creatures of the roots)

Subject: [LEVELS.md](../architecture/LEVELS.md) §8. Architect and mediator in one pass, engineer building. Date: 2026-10-27.

| # | Point | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | Silence band math: y 1–6 overlapped floor 9's slab; floor 9 had no hole | high | Now | Air y 1–4 under the exit room, roof of rock at 5, bedrock at 0; floor 9's hole reaches y 1; tested |
| 2 | Teleporting to silence before floor 9 exists would crash and fake depth | high | Now | The sky's top opens only once silence is known; teleports never write depth or emit `floorEnter` |
| 3 | Teleports into blocks; pads bouncing back | high | Now | `teleport` searches up for room to stand (clears it as a last resort); pads re-arm when you step off |
| 4 | Falling 90 blocks into heaven | medium | Now | `Player.float`: gravity × 0.15 until the first landing, which never hurts |
| 5 | HUD and fog stale after a teleport | medium | Now | Zones (silence, the trunk, the branches, the leaves, heaven) refresh the label on every change |
| 6 | Neutral creatures would join combat | high | Now | Ambient, outside rosters; `damageActor` and `setFaction` skip neutrals; tested |
| 7 | Tree size and meshing | medium | Now in part | Clamped to the world, 10k–20k cubes (test ≤ 40k), meshed when you first near the surface; phone pass later |
| 8 | Tree determinism | medium | Now | `fork('tree')` in RNG.md, a determinism test, `GEN_VERSION` 10 |
| 9 | Ice and the walk checks; slipping | medium | Now, smaller | Only the surface freezes; grip × 0.12 on slippery ground. Melting and reactions: rejected for now |
| 10 | The volume fade could stick | low | Now | The volume follows the zone every frame, reset on a new run |
| 11 | i18n of level names | low | Now | `level.*`, `toast.silence`, `toast.heaven` in EN and ES |
| — | Walk test of the spiral stair | — | Later | When the tree gains its own rooms |

Outcome: accepted with changes; built.
