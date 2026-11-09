// Issue #131: on floor 0 and below every boss fights in a large room (a template of two cells or
// more), unless the boss's own definition asks for a small one (`EnemyDef.smallRoom`) and its design
// doc says why. docs/design/built/levels/README.md (boss rooms).

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSSES, BOSS_ZONES } from '../src/content/bosses';
import { level } from '../src/content/levels';
import { ROOM_TEMPLATES } from '../src/content/rooms';
import { RunRandom } from '../src/core/rng';
import { bossRoomIsLarge, fitTemplates, FIRST_FLOOR, LARGE_BOSS_ROOMS_FROM, LAST_FLOOR, planDungeon, templateCells } from '../src/world/floor';

const SEEDS = Array.from({ length: 24 }, (_, i) => 0x9E3779B1 * (i + 1) >>> 0);

/** The boss room's template on every floor that holds a boss, for one run. */
function bossRooms(root: number, smallRoom: (floor: number) => boolean) {
  const rr = new RunRandom(root);
  const dungeon = planDungeon(rr);
  const out: { floor: number; id: string; cells: number; flipX: boolean; flipZ: boolean }[] = [];
  for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) {
    if (level(k).tutorial) continue;
    const plan = dungeon.plans[k];
    const boss = plan.rooms.find(r => r.type === 'boss')!;
    const { t, flipX, flipZ } = fitTemplates(rr, k, plan, ROOM_TEMPLATES, smallRoom(k)).fitted.get(boss.id)!;
    out.push({ floor: k, id: t.id, cells: templateCells(t), flipX, flipZ });
  }
  return out;
}

describe('boss rooms are large on floor 0 and below (#131)', () => {
  it('the rule covers floor 0 and every floor below it', () => {
    expect(LARGE_BOSS_ROOMS_FROM).toBe(0);
    for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) {
      expect(bossRoomIsLarge(k), `floor ${k}`).toBe(true);
      expect(bossRoomIsLarge(k, true), `floor ${k}, small-room boss`).toBe(false);
    }
  });

  it('every boss without the small-room flag gets a large room on every floor of its zone', { timeout: 60000 }, () => {
    for (const root of SEEDS) {
      // the room depends on the boss only through its flag: one run's rooms serve every boss
      const rooms = bossRooms(root, () => false);
      for (const zone of BOSS_ZONES) for (const id of zone.keystone ? [zone.keystone] : zone.pool) {
        const def = BOSSES.find(b => b.id === id)!;
        if (def.smallRoom) continue;
        for (const room of rooms.filter(r => r.floor >= zone.floors[0] && r.floor <= zone.floors[1]))
          expect(room.cells, `seed ${root}, ${id} on floor ${room.floor} in ${room.id}`).toBeGreaterThan(1);
      }
    }
  });

  it('every floor with a boss has a large boss template of its own', () => {
    for (const zone of BOSS_ZONES) for (let k = zone.floors[0]; k <= zone.floors[1]; k++) {
      const own = ROOM_TEMPLATES.filter(t => t.types.includes('boss') && templateCells(t) > 1 && (!t.floors || (k >= t.floors[0] && k <= t.floors[1])));
      expect(own.length, `floor ${k}`).toBeGreaterThan(0);
    }
  });

  it('a boss with the small-room flag may be placed in a small room', () => {
    let small = 0;
    for (const root of SEEDS) small += bossRooms(root, () => true).filter(r => r.cells === 1).length;
    expect(small).toBeGreaterThan(0);
  });

  it('the boss room is the same for the same seed', () => {
    for (const root of SEEDS.slice(0, 6)) expect(bossRooms(root, () => false)).toEqual(bossRooms(root, () => false));
  });

  it('only a boss whose design doc asks for a small room carries the flag', () => {
    for (const b of BOSSES.filter(x => x.smallRoom)) {
      const doc = `docs/design/built/bosses/${b.id.toUpperCase()}.md`;
      expect(existsSync(doc), doc).toBe(true);
      expect(readFileSync(doc, 'utf8'), `${doc} must say why it needs a small room`).toMatch(/small room/i);
    }
  });
});
