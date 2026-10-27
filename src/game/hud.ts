// DOM HUD. Isaac-style corner: hearts, bombs and keys (capped at 99); item icons; minimap and
// floor; hand slots; the pickup banner (icon, quality, what it changed, new synergies) with a
// screen flash; damage vignette and screen shake; the inventory window (Tab); the death screen;
// toasts; the language selector on the pause card; and the debug readout (English on purpose:
// it is for developers). Every player-facing word goes through i18n (docs/architecture/
// LOCALIZATION.md); `relocalize()` redraws whatever is on screen when the language changes.

import { heartQuarters } from '../entities/actors';
import { SYNERGIES } from '../content/synergies';
import { fmtStat, statLabel, type StatName } from '../core/stats';
import { fmtNum, locale, locales, onLocaleChange, t, type MessageKey, type Params } from '../i18n';
import { causeName, effectMessage, isPath, itemText, materialName, pathName, synergyText } from '../i18n/content';
import { chooseLocale } from '../i18n/dom';
import type { ItemDef, Req, SynergyDef } from '../items/types';
import { HUD_ICONS } from '../content/hud-icons';
import { palCss, PATH_GLYPH, type PalToken, type PathName } from '../content/palette';
import { materialTexture } from '../render/atlas';
import { applyPaletteCss, iconDataUrl, qualityStars } from '../render/icons';
import { ROOM_ID_STRIDE, type FloorResult } from '../world/floor';
import type { Game } from './game';

const $ = (id: string) => document.getElementById(id)!;
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** A message, escaped for innerHTML. */
const th = (key: MessageKey, params?: Params) => esc(t(key, params));

const STAT_ORDER: StatName[] = [
  'damage', 'fireRate', 'shotSpeed', 'range', 'gravity', 'size', 'mining',
  'moveSpeed', 'jump', 'maxHearts', 'invuln', 'carry', 'kick', 'throw', 'crush', 'headbutt', 'reach',
  'bombRadius', 'bombDamage', 'luck',
];

/** Path chips: the path's base colour, always next to its glyph and word (§10.2). */
const pathColor = (p: string) => palCss(`path.${p}.base` as PalToken);
/** Minimap tones (docs/art/DECISIONS.md §10.2). */
const MAP = {
  unvisited: palCss('bone.faded'), visited: palCss('ink.ash'), cleared: palCss('light.gold'), current: palCss('bone.paper'),
  treasure: palCss('light.gold'), vault: palCss('brass.base'), boss: palCss('cold.white'), start: palCss('bone.dim'),
};
/** A full-screen effect may not retrigger within this many ms (the flash budget, §10.4). */
const FLASH_BUDGET_MS = 333;

/** The lessons of the roots, in the order their rooms are reached (docs/design/LEVELS.md §1). */
export const LESSONS = ['move', 'intent', 'carry', 'kick', 'bomb', 'water', 'practice', 'down'] as const;

export class Hud {
  private hand = $('hand');
  private itemsBar = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  private toastEl = $('toast');
  private heartsEl = $('hearts');
  private breathEl = $('breath');
  private breathKey = '';
  private bombsEl = $('bombs');
  private keysEl = $('keys');
  private depthEl = $('depth');
  private invEl = $('inventory');
  private flashEl = $('flash');
  private hurtEl = $('hurt');
  private deathEl = $('death');
  private fadeEl = $('fade');
  private map = $('minimap') as HTMLCanvasElement;
  private handKey = '';
  private heartsKey = '';
  private slotUrls = new Map<number, string>();
  private debugTimer = 0;
  private toastTimer = 0;
  private shakeT = 0;
  private selected: string | null = null;
  // last inputs of each surface, to redraw them in another language (relocalize)
  private lastItems: readonly ItemDef[] = [];
  private lastDepth = -1;
  private lastBanner: Parameters<Hud['itemBanner']> | null = null;
  private lastLesson: number | null = null;
  private lastDeath: Parameters<Hud['showDeath']> | null = null;
  private game: Game | null = null;
  inventoryOpen = false;
  bannerOpen = false;
  /** The debug readout is off by default; F3 toggles it (it's for developers). */
  showDebug = false;
  private lastFlash = 0;
  private lastCleared = new Set<number>();

  constructor() {
    applyPaletteCss(HUD_ICONS);
    addEventListener('keydown', e => { if (e.code === 'F3') { e.preventDefault(); this.showDebug = !this.showDebug; } });
    this.fadeEl.style.setProperty('--fade-bg', palCss('ink.void'));
    this.fadeEl.style.setProperty('--fade-ink', palCss('bone.paper'));
    this.renderLanguages();
    onLocaleChange(() => this.relocalize());
    // capture phase, like the seed: choosing a language must not also capture the mouse
    addEventListener('mousedown', e => {
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-lang]');
      if (!b) return;
      e.stopPropagation();
      chooseLocale(b.dataset.lang!);
    }, true);
  }

  /** The language changed: redraw everything on screen from its last inputs. */
  relocalize() {
    this.handKey = '';
    this.setItems(this.lastItems);
    if (this.lastDepth >= 0) this.depthEl.textContent = t('hud.floor', { n: this.lastDepth });
    this.renderSeed();
    this.renderLanguages();
    if (this.bannerOpen && this.lastLesson !== null) this.renderLesson(this.lastLesson);
    else if (this.bannerOpen && this.lastBanner) this.renderBanner(...this.lastBanner);
    if (this.deathEl.classList.contains('show') && this.lastDeath) this.renderDeath(...this.lastDeath);
    if (this.inventoryOpen && this.game) this.renderInventory(this.game);
    this.toastEl.classList.remove('show');
  }

  /** The selector on the pause card: every shipped language by its own name. */
  private renderLanguages() {
    const el = document.getElementById('lang');
    if (!el) return;
    el.innerHTML = `<span>${th('intro.language')}</span>` + locales().map(l =>
      `<button type="button" data-lang="${l.code}"${l.code === locale() ? ' class="on" aria-pressed="true"' : ''}>${esc(l.name)}</button>`).join('');
  }

  update(g: Game, running: boolean, dt: number) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.overlay.style.display = running || this.inventoryOpen || g.player.dead ? 'none' : 'flex';

    // hearts: each container drawn in quarters (2 points each), filled from the left
    const max = Math.floor(g.stats.get('maxHearts')), hp = g.player.hp;
    const hk = `${max}:${hp}:${g.player.invulnT > 0 ? 1 : 0}`;
    if (hk !== this.heartsKey) {
      this.heartsKey = hk;
      let html = '';
      for (let i = 0; i < max; i++) {
        const q = heartQuarters(hp, i);
        // the red fill spans pixels 1–10 of the 11-pixel heart: clip it to q quarters
        const shown = q === 4 ? 0 : (1 - (1 + 9 * q / 4) / 11) * 100;
        html += q === 0 ? '<span class="heart"></span>'
          : `<span class="heart"><span class="heart full" style="clip-path: inset(0 ${shown.toFixed(1)}% 0 0)"></span></span>`;
      }
      this.heartsEl.innerHTML = html;
      // invulnerable: steady and outlined, never blinking; one heart or less: the last one beats
      this.heartsEl.classList.toggle('safe', g.player.invulnT > 0);
      this.heartsEl.classList.toggle('low', hp > 0 && hp <= 8);
    }
    // breath: only while it isn't full (under water, or catching it back)
    const bmax = g.stats.get('breath'), bubbles = 8;
    const full = Math.ceil(g.player.breath / bmax * bubbles - 1e-6);
    const bk = g.player.breath >= bmax - 1e-3 ? '' : String(full);
    if (bk !== this.breathKey) {
      this.breathKey = bk;
      this.breathEl.classList.toggle('on', bk !== '');
      this.breathEl.classList.toggle('low', full <= 2);
      let html = '';
      for (let i = 0; i < bubbles; i++) html += `<span class="bubble${i < full ? (i === full - 1 ? ' last' : '') : ' empty'}"></span>`;
      this.breathEl.innerHTML = bk ? html : '';
    }
    this.bombsEl.textContent = String(g.player.bombs).padStart(2, '0');
    this.keysEl.textContent = String(g.player.keys).padStart(2, '0');

    // hand slots: one per carry point, top block highlighted
    const carry = Math.floor(g.stats.get('carry'));
    const key = carry + ':' + g.player.hand.join(',');
    if (key !== this.handKey) {
      this.handKey = key;
      this.hand.innerHTML = '';
      for (let i = 0; i < carry; i++) {
        const m = g.player.hand[i];
        const slot = document.createElement('div');
        slot.className = 'slot' + (m ? ' full' : '') + (i === g.player.hand.length - 1 ? ' top' : '');
        if (m) {
          const img = document.createElement('img');
          img.src = this.slotUrl(m);
          img.title = materialName(m);
          slot.appendChild(img);
        }
        this.hand.appendChild(slot);
      }
    }

    if (--this.debugTimer <= 0 && this.showDebug) {
      this.debugTimer = 15;
      const d = g.debug;
      this.debugEl.textContent =
        `${d.fps} fps · ${Math.round(d.tris / 1000)}k tris · cubes ${d.debris} · enemies ${d.enemies} · intents ${d.intents}\n` +
        `pos ${d.pos} · room ${d.room}\nhand: ${d.held}`;
    }
    this.debugEl.style.display = this.showDebug ? 'block' : 'none';
    const now = performance.now();
    if (now > this.toastTimer) this.toastEl.classList.remove('show');
  }

  private slotUrl(m: number) {
    let url = this.slotUrls.get(m);
    if (!url) { url = (materialTexture(m).image as HTMLCanvasElement).toDataURL(); this.slotUrls.set(m, url); }
    return url;
  }

  /** Small icons of the items you hold, under the counters. */
  setItems(items: readonly ItemDef[]) {
    this.lastItems = items;
    this.itemsBar.innerHTML = items.map(it => `<img src="${iconDataUrl(it, 2)}" title="${esc(itemText(it).name)}" alt="">`).join('');
  }

  setFloor(floor: FloorResult, depth: number) {
    this.lastDepth = depth;
    this.depthEl.textContent = t('hud.floor', { n: depth });
    this.drawMap(floor, -1, new Set());
  }

  setRoom(floor: FloorResult, room: number, visited: Set<number>, cleared: Set<number> = this.lastCleared) {
    this.lastCleared = cleared;
    this.drawMap(floor, room, visited);
  }

  /** Isaac-style minimap: visited rooms, their neighbours as outlines, special rooms marked. */
  private drawMap(floor: FloorResult, current: number, visited: Set<number>) {
    const c = this.map, g = c.getContext('2d')!;
    const cw = 14, ch = 9, gap = 2;
    const { w, h } = floor.plan;
    c.width = w * (cw + gap) + gap; c.height = h * (ch + gap) + gap;
    g.clearRect(0, 0, c.width, c.height);
    const known = new Set<number>();
    for (const r of floor.rooms) {
      if (!visited.has(r.id)) continue;
      known.add(r.id);
      for (const i of Object.values(floor.plan.rooms[r.id % ROOM_ID_STRIDE].links)) known.add(floor.rooms[i as number].id);
    }
    for (const r of floor.rooms) {
      if (!known.has(r.id)) continue;
      const x = gap + r.gx * (cw + gap), y = gap + r.gz * (ch + gap);
      if (visited.has(r.id)) {
        g.globalAlpha = this.lastCleared.has(r.id) && r.id !== current ? 0.5 : 1;
        g.fillStyle = r.id === current ? MAP.current : this.lastCleared.has(r.id) ? MAP.cleared : MAP.visited;
        g.fillRect(x, y, cw, ch);
        g.globalAlpha = 1;
      } else { g.globalAlpha = 0.25; g.strokeStyle = MAP.unvisited; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1); g.globalAlpha = 1; }
      if (r.type !== 'normal') this.mapMark(g, r.type, x + cw / 2, y + ch / 2);
    }
  }

  /** Room marks are glyphs, never colour alone: a house, a hollow ◇, a ▭, a ▣. */
  private mapMark(g: CanvasRenderingContext2D, type: string, cx: number, cy: number) {
    const x = Math.round(cx), y = Math.round(cy);
    const dot = (dx: number, dy: number) => g.fillRect(x + dx, y + dy, 1, 1);
    g.fillStyle = (MAP as Record<string, string>)[type] ?? MAP.start;
    if (type === 'start') { dot(0, -2); dot(-1, -1); dot(0, -1); dot(1, -1); g.fillRect(x - 1, y, 3, 2); }
    else if (type === 'treasure') { dot(0, -2); dot(-1, -1); dot(1, -1); dot(-2, 0); dot(2, 0); dot(-1, 1); dot(1, 1); dot(0, 2); }
    else if (type === 'vault') { g.fillRect(x - 2, y - 1, 5, 1); g.fillRect(x - 2, y + 1, 5, 1); dot(-2, 0); dot(2, 0); }
    else if (type === 'boss') { g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = palCss('ink.void'); g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = MAP.boss; dot(0, 0); }
  }

  // ───────────────────────── feedback ─────────────────────────

  /** Isaac-style banner: icon, name, quality, inspiration, and exactly what changed. */
  itemBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    this.lastBanner = [def, changes, synergies];
    this.lastLesson = null;
    this.renderBanner(def, changes, synergies);
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth; // restart the entrance animation
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  private renderBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    const lines = changes.map(c => {
      const up = c.to > c.from;
      return `<i class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${esc(statLabel(c.stat))} ${esc(fmtStat(c.stat, c.from))} → ${esc(fmtStat(c.stat, c.to))}</i>`;
    });
    const syn = synergies.map(s => { const st = synergyText(s); return `<i class="syn">✦ ${esc(st.name)} — ${esc(st.description)}</i>`; });
    const tx = itemText(def);
    this.bannerEl.style.setProperty('--c', hex(def.color));
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><img src="${iconDataUrl(def, 5)}" alt=""><div>` +
      `<b>${esc(tx.name)}</b><em class="q q${def.quality}">${qualityStars(def.quality)}</em>` +
      `<span>${esc(tx.description)}</span>` +
      `<p class="effect">${esc(tx.effect)}</p>` +
      (tx.inspiredBy ? `<small>${th('banner.inspired', { credit: tx.inspiredBy })}</small>` : '') +
      `${lines.concat(syn).join('')}<p class="dismiss">${th('banner.continue')}</p></div></div>`;
  }

  /** A lesson of the tutorial floor (the roots): how to play, one per room, until clicked. */
  lessonBanner(n: number) {
    this.lastLesson = n;
    this.renderLesson(n);
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  private renderLesson(n: number) {
    const k = LESSONS[Math.min(n, LESSONS.length - 1)];
    this.bannerEl.style.setProperty('--c', 'var(--ui-gold)');
    this.bannerEl.innerHTML = `<div class="ribbon slate"><div><b>${th(`lesson.${k}.title`)}</b>` +
      `<span>${th(`lesson.${k}.text`)}</span><p class="dismiss">${th('banner.continue')}</p></div></div>`;
  }

  /** Information banners stay until the player clicks (owner rule). */
  dismissBanner() {
    this.bannerOpen = false;
    this.bannerEl.classList.remove('show');
  }

  flash(color: number) {
    // the flash budget: a full-screen effect never retriggers within 333 ms
    const now = performance.now();
    if (now - this.lastFlash < FLASH_BUDGET_MS) return;
    this.lastFlash = now;
    this.flashEl.style.setProperty('--c', hex(color));
    this.flashEl.classList.remove('on');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('on');
  }

  hurt() {
    this.hurtEl.classList.remove('on');
    void this.hurtEl.offsetWidth;
    this.hurtEl.classList.add('on');
    this.shake(0.2);
  }

  /** R: the screen eases to black over `seconds` (one transition, within the flash budget). */
  fadeOut(seconds: number) {
    this.fadeEl.style.setProperty('--fade-t', `${seconds}s`);
    this.fadeEl.classList.add('on');
  }

  /** …and back, a little slower, once the new run is ready. */
  fadeIn() {
    this.fadeEl.style.setProperty('--fade-t', '0.6s');
    this.fadeEl.classList.remove('on');
  }

  shake(seconds: number) { this.shakeT = Math.max(this.shakeT, seconds); }
  shakeAmount() { return this.shakeT > 0 ? Math.min(0.25, this.shakeT * 0.6) : 0; }

  /** A short notice that fades: a message key, in the player's language. */
  toast(key: MessageKey, params?: Params) { this.showToast(t(key, params)); }

  /** A notice raised by an item or synergy (`api.toast(id)`): one of its own `messages`. */
  effectToast(owner: ItemDef | SynergyDef, id: string, params?: Params) {
    const text = effectMessage(owner, id, params);
    if (text === null) { console.warn(`[i18n] ${owner.id} has no message "${id}"`); return; }
    this.showToast(text);
  }

  private showToast(text: string) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = performance.now() + 2500;
  }

  private seedText = '';
  private seedListener = false;

  /** Shown on the pause card, the inventory and the death screen; clicking it copies a share link. */
  setSeed(label: string) {
    this.seedText = label;
    this.renderSeed();
    if (this.seedListener) return;
    this.seedListener = true;
    // capture phase: copying must not also capture the mouse or fire
    addEventListener('mousedown', e => {
      const t = (e.target as HTMLElement | null)?.closest?.('.seed');
      if (!t) return;
      e.stopPropagation();
      // the link carries only the seed and generator version, never the language (?lang)
      const [code, v] = this.seedText.split(' · v');
      const url = `${location.origin}${location.pathname}?seed=${code.replace(' ', '-')}&v=${v}`;
      navigator.clipboard?.writeText(url).then(() => this.toast('seed.copied'), () => this.toast('seed.label', { seed: this.seedText }));
    }, true);
  }

  private renderSeed() {
    const el = document.getElementById('seed');
    if (el && this.seedText) el.textContent = t('seed.copy', { seed: this.seedText });
  }

  showDeath(depth: number, items: readonly ItemDef[], source: string) {
    this.dismissBanner();
    document.exitPointerLock?.();
    this.lastDeath = [depth, items, source];
    this.renderDeath(depth, items, source);
    this.deathEl.classList.add('show');
  }

  private renderDeath(depth: number, items: readonly ItemDef[], source: string) {
    this.deathEl.innerHTML =
      `<div class="card slate"><h1>${th('death.title')}</h1><p>${th('death.cause', { cause: causeName(source), n: depth })}</p>` +
      `<div class="icons">${items.map(i => `<img src="${iconDataUrl(i, 3)}" title="${esc(itemText(i).name)}" alt="">`).join('')}</div>` +
      `<p class="seed">${th('seed.label', { seed: this.seedText })}</p><p class="go">${th('death.restart')}</p></div>`;
  }

  hideDeath() { this.deathEl.classList.remove('show'); }

  // ───────────────────────── inventory window ─────────────────────────

  toggleInventory(g: Game) {
    this.inventoryOpen = !this.inventoryOpen;
    this.invEl.classList.toggle('show', this.inventoryOpen);
    if (this.inventoryOpen) {
      this.game = g;
      document.exitPointerLock?.();
      this.selected = g.inventory.items.at(-1)?.def.id ?? null;
      this.renderInventory(g);
    } else g.input.lock();
  }

  private renderInventory(g: Game) {
    const s = g.stats.all;
    const held = g.inventory.items.map(i => i.def);
    const counts = new Map<string, number>();
    for (const d of held) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    const unique = [...new Map(held.map(d => [d.id, d])).values()];
    const sel = unique.find(d => d.id === this.selected) ?? unique.at(-1);

    const grid = unique.map(d => `<button class="tile${d === sel ? ' sel' : ''}" data-id="${d.id}" style="--c:${hex(d.color)}">` +
      `<img src="${iconDataUrl(d, 3)}" alt="">${(counts.get(d.id) ?? 1) > 1 ? `<i>×${counts.get(d.id)}</i>` : ''}</button>`).join('');

    const detail = sel ? this.itemDetail(sel) : `<p class="none">${th('inv.empty')}</p>`;

    const active = new Set(g.inventory.synergiesActive.map(x => x.id));
    const synRows = SYNERGIES.map(sy => {
      const met = sy.requires.filter(r => g.inventory.meets(r)).length;
      if (!active.has(sy.id) && met === 0) return '';
      const reqs = sy.requires.map(r => this.reqLabel(r, g)).join(' + ');
      const st = synergyText(sy);
      return active.has(sy.id)
        ? `<li class="on"><b>✦ ${esc(st.name)}</b><span>${esc(st.description)}</span><small>${reqs}</small></li>`
        : `<li class="off"><b>✧ ???</b><small>${reqs} (${met}/${sy.requires.length})</small></li>`;
    }).join('');

    const stats = STAT_ORDER.map(n => `<tr><td>${esc(statLabel(n))}</td><td>${esc(fmtStat(n, s[n]))}</td></tr>`).join('');

    this.invEl.innerHTML =
      `<div class="card slate"><header><h2>${th('inv.title')}</h2><small>${th('inv.held', { n: held.length })} · <span class="seed">${th('inv.seed', { seed: this.seedText })}</span> · ${th('inv.close')}</small></header>` +
      `<div class="cols"><section class="left"><div class="grid">${grid || '<p class="none">—</p>'}</div>${detail}` +
      `<h3>${th('inv.synergies')}</h3><ul class="syns">${synRows || `<li class="none">${th('inv.noSynergies')}</li>`}</ul></section>` +
      `<section class="right"><h3>${th('inv.state')}</h3><table>${stats}</table></section></div></div>`;

    for (const b of this.invEl.querySelectorAll<HTMLButtonElement>('.tile')) {
      b.addEventListener('mouseenter', () => { this.selected = b.dataset.id!; this.renderInventory(g); });
      b.addEventListener('click', () => { this.selected = b.dataset.id!; this.renderInventory(g); });
    }
  }

  private itemDetail(d: ItemDef) {
    const fx = (d.stats ?? []).map(m => {
      const n = fmtNum(m.value);
      const v = m.layer === 'mul' ? t('unit.times', { n }) : m.layer === 'final' ? `= ${n}` : `${m.value > 0 ? '+' : ''}${n}`;
      return `<i>${esc(statLabel(m.stat))} ${esc(v)}</i>`;
    }).join('');
    const paths = (d.tags ?? []).filter(isPath).map(p => `<em class="path" style="--p:${pathColor(p)}">${PATH_GLYPH[p as PathName]} ${esc(pathName(p))}</em>`).join('');
    const tx = itemText(d);
    return `<div class="detail" style="--c:${hex(d.color)}"><img src="${iconDataUrl(d, 6)}" alt="">` +
      `<div><b>${esc(tx.name)}</b> <span class="q q${d.quality}">${qualityStars(d.quality)}</span> ${paths}` +
      `<p>${esc(tx.description)}</p><p class="effect">${esc(tx.effect)}</p>${tx.inspiredBy ? `<small>${th('banner.inspired', { credit: tx.inspiredBy })}</small>` : ''}` +
      `<div class="fx">${fx}</div></div></div>`;
  }

  private reqLabel(r: Req, g: Game) {
    if (typeof r !== 'string') {
      const have = g.inventory.countTag(r.tag), need = r.count ?? 1;
      const label = isPath(r.tag) ? `${PATH_GLYPH[r.tag as PathName]} ${pathName(r.tag)}` : r.tag;
      return `<em class="path" style="--p:${isPath(r.tag) ? pathColor(r.tag) : palCss('bone.dim')}">${esc(label)} ${Math.min(have, need)}/${need}</em>`;
    }
    const held = g.inventory.has(r);
    const def = g.inventory.items.find(i => i.def.id === r)?.def;
    return held && def ? esc(itemText(def).name) : '???';
  }
}
