# Chests and keys (built)

Up: [built](../README.md) · the chests you open with keys, the keys that open them, and what they hold.

A chest is a solid block with a model: it looks like a chest, it cannot be broken, and it opens when the player walks up to it and pays what it asks in keys. Chests hold the practices the player is meant to find, and the loot that keeps a run going. Keys are the currency that opens chests and locked doors and pays the way down. The walls around locked doors are a door matter and are documented with the rooms: [rooms/DOORS.md](../levels/rooms/DOORS.md).

Nothing here is a plan. Storing things in chests and breaking them are not built: see [not-built/elements/CHEST-STORAGE.md](../../not-built/elements/CHEST-STORAGE.md) and [not-built/elements/CHEST-BREAKING.md](../../not-built/elements/CHEST-BREAKING.md). Keys changing other than through chests is in [not-built/chests](../../not-built/chests/README.md).

| Document | Contents |
|---|---|
| [CHESTS.md](CHESTS.md) | The chest itself: its look, opening, what is inside, where it stands on a floor |
| [KEYS.md](KEYS.md) | Keys: what a chest asks by floor, where keys come from, where they go, the cap |

Code: `src/world/floor.ts` (where chests stand and their locks), `src/content/tables/chests.ts` (lock and contents tables), `src/game/game.ts` (opening, spending keys), `src/entities/chests.ts` and `src/render/chest-model.ts` (the model).
