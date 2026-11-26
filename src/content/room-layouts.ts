// The layouts of issue #115: more rooms for every band of floors, built to the open-corner rules (docs/design/built/levels/rooms/LAYOUT-RULES.md).
// Same format as rooms.ts (the characters are listed there); ROOM_TEMPLATES appends these.
//
// The rules every one of them keeps, beyond the validator's: no loose block or decor slot in a corner, no notch a
// projection can spawn into, and nothing two blocks high between the centre and a corner it can walk to. Tall
// things stand on the room's cross (the row through the centre) or flush against the north and south walls by the
// doors; corners are open floor, or filled whole by terraces, water, lava or a pit.

import type { RoomTemplate } from './rooms';

export const LAYOUTS_115: RoomTemplate[] = [
  // ── fighting rooms for every band (floors 1–9) ──
  {
    // a ring of low walls round the middle, four ways in; benches fill the corners under the dome
    id: 'rotunda', types: ['normal'], floors: [2, 9], height: 7, ceiling: 'dome', rows: [
      '2...........2',
      '...111.111...',
      '..1.......1..',
      '..1...K...1..',
      '..1.......1..',
      '...111.111...',
      '2...........2',
    ],
  },
  {
    // stairs climb from each corner to a gallery along the north and south walls: a vantage over the fight
    id: 'galleries', types: ['normal', 'path'], floors: [1, 6], height: 8, ceiling: 'vault-x', rows: [
      '123.......321',
      '.............',
      '.............',
      '......K......',
      '.............',
      '.............',
      '123.......321',
    ],
    layers: [{ y: 3, rows: ['...bbbbbbb...', '.............', '.............', '.............', '.............', '.............', '...bbbbbbb...'] }],
  },
  {
    // a pier: the way from the north door to the south runs over a dry dock; the east and west doors stand on ledges
    id: 'pier', types: ['normal', 'path'], floors: [1, 9], weight: 3, height: 6, rows: [
      '=====...=====',
      '=====...=====',
      '..===...===..',
      '.d===.K.===d.',
      '..===...===..',
      '=====...=====',
      '=====...=====',
    ],
  },
  {
    // four deep pools fill the corners: Doubt keeps out of them, Panic calms in them
    id: 'quad-pools', types: ['normal'], floors: [1, 6], height: 6, ceiling: 'vault-z', rows: [
      'WWWW.....WWWW',
      'WWWW.....WWWW',
      '.............',
      '......K......',
      '.............',
      'WWWW.....WWWW',
      'WWWW.....WWWW',
    ],
  },
  {
    // ramparts: a stair climbs each wall, one up from the west, one from the east; over the top is a drop you can't climb back
    id: 'ramparts', types: ['normal'], floors: [1, 9], weight: 3, height: 6, rows: [
      '.............',
      'XXXXXEEEXXXXX',
      '..3.......1..',
      '..2...K...2..',
      '..1.......3..',
      'XXXXXEEEXXXXX',
      '.............',
    ],
  },
  {
    // stepping stones: single tiles of floor in two dry trenches, a jump apart
    id: 'stepping-stones', types: ['normal', 'path'], floors: [1, 6], height: 6, rows: [
      '..===...===..',
      '..===...===..',
      '..=.=...=.=..',
      '..===.K.===..',
      '..=.=...=.=..',
      '..===...===..',
      '..===...===..',
    ],
  },
  {
    // a raised walk on brick: a frame at the height of the doors' lintels round the middle, reached by corner stairs
    id: 'mezzanine', types: ['normal'], floors: [1, 6], height: 8, ceiling: 'cross', rows: [
      '123.......321',
      '.............',
      '.............',
      '......K......',
      '.............',
      '.............',
      '123.......321',
    ],
    layers: [{
      y: 3, rows: [
        '...b.....b...',
        '...bbbbbbb...',
        '...b.....b...',
        '...b.....b...',
        '...b.....b...',
        '...bbbbbbb...',
        '...b.....b...',
      ],
    }],
  },
  {
    // a bridge over a dry pit, broken short of the middle on both sides: finish it
    id: 'broken-bridge', types: ['normal', 'path'], floors: [1, 9], weight: 3, height: 7, ceiling: 'vault-z', rows: [
      '.====...====.',
      '.====...====.',
      '.====...====.',
      '.1====K====1.',
      '.====...====.',
      '.====...====.',
      '.====...====.',
    ],
    layers: [{ y: 1, rows: ['.............', '.............', '.............', '..bb.....bb..', '.............', '.............', '.............'] }],
  },
  {
    // an atrium: shallow pools east and west of the middle, benches in the corners
    id: 'atrium', types: ['normal'], floors: [1, 6], height: 7, ceiling: 'dome', rows: [
      '1...........1',
      '.............',
      '..ww.....ww..',
      '..ww..K..ww..',
      '..ww.....ww..',
      '.............',
      '1...........1',
    ],
  },
  {
    // pitfalls: holes two deep to knock projections into (and to climb out of with a block)
    id: 'pitfalls', types: ['normal'], floors: [1, 5], height: 6, rows: [
      '.............',
      '.==.......==.',
      '.==..=.=..==.',
      '......K......',
      '.==..=.=..==.',
      '.==.......==.',
      '.............',
    ],
  },
  {
    // a chapel: low benches either side of the aisle
    id: 'chapel', types: ['normal'], floors: [1, 5], height: 6, ceiling: 'vault-z', rows: [
      '.............',
      '..bbb...bbb..',
      '.............',
      '......K......',
      '.............',
      '..bbb...bbb..',
      '.............',
    ],
  },
  {
    // two deep canals from wall to wall: swim across, or fight on the banks
    id: 'canals', types: ['normal', 'path'], floors: [2, 9], height: 6, ceiling: 'vault-x', rows: [
      '.............',
      'WWWWWWWWWWWWW',
      '.............',
      '......K......',
      '.............',
      'WWWWWWWWWWWWW',
      '.............',
    ],
  },
  {
    // towers by the north and south doors, each reached by a stair from its corner: four places to stand above the fight
    id: 'watchtowers', types: ['normal'], floors: [2, 9], height: 8, ceiling: 'pointed-z', rows: [
      '1234.....4321',
      '.............',
      '.............',
      '......K......',
      '.............',
      '.............',
      '1234.....4321',
    ],
  },
  {
    // dikes: walls of stone two high from wall to wall, east and west; break them or build over
    id: 'dikes', types: ['normal'], floors: [1, 9], weight: 3, height: 6, rows: [
      'ww.R.....R.ww',
      'w..R.....R..w',
      '...R.....R...',
      '...R..K..R...',
      '...R.....R...',
      'w..R.....R..w',
      'ww.R.....R.ww',
    ],
  },
  {
    // trapdoors: two wide pits from wall to wall leave the north and south doors on ledges of their own
    id: 'trapdoors', types: ['normal', 'path'], floors: [1, 9], weight: 3, height: 6, rows: [
      '.............',
      'X===========X',
      '.===========.',
      '.d....K....d.',
      '.===========.',
      'X===========X',
      '.............',
    ],
  },
  {
    // a pillared hall: columns against the walls by the doors and on the cross, never in the corners
    id: 'pillared-hall', types: ['normal'], floors: [2, 9], height: 8, ceiling: 'cross', rows: [
      '....#...#....',
      '.............',
      '.............',
      '...#..K..#...',
      '.............',
      '.............',
      '....#...#....',
    ],
  },
  {
    // mud flats: dips of mud and shallow puddles slow the chase
    id: 'mud-flats', types: ['normal'], floors: [1, 5], height: 6, rows: [
      '.............',
      '.__._..._.__.',
      '.__.......__.',
      '....w...w....',
      '.__.......__.',
      '.__._..._.__.',
      '.............',
    ],
  },
  {
    // split levels: four raised decks a block high fill the corners; nothing spawns in them
    id: 'split-level', types: ['normal'], floors: [1, 5], height: 6, ceiling: 'vault-x', rows: [
      '1111.....1111',
      '1111.....1111',
      '.............',
      '......K......',
      '.............',
      '1111.....1111',
      '1111.....1111',
    ],
  },
  {
    // runnels: four shallow channels run in from the corners towards the middle
    id: 'runnels', types: ['normal'], floors: [1, 5], height: 6, rows: [
      'w...........w',
      '.w.........w.',
      '..w.......w..',
      '......K......',
      '..w.......w..',
      '.w.........w.',
      'w...........w',
    ],
  },
  {
    // potholes: pairs of dips across the floor
    id: 'potholes', types: ['normal'], floors: [1, 5], rows: [
      '.............',
      '.__.......__.',
      '.__.__.__.__.',
      '......K......',
      '.__.__.__.__.',
      '.__.......__.',
      '.............',
    ],
  },
  {
    // curbs: a brick ledge a block high runs round the walls; the corners are part of it
    id: 'curbs', types: ['normal'], floors: [1, 5], height: 6, ceiling: 'vault-z', rows: [
      '11111...11111',
      '1...........1',
      '.............',
      '......K......',
      '.............',
      '1...........1',
      '11111...11111',
    ],
  },
  {
    // a ring of dips round the middle: the chase dips and climbs
    id: 'trench-ring', types: ['normal'], floors: [1, 5], height: 6, ceiling: 'dome', rows: [
      '.............',
      '...___.___...',
      '...__...__...',
      '...._.K._....',
      '...__...__...',
      '...___.___...',
      '.............',
    ],
  },
  {
    // bleachers: tiers two high along the north and south walls, open by the doors
    id: 'bleachers', types: ['normal'], floors: [1, 6], height: 7, ceiling: 'vault-x', rows: [
      '22221...12222',
      '11111...11111',
      '.............',
      '......K......',
      '.............',
      '11111...11111',
      '22221...12222',
    ],
  },
  {
    // wells: four shafts two deep, one tile wide: knock projections in; a block gets you out
    id: 'wells', types: ['normal'], floors: [1, 5], height: 6, rows: [
      '.............',
      '...=.....=...',
      '.............',
      '......K......',
      '.............',
      '...=.....=...',
      '.............',
    ],
  },
  {
    // rafters: brick beams overhead from wall to wall, for whoever builds up to them
    id: 'rafters', types: ['normal'], floors: [1, 6], height: 8, ceiling: 'vault-x', rows: [
      '.............',
      '.............',
      '.............',
      '...r..K..r...',
      '.............',
      '.............',
      '.............',
    ],
    layers: [{ y: 5, rows: ['.............', 'bbbbbbbbbbbbb', '.............', '.............', '.............', 'bbbbbbbbbbbbb', '.............'] }],
  },
  // ── from the second floor: fire ──
  {
    // braziers burn on low plinths on the cross; crates wait by the doors to be kicked into them
    id: 'braziers', types: ['normal'], floors: [2, 9], height: 7, ceiling: 'cross', rows: [
      '....c...c....',
      '.............',
      '.............',
      '..2...K...2..',
      '.............',
      '.............',
      '....c...c....',
    ],
    layers: [{ y: 2, rows: ['.............', '.............', '.............', '..f.......f..', '.............', '.............', '.............'] }],
  },
  {
    // two lanes of flame from wall to wall, too wide to jump: break the floor under them, or bring water
    id: 'fire-lanes', types: ['normal', 'path'], floors: [2, 9], weight: 3, height: 6, rows: [
      '...ff...ff...',
      '...ff...ff...',
      '...ff...ff...',
      '.d.ff.K.ff.d.',
      '...ff...ff...',
      '...ff...ff...',
      '...ff...ff...',
    ],
  },
  {
    // every door its own trial: a brick wall to the north, a trench to the west, an obsidian wall to the east
    id: 'trials', types: ['normal'], floors: [2, 9], weight: 3, height: 6, rows: [
      '.............',
      '#####DDD#####',
      '.===.....E...',
      '.===..K..E...',
      '.===.....E...',
      '.===.....X...',
      '.===.....X...',
    ],
  },
  {
    // arches of brick spring over the hall from pillars by the doors
    id: 'arches', types: ['normal'], floors: [2, 9], height: 8, ceiling: 'pointed-x', rows: [
      '....3...3....',
      '.............',
      '.............',
      '......K......',
      '.............',
      '.............',
      '....3...3....',
    ],
    layers: [{ y: 3, rows: ['....b...b....', '....b...b....', '....b...b....', '....b...b....', '....b...b....', '....b...b....', '....b...b....'] }],
  },
  // ── the first floors: soft walls ──
  {
    // barricades of crates from wall to wall, east and west: break, burn or climb
    id: 'barricades', types: ['normal'], floors: [1, 5], weight: 3, height: 6, rows: [
      '...C.....C...',
      '...C.....C...',
      '...C.....C...',
      '...C..K..C...',
      '...C.....C...',
      '...C.....C...',
      '...C.....C...',
    ],
  },
  {
    // brick halls: walls of brick split the room into three, a door of dirt in each
    id: 'brick-halls', types: ['normal'], floors: [1, 5], weight: 3, height: 6, rows: [
      '...#.....#...',
      '...#.....#...',
      '...D.....D...',
      '...D..K..D...',
      '...D.....D...',
      '...#.....#...',
      '...#.....#...',
    ],
  },
  {
    // planters of soil in the middle, drains in the corners
    id: 'planters', types: ['normal'], floors: [1, 6], height: 6, ceiling: 'vault-z', rows: [
      '__.........__',
      '_..........._',
      '...dd...dd...',
      '......K......',
      '...dd...dd...',
      '_..........._',
      '__.........__',
    ],
  },
  // ── from the third floor: water and lava ──
  {
    // a forge: gutters of lava along the walls, anvils of obsidian on the cross
    id: 'forge', types: ['normal'], floors: [3, 9], height: 7, ceiling: 'vault-z', rows: [
      '.............',
      '.llll...llll.',
      '.............',
      '..o...K...o..',
      '.............',
      '.llll...llll.',
      '.............',
    ],
  },
  {
    // canal locks: the side halls are flooded behind obsidian gates with plugs of dirt; open one and the water comes in
    id: 'locks', types: ['normal'], floors: [3, 9], weight: 3, height: 7, rows: [
      'WWWWX...XWWWW',
      'WWWWX...XWWWW',
      '.WWWE...EWWW.',
      '.WWWE.K.EWWW.',
      '.WWWE...EWWW.',
      'WWWWX...XWWWW',
      'WWWWX...XWWWW',
    ],
  },
  {
    // quench: a lava trench beside a pool held back by obsidian; break the obsidian and the water makes the bridge
    id: 'quench', types: ['normal', 'path'], floors: [3, 9], weight: 3, height: 7, rows: [
      'wwoLL...LLoww',
      'wwoLL...LLoww',
      '..oLL...LLo..',
      '.doLL.K.LLod.',
      '..oLL...LLo..',
      'wwoLL...LLoww',
      'wwoLL...LLoww',
    ],
  },
  {
    // a causeway runs north to south through a deep reservoir; a walk runs round it
    id: 'causeway', types: ['normal', 'path'], floors: [3, 6], height: 8, ceiling: 'vault-z', rows: [
      '.............',
      '.WWWWW.WWWWW.',
      '.WWWWW.WWWWW.',
      '.WWWWWKWWWWW.',
      '.WWWWW.WWWWW.',
      '.WWWWW.WWWWW.',
      '.............',
    ],
  },
  {
    // a cloister whose garth is flooded: fight on the walk, swim the garth
    id: 'flooded-cloister', types: ['normal'], floors: [3, 6], height: 7, ceiling: 'cross', rows: [
      '.............',
      '..WWWWWWWWW..',
      '..WWWWWWWWW..',
      '.............',
      '..WWWWWWWWW..',
      '..WWWWWWWWW..',
      '.............',
    ],
  },
  {
    // a ring of lava: the waves come from inside it
    id: 'lava-ring', types: ['challenge'], floors: [3, 9], height: 7, ceiling: 'dome', rows: [
      '.............',
      '..lll...lll..',
      '..l.......l..',
      '......K......',
      '..l.......l..',
      '..lll...lll..',
      '.............',
    ],
  },
  {
    // a lava lake: the east and west doors stand on ledges across it
    id: 'lava-lake', types: ['normal', 'path'], floors: [4, 9], weight: 3, height: 7, ceiling: 'cave', rows: [
      'LLLLL...LLLLL',
      'LLLLL...LLLLL',
      '..LL.....LL..',
      '.dLL..K..LLd.',
      '..LL.....LL..',
      'LLLLL...LLLLL',
      'LLLLL...LLLLL',
    ],
  },
  {
    // boilers: lava in the corners, water on the cross, never touching; drag a projection from one to the other
    id: 'boilers', types: ['normal'], floors: [4, 9], height: 7, ceiling: 'vault-x', rows: [
      'll.........ll',
      'l...........l',
      '...w.....w...',
      '...w..K..w...',
      '...w.....w...',
      'l...........l',
      'll.........ll',
    ],
  },
  // ── the deep circles ──
  {
    // an ash field: embers burn in the open; the hollows hold the heat
    id: 'ash-field', types: ['normal'], floors: [6, 9], height: 6, ceiling: 'cave', rows: [
      '.............',
      '...f.....f...',
      '.__.......__.',
      '.....f.f.....',
      '.__.......__.',
      '...f.....f...',
      '.............',
    ],
  },
  {
    // a crypt: tombs two high on the cross with flames at their heads, low benches for the mourners
    id: 'crypt', types: ['normal'], floors: [6, 9], height: 6, ceiling: 'vault-z', rows: [
      '.............',
      '...b.....b...',
      '.............',
      '..22..K..22..',
      '.............',
      '...b.....b...',
      '.............',
    ],
    layers: [{ y: 2, rows: ['.............', '.............', '.............', '..f.......f..', '.............', '.............', '.............'] }],
  },
  {
    // ice floes: the cold water at the bottom of the world, broken by dry floes
    id: 'ice-floes', types: ['normal'], floors: [8, 9], height: 7, ceiling: 'dome', rows: [
      'WWW.......WWW',
      'WW..WW.WW..WW',
      '...WW...WW...',
      '......K......',
      '...WW...WW...',
      'WW..WW.WW..WW',
      'WWW.......WWW',
    ],
  },
  // ── challenge rooms ──
  {
    // crossfire: low walls to duck behind, north and south
    id: 'crossfire', types: ['challenge'], floors: [1, 9], height: 7, ceiling: 'vault-x', rows: [
      '.............',
      '...bbb.bbb...',
      '.............',
      '......K......',
      '.............',
      '...bbb.bbb...',
      '.............',
    ],
  },
  {
    // a pool in the middle: the fight runs round it, and through it
    id: 'pool-arena', types: ['challenge'], floors: [1, 9], height: 7, ceiling: 'dome', rows: [
      '.............',
      '.............',
      '...www.www...',
      '...w..K..w...',
      '...www.www...',
      '.............',
      '.............',
    ],
  },
  {
    // bunkers: four nests of low brick to hold
    id: 'bunkers', types: ['challenge'], floors: [1, 9], height: 6, rows: [
      '.............',
      '...b.....b...',
      '..bb.....bb..',
      '......K......',
      '..bb.....bb..',
      '...b.....b...',
      '.............',
    ],
  },
  // ── rooms bigger than their cell ──
  {
    // twin courts: an obsidian wall with a plug of dirt between two courts; the far one is a pool with an island
    id: 'twin-courts', types: ['normal', 'path'], floors: [2, 9], size: [2, 1], weight: 3, height: 7, rows: [
      '...............X............',
      '...............X.WWWWWWWWW..',
      '...............E.WWW...WWW..',
      '...r..K..r.....E.WWW.K.WWW..',
      '...............E.WWW...WWW..',
      '...............X.WWWWWWWWW..',
      '...............X............',
    ],
  },
  {
    // a hypostyle: a long hall of columns, every column against a wall or on the cross
    id: 'hypostyle', types: ['normal', 'path'], floors: [2, 6], size: [2, 1], height: 8, ceiling: 'cross', rows: [
      '....#...#..........#...#....',
      '............................',
      '............................',
      '...#..K..#.......#.....#....',
      '............................',
      '............................',
      '....#...#..........#...#....',
    ],
  },
  {
    // an aqueduct: the room runs on into a flooded hall crossed by a parapeted bridge
    id: 'aqueduct', types: ['normal', 'path'], floors: [1, 5], size: [2, 1], height: 8, ceiling: 'vault-x', rows: [
      '...............WWWWWWWWWWWWW',
      '...............WWWWWWWWWWWWW',
      '...............bbbbbbbbbb...',
      '...r..K..r..............K...',
      '...............bbbbbbbbbb...',
      '...............WWWWWWWWWWWWW',
      '...............WWWWWWWWWWWWW',
    ],
  },
  {
    // a cistern hall: deep channels along the far hall's walls, a dry nave between them
    id: 'cistern-hall', types: ['normal', 'path'], floors: [3, 5], size: [2, 1], height: 8, ceiling: 'vault-x', rows: [
      'WW.........WW..WWWWWWWWWWWWW',
      '...............WWWWWWWWWWWWW',
      '............................',
      '......K..........#.....#....',
      '............................',
      '...............WWWWWWWWWWWWW',
      'WW.........WW..WWWWWWWWWWWWW',
    ],
  },
  {
    // a lake hall: the room drops south into a cavern lake with the key on an island
    id: 'lake-hall', types: ['normal', 'path'], floors: [3, 5], size: [1, 2], height: 8, ceiling: 'cave', rows: [
      '.............',
      '.............',
      '.............',
      '...#..K..#...',
      '.............',
      '.............',
      '.............',
      '.............',
      '.............',
      'WWWWW...WWWWW',
      'WWWWWWWWWWWWW',
      'WWWW.....WWWW',
      'WWWW..K..WWWW',
      'WWWW.....WWWW',
      'WWWWWWWWWWWWW',
      'WWWWWWWWWWWWW',
    ],
  },
  {
    // an ember hall: the far hall is a floor of lava; walk its edges, and bridge to the key's island
    id: 'ember-hall', types: ['normal', 'path'], floors: [5, 9], size: [2, 1], weight: 3, height: 8, ceiling: 'pointed-x', rows: [
      '............................',
      '...............LLLLLLLLLLLLL',
      '...............LLLLLLLLLLLLL',
      '...#..K..#.....LLLLLLLLLL.K.',
      '...............LLLLLLLLLLLLL',
      '...............LLLLLLLLLLLLL',
      '............................',
    ],
  },
  {
    // catacombs: an obsidian wall with a plug of dirt, and beyond it the crypt's cells with flames in their niches
    id: 'catacombs', types: ['normal'], floors: [6, 9], size: [1, 2], mirror: false, weight: 3, height: 7, rows: [
      '.............',
      '.............',
      '.............',
      '...r..K..r...',
      '.............',
      '.............',
      '.............',
      'XXXXXEEEXXXXX',
      '....X...X....',
      '....X...X....',
      '.f..X...X..f.',
      '....E...E....',
      '.f..E.K.E..f.',
      '....E...E....',
      '.f..X...X..f.',
      '....X...X....',
    ],
  },
  // ── starts ──
  {
    // a landing under a barrel vault: stairs to galleries along the north and south walls
    id: 'landing', types: ['start'], height: 8, ceiling: 'vault-z', rows: [
      '123.......321',
      '.............',
      '.............',
      '......P......',
      '.............',
      '.............',
      '123.......321',
    ],
    layers: [{ y: 3, rows: ['...bbbbbbb...', '.............', '.............', '.............', '.............', '.............', '...bbbbbbb...'] }],
  },
  {
    // an atrium to land in: benches in the corners, shallow pools east and west
    id: 'court', types: ['start'], height: 7, ceiling: 'dome', rows: [
      '1...........1',
      '.............',
      '.ww.......ww.',
      '.ww...P...ww.',
      '.ww.......ww.',
      '.............',
      '1...........1',
    ],
  },
  // ── treasure and vaults ──
  {
    // the practice in an enclosure of low brick, open to the south
    id: 'enclosure', types: ['treasure'], height: 6, ceiling: 'vault-x', rows: [
      '.............',
      '...1111111...',
      '...1.....1...',
      '...1..T..1...',
      '...1.....1...',
      '...111.111...',
      '.............',
    ],
  },
  {
    // the practice between four braziers on pillars
    id: 'lantern-hall', types: ['treasure'], floors: [2, 9], height: 7, ceiling: 'cross', rows: [
      '.............',
      '....2...2....',
      '.............',
      '......T......',
      '.............',
      '....2...2....',
      '.............',
    ],
    layers: [{ y: 2, rows: ['.............', '....f...f....', '.............', '.............', '.............', '....f...f....', '.............'] }],
  },
  {
    // the practice behind a wall of crates, open to the south
    id: 'crate-cache', types: ['treasure'], height: 6, rows: [
      '.............',
      '....CCCCC....',
      '....C...C....',
      '....C.T.C....',
      '....C...C....',
      '....CC.CC....',
      '.............',
    ],
  },
  {
    // a strongbox: four columns round the practice, crates by the walls
    id: 'strongbox', types: ['vault'], height: 6, ceiling: 'vault-x', rows: [
      '.............',
      '...c.....c...',
      '.....#.#.....',
      '......T......',
      '.....#.#.....',
      '...c.....c...',
      '.............',
    ],
  },
  {
    // a vigil: four flames on low plinths keep watch round the practice
    id: 'vigil', types: ['vault'], floors: [2, 9], height: 6, rows: [
      '.............',
      '.............',
      '....1...1....',
      '......T......',
      '....1...1....',
      '.............',
      '.............',
    ],
    layers: [{ y: 1, rows: ['.............', '.............', '....f...f....', '.............', '....f...f....', '.............', '.............'] }],
  },
  // ── bosses (below the Roots a boss room is always two cells) ──
  {
    // a throne hall: the way down in the first hall, the boss's practice on a dais in the second between braziers
    id: 'throne-hall', types: ['boss'], floors: [2, 4], size: [2, 1], height: 8, ceiling: 'pointed-x', rows: [
      '............................',
      '...r.....r..................',
      '....................111.....',
      '......H...........2.1T1.2...',
      '............................',
      '...r.....r..................',
      '............................',
    ],
    layers: [{ y: 2, rows: ['............................', '............................', '............................', '..................f.....f...', '............................', '............................', '............................'] }],
  },
  {
    // an ember throne: the second hall is pooled with lava round the boss's practice
    id: 'ember-throne', types: ['boss'], floors: [6, 8], size: [2, 1], height: 8, ceiling: 'cave', rows: [
      '............................',
      '...r.....r.......LLL...LLL..',
      '.................LLL...LLL..',
      '......H...............T.....',
      '.................LLL...LLL..',
      '...r.....r.......LLL...LLL..',
      '............................',
    ],
  },
  {
    // the Shadow's arena (floor 9, docs/design/built/bosses/ARENAS.md): the biggest room a floor can hold, four cells
    // of space under a flat roof at the band's full height. You come in at one corner and your Shadow rises at the
    // far one; between you, cover of every material the frozen floor has: pillars of dark brick to the roof, obsidian
    // walls, stepped ashlar ledges, stone boulders, crates and dirt that a shot breaks, lead ore, and ice underfoot.
    // The diagonal between the doors and the far corner stays open, so you see it the moment it rises.
    id: 'mirror-hall', types: ['boss'], floors: [9, 9], size: [2, 2], height: 8, bossStart: 'far', rows: [
      '..............1233321.......',
      '...........Rr.1233321.......',
      '..........o.................',
      '......H.......Cc........o...',
      '.........c.......##........C',
      '.Cc..............##.....i..c',
      '..........r..........cC.....',
      '..R...........od.....X......',
      '..r..iii.............X..##..',
      '.1233.......ww...Rr..X..##..',
      '.1233...##.www............R.',
      '........##......i.www.T...r.',
      '...b................d.bbb...',
      '...o....d....XXXX...........',
      '.......Rr..Cc....1233321....',
      '.................1233321....',
    ],
  },
];
