# Fire practices

Up: [Practices](README.md) · [built design](../README.md)

Three practices work with fire, the element the player meets in the rooms of the roots (`src/content/elements.ts`, [ELEMENTS](../../../architecture/ELEMENTS.md) §9–10), and one synergy that rewards holding three of them. Fire is not a hazard only: a practice can bring it, carry it, and be spared by it. Lava stays what it is: it burns everyone, and none of these practices changes that.

| Practice | Path | Quality | Found in | Code |
|---|---|---|---|---|
| Inner Fire (`tummo`) | Body | 2 | treasure rooms | `src/content/items/tummo.ts` |
| Firewalking (`firewalking`) | Will | 2 | treasure rooms | `src/content/items/firewalking.ts` |
| Stolen Fire (`prometheus`) | Emotion | 3 | treasure rooms | `src/content/items/prometheus.ts` |
| Hearth (synergy `hearth`) | three fire practices | | | `src/content/synergies.ts` |

Kindling ([Will](will/KINDLING.md)) is the first fire practice and is counted as one of the three: its flare is a fire burst, and Hearth listens to it.

## The three practices

### Inner Fire

*Meaning:* a heat kindled from within, enough to dry wet cloth in the snow. Inspired by the Tibetan inner-heat meditation (tummo).

*Effect:* negative intentions burn: they set flammable blocks within 1 block on fire and deal +1.5 fire damage to projections. Fire hurts you half as much.

*Positive outcome:* fire hurts the player half as much, whatever the intention. Positive intentions do not burn anything (see *Decisions*).

- **Tag.** Every intention carries the `burning` tag (`BURNING`, exported from `tummo.ts`) and the fire colour.
- **Blocks.** A negative intention that hits a block sets every flammable block within 1 block of the hit cell on fire (`igniteArea`, radius 1).
- **Projections.** A negative intention that hits a projection pulses 1.5 damage at the projection's centre, in a sphere of 0.6 blocks.
- **Player.** Fire-cause damage to the player is halved (×0.5). Lava is not.

### Firewalking

*Meaning:* walking the coals is walking through fear. Inspired by the firewalking rituals (the Anastenaria of Greece and Bulgaria).

*Effect:* fire never hurts you. Standing in fire heals a quarter heart every 3 seconds (up to 1 heart per room). Lava still burns.

*Positive outcome:* the fire is harmless and the player is healed while in it, so a fire room becomes a place to cross.

- **Immunity.** Fire-cause damage to the player is cancelled. Lava (fire damage with the lava source) is not.
- **Healing.** While the player touches fire, a warmth heals 2 points (a quarter heart) at most every 3 seconds, and at most 8 points (one heart) per room. Healing is spent only while the player is hurt.
- **Touch.** The player touches fire when the hottest element at the feet, middle or head is fire. Cells next to the player do not count.

### Stolen Fire

*Meaning:* fire carried to others is never lost by the one who gives it. Inspired by the myth of Prometheus (Hesiod, Aeschylus).

*Effect:* one intention in five (20%) is a fire seed. A negative seed bursts on impact (1.6 blocks, 5 damage) and sets flammable blocks within 1.5 blocks on fire. The burst never hurts you.

*Positive outcome:* the burst cannot reach the player (it damages projections and sets blocks alight only), so the practice is safe to use in a room you are standing in.

- **Seeds.** Each intention draws once from the item's `rng` stream: 20% of shots are seeds (`FIRE_SEED`, exported from `prometheus.ts`). A seed is 1.4 times bigger (`intent.radius`), which makes its look and its hit area bigger.
- **Burst.** A negative seed that hits a block, a loose cube or a projection pulses 5 damage at 1.6 blocks, and ignites flammable blocks within 1.5 blocks of the hit (block cell, cube cell or projection centre).
- **The player.** The pulse reaches projections only (`Game.pulse` skips the player), so it cannot hurt the player.

## Hearth (synergy)

*Meaning:* three fires keep one warm place.

*Requires:* three practices with the `fire` tag (Kindling counts; with the three above, four are possible).

*Effect:* damage +1, fire rate ×1.1. Where a fire burst goes off (Kindling's flare, Stolen Fire's burst), the player is warmed by a quarter heart, at most once every 4 seconds, and only while hurt.

## Core changes

Every change that a practice needed, and that the rest of the game can use:

| Change | Where | Why |
|---|---|---|
| `ItemApi.time()`: game time in seconds, paused with the game | `src/items/types.ts`, `Game.makeApi()` | Timers (every 3 s, every 4 s) |
| `ItemApi.memory()`: scratch numbers per practice, shared by its copies, dropped when the last copy is lost, never saved | `src/items/types.ts`, `src/items/inventory.ts` | Per-room caps and timers survive a call and a rebuild, and two copies of one practice share one cap |
| Event `burst` (react only): a pulse went off, with its `source` | `src/game/events.ts`, `Game.pulse()` | Hearth reacts to the fire bursts of two practices without either knowing about the synergy |
| `igniteArea` with a fractional radius walks whole cells | `src/game/game.ts` | Stolen Fire's radius 1.5 used to step through fractional offsets and ignited nothing; integer radii (Kindling 2, Inner Fire 1) are unchanged |
| `GEN_VERSION` 37 → 38 | `src/core/seed.ts` | The three practices join the treasure pool, which moves the draws of every run that reaches a treasure: the golden seed and the teaching-layout baseline are re-recorded (`tests/rng.test.ts`, `tests/roots-easy.test.ts`). The floor shapes of the Roots and the world outside them do not change |

Both verbs are in [ITEMS.md](../../../architecture/ITEMS.md) §2 and the event in its §3.

## Decisions taken for the owner (open for review)

1. **Positive intentions do not burn.** Inner Fire's burn and Stolen Fire's burst apply only to negative intentions. Positive intentions only mend (BESTIARY polarity), and a positive shot that set blocks alight or pulsed 1.5 damage would contradict that. The effect text says "negative", which is a change of the brief's wording (its "Intentions burn" and "A seed bursts").
2. **A positive fire seed warms you.** Its burst is off (positive intentions only mend), so on impact it heals the player a quarter heart, at most once every 5 seconds (orchestrator decision for rule 15: the fire you give comes back as warmth). Owner may prefer another outcome, such as mending the blocks it passes.
3. **The fire seed is 1.4 times bigger in hit size as well as look.** `intent.radius` drives both, so seeds are also easier to hit. Owner to confirm.
4. **The extra damage is kind `item`.** A pulse deals its damage as an item's, with the practice's id as its source (`tummo`, `prometheus`). The death screen names the practice through `causes` if it is ever needed; projections have no fire-cause damage of their own.
5. **Heal allowance resets on each room entry**, so leaving and coming back to a room gives a new heart. Owner to confirm that a room visit, not a room, is the unit.
6. **Healing counts only while hurt.** At full health the timer and the room cap are not spent.
7. **Touch is the player's own cells.** Standing next to fire, in the air above it, does not count as touching.

## Not built, or not yet verified

- **Recipes.** The crafting table (issue #112) is not built, so none of the three has a recipe yet; rule 14 is pending.
- **Icons.** The 12 × 12 icons are drafted with the palette tokens of the fire and each path. They were not reviewed at 24 px in the browser; the lab runs headless only.
- **Sandbox.** Seven scenarios cover the practices in crates, in fire, in lava, beside water and with Kindling (`src/sandbox/scenarios/fire-*.json`, `prometheus-crates.json`). The heal caps are checked in `tests/fire-practices.test.ts`, not in the lab.

## Code and tests

- Hooks: `src/content/items/tummo.ts`, `firewalking.ts`, `prometheus.ts`; synergy `hearth` in `src/content/synergies.ts`.
- Tests: `tests/fire-practices.test.ts` (each hook, fire immunity against lava, heal caps, the 20% seed rate over 5000 shots, Hearth activation with three fire tags and its warmth), and the contract and matrix tests (`tests/items.test.ts`, `tests/synergy-matrix.test.ts`).
