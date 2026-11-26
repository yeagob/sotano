Up: [Projections (built)](README.md)

# Colour tiers: Black, Yellow and Red

Built (issue #338, a hotfix). Any projection, and any boss except the Shadow, can rise in one of three colour tiers: **Black** is the being as its own document gives it, **Yellow** is the same pattern held harder (tougher, harder hitting, faster, climbing higher), and **Red** is its elite form, with the highest numbers. The tier is a layer over the being, never a new one: it keeps its pattern, its moves and its meaning. Code: [src/enemies/tiers.ts](../../../../src/enemies/tiers.ts) (rules and look), `Game.spawnEnemy` (the roll), [src/entities/enemies.ts](../../../../src/entities/enemies.ts) (the body colour, the climb and the damage in play); tests: `tests/tiers.test.ts`. How to define and test a tier: the `sotano-projections` skill.

## How the player meets it

- **The body tells the tier.** A Yellow projection's body is a loud, bright yellow; a Red one's body is red; a Black one keeps its own dark or pale husk. Its eye, its tells and its sockets keep their colours, so it is still the same pattern. Bosses take the same body colours.
- **A shape tells it too**, for colour-blind players: a Yellow wears two dark thorns on its head with a gap between them, like horns; a Red wears a dark crown of three, the middle one the tallest. A Black wears none. See the art ledger, [DECISIONS §14.6](../../../art/DECISIONS.md).
- **An ally is the inversion of itself.** A projection turned to your side by good intentions, or brought back by the Mender, is drawn with every one of its colours inverted, whatever its tier: a Black's dark husk turns pale, a Yellow's loud yellow turns a deep blue, a Red's red turns cyan, and its eye and tells invert too. No glow is laid over it (the mended ally's gold motes still rise). It keeps its shape, its thorns and its tier's numbers: a converted Red is a strong ally. If it relapses, its own colours come back at once.
- A tiered projection takes more intentions to release, hurts more when it touches you and with every strike and shot, walks faster, and steps up ledges a Black one must walk round: a Yellow Doubt follows you up a two-block step, a Red one up three. A leaping one arcs higher and still lands where it aimed.
- A tiered boss has more health, and nothing else changes: its moves keep their reach and timing.
- If a Yellow or Red being is what held you, the death screen names its tier: "On floor 4, Doubt (red tier) held you." (Spanish: "Duda (rango rojo)").

## The numbers (over Black)

| Tier | Health | Damage | Speed | Climb (blocks up or down in one step) | Leap |
|---|---|---|---|---|---|
| Black | × 1 | × 1 | × 1 | 1 | its own arc |
| Yellow | × 1.5 | × 1.25 | × 1.2 | 2 (+1) | 1 block higher |
| Red | × 2.5 | × 1.5 | × 1.4 | 3 (+2) | 2 blocks higher |
| Boss, Yellow | × 1.25 | × 1 | × 1 | unchanged | unchanged |
| Boss, Red | × 1.5 | × 1 | × 1 | unchanged | unchanged |

- **Health** is rounded to a whole point. It stacks with the rooted multiplier (Doubt has 24; rooted, 34; rooted and Yellow, 51) and, for a boss, with the floor's boss health.
- **Damage** multiplies every hurt the projection deals: its touch, its strikes (rings, lines, sweeps, fields that sting), its shots and lobs, its bolts, its rockfalls and Panic's burst.
- **Speed** multiplies the projection's own walking speed. A behaviour that sets its own run speed (a charge's run, an emitter's follow) keeps that speed.
- **Climb** adds blocks to the tallest step a walker takes between two cells, up or down, and to the height of a leaper's arc (the flight time grows so it still lands on its mark).
- Warmth is not touched: five good intentions still turn any projection, whatever its tier.
- The numbers are the owner's (#338, "Decisions"); one function holds them for projections and bosses.

## When a tier appears

The tier is rolled once, when the being breaches its omen, from the room's own seed (one roll for each spawn number of the room, on its own branch of the seed), so **the same seed gives the same tiers** and no other roll of the run changes. The chance grows with the floor, times a difficulty `d`:

- **Yellow** = d × (5 % + 2.5 % × (floor − 1)): 5 % on floor 1, 35 % on floor 13.
- **Red** = d × 1.5 % × (floor − 3), never below 0: none on floors 1 to 3, 15 % on floor 13.
- The floor counts from 1 to 13 (anything deeper uses 13). The Roots (floor 0) never roll a tier. If a high difficulty pushes the two past 100 %, Yellow gives way and Red keeps its share.

| Floor | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Yellow (d = 1) | 5 % | 7.5 % | 10 % | 12.5 % | 15 % | 17.5 % | 20 % | 22.5 % | 25 % | 27.5 % | 30 % | 32.5 % | 35 % |
| Red (d = 1) | 0 % | 0 % | 0 % | 1.5 % | 3 % | 4.5 % | 6 % | 7.5 % | 9 % | 10.5 % | 12 % | 13.5 % | 15 % |

Challenge-room waves roll like any other spawn. A projection that splits when hit (Procrastination) passes its tier to its splits, since they share its spawn number; one that splits on release announces new spawns, which roll their own. Creatures never take a tier, and neither does the **Shadow** (El Espejo, #339): it mirrors the player, "as strong as you". The sky realm's beings are not spawned this way and take no tier for now. A mended ally comes back in the tier it was released in.

### The difficulty

There is no difficulty setting in the game yet. The formula takes the difficulty as an input, fixed at 1 today (`BASE_DIFFICULTY` in `src/enemies/tiers.ts`): 0 would turn everything Black, 2 doubles both chances. A later issue (#352) will drive it from the mastery level.

## Optional, off: the falter after a Red release

An earlier build made the room's other hostile projections hold still for 1.5 seconds when a Red one was released. It is not part of the hotfix: the code stays behind a switch that is **off** (`FALTER_ENABLED`), pending the owner. See [deeper behaviour](../../not-built/encounters/DEEPER-BEHAVIOUR.md).

## Open questions

- **Rewards.** Do Yellow and Red beings drop more or better? Today they drop what a Black one drops.
- **The bestiary.** The game has no screen that lists projections yet (the Codex shows Presences only), so the tier names are on the death screen alone. The codex entries should name the tiers when they are built. Built: the completion percentage counts every tier of every projection, hostile and allied, and seeing them all is the achievement "Know Thyself" (issue #360, [COMPLETION](../progression/COMPLETION.md) §2).
- **The sky.** Should the sky realm's beings take a tier later?
