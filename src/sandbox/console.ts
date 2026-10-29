// `S.sb` in the browser console with ?sandbox (docs/architecture/SANDBOX.md). Coordinates are
// room-local [col, h, row]. Every edit is also written into the scenario, so `S.sb.export()` gives
// back a JSON file that rebuilds exactly this room.

import { MAT, MATERIALS } from '../content/materials';
import { ITEMS } from '../content/items';
import { ENEMIES } from '../content/enemies';
import { CREATURES } from '../content/creatures';
import { ROOM_TEMPLATES } from '../content/rooms';
import type { ElementKey } from '../content/elements';
import type { Game } from '../game/game';
import { BLANK, SCENARIO_BY_ID, SCENARIOS } from './catalogue';
import { runLab } from './lab';
import { applyPlacement, type Placement, type Scenario, type Vec3 } from './scenario';
import { legend, mapAt } from './report';
import { duel, duelLine, type DuelMode } from './duel';
import { BOSSES } from '../content/bosses';

const HELP = `S.sb — the sandbox (room-local [col, h, row]; h 0 = first air layer)
  list()                       scenarios · templates() · blocks() · items() · projections()
  load('id' | {…})             build a scenario (R reloads it) · reload()
  template('id', {…})          a room from a template, with overrides (floor, mood, flipX…)
  block(x, h, z, 'crate')      box(x0, h0, z0, x1, h1, z1, 'stone') · clear(x, h, z)
  pour(x, h, z, 'water'|'lava'|'fire', level?)    pourBox(x0, h0, z0, x1, h1, z1, 'water')
  spawn('doubt', x, h, z, 'self'?)  give('stoic') · lose('stoic') · hand('crate', 'stone')
  pause(true) · step(60)        freeze the world and move it a fixed tick at a time
  here()                       where you stand · map(h = 0) · export() the scenario as JSON
  lab('id' | {…})              run a scenario's script and print its report
  duel('resistance', 'kite'|'still', {floor, seconds, hp})   a boss against a scripted player, a phase at a time
  duels(floor?)                every boss, both modes`;

export function sandboxConsole(game: Game, initial: string, lab: boolean) {
  const resolve = (s: string | Scenario): Scenario => {
    if (typeof s !== 'string') return structuredClone(s);
    // an ad-hoc scenario straight in the URL or the console: ?sandbox={"rows":[…]}
    if (s.trimStart().startsWith('{')) return { id: 'inline', ...JSON.parse(s) };
    const found = s === 'blank' ? BLANK : SCENARIO_BY_ID.get(s);
    if (!found) throw new Error(`no scenario "${s}" (S.sb.list())`);
    return structuredClone(found);
  };
  const current = () => game.sandbox!;
  const room = () => game.floors.get(game.depth)!.rooms[0];
  const origin = (): Vec3 => { const r = room(); return [r.x0, r.y0, r.z0]; };
  const place = (p: Placement) => {
    applyPlacement(game.world, origin(), p);
    (current().place ??= []).push(p);
  };
  const load = (s: string | Scenario) => {
    const sc = resolve(s);
    game.newSandbox(sc);
    console.info(`[sandbox] ${sc.id}${sc.note ? ': ' + sc.note : ''}`);
    return sc.id;
  };

  if (lab) {
    const { report, errors } = runLab(game, resolve(initial));
    const pre = document.createElement('pre');
    pre.id = 'lab';
    pre.textContent = report;
    document.body.replaceChildren(pre);
    document.body.style.overflow = 'auto';
    document.body.style.userSelect = 'text';
    (window as unknown as { __lab: unknown }).__lab = { report, errors };
    return null;
  }
  load(initial);

  return {
    help: () => console.info(HELP),
    list: () => SCENARIOS.map(s => `${s.id}${s.note ? ' — ' + s.note : ''}`),
    templates: () => ROOM_TEMPLATES.map(t => t.id),
    blocks: () => MATERIALS.slice(1).map(m => m.key),
    items: () => ITEMS.map(i => i.id),
    projections: () => [...ENEMIES, ...CREATURES].map(e => e.id),
    load,
    reload: () => load(current()),
    template: (id: string, over: Partial<Scenario> = {}) => load({ id, template: id, god: true, ...over }),
    block: (x: number, h: number, z: number, key: string) => { if (MAT[key] === undefined) throw new Error(`no block "${key}"`); place({ at: [x, h, z], block: key }); },
    box: (x0: number, h0: number, z0: number, x1: number, h1: number, z1: number, key: string) => { if (MAT[key] === undefined) throw new Error(`no block "${key}"`); place({ at: [x0, h0, z0, x1, h1, z1], block: key }); },
    clear: (x: number, h: number, z: number) => place({ at: [x, h, z], clear: true }),
    pour: (x: number, h: number, z: number, element: ElementKey, level?: number) => place({ at: [x, h, z], element, level }),
    pourBox: (x0: number, h0: number, z0: number, x1: number, h1: number, z1: number, element: ElementKey, level?: number) => place({ at: [x0, h0, z0, x1, h1, z1], element, level }),
    spawn: (def: string, x: number, h: number, z: number, faction?: 'projection' | 'self') => {
      const [ox, oy, oz] = origin();
      if (!game.sandboxSpawn(def, ox + x + 0.5, oy + h, oz + z + 0.5, faction)) throw new Error(`no projection "${def}"`);
      (current().enemies ??= []).push({ def, at: [x, h, z], faction });
    },
    give: (id: string) => { if (game.grant(id)) (current().items ??= []).push(id); },
    lose: (id: string) => {
      game.inventory.lose(id);
      game.hud.setItems(game.inventory.items.map(i => i.def));
      current().items = (current().items ?? []).filter(i => i !== id);
    },
    hand: (...keys: string[]) => { game.player.hand = keys.map(k => MAT[k]).filter(m => m !== undefined); current().hand = keys; },
    pause: (on = true) => { game.paused = on; },
    step: (n = 1) => { for (let i = 0; i < n; i++) game.step(); },
    here: () => {
      const b = game.player.body, [ox, oy, oz] = origin();
      return [Math.floor(b.x - ox), Math.floor(b.y - oy), Math.floor(b.z - oz)];
    },
    map: (h = 0) => { const m = mapAt(game.world, room(), h); console.info(m.join('\n') + '\n' + legend([m])); },
    export: () => JSON.stringify(current(), null, 2),
    lab: (s: string | Scenario) => { const { report } = runLab(game, resolve(s)); console.info(report); return report; },
    duel: (boss: string, mode: DuelMode = 'kite', opt: { floor?: number; seconds?: number; hp?: number } = {}) => duelLine(duel(game, boss, mode, opt)),
    duels: (floor?: number) => BOSSES.flatMap(b => (['still', 'kite'] as const).map(m => duelLine(duel(game, b.id, m, { floor: floor ?? b.minFloor })))).join('\n'),
  };
}
