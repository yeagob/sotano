[Built](../README.md) · [Design](../../README.md)

# The bestiary (built)

Every creature, entity, presence and voice of The Roots in one document: where each one is, how it behaves, how the player answers it, what it leaves behind, how it grows or changes, and what it means in the story. Each entry has a screenshot taken in the game, from the sandbox at a fixed seed (see [How the pictures were taken](#how-the-pictures-were-taken)).

This document is an index and a reading guide. The full rules of each kind live in the document linked from its entry, and the code is the authority: every number here is read from `src/content/` (`enemies/`, `creatures/`, `bosses/`, `presences/`, `tables/enemies.ts`, `parts.ts`) and was checked against it when written. Where the meaning of an entity is not written down anywhere, its entry says **Meaning: not yet documented**.

## Contents

| Kind | Count | Section | What it is |
|---|---|---|---|
| Projections | 40 | [1](#1-projections) | Patterns that block intention, given a body of the room's own matter. Hostile until warmed to the player's side |
| Creatures | 13 | [2](#2-creatures) | The living things of the depths. Neutral: they never fight and never die |
| Bosses | 14 | [3](#3-bosses) | One per floor from a zone's pool, plus the Threshold Guardian and the Shadow as keystones |
| Presences | 3 | [4](#4-presences) | Immortal archetypes who speak in cards: the Listener, the Gardener (defined, not placed) and the Boundary |
| Voices | 1 | [5](#5-voices) | Speech with no body of its own: the Sanctuary's guided meditations |
| Sky guardians | 5 | [6](#6-the-sky-guardians) | The five deities of the sky tree, won by positive hits |
| Sky minions | 5 herds | [7](#7-the-sky-minions) | The animals of each sky floor, embodied as smaller creatures |

Sky entities live in the sky realm above the built tree; they are reached only after the giant tree is climbed. The hindrances of the sky (the kick, the gust, the fading platforms and so on) are attacks and terrain, not creatures, and are described in [sky/abilities](../sky/abilities/README.md).

## How to read an entry

Every entry gives the same fields, in this order:

- **Kind and floors.** Where it appears, from the roster (`src/content/tables/enemies.ts`) or the creature table (`src/content/creatures/index.ts`).
- **What it is.** The pattern it stands for, in one line. The code's `pattern` field is the source for the pattern name.
- **Behaviour.** How it moves and attacks, with its numbers.
- **The answer.** How the player deals with it. Good intentions (positive) warm a projection and turn it to the player's side at full warmth; bad intentions (negative) do full damage, and a projection killed this way releases.
- **What it gives.** The pickups it may drop when it dies, and the parts a release leaves.
- **Grows or changes.** Its later forms, splits, growth and turning.
- **Meaning.** Its meaning in the story, from the design documents. The naming and tone rules are in [story](../story/README.md).
- **Document.** The entity's own document, which holds the full card and open questions.

## Rules every entry follows

- **Release.** A projection killed by a negative intention releases. Its pickups come from its drop table (`drops`): a heart, a key or a bomb, each with its chance. It also rolls its four parts, named after it, one roll per kind: flesh 30%, mind 12%, heart 5%, essence 2% (`PART_CHANCE` in `src/content/parts.ts`). A rooted projection (a chance per floor, from 3% on floor 2 to 18% on floor 9) has 1.4 times the health and rolls its parts a second time. A part has no effect of its own; it sits in the inventory.
- **Turning.** A warm positive hit is half damage and raises the projection's warmth. At full warmth it becomes an ally on the player's side. An ally at zero health under a negative intention turns hostile again.
- **Creatures** are never killed. At zero health they hide until their room clears. They grow with warm love shots and never take part in a fight.
- **Presences** have no health that can be removed. A negative intention silences them within two blocks, until a positive intention passes near.
- **Bosses** fight in a sealed room and have three phases. Their pedestal practice and the toll for the way down are shared by every boss; see [the fight flow](../bosses/FIGHT-FLOW.md).

## How the pictures were taken

- **Method.** `npm run bestiary` (`scripts/bestiary-capture.mjs`) serves the game with Vite, opens the creative sandbox (`?sandbox=<scenario>`) in headless Chromium through Playwright, and for each entity: builds a plain room on one of its floors, spawns the entity in front of the player, faces the player at it, pauses the world, steps it two fixed ticks (enough for the room to build, few enough that the creature stays where it was placed), waits three seconds for the room mesh, then saves the game canvas as `img/<id>.png`. The sandbox has a fixed seed and a fixed step, so the same build gives the same pictures.
- **Bosses** stand in a larger room, eight blocks away, so that the whole body is in the frame.
- **Framing.** The title card, the debug readout and the toasts are hidden for the capture. The held hand is part of the player's view and is left in.
- **Not shown.** An entity with no body has no picture and says so in its entry. An entity the sandbox cannot spawn is listed in the gaps at the end of this document with the reason.

## Gaps and open questions (shared)

The list of entities whose meaning is not yet documented, and of entities that could not be captured, is at the end of this document in [Gaps](#gaps).

---


## 1. Projections

Forty projections: thirty-eight enemy files in `src/content/enemies/`, two of which (Procrastination B and C) are splits of a third, so forty entities. A projection is a pattern given a body; it mirrors the pattern, and it never speaks. Floors and weights are from `src/content/tables/enemies.ts`. "All floors" means the roster gives no floor range.

Every projection below releases on a negative kill and rolls the parts named after it (see [the rules](#rules-every-entry-follows)). Its pickup chances are listed as its drop table.

### Doubt

![Doubt](img/doubt.png)

- **Kind and floors:** projection; all floors (no range in the roster).
- **What it is:** self-doubt. It keeps you still, because still is safe. A medium, dark figure hunched over a sack of stones it drags.
- **Behaviour:** walks at you and stops for half a second every 1.4 seconds to reconsider. Within 1.5 blocks it reaches for you, then presses (4 damage). Within 2.2 blocks it lunges. It breaks the softest blocks in its way.
- **The answer:** its pauses are the moments to throw. Water keeps it out and slows it to 35 per cent.
- **What it gives:** pickups heart 12%, key 4%, bomb 5%; four parts.
- **Grows or changes:** Second-Guessing (floors 3 to 7) is its second form and Paralysis (floors 6 to 9) its third.
- **Meaning:** the pattern that keeps you safe by keeping you from acting. Its card is in [DOUBT.md](../projections/DOUBT.md).

### Inner Critic

![Inner Critic](img/critic.png)

- **Kind and floors:** projection; all floors (no range in the roster).
- **What it is:** the judging voice. It wants you to be accepted, so it judges you first.
- **Behaviour:** keeps about six blocks away: it backs off within five, approaches beyond eight, strafes in between. Within twelve blocks, every 2.4 seconds, it lobs a judgement at your head (4 damage) that stops at the first solid block. Its touch does 4.
- **The answer:** a block in the arc of a judgement stops it. Fire and lava do double harm to it; water slows it to 45 per cent.
- **What it gives:** pickups heart 10%, key 8%, bomb 6%; four parts.
- **Grows or changes:** Margin (floors 3 to 6) is its second form and Tribunal (floors 6 to 9) its third.
- **Meaning:** the voice that judges before anyone else can. It is a pattern, not a person.

### Panic

![Panic](img/panic.png)

- **Kind and floors:** projection; all floors, and a second roster entry from floor 3, so it is more common from floor 3 on.
- **What it is:** anxiety spiralling into panic, an alarm that rings when nothing is on fire.
- **Behaviour:** rushes at you. Within 2.2 blocks it swells over 0.9 seconds in three steps (the last white), then bursts with a reach of 2.2 blocks. It does no touch damage; the burst is its attack, announced by the swell.
- **The answer:** stay outside the burst while it swells. Water calms it for 2.5 seconds, even mid-swell. Fire and lava make it swell at once and keep it out.
- **What it gives:** pickups bomb 25%, heart 5%; four parts.
- **Grows or changes:** Alarm (floors 3 to 6) is its second form, and Dread (floors 6 to 9) its third.
- **Meaning:** the alarm that rings for no reason. Learn its swell, and a burst is never a surprise.

### Autopilot

![Autopilot](img/autopilot.png)

- **Kind and floors:** projection; floors 1 to 2.
- **What it is:** living by routine. It walks the same route and does not look up.
- **Behaviour:** walks a fixed square route of about eight by six blocks and ignores you. Within 1.6 blocks of the leg it is on, it marks the leg for 0.7 seconds and then charges along it. Its touch does 4. A block on the route stops it.
- **The answer:** step off the leg before it charges, or place a block on its route. It is easy to hit while it walks.
- **What it gives:** pickups heart 8%, bomb 6%; four parts.
- **Grows or changes:** no later form in the code.
- **Meaning:** the routine that carries on without being looked at.

### Craving

![Craving](img/craving.png)

- **Kind and floors:** projection; floors 1 to 2.
- **What it is:** wanting that never fills. "Just one more."
- **Behaviour:** keeps between about 2.2 and 4.5 blocks from you, circling. Every four seconds it opens a wind of radius five blocks for 2.5 seconds that drags players and other actors toward it. Loose cubes, bombs and pickups are not pulled. Its touch does 3.
- **The answer:** leave the wind's radius before it opens.
- **What it gives:** pickups bomb 10%, key 5%; four parts.
- **Grows or changes:** no later form in the code.
- **Meaning:** the pull that never ends by being fed.

### Impulse

![Impulse](img/impulse.png)

- **Kind and floors:** projection; floors 1 to 2.
- **What it is:** acting before thinking. It leaps before it has looked.
- **Behaviour:** within six blocks it crouches for 0.6 seconds. A ring marks the spot where you stood when it began to crouch and strikes there (4) when the crouch ends. It then leaps across the room in about 0.7 seconds and lands with a ring of its own (4). It waits about 2.2 seconds between leaps, and breaks the softest blocks around it.
- **The answer:** move after it starts to crouch: the first ring is where you stood, not where you are going. It is most vulnerable between leaps.
- **What it gives:** pickups heart 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the reflex that acts first and looks afterwards.

### Avoidance

![Avoidance](img/avoidance.png)

- **Kind and floors:** projection; floors 1 to 2.
- **What it is:** looking away from what hurts. "Not now."
- **Behaviour:** does not move and does not touch. It stays shut for three seconds, out of sight and not hittable. Within seven blocks it peeks out for 1.2 seconds and throws a shot, then shuts again.
- **The answer:** it can be hit only while it peeks. Wait for the peek.
- **What it gives:** pickups heart 7%, key 4%; four parts.
- **Grows or changes:** no later form in the code.
- **Meaning:** the eyes that close so nothing can be seen.

### Distraction

![Distraction](img/distraction.png)

- **Kind and floors:** projection; floors 1 to 5.
- **What it is:** scattered attention. "Ooh, what is that?"
- **Behaviour:** flies about three blocks around you, at eye height, changing its angle every 1.2 seconds. Every three seconds it stops, swells and flares its eyes for half a second (the telegraph), then darts through where you stood (2 damage) and rests open for a moment. It has 12 health.
- **The answer:** its path is erratic, so throw in a clear moment. Its darts are the only harm.
- **What it gives:** pickups heart 5%; four parts.
- **Grows or changes:** no later form. An ally keeps the player company and darts at hostile projections.
- **Meaning:** attention that is pulled to each new thing in turn.

### Procrastination

![Procrastination](img/procrastination.png)

- **Kind and floors:** projection; floors 2 to 5. It has 36 health and splits.
- **What it is:** putting things off. A slow, sleepy blob of three crooked crates.
- **Behaviour:** walks slowly and pauses for a second every 2.5 seconds. Its touch does 3. Every hit splits it: it shares its remaining health between two smaller Laters, each of which splits once more.
- **The answer:** each hit makes more of it, so a crowded room is the danger. Good intentions warm it; bad intentions do full damage.
- **What it gives:** no pickups; its four parts.
- **Grows or changes:** splits into [Procrastination B](#procrastination-b) and, from B, [Procrastination C](#procrastination-c). The later form is [Backlog](#backlog).
- **Meaning:** the work that multiplies when it is put off.

### Procrastination B

![Procrastination B](img/procrastination-b.png)

- **Kind and floors:** split only (the roster never rolls it); 18 health.
- **Behaviour:** a faster Later that pauses every 2.5 seconds. Its touch does 3. Every hit splits it into two of the smallest form.
- **What it gives:** no pickups; its parts are the Procrastination parts.
- **Meaning:** the work put off in two pieces.

### Procrastination C

![Procrastination C](img/procrastination-c.png)

- **Kind and floors:** split only (the roster never rolls it); 8 health.
- **Behaviour:** the fastest form, pauses every 2.5 seconds, touch 3. It does not split.
- **What it gives:** no pickups.
- **Meaning:** the smallest piece of the work put off.

### Undertow

![Undertow](img/undertow.png)

- **Kind and floors:** projection; floors 3 to 4.
- **What it is:** being overwhelmed. "It is too much."
- **Behaviour:** walks at you slowly; in water it keeps to the water cells and moves at 1.5 times its speed. Its touch does 4. Every four seconds it sends a wave of 8 damage across the room from side to side, announced by a 1.2-second lead. The wave does not push.
- **The answer:** move out of the wave's path.
- **What it gives:** pickups heart 8%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the feeling of being swept under by a full room.

### Rumination

![Rumination](img/rumination.png)

- **Kind and floors:** projection; floors 3 to 4.
- **What it is:** the thought that loops. "Again. Again. Again."
- **Behaviour:** moves through solid blocks like a ghost, toward you, slowly. Every four seconds, after a 0.9-second lead, it fires a line twelve blocks long (6 damage), live for 0.4 seconds. Its touch does 4.
- **The answer:** step off the line's path before it fires.
- **What it gives:** pickups bomb 10%, heart 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the loop of a thought that never leaves.

### Scarcity

![Scarcity](img/scarcity.png)

- **Kind and floors:** projection; floors 3 to 4.
- **What it is:** hoarding. "There will not be enough."
- **Behaviour:** drifts, and runs from you within about seven blocks. It goes for the nearest pickup in its room and takes it when within 1.2 blocks. While it carries something it keeps running. It does not touch.
- **The answer:** kill it to get back what it took. When it dies it drops everything it carried, plus one more pickup chosen at random.
- **What it gives:** pickups key 60%, bomb 40%, heart 30%, and what it carried; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the grip that keeps what it finds.

### Resentment

![Resentment](img/resentment.png)

- **Kind and floors:** projection; floors 3 to 4.
- **What it is:** the grudge. "I will not forget."
- **Behaviour:** walks at you slowly (touch 4). Every second it leaves a pool on the floor under it: a slowing field of about 0.8 blocks for five seconds. Every six seconds without a hit it grows: health and maximum rise by 20 per cent, to twice its base health at most. Any hit resets the count.
- **The answer:** hit it early, while it is small. Keep out of the pools.
- **What it gives:** pickups heart 10%; four parts.
- **Grows or changes:** it grows while it is left unhurt (see Behaviour).
- **Meaning:** a hurt kept in order, which grows the longer it is kept.

### Gloom

![Gloom](img/gloom.png)

- **Kind and floors:** projection; floors 3 to 4.
- **What it is:** a heavy mood. "Everything is grey."
- **Behaviour:** hovers about three blocks above where it appeared and does not move on its own. Every 0.7 seconds it throws a cold drop at a random point one to six blocks around your head (4 damage on landing); a drop stops at the first solid block. It never touches.
- **The answer:** keep moving. Reach it from height, from a gallery, or by building toward it.
- **What it gives:** pickups heart 6%, bomb 5%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the grey that hangs over a room and does not come down.

### Second-Guessing

![Second-Guessing](img/second-guessing.png)

- **Kind and floors:** projection; floors 3 to 7.
- **What it is:** the second form of Doubt: "Wait, are you really sure?"
- **Behaviour:** walks at you quickly and pauses for 0.8 seconds every 1.2 seconds. Within 1.5 blocks it reaches, then presses (4 damage). Within 2.2 blocks it lunges. Water keeps it out and slows it to 35 per cent.
- **The answer:** its pauses are the windows.
- **What it gives:** pickups heart 10%, key 5%, bomb 6%; four parts.
- **Grows or changes:** second form of [Doubt](#doubt).
- **Meaning:** the doubt that asks again and holds on longer.

### Alarm

![Alarm](img/alarm.png)

- **Kind and floors:** projection; floors 3 to 6.
- **What it is:** the second form of Panic. "Everyone, something is wrong!"
- **Behaviour:** rushes at you. Within 2.2 blocks it swells over 0.9 seconds and bursts with a reach of 2.2 blocks. Within four blocks of another Alarm or Panic it sets that one swelling after 0.4 seconds, so bursts chain through nearby kin. No touch damage.
- **The answer:** learn the three-step swell. Water calms it for 2.5 seconds. Fire and lava make it swell at once and keep it out.
- **What it gives:** pickups bomb 25%, heart 5%; four parts.
- **Grows or changes:** second form of [Panic](#panic); the third is [Dread](#dread).
- **Meaning:** the warning that spreads to everyone near it.

### Perfectionism

![Perfectionism](img/perfectionism.png)

- **Kind and floors:** projection; floors 3 to 6.
- **What it is:** "It has to be perfect." It is armoured in plates.
- **Behaviour:** walks at you slowly (touch 4). Its shell has six plates. While a plate stands, damage breaks the plate and does not reach the body, and the next plate takes the rest. Its body has 28 health.
- **The answer:** break the plates first, then the body.
- **What it gives:** pickups heart 10%, key 5%; four parts.
- **Grows or changes:** the earlier form of [Not Yet](#not-yet).
- **Meaning:** a standard that moves each time you reach it.

### Comparison

![Comparison](img/comparison.png)

- **Kind and floors:** projection; floors 3 to 6.
- **What it is:** measuring yourself against others. "They are ahead of you."
- **Behaviour:** keeps between four and six blocks away, strafing. Every two seconds it fires a bolt (4 damage) that stops at the first solid block. It does not touch. It has 60 health.
- **The answer:** cover from its bolts. Water keeps it out and slows it to 40 per cent.
- **What it gives:** pickups heart 8%; four parts.
- **Grows or changes:** the later form is [Hall of Mirrors](#hall-of-mirrors).
- **Meaning:** the ruler held against someone else.

### Margin

![Margin](img/margin.png)

- **Kind and floors:** projection; floors 3 to 6.
- **What it is:** the second form of the Inner Critic: "And another thing…"
- **Behaviour:** stands still and does not touch. Every three seconds, after a half-second lead, it marks the spot under you: a slowing field of about 1.2 blocks that stays eight seconds. It also fires a shot that stops at the first solid block.
- **The answer:** step off a mark. It stands still, so it is an easy target from a distance.
- **What it gives:** pickups heart 8%, key 5%; four parts.
- **Grows or changes:** second form of [Inner Critic](#inner-critic); the third is [Tribunal](#tribunal).
- **Meaning:** the criticism that adds one more point.

### Noise

![Noise](img/noise.png)

- **Kind and floors:** projection; floors 4 to 9.
- **What it is:** too many small things. "Ooh! And that! And that!"
- **Behaviour:** one fast, tiny flitter. It flits around its target at about three blocks, then stops, swells, and darts through where you stood (2 damage), like [Distraction](#distraction). It has eight health.
- **The answer:** time your intentions to its passes.
- **What it gives:** pickups heart 3%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the many small wishes to feel something, all at once.

### Reactivity

![Reactivity](img/reactivity.png)

- **Kind and floors:** projection; floors 5 to 6.
- **What it is:** reacting in anger. "How dare you!"
- **Behaviour:** walks toward you. Within nine blocks, when you are lined up with it on an axis, it aims for 0.7 seconds (a dashed line on the floor), then charges at high speed for up to 1.8 seconds (touch 4). It breaks softer blocks. When it hits something hard it is stunned for 1.5 seconds: that is the window. It waits about 1.2 seconds before it can charge again.
- **The answer:** stay off its axes, and put a placed block between you. Strike during the stun.
- **What it gives:** pickups heart 10%, bomb 10%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the reaction that comes before the thought.

### Sulk

![Sulk](img/sulk.png)

- **Kind and floors:** projection; floors 5 to 6.
- **What it is:** sullenness. "Fine."
- **Behaviour:** stays in water and does not move; it keeps to water cells and walks at half speed in them. Every four seconds, when you are within three blocks, it sends a slowing field of about 2.5 blocks for three seconds. It never chases and does not touch. It has 36 health.
- **The answer:** stay beyond three blocks and it will not reach you.
- **What it gives:** pickups heart 8%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the hurt that does not say so, and does not chase.

### The Shoulds

![The Shoulds](img/shoulds.png)

- **Kind and floors:** projection; floors 5 to 6.
- **What it is:** rigid rules. "I should… I should…"
- **Behaviour:** stands still and does not touch. Every 2.2 seconds it fires a bolt (4 damage) along the axis on which you are farther from it. It has 32 health.
- **The answer:** stay off its axis, or put a block between you.
- **What it gives:** pickups heart 6%, bomb 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the rules that fire along the lines they have drawn.

### Dogma

![Dogma](img/dogma.png)

- **Kind and floors:** projection; floors 5 to 6, rare (roster weight one).
- **What it is:** a belief set in stone. "It has always been this way."
- **Behaviour:** stands still and does not touch. It has 120 health and armour 0.2, so it takes 80 per cent of a hit. Every five seconds it sets a field of three blocks around itself for four seconds. The field's effect depends on its health: above half, it mutes your casting; between a quarter and a half, it slows you; below a quarter, it stings for 2 damage each second.
- **The answer:** keep out of the field and watch the effect change as its health falls.
- **What it gives:** pickups heart 10%, key 6%; four parts.
- **Grows or changes:** the field's effect changes at half and a quarter of its health.
- **Meaning:** the rule carved in stone, simpler than the world.

### Backlog

![Backlog](img/backlog.png)

- **Kind and floors:** projection; floors 5 to 9.
- **What it is:** the later form of Procrastination: "I will get to all of it. Later."
- **Behaviour:** walks slowly and pauses for a second every three seconds. Its touch does 4. Every three seconds, while it has a target, it throws a crate that flies in an arc and stops at the first solid block. It has 120 health.
- **The answer:** keep out of the arc of the crates; use blocks as cover.
- **What it gives:** pickups bomb 20%, key 10%, heart 10%; four parts.
- **Grows or changes:** later form of [Procrastination](#procrastination).
- **Meaning:** the stack that is always about to topple.

### Tribunal

![Tribunal](img/tribunal.png)

- **Kind and floors:** projection; floors 6 to 9.
- **What it is:** consensus. "We have all agreed."
- **Behaviour:** one body with three posts, which speak in turn. It stands still and does not touch. Every 1.2 seconds it fires a bolt (4 damage) from one of three posts, two and a half blocks apart, in turn: left, centre, right. It has 144 health.
- **The answer:** use blocks as cover and step between the posts' lines.
- **What it gives:** pickups heart 10%, key 6%, bomb 8%; four parts.
- **Grows or changes:** third form of [Inner Critic](#inner-critic).
- **Meaning:** the one voice that sounds like everyone, repeated.

### Dread

![Dread](img/dread.png)

- **Kind and floors:** projection; floors 6 to 9.
- **What it is:** the third form of Panic: "Something will go wrong."
- **Behaviour:** stands still and does not touch. Every three seconds, after a 0.8-second lead, it sends a ring out from its body: 8 damage, 1.4 blocks high, growing to about 4.6 blocks across the room in 0.8 seconds. It has 80 health.
- **The answer:** stay out of the ring's path, or let it pass over you by its height.
- **What it gives:** pickups heart 8%, key 5%; four parts.
- **Grows or changes:** third form of [Panic](#panic).
- **Meaning:** waiting for the bad thing, always.

### Not Yet

![Not Yet](img/not-yet.png)

- **Kind and floors:** projection; floors 6 to 9.
- **What it is:** "Not yet. Not yet. Not yet." It mends itself toward a finish it never reaches.
- **Behaviour:** walks at you slowly (touch 4). It is armoured: it takes 30 per cent of any hit. When it has not been hit for four seconds it heals two health every four seconds. It has 80 health.
- **The answer:** keep the pressure on so that it never has four seconds without a hit. Its armour applies after the warmth.
- **What it gives:** pickups heart 10%, key 6%, bomb 8%; four parts.
- **Grows or changes:** later form of [Perfectionism](#perfectionism).
- **Meaning:** the repair that never finishes.

### Paralysis

![Paralysis](img/paralysis.png)

- **Kind and floors:** projection; floors 6 to 9.
- **What it is:** the third form of Doubt: "Do not move."
- **Behaviour:** does not walk and does not touch. Every three seconds, after a 0.6-second lead, it tethers: a pull of seven blocks drags you toward it for 2.5 seconds, and a slowing field of about 2.2 blocks on the same spot slows you. It has 100 health.
- **The answer:** it stands still, so choose the moment. Leave its radius before you throw, since its pull drags you back.
- **What it gives:** pickups heart 10%, key 5%; four parts.
- **Grows or changes:** third form of [Doubt](#doubt).
- **Meaning:** the stop that holds you where you stand.

### Hall of Mirrors

![Hall of Mirrors](img/hall-of-mirrors.png)

- **Kind and floors:** projection; floors 7 to 9.
- **What it is:** the third form of Comparison: "Everyone is ahead of you."
- **Behaviour:** stands still and does not touch. Every 2.6 seconds it fires three bolts (4 damage each) from three points beside its body. A bolt stops at the first solid block. It has 44 health; its budget cost is five, the highest on the roster.
- **The answer:** keep out of the lines of its bolts; use blocks as cover.
- **What it gives:** pickups heart 8%, key 6%; four parts.
- **Grows or changes:** third form of [Comparison](#comparison).
- **Meaning:** a shot that comes back from somewhere else.

### Burnout

![Burnout](img/burnout.png)

- **Kind and floors:** projection; floors 7 to 8.
- **What it is:** running past empty. "I cannot stop."
- **Behaviour:** walks at you. Its speed rises with time, to about 2.2 times its base speed after eight seconds of running. Then it is spent for three seconds: it stands still and leaves a slowing field of about 0.9 blocks. It walks again at 80 per cent of its base speed. Touch 4; 52 health.
- **The answer:** its spent period is the moment to strike; do not let the fight run long. Fire does not harm it; lava keeps it out.
- **What it gives:** pickups heart 10%, bomb 8%; four parts.
- **Grows or changes:** speeds up while it runs, then stops.
- **Meaning:** the pace kept up past the point of rest.

### Spark

![Spark](img/spark.png)

- **Kind and floors:** projection; floors 7 to 8.
- **What it is:** always on edge. "Is that? What was that?"
- **Behaviour:** walks at you quickly and pauses 0.6 seconds every two seconds. Every three seconds, while it has a target, it fires an arc: a line from its body to you, announced for 0.7 seconds, live for 1.5 seconds, doing 4 damage. Its touch does 2. It has 24 health.
- **The answer:** step out of the arc's line.
- **What it gives:** pickups bomb 10%, heart 5%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the alertness that cannot be caught off guard.

### Pretence

![Pretence](img/pretence.png)

- **Kind and floors:** projection; floors 7 to 8.
- **What it is:** the mask. "I am fine."
- **Behaviour:** walks at you quickly and lunges when you come close. Its touch does 6, the highest contact damage of the built projections. It has 32 health. It is always visible: nothing starts its disguise, so it never hides.
- **The answer:** it comes straight at you, so intentions and blocks are the answer.
- **What it gives:** pickups heart 10%, key 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the smile worn so that no one asks.

### Shortcut

![Shortcut](img/shortcut.png)

- **Kind and floors:** projection; floors 7 to 8 (roster weight one).
- **What it is:** cutting corners. "There is an easier way."
- **Behaviour:** flees when you come within about five blocks and otherwise drifts. Within four blocks, every four seconds, it swings a short ring: 6 damage, announced 0.6 seconds, growing to about two blocks across. It does not touch. It has 18 health.
- **The answer:** it is fragile; a few hits end it. Keep out of the ring's reach when you close in.
- **What it gives:** pickups key 10%, bomb 10%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the way that skips the work.

### Numbness

![Numbness](img/numbness.png)

- **Kind and floors:** projection; floor 9.
- **What it is:** not feeling anything. "I do not feel anything."
- **Behaviour:** walks slowly (touch 4). Every three seconds it leaves a slowing field of about 2.5 blocks where it stands, for three seconds. In water it crosses at 70 per cent speed. It has 60 health.
- **The answer:** keep out of its field and keep moving.
- **What it gives:** pickups heart 10%, key 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the freeze that keeps anything from hurting.

### Cynicism

![Cynicism](img/cynicism.png)

- **Kind and floors:** projection; floor 9.
- **What it is:** giving up before trying. "What is the point?"
- **Behaviour:** stands still and backs away from anyone within five blocks. Every four seconds it opens a ring of three blocks around itself for four seconds. Inside the ring you cannot cast, and the mute lasts 0.4 seconds after you leave. It does not touch. It has 52 health.
- **The answer:** stay out of the ring and cast from outside it.
- **What it gives:** pickups heart 8%, bomb 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the decision made before the attempt.

### Isolation

![Isolation](img/isolation.png)

- **Kind and floors:** projection; floor 9.
- **What it is:** withdrawing. "Leave me alone."
- **Behaviour:** stands still (touch 4; 72 health). Its first shot, after about three seconds, raises one wall of breakable ice across the middle of the room, two blocks high. It does this once per fight.
- **The answer:** break the wall or go around it.
- **What it gives:** pickups heart 10%, key 5%; four parts.
- **Grows or changes:** one wall, once.
- **Meaning:** the walls built so that no one can reach it.

### What If

![What If](img/what-if.png)

- **Kind and floors:** projection; floor 9.
- **What it is:** regret. "What if I had…"
- **Behaviour:** hovers a little above the floor and drifts toward you slowly, passing through solid blocks. Every four seconds it fires a bolt that stops at the first solid block. Touch 4; 68 health.
- **The answer:** cover does not stop it, only its bolts.
- **What it gives:** pickups heart 8%, key 6%; four parts.
- **Grows or changes:** no later form.
- **Meaning:** the past kept close.

---


## 2. Creatures

Thirteen creatures, in `src/content/creatures/`, placed as ambient life by `CREATURE_LIFE` in `src/content/creatures/index.ts`. They are neutral: no projection hunts them and they hunt nothing. None drops a pickup or a part. Shared rules (growth from warm love shots, hiding instead of dying, the growth gift, the seal and clear) are in [creatures/README.md](../creatures/README.md).

### Wonder

![Wonder](img/wonder.png)

- **Kind and floors:** creature; floor 0, two to four in the roots.
- **What it is:** curiosity that leads down. A small moth of pale paper.
- **Behaviour:** flees the player within four blocks, drifts about 1.1 blocks above the surface, turns off walls. Never touches, never fights. Health 3.
- **The answer:** both polarities. A positive intention heals it; a negative one sends it into the blocks until its room clears.
- **What it gives:** nothing on death (it hides). It can give the floor-0 growth gift (see the rules in [creatures](../creatures/README.md)).
- **Grows or changes:** grows with warm love shots, up to three times its birth size.
- **Meaning:** the first creature the player sees; it tells the player the roots are alive. Its document: [WONDER.md](../creatures/WONDER.md).
- **Gap:** the creature's code sets `minFloor` to 99 while the spawn table places it on floor 0. The table decides placement; the field is unused.

### Rootling

![Rootling](img/rootling.png)

- **Kind and floors:** creature; floor 0, two to three.
- **What it is:** curiosity. A tiny root-shaped creature on two short legs.
- **Behaviour:** wanders, changes direction every one to three seconds, keeps two to six blocks from the player. Health 4. Both polarities.
- **Grows or changes:** growth as every creature.
- **Meaning:** the design has it burrow toward hidden pockets; the build only wanders. Its document: [ROOTLING.md](../creatures/ROOTLING.md).

### Mossling

![Mossling](img/mossling.png)

- **Kind and floors:** creature; floor 0, two to three.
- **What it is:** rest. A round moss creature asleep on the floor.
- **Behaviour:** the slowest creature. Comes toward the player beyond four blocks, steps back inside one and a half. Health 6.
- **The answer:** answers positive intentions only; a negative intention passes through it. Rest beside it: stand still within 2.5 blocks for three seconds and it heals the player a quarter of a heart, once per Mossling.
- **Meaning:** the first creature that answers only positive intentions. Its document: [MOSSLING.md](../creatures/MOSSLING.md).

### Chirper

![Chirper](img/chirper.png)

- **Kind and floors:** creature; floors 1 to 2, two to three.
- **What it is:** the gut feeling: a cellar cricket with two glowing eyes.
- **Behaviour:** drifts 0.6 blocks above the surface, keeps two and a half to six blocks away. Every 2.6 seconds it chirps (a pair of tones) if its room holds no blocking projection. Health 3. Both polarities.
- **What the player can do:** listen. A room that chirps is safe; a silent room holds a projection.
- **Meaning:** the body sense that warns before the mind does. Its document: [CHIRPER.md](../creatures/CHIRPER.md).

### Delver

![Delver](img/delver.png)

- **Kind and floors:** creature; floors 1 to 3, one or two per floor.
- **What it is:** play. A small digger with a cap of dirt on its back.
- **Behaviour:** wanders, stays two to five blocks away. Health 5. Both polarities. The design's tunnels and digging are not built.
- **Meaning:** play, and a sign of soft ground in the design. Its document: [DELVER.md](../creatures/DELVER.md).

### Leafling

![Leafling](img/leafling.png)

- **Kind and floors:** creature; floors 1 to 5, one or two per floor.
- **What it is:** wonder. A flat leaf-shaped light with one glowing point.
- **Behaviour:** floats about 1.2 blocks above the floor, two to five blocks from the player. Health 3.
- **The answer:** positive intentions only.
- **Meaning:** the design sends it to the Tree above the surface, which is not built. Its document: [LEAFLING.md](../creatures/LEAFLING.md).

### Star-mite

![Star-mite](img/star-mite.png)

- **Kind and floors:** creature; floors 1 to 5, one or two per floor.
- **What it is:** joining what is apart. A dark mite with three glowing points in a triangle, like a constellation.
- **Behaviour:** drifts about two blocks above the floor. Health 2.
- **The answer:** positive intentions only.
- **Meaning:** the three points are the one place a creature shows a constellation. Its document: [STAR-MITE.md](../creatures/STAR-MITE.md).

### Bubbler

![Bubbler](img/bubbler.png)

- **Kind and floors:** creature; floors 3 to 4, one or two per floor.
- **What it is:** breath, the body's rhythm. A small deep-water fish with a dark tail and a pale head.
- **Behaviour:** lives in water and hovers 0.8 blocks above the surface. Stays two to five blocks from the player. Health 4. Both polarities. It does not make bubbles yet.
- **Meaning:** a sign of deep water in Zone II. Its document: [BUBBLER.md](../creatures/BUBBLER.md).

### Ferryback

![Ferryback](img/ferryback.png)

- **Kind and floors:** creature; floors 3 to 4, exactly one per floor.
- **What it is:** being carried. A slow, broad creature of deep water with a flat, pale back.
- **Behaviour:** the largest creature, drifts across a pool 0.4 blocks above the surface, keeps three to six blocks away. Health 14, the most of any creature. Both polarities.
- **Meaning:** the design has it carry the player across deep water; in the build it cannot be ridden. Its document: [FERRYBACK.md](../creatures/FERRYBACK.md).

### Drifter

![Drifter](img/drifter.png)

- **Kind and floors:** creature; floors 5 to 6, one or two per floor.
- **What it is:** lightness. A flat pale plate with a low dome on its back.
- **Behaviour:** hovers about 2.2 blocks above the floor, three to seven blocks from the player. Health 5. Both polarities. It does not yet carry the player up.
- **Meaning:** it marks the height of a tall room. Its document: [DRIFTER.md](../creatures/DRIFTER.md).

### Inkmite

![Inkmite](img/inkmite.png)

- **Kind and floors:** creature; floors 5 to 6, two or three per floor.
- **What it is:** letting things go. A tiny mite black as ink.
- **Behaviour:** scurries about the floor, stays one and a half to four blocks away. Health 2, the least of any creature. Both polarities.
- **Meaning:** the design has it eat the judgements of the Lectern and the Margin; the build only wanders. Its document: [INKMITE.md](../creatures/INKMITE.md).

### Cinderwalker

![Cinderwalker](img/cinderwalker.png)

- **Kind and floors:** creature; floors 7 to 8, one or two per floor.
- **What it is:** walking through fire without being consumed.
- **Behaviour:** walks across fire and lava, which do not harm it. Health 6. Both polarities.
- **Meaning:** the Furnace's answer to fire. Its document: [CINDERWALKER.md](../creatures/CINDERWALKER.md).

### Huddler

![Huddler](img/huddler.png)

- **Kind and floors:** creature; floor 9, two or three.
- **What it is:** warmth shared. A small round creature with a rim of frost.
- **Behaviour:** walks slowly on ice and across water, stays one and a half to three blocks from the player. Health 4.
- **The answer:** positive intentions only; a negative intention passes through it.
- **Meaning:** the only warm life of the frozen floor. Its document: [HUDDLER.md](../creatures/HUDDLER.md).

## 3. Bosses

Fourteen bosses in `src/content/bosses/`. Each floor draws its boss from its zone's pool by the run's seed; a boss already fought in the run is not drawn again. Floor 5 (The Threshold Guardian) and floor 9 (The Shadow) are keystones with a fixed boss. Shared rules: [fight flow](../bosses/FIGHT-FLOW.md) (the seal, the rise, the three phases, defeat, the toll) and [arenas](../bosses/ARENAS.md).

**What a boss gives.** A boss is defeated at zero health, at full warmth from positive intentions, or (the Shadow) by standing still beside it. Any defeat opens the boss room, places the boss's practice on its pedestal (drawn by the floor's seed from the pedestal pool, `revealBossItem` in `src/game/game.ts`) and cracks open the way down. Floors 1 to 8 ask a toll first; floor 9 has none. No boss drops pickups or parts.

Each boss is shown in a larger room, from eight blocks away.

### Resistance

![Resistance](img/resistance.png)

- **Kind and floors:** boss; floors 1 to 2, Zone I pool. Health 140 on floor 1, 179 on floor 2. Path: Will.
- **What it is:** the force that stops creative work. A slab of brick on two short legs, with two dim eyes under its lintel.
- **Phases:** (1) rams and stamps, charges and shockwaves, cube barrage. (2, from two thirds of health, arena `walls`) walls rise down the centre, double rams and shockwaves through them. (3, from one third, arena `rockfall`) it stops walking and sits; leaps, stone slams and a triple shockwave.
- **Document:** [RESISTANCE.md](../bosses/RESISTANCE.md). Meaning: the pattern is named for an everyday idea, not a person.

### Inertia

![Inertia](img/inertia.png)

- **Kind and floors:** boss; floors 1 to 2, Zone I pool. Health 140 or 179. Path: Body.
- **What it is:** staying as you are. Rest that became a stop.
- **Behaviour:** asleep in the middle of the room until its body moves faster than 1.5 blocks a second; then it rolls at the player and bounces off walls. Phases: rolls and clods; faster rolls with stones (arena `rockfall`); cubes shed and inhales (arena `spill`).
- **Document:** [INERTIA.md](../bosses/INERTIA.md).

### The Insatiable

![The Insatiable](img/insatiable.png)

- **Kind and floors:** boss; floors 1 to 2, Zone I pool. Health 140 or 179. Path: Body.
- **What it is:** craving, grown old. A giant open cup of stone with a maw at floor level. It never walks: the room comes to it.
- **Phases:** inhales that pull everything in and spit bolts and cubes; a spitting phase (arena `spill`); a hollow phase (arena `rockfall`) of shockwaves, spirals and stones.
- **Document:** [INSATIABLE.md](../bosses/INSATIABLE.md).

### Overwhelm

![Overwhelm](img/overwhelm.png)

- **Kind and floors:** boss; floors 3 to 4, Zone II pool. Health 229 on floor 3, 293 on floor 4. Path: Emotion.
- **What it is:** too much at once. A tide with a face of foam that surges and sends waves across the room.
- **Phases:** surges and tides; water rising to level three (arena `flood`), crossing tides; water draining (arena `drain`), tides on both axes.
- **Document:** [OVERWHELM.md](../bosses/OVERWHELM.md).

### The Hoard

![The Hoard](img/hoard.png)

- **Kind and floors:** boss; floors 3 to 4, Zone II pool. Health 229 or 293. Path: Will.
- **What it is:** holding on to everything. A mound of crates, stones and bundles that rolls weights across the room and pulls loose things back to its pile.
- **Phases:** weights and bars; clutches and barrages (arena `rockfall`); a burst with novas and bolts (arena `spill`). The weakest boss against breaking blocks.
- **Document:** [HOARD.md](../bosses/HOARD.md).

### The Downpour

![The Downpour](img/downpour.png)

- **Kind and floors:** boss; floors 3 to 4, Zone II pool. Health 229 or 293. Path: Emotion, grown old.
- **What it is:** a cloud that keeps the room grey. A ceiling of cloud the size of the arena that rains drops and puddles on where the player is going.
- **Phases:** rains at 3.5 blocks up; comes down to 2.4 blocks with lightning bar grids (arena `puddle`); thins to 1.6 blocks (arena `drain`). It can be reached low.
- **Document:** [DOWNPOUR.md](../bosses/DOWNPOUR.md).

### The Threshold Guardian

![The Threshold Guardian](img/threshold-guardian.png)

- **Kind and floors:** boss; floor 5, the keystone of the great pit. Health 374. Path: all paths.
- **What it is:** the fear at the edge of change. A tall gate of stone with two pillars and a lintel.
- **Phases:** bars that close in; volleys from six blocks (arena `rockfall`); charges and crushes (arena `rockfall`).
- **Document:** [THRESHOLD-GUARDIAN.md](../bosses/THRESHOLD-GUARDIAN.md). The design's second route of light is not built.

### Verdict

![Verdict](img/verdict.png)

- **Kind and floors:** boss; floor 6, Zone III pool. Health 478. Path: Mind.
- **What it is:** the Tribunal grown old: a long bench of ledger stone with seven lecterns.
- **Phases:** bolts at the player's position; slowing fields dropped at seeded points; a charge with a stun on hitting a wall.
- **Document:** [VERDICT.md](../bosses/VERDICT.md). Built in part.

### The Grudge

![The Grudge](img/grudge.png)

- **Kind and floors:** boss; floor 6, Zone III pool. Health 478. Path: Emotion.
- **What it is:** resentment grown old. Something huge under the marsh, showing only a back of mud and two eyes.
- **Phases:** surfaces at a point the player is not on; erupts from two seeded points; charges with a stun.
- **Document:** [GRUDGE.md](../bosses/GRUDGE.md). Built in part.

### The Old Rule

![The Old Rule](img/old-rule.png)

- **Kind and floors:** boss; floor 6, Zone III pool. Health 478. Path: Mind.
- **What it is:** a belief from childhood. A tall stone tablet with two dim eyes that issues rules: a mute field, a slow field, and a column of force where the player is standing when a rule is broken.
- **Phases:** commands every four seconds; enforcement rings (arena `drop`); charges (arena `crumble`, toast only).
- **Document:** [OLD-RULE.md](../bosses/OLD-RULE.md). Built in part.

### The Furnace

![The Furnace](img/furnace.png)

- **Kind and floors:** boss; floors 7 to 8, Zone IV pool. Health 612 on floor 7, 782 on floor 8. Path: Will.
- **What it is:** Burnout grown old. A great furnace of obsidian and brick with a mouth for a door.
- **Phases:** pulls the player in every five seconds; fire over the floor and bolts (arena `fire`); rings of fire from its body.
- **Document:** [FURNACE.md](../bosses/FURNACE.md). Built in part.

### The Impostor

![The Impostor](img/impostor.png)

- **Kind and floors:** boss; floors 7 to 8, Zone IV pool. Health 612 or 782. Path: Emotion.
- **What it is:** fear of being found out. A hollow frame of brass with a smile too wide for it; a small real figure is inside.
- **Phases:** charges; summons two projections every six seconds; rings of force from its body.
- **Document:** [IMPOSTOR.md](../bosses/IMPOSTOR.md). Built in part.

### The Many Faces

![The Many Faces](img/many-faces.png)

- **Kind and floors:** boss; floors 7 to 8, Zone IV pool. Health 612 or 782. Path: Emotion.
- **What it is:** a face for everyone. A cube with two bright eyes and a ring of masks.
- **Phases:** summons projections every six seconds; swaps place on a ring; rings of force.
- **Document:** [MANY-FACES.md](../bosses/MANY-FACES.md). Built in part.

### The Shadow

![The Shadow](img/shadow.png)

- **Kind and floors:** boss; floor 9, the keystone of the frozen bottom. Health 1000. Path: all paths.
- **What it is:** everything you do not want to see in yourself: the player's silhouette in the room's negative.
- **Phases:** copies the player's movement (no attack of its own); from two thirds of health it summons projections from the doubt, critic and panic families every six seconds; from one third it stops, and standing still beside it for three seconds defeats it.
- **Document:** [SHADOW.md](../bosses/SHADOW.md). Its defeat has no toll.

## 4. Presences

Three presences. They are immortal, never gods or people, and never give orders; a negative intention within two blocks silences the ones that stay. Shared rules: [presences/README.md](../presences/README.md).

### The Listener

![The Listener](img/listener.png)

- **Kind and floors:** presence; one per floor from 1 to 5, placed in a quiet normal room with no projections (floor 0 has none).
- **What it is:** being heard. A pale stone figure of bone, a tall column with a paper-coloured head and two small side plates.
- **Behaviour:** a body the player cannot walk through. Within about two blocks, it asks whether the player will give the first heart of a released pattern in the carried hand, and says nothing until then. Refusal changes nothing. Accepting takes only that heart.
- **The answer:** positive intentions only. It has one health point that nothing removes. It leaves in the same frame as its reward.
- **What it gives:** a reward rolled 15/75/10: a practice with a maximum-health stat (15%), special hearts (75%), or two red hearts (10%).
- **Grows or changes:** it leaves once it has dropped the reward; the floor holds none afterwards.
- **Meaning:** the first presence the player meets, and what it offers is being heard. Its lines are in [section 5](#5-voices). Its document: [LISTENER.md](../presences/LISTENER.md).

### The Gardener

![The Gardener](img/gardener.png)

- **Kind and floors:** presence; defined in `src/content/presences/gardener.ts`, **not placed** in any floor (the owner ruled on 2026-10-29 that the tutorial floor holds none).
- **What it is:** care, patience and cultivation. A bone-coloured figure with its arms held out and a few living tones on its hands.
- **Behaviour (if placed):** immortal; positive intentions only; it takes a flesh part as its key in the design. Its lines are "Walk slowly. The roots remember where you have been." and "Nothing here has to be finished today."
- **Meaning:** in the design, the tutorial's voice on floor 0, which teaches movement and doors, and later remembers how far the player went. The memory and the agreement are not built. Its document: [GARDENER.md](../../not-built/presences/GARDENER.md) (not built).

### The Boundary

- **Kind and floors:** presence in the design, projection kind in the code; one per vault of a dungeon floor from floor 1 on, and above the tutorial treasure chest (`src/world/floor.ts`).
- **What it is:** boundaries. A tall, calm column of limestone that keeps the vault it stands in. Its sanctuary is a ring of pedestal blocks two blocks around its centre.
- **Behaviour:** never moves. While its ring stands whole it is neutral. Breaking the ring while the player is inside its room wakes it: about every 2.4 seconds it throws a cube at the player. Replacing the ring, or leaving the room, calms it again. It cannot be hurt, only calmed (health 9999, armour 1).
- **The answer:** negative intentions are absorbed; positive intentions pass through.
- **What it gives:** nothing directly. It guards the vault chest, which opens through the Sanctuary (below).
- **Meaning:** the calm guardian that keeps a space for you. Its document: [BOUNDARY.md](../presences/BOUNDARY.md).
- **Screenshot:** none. The sandbox refuses this entity (its id is not in the sandbox's projection roster), so it was not captured. See [Gaps](#gaps).

## 5. Voices

A voice here is speech that has no body of its own. The game has one such entity.

### The Sanctuary's guidance

- **Kind and floors:** voice; the Boundary's meditation app, opened when the player walks up to a Boundary that still keeps its chest, and above the tutorial chest. Available on every floor where a Boundary stands (from floor 1).
- **What it is:** the guided voice of the Sanctuary, a full-screen app of six meditations, each with its own scene, music and words. One sampled instruction is shown at the start of each part, for up to six seconds, then silence. The app's name is the Boundary's ring.
- **The six sittings** (name, tier, practice), from `src/content/presences/meditations.ts` and `src/i18n/locales/en.ts`:
  - Grounding (tier 1, grounding)
  - Gratitude (tier 1, gratitude)
  - Visualization (tier 1, visualization)
  - Box Breathing (tier 2, box breathing)
  - Self-Compassion (tier 2, self-compassion)
  - Listening to the River (tier 2, practice thinkwaitfast)
- **What the player gets:** a quick reward (tier 1 or 2) at once, or a sitting of a random 20 to 40 seconds for the better one (tier 3 or 4).
- **Screenshot:** none. This voice has no body: it is words, a scene and a sound on the app's own screen, not a creature. Nothing is faked for it. The app's screens are described in [MEDITATION-APP.md](../presences/MEDITATION-APP.md).
- **Meaning:** the Sanctuary is the space kept for as long as the player chooses to stay, outside the depths' look. Its document: [MEDITATION-APP.md](../presences/MEDITATION-APP.md).

---


## 6. The sky guardians

Five deities, one on each sky floor of the built sky tree, in `src/sky/`. Each is a small soft body under a giant animal head, floating over its seat, won by positive hits. Attacks never take health; they push, slow or hold the player, and special attacks drain spirit or capture. What they share is in [sky/guardians/README.md](../sky/guardians/README.md).

| Entity | Floor and seat | Hits to win | Phases | Document |
|---|---|---|---|---|
| Giant panda | 1, the bamboo seat | 24 | 2 | [PANDA.md](../sky/guardians/PANDA.md) |
| Koala | 2, the branches (the Fork) | 30 | 3 | [KOALA.md](../sky/guardians/KOALA.md) |
| Elephant | 3, the channels (the Basin) | 36 | 3 | [ELEPHANT.md](../sky/guardians/ELEPHANT.md) |
| Lion | 4, the plain (the Sunning Ledge) | 42 | 3 | [LION.md](../sky/guardians/LION.md) |
| Horse | 5, the meadow (the paddocks) | 48 | 3 | [HORSE.md](../sky/guardians/HORSE.md) |

- **Panda.** A giant panda head on a plush body, floating over the bamboo seat. It rests between attacks; standing still on a column top while it watches delays its next attack. Attacks: bamboo stumps that push, dense ground, sinking column tops, and a yawn that pushes the player off the seat.
- **Koala.** Asleep until the player comes within 12 blocks or lands a positive hit. It clings to its branch after each attack, and teleports to a distant place of the floor that still lies in its sight. Attacks: branches that turn to mist, falling leaf bundles, and a cube cage.
- **Elephant.** Floats over the Basin pool, listening. It keeps the place where the player stood longest in the last 10 seconds and aims its spray there. Its small body is hit only over the rim of the Basin. Attacks: a trunk spray that carries the player down a channel, and a trunk swat.
- **Lion.** Basks on its ledge and paces it in the air. A roar sends a ring of paralysis across the ground; a stare-down builds while the player looks away and drains spirit. Gliding to the player's ledge for pounces.
- **Horse.** The only deity that walks and leaps, between six fenced paddocks. It is startled by movement within 6 blocks and gentled by standing still, when every positive hit counts two. It sends horses of its herd to kick the player.

Each is won at its hit count and joins the player's side; the horse also leaves the Triple Jump as its gift ([sky/guardians/HORSE.md](../sky/guardians/HORSE.md)). **Meaning:** not yet documented in the built sky documents. **Screenshots: not captured** (see [Gaps](#gaps)).

## 7. The sky minions

Five herds, one per sky floor (the animals of each floor, embodied as smaller creatures). The engine, the spawner and the herd rules are in [sky/minions/README.md](../sky/minions/README.md). Every herd spawns while the player is on its floor and turns to the player's side after the number of positive hits in the table.

| Herd | At most (wild) | Spawn place | Hits to turn | Documented behaviour |
|---|---|---|---|---|
| Little pandas | 4 (3) | bamboo clumps, every 12 s | 3 | Walks slowly, climbs a column face, rolls down slopes, sits and watches a still player; tucks and rolls at a player below it (a soft push) |
| Koalas | 6 (6) | asleep in clusters, every 20 s | 3 | Sleeps until disturbed, climbs and hangs under branches; swings and drops onto a player passing under it |
| Young elephants | 5 (3) | the waterhole, every 15 s | 5 | Walks the ground ring in file; shoulders aside a player in its path; closes ranks when one is turned |
| The pride (lions) | 6 (4) | shade rocks, every 14 s | 4 | Stalks low, stares back when watched; holds ledges the player needs; pounces from above and roars a small freeze |
| The herd (horses) | 5 (3) | paddock gate, every 15 s | 4 | Gallops a wide loop, turns away at 3 blocks, kicks a player standing behind it; bolts when startled |

- **Meaning:** not yet documented in the built sky documents.
- **Screenshots: not captured** (see [Gaps](#gaps)).

## Gaps

These are the entities this bestiary cannot yet describe fully or picture. Each entry above says the same thing where it applies.

### Screenshots not taken

- **The Boundary.** The sandbox's room roster refuses the id `boundary` (`carveSandbox`: "unknown projection"), because the Boundary is placed by the floor generator on each vault, not by the sandbox. It needs either a sandbox hook for vault presences or a vault in a real run. Not captured in this pass.
- **The five sky guardians and the five sky herds.** They live in the sky realm above the built tree, which the sandbox does not build. Pictures need a harness that moves the player to each sky floor. Not captured in this pass.

### Meaning not yet documented

- **The sky guardians and the sky minions** (the deities and herds, see sections 6 and 7): the built sky documents describe what they do, not what they mean.
- **The Gardener:** its meaning is written in the design, but it is not placed (the owner ruled on 2026-10-29), so the meaning is recorded as not built.

## Found while writing

- The Wonder code sets `minFloor` to 99 while the creature table places it on floor 0 (the table decides placement).
- Doubt, Inner Critic and Panic have no floor range in the roster, while their cards give floors 1 to 4 (open questions in their documents).

