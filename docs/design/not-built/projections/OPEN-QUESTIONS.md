Up: [Projections (not built)](README.md)

Status: proposal. These questions are open. None is decided here: the owner rules on each, and the answer goes into the card and the built document in the same change.

## 1. Stat conflicts: card against code

Each value is shown twice, the card first. Numbers are targets until a build confirms them; the code value is what plays today.

- **Inner Critic.** Card: 14 health, floors 1 to 4. Code: 9 health ([critic.ts](../../../../src/content/enemies/critic.ts)), all floors. Which health and which floors does the owner want?
- **Not Yet.** Card: a core of 24 health and eight plates of six health each, floors 6 to 9. Code: 40 health, armour 0.7, no plates ([not-yet.ts](../../../../src/content/enemies/not-yet.ts)), floors 6 to 9. Which structure does the owner want?
- **Panic.** Card: 8 health, cost 1, floors 1 to 4. Code: 7 health, cost 2, all floors, and more often from floor 3 ([panic.ts](../../../../src/content/enemies/panic.ts)).
- **The Hall of Mirrors.** Card: three mirrors of 22 health each. Code: one body of 22 health, which fires three bolts ([hall-of-mirrors.ts](../../../../src/content/enemies/hall-of-mirrors.ts)). Total health is different, and the structure is different.
- **The Tribunal.** Card: three lecterns of 24 health each (72 in all). Code: one body of 72 health with three posts ([tribunal.ts](../../../../src/content/enemies/tribunal.ts)). The total matches; the structure is the question.

Recommended: keep the code's values until a play test, and rule on the structure of the Hall of Mirrors and the Tribunal, which the cards describe as several bodies.

## 2. Do attacks answer to polarity?

Neither the design text nor the code says whether a projection's attacks (its bolts, lines, rings, fields and sweeps) can be answered by an intention's polarity. Options:

- (a) Attacks ignore polarity. Blocks and movement are the answer. This is the build today.
- (b) A good intention can turn a bolt aside, or a bad one can break a line.
- (c) Only the weapon strokes that cut (the blades of light) destroy projections' attacks, as today's one blade does.

Recommended: (a), until play shows a need. Recorded as a question, not a rule.

## 3. Polarity rules added by the review

The review that accepted polarity added rules the owner's text does not say. They are in the code and are awaiting a ruling: a good intention never takes a projection's last point; a converted projection, or a relapsed ally, returns with at least half its maximum health; a warmed target gains warmth once per stroke (a beam's ticks do not stack it); a relapsed projection in a cleared room does not reseal the room; a healthy ally lets good intentions pass while a bad one always hits it. Source: [docs/reviews/polarity.md](../../../reviews/polarity.md).

## 4. Pretence's disguise

The disguise is in the code, but a projection spawns visible and nothing hides it first, so the disguise never starts ([pretence.ts](../../../../src/content/enemies/pretence.ts)). Question: is the disguise still wanted? If yes, how does it start: spawned hidden, or hidden until the player comes close? Recommended: decide it is wanted, and spawn it hidden.

## 5. Floor ranges

Doubt, Inner Critic and Panic have no maximum floor in the code, so they appear on every floor. The cards give floors 1 to 4 for each of them. Every other card floor matches the roster ([enemies.ts](../../../../src/content/tables/enemies.ts)). Question: keep the cards' bands (and add maximum floors to the roster), or keep the code's (and change the cards)? Recommended: the cards' bands, because the later lineage forms are what make the deeper floors new.

## 6. Card details on built projections that the code lacks

These are built projections; the rest of their card is not in the code. Each is an open question: keep it, or drop it from the card.

- **Inner Critic.** The ✗ ink marks on the floor for three seconds. The code has the ✗ only on its back.
- **Procrastination.** Its crates burn in fire and split it faster. The code has no element affinity for it.
- **Impulse.** The card says it leads its target to where you will be. The code aims at where you stand when it begins to crouch.
- **Distraction.** The card says it circles the nearest light and never looks at you. The code circles the player at three blocks.
- **Alarm.** The card says one Alarm in water calms the whole chain. The code calms only that one.
- **The Margin.** The card says three marks in a row join into a line that bolts across the room, and that water washes its marks away. The code has neither.
- **Paralysis.** The card says stepping behind a block breaks the tether, and that water loosens its root. The code has neither.
- **Resentment.** The card says its pools sting as well as slow, and that they dry up on release. The code only slows.
- **Gloom.** The card says the rain thins and a patch of floor dries on release. The file has no release.

## 7. Dwelling

Two built projections set a dwelling path, meaning that they keep to a liquid's cells: Undertow ([undertow.ts](../../../../src/content/enemies/undertow.ts)) and Sulk ([sulk.ts](../../../../src/content/enemies/sulk.ts)). The architecture notes say no projection dwells yet. Question: is dwelling built and the architecture note wrong, or should the paths be removed? Recommended: the code is the fact; the architecture note needs updating.

## 8. Overwhelm: projection or boss?

The element notes and the story list Overwhelm as a projection of deep water that pulls you down. The bestiary's bosses list it as a boss of the second zone. Question: a projection, a boss, or both? The bosses are the other writer's section; this question stays here until the owner rules.

## 9. Stagnation

The element notes name Stagnation as a future projection made of mud. It has no card and no code. See [STAGNATION.md](STAGNATION.md).

## 10. "Transformations": which meaning the owner wanted

The owner's word "transformations" (the bestiary's answer of 2026-10-27) was read as the lineage forms of projections: each pattern has three forms (see [ZONES](ZONES.md)). The states of being are a different system ([built/practices/states-of-being](../../built/practices/states-of-being/README.md)). The reading is not confirmed. Question: did the owner mean the lineage forms, or the states of being? Until the owner answers, the lineage forms are the reading.
