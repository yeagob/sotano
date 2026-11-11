# Input

How the player's hands reach the game. The Roots ships three complete control schemes, keyboard and mouse, gamepad and touch, and switches between them by itself: whichever device you used last owns the prompts. Every action is defined once, in one table, and each device is a way of reaching it. How to add a control is the [`sotano-controls`](../../../.claude/skills/sotano-controls/SKILL.md) skill; the contract is checked by `tests/controls.test.ts`.

## Contents

| Document | Contents |
|---|---|
| [KEYBOARD.md](KEYBOARD.md) | Keyboard and mouse: the layout, pointer lock as pause, key repeat, the debug keys |
| [GAMEPAD.md](GAMEPAD.md) | Gamepad: the standard mapping, sticks and dead zones, waking the device, menus with the d-pad, death and disconnection, rumble |
| [TOUCH.md](TOUCH.md) | Touch: landscape only, the floating stick, look drag, the button arc, the half turn of the phone for polarity, the tab button and the screen, tap to place, what leaves the screen, fullscreen and the rotate card |

Reviews: [../../reviews/input.md](../../reviews/input.md).

## 1. Modules

| File | Role |
|---|---|
| `src/input/bindings.ts` | `BINDINGS`: every action with its keyboard/mouse input, gamepad button or stick, touch control, contexts and Minecraft / Noita / Isaac references. Pure data, tested in node. |
| `src/input/input.ts` | `Input`: raw state of the three devices, the action layer, the active device (`activeDevice()`, `onDeviceChange`), pausing (`playing`, `resume`, `release`), gamepad polling and rumble. |
| `src/input/touch.ts` | `TouchControls`: the touch layer. |
| `src/input/labels.ts` | Words per device: `controlKey(row, device)`, `forDevice(prompt, device)`, `controlParams(device)` for the tablets. |

## 2. Actions and contexts

Game code never reads a key code, a button index or a touch. It asks `input.held(action)`, `input.hit(action)` (a rising edge this frame), `input.hitBy(action)` (which device pressed it), `input.move`, `input.navigate()`. `input.suppress(...)` mutes actions until their inputs are released, so the press that dismisses a banner or resumes the game never also casts or jumps.

`Game.frame` calls `input.poll(dt)` first, then works out the context and reads only the actions live in it:

| Context | When |
|---|---|
| `play` | Simulating |
| `prompt` | Information banners dismiss with confirm; a Presence offer pauses the world until confirm accepts or back declines |
| `paused` | The menu is up (the screen with its menu tab, or the pause card) |
| `dead` | The death screen |
| `inventory` | The screen is open on its menu or practices tab (it pauses the world) |
| `toll` | The way-down window: pick what to give, confirm gives, back stays (LEVELS §2.3c) |
| `meditation` | The Sanctuary, the Boundary's meditation app, over the paused world: navigate moves between the choices of its screen, confirm chooses (and pauses or resumes a sitting), skip moves to the next part, mute and calm are its two switches, back goes one screen back (not now on its first screen, the leave sheet in a sitting). A click on it never captures the mouse (`Input.modal`) ([MEDITATION-APP.md](../../design/built/presences/MEDITATION-APP.md)) |

## 3. The actions

| Action | Kind | Contexts | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|---|---|
| move | axis | play | WASD / arrows | left stick | floating stick |
| look | axis | play | mouse | right stick | drag on the right |
| jump | hold | play | Space | A | the arrow |
| cast | hold | play | left click | RT | the bead of light |
| place | press | play | right click | LT | a tap on the block (aims at the tap) |
| throw | press | play | Q | B | the flying block |
| drink | press | play | G | X | the flask in your hand (shown only while one is in the hand) |
| bomb | press | play | E | RB | the seed |
| polarity | press | play | F | LB | a half turn of the phone |
| inventory | press | play, paused, inventory | Tab / I | Y | the tab button (top) |
| pause | press | play, paused | Esc | Menu | none: the tab button opens the same screen |
| restart | press | see each device | R | View | "New run" on the landing and the pause card |
| confirm | press | prompt, paused, dead, toll, meditation | click / Enter | A | tap |
| navigate | axis | inventory, toll, paused, meditation | arrows | d-pad | tap a tile; on the menu, drag the field-of-view bar or tap − and + |
| back | press | inventory, toll, meditation; prompt (keyboard/gamepad) | Esc | B | ✕ (in a sitting, the Leave button); offer card buttons |
| skip | press | meditation | N | RB | the Next part button |
| mute | press | meditation | M | X | the Sound button |
| calm | press | meditation | C | Y | the Calm visuals button |

**Air jumps** (with the Triple Jump, [built/player/TRIPLE-JUMP.md](../../design/built/player/TRIPLE-JUMP.md)). No new action: while you are off the ground, a second press of jump is the next air jump (the Triple Jump gives two). It is the same button, the same press on every device, and it needs no `BINDINGS` change. The words for jump name the air jumps (`controls.jump`, every device's row). References: Minecraft (a double jump is the same jump button, pressed again in the air), Noita (the levitate key is held, not a new key), Isaac (a practice changes what the one button does, never adds a button).

**The double tap of cast** (only with the `missile` stat, Dr. Launcher). It is a new meaning of `cast`, not an action of its own: a second press of cast within `DOUBLE_TAP_MS` (0.3 s, `src/input/bindings.ts`) of the first launches a bomb as a missile instead of an intention, and the press is suppressed until released. The first press always casts as usual. It is a quick double click of the left button, a quick double press of RT, or a quick double tap on the bead of light; without the stat a double tap is two intentions. The game reads it from `input.hit('cast')` (`Game.tapMissile`), so every device gets it from the same rule. Its words are `controls.launch` and `.key`, `.pad`, `.touch`; the first time the stat is on in a run, `toast.missileHint` names the device's gesture. References: Minecraft (a double press already means something new: a double jump flies, a double forward sprints), Noita (one fire control, the wand decides what leaves it), Isaac (an item changes what the shot does, never adds a button).

## 4. Pausing

`Input.playing` is true while the pointer is locked or the player is `engaged`. The keyboard pauses by losing pointer lock. The gamepad and touch have no pointer lock: `resume()` sets `engaged`, `release()` clears it. Losing the window (blur, a hidden tab) always pauses. **The screen.** Esc, Tab, Menu, Y and the touch tab button all open one screen with two tabs, Menu and Practices (`Hud.screenKey`, `Hud.openScreen`, `Hud.closeScreen`). Opening it releases the pointer lock and stops the world; closing it resumes on the device that opened it. On the keyboard Tab opens the Practices tab, and pressed again while Practices is shown it closes the screen; pressed on the Menu tab it switches to Practices. The touch tab button opens the Menu tab and closes the screen when pressed again.

**The menu's settings.** While the menu shows (the pause card, or the screen on its Menu tab), `navigate` left and right step the field of view by 5° (`Game.frame`, `Hud.menuShown`); up and down do nothing yet. It is a new meaning of `navigate`, not a new action: the arrows on the keyboard, the d-pad on a pad, and on touch a drag of the bar or a tap on − and +. The mouse drags the bar or clicks − and +, and those clicks never capture the pointer (`KEEP_MOUSE` in `src/game/landing.ts`) nor resume on touch. The hint under the bar names the device in use (`graphics.hint`, `.pad`, `.touch`). References: Minecraft (an options slider moved by mouse drag or by left and right on a controller), Noita (the d-pad moves through its options), Isaac (left and right change an option in the pause menu).

## 5. Words and juice

Every prompt has a version per device (`intro.play`, `banner.continue`, `death.restart`, `inv.close`, plus `.pad` and `.touch`), and every control row has `controls.<row>.key`, `.pad` and `.touch` in every catalog. The roots' tablets use placeholders (`{move}`, `{cast}`…) filled by `controlParams(device)` and are carved again when the device changes. Screen shake also rumbles the pad or vibrates the phone, through `Hud.shake` → `Input.rumble`.

## 6. Later

Remapping (DECISIONS §10.4 asks for remappable input): `BINDINGS` is the default layout a settings page would copy and edit. Gyro aiming on phones.
