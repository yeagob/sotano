# Input

How the player's hands reach the game. The Roots ships three complete control schemes, keyboard and mouse, gamepad and touch, and switches between them by itself: whichever device you used last owns the prompts. Every action is defined once, in one table, and each device is a way of reaching it. How to add a control is the [`sotano-controls`](../../../.claude/skills/sotano-controls/SKILL.md) skill; the contract is checked by `tests/controls.test.ts`.

## Contents

| Document | Contents |
|---|---|
| [KEYBOARD.md](KEYBOARD.md) | Keyboard and mouse: the layout, pointer lock as pause, key repeat, the debug keys |
| [GAMEPAD.md](GAMEPAD.md) | Gamepad: the standard mapping, sticks and dead zones, waking the device, menus with the d-pad, death and disconnection, rumble |
| [TOUCH.md](TOUCH.md) | Touch: landscape only, the floating stick, look drag, the button arc, the double tap for polarity, what leaves the screen, fullscreen and the rotate card |

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
| `prompt` | Simulating with an information banner open (confirm dismisses it) |
| `paused` | The pause card is up |
| `dead` | The death screen |
| `inventory` | The inventory window |
| `toll` | The way-down window: pick what to give, confirm gives, back stays (LEVELS §2.3c) |

## 3. The actions

| Action | Kind | Contexts | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|---|---|
| move | axis | play | WASD / arrows | left stick | floating stick |
| look | axis | play | mouse | right stick | drag on the right |
| jump | hold | play | Space | A | the arrow |
| cast | hold | play | left click | RT | the bead of light |
| place | press | play | right click | LT | the block with an arrow |
| throw | press | play | Q | B | the flying block |
| bomb | press | play | E | RB | the seed |
| polarity | press | play | F | LB | double tap on cast |
| inventory | press | play, inventory | Tab / I | Y | the grid |
| pause | press | play, paused | Esc | Menu | the two bars |
| restart | press | see each device | R | View | "New run" on the landing and the pause card |
| confirm | press | prompt, paused, dead, toll | click / Enter | A | tap |
| navigate | axis | inventory, toll | arrows | d-pad | tap a tile |
| back | press | inventory, toll | Esc | B | ✕ |

## 4. Pausing

`Input.playing` is true while the pointer is locked or the player is `engaged`. The keyboard pauses by losing pointer lock. The gamepad and touch have no pointer lock: `resume()` sets `engaged`, `release()` clears it. Losing the window (blur, a hidden tab) always pauses. Opening the inventory releases the pointer lock without pausing, so the window can be closed with any device.

## 5. Words and juice

Every prompt has a version per device (`intro.play`, `banner.continue`, `death.restart`, `inv.close`, plus `.pad` and `.touch`), and every control row has `controls.<row>.key`, `.pad` and `.touch` in every catalog. The roots' tablets use placeholders (`{move}`, `{cast}`…) filled by `controlParams(device)` and are carved again when the device changes. Screen shake also rumbles the pad or vibrates the phone, through `Hud.shake` → `Input.rumble`.

## 6. Later

Remapping (DECISIONS §10.4 asks for remappable input): `BINDINGS` is the default layout a settings page would copy and edit. Gyro aiming on phones.
