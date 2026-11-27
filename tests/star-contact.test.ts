import { beforeAll, describe, expect, it, vi } from 'vitest';
import { StatSheet } from '../src/core/stats';
import { createBus } from '../src/game/events';

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 120000);

function rig(starT: number, damage = 0) {
  const stats = new StatSheet();
  if (damage) stats.add({ stat: 'damage', layer: 'add', value: damage, source: 'test' });
  const player = { id: 0, kind: 'player', alive: true, spawning: 0, invulnT: 0, starT, crouching: false, body: { x: 0, y: 0, z: 0 } };
  const enemy = { id: 7, kind: 'projection', def: 'autopilot', alive: true, spawning: 0, contactDamage: 4, body: { x: 0, y: 0, z: 0 } };
  const g = Object.assign(Object.create(Game.prototype), {
    player, stats, bus: createBus(), contacts: { ready: () => true }, time: 0, damageActor: vi.fn(() => true),
  }) as InstanceType<typeof Game>;
  const contact = (Game.prototype as unknown as { contact(a: unknown, t: unknown): void }).contact;
  return { g, enemy, player, damageActor: g.damageActor as unknown as ReturnType<typeof vi.fn>, touch: () => contact.call(g, enemy, player) };
}

describe('the star hurts what touches it', () => {
  it('while the star lasts, a projection in contact takes the damage stat of the player', () => {
    const { enemy, player, damageActor, touch } = rig(30);
    touch();
    expect(damageActor).toHaveBeenCalledWith(enemy, 3.5, 'contact', 'contact', player.id);
  });

  it('the contact damage follows the damage stat, so the practices that raise damage raise it too', () => {
    const { enemy, player, damageActor, touch } = rig(30, 2);
    touch();
    expect(damageActor).toHaveBeenCalledWith(enemy, 5.5, 'contact', 'contact', player.id);
  });

  it('without a star, the projection takes nothing from the touch', () => {
    const { enemy, damageActor, touch } = rig(0);
    touch();
    expect(damageActor.mock.calls.some(c => c[0] === enemy)).toBe(false);
  });

  it('the player still takes the projection contact, star or not: only the reply is added', () => {
    const { player, damageActor, touch } = rig(30);
    touch();
    expect(damageActor).toHaveBeenCalledWith(player, 4, 'contact', expect.any(String), expect.any(Number), 0, 0, undefined, expect.anything());
  });
});
