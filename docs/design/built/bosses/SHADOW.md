[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Shadow

Built, in part. Floor 9, the keystone of the frozen bottom. Code: `src/content/bosses/shadow.ts`, its mirror `src/content/bosses/mirror.ts`.

The Shadow is the player's own silhouette in the room's negative: the same height, the same hands, a jumper. In phase 1 it walks with the player, copying their movement, and fights with the practices the player holds: their shot, a beat later and cold, or their weapon. Its ending is not a fight to win by hitting: the player must stand still beside it.

- **Pattern:** everything you do not want to see in yourself. To be seen, and to come home.
- **Path:** all paths.
- **Health:** 1000 on floor 9.

## Phases

### Phase 1: mirrors

Each frame it copies the player's velocity (scaled to its speed), so it walks with the player and keeps pace. It also fights with the player's practices (see [The mirror](#the-mirror)): their shot a beat later, or the weapon that replaces it. Its contact hurts too.

- Arena: none on entering.

### Phase 2: reveals (from two thirds of its health)

Arena `mirrors`: toast only. It keeps copying the player's movement (with the mirrored top speed), and stops echoing the shot. Every six seconds it summons one random projection from the doubt, the critic and the panic, beside itself.

### Phase 3: stops (from one third of its health)

Arena `stop`: toast only. It stops fighting and comes home: no shot, no stroke. It walks slowly (under a block a second) to two blocks from the player, and stands there. If the player stands within 2.5 blocks of it, moving less than 0.2 blocks a second, for three seconds in a row, it is defeated. Stepping away resets the count. The stillness ending counts as turning it to your side: the achievement "Coming Home" (`boss.shadow.converted`).

## The mirror

Built for issue #339 (owner, 2026-11: the Mirror, "El Espejo", is this boss extended, not a new one).

**The snapshot.** The first moment the Shadow acts, it looks at the practices the player holds and keeps them for the whole fight. A practice picked up later, in the same room, changes nothing. Each practice is **copied** (the same effect with the same numbers, on its shot or its body), **adapted** (translated to a verb a boss has) or **skipped** (it has no meaning for a boss). Synergies and states of being count only between the practices it mirrors: a skipped practice adds to no state.

**Its shot.** Every so often its tell glows for a beat (0.45 s, a `windup` growl), then a volley leaves it toward the spot where the player stood when the tell began: one strand for each strand of the player's intention, fanned, at the player's shot speed and size. Its intentions are cold (negative polarity): like every hurting shot, a bolt is drawn in the attack red (DECISIONS §7.2). The first volley comes 1.5 seconds into the fight, so the player first sees it copy their step.

| Player's stat or practice | The Shadow's shot |
|---|---|
| Damage | A full strand deals 4 points (half a heart) at the base 3.5, scaled with the player's damage |
| Fire rate | Volleys a second: 0.35 of the player's fire rate (the base 2.7 gives about one a second) |
| Shot speed | Bolt speed: 9 blocks a second times the player's shot speed |
| Size | Bolt radius: 0.12 blocks times the player's size, drawn to match |
| Dual Process, Triangulation | One or two more strands at 60% |
| Rule of Three | Every strand becomes three at 70% |
| Spiral Growth | Two more strands at 40% |
| Inner Fire | +1.5 damage before scaling: its cold intentions burn |

**Its weapon.** A weapon practice gives it that weapon, cold and always telegraphed in the attack ramp:

- **Blade** (Cut Ties with Toxic Relationships): it keeps the shot, and when the player is within its reach (2.5 blocks times the player's size, at most 3.5) it strokes a line toward them: 0.4 s of warning, one strand's damage, at most once every 1.5 s.
- **Beam** (Remember Breathing): it replaces the shot. A line 12 blocks long toward the player, charged as the player's beam (2.7 ÷ fire rate seconds), never under 0.8 s, live for one second; one and a half strands' damage, a heart at most; 2.5 s of rest after.
- **Great cut** (both, the synergy One Clear Cut): it replaces the shot. A ring grows from its feet to about six blocks, low enough to jump, after 1.4 s of warning; a heart of damage; 4 s of rest after.

**Its body.** Movement practices change its top speed and its dodge, where its body has the verb:

- Move speed (Flow, Satori, states of being): its top speed times the player's move speed. Fartlek: times 1.45 more, so it keeps pace when the player runs.
- Irimi: its orbit becomes the player's dash: 4.5 blocks in 0.25 s, ready again after 1.2 s instead of 2.
- Jumps, air jumps, crouching and falls: skipped. Its body has no jump or crouch of its own.

**Caps.** A strong build still meets a fight it can win (the issue named Remember Breathing, the great cut and Kairos as the risks):

| Cap | Value | Why |
|---|---|---|
| Strand damage | 2 to 8 points | Never more than a heart a strand, never a harmless tickle |
| Volleys a second | 0.6 to 1.6 | The beat must stay readable; 1.6 is a doubled fire rate and more |
| Strands a volley | 5, the strongest first | Five lanes are the widest fan a player can still step between |
| Damage a second of its volleys | 12 points (a heart and a half) | Over it, its strand damage drops first (not under 2), then its rate. A full Meditations, Self-Reliance and Triangulation build lands here |
| Bolt speed | 6 to 13 blocks a second | Fast enough to matter, slow enough to see and step aside from after the beat |
| Bolt radius | 0.12 to 0.3 blocks | A giant intention is still a bolt you can pass |
| Top speed | 0.7 to 1.5 times its own | It keeps pace, never outruns |
| Beam charge | 0.8 to 2 s | The warning is always seen |
| Stroke damage | 8 points | One heart, as the strongest boss blows |
| Phases | Only phase 1 | Phase 2 belongs to the summons, phase 3 to the ending: the stillness ending is never under fire |

Kairos is not a risk: its stopped time is a miracle and is skipped. The boss's health is not changed by the mirror (it stays the floor's curve, `bossHp`).

**The fallback.** A player with no practices (or only skipped ones) meets the base mirror: one strand of 4 points about once a second (about 3.8 points a second), 9 blocks a second, after a visible beat, its own speed and its orbit. That is a fair fight for three hearts.

**Skipped, the documented list.** These have no meaning for a boss: meals and potions (the nourish practices that grow when you eat or drink), crafting and the recipe book, miracles, luck, keys and chest rewards, heart containers, invulnerability and other defences (the boss's life is its own, issue #315), healing and the checkpoint, blocks and mining, carrying, kicking and throwing, fire and lava underfoot, bombs, jumps and crouching, shot behaviours a bolt cannot carry (bounces, splits, homing, fire seeds), effects on other projections, and effects that would take the player's body out of their control. Harmful practices are not built (issue #340); when they are, they are not copied.

### Every practice

| Practice | Id | Mirror | Reason |
|---|---|---|---|
| Radical Acceptance | `acceptance` | skipped | Defence: blast immunity and a heart container |
| Affirmation | `affirmation` | skipped | World: places blocks |
| Aha Moment | `ahamoment` | skipped | Foes: arcs between projections; its only foe is you |
| Apprenticeship | `apprenticeship` | skipped | Crafting: brews and meals |
| Art Therapy | `arttherapy` | skipped | World: placing blocks heals |
| Child's Pose | `balasana` | skipped | Body: it has no crouch |
| Bilateral Stimulation | `bilateral` | copied | Fire rate ×2; the hand that casts has no meaning for its bolts |
| Bolt from the Blue | `boltfromtheblue` | skipped | Bombs |
| Book of Secrets | `bookofsecrets` | skipped | Crafting: the recipe book |
| Bounce Back | `bounceback` | skipped | Shot: its bolts do not bounce |
| Boundaries | `boundaries` | adapted | It holds back as you do: no shot and no stroke, only its body. Not in the catalogue today; classified so it is ready if it returns |
| Box Breathing | `boxbreathing` | skipped | Defence: a heart container |
| Breaking Bread | `breakingbread` | skipped | Meals |
| Symbolic Act | `catharsis` | skipped | World: thrown blocks |
| Chunking | `chunking` | skipped | Shot: its bolts do not split |
| Systemic Constellation | `constellation` | skipped | Foes: weakens projections as they appear |
| Controlled Burn | `controlledburn` | skipped | Bombs |
| Deep Focus | `deepfocus` | copied | Damage ×0.8 (mining has no target) |
| Dialectic | `dialectic` | skipped | Shot: bounces |
| Discharge | `discharge` | skipped | Body: it never falls |
| Distillation | `distillation` | skipped | Potions |
| Dowsing | `dowsing` | skipped | Shot: homing toward blocks |
| Dr. Launcher | `drlauncher` | skipped | Miracle |
| Dual Process | `dualprocess` | copied | One more strand at 60% |
| Exposure | `exposure` | skipped | World: wears blocks down |
| Eye Contact | `eyecontact` | skipped | Shot: homing a bolt at the player would leave no dodge |
| Fartlek | `fartlek` | adapted | Its top speed ×1.45: it keeps pace when you run |
| Firewalking | `firewalking` | skipped | World: fire underfoot |
| Flow | `flow` | copied | Move speed +30%, fire rate +0.5 |
| Forgiveness | `forgiveness` | skipped | Defence |
| Furoshiki | `furoshiki` | skipped | World: carrying |
| Grace Before Meals | `grace` | skipped | Meals |
| Gratitude Journal | `gratitude` | skipped | Luck |
| Grounding | `grounding` | skipped | World: kicks and reach |
| Habit Stacking | `habitstack` | skipped | World: blocks |
| Hara Hachi Bu | `harahachibu` | skipped | Meals |
| Herbal Lore | `herbalism` | skipped | Potions |
| Irimi | `irimi` | adapted | Its dodge becomes your dash (4.5 blocks, 1.2 s cooldown) |
| Kairos | `kairos` | skipped | Miracle: stopped time |
| Kaizen | `kaizen` | skipped | World: piercing blocks, reach |
| Remember Breathing | `kiai` | adapted | The beam, charged as yours, never under 0.8 s |
| Kindling | `kindling` | skipped | Defence: answers being hurt |
| Kinship | `kinship` | skipped | Life: heals from allies |
| Lion's Mane | `lionsmane` | skipped | Body: jumping and headbutts |
| Lucid Dream | `luciddream` | skipped | Miracle |
| As a Man Thinketh | `manthinketh` | copied | Damage ×1.5, shot speed +50% |
| Meditations | `meditations` | copied | Damage ×3 +2, within the caps |
| Mender's Thread | `menders-thread` | skipped | Defence |
| Mindful Eating | `mindfuleating` | skipped | Meals |
| Growth Mindset | `mindset` | skipped | Body: jumping |
| Nothing Personal | `nothingpersonal` | skipped | Defence |
| Nourishment | `nourishment` | skipped | Meals and potions |
| Cut Ties with Toxic Relationships | `occamsrazor` | adapted | The blade, beside its shot |
| Follow the Omens | `omens` | skipped | Loot |
| Post-Traumatic Growth | `posttraumatic` | skipped | World: lava |
| Pressure Valve | `pressurevalve` | skipped | Bombs |
| Stolen Fire | `prometheus` | skipped | Shot: fire seeds |
| Rapport | `rapport` | skipped | World: loose cubes |
| Reframing | `reframing` | skipped | Shot: bounces |
| Resonance | `resonance` | skipped | Shot: reads the intentions in flight |
| Rule of Three | `ruleofthree` | copied | Every strand three at 70% |
| Satori | `satori` | copied | Damage +1.5, fire rate +1, speed +30% |
| Second Brain | `secondbrain` | skipped | World: carrying, reach |
| Self-Compassion | `selfcompassion` | skipped | Defence: a heart container |
| Self-Efficacy | `selfefficacy` | skipped | Control: it would make you run away |
| Self-Reliance | `selfreliance` | copied | Fire rate ×2, damage +1.5 |
| Letters from a Stoic | `senecaletters` | skipped | World: carrying, kicks, throws |
| Serendipity | `serendipity` | skipped | Bombs and luck |
| Sleep Hygiene | `sleephygiene` | skipped | Defence |
| Socratic Questioning | `socratic` | skipped | Loot: keys |
| Solve et Coagula | `solvecoagula` | skipped | Miracle |
| Spagyric Art | `spagyric` | skipped | Potions |
| Spiral Growth | `spiralgrowth` | copied | Fire rate ×2, two more strands at 40% |
| Stoic Resolve | `stoic` | copied | Damage +2, size ×1.4 |
| Tao Te Ching | `taoteching` | skipped | World: piercing blocks |
| Tea Ceremony | `teaceremony` | skipped | Potions |
| Thinking, Waiting, Fasting | `thinkwaitfast` | skipped | Defence: range, invulnerability, luck |
| Thought Stopping | `thoughtstopping` | skipped | Control: it would freeze you |
| Triangulation | `triangulation` | copied | Two more strands at 60% |
| Triple Jump | `triple-jump` | skipped | Body: air jumps |
| Inner Fire | `tummo` | adapted | +1.5 damage to its cold strands, nothing set alight |
| Visualization | `visualization` | copied | Shot speed +30% (range has no meaning for a bolt) |
| Waymark | `waymark` | skipped | Life: a checkpoint |

A new practice without a row in the code's table fails `tests/shadow-mirror.test.ts`; the row here goes with it.

## Evasion

An orbit: you cannot shoot your own shadow. Shot while it stands still, it slides around the player for 0.35 seconds after a 0.25-second tell, keeping its distance, so standing still beside it still ends the fight. Cooldown 2 seconds (with a mirrored Irimi: 4.5 blocks in 0.25 seconds, cooldown 1.2). It does not answer the dodge with an attack, and it never repositions on its own. See [Fight flow](FIGHT-FLOW.md#evasion).

## Toasts

- Entering phase 2: "It reveals: the projections you let go rise as shadows".
- Entering phase 3: "It stops fighting: stand still beside it for three seconds".

## Defeat

Stillness is a defeat like any other: the boss room opens and the way down is cracked open after the usual delay. Floor 9 has no toll. The design's dark ring at the player's wrist, and the state "Shadow integrated", are not built.

## Open questions

- **Reveals.** The design summons the projections the player let go during this run, as shadows. The build summons three random basic patterns. Build the memory of the run?
- **Integration.** The design says the Shadow shrinks into the player's hands. The build removes it with the usual release.
- **Arena.** The design turns the frozen floor into mirrors when phase 2 starts. The build has only the toast.
- The mirror's own open questions, and the full design, are in [not-built/bosses/SHADOW.md](../../not-built/bosses/SHADOW.md).
