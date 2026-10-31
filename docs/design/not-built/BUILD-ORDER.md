Up: [Not built](README.md) · [the design document](../README.md)

# Build order, systems and status snapshot

Status: proposal. This document holds three things from the bestiary: the systems the design needs, the order in which the owner's plan builds them, and a snapshot of what the game held against that plan on 2026-10-28. The snapshot is history: each document's own status line is the current truth.

The systems table describes how the design maps onto the build; the design itself is in the documents it names. Each key system goes through the three-party review ([`sotano-docs` §4](../../../.claude/skills/sotano-docs/SKILL.md)) before it is built.

The section numbers (§) in the tables below are the numbers of the former bestiary, which is now this folder's tree; the open questions it listed are kept in their topic documents: boss health in [built/bosses/FIGHT-FLOW](../built/bosses/FIGHT-FLOW.md), the living palette and the art gate in [ART-AND-SAFETY-NOTES](feel/ART-AND-SAFETY-NOTES.md), and the names marked as proposals in [the cards](projections/cards/README.md).

## Systems the design needs

These are the systems this design needs. Each key one goes through the **three-party review** ([`sotano-docs` §4](../../../.claude/skills/sotano-docs/SKILL.md)) before it is built.

| System | What it needs | Today |
|---|---|---|
| **Spatial audio** | A 3D sound layer: `PannerNode` per voice, listener on the camera, voice limits, occlusion later | Built for omens, breaches and door slams (`spatial` in `src/audio/sfx.ts`); occlusion and voice limits later |
| **Seal** | `roomSeal` root event; door slam animation and sound; door waits for the player's box | Doors seal with a spatial slam and dust (built); the faster door animation and `roomSeal` event are still to do |
| **Spawn points** | Template legend (`s`/`w`/`c`), generator fallback, validator for the fairness rules (§2.2) | Floor points built (`pickSpawnCell`, door and player clearance); wall, ceiling and liquid points and the template legend to do |
| **Omens** | An omen entity (point, kind, timer, particles, sound) before every spawn | Built for floor spawns (1.0 s gather, 0.2 s breach); the art gate on the omen motes is pending |
| **Room director** | Waves as data per room (triggers §2.4), seeded | Waves of at most 3, the next opens at one left, with a breath and a swell (built); the other triggers to do |
| **Movement classes** | Leaper, charger, flyer, swimmer, burrower, mounted, phaser controllers | Walker (flow field), ranged, burst |
| **Attack families** | One telegraph component per family (floor lines, landing rings, ridges) | Touch, lob, burst |
| **Rooted variants** | A modifier layer on `EnemyDef` at spawn (`enemySpawn` is already mutable) | — |
| **Zones and pools** | `LevelDef` gains `zone`; rosters and boss pools by zone; `floor<k>:boss` stream | Roster by `minFloor` |
| **Voxel bosses** | Bosses built of real blocks with a core vessel; phases; release into architecture | — |
| **Creatures** | `neutral` actors with simple behaviours, hide/return on seal/clear | Faction `neutral` exists (ACTORS §4) |
| **Intention polarity** | A `polarity` on intentions and a toggle control; warmth meter on projections; `factionChange` in both directions; ally harm and heal rules; a room clear that counts converted projections | Built (§1.1 status); creatures and presences not |
| **Presences and dialogue** | Immortal actors, sanctuary rings, a dialogue card, localised lines, a profile save | — |
| **Codex** | Release counters in the profile; a codex tab in the inventory | — |

---

## Build order

| Step | What | Why first |
|---|---|---|
| E1 | **Intention polarity (the control, positive conversion, negative harm), spatial audio, the seal, omens, spawn points and waves** *(seal, spatial sound, floor omens, waves and polarity built)* | The owner's core ask; it changes how every fight starts and reads |
| E2 | Attack families and movement classes (Line, Leap, Sweep; charger, leaper, mounted) with Zone I's projections (Autopilot, Craving, Impulse, Avoidance) and Procrastination, Distraction | Cross-room attacks; the first zone complete |
| E3 | Lineage forms II, rooted variants, Zone II projections; Creatures of floor 0 and Zone I–II | Evolution with depth becomes visible |
| E4 | Voxel bosses: Resistance, Inertia, The Insatiable; then Overwhelm, The Hoard, The Downpour; the zone pools | Random bosses by zone |
| E5 | Presences: the Gardener (floor 0), the Wanderer, the Listener, the Cartographer; the dialogue card; the codex; the Compost (§8.8) | The non-hostile layer |
| E6 | Zones III–V, the Threshold Guardian, the Shadow, the remaining Presences | The deep floors |
| E7 | The Tree's patterns and bosses | With the Tree milestone (L5) |

---

## Status snapshot (2026-10-28)

What the game holds against this plan. "Simpler" is what was built with less than the design above.

| Area | Built | Simpler than designed | Not built |
|---|---|---|---|
| Seal, omens, waves (§2) | The seal and slam, omens on seeded floor cells, waves of at most three, the clear | Spawn points are floor cells only: no walls, ceilings or liquids | The room director beyond the basic waves (§2.4), room triggers |
| Attacks and movement (§3) | Shapes: line, ring, field, pull, sweep. Movement: walker, leaper, charger, flyer, and through-block movement (`ghost`) for phasers and burrowers | Undertow walks; it does not swim. Burrowers are the `ghost` movement, not a voxel path through the rock | Swimmer and mounted classes (§3.1) |
| Projections (§5) | 40 entries in `content/enemies/` (38 files), from Doubt, the Inner Critic and Panic to What-if | Scarcity: steals the loose keys, bombs and hearts in its room and carries them; released, it gives them back plus one (it does not burrow to hide them yet). Isolation: raises one wall of ice across its room (two blocks high, on the middle column, never the cell you stand in) that melts when it is released. Hall of Mirrors: an intention that meets a mirror bounces along one axis (the mirror is hit, not broken, and it stays calm for a quarter second), not between three mirrors. Shortcut: no passage. Avoidance: hides out of sight while shut (no host block yet). Perfectionism: a shell of six plates (four health each) over a 28-health core, built as a rule of damage (`enemies/shell.ts`); the plates are not real voxels yet and do not come back with gold seams. Procrastination: now splits when hit, two splits deep (its children rise at once). Rooted: the spawn roll, the health and the extra part roll are built (`content/rooted.ts`) | The rooted mark (§4.2) and the one-per-wave cap |
| Creatures (§7) | Thirteen: Wonder, Rootling and Mossling (floor 0), Chirper and Delver (1–3), Bubbler and Ferryback (3–4), Drifter and Inkmite (5–6), Cinderwalker (7–8), Huddler (9), Leafling and Star-mite (Tree floors 1–5). The Mossling, Huddler, Leafling and Star-mite answer only positive intentions | None recorded | The Boundary (proposal, §7: the owner has not decided it yet) |
| Bosses (§6) | Fourteen, one per floor from its zone's pool: phases at 2/3 and 1/3, arena changes, the way down | The Threshold Guardian's two routes open the same hole (§6.5) | The separate hole of the route of light |
| Polarity (§1.1) | Projections, allies and creatures. Positive intentions heal creatures; negative ones send them into the blocks | None recorded | Presences; ally gifts at full health (§8.6); warmth decay |
| Presences and messengers (§8) | The Listener on each Tree floor (1–5). The Gardener is defined but not placed: the tutorial floor and the start rooms never hold a presence (owner, 2026-10-29), so it waits for an agreement that asks for a real-world action. They are immortal, answer only positive intentions, and talk by contact: a card with two lines (the Listener heals a quarter heart once). A negative intention within two blocks silences them (one patient line, then nothing until a positive one passes within eight blocks) | Nothing | All the rest of §8.3: the Cartographer, the Boatman, the Mender, the Witness, the Star-reader, the Wanderer, the Trickster, the Echo and the Elder and the Child; the dialogue choices; the codex (§9); the Compost (§8.8); requests (§8.5); agreements (§8.6) and gifts (§8.7); the sanctuary ring |
| Art and sound (§10) | Spatial sound for omens, slams and telegraphs. The new beings (Boundary, Gardener, Listener, Leafling, Star-mite, Perfectionism's shell) were rebuilt on whole texels and checked by a dedicated art agent (2026-10-29), but their gallery captures in colour, greyscale and colour-blindness, and the owner's review, are still pending: the art gate is not passed yet | The art gate for the new beings: no separate reviewer and no gallery captures yet. The living palette (`living.*` in `content/palette.ts`) is still a proposal |
| Review | Three-party review for polarity ([reviews/polarity.md](../../reviews/polarity.md)) | None recorded | Three-party review for bosses and creatures |
| Tests and sandbox | 257 tests pass. The `bestiary-smoke` scenario runs every projection in one room, and its report is saved ([SANDBOX.md](../../architecture/SANDBOX.md)) | None recorded | None recorded |

**Open for the owner**

1. **Boss health.** §6.1 gives about 140 on floor 1 and 1 000 on floor 9, and ×1.35 per floor. Those two numbers contradict each other: ×1.35 for eight floors from 140 reaches about 1 540. The build follows the two ends: a curve of about ×1.28 a floor (`bossHp` in `content/bosses/index.ts`). Which one stands?
2. **The living palette** (§10) and the art gate for creatures and projections built in this iteration.
3. **Names marked *(proposal)*** (§13).

---
