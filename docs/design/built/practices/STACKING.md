# Stacking practices

> Built: nine practices of the drink family grow with every potion or meal you drink. Part of [built/practices](README.md). Engine: `ItemDef.stack` in `src/items/types.ts`, installed by `src/items/inventory.ts`.

## The rule

Each held copy of a stacking practice has its own stacks, starting at 1 (the practice is never empty). Every drink of its kind adds one stack to that copy, up to a maximum. Each stack adds the practice's stat modifiers once more, and the stacks stay for as long as the practice is held. They are never lost on damage.

A drink is a **meal** when its potion is `meal` in `src/content/potions.ts`, otherwise a **potion**. A meal never stacks a potion practice and the reverse; Nourishment stacks on both.

## The nine practices

| id | Name | Counts | Stat per stack | Max | Path | Quality | Inspired by |
|---|---|---|---|---|---|---|---|
| `teaceremony` | Tea Ceremony | potion | move speed +0.05 | 6 | mind | 1 | The Japanese tea ceremony (chadō) |
| `herbalism` | Herbal Lore | potion | damage +0.35 | 6 | body | 1 | Hildegard of Bingen, Physica (12th century) |
| `distillation` | Distillation | potion | jump +0.06 | 6 | mind | 1 | Alchemical distillation: "separate the subtle from the gross" (Emerald Tablet) |
| `spagyric` | Spagyric Art | potion | fire rate +0.12 per second | 6 | will | 1 | Paracelsus' spagyric medicine (16th century) |
| `mindfuleating` | Mindful Eating | meal | move speed +0.05 | 6 | body | 1 | Mindful eating (contemplative practice) |
| `breakingbread` | Breaking Bread | meal | damage +0.35 | 6 | emotion | 1 | Sharing a meal as reconciliation (many traditions) |
| `harahachibu` | Hara Hachi Bu | meal | jump +0.06 | 6 | body | 1 | Hara hachi bu, the Okinawan habit of eating until 80% full |
| `grace` | Grace Before Meals | meal | fire rate +0.12 per second | 6 | emotion | 1 | Saying grace, gratitude before eating |
| `nourishment` | Nourishment | potion or meal | move speed +0.02, damage +0.15, jump +0.025, fire rate +0.05 per second | 8 | body | 2 | Nourishment as care of the whole self |

Every practice carries the tag `nourish` and `potion` or `meal` (Nourishment carries both). Pools: `treasure` weight 0.5 each. Each practice starts at one stack when gained.

## Positive outcome

Every drink of a stacking practice only ever adds to it. No drink hurts the player, and a full stack never removes anything. Each toast states the total so far.

## Effect lines (the numbers the player reads)

- Tea Ceremony: every potion you drink: move speed +5%, up to 6 times (starts at 1).
- Herbal Lore: every potion you drink: damage +0.35, up to 6 times (starts at 1).
- Distillation: every potion you drink: jump +6%, up to 6 times (starts at 1).
- Spagyric Art: every potion you drink: fire rate +0.12 per second, up to 6 times (starts at 1).
- Mindful Eating: every meal you eat: move speed +5%, up to 6 times (starts at 1).
- Breaking Bread: every meal you eat: damage +0.35, up to 6 times (starts at 1).
- Hara Hachi Bu: every meal you eat: jump +6%, up to 6 times (starts at 1).
- Grace Before Meals: every meal you eat: fire rate +0.12 per second, up to 6 times (starts at 1).
- Nourishment: every potion or meal you drink: move speed +2%, damage +0.15, jump +2.5%, fire rate +0.05 per second, up to 8 times (starts at 1).

## Engine

- `ItemDef.stack?: { max, stats }`. Stack modifiers are `add` only (validated), installed per copy as `stats × stacks` under the source `item:<uid>:stack`.
- `ItemApi.addStack(n = 1): number`, bound per held copy. It clamps to `max`, changes only the stat sheet (no hook is reinstalled inside an emit) and returns the new count. Synergies get a no-op.
- `ItemInstance.stacks`. Save format: a copy without stacks is still its plain id; a copy with stacks is `{ id, stacks }`. Old saves restore with zero stacks. Restore clamps and drops garbage.
- The drink hook has id `stack` and priority 60 (`src/content/items/stacking.ts`).
- The inventory detail shows `×n / max` per copy (`inv.stacks`).

## Open for the owner

- **Generation version**: the nine practices join the treasure pool, which changes the practices drawn on the floors. `GEN_VERSION` moves 37 to 38, and the rng golden and the easy-layout baselines are re-recorded at 38. Confirm at release.
- **Recipes**: the crafting table's recipes (`src/content/recipes.ts`) make potions only; no practice recipe exists yet (issue #112). The practices have no recipe until that is resolved.
- **Icons**: drawn by the main session, not yet through the Opus art gate (`sotano-art` §0).
- **Nourishment tags**: it carries both `potion` and `meal`, so a tag-based synergy would count it for either.
- **Stack toast at the cap**: the toast still names the capped total.
- **Spanish percentages**: written with a space before the percent sign, as in the dualprocess entry.
