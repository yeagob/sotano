[Movement](README.md)

# Patrol

Status: **idea**. The behaviour is in the code and nothing uses it.

A patrol is a being that walks a fixed route of points around the room and turns to attack when the player comes within reach of its path. The code has the behaviour, and the Autopilot projection does the same job inside its own file, with four route points around the room's centre.

## What the design asks

The design does not name the patrol. It names the Autopilot's fixed loop ("walks a fixed loop through the room and ignores you, until you cross its path"), which the patrol behaviour matches.

## Open questions

- **One behaviour.** The Autopilot's loop and the shared patrol are the same idea. Keep one, and move the Autopilot onto the shared behaviour, or delete the shared one.
- **Burrower.** The burrower's fixed loop through rock (see [Burrower](BURROWER.md)) could be a patrol with a rock route.
