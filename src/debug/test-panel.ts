// The ?test panel (docs/testing/TEST-BENCH.md): buttons over TestBench, and the guide. Loaded by main.ts only with
// ?test. Clicks on the panel never reach the game's capture (the mouse is free while the game is paused with Esc),
// and every word goes through t(), redrawn when the language changes.

import { BOSS_BY_ID } from '../content/bosses';
import { ITEMS } from '../content/items';
import { LEVELS } from '../content/levels';
import { onLocaleChange, t } from '../i18n';
import { enemyText, itemText } from '../i18n/content';
import type { MessageKey } from '../i18n/locales/en';
import { SPIRIT_MAX } from '../sky/types';
import { TestBench, bossesOf, dungeonGuide, skyGuide, type BenchGame, type BenchHelpers, type GuideEntry, type GuideRow } from './test-bench';

/** How often god mode is kept applied and the status line redrawn. */
const TICK_MS = 250;

const CSS = `
#testbench-tab { position: fixed; top: 16px; right: 16px; z-index: 70; font: 600 14px system-ui, sans-serif; padding: 6px 12px;
  background: var(--pal-ink-void, #111); color: var(--ui-text, #eee); border: 1px solid var(--ui-text-2, #999); border-radius: 4px; cursor: pointer; }
#testbench { position: fixed; top: 16px; right: 16px; z-index: 71; box-sizing: border-box; width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 32px); overflow-y: auto; overflow-x: hidden; padding: 12px; border-radius: 6px;
  background: var(--pal-ink-void, #111); color: var(--ui-text, #eee); border: 1px solid var(--ui-text-2, #999);
  font: 14px/1.4 system-ui, sans-serif; overflow-wrap: anywhere; }
#testbench[hidden], #testbench-tab[hidden] { display: none; }
#testbench header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
#testbench h2 { margin: 0; font-size: 16px; }
#testbench h3 { margin: 12px 0 6px; font-size: 14px; color: var(--ui-text-2, #bbb); text-transform: uppercase; letter-spacing: 1px; }
#testbench p { margin: 4px 0; color: var(--ui-text-2, #bbb); font-size: 13px; }
#testbench button { font: inherit; font-size: 13px; padding: 5px 8px; margin: 0; cursor: pointer; border-radius: 4px; min-width: 0;
  background: var(--ui-line, #333); color: var(--ui-text, #eee); border: 1px solid var(--ui-text-2, #777); }
#testbench button.on { background: var(--ui-text, #eee); color: var(--pal-ink-void, #111); font-weight: 700; }
#testbench .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; }
#testbench .items { max-height: 180px; overflow-y: auto; }
#testbench .status { font-weight: 600; color: var(--ui-text, #eee); }
#testbench details { margin: 4px 0; }
#testbench summary { cursor: pointer; font-weight: 600; }
#testbench dl { margin: 4px 0 8px; }
#testbench dt { font-size: 12px; color: var(--ui-text-2, #bbb); margin-top: 4px; }
#testbench dd { margin: 0 0 2px 8px; font-size: 13px; }
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function rowText(r: GuideRow): string {
  const x = r.text;
  if (typeof x === 'string') return t(x);
  if ('key' in x) return t(x.key, x.params);
  const b = bossesOf(x.boss);
  if (!b.ids.length) return t('test.guide.noBoss');
  const names = b.ids.map(id => enemyText(BOSS_BY_ID.get(id)!).name);
  return b.fixed ? t('test.guide.bossFixed', { name: names[0], hp: b.hp }) : t('test.guide.bossPool', { names: names.join(', '), hp: b.hp });
}

function guideSection(title: string, entries: GuideEntry[]): HTMLElement {
  const box = el('details');
  box.append(el('summary', undefined, title));
  for (const e of entries) {
    const d = el('details');
    d.append(el('summary', undefined, e.n === undefined ? t(e.title) : t('test.floors.go', { n: e.n, name: t(e.title) })));
    const dl = el('dl');
    for (const r of e.rows) {
      if (r.label) dl.append(el('dt', undefined, t(r.label)));
      dl.append(el('dd', undefined, rowText(r)));
    }
    d.append(dl);
    box.append(d);
  }
  return box;
}

export function mountTestPanel(game: BenchGame, helpers: BenchHelpers): TestBench {
  const bench = new TestBench(game, helpers);
  const style = el('style');
  style.textContent = CSS;
  document.head.append(style);
  const tab = el('button');
  tab.id = 'testbench-tab';
  const panel = el('aside');
  panel.id = 'testbench';
  panel.hidden = true;
  // the game captures the mouse on any mousedown and acts on clicks: nothing on the bench reaches it
  for (const root of [tab, panel]) for (const type of ['mousedown', 'click', 'touchstart', 'pointerdown'] as const) {
    root.addEventListener(type, e => e.stopPropagation());
  }
  tab.addEventListener('click', () => { panel.hidden = false; tab.hidden = true; });
  document.body.append(tab, panel);

  let status: HTMLElement | null = null;
  let godBtn: HTMLButtonElement | null = null;
  const button = (text: string, act: () => void) => {
    const b = el('button', undefined, text);
    b.type = 'button';
    b.addEventListener('click', act);
    return b;
  };

  const refresh = () => {
    if (godBtn) { godBtn.textContent = t(bench.god ? 'test.god.on' : 'test.god.off'); godBtn.classList.toggle('on', bench.god); }
    if (!status) return;
    status.textContent = game.inSky
      ? t('test.where.sky', { n: Math.round(game.spiritNow), max: SPIRIT_MAX })
      : t('test.where.floor', { n: game.depth, name: t(`level.${LEVELS[Math.max(0, Math.min(LEVELS.length - 1, game.depth))].key}` as MessageKey) });
  };

  const render = () => {
    tab.textContent = t('test.tab');
    panel.replaceChildren();
    const head = el('header');
    head.append(el('h2', undefined, t('test.title')), button(t('test.hide'), () => { panel.hidden = true; tab.hidden = false; }));
    status = el('p', 'status');
    panel.append(head, status);

    panel.append(el('h3', undefined, t('test.god')));
    godBtn = button('', () => { bench.setGod(!bench.god); refresh(); });
    panel.append(godBtn, el('p', undefined, t('test.god.hint')));

    panel.append(el('h3', undefined, t('test.floors')), el('p', undefined, t('test.floors.hint')));
    const floors = el('div', 'grid');
    for (const l of LEVELS) {
      floors.append(button(t('test.floors.go', { n: l.floor, name: t(`level.${l.key}` as MessageKey) }), () => {
        if (!bench.floor(l.floor) && status) status.textContent = t('test.where.busy');
      }));
    }
    floors.append(button(t('test.floors.sky'), () => bench.sky()));
    panel.append(floors);

    panel.append(el('h3', undefined, t('test.sky')));
    panel.append(button(t('test.sky.refill'), () => { bench.refillSpirit(); refresh(); }), el('p', undefined, t('test.sky.noTeleport')));

    panel.append(el('h3', undefined, t('test.items')), el('p', undefined, t('test.items.hint')));
    panel.append(button(t('test.items.all'), () => bench.giveAll()));
    const items = el('div', 'grid items');
    for (const def of ITEMS) items.append(button(itemText(def).name, () => bench.give(def.id)));
    panel.append(items);

    panel.append(el('h3', undefined, t('test.guide')));
    panel.append(guideSection(t('test.guide.below'), dungeonGuide()), guideSection(t('test.guide.above'), skyGuide()));
    refresh();
  };

  render();
  onLocaleChange(render);
  setInterval(() => { bench.tick(); if (!panel.hidden) refresh(); }, TICK_MS);
  return bench;
}
