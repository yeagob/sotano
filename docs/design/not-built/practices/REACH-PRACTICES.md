# Reach practices: secondary effects (proposal)

Up: [not-built practices](README.md)

Status: **proposed, owner approval needed before any secondary effect is coded** (issue #162). The base reach cut is built (see [built/blocks/PLACING](../../built/blocks/PLACING.md)); this document only proposes what the reach practices do beyond reach.

## What is built now

- **Starting reach** is 4 blocks, down from 5 (`BASE_STATS.reach` in `src/core/stats.ts`). Mining and damage are unchanged.
- The `reach` stat is raised directly only by [Letters from a Stoic](../../built/practices/will/LETTERS-FROM-A-STOIC.md) (+2 blocks). The Lucid state of being adds +1 more, but it is a state, not a practice.
- Three practices raise the intention range (`range`), the distance intentions fly. The issue calls this reach too, so they are counted here.

## The four practices

| Practice | Reach-type effect today | Other effects today | Secondary effect already present? |
|---|---|---|---|
| Letters from a Stoic | Reach +2 blocks | Carry +3, kicks and throws ×2 | Yes (three) |
| Visualization | Range ×1.6 | Shot speed +30% | Yes (shot speed) |
| Thinking, Waiting, Fasting | Range ×1.25 | Invulnerability +0.6 s, luck +1 | Yes (two) |
| Satori | Range ×1.3 | Six other effects (damage, fire rate, speed, jump, mining, luck) | Yes (six) |

Every one of the four already has a secondary effect. The owner has to decide whether that is enough for the issue's "distinct, tested secondary effect", or whether new ones are wanted.

## Options for review

**Option A: keep the current effects.** The reach cut is the whole change. No new numbers, no new tests beyond the base reach.

**Option B: add one new effect to three practices.** Each candidate touches a second system, as the decided design rule asks (a practice that only changes a number is filler). Satori is left out because it already has six other effects.

| Practice | Candidate new effect | Second system it touches | Stat it uses |
|---|---|---|---|
| Visualization | Luck +1: the outcome you saw first is easier to notice, so rewards come more often | Rewards and drops | `luck` add +1 |
| Thinking, Waiting, Fasting | Breath +4 s: you can stay under water four seconds longer | Swimming | `breath` add +4 |
| Letters from a Stoic | Air jumps +1: one more jump in the air, the discipline of one more step | Movement | `airJumps` add +1 |

Each candidate uses an existing stat, so it needs no new mechanic. Each would be checked by the synergy matrix and the stat limits in `src/core/stats.ts`, and each effect text would be written in English and Spanish when it is built.

## Open question for the owner

Option A or Option B? If Option B, confirm the three candidates above or name others.
