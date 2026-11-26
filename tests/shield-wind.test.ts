import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { BASE_STATS } from '../src/core/stats';
import type { Input } from '../src/input/input';
import { Player, type PlayerHooks } from '../src/entities/player';
import { Wind } from '../src/game/wind';
import { AirForces } from '../src/physics/air-forces';

const DT = 1 / 60;

function driftInAir(shielded: boolean): number {
  const p = new Player();
  p.spawnAt(100.5, 150, 100.5);
  p.body.onGround = false;
  p.airShield = shielded;
  const move = { x: 0, y: 0 };
  const input = { hit: () => false, held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 1 } as unknown as Input;
  const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v };
  const run = new RunRandom(7);
  const wind = new Wind(n => run.fork('wind', n), 0);
  const forces = new AirForces();
  forces.add(wind);
  const nothing = () => false;
  for (let i = 0; i < 120; i++) {
    wind.advance(DT);
    p.update(DT, input, BASE_STATS, nothing, hooks, undefined, { air: forces });
  }
  return Math.hypot(p.body.vx, p.body.vz);
}

describe('the shield against the wind', () => {
  it('in the air the shield takes the wind: a shielded body is not pushed, an unshielded one is', () => {
    expect(driftInAir(false)).toBeGreaterThan(0.5);
    expect(driftInAir(true)).toBe(0);
  });
});
