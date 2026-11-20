# Dowsing

Up: [Mind folder](README.md) · [all practices](../README.md) · [built design](../../README.md) · [the aim pair](../AIM-PRACTICES.md)

| | |
|---|---|
| Path | Mind; also Blocks and Aim (mechanic tags) |
| Quality | 2 of 4 |
| Found in | treasure rooms |
| Inspired by | Dowsing, the folk practice of finding water and ore with a rod |
| Code | `src/content/items/dowsing.ts` |

## What it means

Finding what lies hidden in the ground by trusting a quiet pull.

## What it does

Intentions curve toward the nearest block within 6 blocks. If you also carry Eye Contact, the one you got last is the one that guides.

## Stats and events

- homing: at least 3 (set in the `fire` hook, never lowered)
- when an intention is fired: its homing target is a block (`homingTarget` = `block`), within 6 blocks

## Positive outcome

It only adds steering. Damage, mining and the shot's size stay as they are, and a positive intention that is steered toward a block still mends it as before.

## Two aims, one guide

Dowsing and [Eye Contact](../will/EYE-CONTACT.md) cannot both guide. The one gained last writes the target of the shot; the rule and its tests are in [AIM-PRACTICES](../AIM-PRACTICES.md).

## Synergies and states of being

- [Lucid](../states-of-being/LUCID.md) (counts the mind tag)

## Open questions

- The Spanish name *Radiestesia* is the established word for dowsing; the owner confirms it (see [AIM-PRACTICES](../AIM-PRACTICES.md)).
