export type Device = 'keyboard' | 'gamepad' | 'touch';
export const DEVICES: readonly Device[] = ['keyboard', 'gamepad', 'touch'];

export type Context = 'play' | 'prompt' | 'paused' | 'dead' | 'inventory' | 'toll';

export type Action =
  | 'move' | 'look' | 'jump' | 'cast' | 'place' | 'throw' | 'bomb' | 'polarity'
  | 'inventory' | 'pause' | 'restart' | 'confirm' | 'navigate' | 'back';

export const PAD = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9, LS: 10, RS: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
} as const;
export type PadButton = typeof PAD[keyof typeof PAD];

export type TouchControl = 'stick' | 'lookPad' | 'button' | 'systemButton' | 'menuButton' | 'tap' | 'doubleTap';

export interface Binding {
  action: Action;
  kind: 'axis' | 'hold' | 'press';
  when: readonly Context[];
  keyboard: { keys?: readonly string[]; mouse?: readonly number[]; mouseMove?: true; when?: readonly Context[] };
  gamepad: { buttons?: readonly PadButton[]; stick?: 'left' | 'right'; when?: readonly Context[] };
  touch: { control: TouchControl; icon?: string; on?: Action; when?: readonly Context[] };
  refs: { minecraft: string; noita: string; isaac: string };
}

export const MOVE_KEYS = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] } as const;
export const NAV_KEYS = { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'] } as const;
export const NAV_PAD = { up: PAD.UP, down: PAD.DOWN, left: PAD.LEFT, right: PAD.RIGHT } as const;

export const BINDINGS: readonly Binding[] = [
  {
    action: 'move', kind: 'axis', when: ['play'],
    keyboard: { keys: Object.values(MOVE_KEYS).flat() },
    gamepad: { stick: 'left' },
    touch: { control: 'stick' },
    refs: { minecraft: 'WASD; left stick; a thumb joystick on the left in the pocket edition', noita: 'WASD; left stick', isaac: 'WASD; left stick' },
  },
  {
    action: 'look', kind: 'axis', when: ['play'],
    keyboard: { mouseMove: true },
    gamepad: { stick: 'right' },
    touch: { control: 'lookPad' },
    refs: { minecraft: 'mouse; right stick; drag on the right half of the screen', noita: 'the mouse aims; right stick aims', isaac: 'arrow keys or right stick choose where you shoot' },
  },
  {
    action: 'jump', kind: 'hold', when: ['play'],
    keyboard: { keys: ['Space'] },
    gamepad: { buttons: [PAD.A] },
    touch: { control: 'button', icon: 'touchJump' },
    refs: { minecraft: 'Space; A; the jump button at the lower right (held to swim up)', noita: 'Space or W to levitate; A', isaac: 'no jump: flight is an item, so the face button stays free for the shot' },
  },
  {
    action: 'cast', kind: 'hold', when: ['play'],
    keyboard: { mouse: [0] },
    gamepad: { buttons: [PAD.RT] },
    touch: { control: 'button', icon: 'touchCast' },
    refs: { minecraft: 'left click / right trigger to attack and mine', noita: 'left click / right trigger fires the wand while held', isaac: 'holding a fire direction keeps shooting' },
  },
  {
    action: 'place', kind: 'press', when: ['play'],
    keyboard: { mouse: [2] },
    gamepad: { buttons: [PAD.LT] },
    touch: { control: 'button', icon: 'touchPlace' },
    refs: { minecraft: 'right click / left trigger places the held block', noita: 'right click uses or throws what you hold', isaac: 'the active item on its own button (Space / right trigger)' },
  },
  {
    action: 'throw', kind: 'press', when: ['play'],
    keyboard: { keys: ['KeyQ'] },
    gamepad: { buttons: [PAD.B] },
    touch: { control: 'button', icon: 'touchThrow' },
    refs: { minecraft: 'Q / B drops the held item', noita: 'throwing a held item or flask', isaac: 'dropping a trinket or pocket item' },
  },
  {
    action: 'bomb', kind: 'press', when: ['play'],
    keyboard: { keys: ['KeyE'] },
    gamepad: { buttons: [PAD.RB] },
    touch: { control: 'button', icon: 'seed' },
    refs: { minecraft: 'TNT is placed like any block', noita: 'bombs are a spell you can always fall back on', isaac: 'E drops a bomb; bombs have their own button on every device' },
  },
  {
    action: 'polarity', kind: 'press', when: ['play'],
    keyboard: { keys: ['KeyF'] },
    gamepad: { buttons: [PAD.LB] },
    touch: { control: 'doubleTap', on: 'cast' },
    refs: { minecraft: 'the bumpers cycle the hotbar (what the next use does)', noita: 'the shoulders and the wheel switch the active wand', isaac: 'one button swaps the pocket slot' },
  },
  {
    action: 'inventory', kind: 'press', when: ['play', 'inventory'],
    keyboard: { keys: ['Tab', 'KeyI'] },
    gamepad: { buttons: [PAD.Y] },
    touch: { control: 'systemButton', icon: 'touchInventory' },
    refs: { minecraft: 'E / Y opens the inventory', noita: 'Tab / I opens the inventory and pauses', isaac: 'Tab shows the map and your items' },
  },
  {
    action: 'pause', kind: 'press', when: ['play', 'paused'],
    keyboard: { keys: ['Escape'] },
    gamepad: { buttons: [PAD.MENU] },
    touch: { control: 'systemButton', icon: 'touchPause' },
    refs: { minecraft: 'Esc / Start pauses', noita: 'Esc / Start pauses', isaac: 'Esc / Start pauses' },
  },
  {
    action: 'restart', kind: 'press', when: ['play', 'paused', 'dead'],
    keyboard: { keys: ['KeyR'], when: ['play', 'dead'] },
    gamepad: { buttons: [PAD.VIEW], when: ['paused', 'dead'] },
    touch: { control: 'menuButton', when: ['paused', 'dead'] },
    refs: { minecraft: 'respawn from the death screen', noita: 'new game from the pause menu', isaac: 'hold R to restart; on a pad, restart from the pause menu' },
  },
  {
    action: 'confirm', kind: 'press', when: ['prompt', 'paused', 'dead', 'toll'],
    keyboard: { keys: ['Enter'], mouse: [0, 1, 2] },
    gamepad: { buttons: [PAD.A] },
    touch: { control: 'tap' },
    refs: { minecraft: 'click / A accepts', noita: 'click / A continues', isaac: 'any shot key / A dismisses and continues' },
  },
  {
    action: 'navigate', kind: 'axis', when: ['inventory', 'toll'],
    keyboard: { keys: Object.values(NAV_KEYS).flat() },
    gamepad: { buttons: Object.values(NAV_PAD) },
    touch: { control: 'tap' },
    refs: { minecraft: 'the d-pad moves between slots', noita: 'the d-pad moves between slots', isaac: 'the d-pad moves the selection' },
  },
  {
    action: 'back', kind: 'press', when: ['inventory', 'toll'],
    keyboard: { keys: ['Escape'] },
    gamepad: { buttons: [PAD.B] },
    touch: { control: 'menuButton' },
    refs: { minecraft: 'Esc / B closes a screen', noita: 'Esc / B closes a screen', isaac: 'Esc / B closes a screen' },
  },
];

export const BINDING = Object.fromEntries(BINDINGS.map(b => [b.action, b])) as Record<Action, Binding>;

export const PASSIVE = ['pickup', 'doors'] as const;

export const CONTROL_ROWS: readonly (Action | typeof PASSIVE[number])[] = [
  'look', 'move', 'jump', 'cast', 'polarity', 'pickup', 'place', 'throw', 'bomb', 'doors', 'inventory', 'restart', 'pause',
];

export function contextsFor(b: Binding, device: Device): readonly Context[] {
  const d = device === 'keyboard' ? b.keyboard : device === 'gamepad' ? b.gamepad : b.touch;
  return d.when ?? b.when;
}

export const DOUBLE_TAP_MS = 300;

export const PAD_DEADZONE = 0.18;
export const PAD_WAKE = 0.5;
export const TAP_MS = 180;
export const PAD_TRIGGER = 0.35;
export const PAD_LOOK_SPEED = 3.4;
export const TOUCH_LOOK_SPEED = 0.0055;

export function deadzone(x: number, y: number, dz = PAD_DEADZONE): [number, number] {
  const m = Math.hypot(x, y);
  if (m < dz) return [0, 0];
  const k = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * k, y * k];
}

export function lookCurve(v: number): number {
  return Math.sign(v) * v * v;
}
