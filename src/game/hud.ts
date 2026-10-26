// DOM HUD: crosshair, hand slots, keys, floor, minimap, item banner (with what the item
// changed), stats panel (Tab) and the debug readout.

import { mat } from '../content/materials';
import { STAT_INFO, type StatName } from '../core/stats';
import type { ItemDef, SynergyDef } from '../items/types';
import { materialTexture } from '../render/atlas';
import type { FloorResult } from '../world/floor';
import type { Game } from './game';

const $ = (id: string) => document.getElementById(id)!;

const STAT_ORDER: StatName[] = [
  'damage', 'fireRate', 'shotSpeed', 'range', 'gravity', 'size', 'mining',
  'moveSpeed', 'jump', 'carry', 'kick', 'throw', 'crush', 'reach', 'luck',
];

const ROOM_COLORS: Record<string, string> = {
  start: '#9fd3ff', normal: '#cfc6b8', treasure: '#f2c84b', boss: '#e05d5d', vault: '#c9a227',
};

export class Hud {
  private hand = $('hand');
  private items = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  private toastEl = $('toast');
  private keysEl = $('keys');
  private depthEl = $('depth');
  private statsEl = $('stats');
  private map = $('minimap') as HTMLCanvasElement;
  private handKey = '';
  private slotUrls = new Map<number, string>();
  private debugTimer = 0;
  private bannerTimer = 0;
  private toastTimer = 0;
  private statsOpen = false;
  private statsKey = '';
  showDebug = true;

  update(g: Game, running: boolean) {
    this.overlay.style.display = running ? 'none' : 'flex';

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
    this.keysEl.textContent = `🗝 ${g.player.keys}`;

    if (this.statsOpen) {
      const s = g.stats.all;
      const k = STAT_ORDER.map(n => s[n].toFixed(3)).join('|') + g.inventory.items.length;
      if (k !== this.statsKey) { this.statsKey = k; this.renderStats(g); }
    }

    if (--this.debugTimer <= 0 && this.showDebug) {
      this.debugTimer = 15;
      const d = g.debug;
      this.debugEl.textContent =
        `${d.fps} fps · ${Math.round(d.tris / 1000)}k tris · cubes ${d.debris} · intents ${d.intents} · damaged ${d.damaged}\n` +
        `pos ${d.pos} · room ${d.room}\nhand: ${d.held}`;
    }
    this.debugEl.style.display = this.showDebug ? 'block' : 'none';
    const now = performance.now();
    if (now > this.bannerTimer) this.bannerEl.classList.remove('show');
    if (now > this.toastTimer) this.toastEl.classList.remove('show');
  }

  private slotUrl(m: number) {
    let url = this.slotUrls.get(m);
    if (!url) { url = (materialTexture(m).image as HTMLCanvasElement).toDataURL(); this.slotUrls.set(m, url); }
    return url;
  }

  setItems(items: readonly ItemDef[]) {
    this.items.innerHTML = '';
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it.name;
      li.title = it.description;
      li.style.setProperty('--c', '#' + it.color.toString(16).padStart(6, '0'));
      this.items.appendChild(li);
    }
  }

  setFloor(floor: FloorResult, depth: number) {
    this.depthEl.textContent = `Floor ${depth}`;
    this.drawMap(floor, -1, new Set());
  }

  setRoom(floor: FloorResult, room: number, visited: Set<number>) {
    this.drawMap(floor, room, visited);
  }

  /** Isaac-style minimap: visited rooms, their neighbours as outlines, special rooms coloured. */
  private drawMap(floor: FloorResult, current: number, visited: Set<number>) {
    const c = this.map, g = c.getContext('2d')!;
    const cw = 14, ch = 9, gap = 2;
    const { w, h } = floor.plan;
    c.width = w * (cw + gap) + gap; c.height = h * (ch + gap) + gap;
    g.clearRect(0, 0, c.width, c.height);
    const known = new Set<number>(visited);
    for (const id of visited) for (const n of Object.values(floor.plan.rooms[id].links)) known.add(n as number);
    for (const r of floor.rooms) {
      if (!known.has(r.id)) continue;
      const x = gap + r.gx * (cw + gap), y = gap + r.gz * (ch + gap);
      const col = ROOM_COLORS[r.type];
      if (visited.has(r.id)) { g.fillStyle = r.id === current ? '#ffffff' : '#8a8178'; g.fillRect(x, y, cw, ch); }
      else { g.strokeStyle = '#8a8178'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1); }
      if (r.type !== 'normal') { g.fillStyle = col; g.fillRect(x + cw / 2 - 2, y + ch / 2 - 2, 4, 4); }
    }
  }

  toggleStats() {
    this.statsOpen = !this.statsOpen;
    this.statsEl.classList.toggle('show', this.statsOpen);
    this.statsKey = '';
  }

  private renderStats(g: Game) {
    const s = g.stats.all;
    const rows = STAT_ORDER.map(n => `<tr><td>${STAT_INFO[n].label}</td><td>${STAT_INFO[n].fmt(s[n])}</td></tr>`).join('');
    const items = g.inventory.items.map(i => `<li style="--c:#${i.def.color.toString(16).padStart(6, '0')}"><b>${i.def.name}</b> — ${i.def.description}</li>`).join('');
    const syn = g.inventory.synergiesActive.map(sy => `<li class="syn"><b>${sy.name}</b> — ${sy.description}</li>`).join('');
    this.statsEl.innerHTML = `<h2>Stats</h2><table>${rows}</table>` +
      `<h2>Items</h2><ul>${items || '<li class="none">none yet</li>'}${syn}</ul><p class="hint">Tab to close</p>`;
  }

  /** Isaac-style banner: name, description and exactly what changed. */
  itemBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    const lines = changes.map(c => {
      const up = c.to > c.from;
      return `<i class="${up ? 'up' : 'down'}">${STAT_INFO[c.stat].label} ${STAT_INFO[c.stat].fmt(c.from)} → ${STAT_INFO[c.stat].fmt(c.to)}</i>`;
    });
    const syn = synergies.map(s => `<i class="syn">Synergy: ${s.name} — ${s.description}</i>`);
    this.bannerEl.innerHTML = `<b>${def.name}</b><span>${def.description}</span>${lines.concat(syn).join('')}`;
    this.bannerEl.classList.add('show');
    this.bannerTimer = performance.now() + 4200;
  }

  toast(text: string) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = performance.now() + 2500;
  }
}
