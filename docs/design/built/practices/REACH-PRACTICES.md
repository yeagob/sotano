# Reach practices

Up: [built practices](README.md) · [built design](../../README.md)

Reach is how far the hand can place a block. The starting reach was cut by 20% and four practices give a little of it back (issue #162, owner decision on PR #171).

## What is built

- **Starting reach** is 4 blocks, down from 5 (`BASE_STATS.reach` in `src/core/stats.ts`). Mining and damage are unchanged.
- **Four practices add +1 block of reach** through the `reach` stat (add 1), each keeping its own effect:

| Practice | Own effect (kept) | Why reach fits |
|---|---|---|
| [Self-Efficacy](will/SELF-EFFICACY.md) | A projection hit runs away for 3 s | Believing you can get there also stretches what the hand can place |
| [Second Brain](mind/SECOND-BRAIN.md) | Carry +1 block | A tool in the other hand reaches what the arm cannot |
| [Grounding](body/GROUNDING.md) | Kicks ×2 | Rooted, you place from where you stand, one block further |
| [Kaizen](will/KAIZEN.md) | Pierce +2 soft blocks | Each small step reaches a little further than the last |

- Other reach sources, unchanged: [Letters from a Stoic](will/LETTERS-FROM-A-STOIC.md) (+2 blocks) and the Lucid state of being (+1 block, a state, not a practice).
- The intention **range** practices (Visualization, Thinking, Waiting, Fasting, Satori) do not change. Range is how far intentions fly, not block reach.
- No upper limit is set on `reach` in `STAT_LIMITS`, so several reach sources add up.

## Tests and text

- `tests/core.test.ts`: the new base reach of 4, reach practices adding on top, and mining and damage unchanged.
- `tests/reach-practices.test.ts`: each of the four adds exactly +1 reach, holding one takes the starting reach to 5, the practice's own effect still applies, and each effect text names the reach in English and Spanish.
- Effect texts: English in the item files, Spanish in `src/i18n/locales/es.ts` ("Alcance +1 bloque").

Code: `src/core/stats.ts`, `src/content/items/{selfefficacy,secondbrain,grounding,kaizen}.ts`.
