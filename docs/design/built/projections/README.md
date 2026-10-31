Up: [the design document](../../README.md)

# Projections (built)

A projection is a pattern that blocks intention, given a body made of the room's own matter. It mirrors the pattern: what it does is what the pattern does to someone stuck in it. A projection is never a person, a group, a diagnosis or a tradition, and it never speaks.

This folder has one document per projection in the code: 40 documents. Sixteen are **built**: their core behaviour is in the code, though some card details are open questions. Twenty-four are **partial**: the built part is here, and the rest is in [not-built/projections](../../not-built/projections/README.md). Each document says which it is.

## Shared contract

- **Faction.** Hostile to the player and to allies. A projection converted by good intentions becomes an ally (see Polarity).
- **Omens.** Every projection is announced before it exists: cold motes gather at its spot, a crack opens, and it breaches. The room seals while hostile projections live and opens when none remain. Code: [src/game/omens.ts](../../../../src/game/omens.ts).
- **Spawn place.** The code places every built projection on the floor of its room, at a chosen spot. No wall, ceiling, liquid, block or element spawn kind was found in the code.
- **Health and release.** A projection has the health of its file. Every hostile projection's health was doubled in the balance pass of issue #45 (2026-10-31), so a fight with the starting intention takes twice as many hits; the numbers are listed per projection below and in `tests/projection-health.test.ts`. Bosses, creatures and the rooted multiplier are unchanged. A rooted one (a chance per floor) has 1.4 times as much and leaves one more part. A projection killed by a bad intention releases: it drops a shard and may leave parts (flesh, heart, mind, essence) named after itself. Code: [src/content/rooted.ts](../../../../src/content/rooted.ts), [src/content/parts.ts](../../../../src/content/parts.ts).
- **Movement.** The built movement kinds are: walker (chases), leaper (crouches and jumps), charger (lines up and runs), flyer (hovers or flits), phaser (passes through blocks), ranged (keeps its distance and lobs), burst (rushes, swells, bursts), emitter (stands still and fires on a timer), sleeper (idle until woken, used by a boss) and chirp (a cosmetic creature kind). Swimmers, burrowers and mounted projections are not built. A patrol route kind exists in the code and no projection uses it. Code: [src/enemies/behaviours.ts](../../../../src/enemies/behaviours.ts).
- **Attacks.** Five shapes: a line (a charge or a beam), a ring (a fixed or expanding ring on the floor), a field (an area that slows, mutes or stings whoever is in it for a short time), a pull (a wind that drags actors toward its source) and a sweep (a wall that crosses the room). Every attack has a lead time with cold motes gathering on its shape before it hurts. Bolts and lobs stop at the first solid block or the first actor they touch. Code: [src/enemies/attacks.ts](../../../../src/enemies/attacks.ts), [src/entities/enemies.ts](../../../../src/entities/enemies.ts).
- **Target.** A projection targets the nearest hostile actor, re-chosen four times a second, and switches only to one at least 1.5 blocks closer. Code: [src/entities/enemies.ts](../../../../src/entities/enemies.ts).
- **Elements.** A projection can set how it lives with fire, lava and water: its harm multiplier, its speed in the element, and its path (avoid, cross, or dwell). Affinities are listed in each document.

## Polarity: how the player answers a projection

Every intention is good or bad. The loaded one is switched with the polarity key (F on the keyboard, see the controls) and the HUD shows which is loaded. Weapon strokes carry the polarity too.

- **Good** against a hostile projection: half damage, and its warmth rises with each hit. At full warmth it turns to your side and becomes an ally that keeps its pattern.
- **Bad** against a hostile projection: full damage. A projection it kills releases.
- **Allies:** a good intention heals them, a bad one harms them. An ally at zero under a bad intention turns hostile again.
- A room clears when no hostile projection is left. Allies do not keep doors shut.

Code: [src/combat/polarity.ts](../../../../src/combat/polarity.ts). The rules the review added beyond the owner's text are open (see [OPEN-QUESTIONS](../../not-built/projections/OPEN-QUESTIONS.md)).

Parts: a released projection may leave flesh, heart, mind or essence. See [PARTS](PARTS.md) for the chances and how parts are carried.

## Index

| Projection | Floors (code) | Status | What it does |
|---|---|---|---|
| [Doubt](DOUBT.md) | all floors | built | Walks at you, pauses to reconsider, reaches before it touches |
| [Inner Critic](INNER-CRITIC.md) | all floors | built | Keeps its distance and lobs judgements in arcs |
| [Panic](PANIC.md) | all floors (more often from floor 3) | built | Rushes at you, swells in three steps and bursts |
| [Autopilot](AUTOPILOT.md) | 1–2 | built | Walks a fixed loop and charges along it when you cross it |
| [Impulse](IMPULSE.md) | 1–2 | built | Crouches and leaps to where you stand |
| [Procrastination](PROCRASTINATION.md) | 2–5 | built | Slow; every hit splits it into smaller Laters |
| [Procrastination B](PROCRASTINATION-B.md) | split only | built | The middle split of Procrastination; splits again |
| [Procrastination C](PROCRASTINATION-C.md) | split only | built | The smallest split: fast, eight health |
| [Distraction](DISTRACTION.md) | 1–5 | built | Erratic flyer that circles you at a distance |
| [Resentment](RESENTMENT.md) | 3–4 | built | Walks and leaves slowing pools; grows while it is not hit |
| [Gloom](GLOOM.md) | 3–4 | built | Hovers high and drops cold lobs around you |
| [Alarm](ALARM.md) | 3–6 | built | Rushes and bursts; a burst sets off Alarms and Panics nearby |
| [Paralysis](PARALYSIS.md) | 6–9 | built | Stands still, tethers you with a pull and slows you |
| [The Margin](MARGIN.md) | 3–6 | built | Stands still, slows the spot you stand on and fires at you |
| [Dread](DREAD.md) | 6–9 | built | Stands still and sends an expanding ring across the room |
| [Reactivity](REACTIVITY.md) | 5–6 | built | Charges along a line when lined up with you; stunned by hard blocks |
| [Craving](CRAVING.md) | 1–2 | partial | Circles you and pulls with a wind |
| [Avoidance](AVOIDANCE.md) | 1–2 | partial | Shuts itself away and peeks out to throw a shot |
| [Undertow](UNDERTOW.md) | 3–4 | partial | Walks in water and sends a wave across the room |
| [Rumination](RUMINATION.md) | 3–4 | partial | Moves through blocks after you and fires a long line |
| [Scarcity](SCARCITY.md) | 3–4 | partial | Steals pickups and runs; gives them back plus one on release |
| [Second-Guessing](SECOND-GUESSING.md) | 3–7 | partial | Walks with pauses and lunges |
| [Backlog](BACKLOG.md) | 5–9 | partial | Walks and throws crates at you |
| [Noise](NOISE.md) | 4–9 | partial | One fast flitting Noise; the swarm is not built |
| [Perfectionism](PERFECTIONISM.md) | 3–6 | partial | Its plates absorb all damage until they are broken |
| [Not Yet](NOT-YET.md) | 6–9 | partial | Walks, and heals while it is not hit |
| [Comparison](COMPARISON.md) | 3–6 | partial | Keeps 4–6 blocks away and fires bolts at you |
| [The Hall of Mirrors](HALL-OF-MIRRORS.md) | 7–9 | partial | Stands still and fires three bolts from one body |
| [The Tribunal](TRIBUNAL.md) | 6–9 | partial | Stands still; one body whose three posts fire in turn |
| [Sulk](SULK.md) | 5–6 | partial | Stands in water and erupts a slowing field near you |
| [Shoulds](SHOULDS.md) | 5–6 | partial | Stands still and fires bolts along the axis toward you |
| [Dogma](DOGMA.md) | 5–6 | partial | A monolith whose field mutes, slows or stings by its health |
| [Burnout](BURNOUT.md) | 7–8 | partial | Speeds up for eight seconds, then sits spent for three |
| [Spark](SPARK.md) | 7–8 | partial | Walks and arcs a line at you every three seconds |
| [Pretence](PRETENCE.md) | 7–8 | partial | A chaser; its disguise never starts |
| [Shortcut](SHORTCUT.md) | 7–8 | partial | Flees, and swings a short ring when you come close |
| [Numbness](NUMBNESS.md) | 9 | partial | A slow walker that leaves slowing fields |
| [Cynicism](CYNICISM.md) | 9 | partial | Stands still and mutes your casting in its ring |
| [Isolation](ISOLATION.md) | 9 | partial | Raises one wall of ice across the room, once |
| [What If](WHAT-IF.md) | 9 | partial | Drifts through blocks and fires at you |

Floors are the roster's ranges in [src/content/tables/enemies.ts](../../../../src/content/tables/enemies.ts). Where a card gives other floors, the difference is an open question.
