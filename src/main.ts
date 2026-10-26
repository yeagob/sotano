import { initPhysics } from './physics/debris';
import { Game } from './game/game';
import { ITEMS } from './content/items';
import { MAT } from './content/materials';

async function boot() {
  await initPhysics();
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed')) || 1;
  const game = new Game(document.getElementById('game') as HTMLCanvasElement, seed);

  // debug shortcuts in the browser console
  const S = {
    game,
    give: (id: string) => game.give(id),
    items: ITEMS.map(i => i.id),
    stats: () => game.stats.all,
    restart: (s?: number) => game.newRun(s ?? game.seed),
    hold: (key: string) => { game.player.held = MAT[key] ?? 0; },
    tp: (x: number, y: number, z: number) => game.player.spawnAt(x, y, z),
    debug: (on = true) => { game.hud.showDebug = on; },
    trace: (on = true) => { game.bus.trace = on; },
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
  if (el) el.textContent = 'Failed to start: ' + (err?.message ?? err);
});
