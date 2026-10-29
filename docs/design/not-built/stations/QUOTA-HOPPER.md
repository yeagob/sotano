# Quota hopper

Status: idea. Index: [stations](README.md).

A quota hopper is a funnel that wants a number of cubes of one kind. Filled, it opens a door, raises a bridge or lowers a lift. Small steps add up.

## Design

- **What it does:** wants N cubes of a kind (five stone, three crates). When full, it opens a door, raises a bridge or lowers a lift.
- **Verb:** throw or place cubes into the hopper until it is full.
- **Meaning:** consistency. Small steps add up, the idea behind the Kaizen practice in [ITEMS](../../../architecture/ITEMS.md).
- **Tier:** T2.

## Open questions

1. Does a hopper count cubes that were already there, or only the cubes thrown in?
2. Is the quota per kind of material, or per tier?
3. Can a full hopper be emptied again, and does the door close?
