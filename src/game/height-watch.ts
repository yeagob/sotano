// The player's height as the world streams it (game.ts `stream`). A height that is not a finite number has no story,
// so the world stops streaming for it: the guard keeps the game running. Its source is not known, so this warns on the
// console once per run, with the value, to let whoever sees it find the cause. Pure: the warning goes through a callback.

export class HeightWatch {
  private warned = false;

  constructor(private readonly warn: (message: string) => void = message => console.warn(message)) {}

  /** Checks one height. Returns true when it is a finite number; otherwise warns once per run and returns false. */
  check(y: number): boolean {
    if (Number.isFinite(y)) return true;
    if (!this.warned) {
      this.warned = true;
      this.warn(`the player's height is not a finite number (${String(y)}); the world stops streaming while it is not`);
    }
    return false;
  }

  /** A new run: the warning may come again. */
  reset(): void {
    this.warned = false;
  }
}
