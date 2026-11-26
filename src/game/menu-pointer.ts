import type { Device } from '../input/bindings';

/**
 * The mouse in the menus (#356): the rules the HUD follows so that every click in the pause card, the menu panel and the
 * screen lands on the control under the pointer. The pointer lock side is `capturesMouse` in input/input.ts.
 */

/** A hover over an inventory tile redraws the screen only when it moves the highlight to a new tile. Redrawing replaces the
 *  tile under the pointer, so a redraw on every hover would send a click pressed on one tile and released on its copy to no tile. */
export function hoverRedraws(selected: string | null, hovered: string): boolean {
  return selected !== hovered;
}

/** Whether a mouse click starts play from the pause card: only on its backdrop (outside the card and its scrollbar),
 *  only on the keyboard and mouse, and never while the screen (items, map, recipes) is open. */
export function backdropResumes(o: { device: Device; screenOpen: boolean; onBackdrop: boolean; offsetX: number; clientWidth: number }): boolean {
  return o.device === 'keyboard' && !o.screenOpen && o.onBackdrop && o.offsetX < o.clientWidth;
}
