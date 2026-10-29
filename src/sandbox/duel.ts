// `S.sb.duel('resistance')`: a boss against a scripted player in an empty arena, headless, a phase
// at a time (docs/architecture/SANDBOX.md §5.1). It answers the questions a boss must pass: does it
// move, does it attack, and how much does it hurt a player who stands still and one who keeps
// running around it. The player takes no damage (each hit is counted and then cancelled, with the
// normal second of invulnerability after it).

import type { Game } from '../game/game';
import type { Scenario } from './scenario';

export type DuelMode = 'still' | 'kite';

export interface PhaseReport {
  /** Blocks the boss travelled, its mean distance to you, and how many moves it started. */
  moved: number; distance: number; attacks: number;
  /** Hits that would have landed on you, and their damage points (8 = a heart). */
  hits: number; damage: number;
  /** The most attacks and hostile projectiles on the field at once. */
  hazards: number; projectiles: number;
}

export interface DuelReport { boss: string; mode: DuelMode; floor: number; alive: boolean; phases: PhaseReport[]; selfDamage: number; blocksBroken: number }

/** The arena: a double boss room (28 × 7, 8 high), like the crown hall. */
const ARENA: Scenario = { id: 'duel', rows: Array.from({ length: 7 }, () => '.'.repeat(28)), height: 8, ticks: 1 };

export function duel(game: Game, boss: string, mode: DuelMode = 'kite', opt: { floor?: number; seconds?: number; hp?: number } = {}): DuelReport {
  const floor = opt.floor ?? 1, seconds = opt.seconds ?? 45;
  game.newSandbox({ ...ARENA, floor });
  const p = game.player, r = game.floors.get(game.depth)!.rooms[0];
  p.invulnT = 0;
  if (!game.sandboxSpawn(boss, r.x0 + 21.5, r.y0, r.z0 + 3.5)) throw new Error(`no boss "${boss}"`);
  const e = game.enemies.list.find(x => x.def === boss)!;
  e.hp = e.maxHp = opt.hp ?? 140;
  e.tags.delete('asleep');
  const phases: PhaseReport[] = [0, 1, 2].map(() => ({ moved: 0, distance: 0, attacks: 0, hits: 0, damage: 0, hazards: 0, projectiles: 0 }));
  const ticks = [0, 0, 0];
  let selfDamage = 0, blocksBroken = 0;
  const source = 'sandbox:duel';
  game.bus.on('actorDamage', {
    priority: 50, source, fn: ev => {
      if (ev.target === p.id) { phases[e.stage].hits++; phases[e.stage].damage += ev.amount; ev.amount = 0; p.invulnT = game.stats.get('invuln'); }
      else if (ev.target === e.id) selfDamage += ev.amount;
    },
  });
  game.bus.on('blockBreak', { priority: 250, source, fn: ev => { if (ev.source.startsWith('enemy:')) blocksBroken++; } });
  const cx = r.x0 + 14, cz = r.z0 + 3.5, total = seconds * 60;
  let lx = e.body.x, lz = e.body.z, was = '';
  try {
    for (let i = 0; i < total && e.alive; i++) {
      const t = i / 60;
      if (mode === 'kite') {
        // a lap of the arena every 14 s, at running pace
        const a = t * 0.45;
        p.body.x = cx + Math.cos(a) * 10; p.body.z = cz + Math.sin(a) * 2.6;
        p.body.vx = -Math.sin(a) * 4.5; p.body.vz = Math.cos(a) * 1.2;
      } else {
        p.body.x = r.x0 + 5; p.body.z = cz; p.body.vx = 0; p.body.vz = 0;
      }
      // a third of the time in each phase
      if (i === Math.floor(total / 3)) e.hp = e.maxHp * 0.6;
      if (i === Math.floor(2 * total / 3)) e.hp = e.maxHp * 0.3;
      game.step();
      const s = phases[e.stage];
      if (e.state === 'windup' && was !== 'windup') s.attacks++;
      was = e.state;
      s.moved += Math.hypot(e.body.x - lx, e.body.z - lz); lx = e.body.x; lz = e.body.z;
      s.distance += Math.hypot(e.body.x - p.body.x, e.body.z - p.body.z);
      ticks[e.stage]++;
      const f = game.enemies.pressure();
      s.hazards = Math.max(s.hazards, f.hazards); s.projectiles = Math.max(s.projectiles, f.projectiles);
    }
  } finally {
    game.bus.off(null, source);
  }
  phases.forEach((s, k) => { s.moved = Math.round(s.moved); s.distance = ticks[k] ? Math.round(s.distance / ticks[k] * 10) / 10 : 0; });
  return { boss, mode, floor, alive: e.alive, phases, selfDamage: Math.round(selfDamage), blocksBroken };
}

/** One line per duel, for the console. */
export function duelLine(d: DuelReport): string {
  const ph = d.phases.map((s, k) => `P${k + 1} moved ${s.moved} dist ${s.distance} attacks ${s.attacks} hits ${s.hits} dmg ${s.damage} (field ${s.hazards}/${s.projectiles})`);
  return `${d.boss} · ${d.mode} · floor ${d.floor}${d.alive ? '' : ' · DIED'} | ${ph.join(' | ')} | self ${d.selfDamage} · broke ${d.blocksBroken}`;
}
