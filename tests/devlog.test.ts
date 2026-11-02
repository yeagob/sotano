import { describe, expect, it } from 'vitest';
import { attachDevlog, carriedName, cell, Devlog, devlogEnabled } from '../src/debug/devlog';
import { createBus } from '../src/game/events';

describe('the development log gate', () => {
  it('is on in development builds and on the develop branch', () => {
    expect(devlogEnabled(true, '')).toBe(true);
    expect(devlogEnabled(true, 'main')).toBe(true);
    expect(devlogEnabled(false, 'develop')).toBe(true);
  });

  it('is off in release builds and on main or any other branch', () => {
    expect(devlogEnabled(false, '')).toBe(false);
    expect(devlogEnabled(false, 'main')).toBe(false);
    expect(devlogEnabled(false, 'feature/49-development-logs')).toBe(false);
  });

  it('prints nothing when it is off', () => {
    const lines: string[] = [];
    new Devlog(false, l => lines.push(l)).line('anything');
    expect(lines).toEqual([]);
    new Devlog(true, l => lines.push(l)).line('anything');
    expect(lines).toEqual(['[devlog] anything']);
  });
});

/** A bus with the development hooks attached, and the lines they print. */
function capture(on = true) {
  const lines: string[] = [];
  const bus = createBus();
  const detach = attachDevlog(bus, new Devlog(on, l => lines.push(l)));
  return { bus, lines, detach };
}

describe('development log lines', () => {
  it('installs no hooks when the gate is off', () => {
    const { bus, lines } = capture(false);
    expect(bus.dump()).toEqual({});
    bus.emit('itemGained', { id: 'kindness', uid: 3 });
    expect(lines).toEqual([]);
  });

  it('names the item a player picks up', () => {
    const { bus, lines } = capture();
    bus.emit('itemGained', { id: 'kindness', uid: 3 });
    expect(lines).toEqual(['[devlog] item picked up: kindness (uid 3)']);
  });

  it('names the room template a player enters, and whether it is the first visit', () => {
    const { bus, lines } = capture();
    bus.emit('roomEnter', { room: 102, floor: 1, type: 'normal', template: 'pit-bridge', firstVisit: true });
    bus.emit('roomEnter', { room: 102, floor: 1, type: 'normal', template: 'pit-bridge', firstVisit: false });
    expect(lines).toEqual([
      '[devlog] room entered: pit-bridge (room 102, normal, first visit)',
      '[devlog] room entered: pit-bridge (room 102, normal, revisit)',
    ]);
  });

  it('names a monster when it spawns, and marks a rooted one', () => {
    const { bus, lines } = capture();
    bus.emit('enemySpawn', { id: 7, def: 'doubt', hp: 12, speed: 1, contactDamage: 2, tags: new Set(), x: 4.5, y: 1, z: 9.2 });
    bus.emit('enemySpawn', { id: 8, def: 'panic', hp: 6, speed: 1, contactDamage: 2, tags: new Set(['rooted']), x: 0, y: 0, z: 0 });
    expect(lines).toEqual([
      '[devlog] monster spawned: doubt (actor 7, hp 12) at (4, 1, 9)',
      '[devlog] monster spawned: panic (actor 8, hp 6, rooted) at (0, 0, 0)',
    ]);
  });

  it('names a monster that dies and the event that caused it, and the drops it leaves', () => {
    const { bus, lines } = capture();
    bus.emit('actorDamage', { target: 7, targetKind: 'projection', def: 'doubt', amount: 5, kind: 'intent', source: 'intent', owner: 1, knockback: 3, polarity: null });
    bus.emit('actorDamage', { target: 7, targetKind: 'projection', def: 'doubt', amount: 9, kind: 'explosion', source: 'explosion:volatile', owner: 'world', knockback: 3, polarity: null });
    bus.emit('actorDeath', { target: 7, targetKind: 'projection', def: 'doubt', x: 4.5, y: 1, z: 9.2, drops: ['heart', 'key'] });
    expect(lines).toEqual([
      '[devlog] monster died: doubt (actor 7) at (4, 1, 9), caused by explosion from explosion:volatile',
      '[devlog] item dropped: heart from doubt',
      '[devlog] item dropped: key from doubt',
    ]);
  });

  it('does not log the player as a monster', () => {
    const { bus, lines } = capture();
    bus.emit('actorDeath', { target: 1, targetKind: 'player', def: 'player', x: 0, y: 0, z: 0, drops: [] });
    expect(lines).toEqual([]);
  });

  it('names the drops of a broken block and of a cleared room', () => {
    const { bus, lines } = capture();
    bus.emit('blockLoot', { x: 1.2, y: 2, z: 3, material: 5, source: 'intent', drops: ['bomb'] });
    bus.emit('roomClear', { room: 102, drops: ['key'] });
    expect(lines).toEqual([
      '[devlog] item dropped: bomb from block at (1, 2, 3) (intent)',
      '[devlog] item dropped: key as the reward of room 102',
    ]);
  });

  it('stops when detached', () => {
    const { bus, lines, detach } = capture();
    detach();
    bus.emit('itemGained', { id: 'kindness', uid: 3 });
    expect(lines).toEqual([]);
  });
});

describe('development log helpers', () => {
  it('writes a cell in whole blocks', () => {
    expect(cell(4.9, -0.2, 10)).toBe('(4, -1, 10)');
  });

  it('names what a hand slot holds', () => {
    expect(carriedName(12)).toBe('block 12');
    expect(carriedName({ kind: 'mind' })).toBe('mind part');
    expect(carriedName({ potion: 'meal-small' })).toBe('flask meal-small');
  });
});
