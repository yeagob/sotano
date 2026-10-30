// DOM HUD. Isaac-style corner: hearts, bombs and keys (capped at 99); item icons; minimap and
// floor; hand slots; the pickup banner (icon, quality, what it changed, new synergies) with a
// screen flash; damage vignette and screen shake; the screen (menu and practices, one window with
// two tabs: Esc and Tab open it, the touch tab button too); the death screen;
// toasts; the language selector on the pause card; and the debug readout (English on purpose:
// it is for developers). Every player-facing word goes through i18n (docs/architecture/
// LOCALIZATION.md); `relocalize()` redraws whatever is on screen when the language changes.

import { heartQuarters, HEART } from '../entities/actors';
import { SYNERGIES } from '../content/synergies';
import { fmtStat, statLabel, type StatName } from '../core/stats';
import { fmtNum, locale, locales, onLocaleChange, t, type MessageKey, type Params } from '../i18n';
import { causeName, effectMessage, isPath, itemText, materialName, partText, pathName, synergyText } from '../i18n/content';
import { chooseLocale } from '../i18n/dom';
import type { ItemDef, Req, SynergyDef } from '../items/types';
import type { Polarity } from '../combat/polarity';
import { HUD_ICONS } from '../content/hud-icons';
import { palCss, PATH_GLYPH, type PalToken, type PathName } from '../content/palette';
import { materialTexture } from '../render/atlas';
import { applyPaletteCss, hudIconUrl, iconDataUrl, qualityStars } from '../render/icons';
import { ROOM_ID_STRIDE, type FloorResult } from '../world/floor';
import { level, tollOf } from '../content/levels';
import { carriedDef, flaskRooms, isFlask, POTIONS } from '../content/potions';
import { handTollIds } from './toll';
import type { Game } from './game';
import { CONTROL_ROWS, type Device } from '../input/bindings';
import { activeDevice, onDeviceChange } from '../input/input';
import { controlKey, controlParams, forDevice } from '../input/labels';

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
  treasure: palCss('light.gold'), vault: palCss('brass.base'), boss: palCss('cold.white'), start: palCss('bone.dim'), challenge: palCss('cold.body'),
};
/** A full-screen effect may not retrigger within this many ms (the flash budget, §10.4). */
const FLASH_BUDGET_MS = 333;

/** "Floor 3 · The rain": the number and the circle's image (docs/design/LEVELS.md). */
export function floorLabel(depth: number): string {
  return `${t('hud.floor', { n: depth })} · ${t(`level.${level(depth).key}` as MessageKey)}`;
}

/** The two tabs of the screen: the menu (pause, controls, language) and the practices. */
export type ScreenTab = 'menu' | 'items';

export class Hud {
  private hand = $('hand');
  private itemsBar = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  private toastEl = $('toast');
  private bossEl = $('boss');
  private bossFill = $('bossfill');
  private bossName = $('bossname');
  private heartsEl = $('hearts');
  private breathEl = $('breath');
  private breathKey = '';
  private bombsEl = $('bombs');
  private keysEl = $('keys');
  private polarityEl = $('polarity');
  private lastPolarity: Polarity = 'positive';
  private depthEl = $('depth');
  private invEl = $('inventory');
  private tollEl = $('toll');
  tollOpen = false;
  private tollFloor = 0;
  private tollPicked = new Set<string>();
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
  private lastDeath: Parameters<Hud['showDeath']> | null = null;
  private game: Game | null = null;
  /** The screen (menu and practices) is open; it pauses the world on every device. */
  screenOpen = false;
  private screenTab: ScreenTab = 'menu';
  private shownTab: ScreenTab | null = null;
  bannerOpen = false;
  /** The debug readout is off by default; F3 toggles it (it's for developers). */
  showDebug = false;
  private lastFlash = 0;
  rumble: ((strength: number, ms: number) => void) | null = null;
  onAct: ((act: string) => void) | null = null;
  private lastCleared = new Set<number>();
  private mapState: { floor: FloorResult; room: number; visited: Set<number> } | null = null;
  private mapYaw = 0;
  private mapYawKey = NaN;

  constructor() {
    applyPaletteCss(HUD_ICONS);
    addEventListener('keydown', e => { if (e.code === 'F3') { e.preventDefault(); this.showDebug = !this.showDebug; } });
    this.fadeEl.style.setProperty('--fade-bg', palCss('ink.void'));
    this.fadeEl.style.setProperty('--fade-ink', palCss('bone.paper'));
    this.renderLanguages();
    onLocaleChange(() => this.relocalize());
    onDeviceChange(d => { this.applyDevice(d); this.relocalize(); });
    this.applyDevice(activeDevice());
    this.renderControls();
    addEventListener('click', e => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-act]');
      if (el) { e.stopPropagation(); this.onAct?.(el.dataset.act!); return; }
      if (activeDevice() !== 'touch' || this.screenOpen || !this.overlay.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest('[data-lang], .seed')) return;
      this.onAct?.('resume');
    });
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
    if (this.lastDepth >= 0) this.depthEl.textContent = floorLabel(this.lastDepth);
    this.renderSeed();
    this.renderPolarity();
    this.renderLanguages();
    this.renderControls();
    if (this.bannerOpen && this.lastBanner) this.renderBanner(...this.lastBanner);
    if (this.deathEl.classList.contains('show') && this.lastDeath) this.renderDeath(...this.lastDeath);
    if (this.screenOpen && this.game) this.renderScreen(this.game);
    if (this.tollOpen && this.game) this.renderToll(this.game);
    this.toastEl.classList.remove('show');
  }

  private applyDevice(d: Device) {
    for (const k of ['keyboard', 'gamepad', 'touch']) document.body.classList.toggle(`dev-${k}`, k === d);
  }

  private renderControls() {
    const d = activeDevice();
    const table = document.getElementById('controls');
    if (table) table.innerHTML = CONTROL_ROWS.map(r =>
      `<tr><td>${th(controlKey(r, d))}</td><td>${th(`controls.${r}` as MessageKey)}</td></tr>`).join('');
    const go = document.getElementById('play');
    if (go) go.textContent = t(forDevice('intro.play', d));
    const nr = document.getElementById('newrun');
    if (nr) nr.textContent = t('pause.newRun');
    for (const b of document.querySelectorAll<HTMLElement>('#overlay .tabs button')) {
      b.textContent = t(b.dataset.tab === 'items' ? 'inv.title' : 'tab.menu');
    }
    const rot = document.getElementById('rotate');
    if (rot) rot.textContent = t('touch.rotate');
  }

  /** The selector on the pause card: every shipped language by its own name. */
  private renderLanguages() {
    const el = document.getElementById('lang');
    if (!el) return;
    el.innerHTML = `<span>${th('intro.language')}</span>` + locales().map(l =>
      `<button type="button" data-lang="${l.code}"${l.code === locale() ? ' class="on" aria-pressed="true"' : ''}>${esc(l.name)}</button>`).join('');
  }

  /** The loaded intention's polarity: a static mark (filled = positive, ring = negative), set only when it changes. */
  bossBar(boss: { name: string; ratio: number } | null) {
    this.bossEl.hidden = !boss;
    if (!boss) return;
    this.bossName.textContent = boss.name;
    this.bossFill.style.width = `${Math.max(0, Math.min(1, boss.ratio)) * 100}%`;
  }

  setPolarity(p: Polarity) {
    this.lastPolarity = p;
    this.renderPolarity();
  }

  private renderPolarity() {
    const el = this.polarityEl;
    const positive = this.lastPolarity === 'positive';
    el.dataset.polarity = this.lastPolarity;
    // the full light, or the eclipsed one (an ember ring round a dark centre): never cold, it is yours
    el.style.setProperty('--pol', palCss(positive ? 'light.gold' : 'light.ember'));
    el.title = t(positive ? 'hud.polarity.positive' : 'hud.polarity.negative');
  }

  update(g: Game, running: boolean, dt: number) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    // the screen is the overlay's tab while it is open; otherwise the pause card shows the menu
    this.showTab(this.screenOpen ? this.screenTab : 'menu');
    this.overlay.style.display = running || this.tollOpen || g.player.dead ? 'none' : 'flex';

    this.mapYaw = g.player.yaw;
    const yawKey = Math.round(this.mapYaw * 64);
    if (this.mapState && yawKey !== this.mapYawKey) {
      this.mapYawKey = yawKey;
      this.drawMap(this.mapState.floor, this.mapState.room, this.mapState.visited);
    }

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
    const key = carry + ':' + g.player.hand.map(c => typeof c === 'number' ? c : carriedDef(c).id).join(',');
    if (key !== this.handKey) {
      this.handKey = key;
      this.hand.innerHTML = '';
      for (let i = 0; i < carry; i++) {
        const c = g.player.hand[i];
        const slot = document.createElement('div');
        slot.className = 'slot' + (c ? ' full' : '') + (i === g.player.hand.length - 1 ? ' top' : '');
        if (c) {
          const img = document.createElement('img');
          if (typeof c === 'number') {
            img.src = this.slotUrl(c);
            img.title = materialName(c);
          } else if (isFlask(c)) {
            const pd = POTIONS[c.potion];
            img.src = iconDataUrl(carriedDef(c), 3);
            img.title = `${t(pd.name)}\n${t(pd.effect, { rooms: flaskRooms(c) })}`;
          } else {
            const tx = partText(c);
            img.src = iconDataUrl(c, 3);
            img.title = `${tx.name}\n${tx.description}`;
          }
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

  /** Somewhere that is not a floor: a level of the tree, heaven or silence (`level.<zone>`). */
  setZone(zone: string) {
    this.depthEl.textContent = t(`level.${zone}` as MessageKey);
  }

  setFloor(floor: FloorResult, depth: number) {
    this.lastDepth = depth;
    this.depthEl.textContent = floorLabel(depth);
    this.mapState = null;
    this.drawMap(floor, -1, new Set());
  }

  setRoom(floor: FloorResult, room: number, visited: Set<number>, cleared: Set<number> = this.lastCleared) {
    this.lastCleared = cleared;
    this.mapState = { floor, room, visited };
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
      // every room is one cell: the map tells how many rooms and how they join, never their size or shape
      const rw = cw, rh = ch;
      const visitedHere = visited.has(r.id);
      const paint = (px: number, py: number, pw: number, ph: number) => {
        if (visitedHere) {
          g.globalAlpha = this.lastCleared.has(r.id) && r.id !== current ? 0.5 : 1;
          g.fillStyle = r.id === current ? MAP.current : this.lastCleared.has(r.id) ? MAP.cleared : MAP.visited;
          g.fillRect(px, py, pw, ph);
        } else {
          g.globalAlpha = r.type === 'path' ? 0.35 : 0.25;
          if (r.type === 'path') { g.fillStyle = MAP.unvisited; g.fillRect(px, py, pw, ph); }
          else { g.strokeStyle = MAP.unvisited; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1); }
        }
        g.globalAlpha = 1;
      };
      // a path of the Tree is a connector: a thin band from the middle of its cell to each neighbour,
      // reaching across the gap so the emanations it joins touch it with no break
      if (r.type === 'path') {
        const links = floor.plan.rooms[r.id % ROOM_ID_STRIDE].links;
        const bx = x + Math.floor(cw / 2) - 1, by = y + Math.floor(ch / 2) - 1;
        const west = links.W !== undefined, east = links.E !== undefined, north = links.N !== undefined, south = links.S !== undefined;
        if (west || east) {
          const x0 = west ? x - gap : bx, x1 = east ? x + cw + gap : bx + 3;
          paint(x0, by, x1 - x0, 3);
        }
        if (north || south) {
          const y0 = north ? y - gap : by, y1 = south ? y + ch + gap : by + 3;
          paint(bx, y0, 3, y1 - y0);
        }
        continue;
      }
      paint(x, y, rw, rh);
      if (r.type !== 'normal') this.mapMark(g, r.type, x + cw / 2, y + ch / 2);
    }
    const here = current >= 0 ? floor.rooms.find(r => r.id === current) : undefined;
    if (here) this.mapArrow(g, gap + here.gx * (cw + gap) + cw / 2, gap + here.gz * (ch + gap) + ch / 2);
  }

  private mapArrow(g: CanvasRenderingContext2D, cx: number, cy: number) {
    const dx = -Math.sin(this.mapYaw), dz = -Math.cos(this.mapYaw);
    g.fillStyle = palCss('ink.void');
    g.beginPath();
    g.moveTo(cx + dx * 4.5, cy + dz * 4.5);
    g.lineTo(cx - dx * 2.5 + dz * 3, cy - dz * 2.5 - dx * 3);
    g.lineTo(cx - dx * 2.5 - dz * 3, cy - dz * 2.5 + dx * 3);
    g.closePath();
    g.fill();
  }

  /** Room marks are glyphs, never colour alone: a house, a hollow ◇, a ▭, a ▣. */
  private mapMark(g: CanvasRenderingContext2D, type: string, cx: number, cy: number) {
    const x = Math.round(cx), y = Math.round(cy);
    const dot = (dx: number, dy: number) => g.fillRect(x + dx, y + dy, 1, 1);
    g.fillStyle = (MAP as Record<string, string>)[type] ?? MAP.start;
    if (type === 'start') { dot(0, -2); dot(-1, -1); dot(0, -1); dot(1, -1); g.fillRect(x - 1, y, 3, 2); }
    else if (type === 'treasure') { dot(0, -2); dot(-1, -1); dot(1, -1); dot(-2, 0); dot(2, 0); dot(-1, 1); dot(1, 1); dot(0, 2); }
    else if (type === 'vault') { g.fillRect(x - 2, y - 1, 5, 1); g.fillRect(x - 2, y + 1, 5, 1); dot(-2, 0); dot(2, 0); }
    else if (type === 'challenge') { for (let i = -2; i <= 2; i++) { dot(i, i); dot(i, -i); } }
    else if (type === 'boss') { g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = palCss('ink.void'); g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = MAP.boss; dot(0, 0); }
  }

  // ───────────────────────── feedback ─────────────────────────

  /** Isaac-style banner: icon, name, quality, inspiration, and exactly what changed. */
  presenceCard(nameKey: MessageKey, lineKeys: readonly MessageKey[]) {
    this.lastBanner = null;
    this.bannerEl.style.setProperty('--c', palCss('bone.paper'));
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><div><b>${th(nameKey)}</b>` +
      lineKeys.map(k => `<span>${th(k)}</span>`).join('') +
      `<p class="dismiss">${th(forDevice('banner.continue', activeDevice()))}</p></div></div>`;
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  itemBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    this.lastBanner = [def, changes, synergies];
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
      `${lines.concat(syn).join('')}<p class="dismiss">${th(forDevice('banner.continue', activeDevice()))}</p></div></div>`;
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

  shake(seconds: number) {
    this.shakeT = Math.max(this.shakeT, seconds);
    this.rumble?.(Math.min(1, seconds * 2), Math.min(400, seconds * 1000));
  }
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
      `<p class="seed">${th('seed.label', { seed: this.seedText })}</p><button type="button" class="go" data-act="restart">${th(forDevice('death.restart', activeDevice()))}</button></div>`;
  }

  hideDeath() { this.deathEl.classList.remove('show'); }

  // ───────────────────────── inventory window ─────────────────────────

  /** Opens the screen on a tab (or switches tabs when it is open). Opening pauses the world. */
  openScreen(g: Game, tab: ScreenTab) {
    this.game = g;
    if (!this.screenOpen) {
      this.screenOpen = true;
      if (g.input.device === 'keyboard') g.input.unlockFor(); else g.input.release();
      this.selected = g.inventory.items.at(-1)?.def.id ?? null;
    }
    this.screenTab = tab;
    this.renderScreen(g);
  }

  /** Closes the screen and returns to play; on the keyboard the mouse is captured again. */
  closeScreen(g: Game) {
    if (!this.screenOpen) return;
    this.screenOpen = false;
    this.showTab('menu');
    if (g.input.device === 'keyboard') { g.input.release(); g.input.lock(); }
    else g.input.resume();
  }

  /** Tab, Y and the touch tab button: the same screen, two tabs (docs/architecture/input/README.md). */
  screenKey(g: Game, by: Device) {
    const touchTab = by === 'touch';
    if (this.screenOpen && (touchTab || this.screenTab === 'items')) this.closeScreen(g);
    else this.openScreen(g, touchTab ? 'menu' : 'items');
  }

  private renderScreen(g: Game) {
    this.showTab(this.screenTab);
    if (this.screenTab === 'items') this.renderInventory(g);
  }

  private showTab(tab: ScreenTab) {
    if (tab === this.shownTab) return;
    this.shownTab = tab;
    this.overlay.dataset.tab = tab;
    this.overlay.scrollTop = 0;
    for (const b of this.overlay.querySelectorAll<HTMLElement>('.tabs button')) {
      b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    }
  }

  moveSelection(dx: number, dy: number) {
    const g = this.game;
    if (!g) return;
    const root = this.tollOpen ? this.tollEl : this.invEl;
    const tiles = [...root.querySelectorAll<HTMLElement>('.tile')];
    if (!tiles.length) return;
    const cols = Math.max(1, tiles.filter(b => b.offsetTop === tiles[0].offsetTop).length);
    const at = Math.max(0, tiles.findIndex(b => b.dataset.id === this.selected));
    const next = Math.min(tiles.length - 1, Math.max(0, at + dx + dy * cols));
    this.selected = tiles[next].dataset.id!;
    if (this.tollOpen) this.renderToll(g); else this.renderInventory(g);
    root.querySelector<HTMLElement>('.tile.sel, .tile.cur')?.scrollIntoView({ block: 'nearest' });
  }

  openToll(g: Game, k: number) {
    this.game = g;
    this.tollOpen = true;
    this.tollFloor = k;
    this.tollPicked.clear();
    this.tollEl.classList.add('show');
    g.input.unlockFor();
    this.selected = this.tollIds(g)[0];
    this.renderToll(g);
  }

  closeToll(g: Game) {
    this.tollOpen = false;
    this.tollEl.classList.remove('show');
    if (g.input.device === 'keyboard') { g.input.release(); g.input.lock(); }
    else g.input.resume();
  }

  confirmToll(g: Game) {
    if (this.selected) this.tollAct(g, this.selected);
  }

  private tollIds(g: Game): string[] {
    const toll = tollOf(this.tollFloor);
    const p = g.player;
    const ids: string[] = [];
    if (toll?.practices) g.inventory.items.forEach((_, i) => ids.push(`item:${i}`));
    else if (toll) {
      ids.push(...handTollIds(p.hand));
      for (let i = 0; i < p.keys; i++) ids.push(`key:${i}`);
      for (let i = 0; i < p.bombs; i++) ids.push(`bomb:${i}`);
      for (let i = 0; i < Math.ceil(p.hp / HEART); i++) ids.push(`heart:${i}`);
    }
    return [...ids, 'pay', 'close'];
  }

  private tollAct(g: Game, id: string) {
    const toll = tollOf(this.tollFloor);
    if (!toll) return;
    if (id === 'close') { this.closeToll(g); return; }
    if (id === 'pay') {
      if (this.tollPicked.size === toll.count && g.payToll(this.tollFloor, [...this.tollPicked])) { this.closeToll(g); return; }
      this.toast('toll.need', { n: toll.count });
      this.renderToll(g);
      return;
    }
    if (this.tollPicked.has(id)) this.tollPicked.delete(id);
    else if (this.tollPicked.size < toll.count) this.tollPicked.add(id);
    this.renderToll(g);
  }

  private renderToll(g: Game) {
    const toll = tollOf(this.tollFloor);
    if (!toll) return;
    const p = g.player;
    const ids = this.tollIds(g);
    const cur = this.selected && ids.includes(this.selected) ? this.selected : ids[0];
    const tile = (id: string, icon: string, label: string) =>
      `<button type="button" class="tile${this.tollPicked.has(id) ? ' on' : ''}${id === cur ? ' cur' : ''}" data-id="${id}"><img src="${icon}" alt=""><span class="lbl">${esc(label)}</span></button>`;
    const section = (key: MessageKey, body: string) => (body ? `<h3>${th(key)}</h3>${body}` : '');
    const hearts = Array.from({ length: Math.ceil(p.hp / HEART) }, (_, i) => tile(`heart:${i}`, hudIconUrl(HUD_ICONS.heart), t('toll.heart'))).join('');
    const keys = Array.from({ length: p.keys }, (_, i) => tile(`key:${i}`, hudIconUrl(HUD_ICONS.key), t('toll.key'))).join('');
    const bombs = Array.from({ length: p.bombs }, (_, i) => tile(`bomb:${i}`, hudIconUrl(HUD_ICONS.seed), t('toll.bomb'))).join('');
    const hands = p.hand.map((m, i) => (typeof m === 'number'
      ? tile(`hand:${i}`, this.slotUrl(m), materialName(m))
      : isFlask(m)
        ? tile(`hand:${i}`, iconDataUrl(carriedDef(m), 3), t(POTIONS[m.potion].name))
        : tile(`hand:${i}`, iconDataUrl(m, 3), partText(m).name))).join('');
    const items = g.inventory.items.map((it, i) => tile(`item:${i}`, iconDataUrl(it.def, 3), itemText(it.def).name)).join('');
    const body = toll.practices
      ? section('toll.sec.item', items)
      : section('toll.sec.hand', hands) + section('toll.sec.key', keys) + section('toll.sec.bomb', bombs) + section('toll.sec.heart', hearts);
    const ready = this.tollPicked.size === toll.count;
    const device = activeDevice();
    this.tollEl.innerHTML =
      `<div class="card slate"><header><h2>${th('toll.title')}</h2>` +
      `<small>${th(toll.practices ? 'toll.leadPractices' : 'toll.lead', { n: toll.count })} · ${th('toll.chosen', { n: this.tollPicked.size, total: toll.count })}</small></header>` +
      `<p class="hint">${th('toll.hint', controlParams(device))}</p>` +
      `<div class="grid">${body || `<p class="none">${th('toll.none')}</p>`}</div>` +
      `<div class="go-row"><button type="button" class="tile go${ready ? '' : ' off'}${cur === 'pay' ? ' cur' : ''}" data-id="pay"><span class="lbl">${th('toll.go')}</span></button>` +
      `<button type="button" class="tile go${cur === 'close' ? ' cur' : ''}" data-id="close"><span class="lbl">${th('toll.stay')}</span></button></div></div>`;
    for (const b of this.tollEl.querySelectorAll<HTMLButtonElement>('.tile')) {
      b.addEventListener('mouseenter', () => this.moveCursor(b.dataset.id!));
      b.addEventListener('click', () => { this.moveCursor(b.dataset.id!); this.tollAct(g, b.dataset.id!); });
    }
  }

  private moveCursor(id: string) {
    this.selected = id;
    this.tollEl.querySelector('.tile.cur')?.classList.remove('cur');
    this.tollEl.querySelector(`.tile[data-id="${id}"]`)?.classList.add('cur');
  }

  private renderInventory(g: Game) {
    const s = g.stats.all;
    const held = g.inventory.items.map(i => i.def);
    const counts = new Map<string, number>();
    for (const d of held) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    const unique = [...new Map(held.map(d => [d.id, d])).values()];
    const ids = unique.map(d => d.id);
    const selId = ids.find(id => id === this.selected) ?? ids.at(-1);
    const sel = unique.find(d => d.id === selId);

    const tile = (id: string, c: number, icon: { id: string; icon: ItemDef['icon'] }, name: string, n: number) =>
      `<button class="tile${id === selId ? ' sel' : ''}" data-id="${id}" style="--c:${hex(c)}">` +
      `<img src="${iconDataUrl(icon, 3)}" alt=""><span class="lbl">${esc(name)}</span>${n > 1 ? `<i>×${n}</i>` : ''}</button>`;
    const grid = unique.map(d => tile(d.id, d.color, d, itemText(d).name, counts.get(d.id) ?? 1)).join('');

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
      `<div class="card slate"><header><h2>${th('inv.title')}</h2><small>${th('inv.held', { n: held.length })} · <span class="seed">${th('inv.seed', { seed: this.seedText })}</span> · ${th(forDevice('inv.close', activeDevice()))}</small><button type="button" class="close" data-act="inventory" aria-label="${th('inv.closeLabel')}">✕</button></header>` +
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
