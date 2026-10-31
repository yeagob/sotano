# Doors

Up: [rooms](README.md) · Status: built.

Doors follow the rule of Isaac: open whenever there are no projections, sealed while you fight, open again on their own when the room is clear. A breakthrough destroys a door for good. The locked vault is the one door that asks for a key, and the walls around it are harder than any others.

## Where doors are

Every pair of linked rooms shares one doorway. Doorways are three blocks wide and three blocks high, through the two-block wall between the rooms. Each room has a door on the sides where its links are; the map decides which sides. Doors on the north and south sit in the middle columns, and doors on the east and west in the middle rows, so a door always opens onto the room's centre.

A doorway takes the kind of a special room it joins (treasure, boss, vault or challenge), and is normal otherwise. Its frame has the look of its kind: the normal frame, a gold frame for treasure and vault doors, the boss's obsidian frame for boss and challenge doors.

## Opening and sealing

- **Open.** A room with no projections keeps its doors open. A room that is empty when you enter, and every room of the roots, is open.
- **Sealed.** When you enter a room with projections, its doors slam shut for the fight. A door of a challenge room seals on each visit.
- **Open again.** When the last projection is gone, the doors rise on their own. Only the doors near you make a sound.
- **Never on you.** A door never closes on the player's body; if the player stands in the doorway, the door waits.

## The locked vault

- **One key.** A vault's door is locked. Walking up to it spends one key, and the door stays open afterwards.
- **Obsidian shell.** The room behind a locked door is wrapped in obsidian: its two-block walls, floor and ceiling. Only brick is turned; rock keeps its own theme. Obsidian is tier 3 with 40 points of hardness and armour 3, against brick's tier 1, 12 points and armour 0.5. It can still be broken, with bombs, a blade or patience, but it takes far longer.
- **The key of the floor.** The floor's own key lies on a key spot of a normal room (see [KEYS](../../chests/KEYS.md)).

## Breakthroughs

A blast that reaches a door blows it apart for good. The door is destroyed; it does not reopen, and the doorway is open from then on. The tutorial teaches this in the sealed room of the roots.

## Door plugs

A wall that seals a whole room shows where a door would be. The plug is a door-shaped block of dirt, three blocks wide and three high, set in the wall: the softest material in the wall, so a breakthrough can take it. Some plugs sit behind an obsidian wall and stop two blocks under the ceiling, so the door is hidden on the far side of a hard wall. Twelve templates have plugs.

## Rules around doors

- Three tiles in front of every door stay walkable, on the floor and in every layer under door height. Any room may get a door on any side.
- No element, flame, pit or chest sits on a door approach.
- On the roots every door opens; a locked door becomes a treasure door, and the way down is a plain door.

Code: `src/world/floor.ts` (placing doorways, the kinds, the obsidian shell, the plugs), `src/game/game.ts` (opening, sealing, a locked door's key, breakthroughs), `src/content/rooms.ts` (the plugs and the approach tiles), `src/content/materials.ts` (obsidian and brick).
