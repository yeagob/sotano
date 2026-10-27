// The lab (docs/architecture/SANDBOX.md): runs a scenario in the real game, tick by fixed tick with
// no mouse, follows its script and returns a text report. Same scenario, same build: same report,
// so a change shows up as a diff of a few lines (scripts/sandbox.mjs runs it headless).

import { MAT, MATERIALS } from '../content/materials';
import type { Game } from '../game/game';
import { applyPlacement, type Action, type Scenario, type Vec3 } from './scenario';
import { blockCounts, elementCounts, legend, mapAt, num } from './report';

const TPS = 60;

/** What an event is about, for its count: the material, the reaction, the projection, the element. */
function detail(type: string, p: Record<string, unknown>): string {
  const m = (v: unknown) => typeof v === 'number' ? MATERIALS[v]?.key ?? String(v) : '';
  switch (type) {
    case 'blockDamage': case 'blockBreak': case 'blockPlace': case 'ignite': case 'blockLoot': return m(p.material);
    case 'materialReact': return String(p.reaction);
    case 'actorDamage': return `${p.def}<${p.kind}`;
    case 'actorDeath': case 'enemySpawn': return String(p.def);
    case 'factionChange': return `${p.def}>${p.to}`;
    case 'elementEnter': case 'elementLeave': return `${p.def}:${p.element}`;
    case 'itemGained': return String(p.id);
    case 'debrisImpact': case 'kick': case 'throw': case 'touchCube': return m(p.material);
    default: return '';
  }
}

export interface LabResult { report: string; errors: string[] }

export function runLab(game: Game, s: Scenario): LabResult {
  const errors: string[] = [];
  const origError = console.error;
  console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); origError(...a); };
  try {
    game.newSandbox(s);
    const counts = new Map<string, number>();
    const bus = game.bus as unknown as { emit: (t: string, p: Record<string, unknown>) => { cancelled: boolean } };
    const emit = bus.emit.bind(bus);
    bus.emit = (type, payload) => {
      const ev = emit(type, payload);
      const d = detail(type, payload);
      const key = `${type}${d ? ':' + d : ''}${ev.cancelled ? '!' : ''}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return ev;
    };
    const r = game.rooms.get(game.floors.get(s.floor ?? 1)!.rooms[0].id)!;
    const o: Vec3 = [r.x0, r.y0, r.z0];
    const ticks = s.ticks ?? 120;
    const at = new Set(s.report ?? [0, ticks]);
    const actions = [...(s.actions ?? [])].sort((a, b) => a.t - b.t);
    const out: string[] = [];
    const [w, d] = [r.w, r.d];
    out.push(`# ${s.id}${s.note ? ' — ' + s.note : ''}`);
    out.push(`floor ${s.floor ?? 1} · seed ${s.seed ?? 1} · room ${w}×${d}×${r.height} · ${ticks} ticks (${num(ticks / TPS)} s)`);
    const rel = (x: number, y: number, z: number) => `${num(x - o[0])} ${num(y - o[1])} ${num(z - o[2])}`;
    const snapshot = (t: number) => {
      const p = game.player, b = p.body;
      out.push('', `t ${t} (${num(t / TPS)} s)`);
      out.push(`  player hp ${p.hp}/${game.maxHp} · at ${rel(b.x, b.y, b.z)} · hand [${p.hand.map(m => MATERIALS[m].key).join(' ')}] · bombs ${p.bombs} · keys ${p.keys}${p.dead ? ' · DEAD' : ''}`);
      const items = game.inventory.items.map(i => i.def.id);
      if (items.length) out.push(`  practices ${items.join(' ')} · synergies ${game.inventory.synergiesActive.map(x => x.id).join(' ') || '—'}`);
      for (const e of game.enemies.list) out.push(`  ${e.def}#${e.id} ${e.alive ? `hp ${num(e.hp)}/${e.maxHp}` : 'gone'} · ${e.faction} · at ${rel(e.body.x, e.body.y, e.body.z)}`);
      out.push(`  blocks ${blockCounts(game.world, r)}`);
      out.push(`  elements ${elementCounts(game.world, r)}`);
      const cubes = new Map<string, number>();
      for (let i = 0; i < game.debris.max; i++) if (game.debris.isAlive(i)) {
        const k = MATERIALS[game.debris.material[i]].key;
        cubes.set(k, (cubes.get(k) ?? 0) + 1);
      }
      out.push(`  cubes ${[...cubes].sort().map(([k, n]) => `${k} ${n}`).join(' · ') || '—'} · pickups ${game.pickups.list.length}`);
      if (counts.size) out.push(`  events ${[...counts].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
      counts.clear();
    };
    const views = s.view ?? [0], mapTicks = new Set(s.maps ?? [ticks]), drawn: string[][] = [];
    const drawMaps = (t: number) => {
      for (const h of views) {
        const m = mapAt(game.world, r, h);
        drawn.push(m);
        out.push('', `map t ${t} · h ${h}`, ...m.map(line => '  ' + line));
      }
    };
    let fireFor = 0;
    let next = 0;
    for (let t = 0; t <= ticks; t++) {
      if (at.has(t)) snapshot(t);
      if (mapTicks.has(t)) drawMaps(t);
      while (next < actions.length && actions[next].t === t) act(game, actions[next++], o, n => { fireFor = n; }, errors);
      if (t === ticks) break;
      game.input.fireHeld = fireFor > 0;
      if (fireFor > 0) fireFor--;
      game.step();
    }
    out.push('', `legend ${legend(drawn)}`);
    if (errors.length) out.push('', ...errors.map(e => `ERROR ${e}`));
    return { report: out.join('\n') + '\n', errors };
  } finally {
    console.error = origError;
    game.input.fireHeld = false;
  }
}

function act(game: Game, a: Action, o: Vec3, fire: (ticks: number) => void, errors: string[]) {
  const w = (v: Vec3): Vec3 => [o[0] + v[0], o[1] + v[1], o[2] + v[2]];
  const p = game.player;
  if (!('do' in a)) { applyPlacement(game.world, o, a); return; }
  switch (a.do) {
    case 'damage': game.damageBlock(...w(a.at), a.amount, a.kind ?? 'intent', 'lab'); break;
    case 'break': game.breakBlock(...w(a.at), 'intent', 'lab'); break;
    case 'explode': { const [x, y, z] = w(a.at); game.explode(x + 0.5, y + 0.5, z + 0.5, a.radius ?? 2.5, a.damage ?? 30, 'lab'); break; }
    case 'cube': case 'bomb': {
      const [x, y, z] = w(a.at), v = a.do === 'cube' ? a.v ?? [0, 0, 0] : [0, 0, 0];
      const i = game.debris.spawn(a.do === 'cube' ? MAT[a.block] : MAT.bomb, x + 0.5, y + 0.5, z + 0.5, v[0], v[1], v[2]);
      if (a.do === 'bomb') game.debris.fuse[i] = a.fuse ?? 1.8;
      break;
    }
    case 'spawn': { const [x, y, z] = w(a.at); if (!game.sandboxSpawn(a.def, x + 0.5, y, z + 0.5, a.faction)) errors.push(`t ${a.t}: could not spawn ${a.def}`); break; }
    case 'give': game.grant(a.item); break;
    case 'lose': game.inventory.lose(a.item); game.hud.setItems(game.inventory.items.map(i => i.def)); break;
    case 'tp': { const [x, y, z] = w(a.at); p.spawnAt(x + 0.5, y, z + 0.5); break; }
    case 'look': {
      const [x, y, z] = w(a.at), e = p.eye;
      const dx = x + 0.5 - e.x, dy = y + 0.5 - e.y, dz = z + 0.5 - e.z;
      p.yaw = Math.atan2(-dx, -dz);
      p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
      break;
    }
    case 'fire': fire(a.ticks ?? 1); break;
    case 'key': game.input.pressed.add(a.code); break;
    case 'use': game.input.placePressed = true; break;
    case 'hand': p.hand = a.blocks.map(k => MAT[k]); break;
  }
}
