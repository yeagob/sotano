# Waymark

A cairn on the path: a checkpoint that works as an extra life. Up: [will](README.md) · [practices](../README.md)

- **Path:** will. Tags: will, life, and the mechanic tag `checkpoint` (the checkpoint lasts while a held item carries it).
- **Quality:** 3. **Found in:** vault rooms and boss rewards (pools `vault` 1, `boss` 0.5).
- **Inspired by:** cairns and waymarks on pilgrim routes.
- **Code:** `src/content/items/waymark.ts`, the run's checkpoint in `src/game/checkpoint.ts`, the cairn marker in `src/game/checkpoint-mark.ts`.

## Description and effect

- **Description:** a cairn on the path, stones stacked by someone who walked here before. Wherever you last knew yourself, you can always return to it.
- **Effect:** marks where you stand, and the start of each new floor. When you would die, you return there with full hearts, 2.5 s of invulnerability and everything you carry. Used up when it saves you: one copy, one extra life.

## How the player meets it

1. Picking it up sets the checkpoint where you stand: the feet, snapped to the nearest free standing cell (feet and head free, ground under the feet preferred).
2. Each time you enter a new floor, the checkpoint moves to that floor's arrival point, so it never points at a floor you left behind.
3. A small cairn of light stands at the checkpoint while Waymark is held. It breathes slowly and goes when no copy is left.
4. On a death, a burst of light marks the place you died, the toast "The waymark brings you back." shows, and you appear at the checkpoint with full hearts. Projections within 4 blocks of the checkpoint are pushed away. You keep every practice, key, bomb, flask and block in your hand, and you are invulnerable for 2.5 s.
5. Each copy is one life. Several copies share one checkpoint and save you once each. The death that no copy can answer is the real one.

## Decisions and numbers

| Rule | Value |
|---|---|
| Checkpoint on pickup | the free standing cell nearest the feet |
| Checkpoint on a new floor | the floor's arrival point (its spawn) |
| Cost of a save | one copy of Waymark, spent after the death event (never inside it) |
| Hearts after a save | full (`maxHearts`) |
| Invulnerability after a save | 2.5 s |
| Shove radius | 4 blocks around the checkpoint |
| Standing search | up to 6 blocks, same level first, then one to three levels up or down |

## Revive rule (the cancel)

The revive is a hook on `death` at priority 150 (the cancel band), id `revive`. It cancels the death only when a checkpoint exists. The order inside the hook: burst at the death point, heal to full, move to the checkpoint, invulnerable 2.5 s, shove projections away, burst and chime at the checkpoint, toast, then `consumeSelf` (deferred until the event has finished).

**Rooms rule.** A sealed room, a challenge in progress or a boss room not yet overcome must never keep the player outside with its doors shut. After every move by a revive, every such room the player is not standing in has its doors opened and its combat state set to not sealed. A room the player arrives in keeps its seal. Entering a released room seals it again, and its projections keep their state: the fight goes on, with the doors shut only while the player is inside.

**Standing rule.** Every move places the player on a free cell (feet and head free). A cell that is inside a block is never used. If no free cell is found within reach, the existing teleport fallback runs (it carves the two cells, as it did before this item).

## Positive outcome

Waymark is an extra life that keeps every practice you carry. Death costs a copy, nothing else: no practice, key, bomb or block is lost, and the checkpoint moves forward as you go deeper.

## Open for the owner

Decisions the orchestrator took on the owner's behalf, to review:

1. The checkpoint is set where the player stands at pickup, snapped to a free cell.
2. The checkpoint moves to each new floor's arrival point (the floor's spawn), not to the point where the player fell in.
3. Waymark is consumed when it saves you: one copy, one extra life. Several copies share one checkpoint.
4. A new copy moves the checkpoint to where it is picked up.
5. The effect line adds the numbers "2.5 s" and "full hearts" to the brief's line, so that it states real numbers (sotano-items rule 12).
6. The tag `checkpoint` is a mechanic tag added to `will` and `life`: the checkpoint is kept while a held item carries it, and the cairn goes when none does.
7. The cairn of light uses the player's gold, and the icon uses the will path tokens, so it passes the palette rule (gold is light itself).
8. No recipe: practices have no crafting table yet (issue #112 is not in the repository), so no practice has one.
9. The world marker and the icon have not been through the art gate's captures in `?gallery`; they need the Opus art agent's review before they ship (`sotano-art` §0).
10. Generation: adding the item to the vault and boss pools changes the pedestal reservations, so `GEN_VERSION` is 38 and the golden pins are re-recorded on this branch (as the orchestrator asked; they are re-recorded once at integration).

## Open questions

- Should the cairn's light be a different colour than the player's gold, if the art gate says the gold reads as the player rather than the place?
- Should a boss's own room give a copy back when it is overcome? Not decided.
