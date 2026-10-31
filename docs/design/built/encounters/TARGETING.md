[Encounters](README.md)

# Targeting

Built. Whom a being attacks, and when it changes its mind. Code: `src/entities/enemies.ts` (the target choice), `src/entities/actors.ts` (the faction rule).

## Who can be a target

A being can target only an actor hostile to its own faction. Hostility is simple: two different factions, and neither one neutral.

- Projections and bosses (the projection faction) target the player, and any converted ally (the self faction).
- Creatures and presences (neutral) are never targeted and never target.
- Actors still forming (materialising) are not targets.

## The choice

Every quarter of a second (4 Hz) a being picks the nearest valid target:

- The distance is counted in blocks on the floor.
- A target in another room counts twenty blocks farther away than its real distance, so the room the being is in is preferred.
- The current target is kept unless another is at least 1.5 blocks closer. This stops two targets at the same distance from flickering.
- A target that dies or stops being valid is dropped at once.

## Shots and blocks

A being's shot goes at the point it aims at, not at a target it has lost. A projectile hits the first hostile actor it touches on its way (see [Attacks](ATTACKS.md)).

## Open questions

- **Allies.** A projection's attacks reach a converted ally. The design does not say whether the ally should be spared. Decide the rule.
- **Creatures in the way.** A projection's shot does not hurt a creature, since creatures are neutral. Check that the rule holds for bosses' cubes too.
- **The room bias.** The twenty-block penalty for another room is a tuned number. Should a boss that has the player in view ignore it?
