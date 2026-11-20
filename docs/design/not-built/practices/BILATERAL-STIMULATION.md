# Bilateral Stimulation

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/bilateral.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/emotion/`.

| | |
|---|---|
| Path | Emotion; no glyph of its own |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Bilateral stimulation, alternating left and right, as used in EMDR (Francine Shapiro) |
| Code | `src/content/items/bilateral.ts`; the turns in `src/entities/player.ts` (`castSide`), `src/game/game.ts` (`fire`) and `src/render/hands.ts` (`fire(side)`) |

## What it means

Left, then right, then left again. The attention moves from side to side, and a hard memory is held more lightly.

## What it does

- **Fire rate ×2**: 2.7 shots a second becomes 5.4.
- **The hands take turns**: each shot leaves from the other hand, and that arm swings. Every practice you carry still applies to each shot, because every shot emits `fire`.
- **Two copies** multiply the rate (×4, up to the limit of 30 a second). The turns are one flag, so two copies do not change them.
- **Weapons that replace the shot** (the beam, the great cut) do not take a turn: they swing from the hand that is next and charge twice as fast, because the charge reads the fire rate. The blade keeps the shot, so it takes turns with the others.
- **Bomb and missile double tap** are unchanged: they launch from the right hand as before.

Positive outcome: more shots, and every practice you carry applies to each of them.

## Stats and events

- `fireRate`: mul 2
- `twinCast`: add 1 (a flag, held at 0 or 1)
- Hooks: none. The item needs no event of its own.

## Synergies and states of being

- [Double Helix](SPIRAL-GROWTH.md#synergies-and-states-of-being) with Spiral Growth: the pair's rate is held at ×2 (the two doublings multiply to ×4, the synergy halves it back) and damage is ×1.25.

## Open questions

- The left arm rises for its own casts only while it swings; it has not been checked in the gallery (sotano-art gate).
- Kairos (the Miracles path, `src/game/kairos.ts`, `Game.releaseKairos`) fires its five intentions from the marks, not from the hands: the release does not flip `castSide`, so it does not alternate. Whether a Kairos release should take turns is open. Its strands do follow Spiral Growth and Rule of Three, since the release builds each intention with `intentFromStats`.
