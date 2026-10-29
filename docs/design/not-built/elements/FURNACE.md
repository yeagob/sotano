# Furnace

Up: [not-built elements](README.md) · Status: proposal.

A furnace is a station in some rooms where raw matter goes in and something better comes out, if it has fuel and time. It stands for deliberate practice, refining. The design calls it a block with a store: fuel and an input.

## What it would do

- **Takes things in.** Throw or place a cube into its mouth. Flammable cubes go to the fuel slot, others to the input slot.
- **Smelts after a delay.** With fuel and a smeltable input, after a few seconds it ejects the result as a loose cube.
- **Stores what it cannot smelt.** Something it cannot smelt stays inside and pops out when the player takes it, like a small chest. This is the design's answer to "at least store it".

The design table of results:

| Input | Output |
|---|---|
| Stone | brick |
| Deepstone | stone, sometimes iron |
| Sand | glass |
| Iron ore | iron |
| Dirt | brick (clay) |
| Mud | brick |
| Crate | coal |

Fuel: a crate burns for one smelt; coal burns for four.

## Materials it brings

- **Iron.** A solid block, heavy, that sinks, conducts electricity, and is made from iron ore.
- **Coal.** The best fuel: it burns long.

## What it reacts with

Stone, deepstone, sand, iron ore, dirt, mud, crates (as input or fuel), coal, and electricity (which can power it later).

## Open questions

1. Is the furnace a room block or a station the player carries? (The station family is in [stations](../stations/README.md); its furnace is [FURNACE](../stations/FURNACE.md).)
2. Does the result pop out as a loose cube or as a pickup? The design says a loose cube.
3. Does a deepstone smelt sometimes give iron, and how often?
4. The design names an Alchemy practice that gives better furnace results. No practice exists for it yet, and it is not decided.
