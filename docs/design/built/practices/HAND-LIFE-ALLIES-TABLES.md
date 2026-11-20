# Practices for the hand, life, allies and tables

Up: [Practices](README.md) · Issue #52

Three practices that change what the hand carries, what it can take back from a table, and who stands beside you: Furoshiki (the hand), Kinship (the allies) and Apprenticeship (the alembic and the kitchen). Each has a positive outcome, in its special cases too.

## Furoshiki (body, blocks)

- **Meaning:** one cloth, folded with care, carries more than a bag. Inspired by the Japanese wrapping cloth.
- **Path:** body. **Quality** 2. **Pool** treasure 1.
- **Effect:** carry 2 more things in your hand (the `carry` stat, +2 on top of the base two).
- **Hand:** the slots past the base two are drawn dimmer (opacity 0.55), so the player reads the base hand first. The slots are the ordinary hand slots; nothing else changes about carrying (selection, drops, throws).
- **Positive outcome:** more carried things, with no cost.

## Kinship (emotion, allies)

- **Meaning:** those you turned toward you walk beside you. Inspired by kinship with all beings (many traditions).
- **Path:** emotion. **Quality** 2. **Pool** treasure 1.
- **Effect:** each projection you turn to your side heals you a quarter heart (2 points), once per room visit.
- **Trigger:** any projection whose faction becomes `self` (`factionChange`, from the Mender's gift, a warm positive intention, or a mended projection). The heal is a side effect, after the core's own changes.
- **Once per visit:** the room entry (`roomEnter`) opens the heal again; a second turning in the same visit heals nothing.
- **Positive outcome:** a quarter heart each room, for the projections turned to your side.

## Apprenticeship (mind, tables)

- **Meaning:** the hands learn the table before the head does. Inspired by the craft apprenticeship (guild tradition).
- **Path:** mind. **Quality** 2. **Pool** treasure 1.
- **Effect:** every brew and every cook heals you a quarter heart (2 points). Brewed flasks come out iced: a potion that lasts rooms lasts one room more (`iced` is set on the brew).
- **Iced flasks:** the `brew` event carries `iced`; a hook may set it (see [ITEMS.md](../../../architecture/ITEMS.md) §5). The alembic reads it back and gives the flask `iced: true`. Only potions counted in rooms gain the extra room (`flaskRooms`); the others are unchanged.
- **Positive outcome:** a quarter heart per brew or cook, and the extra room on room potions.

## Decisions taken for the owner

These were decided in the build, not by the owner. Review them:

- **Heartwork is not added.** The brief asks for it only if no practice adds a heart container and heals it full. Box Breathing already does both (+1 container, heal to full on pickup), so the practice is skipped.
- **Allies do not deal ×1.5 damage.** Projections that turn to your side are not attackers in the game today (a projection only hurts actors touching it; allies are only struck). Kinship therefore has no damage part. Its heal is the trigger the brief names for this case. If allies gain attacks, a ×1.5 damage rule can be added then.
- **Heal amounts.** A quarter heart is 2 points (the heal event takes half-hearts, `0.5`). Both heals are small on purpose: they stack with the rest of the hand, the table and the allies, and never give a full heart by themselves.
- **Iced flasks are flagged on every brew.** The flag is set for every brew, and it only changes potions counted in rooms (as before). Potions with a fixed effect carry the flag and ignore it.
- **Recipes.** No practice recipe table exists yet (issue #112 is not resolved), so these three have no recipe. Their pool is treasure only.

## Not done here

- The sandbox could not drive a brew: the placement action does not reach the alembic's feed. Apprenticeship's brew and cook are covered by unit tests (`tests/companion-practices.test.ts`); the sandbox has no scenario for them.
- The golden seed pins (`tests/rng.test.ts`, `tests/roots-easy.test.ts`) move because the new treasure items change the pools. They are left failing for the owner to re-pin.

## Open for the owner

- Whether Kinship should get the ×1.5 ally damage once allies can attack.
- Whether a recipe for each of the three is wanted once issue #112 lands.
