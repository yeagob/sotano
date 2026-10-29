import { describe, expect, it } from 'vitest';
import { ROOM_TEMPLATES, validateTemplate, type RoomTemplate } from '../src/content/rooms';

const base = (rows: string[]): RoomTemplate => ({ id: 'probe', types: ['boss'], rows });
const flat = Array.from({ length: 7 }, () => '.............');

describe('boss rooms: the boss has room to walk', () => {
  it('every boss template keeps two blocks of clear floor around its hole', () => {
    for (const t of ROOM_TEMPLATES.filter(x => x.types.includes('boss'))) {
      expect(validateTemplate(t), t.id).toEqual([]);
    }
  });

  it('a pillar within two blocks of the hole is refused', () => {
    const rows = [...flat];
    rows[1] = '......T......';
    rows[3] = '....r.H......';
    expect(validateTemplate(base(rows)).some(e => e.includes("blocked (\"r\")"))).toBe(true);
  });

  it('a pillar two blocks away from the hole is allowed', () => {
    const rows = [...flat];
    rows[1] = '......T......';
    rows[3] = '..r...H......';
    expect(validateTemplate(base(rows))).toEqual([]);
  });
});
