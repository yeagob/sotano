// DOM HUD: crosshair, block slot, items, Isaac-style banners and debug readout.

import type { ItemDef } from '../content/items';
import { materialTexture } from '../render/atlas';
import type { Game } from './game';

const $ = (id: string) => document.getElementById(id)!;

export class Hud {
  private slot = $('slot');
  private slotImg = $('slot-img') as HTMLImageElement;
  private items = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  private toastEl = $('toast');
  private held = -1;
  private slotUrls = new Map<number, string>();
  private debugTimer = 0;
  private bannerTimer = 0;
  private toastTimer = 0;
  showDebug = true;

  update(g: Game, locked: boolean) {
    this.overlay.style.display = locked ? 'none' : 'flex';
    const held = g.player.held;
    if (held !== this.held) {
      this.held = held;
      this.slot.classList.toggle('full', held !== 0);
      if (held) {
        let url = this.slotUrls.get(held);
        if (!url) { url = (materialTexture(held).image as HTMLCanvasElement).toDataURL(); this.slotUrls.set(held, url); }
        this.slotImg.src = url;
      }
    }
    if (--this.debugTimer <= 0 && this.showDebug) {
      this.debugTimer = 15;
      const d = g.debug;
      this.debugEl.textContent =
        `${d.fps} fps · ${Math.round(d.tris / 1000)}k tris · cubes ${d.debris} · intents ${d.intents} · damaged ${d.damaged}\n` +
        `pos ${d.pos} · hand: ${d.held}`;
    }
    this.debugEl.style.display = this.showDebug ? 'block' : 'none';
    const now = performance.now();
    if (now > this.bannerTimer) this.bannerEl.classList.remove('show');
    if (now > this.toastTimer) this.toastEl.classList.remove('show');
  }

  setItems(items: ItemDef[]) {
    this.items.innerHTML = '';
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it.name;
      li.title = it.description;
      this.items.appendChild(li);
    }
  }

  banner(title: string, sub: string) {
    this.bannerEl.innerHTML = `<b>${title}</b><span>${sub}</span>`;
    this.bannerEl.classList.add('show');
    this.bannerTimer = performance.now() + 2600;
  }

  toast(text: string) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = performance.now() + 2500;
  }
}
