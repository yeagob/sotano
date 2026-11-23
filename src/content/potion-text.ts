import { t } from '../i18n';
import { itemText } from '../i18n/content';
import { ITEM_BY_ID } from './items';
import { flaskRooms, POTIONS, type Flask } from './potions';

function echoParams(f: Flask) {
  const d = f.echo ? ITEM_BY_ID.get(f.echo) : undefined;
  const tx = d ? itemText(d) : null;
  return { item: tx?.name ?? '', itemEffect: tx?.effect ?? '' };
}

export function flaskName(f: Flask): string {
  const def = POTIONS[f.potion];
  return def.echo ? t(def.name, echoParams(f)) : t(def.name);
}

export function flaskEffect(f: Flask): string {
  const def = POTIONS[f.potion];
  const rooms = flaskRooms(f);
  return def.echo ? t(def.effect, { rooms, ...echoParams(f) }) : t(def.effect, { rooms });
}
