import { Game } from './game/game';
import { browserStore, loadMeta } from './game/meta';
import { ITEMS } from './content/items';
import { MAT } from './content/materials';
import { GEN_VERSION } from './core/seed';
import { setLocale, t } from './i18n';
import { initDom } from './i18n/dom';
import { initLanding } from './game/landing';
import { testBenchOn } from './debug/test-bench';
import type { HeartKind } from './content/heart-art';

async function boot() {
  initDom(); // language first: everything below may show text
  const version = document.getElementById('version');
  if (version) version.textContent = APP_VERSION;
  const params = new URLSearchParams(location.search);
  // ?gallery: deterministic art captures instead of the game (docs/art/DECISIONS.md §12.5)
  if (params.has('gallery')) {
    const { runGallery } = await import('./debug/gallery');
    runGallery(params);
    document.getElementById('loading')?.remove();
    return;
  }
  // the save record is read once here; the game writes it through the browser's store (SAVE.md)
  const save = { meta: loadMeta(browserStore), store: browserStore };
  // ?seed=ABCD-EFGH replays a run; without it every run is new
  const game = new Game(document.getElementById('game') as HTMLCanvasElement, params.get('seed') ?? undefined, save);
  initLanding(game);
  // ?sky: the run starts on the sky's deck (docs/architecture/SKY.md §15; R2 adds the floors)
  if (params.has('sky')) game.debugSky();
  // ?sandbox[=scenario]: the creative room; &lab runs the scenario's script and prints its report
  // (docs/architecture/SANDBOX.md)
  let sb: Record<string, unknown> | null = null;
  if (params.has('sandbox')) {
    const { sandboxConsole } = await import('./sandbox/console');
    sb = sandboxConsole(game, params.get('sandbox') || 'blank', params.has('lab'));
    if (params.has('lab')) { document.getElementById('loading')?.remove(); return; }
  }
  const v = params.get('v');
  if (v && Number(v) !== GEN_VERSION) game.hud.toast('toast.seedVersion', { v, build: GEN_VERSION });

  // debug shortcuts in the browser console
  const S = {
    game,
    give: (id: string) => game.give(id),
    items: ITEMS.map(i => i.id),
    stats: () => game.stats.all,
    restart: (s?: string) => game.newRun(s),
    seed: () => game.seedLabel,
    hold: (...keys: string[]) => { game.player.hand = keys.map(k => MAT[k]).filter(Boolean); },
    keys: (n = 1) => { game.collect('key', n); },
    bombs: (n = 1) => { game.collect('bomb', n); },
    heal: (n = 6) => { game.heal(n * 4, 'console'); },   // half-hearts
    hurt: (n = 1) => { game.damagePlayer(n, 'item', 'console', 'world'); },
    heart: (kind: HeartKind = 'red') => {
      const b = game.player.body, f = game.player.forward;
      game.pickups.add('heart', b.x + f.x * 1.5, b.y + 0.5, b.z + f.z * 1.5, game.room, null, 0.3, null, kind);
    },
    god: (on = true) => { game.player.invulnT = on ? 1e9 : 0; },
    lose: (id: string) => { game.inventory.lose(id); game.hud.setItems(game.inventory.items.map(i => i.def)); },
    floor: () => game.nextFloor(),
    enemies: () => game.enemies.list.map(e => `${e.id}:${e.def} hp ${e.hp} ${e.faction}`),
    /** Turns the nearest projection into an ally (debug for factions). */
    charm: () => {
      const b = game.player.body;
      let best = null as (typeof game.enemies.list)[number] | null, bd = Infinity;
      for (const e of game.enemies.list) {
        const d = Math.hypot(e.body.x - b.x, e.body.z - b.z);
        if (e.alive && e.faction !== 'self' && d < bd) { best = e; bd = d; }
      }
      if (best) game.setFaction(best, 'self', 'console');
      return best ? `${best.id}:${best.def} is now an ally` : 'no projection';
    },
    room: () => game.rooms.get(game.room),
    hooks: () => game.bus.dump(),
    synergies: () => game.inventory.synergiesActive.map(s => s.id),
    tp: (x: number, y: number, z: number) => game.player.spawnAt(x, y, z),
    debug: (on = true) => { game.hud.showDebug = on; },
    trace: (on = true) => { game.bus.trace = on; },
    /** Opens the Sanctuary without a Boundary, to review it: S.sanctuary(60) runs its clock 60 times faster. */
    sanctuary: (rate = 1) => game.openSanctuary(o => console.log(`sanctuary: ${o}`), rate),
    /** The Roots' page the next run starts on (debug, in memory, never saved): S.roots(3), then S.restart(); S.roots(null) reads the save again. */
    roots: (page: number | null) => game.setRootsPage(page),
    /** The Roots' mastery level the next runs start with (debug, in memory, never saved): S.mastery(36), then S.restart(). */
    mastery: (level: number) => game.setMastery(level),
    /** Switch language without saving the choice ('en', 'es'). */
    lang: (code: string) => setLocale(code),
    /** The sandbox's console (only with ?sandbox): S.sb.help(). */
    sb,
  };
  (window as any).S = S;
  // ?test: the test bench, a panel to skip floors, hold god mode and read the guide (docs/testing/TEST-BENCH.md)
  if (testBenchOn(params)) {
    const { mountTestPanel } = await import('./debug/test-panel');
    mountTestPanel(game, S);
  }

  let last = performance.now();
  const loop = (now: number) => {
    game.frame((now - last) / 1000);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.getElementById('loading')?.remove();
}

boot().catch(err => {
  console.error(err);
  const el = document.getElementById('loading');
  if (el) el.textContent = t('app.failed', { error: String(err?.message ?? err) });
});
