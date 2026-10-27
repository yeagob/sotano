# Review: weapons that replace the intention (2026-10-26)

Proposal: [../architecture/WEAPONS.md](../architecture/WEAPONS.md). Engineer: the main session. Architect and mediator: review agents. Owner decisions taken as binding: weapons replace the shot like Isaac; the blade cuts **all** blocks in its range, destroys projectiles and cuts projections; the beam burns through blocks with tick damage; both quality 4, boss pool; together a giant beam sword.

| # | Architect critique | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | A cut of "the block's full HP" doesn't break armored blocks (`blockDamage` subtracts armor first) | High | Now | Cuts deal 1e6 with kind `'cut'`; `'cut'` and `'beam'` added to `DamageKind`; bedrock excluded by `breakable` |
| 2 | Unbounded reach at `size` 5; cuts through walls, floors and doors; proposes caps, a slab and clipping to the room | High | Caps now; slab and room clipping **rejected** | Blade ≤ 6, great cut ≤ 18 blocks. Clipping contradicts the owner's "cuts all blocks in its range"; digging through walls and floors is already a rule; doors are not world blocks |
| 3 | Per-block side effects (sounds, particles, debris ring, Habit Stacking backlog) | High | Now | Per-frame budgets for break sounds (4) and particle bursts (24); loose cubes capped per strike (16 / 24). Per-strike cap on deferred chains: later (balance) |
| 4 | Items that only hook `fire` go dead under weapons | High | Now (documented); mapping later | Listed in WEAPONS.md §2; pierce mapping in the balance milestone |
| 5 | `strike` timing and payload underspecified | Medium | Now | Once per strike, frozen; `color` and `tags` added; a cancel refunds the charge |
| 6 | Weapon resolution and swapping gaps | Medium | Now | Resolved in `rebuild()` (priority, then latest); swapped in `simulate`; swap drops charges; priority 0..999 validated; tests for gain, lose, restore |
| 7 | Determinism with variable `dt` | Medium | Now | Fixed-accumulator beam (exactly 10 ticks); the sweep integrates angle intervals; tested at 20, 60 and 144 fps |
| 8 | Clearing projectiles would delete allies' projectiles | Medium | Now | `Enemies.clearProjectiles(side, inside)` only clears projectiles hostile to the player |
| 9 | Knockback direction, an `isPlayerShot(kind)` helper | Low | Later (polish) | The blade knocks back radially already |
| 10 | Testability | Low | Now | `WeaponHost` interface; `tests/weapons.test.ts` with a fake host |
