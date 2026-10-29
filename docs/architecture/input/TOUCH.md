# Touch

Phones and tablets, **always in landscape**. The game detects a touch device (`pointer: coarse` and touch events) and switches to it on any touch. Part of [Input](README.md).

## 1. Layout

| Action | Control |
|---|---|
| move | left thumb: a floating stick that appears where you put it down (left 42 % of the screen) |
| look | drag anywhere on the right; dragging the cast button also aims |
| cast (hold) | the bead of light, the largest button, bottom right |
| polarity | **a half turn of the phone**, like a steering wheel: each turn flips the intention (its ring shows the polarity) |
| jump (hold to swim up) | the arrow |
| place | **a tap on the world**: the block under the finger is where the block in your hand goes |
| throw | the flying block |
| bomb | the seed (shows the count) |
| inventory | the tab button, top bar beside the minimap: opens the screen on its menu tab (shows how many practices you hold) |
| pause | none of its own: the menu is the screen the tab button opens |
| restart | "New run" on the menu tab, "Begin again" on the death screen |
| confirm | tap anywhere (dismisses banners); "Tap to play" on the menu tab |

References: Minecraft's pocket edition (left joystick, look by dragging on the right, jump at the lower right, tap to place), Noita (fire held while you aim), Isaac (one button per consumable, a glance tells you what you have).

## 2. The layer

`TouchControls` puts a full-screen layer above the game canvas and below every card. It is shown only on a touch device while playing (or with a banner open). Every touch is tracked by its identifier: a stick touch, a look touch, or a button touch (several at once). Leaving play, losing the window or switching device clears every track, so nothing stays held.

**A tap on the world** is a touch that starts on the stick side or the look side, lasts under 250 ms and does not move more than 12 px. It is recorded in `Input.touchTap` with the `place` action; the game aims the placement ray through that pixel (`Game.tapDirection`). A tap that finds no block in reach is refused with the denied sound. It never throws the block in your hand, so a stray tap cannot lose it.

**A half turn.** The layer listens to `screen.orientation` (and `orientationchange` on iOS). The phone is in one of two landscape sides, 90° or 270°. When the side changes, the `polarity` action fires once. A turn through portrait counts once, and the first reading only sets the side. The screen is locked to landscape, so it turns with the phone and stays readable.

## 3. The screen

The tab button opens the screen (the same one Esc and Tab open on the keyboard, see [KEYBOARD.md](KEYBOARD.md) §1), on its **Menu** tab: the pause card, controls, language and New run. The **Practices** tab is one tap away at the top of the same screen. Tapping the button again, or "Tap to play", returns to the game. The world stops while the screen is open, on every device.

## 4. What leaves the screen

The phone screen keeps only what matters every second: hearts, counters, the polarity ring on the cast button, the minimap (130 px), the hand slots (smaller). The item bar is hidden: the tab button shows the count and opens the screen. Banners sit higher and narrower; toasts higher. The menu tab lays the controls out in two columns; the practices take the whole screen with a large ✕.

## 5. Landscape, fullscreen, safe areas

Resuming asks for fullscreen and locks the orientation to landscape where the browser allows it. In portrait a rotate card covers everything and the game pauses. Every edge control respects `env(safe-area-inset-*)` (notches), with `viewport-fit=cover`.

## 6. Glyphs and feedback

The button glyphs are 12 × 12 pixel strings in `src/content/hud-icons.ts` (`touchCast`, `touchJump`, `touchThrow`, `touchInventory`; the bomb uses `seed`), drawn from palette tokens (`sotano-art`). Buttons dim when they cannot act (empty hand, no seeds) and shrink while pressed. Screen shake vibrates the phone (`navigator.vibrate`).

## 7. Why these controls

The owner's rules for the phone: a control must not change the intention by accident, and must work the first time. The double tap on the cast button was hidden, easy to miss, and a pair of taps next to the fire button could switch the intention in the middle of a fight. A half turn of the phone is deliberate, cannot be caused by a thumb, and reads as what it does (a switch). Tap to place lets the player point at the block instead of aiming with the view and then pressing a button.
