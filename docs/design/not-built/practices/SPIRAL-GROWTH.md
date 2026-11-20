# Spiral Growth

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/spiralgrowth.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/body/`.

| | |
|---|---|
| Path | Body |
| Quality | 4 of 4 |
| Found in | boss rooms, vault rooms |
| Inspired by | The spiral of growth: the turning spirals of shells, leaves and seed heads (phyllotaxis) |
| Code | `src/content/items/spiralgrowth.ts`; the helix in `src/combat/intents.ts` (`strandOrbit`, `Intents.update`); the synergy in `src/content/synergies.ts` |

## What it means

Growth rarely goes in a straight line. It turns around its own centre and moves on.

## What it does

- **Fire rate ×2**, and the hands take turns (as Bilateral Stimulation does).
- **Each intention becomes a helix**: three strands 120 degrees apart, on a circle of 0.3 blocks around the flight line, turning five times a second. The radius eases in over the first 0.08 s, so a strand never starts inside a wall.
- **Damage**: strand 0 deals the full damage and mining; strands 1 and 2 deal 40% each.
- **Every later shot spirals**; every practice applies to each strand's shot.

Alone it works on its own. Under Triangulation each direction is a helix of its own.

Positive outcome: the rate doubles, and a helix hits from three sides at once.

## Stats and events

- `fireRate`: mul 2
- `twinCast`: add 1 (the hands take turns)
- `spiral`: add 1 (a flag, held at 0 or 1)
- Strands live 3 seconds, as in Rule of Three.
- Hooks: none.

## Synergies and states of being

- **Double Helix** (`doublehelix`, with [Bilateral Stimulation](BILATERAL-STIMULATION.md)): Bilateral Stimulation and Spiral Growth each double the fire rate; the synergy halves the pair back to ×2, so the total is 2.7 × 2 = 5.4 shots a second. It also multiplies damage by 1.25. The synergy's text is "Two spirals in one rhythm: the pair fires at twice the base rate, not four times, and each strike hits 1.25 times harder."
- With [Rule of Three](RULE-OF-THREE.md) the triangle turns.

## Open questions

- None recorded beyond the ones in Rule of Three (how the shares combine).
