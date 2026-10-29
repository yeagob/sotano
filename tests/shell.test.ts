import { describe, expect, it } from 'vitest';
import { shellHit, shellStart } from '../src/enemies/shell';
import { ENEMY_BY_ID } from '../src/content/enemies';

describe('a shell of plates (BESTIARY §5.1, Perfectionism)', () => {
  const shell = { plates: 6, plateHp: 4 };

  it('breaks one plate per plate of damage, and shields the core until the last plate is gone', () => {
    let s = shellStart(shell);
    let r = shellHit(s, 3, shell);
    expect(r.shielded).toBe(true);
    expect(r.state.plates).toBe(6);
    s = r.state;
    r = shellHit(s, 1, shell);
    expect(r.state.plates).toBe(5);
    s = r.state;
    for (let i = 0; i < 5; i++) s = shellHit(s, 4, shell).state;
    expect(s.plates).toBe(0);
    expect(shellHit(s, 4, shell).shielded).toBe(false);
  });

  it('a single blow that breaks several plates spends the rest on the next one', () => {
    const r = shellHit(shellStart(shell), 9, shell);
    expect(r.state.plates).toBe(4);
    expect(r.state.dmg).toBe(1);
    expect(r.shielded).toBe(true);
  });

  it('Perfectionism is a shell now: six plates over a fourteen-health core', () => {
    const def = ENEMY_BY_ID.get('perfectionism')!;
    expect(def.shell).toEqual({ plates: 6, plateHp: 4 });
    expect(def.hp).toBe(14);
    expect(def.armor ?? 0).toBe(0);
  });
});
