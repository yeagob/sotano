[Encounters (not built)](README.md) · [Design](../../README.md)

# Deeper behaviour of projections

Status: **proposal** (issue #338), with one small part built: the falter after a Red release. The owner approves the scope before anything else is built.

The owner asked for projections with more depth in how they behave and interact. This document reviews what the 38 projections do today, proposes a scope in four steps, and records the one change built with the colour tiers. The tiers themselves are built: see [built/projections/TIERS](../../built/projections/TIERS.md).

## What the projections do today

Read from the code (the built documents are in [built/projections](../../built/projections/README.md) and [built/encounters](../../built/encounters/README.md)):

- **Each projection acts alone.** It picks the nearest hostile actor, walks or hovers toward it on its own behaviour (walker, leaper, charger, ranged, burst, emitter, phaser and a few of its own), and attacks with telegraphed strikes. Almost nothing a projection does depends on another projection: the Alarm's burst sets off nearby Alarms and Panics, and a split leaves new projections. That is all.
- **Each projection answers the player's polarity the same way.** Good intentions warm and convert it; bad ones harm and release it. No projection changes how it moves or attacks because of the polarity aimed at it or the practices the player holds.
- **Each projection is the same every time.** Until the colour tiers, the only variant was the rooted one (more health, one more part).

So the shallow part is not the single projection, which already mirrors its pattern, but the room: patterns that feed each other, give way to each other, and answer what the player is doing.

## The proposal, in order

1. **Projections that react to each other** (first: smallest, needs no new verbs from the player). Patterns in a room lean on one another. Examples to build one at a time, each with its story sentence:
   - *A pattern let go weakens the ones beside it.* **Built** for the Red tier (below).
   - *Panic spreads.* A Panic that bursts near another projection makes it rush for two seconds (Panic feeding Panic).
   - *The Critic speaks through others.* While an Inner Critic stands in the room, Doubt and Second-Guessing hesitate less (judgement makes doubt sharper).
   - *Isolation shuts the others in.* Its wall of ice also cuts the others off from their allies.
2. **Projections that react to the player's polarity.** A projection being warmed by good intentions slows its attacks (it is listening); a projection hit by bad ones after being warmed relapses harder (a short rush). This makes the route of light a different fight, not only a slower one.
3. **Projections that react to the player's practices.** A few patterns notice what the player carries (a Critic that aims at the newest practice's light, Scarcity that goes for the fullest hand). Needs a read-only view of the inventory for behaviours; it must never read the save.
4. **Tiers that change behaviour, not only numbers.** A Red projection could add one move to its set (a second telegraphed strike), always readable, never a new unreadable attack.

## Built now: the falter after a Red release

- **What the player sees.** When a Red projection is released (destroyed by bad intentions, its health at zero), every other hostile projection in its room holds still for 1.5 seconds: it stops walking and starts no new attack (its touch still hurts, and a strike already marked on the floor still lands), a few pale motes rise over it, and two soft tones sink once. Allies, bosses, projections still forming and projections of other rooms are not touched. A Red projection that ends itself (Panic's burst), falls out of the world or is turned by good intentions does not cause it.
- **Story.** When the strongest form of a pattern is let go, the lesser forms of it lose their conviction for a breath. It rewards facing the hardest one first, the way Isaac rewards killing a champion, and gives the player a short window to act.
- **Why this one.** It is the smallest change that makes projections react to each other, it reads with no text (everything stops), it is bounded (one hold per release, no chain), and it can be tested without the browser. Code: `falterTargets` and `FALTER_SECONDS` in `src/enemies/tiers.ts`, `Enemies.falter`; test: `tests/tiers.test.ts`.

## Out of scope for this iteration

- **Questions to the player.** Projections asking the player questions need the owner's definition first: what is asked, how it is answered (cards like the Presences' agreements), and what an answer changes. Presences already ask; projections never speak (built/projections README), so this would also change a naming rule.
- **An external AI service.** Any runtime call to an AI service adds a network dependency, cost, latency, privacy and moderation concerns and breaks offline play. It needs the three-party architecture review before any design. Not proposed here.

## Open questions

- Which of the four steps first, and which of the examples in step 1?
- Is 1.5 seconds the right falter, and should a Yellow release cause a smaller one?
- Should step 3 (practices) be allowed to read what the player carries, given that a behaviour must never read the save?
- Questions to the player: kind, way of answering, consequence (owner's definition needed).
- External AI: which service, online only or optional, who pays, what data leaves the game; or is it a long-term idea to leave out?
