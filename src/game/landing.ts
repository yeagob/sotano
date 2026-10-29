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

// a beetle in the room's own colours: the body is the heart, the legs and antennae are bone
const BUG: HudIcon = {
  rows: [
    '.b........b.',
    '..b......b..',
    '...kkkkkk...',
    '..kkkkkkkk..',
    '.kkpkkkkpkk.',
    'bkkkkkkkkkkb',
    'kkhhhhhhhhkk',
    'khhhhhhhhhhk',
    'khhdhhhhdhhk',
    'bkhhhhhhhhkb',
    '.khhhhhhhhk.',
    '..kkkkkkkk..',
  ],
  palette: { k: 'ink.void', h: 'life.heart', d: 'life.dark', b: 'bone.dim', p: 'bone.paper' },
};

const KEEP_MOUSE = '#overlay a, #newrun';

export function initLanding(game: Game) {
  document.documentElement.style.setProperty('--ico-coffee', `url("${hudIconUrl(COFFEE)}")`);
  document.documentElement.style.setProperty('--ico-bug', `url("${hudIconUrl(BUG)}")`);
  const coffee = document.querySelector<HTMLElement>('#overlay .coffee');
  const bug = document.querySelector<HTMLElement>('#overlay .bug');
  const newRun = document.getElementById('newrun');
  const render = () => {
    const label = t('intro.coffee');
    if (coffee) { coffee.title = label; coffee.setAttribute('aria-label', label); }
    const bugLabel = t('intro.bug');
    if (bug) { bug.title = bugLabel; bug.setAttribute('aria-label', bugLabel); }
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
