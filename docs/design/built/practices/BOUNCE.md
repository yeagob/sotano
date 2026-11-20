# The Bounce family

Up: [all practices](README.md) · [built design](../README.md)

Three practices work on the same moment: an intention rebounds off a block. Bounce Back gives two more rebounds, at 75% speed. Dialectic splits the intention at each rebound. Reframing aims it at a projection after each rebound. The family shares one event, `intentBounce`, and the practices are documented one per folder by path:

| Practice | Path | Quality | Found in | Document |
|---|---|---|---|---|
| Bounce Back | Will | 2 | treasure rooms | [will/BOUNCE-BACK.md](will/BOUNCE-BACK.md) |
| Dialectic | Mind | 3 | treasure rooms | [mind/DIALECTIC.md](mind/DIALECTIC.md) |
| Reframing | Emotion | 3 | treasure rooms | [emotion/REFRAMING.md](emotion/REFRAMING.md) |

## The event: `intentBounce`

Emitted from the bounce code of the intentions (`src/combat/intents.ts`) every time an intention rebounds off a block, through the `bounced` callback that the game wires to the bus. The payload carries the bounce point, the face normal, the reflected velocity, the intention's spec and its rebound number (1 for its first rebound, then 2 and so on). Hooks may change the velocity and the spec. They may also add intentions to `launch`, which the core adds after the frame's walk over the intentions, so a launch from a hook never changes the list while it is walked. The event cannot be cancelled.

The core change is minimal: one event, one callback, one count per intention, and the launch queue. No new `ItemApi` verb is needed. Contract: [ITEMS.md](../../../architecture/ITEMS.md) §3.

## Compatibility

- **Bounces add up.** Bounce Back (+2), Dialectic (+1) and Reframing (+1) add to the spec's bounce count. With all three, one shot can rebound four times.
- **Order at a rebound.** Reframing runs first (priority 50), then Dialectic splits (priority 200). The two halves therefore leave the aimed heading turned 40° either side of the face normal, so both halves fan out from the aim, and each half carries the aimed damage at half. Bounce Back runs on the fire, before both.
- **Chain cap.** Dialectic's lineage marks cap the splits at two per lineage: one shot makes at most four intentions and three splits. Reframing adds no intentions. Bounce Back adds none either.
- **Volley and weapons.** A volley's extra intentions are copies of the shot's spec before any rebound, so each of them follows the same rules on its own. Weapons that replace the intention (Remember Breathing, Occam's Razor) do not emit `intentBounce`: a beam or a cut is not an intention in flight, so none of the three practices applies to them.

## Tests

- `tests/bounce-practices.test.ts`: the event (count, normal, bounce index, a hook that changes the velocity, no event without bounces); launches from a hook during the walk (joins after it, firing from inside a hook); Dialectic (the ±40° headings, the degenerate axes, the halves at half damage and mining, the lineage marks, the cap of four in a closed room with Bounce Back); Reframing (the aim within 8 blocks keeps the speed, nothing in reach only adds damage, the damage stacks per rebound); and the three together (never more than four per shot, settles).
- The synergy matrix fires `intentBounce` with a sample payload (`tests/synergy-matrix.test.ts`) and the contract lists the event.
- Sandbox: the scenarios `bounce-*` in `src/sandbox/scenarios/` (see the reports in `src/sandbox/reports/`).

## Open for the owner

Decisions the implementer took on the owner's behalf, to review:

1. **Reframing's damage stacks.** "Multiply the intention's damage by 1.25 for this bounce" is read as ×1.25 at every rebound, cumulative (×1.5625 after two). The effect line says "after each bounce". If the owner means a single bonus per intention, the change is one line.
2. **Order of Reframing and Dialectic.** Reframing aims first, so both halves fan out from the aimed heading. The other order would aim a half on its own, and a twin would then be aimed too.
3. **Dialectic per volley.** A volley of two (Dual Process) splits each intention of the volley on its own, so the cap of four is per intention of the volley: up to eight in one shot.
4. **The degenerate case.** "Within 10° of the normal" is measured as the angle of the reflected heading to the face normal; the turn is then around world up (world X on a ceiling or floor). Nothing else of the rule changes.
5. **Reframing's range** is measured from the bounce point to the projection's centre, strictly within 8 blocks.
6. **Recipes (rule 14).** The crafting table for practices is not built in the code yet (`src/content/recipes.ts` holds the alembic's potions only), so no recipe is defined for these two practices.
7. **Seed bump.** Two treasure practices change the reserved practices of every seed, so `GEN_VERSION` goes to 38 with the golden hash and the easy-layout baseline re-recorded (the same procedure as earlier practices). Concurrent practice packages will each touch the same numbers: the orchestrator should merge them into one bump.
8. **Names and texts.** The Spanish names *Dialéctica* and *Reencuadre*, and the teaching lines (`teach.dialectic.*`, `teach.reframing.*`), are proposals for the owner's review.
9. **Icons.** Drawn to the 12 × 12 rule with the path palettes. They have not been reviewed in the browser or against the art gate in this change.
