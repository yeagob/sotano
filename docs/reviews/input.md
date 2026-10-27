# Review: input (keyboard and mouse, gamepad, touch)

Subject: [../architecture/input/](../architecture/input/README.md), one action table for three devices.

- **Engineer:** the main session (proposal and build).
- **Architect:** a read-only Plan agent, critique of the built code.
- **Mediator:** rulings made by the engineer in the same session against the code and the owner's rules (no separate mediator agent ran this time; the owner can overrule any line).

| # | Critique | Severity | Ruling | Resolution |
|---|---|---|---|---|
| 1 | Any held pad input (stick drift, a resting trigger axis on a non-standard mapping) switched the active device every frame, wiping touch and redrawing the HUD | High | Now | The pad wakes only on a new press or a stick crossing 0.5; its sticks are read only while it is active; non-standard pads are ignored |
| 2 | `engaged` survived pointer-lock loss and window blur, so the game kept running | High | Now | Any unplanned lock loss, blur or hidden tab pauses and clears every held touch; only the inventory releases the lock on purpose (`unlockFor`) |
| 3 | iOS sends no click to a plain `div`: "Tap to play" could do nothing | High | Now | "Play" is a real button (`data-act="resume"`); the overlay keeps its pointer cursor |
| 4 | Closing the inventory with another device than the one that opened it fell into the pause card | Medium | Now | Opening always releases the lock without pausing; closing resumes on every device |
| 5 | Context rules hand-coded in `game.ts`; `prompt` never computed; move and navigate keys hard-coded | Medium | Now (partly) | `prompt` is a real context; move/navigate read `MOVE_KEYS` / `NAV_KEYS` / `NAV_PAD`; confirm begins again on the death screen on every device. A generic `hitIn(action, ctx)` is **later** |
| 6 | A double tap on cast flips polarity by accident while tap-firing | Medium | Now (changed) | The owner chose the double tap, so it stays; only a short first tap (< 180 ms, < 12 px) arms it, and the second press does not cast |
| 7 | HUD elements above the touch layer could swallow touches; magic 130 px | Medium | Now (partly) | Hand slots no longer take touches (the corners already did not); the top-bar offset stays tied to the minimap width in the same stylesheet |
| 8 | Key auto-repeat after a lock change created fake presses | Low | Now | `KeyboardEvent.repeat` ignored |
| 9 | A banner can eat a jump on the pad | Low | Rejected | Owner rule: information banners stay until dismissed, and the dismissing press never acts |
| 10 | Suppression swept before the pad was read | Low | Now | The pad is read first, then suppression is swept |

Found while verifying: on touch the layer hid while a banner was open, so the banner could not be dismissed. Fixed (the layer shows in `play` and `prompt`).
