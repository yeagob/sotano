// Development logs (issue #49, docs/architecture/OVERVIEW.md "Development logs"): one console line per
// game event a developer edits content and layouts by: items picked up, rooms entered (by template name),
// monsters spawned and killed, drops, table and chest interactions. A developer tool: English only and not in i18n/, like the debug readout.
//
// The gate: lines print in development builds (Vite `import.meta.env.DEV`) and in builds of the
// `develop` branch (`DEVLOG_BRANCH`, set by vite.config.ts from the host's branch variable). Release
// builds and main print nothing, and when the gate is off `attachDevlog` installs no hooks at all.
// Nothing is stored: the lines go straight to the console.

import type { GameBus, GameEvents } from '../game/events';
import type { PartKind } from '../content/parts';

/** The gate, as a pure function: the build flags go in so both answers can be tested. */
export function devlogEnabled(dev: boolean, branch: string): boolean {
  return dev || branch === 'develop';
}

export class Devlog {
  constructor(readonly on: boolean, private readonly out: (line: string) => void = line => console.log(line)) {}

  /** One developer line. Nothing happens when the gate is off. */
  line(text: string): void {
    if (this.on) this.out(`[devlog] ${text}`);
  }
}

/** The one log of the running build: on in development and on the develop branch. */
export const devlog = new Devlog(devlogEnabled(import.meta.env.DEV, DEVLOG_BRANCH));

/** A block cell as the developer reads it in layouts: whole block coordinates. */
export function cell(x: number, y: number, z: number): string {
  return `(${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)})`;
}

/** What a hand slot holds: a block (its material id), a part, or a flask. */
export function carriedName(c: number | { kind: PartKind } | { potion: string }): string {
  if (typeof c === 'number') return `block ${c}`;
  if ('potion' in c) return `flask ${c.potion}`;
  return `${c.kind} part`;
}

const SOURCE = 'devlog';
/** Side effects run after every hook that changes the payload (game/events.ts): the line shows the final state. */
const AFTER_CHANGES = 250;

/**
 * Installs the development hooks on a bus (one per run: the game makes a new bus for each run). The
 * lines that come from the game's own code (table and chest results) are written where they happen.
 * Returns a function that removes the hooks.
 */
export function attachDevlog(bus: GameBus, log: Devlog = devlog): () => void {
  if (!log.on) return () => {};
  // what last hurt each projection: its death is then reported with the event that caused it
  const lastHit = new Map<number, string>();
  const hook = <K extends keyof GameEvents>(type: K, fn: (ctx: GameEvents[K]) => void) =>
    bus.on(type, { priority: AFTER_CHANGES, source: SOURCE, fn });

  hook('itemGained', e => log.line(`item picked up: ${e.id} (uid ${e.uid})`));
  hook('roomEnter', e => log.line(`room entered: ${e.template} (room ${e.room}, ${e.type}, ${e.firstVisit ? 'first visit' : 'revisit'})`));
  hook('enemySpawn', e => log.line(`monster spawned: ${e.def} (actor ${e.id}, hp ${e.hp}${e.tags.has('rooted') ? ', rooted' : ''}) at ${cell(e.x, e.y, e.z)}`));
  hook('actorDamage', e => {
    if (e.targetKind === 'projection') lastHit.set(e.target, `${e.kind} from ${e.source}`);
  });
  hook('actorDeath', e => {
    if (e.targetKind !== 'projection') return;
    log.line(`monster died: ${e.def} (actor ${e.target}) at ${cell(e.x, e.y, e.z)}, caused by ${lastHit.get(e.target) ?? 'unknown'}`);
    lastHit.delete(e.target);
    for (const k of e.drops) log.line(`item dropped: ${k} from ${e.def}`);
  });
  hook('blockLoot', e => {
    for (const k of e.drops) log.line(`item dropped: ${k} from block at ${cell(e.x, e.y, e.z)} (${e.source})`);
  });
  hook('roomClear', e => {
    for (const k of e.drops) log.line(`item dropped: ${k} as the reward of room ${e.room}`);
  });
  return () => bus.off(null, SOURCE);
}
