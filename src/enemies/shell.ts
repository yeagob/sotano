export interface Shell { plates: number; plateHp: number }

export interface ShellState { plates: number; dmg: number }

export function shellStart(shell: Shell): ShellState {
  return { plates: shell.plates, dmg: 0 };
}

export function shellHit(state: ShellState, amount: number, shell: Shell): { state: ShellState; shielded: boolean } {
  let dmg = state.dmg + amount, plates = state.plates;
  while (plates > 0 && dmg >= shell.plateHp) { dmg -= shell.plateHp; plates--; }
  if (plates === 0) return { state: { plates: 0, dmg: 0 }, shielded: false };
  return { state: { plates, dmg }, shielded: true };
}
