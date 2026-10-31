# Controls, as the player meets them

The actions the player has, what each one does in the world, and nothing about which key or button triggers it.

Part of [the player](README.md).

## What the player can do

- **Move** walks you around. In water it wades or swims.
- **Look** turns your view and aims your intentions.
- **Jump** jumps. In water it swims up, and at the surface it lifts you out.
- **Cast** fires intentions while held. A weapon that replaces the intention charges while held and fires when released ([intentions](../intentions/README.md)).
- **Place** puts the top block of your hand on the face you aim at. If there is no face in reach to place it on, it throws the block instead; a face whose cell takes no block (a doorway) is refused with a sound, and it is never thrown. Never thrown because you are in the way: if you stand in the cell (a quarter of a block or less into it, you are nudged out and the block goes down; deeper, the block waits in your hand until you step clear); on touch, a tap places on the block under the tap and a tap with nothing to place on is refused.
- **Throw** throws the top block or part of your hand forward.
- **Bomb** drops a fused bomb at your feet ([BOMBS.md](../blocks/BOMBS.md)).
- **Polarity** switches the loaded intention between positive and negative ([POLARITY.md](../intentions/POLARITY.md)).
- **Inventory** opens the screen. It has two tabs, Menu and Practices. The world stops while it is open.
- **Pause** opens the menu. The world stops.
- **Restart** starts a new run at once. See [DEATH.md](DEATH.md).
- **Confirm** dismisses an information banner, and confirms on the death screen and in the way-down window.
- **Navigate** moves through the practices screen and the way-down window; **Back** closes them.

## The rule behind it

Every action is defined once and every device reaches it. The three control schemes, keyboard and mouse, gamepad and touch in landscape, all ship complete, so a player can switch device at any time and keep playing. The design text settled this as a decision ([DESIGN.md, section 13, question 7](../README.md)).

The device mapping, the contexts in which each action is live, and the words shown for each device are in [the input document](../../../architecture/input/README.md).
