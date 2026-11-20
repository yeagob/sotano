# The aim pair: Dowsing, Eye Contact, and Affirmation's copy

Up: [practices](README.md) · [built design](../README.md)

This package changes three things: Affirmation stops aiming and places copies, and two new practices steer intentions, one toward blocks and one toward projections. The two steering practices are mutually exclusive, and the one acquired last overrides the other.

## The rule

- **The last acquired overrides the older one.** When you gain one of the pair while holding the other, the new one guides your intentions and the older one is set aside. Losing the newer one gives the guidance back to the older one.
- **How it is built.** Both practices write `homingTarget` in a `fire` hook at the same priority. The inventory installs items in acquisition order and the event bus keeps equal priorities in install order, so the later write wins. Restore keeps acquisition order too. No synergy and no special case is needed.
- **Toasts.** The newly gained one shows its own message when the other is held: "Eye Contact now guides your intentions; Dowsing is set aside." and the reverse. It is shown from `onGain`, so restores and rebuilds never repeat it.

## The practices

| Practice | Path | Quality | Targets | Range | Effect |
|---|---|---|---|---|---|
| [Dowsing](mind/DOWSING.md) | Mind | 2 | blocks | 6 blocks | Homing at least 3 toward the nearest block |
| [Eye Contact](will/EYE-CONTACT.md) | Will | 3 | projections | 8 blocks | Homing at least 3 toward the nearest projection |

Both add homing only. Neither lowers damage. Both have a found-in of treasure rooms and a pool weight of 1.

## Affirmation (changed)

- No aim any more: the homing hook is gone.
- A positive intention that hits a block places a copy of that block in the empty cell beside the face it hit. At most one copy per intention.
- The copy is an ordinary placed block, through the same world write as the player's placement, but it emits no `blockPlace` or `blockPlaced` event.
- Refused, and the intention keeps its chance: the cell is not empty, a body (the player or any projection) is in it, the cell is not interior room space (a wall, a door, a doorway, outside the room), there is an element in it, or the material may not be copied. Copies are allowed for ordinary blocks with finite health; never for the unbreakable blocks, the chests, the alembic, the kitchen, the door frames, the pedestal or the bomb.
- It never traps you: a copy is never placed into the player's body.

## Engine changes

- `IntentSpec.homingTarget`: `'block'` (default) or `'projection'`.
- `IntentHooks.nearestEnemy(p, r, polarity)`: the nearest projection the polarity meets within `r`. A negative intention meets hostile projections only; a positive one meets what `enemyAt` meets.
- `ItemApi.placeBlock(x, y, z, material, source)`: returns true only when the copy is placed.
- `GEN_VERSION` 38: both practices join the treasure pool, which changes which practices the same seeds draw and reserve. Band and world hashes did not change; the shape and floors 1 to 9 pins were re-recorded in `tests/roots-easy.test.ts`, and the golden in `tests/rng.test.ts`.

## Tests and sandbox

- `tests/aim-practices.test.ts`: the copy's placement and refusals, no homing for Affirmation, each aim's target and range, a negative intention's polarity, the last-gained rule in every order (gain, lose, restore), no loss of damage, and the toasts.
- Sandbox scenarios: `affirmation-copy` (a crate is copied), `affirmation-chest` (a chest is not), `dowsing-aim` (the shot bends toward the block and ignores the projection), `eyecontact-aim` (the shot bends toward the projection and ignores the block), `aim-last-gained` (Dowsing, then Eye Contact: the projection wins).

## Open for the owner

These are decisions the orchestrator took on the owner's behalf:

1. **Spanish names.** Dowsing is *Radiestesia*, the established word; Eye Contact is *Contacto visual*. Confirm both.
2. **Placement is interior only.** The copy never goes into a corridor, a doorway or a wall, even when the cell looks empty. Confirm this is the intended reach of the copy.
3. **States of being.** Both practices carry a path tag, so they count toward Lucid (mind) and Resolute (will). Lucid now needs two other mind practices, and Resolute two other will practices, to start counting Dowsing or Eye Contact.
4. **Who is chased.** A negative intention is steered only toward hostile projections; a positive one toward any projection it meets, hurt allies included (the same rule the shot uses to hit them).
5. **Recipes.** Rule 14 of the items skill asks for a crafting recipe for every practice. No practice in the code has one yet (the crafting table, issue #112, is not resolved), so neither new practice has one. Record it when #112 lands.
6. **Homing range for blocks stays at 6.** Only projections use 8.
7. **Sandbox placement is checked headless only.** The placement path runs in the real game in the sandbox; no unit test drives the whole game.
