[Presences](README.md)

# The Child (not built: the open parts)

Status: **partly built**. The Child's presence, its consent, its build and its gift are in the code and described in [built/presences/CHILD.md](../../built/presences/CHILD.md). This document keeps what is not built, and the defaults the build took where the design was open.

Decision (the owner approved the Elder and the Child as presences on 2026-10-27): a dweller of play, and of permission to make something badly. It is always joyful; it never cries (the art guide's red line).

## What is built (see the built document)

- **Build.** It asks the player to place three blocks while it watches. The count is run-scoped, every material block counts, and it is not saved (`src/game/build-count.ts`).
- **Gift.** When the build is done, one gift from a seeded weighted table (three in four a quality-one practice, one in four a special heart). The Listener's table is unchanged.
- **Consent.** The same card as the Wanderer and the Gardener: the exact request, Take or Decline, and declining keeps everything.

## Defaults taken, proposed, pending owner ruling

- **The room.** One seeded floor from floor 1, in a quiet normal room. The Cellar of Habits is that quiet room: no new room type (README D8, kept by the owner's ruling on #228).
- **The gift.** A practice of quality one (weight 3) or one special heart (weight 1). Its weights are the Wanderer's, chosen again for the Child.
- **The lines and the wording.** The English and Spanish lines and the consent card are first drafts, in `src/i18n/locales/`, for the owner's ear.
- **The path.** No lesson is given: the build gives a gift, not a lesson of the Body or Emotion path. The rule for which path a build belongs to is not decided, so none is taken.

## What the design asks and is not built

- **Lesson.** Discarded by the owner (#228, D8: "descártalo"). The one-line Lesson after the gift was removed from the code; the Child gives its gift and its own lines, and no Lesson of any path is planned.
- **Request.** In the idle window, it asks the player to draw something, anything, never judged (see [Requests](REQUESTS.md)). Not built; the idle window is not built.
- **Agreement.** Three loose cubes of different materials, to build a small tower (see [Agreements](AGREEMENTS.md)). Not built.
- **Covenant.** It gives no piece of the Covenant (the design's four pieces come from other Presences).
- **Look.** Its own body: a loose cluster of cubes that moves like a small animal. It uses the Listener's body until the art agent's follow-up.

## Open questions

- **The path.** Whether a build is from the Body or the Emotion path, and the rule that decides it (the Lesson is discarded; the path would only matter for a future gift).
- **Names and lines.** Open for the owner's ear (the drafts are built).
- **Joy.** A build that fails must still feel like play. The lines in the code never cry; check them when the owner reads them.
