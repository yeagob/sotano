import type { HudIcon } from '../content/hud-icons';
import { onLocaleChange, t } from '../i18n';
import { activeDevice, onDeviceChange } from '../input/input';
import { hudIconUrl } from '../render/icons';
import type { Game } from './game';

const COFFEE: HudIcon = {
  rows: [
    '...s..s.....',
    '..s..s......',
    '...s..s.....',
    'pppppppppp..',
    'pccccccccp..',
    'ppppppppppd.',
    'pppppppppp.d',
    'pppppppppp.d',
    'ppppppppppd.',
    '.ppppppppd..',
    '..dddddd....',
  ],
  palette: { p: 'bone.paper', d: 'bone.dim', c: 'mat.crate.base', s: 'bone.dim' },
};

const KEEP_MOUSE = '#overlay a, #newrun';

export function initLanding(game: Game) {
  document.documentElement.style.setProperty('--ico-coffee', `url("${hudIconUrl(COFFEE)}")`);
  const coffee = document.querySelector<HTMLElement>('#overlay .coffee');
  const newRun = document.getElementById('newrun');
  const render = () => {
    const label = t('intro.coffee');
    if (coffee) { coffee.title = label; coffee.setAttribute('aria-label', label); }
    if (newRun) newRun.textContent = t(activeDevice() === 'gamepad' ? 'pause.newRun.pad' : 'pause.newRun');
  };
  render();
  onLocaleChange(render);
  onDeviceChange(render);
  addEventListener('mousedown', e => {
    if ((e.target as HTMLElement | null)?.closest?.(KEEP_MOUSE)) e.stopPropagation();
  }, true);
  addEventListener('click', e => {
    if ((e.target as HTMLElement | null)?.closest?.('#overlay a')) e.stopPropagation();
  }, true);
  newRun?.addEventListener('click', e => {
    e.stopPropagation();
    game.act('restart');
    game.act('resume');
  });
}
