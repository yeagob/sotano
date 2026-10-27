# Keyboard and mouse

The desktop scheme. Part of [Input](README.md).

## 1. Layout

| Action | Input |
|---|---|
| move | WASD or the arrows |
| look | mouse (pointer lock) |
| jump (hold to swim up) | Space |
| cast (hold) | left click |
| place | right click (throws the block if there is nowhere to place it) |
| throw | Q |
| bomb | E |
| polarity | F |
| inventory | Tab or I; arrows move the selection, Esc or Tab closes |
| pause | Esc (the browser releases the pointer) |
| restart | R, while playing or dead |
| confirm | any mouse button while captured, or Enter |

References: Minecraft (WASD, left click to break, right click to place, Q to drop, E for the inventory), Noita (the mouse aims, Tab opens the inventory and pauses), Isaac (E drops a bomb, R restarts, Tab shows your items).

## 2. Pointer lock is the pause

A click anywhere captures the mouse (`Input.lock()`); Esc releases it and the pause card shows. Browsers refuse a new lock for about a second after Esc: clicking again works. The emulated mouse events a phone fires after a tap are ignored for one second, so touch never asks for pointer lock.

Opening the inventory releases the lock on purpose (`Input.unlockFor()`), so the cursor can click tiles while the game stays "engaged"; closing it with the keyboard captures the mouse again.

## 3. Details

- Key repeat never creates a new press (`KeyboardEvent.repeat` is ignored), so holding Tab or E across a lock change does nothing twice.
- `move` and `navigate` read `MOVE_KEYS` and `NAV_KEYS` from `bindings.ts`, the same lists the table declares.
- F3 toggles the debug readout (developers only, not an action).
