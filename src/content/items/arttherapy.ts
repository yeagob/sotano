import { pal } from '../palette';
import { AIR } from '../materials';
import { defineItem, hook, type ItemApi } from '../../items/types';

const STRUCTURE = 4;
const HEAL = 2;
const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as const;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
const state = { room: -1, placed: new Set<string>(), healed: new Set<number>() };

function structure(x: number, y: number, z: number, api: ItemApi): number {
  const seen = new Set([key(x, y, z)]);
  const todo = [[x, y, z]];
  while (todo.length) {
    const [a, b, c] = todo.pop()!;
    for (const [dx, dy, dz] of FACES) {
      const k = key(a + dx, b + dy, c + dz);
      if (seen.has(k) || !state.placed.has(k) || api.materialAt(a + dx, b + dy, c + dz) === AIR) continue;
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
  effect: 'Placing 4 connected blocks in the same room heals one heart. Once per room.',
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
    hook('roomEnter', e => {
      if (e.room === state.room) return;
      state.room = e.room;
      state.placed.clear();
    }),
    hook('floorEnter', () => state.healed.clear()),
    hook('blockPlace', (e, api) => {
      state.placed.add(key(e.x, e.y, e.z));
      if (state.room < 0 || state.healed.has(state.room)) return;
      if (structure(e.x, e.y, e.z, api) < STRUCTURE) return;
      state.healed.add(state.room);
      api.heal(HEAL, 'arttherapy');
    }, { id: 'create', priority: 200 }),
  ],
});
