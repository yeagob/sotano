[Presences](README.md)

# The Listener

Built and the reference implementation for offering parts to a Presence. Floors 1 to 5, one per floor, in a quiet room. Code: `src/content/presences/listener.ts`, placed by `src/content/presences/index.ts`; its reward is rolled by `src/content/tables/heart-gifts.ts` when the offered heart is accepted. A run meets up to five Listeners, one on each Tree floor. Each drops its reward and leaves at once, in the frame the drop appears (#65, #84, #141).

The Listener is a pale stone figure of bone, a tall column with a paper-coloured head and two small side plates. It is the first presence the player meets, and what it offers is being heard. It asks nothing and orders nothing.

- **Pattern:** being heard.
- **Health:** one point, which nothing removes.
- **Answers to:** positive intentions only. A negative intention cannot silence it, because it leaves with its drop; the silence rule applies to the presences that stay (see Silence).

## Where it is

On each floor from 1 to 5, one room is chosen from the normal rooms that hold no projections, seeded by the floor. Its room is not sealed, since it holds no roster. Floor 0 holds none. A floor holds one Listener, placed when the floor is built; once it has dropped its reward it is gone, and the floor holds none for the rest of the run.

## What the player meets

- **Replies.** If the player carries no heart, each time they come near with something else on top of the hand, the Listener names that thing and says it is not what it waits for. With empty hands it says so. It answers at most once every four seconds.
- **Body.** The Listener has a body: the player cannot walk through it.
- **The key.** Within about two blocks, the Listener scans the carried hand from the interaction item down and asks whether the player wants to give the first heart of a released pattern it finds. Accepting takes only that heart; declining takes nothing, and the Listener asks again only after the player steps away and returns. Other carried things stay in hand. It then talks. If no heart is carried, the first approach gives a hint without naming what it wants.
- **Talk and the Lesson.** Once the heart is taken (and its reward has dropped), the choice card asks what weighs on the player, with the four paths (body, mind, emotion, will) and "Not now". A path gives one Lesson of that path, in words, and the line that it heard them. "Not now" gives only that line. See [The Lesson](#the-lesson).
- **The reward.** Accepting the heart always gives one reward, rolled from the run's `drops` stream at that moment:
  - **15%:** a practice with a maximum-health stat.
  - **75%:** special hearts; 90% of these rewards are one heart, and 10% are two hearts of different special kinds.
  - **10%:** exactly two red hearts.
  - **How it lands.** The reward leaves the Listener in an arc away from the player, never toward them, with the gold sparks of a release. At full health a heart waits on the floor until the player is hurt.
- **Leaving.** The Listener is removed from the world in the same frame its drop appears: its body, its hooks and its contacts go with it, and the room is ordinary again. Its pickups stay where they landed, so the reward does not depend on the Listener any more. A card that is already open stays on the screen.
- **Light.** The design has it show its face only while the player listens, as light from the player's lantern. The build draws it as bone tones, with no such effect.

## The Lesson

Decided by agent (issue #149); the Light's place ruled by the owner (issue #228, D4: the Light goes at the top of the tree). The design had the player choose which path weighs on them and receive a Lesson of that path; the Covenant's Light is what was heard, carried up to the crown of the giant tree.

- **The card.** The choice card of the Elder (up to four answers, keyboard, mouse, gamepad, touch), with the Listener's first line as the question and the four paths as the answers. It opens after the reward, so the Listener has already left: the card needs no body.
- **The Lesson.** One line per path (`presence.listener.lesson.body`, `.mind`, `.emotion`, `.will`), then "I heard it", then a line that the Light waits in the crown of the great tree. Words only: no item, no stat, no randomness. Reason: the 15/75/10 reward must not change, so the Lesson adds meaning and nothing to the table, and the `drops` stream is read exactly as before.
- **The Light, at the crown (owner, #228, D4).** A run that has heard a Lesson (any path, on any floor) keeps the Covenant's Light when the player's body enters the crown of the giant tree above the surface (its canopy story), once, with a gold burst and the toast *In the crown of the tree, what was heard becomes Light.* Climbing to the crown before any Lesson gives nothing; the Light waits there for a later climb, or for a fall from the sky's deck, which lands in the crown. "Not now" is no Lesson heard; the reward that already dropped is never taken back. Reason for needing a Lesson (decided by agent): the Light is what was heard, so the crown alone would give it to a run that never listened, on its first climb from the Roots. The crown's layout belongs to the tree; the Light only reads the story the body is in, in one function (`reachCrown`).
- **Code.** `src/content/presences/lesson.ts` (`crownGivesLight`, `LIGHT_STORY`), read by the game in `askLesson`, `answerLesson` and `reachCrown`. Tested in `tests/presences-lesson.test.ts`.

## Silence

The silence rule (BESTIARY §8.1) applies to presences that stay, the Gardener among them. The Listener does not stay: it leaves at its drop, so its silence leaves with it, and a negative intention in its old room has no effect there. Before its part is accepted it is not yet heard, so it cannot be silenced either.

## Decisions taken for #65

- **One Listener per floor, never two on the same floor.** A run has up to five Listeners, one per Tree floor, so "several per run" is met by the floors, not by a second Listener in the same place. A floor that has given its reward keeps none.
- **Offer order and consent.** The Listener searches from the top of the hand (the interaction item) toward the bottom, asks before consuming, and accepts only the first matching heart the player agrees to give.
- **The count is 1 to 3.** The issue leaves the number open; a single drop is too little for a reward that always lands. The weights are set by #77.
- **Leaving is immediate.** The Listener is removed in the same moment its drop appears. (#77 made it wait for the pickups; #84 reverted that, see below.)

## Reward (owner correction, #141)

- **The guaranteed reward is runtime.** The floor seed chooses only the Listener's room. The accepted heart rolls its 15/75/10 reward from `stream('drops')`, so it cannot change floor structure.
- **Two separate reward sources.** The Listener's guaranteed heart-offer reward is distinct from the creatures' one-time 7.5% growth gift (`stream('gifts')`).
- **Special hearts.** Within the 75% special-heart category, 90% of rewards are one special heart and 10% are two different special-heart kinds.

## Decisions taken for #84

- **The Listener leaves at once.** The owner's answer on #84: the Listener leaves as soon as it drops, and does not wait for the drop to be picked up. The release is in the same frame as the reward, with the existing release path.

## Open questions

- **Standing still.** The design has the player stand still beside it. The build talks on contact, without stillness.
- **The tree.** The design places one Listener in a quiet side emanation of each Tree floor. The build places it in any quiet normal room of floors 1 to 5, which the code calls the tree level.
- **Lines.** The lines are English and Spanish texts awaiting owner approval (the design leaves names and lines open).
