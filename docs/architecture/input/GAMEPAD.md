# Gamepad

Any controller the browser exposes with the **standard mapping** (Xbox, PlayStation, Switch Pro and most others on Chrome, Edge and Safari). Button names follow the Xbox layout. Part of [Input](README.md).

## 1. Layout

| Action | Input |
|---|---|
| move | left stick |
| look | right stick |
| jump (hold to swim up; with air jumps, again in the air) | A |
| cast (hold) | RT |
| launch a missile (with Dr. Launcher) | a quick double press of RT (within 0.3 s) |
| place | LT |
| throw | B |
| drink | X |
| bomb | RB |
| polarity | LB |
| choose the active carried item | d-pad left (previous) and right (next); in the inventory, A picks the highlighted item |
| inventory | Y; the d-pad moves the selection, B or Y closes |
| pause / resume | Menu |
| restart | View, on the landing, the pause card or the death screen |
| confirm | A (accepts a Presence offer; dismisses banners, resumes, begins again after death) |
| back | B (declines a Presence offer) |

Free in `play` for future actions: X, LS and RS (`sotano-controls` §2).

References: Minecraft (A jump, RT attack, LT place, B drop, Y inventory, bumpers cycle the hotbar), Noita (triggers fire, shoulders switch wands), Isaac (Start pauses, restart lives in the pause menu, bombs on their own button).

## 2. Polling

`Input.poll(dt)` reads `navigator.getGamepads()` once per frame, before anything else. Buttons count as held when pressed or past 0.35 (triggers). Sticks use a radial dead zone of 0.18; look uses a squared curve (fine aim near the centre, fast turns at the edge) at 3.4 rad/s horizontally and 75 % of that vertically. Pads without the standard mapping are ignored (their axes mean other things).

## 3. Waking the device

The gamepad becomes the active device only on new input: a button going down, or a stick crossing 0.5 from below. A drifting stick never steals the device from the keyboard or the touch screen, and while another device is active the pad's sticks are not read.

## 4. Menus, death and disconnection

- The landing and the pause card: A or Menu resume, View starts a new run, the d-pad left and right narrow or widen the field of view.
- The inventory: Y opens it, the d-pad moves the selection by tile and row, B or Y closes it and play resumes.
- The death screen: A or View begins again, A only after 1.2 s so a held button never skips it.
- Disconnecting the pad while it is active pauses the game; a toast says the controller connected or disconnected.

## 5. Rumble

Every screen shake (hurt, blasts, slams) plays a `dual-rumble` scaled to its strength, at most 400 ms, through `Hud.shake` → `Input.rumble`.

## The Sanctuary (context `meditation`)

The Boundary's meditation app takes the d-pad (move between the choices), A (choose; in a sitting, pause and resume), RB (next part), X (sound on or off), Y (calm visuals on or off) and B (one screen back; not now on the first screen; the leave sheet in a sitting). Y is the inventory everywhere else; the inventory cannot open while the app is.
