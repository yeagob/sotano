import { Game } from './game/game';
import { ITEMS } from './content/items';
import { MAT } from './content/materials';
import { GEN_VERSION } from './core/seed';
import { setLocale, t } from './i18n';
import { initDom } from './i18n/dom';

async function boot() {
  initDom(); // language first: everything below may show text
  const params = new URLSearchParams(location.search);
  // ?gallery: deterministic art captures instead of the game (docs/art/DECISIONS.md §12.5)
  if (params.has('gallery')) {
    const { runGallery } = await import('./debug/gallery');
    runGallery(params);
    document.getElementById('loading')?.remove();
    return;
  }
  // ?seed=ABCD-EFGH replays a run; without it every run is new
  const game = new Game(document.getElementById('game') as HTMLCanvasElement, params.get('seed') ?? undefined);
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
    /** Switch language without saving the choice ('en', 'es'). */
    lang: (code: string) => setLocale(code),
  };
  (window as any).S = S;

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
