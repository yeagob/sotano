# Swimming, breath and drowning

What happens when the player wades, goes under and runs out of breath.

Part of [the player](README.md).

## What the player sees and feels

- At the edge of water you wade: your pace drops and the water looks shallow around your feet.
- When your head goes under, you lose your footing. You sink slowly, never faster than a set limit, and you can hold Jump to swim up. At the surface, holding Jump again lifts you over the edge, like climbing onto a jetty.
- Breath is a timer that runs only while your head is under. It lasts eight seconds. The HUD shows it as eight bubbles, and the bubbles appear only while the breath is not full.
- When the breath runs out, you drown: a hit of half a heart every one and a half seconds until you surface.
- At the surface the breath comes back in about two seconds, four times as fast as it drains.
- Lava is also a fluid you can swim in, but it burns. What lava and fire do to you is part of the elements, not of this document.

## The rule behind it

The water's own concept in the code reads: shallow feelings slow you, deep ones take your footing (`src/content/elements.ts`, the water entry). Swimming is that concept made physical. Breath and drowning are built, but the design document does not mention them yet, so the owner has not written a rule for them; this document records what the game does.

Code: `src/entities/player.ts` (swimming and wading, lines 88-140), `src/game/game.ts` (breath and drowning, lines 1800-1815), `src/content/elements.ts` (the fluids and their wade and swim values), `src/core/stats.ts` (the breath stat, line 48), `src/game/hud.ts` (the bubbles).

## Numbers

- Breath: 8 seconds with your head under water (the breath stat).
- Drowning: half a heart (4 points) every 1.5 seconds.
- Breath refill: four times the drain, at the surface.
- Water: wade at 60 percent of your pace; you can swim in it.
- Lava: wade at 40 percent of your pace; you can swim in it; breath does not drain in lava, so lava never drowns you, but it burns.
