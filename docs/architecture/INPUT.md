# Input: keyboard and mouse, gamepad, touch

SÓTANO has three complete control schemes and switches between them by itself: whichever device you touched last owns the prompts. How to add a control is the [`sotano-controls`](../../.claude/skills/sotano-controls/SKILL.md) skill; the contract is checked by `tests/controls.test.ts`.

## 1. Modules

| File | Role |
|---|---|
| `src/input/bindings.ts` | `BINDINGS`: every action with its keyboard/mouse input, gamepad button or stick, touch control, contexts and Minecraft / Noita / Isaac references. Pure data (tested in node). |
| `src/input/input.ts` | `Input`: raw state of the three devices, the action layer (`held`, `hit`, `hitBy`, `move`, `navigate`, `suppress`), the active device (`activeDevice()`, `onDeviceChange`), pausing (`playing`, `resume`, `release`), gamepad polling and rumble. |
| `src/input/touch.ts` | `TouchControls`: the touch layer (floating stick, look drag, buttons, double tap), shown only on touch devices while playing. |
| `src/input/labels.ts` | Words per device: `controlKey(row, device)`, `forDevice(prompt, device)`, `controlParams(device)` for the tablets. |

`Game.frame` calls `input.poll(dt)` first, works out the context (`play`, `prompt`, `paused`, `dead`, `inventory`), and only then reads actions. The player reads `input.move`, `input.hit('jump')`, `input.held('jump')` and the look deltas.

## 2. The mapping

| Action | Keyboard and mouse | Gamepad (standard) | Touch | Contexts |
|---|---|---|---|---|
| move | WASD / arrows | left stick | floating stick, left 42 % of the screen | play |
| look | mouse (pointer lock) | right stick (squared curve) | drag on the right; dragging the cast button also aims | play |
| jump (hold to swim) | Space | A | the arrow | play |
| cast (hold) | left click | RT | the bead of light (the large button) | play |
| place | right click | LT | the block with an arrow (shows your top block) | play |
| throw | Q | B | the flying block | play |
| bomb | E | RB | the seed (shows the count) | play |
| polarity | F | LB | double tap on the cast button (its ring shows the polarity) | play |
| inventory | Tab / I | Y | the grid, top bar (shows how many practices) | play, inventory |
| pause | Esc | Menu | the two bars, top bar | play, paused |
| restart | R | View | "New run" on the pause card | keyboard: play, dead; pad and touch: paused, dead |
| confirm | click / Enter | A | tap | prompt, paused, dead |
| navigate | arrows | d-pad | tap a tile | inventory |
| back | Esc | B | ✕ | inventory |

On the death screen a pad's A begins again after 1.2 s (so a held button never skips it). Disconnecting the pad pauses the game and says so.

## 3. Pausing on each device

The keyboard pauses by losing pointer lock (Esc, or opening the inventory). A gamepad and touch have no pointer lock: `Input.engaged` plays that role (`resume()` sets it, `release()` clears it). Resuming suppresses every button until it is released, so the press that resumed never casts or jumps. On touch, resuming also asks for fullscreen and a landscape lock; portrait shows the rotate card and pauses.

## 4. The touch screen

Landscape only. Left thumb: a floating stick that appears where you put it down. Right thumb: drag anywhere to look, and an arc of slate buttons (cast largest, jump, place, throw, bomb). Top bar beside the minimap: inventory and pause. What is not needed every second leaves the screen: the item bar is hidden (the inventory button shows the count), the minimap and hand slots are smaller, banners and toasts sit higher and narrower. The pause card puts "Tap to play" and "New run" first and lays the controls out in two columns. The glyphs are pixel strings in `src/content/hud-icons.ts` (`touchCast`, `touchJump`, `touchPlace`, `touchThrow`, `touchInventory`, `touchPause`; the bomb uses `seed`).

## 5. Words and juice

Every prompt has a version per device (`intro.play`, `banner.continue`, `death.restart`, `inv.close` + `.pad` / `.touch`), and every control row has `controls.<row>.key`, `.pad` and `.touch`. The roots' tablets use placeholders (`{move}`, `{cast}`…) and are carved again when the device changes. Screen shake also rumbles the pad (`dual-rumble`) or vibrates the phone, through `Hud.shake` → `Input.rumble`.

## 6. Later

Remapping (DECISIONS §10.4 asks for remappable input): `BINDINGS` is the default layout a settings page would copy and edit. Gyro aiming on phones.
