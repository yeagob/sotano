# Folding Tincture

Up: [recipes](README.md) · built (#262). Name and numbers are proposals the owner has not confirmed; the open questions are in [potions: open questions](../../../not-built/practices/potions/OPEN-QUESTIONS.md#built-recipes).

Three sealed rooms of Child's Pose's crouch, without holding the practice. The name refers to folding in, as the pose does.

- **Path:** body.
- **Bulb:** one mind of a body pattern and one dirt block, in any order.
- **Effect:** the `crouch` stat +1, the same switch Child's Pose gives: holding the crouch control makes the body one block shorter (1.8 to 0.8 blocks, the eye from 1.62 to 0.62), moves at 45 % of the walk, never walks off a ledge and takes half the contact damage of projections ([run and crouch](../../practices/RUN-AND-CROUCH.md)). Not holding it changes nothing.
- **Control:** hold C or Control; R3 on a gamepad toggles it; on touch, a swipe down from the bottom twelfth of the right side toggles it.
- **Duration:** 3 sealed rooms (4 with ice), and at the latest the next floor entry. When it ends under a low ceiling, the body stands up only once there is room, as the crouch already does.
- **With Child's Pose:** nothing more. The stat is a switch (`crouch` is limited to 0 to 1).
- **Why it is easy:** a body mind (about 12 % of releases) and a block of dirt, the commonest block there is. The dirt keeps it apart from the Stride Tonic, which is the same mind alone.

Code: `src/content/potions.ts` (the effect) and `src/content/recipes.ts` (the bulb). Tests: `tests/stride-folding.test.ts`, `tests/recipes.test.ts`, `tests/potion-effects.test.ts`.
