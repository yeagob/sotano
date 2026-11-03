import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const { chromium } = require('playwright');
const [out, lang = 'en', limit = '99999'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const scenario = {
  rows: Array(7).fill('.............'),
  player: [1, 0, 3],
  view: [1, 0],
  god: true,
};
const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`${url}?sandbox=${encodeURIComponent(JSON.stringify(scenario))}&lang=${lang}`);
await page.waitForFunction(() => window.S && window.S.sb, null, { timeout: 120000 });
await page.waitForTimeout(2500);
const ev = (f, a) => page.evaluate(f, a);
await ev(() => {
  const g = S.game;
  g.simulateUnlocked = true; g.hud.showDebug = false; S.sb.pause(true); S.sb.step(30);
  document.getElementById('toast').style.fontSize = '22px';
  const r = g.rooms.get(g.room); g.player.yaw = -Math.PI / 2; g.player.body.x = r.x0 + 1.5; g.player.body.z = r.z0 + 3.5;
  const b = g.player.body, f = g.player.forward; g.player.pitch = -0.3;
  g.pickups.add('heart', b.x + f.x * 2.2, b.y + 0.4, b.z + f.z * 2.2, g.room, null, 0, null, 'berserker');
});
await ev(() => S.sb.step(60));
let frame = 0;
const keys = new Set();
const hold = async (k, on) => { if (on && !keys.has(k)) { keys.add(k); await page.keyboard.down(k); } if (!on && keys.has(k)) { keys.delete(k); await page.keyboard.up(k); } };
const shot = async () => { await page.waitForTimeout(16); await page.screenshot({ path: `${out}/f${String(frame).padStart(5, '0')}.png` }); frame++; };
const tick = async (n = 2) => { await ev(n => { S.sb.step(n); S.game.player.hand = []; }, n); await shot(); };
const T = s => Math.round(s * 30);
for (let i = 0; i < T(3); i++) { await ev(() => { S.game.player.pitch += 0.0012; }); await tick(); if (frame >= +limit) break; }
for (let i = 0; i < T(3) && frame < +limit; i++) { await hold('KeyW', i < T(0.45)); await ev(() => { const p = S.game.player; p.pitch += (-0.05 - p.pitch) * 0.08; }); await tick(); }
await ev(() => { const p = S.game.player; p.yaw = -Math.PI / 2; p.pitch = -0.2; });
await ev(() => { const r = S.game.rooms.get(S.game.room); const p = S.game.player; p.body.x = r.x0 + 0.8; p.body.z = r.z0 + 3.5; });
for (const pass of [0, 1]) {
  await ev(() => {
    const r = S.game.rooms.get(S.game.room), p = S.game.player;
    for (const [x, z] of [[4, 3], [7, 3], [10, 3]]) S.sb.block(x, 0, z, 'stone');
    p.body.x = r.x0 + 1.2; p.body.z = r.z0 + 3.5; p.body.vx = p.body.vz = 0; p.yaw = -Math.PI / 2; p.pitch = -0.22;
  });
  for (let i = 0; i < T(3) && frame < +limit; i++) {
    await hold('KeyW', i < T(1.25));
    await hold('Space', pass === 1 && i > 10 && i < 16);
    await tick();
  }
}
await hold('KeyW', false); await hold('Space', false);
await ev(() => {
  const r = S.game.rooms.get(S.game.room), p = S.game.player;
  p.body.x = r.x0 + 2.5; p.body.z = r.z0 + 3.5; p.yaw = -Math.PI / 2; p.pitch = 0.02;
  S.sb.spawn('critic', 11, 0, 3);
});
for (let i = 0; i < T(6) && frame < +limit; i++) {
  await ev(on => { if (on) S.game.input.mouse.add(0); else S.game.input.mouse.delete(0); }, i % 20 < 10);
  await tick();
}
await ev(() => { S.game.input.mouse.delete(0); for (const e of S.game.enemies.list) { try { e.hp = 0; } catch {} } });
await ev(() => { const p = S.game.player; p.invulnT = 0; S.game.damageActor(p, 8, 'item', 'console', 'world'); p.invulnT = 1e9; });
for (let i = 0; i < T(5) && frame < +limit; i++) await tick();
console.log(JSON.stringify({ frames: frame, errors }));
await browser.close();
await server.close();
