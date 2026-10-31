Up: [Projections](README.md)

# Alarm

Status: built.

## What it is

The second form of the alarm: "Everyone, something is wrong!" It rushes at you and warns the others around it.

## Where it appears

Floors 3 to 6. Code: [alarm.ts](../../../../src/content/enemies/alarm.ts). It is the second form of [Panic](PANIC.md).

## How it moves and attacks

- It rushes at you, fast.
- Within 2.2 blocks it swells over 0.9 seconds, in three steps, and then bursts with a radius of 2.2 blocks.
- Within four blocks of another Alarm or Panic it sets that one swelling after 0.4 seconds. The bursts chain through nearby kin, and each swell is readable on its own.
- It does no touch damage.

## How the player answers it

Learn the swell: a burst is announced three steps ahead. Stay out of the burst radius. Good intentions do half damage and warm it; bad intentions do full damage.

## Element affinities

- **Water:** calms it for 2.5 seconds, mid-swell included. It crosses water.
- **Fire and lava:** it swells at once (0.3 seconds) and keeps out of them.

## Status

Built. Whether a calm in water stops the chain is an open question ([OPEN-QUESTIONS](../../not-built/projections/OPEN-QUESTIONS.md)).
