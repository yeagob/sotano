[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Shadow

Built, in part. Floor 9, the keystone of the frozen bottom. Code: `src/content/bosses/shadow.ts`, its mirror `src/content/bosses/mirror.ts`.

The Shadow is the player's own silhouette in the room's negative: the same height, the same hands, a jumper. It is the player's equal (issue #339, the Mirror, "El Espejo"): it has the player's health, it carries the player's practices and bombs, and it fights as a player does, moving, jumping, dashing, shooting and bombing. It has a second ending that is not a fight: the player stands still beside it.

- **Pattern:** everything you do not want to see in yourself. To be seen, and to come home.
- **Path:** all paths.
- **Health:** twice the player's health as it materialises, converted (see [Health](#health)). It is exempt from the boss health curve and the seeded life factor of the other bosses (#315), and it never takes a colour tier (#338).

## Health

The owner's rule: its life comes from the player's at entry, "a fight against someone as strong as you", and after the first playtest it is doubled (owner, 2026-11). As the Shadow materialises, a moment after the player enters, it takes the player's health in points (every heart and every layer over them), converts it, and doubles it (`LIFE_SCALE`, 2, one constant so it can change):

- **One heart of the player (8 points) is 7 of its life, times two: 14.** Two of the player's base shots (3.5 each) take one of its hearts, as two of its base strands (4 points each) take one of the player's.
- **Its hits are converted the other way.** Each point of the player's damage is 8/7 of a point on its side: the base 3.5 becomes its 4 (half a heart).

So, whatever the build, the player needs twice the comparable hits it needs: a player with six hearts and the base shot needs twenty-four hits to end it (84 of life), and it needs twelve strands to end the player. A player with ten hearts meets 140 of life. No practice changes its life when it appears (Systemic Constellation, which weakens every other projection, does not touch it). Its life is not the floor's curve (`bossHp`).

## The fight

There are no scripted phases and no fixed sequence. Each frame it scores every action it could take from the moment and takes the best one, if any scores high enough; otherwise it only moves. What it reads: how far the player is, its health and the player's (each as a share of its start), whether it was just hurt, the reach of its shot or weapon, its bombs and how strong they are, and every cooldown. Its choices are seeded, never random: the same build and the same moves give the same fight.

**How it moves.** It keeps the distance its weapon wants (about half its shot's range, three and a half to eight blocks; close to the player with the blade; close enough to bomb while it carries bombs and is not losing), strafing round the player and turning every few seconds. When it is losing (its share of health 15% under the player's), it fights from two blocks farther away. It walks away from its own bomb until it goes off.

**How it jumps and dashes.** Just hurt, it dashes sideways (with Irimi) or jumps. Close to the player it jumps, and with Irimi it dashes away when it is losing or toward the player when its blade is far out of reach. With air jumps (Triple Jump) it jumps again while falling. Some stretches of its strafing it hops.

**How it attacks.**

- **Shots.** It fires as the player does: as often as the player's own fire interval allows, while it moves, toward where the player is (where the player will be, with Eye Contact). No tell, no volley and no pause between shots: the only limit is the player's fire rate (owner, 2026-11: the limit was removed after the first playtest). Each shot is the full fan of the player's strands, cold (negative polarity), drawn in the attack red of every hurting shot (DECISIONS §7.2). Its bolts fly slower than the player's (9 blocks a second at the base), so each one can still be seen and stepped aside from.
- **Its first breath.** The first attack comes 1.5 seconds into the fight, so the player first sees it copy their step.
- **Bombs.** It carries the bombs the player carried at entry and spends them. Close to the player it drops one at its feet, and it is exactly the player's bomb: the same cube, look and fuse (1.8 s), which rolls, can be kicked and is set off by other blasts. It goes off as the player's does, with the player's bomb radius and block damage, and a heart to every actor in it, the Shadow included (owner, 2026-11: its bombs are ours). Its bomb upgrades add to the blast as they are mirrored (Controlled Burn +4 points, Bolt from the Blue +6). It never drops a white bomb: it is cold. Bigger bombs (Pressure Valve) make it reach for them sooner.
- **Missiles.** With Dr. Launcher, from five to twenty-four blocks away it lobs one of its bombs at the player: the landing is marked while it flies, and it bursts there.
- **Weapons.** See [The mirror](#the-mirror).

**The other ending.** Once its health falls to a third, a toast says how its other ending is reached ("It stops fighting: stand still beside it for three seconds"). From then on, whenever the player stands still (under 0.2 blocks a second), it stops attacking and walks slowly (under a block a second) to two blocks from the player. If the player stays within 2.5 blocks of it, still, for three seconds in a row, it is defeated. Moving again resets the count, and it fights again. The stillness ending counts as turning it to your side: the achievement "Coming Home" (`boss.shadow.converted`).

Its contact hurts too (a heart). It summons nothing: a player does not summon projections (the summons of doubt, the critic and panic were removed by issue #339).

## The mirror

**The snapshot.** The first moment the Shadow acts, it looks at the practices and the bombs the player holds and keeps them for the whole fight. A practice or a bomb picked up later, in the same room, changes nothing. Each practice is **copied** (the same effect with the same numbers, on its shot, its bombs or its body), **adapted** (translated to a verb a boss has) or **skipped** (it has no meaning in a fight). Synergies and states of being count only between the practices it mirrors: a skipped practice adds to no state. Each held copy adds its own stats, as in the inventory (a second Triple Jump adds one more air jump). There is no cap beyond the player's own power: equality is the point. Harmful practices are copied too: the mirror carries the player's burdens.

| Player's stat or practice | The Shadow |
|---|---|
| Damage | A full strand deals the player's damage times 8/7 (the base 3.5 gives 4 points) |
| Fire rate | The interval between two of its shots is the player's |
| Shot speed | Bolt speed: 9 blocks a second times the player's shot speed (slower than the player's own, to be read) |
| Range | Its shots reach 12 blocks times the player's range and shot speed |
| Size | Bolt radius: 0.12 blocks times the player's size, drawn to match |
| Move speed, running | Its top speed times the player's; Fartlek times 1.45 more |
| Jump, air jumps | Its jump rises 1.25 blocks times the player's jump; the player's air jumps |
| Dash | Irimi: it dashes 4.5 blocks in 0.25 s, ready again after 1.2 s |
| Missile | Dr. Launcher: it may lob a bomb as a missile |
| Bomb radius, bomb damage | Its bombs are the player's: the same radius and block damage |

**Its weapon.** A weapon practice gives it that weapon, cold and always telegraphed in the attack ramp:

- **Blade** (Cut Ties with Toxic Relationships): it keeps the shot, and when the player is within its reach (2.5 blocks times the player's size, at most 3.5) it strokes a line toward them: 0.4 s of warning, three strands' damage as the player's blade, at the player's blade interval.
- **Beam** (Remember Breathing): it replaces the shot. A line 12 blocks long toward the player, charged as the player's beam (2.7 ÷ fire rate seconds), never under 0.8 s, live for one second; three strands' damage; then it may charge again.
- **Great cut** (both, the synergy One Clear Cut): it replaces the shot. A ring grows from its feet to about six blocks, low enough to jump, after 1.4 s of warning; four strands' damage, as the player's; then it may cut again.

**The fallback.** A player with no practices meets the base mirror: single strands of 4 points at the player's base fire interval (2.7 shots a second), 9 blocks a second, on the move; its own speed, a jump of 1.25 blocks, its orbit, and as many bombs as the player carries. With three hearts it has 42 of life.

**Skipped, the documented list.** These have no meaning in a fight, or would act on the player rather than through the Shadow: meals and potions (the nourish practices that grow when you eat or drink), crafting and the recipe book, miracles that are neither a shot nor a movement (stopped time, walking through walls, turning lava), luck, keys and rewards (of rooms, chests and blasts) and pulling pickups, heart containers, invulnerability and answers to contact or blasts (the hearts are already in the player's health at entry, which is its life), healing and the checkpoint, blocks and mining, carrying, kicking and throwing, fire and lava underfoot, shots through blocks, crouching, shot behaviours a bolt cannot carry (bounces off blocks, intentions in flight), effects on other projections, and effects that would take the player's body out of their control.

### Every practice

| Practice | Id | Mirror | Reason |
|---|---|---|---|
| Radical Acceptance | `acceptance` | skipped | Defence: blast immunity; its heart is in your health |
| Affirmation | `affirmation` | skipped | World: places blocks |
| Aha Moment | `ahamoment` | skipped | Foes: arcs between projections; its only foe is you |
| Apprenticeship | `apprenticeship` | skipped | Crafting: brews and meals |
| Art Therapy | `arttherapy` | skipped | World: placing blocks heals |
| Child's Pose | `balasana` | skipped | Body: its body does not change height |
| Bilateral Stimulation | `bilateral` | copied | Fire rate ×2; the hand that casts has no meaning for its bolts |
| Bolt from the Blue | `boltfromtheblue` | adapted | Its bomb blasts hurt 6 more points (your arc, before converting) |
| Book of Secrets | `bookofsecrets` | skipped | Crafting: the recipe book |
| Bounce Back | `bounceback` | skipped | Shot: its bolts end on blocks |
| Boundaries | `boundaries` | adapted | Its shots and strokes deal nothing; its body and bombs remain. Not in the catalogue today; classified so it is ready if it returns |
| Box Breathing | `boxbreathing` | skipped | Defence: its heart is in your health |
| Breaking Bread | `breakingbread` | skipped | Meals |
| Symbolic Act | `catharsis` | skipped | World: thrown blocks |
| Chunking | `chunking` | adapted | Its split becomes two more strands at 50% |
| Systemic Constellation | `constellation` | skipped | Foes: weakens projections as they appear; never the Shadow's life |
| Controlled Burn | `controlledburn` | adapted | Its bomb blasts hurt 4 more points (your burn) |
| Deep Focus | `deepfocus` | copied | Damage ×0.8, a burden it carries too (mining has no target) |
| Dialectic | `dialectic` | adapted | Its split becomes two more strands at 50% |
| Discharge | `discharge` | adapted | Landing from a long jump sends a ring of 3 blocks, 4 points (converted) |
| Distillation | `distillation` | skipped | Potions |
| Double Jump | `double-jump` | copied | One more air jump |
| Dowsing | `dowsing` | skipped | World: curves toward blocks |
| Dr. Launcher | `drlauncher` | copied | It lobs its bombs as missiles |
| Dual Process | `dualprocess` | copied | One more strand at 60% |
| Exposure | `exposure` | skipped | World: wears blocks down |
| Eye Contact | `eyecontact` | adapted | It aims where you will be |
| Fartlek | `fartlek` | copied | Its top speed ×1.45 |
| Firewalking | `firewalking` | skipped | World: fire underfoot |
| Flow | `flow` | copied | Move speed +30%, fire rate +0.5 |
| Forgiveness | `forgiveness` | skipped | Defence: answers contact; its heart is in your health |
| Furoshiki | `furoshiki` | skipped | World: carrying |
| Grace Before Meals | `grace` | skipped | Meals |
| Gratitude Journal | `gratitude` | skipped | Luck |
| Grounding | `grounding` | skipped | World: kicks and reach |
| Habit Stacking | `habitstack` | skipped | World: blocks |
| Hara Hachi Bu | `harahachibu` | skipped | Meals |
| Herbal Lore | `herbalism` | skipped | Potions |
| Irimi | `irimi` | copied | Your dash: 4.5 blocks, 1.2 s cooldown; its dodge becomes the dash too |
| Kairos | `kairos` | skipped | Miracle: stopped time |
| Kaizen | `kaizen` | skipped | World: piercing blocks, reach |
| Remember Breathing | `kiai` | adapted | The beam, charged as yours, never under 0.8 s |
| Kindling | `kindling` | adapted | Hurt, it sends a ring of 2.5 blocks, 4 points (converted), at most every 2 s |
| Kinship | `kinship` | skipped | Life: heals from allies |
| Lion's Mane | `lionsmane` | copied | Jump ×2 (headbutts break blocks: no meaning for it) |
| Lucid Dream | `luciddream` | skipped | Miracle: through walls |
| As a Man Thinketh | `manthinketh` | copied | Damage ×1.5, shot speed +50% |
| Meditations | `meditations` | copied | Damage ×3 +2 |
| Mender's Thread | `menders-thread` | skipped | Defence |
| Mindful Eating | `mindfuleating` | skipped | Meals |
| Growth Mindset | `mindset` | copied | Jump ×1.7 |
| Nothing Personal | `nothingpersonal` | skipped | Defence |
| Nourishment | `nourishment` | skipped | Meals and potions |
| Cut Ties with Toxic Relationships | `occamsrazor` | adapted | The blade, beside its shot |
| Follow the Omens | `omens` | skipped | Loot |
| Post-Traumatic Growth | `posttraumatic` | skipped | World: lava |
| Pressure Valve | `pressurevalve` | copied | Bomb radius +0.8, block damage ×1.6 |
| Stolen Fire | `prometheus` | adapted | Every fifth shot is a fire seed: 5 more of your damage on its first strand |
| Rapport | `rapport` | skipped | World: loose cubes |
| Reframing | `reframing` | adapted | +25% damage (its bolts do not bounce) |
| Resonance | `resonance` | skipped | Shot: reads the intentions in flight |
| Rule of Three | `ruleofthree` | copied | Every strand three at 70% |
| Satori | `satori` | copied | Damage +1.5, fire rate +1, speed +30%, range, jump |
| Second Brain | `secondbrain` | skipped | World: carrying, reach |
| Self-Compassion | `selfcompassion` | skipped | Defence: its heart is in your health |
| Self-Efficacy | `selfefficacy` | skipped | Control: it would make you run away |
| Self-Reliance | `selfreliance` | copied | Fire rate ×2, damage +1.5 |
| Letters from a Stoic | `senecaletters` | skipped | World: carrying, kicks, throws |
| Serendipity | `serendipity` | skipped | Loot: blasts leave pickups |
| Sleep Hygiene | `sleephygiene` | skipped | Defence |
| Socratic Questioning | `socratic` | skipped | Loot: keys |
| Solve et Coagula | `solvecoagula` | skipped | Miracle: turns lava and water |
| Spagyric Art | `spagyric` | skipped | Potions |
| Spiral Growth | `spiralgrowth` | copied | Fire rate ×2, two more strands at 40% |
| Stoic Resolve | `stoic` | copied | Damage +2, size ×1.4 |
| Stretch | `stretch` | skipped | Loot: pulls keys, bombs and hearts on the floor to you; the Shadow picks nothing up |
| Tao Te Ching | `taoteching` | skipped | World: piercing blocks |
| Tea Ceremony | `teaceremony` | skipped | Potions |
| Thinking, Waiting, Fasting | `thinkwaitfast` | skipped | Defence: invulnerability, luck |
| Thought Stopping | `thoughtstopping` | skipped | Control: it would freeze you |
| Triangulation | `triangulation` | copied | Two more strands at 60% |
| Triple Jump | `triple-jump` | copied | Your air jumps (each rises as a ground jump) |
| Inner Fire | `tummo` | adapted | +1.5 damage to its cold strands, nothing set alight |
| Visualization | `visualization` | copied | Range ×1.6, shot speed +30% |
| Walk Slowly | `walk-slow` | skipped | Miracle: slowed time |
| Wall Jump | `wall-jump` | skipped | World: it needs a wall beside the body |
| Waymark | `waymark` | skipped | Life: a checkpoint |

A new practice without a row in the code's table fails `tests/shadow-mirror.test.ts`; the row here goes with it.

## Evasion

An orbit: you cannot shoot your own shadow while it stands. Shot while it stands still (rare: it strafes as it fires), it slides around the player for 0.35 seconds after a 0.25-second tell, keeping its distance, so standing still beside it can still end the fight; then it keeps strafing the way the slide took it. Cooldown 2 seconds (with a mirrored Irimi: 4.5 blocks in 0.25 seconds, cooldown 1.2). It does not answer the dodge with an attack, and it never repositions on its own. See [Fight flow](FIGHT-FLOW.md#evasion).

## Toasts

- Its health falls to a third: "It stops fighting: stand still beside it for three seconds".

## Defeat

Stillness is a defeat like any other: the boss room opens and the way down is cracked open after the usual delay. Floor 9 has no toll. The design's dark ring at the player's wrist, and the state "Shadow integrated", are not built.

## Open questions

- **Integration.** The design says the Shadow shrinks into the player's hands. The build removes it with the usual release.
- **Arena.** The design turns the frozen floor into mirrors. The build gives the Shadow its own room, the biggest a floor holds, with the fight started across it and cover all over it ([Arenas](ARENAS.md#the-shadows-room-built)); the mirrors are not built, and the phase at a third of its health changes nothing in the room.
- The mirror's own open questions, and the full design, are in [not-built/bosses/SHADOW.md](../../not-built/bosses/SHADOW.md).
