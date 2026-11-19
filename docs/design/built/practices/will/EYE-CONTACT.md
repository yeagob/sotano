# Eye Contact

Up: [Will folder](README.md) · [all practices](../README.md) · [built design](../../README.md) · [the aim pair](../AIM-PRACTICES.md)

| | |
|---|---|
| Path | Will; also Aim (mechanic tag) |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Eye contact in exposure and assertiveness training |
| Code | `src/content/items/eyecontact.ts` |

## What it means

Looking at what you fear instead of away from it.

## What it does

Intentions curve toward the nearest projection within 8 blocks. If you also carry Dowsing, the one you got last is the one that guides.

## Stats and events

- homing: at least 3 (set in the `fire` hook, never lowered)
- when an intention is fired: its homing target is a projection (`homingTarget` = `projection`), within 8 blocks. A positive intention steers toward any projection it can meet; a negative one only toward hostile projections.

## Positive outcome

It only adds steering. Damage, mining and the shot's size stay as they are; a positive intention steered toward a projection still mends it, as before.

## Two aims, one guide

Eye Contact and [Dowsing](../mind/DOWSING.md) cannot both guide. The one gained last writes the target of the shot; the rule and its tests are in [AIM-PRACTICES](../AIM-PRACTICES.md).

## Synergies and states of being

- [Resolute](../states-of-being/RESOLUTE.md) (counts the will tag)

## Open questions

- The Spanish name *Contacto visual* is a plain translation of the technique; the owner confirms it (see [AIM-PRACTICES](../AIM-PRACTICES.md)).
