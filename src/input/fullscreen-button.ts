import { onLocaleChange, t, type MessageKey } from '../i18n';
import { onDeviceChange, type Input } from './input';
import { enterFullscreen, showFullscreenButton } from './fullscreen';

// Four corners, drawn in the current colour: a plain outline that needs no pixel icon from the art agent yet.
const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6"/></svg>';

/**
 * The way back into fullscreen on a phone after the player left it (issue #161). A top-bar button in the
 * style of the other touch buttons, outside the touch layer so it also shows on the menus. It is hidden
 * while the page is fullscreen and on every other device. Each failed request says why, through the
 * shared toast, and leaves the game playable.
 */
export class FullscreenButton {
  readonly el: HTMLButtonElement;

  constructor(private input: Input, private notify: (key: MessageKey) => void) {
    this.el = document.createElement('button');
    this.el.id = 'fullscreen';
    this.el.type = 'button';
    this.el.className = 'tb sys';
    this.el.innerHTML = ICON;
    this.el.addEventListener('click', () => void this.press());
    document.body.appendChild(this.el);
    document.addEventListener('fullscreenchange', () => this.sync());
    onDeviceChange(() => this.sync());
    onLocaleChange(() => this.label());
    this.label();
    this.sync();
  }

  private label() {
    const text = t('touch.fullscreen');
    this.el.setAttribute('aria-label', text);
    this.el.title = text;
  }

  /** Visible on a phone while the page is not fullscreen; `hidden` is what keeps it out of the way. */
  sync() {
    this.el.hidden = !showFullscreenButton(this.input.device === 'touch', !!document.fullscreenElement);
  }

  private async press() {
    const result = await enterFullscreen(document);
    if (result === 'unsupported') this.notify('toast.fullscreenUnsupported');
    else if (result === 'denied') this.notify('toast.fullscreenDenied');
    // The button leaves only once the page really is fullscreen, never on the request alone.
    this.sync();
  }
}
