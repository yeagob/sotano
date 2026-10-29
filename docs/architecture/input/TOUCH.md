# Touch

Phones and tablets, **always in landscape**. The game detects a touch device (`pointer: coarse` and touch events) and switches to it on any touch. Part of [Input](README.md).

## 1. Layout

| Action | Control |
|---|---|
| move | left thumb: a floating stick that appears where you put it down (left 42 % of the screen) |
| look | drag anywhere on the right; dragging the cast button also aims |
| cast (hold) | the bead of light, the largest button, bottom right |
| polarity | **double tap the cast button** (owner rule); its ring shows the polarity |
| jump (hold to swim up) | the arrow |
| place | the block with an arrow (shows your top block) |
| throw | the flying block |
| bomb | the seed (shows the count) |
| inventory | the grid, top bar beside the minimap (shows how many practices) |
| pause | the two bars, top bar |
| restart | "New run" on the landing and the pause card, "Begin again" on the death screen |
| confirm | tap anywhere (dismisses banners); tap the pause card to play |

References: Minecraft's pocket edition (left joystick, look by dragging on the right, jump at the lower right), Noita (fire held while you aim), Isaac (one button per consumable, a glance tells you what you have).

## 2. The layer

`TouchControls` puts a full-screen layer above the game canvas and below every card. It is shown only on a touch device while playing (or with a banner open). Every touch is tracked by its identifier: a stick touch, a look touch, or a button touch (several at once). Leaving play, losing the window or switching device clears every track, so nothing stays held.

**Double tap.** A `doubleTap` binding rides on a button (`on: 'cast'`). It fires when a short tap (under 180 ms, under 12 px) is followed by another press within 300 ms; that second press does not cast. Holding to fire never switches polarity.

## 3. What leaves the screen

The phone screen keeps only what matters every second: hearts, counters, the polarity ring on the cast button, the minimap (130 px), the hand slots (smaller). The item bar is hidden: the inventory button shows the count and opens the full window. Banners sit higher and narrower; toasts higher. The pause card shows "Tap to play" and "New run" first and lays the controls out in two columns; the inventory takes the whole screen with a large ✕.

## 4. Landscape, fullscreen, safe areas

Resuming asks for fullscreen and locks the orientation to landscape where the browser allows it. In portrait a rotate card covers everything and the game pauses. Every edge control respects `env(safe-area-inset-*)` (notches), with `viewport-fit=cover`.

## 5. Glyphs and feedback

The button glyphs are 12 × 12 pixel strings in `src/content/hud-icons.ts` (`touchCast`, `touchJump`, `touchPlace`, `touchThrow`, `touchInventory`, `touchPause`; the bomb uses `seed`), drawn from palette tokens (`sotano-art`). Buttons dim when they cannot act (empty hand, no seeds) and shrink while pressed. Screen shake vibrates the phone (`navigator.vibrate`).
