import { pal } from '../palette';
import { AIR } from '../materials';
import { defineItem, hook, type ItemApi } from '../../items/types';

const STRUCTURE = 4;
/** Half-hearts, as the heal API takes them: a quarter heart is 2 damage points (a heart is 8). */
const HEAL = 0.5;
const ROOMS_PER_FLOOR = 4;
const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as const;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** What the practice remembers about one run. Keyed by the run's event bus, which is new for every
 *  run, so a new run (or a second copy of the item) never inherits a healed room from another run. */
interface Memory {
  room: number;
  floor: number;
  /** Blocks placed since the player entered the current room. Re-entering starts it over. */
  placed: Set<string>;
  /** Rooms already healed this run, as `floor:room`. Never cleared by leaving or re-entering a room. */
  healed: Set<string>;
  /** Rooms healed on each floor this run. A floor starts at zero the first time it is entered. */
  healedOnFloor: Map<number, number>;
}

const memories = new WeakMap<ItemApi['bus'], Memory>();

function memoryOf(api: ItemApi): Memory {
  let m = memories.get(api.bus);
  if (!m) {
    m = { room: -1, floor: -1, placed: new Set(), healed: new Set<string>(), healedOnFloor: new Map() };
    memories.set(api.bus, m);
  }
  return m;
}

function structure(x: number, y: number, z: number, api: ItemApi, placed: ReadonlySet<string>): number {
  const seen = new Set([key(x, y, z)]);
  const todo = [[x, y, z]];
  while (todo.length) {
    const [a, b, c] = todo.pop()!;
    for (const [dx, dy, dz] of FACES) {
      const k = key(a + dx, b + dy, c + dz);
      if (seen.has(k) || !placed.has(k) || api.materialAt(a + dx, b + dy, c + dz) === AIR) continue;
      seen.add(k);
      todo.push([a + dx, b + dy, c + dz]);
    }
  }
  return seen.size;
}

export default defineItem({
  id: 'arttherapy',
  name: 'Art Therapy',
  description: 'Making something changes the maker: four connected blocks you place in a room can heal you.',
  effect: 'Placing 4 connected blocks in the same room heals a quarter heart. Once per room, and in four rooms per floor at most.',
  inspiredBy: 'Art therapy; the idea that making art transforms people',
  pools: { treasure: 1 },
  tags: ['emotion', 'body', 'blocks'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '...aaaaaa...',
      '..abbbbbba..',
      '.abcbbcbbba.',
      '.abbbbbbcba.',
      '.abcbbbbbba.',
      '.abbbbbbba..',
      '..abbbaaa...',
      '...aaa.gg...',
      '.......gg...',
      '......gg....',
      '............',
    ],
    palette: { a: pal('mat.dirt.base'), b: pal('sky.horizon'), c: pal('path.emotion.glow'), g: pal('brass.base') },
  },
  hooks: [
    hook('roomEnter', (e, api) => {
      const m = memoryOf(api);
      if (e.room === m.room && e.floor === m.floor) return;
      m.room = e.room;
      m.floor = e.floor;
      m.placed.clear();
    }),
    hook('blockPlace', (e, api) => {
      const m = memoryOf(api);
      m.placed.add(key(e.x, e.y, e.z));
      if (m.room < 0) return;
      const room = `${m.floor}:${m.room}`;
      if (m.healed.has(room)) return;
      const used = m.healedOnFloor.get(m.floor) ?? 0;
      if (used >= ROOMS_PER_FLOOR) return;
      if (structure(e.x, e.y, e.z, api, m.placed) < STRUCTURE) return;
      // Checked before the room and the floor are spent: a heal at full health does nothing, so it must not use them up.
      const { hp, maxHp } = api.counts();
      if (hp >= maxHp) return;
      m.healed.add(room);
      m.healedOnFloor.set(m.floor, used + 1);
      api.heal(HEAL, 'arttherapy');
    }, { id: 'create', priority: 200 }),
  ],
});
