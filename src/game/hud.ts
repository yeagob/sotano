// DOM HUD. Isaac-style corner: hearts, bombs and keys (capped at 99); item icons; minimap and
// floor; hand slots; the pickup banner (icon, quality, what it changed, new synergies) with a
// screen flash; damage vignette and screen shake; the inventory window (Tab); the death screen;
// toasts; and the debug readout.

import { SYNERGIES } from '../content/synergies';
import { mat } from '../content/materials';
import { STAT_INFO, type StatName } from '../core/stats';
import type { ItemDef, Req, SynergyDef } from '../items/types';
import { materialTexture } from '../render/atlas';
import { iconDataUrl, qualityStars } from '../render/icons';
import type { FloorResult } from '../world/floor';
import type { Game } from './game';

const $ = (id: string) => document.getElementById(id)!;
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const STAT_ORDER: StatName[] = [
  'damage', 'fireRate', 'shotSpeed', 'range', 'gravity', 'size', 'mining',
  'moveSpeed', 'jump', 'maxHearts', 'invuln', 'carry', 'kick', 'throw', 'crush', 'reach',
  'bombRadius', 'bombDamage', 'luck',
];

const ROOM_COLORS: Record<string, string> = {
  start: '#9fd3ff', normal: '#cfc6b8', treasure: '#f2c84b', boss: '#e05d5d', vault: '#c9a227',
};

const PATH_COLORS: Record<string, string> = { body: '#e0884a', mind: '#9b7bff', emotion: '#e88fb5', will: '#c9a227' };

export class Hud {
  private hand = $('hand');
  private itemsBar = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  private toastEl = $('toast');
  private heartsEl = $('hearts');
  private bombsEl = $('bombs');
  private keysEl = $('keys');
  private depthEl = $('depth');
  private invEl = $('inventory');
  private flashEl = $('flash');
  private hurtEl = $('hurt');
  private deathEl = $('death');
  private map = $('minimap') as HTMLCanvasElement;
  private handKey = '';
  private heartsKey = '';
  private slotUrls = new Map<number, string>();
  private debugTimer = 0;
  private toastTimer = 0;
  private shakeT = 0;
  private selected: string | null = null;
  inventoryOpen = false;
  bannerOpen = false;
  showDebug = true;

  update(g: Game, running: boolean, dt: number) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.overlay.style.display = running || this.inventoryOpen || g.player.dead ? 'none' : 'flex';

    // hearts: full, half, empty containers
    const max = Math.floor(g.stats.get('maxHearts')), hp = g.player.hp;
    const hk = `${max}:${hp}:${g.player.invulnT > 0 ? 1 : 0}`;
    if (hk !== this.heartsKey) {
      this.heartsKey = hk;
      let html = '';
      for (let i = 0; i < max; i++) {
        const v = hp - i * 2;
        html += `<span class="heart ${v >= 2 ? 'full' : v === 1 ? 'half' : 'empty'}"></span>`;
      }
      this.heartsEl.innerHTML = html;
      this.heartsEl.classList.toggle('blink', g.player.invulnT > 0);
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
          img.title = mat(m).name;
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
    this.itemsBar.innerHTML = items.map(it => `<img src="${iconDataUrl(it, 2)}" title="${esc(it.name)}" alt="">`).join('');
  }

  setFloor(floor: FloorResult, depth: number) {
    this.depthEl.textContent = `Floor ${depth}`;
    this.drawMap(floor, -1, new Set());
  }

  setRoom(floor: FloorResult, room: number, visited: Set<number>) {
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
      for (const i of Object.values(floor.plan.rooms[r.id % 100].links)) known.add(floor.rooms[i as number].id);
    }
    for (const r of floor.rooms) {
      if (!known.has(r.id)) continue;
      const x = gap + r.gx * (cw + gap), y = gap + r.gz * (ch + gap);
      if (visited.has(r.id)) { g.fillStyle = r.id === current ? '#ffffff' : '#8a8178'; g.fillRect(x, y, cw, ch); }
      else { g.strokeStyle = '#8a8178'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1); }
      if (r.type !== 'normal') { g.fillStyle = ROOM_COLORS[r.type]; g.fillRect(x + cw / 2 - 2, y + ch / 2 - 2, 4, 4); }
    }
  }

  // ───────────────────────── feedback ─────────────────────────

  /** Isaac-style banner: icon, name, quality, inspiration, and exactly what changed. */
  itemBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    const lines = changes.map(c => {
      const up = c.to > c.from;
      return `<i class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${STAT_INFO[c.stat].label} ${STAT_INFO[c.stat].fmt(c.from)} → ${STAT_INFO[c.stat].fmt(c.to)}</i>`;
    });
    const syn = synergies.map(s => `<i class="syn">✦ ${esc(s.name)} — ${esc(s.description)}</i>`);
    this.bannerEl.style.setProperty('--c', hex(def.color));
    this.bannerEl.innerHTML =
      `<div class="ribbon"><img src="${iconDataUrl(def, 5)}" alt=""><div>` +
      `<b>${esc(def.name)}</b><em class="q q${def.quality}">${qualityStars(def.quality)}</em>` +
      `<span>${esc(def.description)}</span>` +
      `<p class="effect">${esc(def.effect)}</p>` +
      (def.inspiredBy ? `<small>Inspired by ${esc(def.inspiredBy)}</small>` : '') +
      `${lines.concat(syn).join('')}<p class="dismiss">Click to continue</p></div></div>`;
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth; // restart the entrance animation
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  /** Information banners stay until the player clicks (owner rule). */
  dismissBanner() {
    this.bannerOpen = false;
    this.bannerEl.classList.remove('show');
  }

  flash(color: number) {
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

  shake(seconds: number) { this.shakeT = Math.max(this.shakeT, seconds); }
  shakeAmount() { return this.shakeT > 0 ? Math.min(0.25, this.shakeT * 0.6) : 0; }

  toast(text: string) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = performance.now() + 2500;
  }

  private seedText = '';
  private seedListener = false;

  /** Shown on the pause card, the inventory and the death screen; clicking it copies a share link. */
  setSeed(label: string) {
    this.seedText = label;
    const el = document.getElementById('seed');
    if (el) el.textContent = `Seed ${label} · click to copy`;
    if (this.seedListener) return;
    this.seedListener = true;
    // capture phase: copying must not also capture the mouse or fire
    addEventListener('mousedown', e => {
      const t = (e.target as HTMLElement | null)?.closest?.('.seed');
      if (!t) return;
      e.stopPropagation();
      const [code, v] = this.seedText.split(' · v');
      const url = `${location.origin}${location.pathname}?seed=${code.replace(' ', '-')}&v=${v}`;
      navigator.clipboard?.writeText(url).then(() => this.toast('Seed link copied'), () => this.toast(`Seed ${this.seedText}`));
    }, true);
  }

  showDeath(depth: number, items: readonly ItemDef[], source: string) {
    this.dismissBanner();
    document.exitPointerLock?.();
    this.deathEl.innerHTML =
      `<div class="card"><h1>The intention faded</h1><p>Overcome by ${esc(source)} on floor ${depth}.</p>` +
      `<div class="icons">${items.map(i => `<img src="${iconDataUrl(i, 3)}" title="${esc(i.name)}" alt="">`).join('')}</div>` +
      `<p class="seed">Seed ${esc(this.seedText)}</p><p class="go">Press R to begin again</p></div>`;
    this.deathEl.classList.add('show');
  }

  hideDeath() { this.deathEl.classList.remove('show'); }

  // ───────────────────────── inventory window ─────────────────────────

  toggleInventory(g: Game) {
    this.inventoryOpen = !this.inventoryOpen;
    this.invEl.classList.toggle('show', this.inventoryOpen);
    if (this.inventoryOpen) {
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

    const detail = sel ? this.itemDetail(sel) : '<p class="none">No practices yet. Find a treasure room.</p>';

    const active = new Set(g.inventory.synergiesActive.map(x => x.id));
    const synRows = SYNERGIES.map(sy => {
      const met = sy.requires.filter(r => g.inventory.meets(r)).length;
      if (!active.has(sy.id) && met === 0) return '';
      const reqs = sy.requires.map(r => this.reqLabel(r, g)).join(' + ');
      return active.has(sy.id)
        ? `<li class="on"><b>✦ ${esc(sy.name)}</b><span>${esc(sy.description)}</span><small>${reqs}</small></li>`
        : `<li class="off"><b>✧ ???</b><small>${reqs} (${met}/${sy.requires.length})</small></li>`;
    }).join('');

    const stats = STAT_ORDER.map(n => `<tr><td>${STAT_INFO[n].label}</td><td>${STAT_INFO[n].fmt(s[n])}</td></tr>`).join('');

    this.invEl.innerHTML =
      `<div class="card"><header><h2>Practices</h2><small>${held.length} held · <span class="seed">seed ${esc(this.seedText)}</span> · Tab to close</small></header>` +
      `<div class="cols"><section class="left"><div class="grid">${grid || '<p class="none">—</p>'}</div>${detail}` +
      `<h3>Synergies and states of being</h3><ul class="syns">${synRows || '<li class="none">None discovered yet.</li>'}</ul></section>` +
      `<section class="right"><h3>State</h3><table>${stats}</table></section></div></div>`;

    for (const b of this.invEl.querySelectorAll<HTMLButtonElement>('.tile')) {
      b.addEventListener('mouseenter', () => { this.selected = b.dataset.id!; this.renderInventory(g); });
      b.addEventListener('click', () => { this.selected = b.dataset.id!; this.renderInventory(g); });
    }
  }

  private itemDetail(d: ItemDef) {
    const fx = (d.stats ?? []).map(m => {
      const v = m.layer === 'mul' ? `×${m.value}` : m.layer === 'final' ? `= ${m.value}` : `${m.value > 0 ? '+' : ''}${m.value}`;
      return `<i>${STAT_INFO[m.stat].label} ${v}</i>`;
    }).join('');
    const paths = (d.tags ?? []).filter(t => PATH_COLORS[t]).map(t => `<em class="path" style="--p:${PATH_COLORS[t]}">${t}</em>`).join('');
    return `<div class="detail" style="--c:${hex(d.color)}"><img src="${iconDataUrl(d, 6)}" alt="">` +
      `<div><b>${esc(d.name)}</b> <span class="q q${d.quality}">${qualityStars(d.quality)}</span> ${paths}` +
      `<p>${esc(d.description)}</p><p class="effect">${esc(d.effect)}</p>${d.inspiredBy ? `<small>Inspired by ${esc(d.inspiredBy)}</small>` : ''}` +
      `<div class="fx">${fx}</div></div></div>`;
  }

  private reqLabel(r: Req, g: Game) {
    if (typeof r !== 'string') {
      const have = g.inventory.countTag(r.tag), need = r.count ?? 1;
      return `<em class="path" style="--p:${PATH_COLORS[r.tag] ?? '#aaa'}">${r.tag} ${Math.min(have, need)}/${need}</em>`;
    }
    const held = g.inventory.has(r);
    const def = g.inventory.items.find(i => i.def.id === r)?.def;
    return held && def ? esc(def.name) : '???';
  }
}
