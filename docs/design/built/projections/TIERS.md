Up: [Projections (built)](README.md)

# Colour tiers: Black, Yellow and Red

Built (issue #338). Any projection can rise in one of three colour tiers: **Black** is the projection as its own document gives it, **Yellow** is the same pattern held harder (tougher, harder hitting, faster, jumping higher), and **Red** is its elite form, with the highest numbers. The tier is a layer over the projection, never a new projection: it keeps its pattern, its moves and its meaning. Code: [src/enemies/tiers.ts](../../../../src/enemies/tiers.ts) (rules), `Game.spawnEnemy` (the roll), [src/entities/enemies.ts](../../../../src/entities/enemies.ts) (the mark, the jump and the damage in play); tests: `tests/tiers.test.ts`.

## How the player meets it

- A Yellow projection wears **two short yellow thorns** on its head with a gap between them, like horns; a Red one wears a **crown of three red thorns**, the middle one the tallest. A Black one wears none. The thorns are thin upright spikes turned edge-on, lit from within, and the body under them is the projection's own (see the art ledger, [DECISIONS §14.6](../../../art/DECISIONS.md)).
- A tiered projection takes more intentions to release, hurts more when it touches you and with every strike and shot, walks faster, and steps up ledges a Black one must walk round. A Yellow Doubt follows you up a two-block step; a Red one up three. A leaping one arcs higher and still lands where it aimed.
- If a Yellow or Red projection is what held you, the death screen names its tier: "On floor 4, Doubt (red tier) held you." (Spanish: "Duda (rango rojo)").
- When a **Red** projection is released, the hostile projections left in its room falter: for 1.5 seconds they stop walking and start no new attack (a touch still hurts), pale motes rise over them and two soft tones sink. See [deeper behaviour](../../not-built/encounters/DEEPER-BEHAVIOUR.md) for why.

## The numbers (multipliers over Black)

| Tier | Health | Damage | Speed | Jump | Climb (blocks up or down in one step) |
|---|---|---|---|---|---|
| Black | × 1 | × 1 | × 1 | × 1 | 1 |
| Yellow | × 1.5 | × 1.25 | × 1.15 | × 2 | 2 |
| Red | × 2.25 | × 1.5 | × 1.3 | × 3 | 3 |

- **Health** is rounded to a whole point. It stacks with the rooted multiplier (Doubt has 24; rooted, 34; rooted and Yellow, 51).
- **Damage** multiplies every hurt the projection deals: its touch, its strikes (rings, lines, sweeps, fields that sting), its shots and lobs, its bolts, its rockfalls and Panic's burst.
- **Speed** multiplies the projection's own walking speed. A behaviour that sets its own run speed (a charge's run, an emitter's follow) keeps that speed.
- **Jump** multiplies the height of the hop a walker takes up a step and of a leaper's arc. The flow field reads its whole part as the climb: the tallest step it takes between two cells, up or down.
- Why these numbers: Yellow is the first step a player notices without reading (half again as much health, a step and a half of extra reach), and Red is one more step of the same size, so Red is always the maximum. Damage grows less than health, so a Red touch of a half-heart projection takes three quarters of a heart, never two hearts at once. Warmth is not touched: five good intentions still turn any projection, whatever its tier, so the route of light does not grow longer with health.

## When a tier appears

The tier is rolled once, when the projection breaches its omen, from the room's own seed (one roll for each spawn number of the room), so **the same seed gives the same tiers** and no other roll of the run changes. The chance grows with the floor and with the global difficulty `d`:

- **Yellow** = d × (5 % + 2.5 % × (floor − 1)), at most 50 %.
- **Red** = d × 1.5 % × (floor − 1), at most 30 %.
- The floor counts from 1 to 9 (deeper floors use floor 9). The Roots (floor 0) never roll a tier, and the sky's beings are not spawned this way.

| Floor | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Yellow (d = 1) | 5 % | 7.5 % | 10 % | 12.5 % | 15 % | 17.5 % | 20 % | 22.5 % | 25 % |
| Red (d = 1) | 0 % | 1.5 % | 3 % | 4.5 % | 6 % | 7.5 % | 9 % | 10.5 % | 12 % |

Floor 1 never meets a Red projection at base difficulty, so the first floor still teaches each pattern in its plain form, and the deepest floor sends about one tiered projection in three. Challenge-room waves roll like any other spawn. A projection that splits when hit (Procrastination) passes its tier to its splits, since they share its spawn number; one that splits on release announces new spawns, which roll their own. Bosses and creatures are always Black; the mended allies the Mender brings back are Black.

### The global difficulty

There was no difficulty setting in the game. The smallest honest one is a single number, `GLOBAL_DIFFICULTY` in `src/enemies/tiers.ts`, at its base value 1: 0 turns every projection Black, 2 doubles both chances (up to the caps). It is a constant, not the mastery level or a saved setting, because a value read from the save would give two players the same seed and different tiers. What the difficulty should be (a player option, the mastery level, the run's progress) is open for the owner.

## Open questions

- **Difficulty.** A constant at 1 today. Should it become a player option, follow the mastery level (and accept that a seed then plays differently for different saves), or stay fixed?
- **Rewards.** Do Yellow and Red projections drop more or better (the issue's question 4)? Today they drop what a Black one drops, and a rooted one still rolls its parts twice.
- **Where tiers apply.** Every projection on floors 1 to 9, challenge waves included. Should some projections never take a tier, and should the sky's beings take one later?
- **Allies.** A converted Yellow or Red projection keeps its thorns and its numbers as an ally. Should the mark fade when it turns to your side?
- **The bestiary.** The game has no screen that lists projections yet (the Codex shows Presences only), so the tier names are on the death screen alone. The codex entries should name the tiers when they are built.
