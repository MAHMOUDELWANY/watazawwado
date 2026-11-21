# Zad motion plan (Rive)

Owner, 2026-11-21: Zad becomes a flat Rive character that moves the way Duolingo's mascot moves: alive, quick, light on
any phone, and present across the site. The animals (camel, fennec, hoopoe) stay 3D. This file says what makes that
motion feel alive, where the current Rive Zad falls short, and the order of work.

Source: `rive/zad` (build with `rive/zad/tools/build.sh`). Test page: `/prototype/zad-rive`.
References: `docs/design/inspiration/zaadi-mascot/` (three motion clips + frame sheets) and the owner's Duolingo
motion-graphics clip. **Inspire, not copy**: our shape (the khatam), our palette (crimson, gold, teal; no green).

## What the references do (frame by frame)

| Reference | What moves | Why it reads as alive |
|---|---|---|
| Shy happy bounce | Whole body squashes on landing and stretches going up; feet kick one after the other; hands stay on the cheeks; the body leans side to side on every hop | Squash and stretch, two feet out of step, a steady rhythm |
| Idle look-around and turn | Blink, eyes slide left then right, the body leans toward where it looks, a fast turn shows the side, wings flare on a surprised beat, mouth opens | The look leads and the body follows; one surprise beat breaks the loop |
| Surprise jump-out | Jumps out of a shell: crouch, launch with a big stretch, hang, wings flutter fast, hands to the face | Anticipation before the jump, hold at the top, fast secondary motion |
| Duolingo clip | Logo and screens arrive with overshoot and glow trails; numbers count up; elements enter one after another | Overshoot easing, staggered entrances |

## What the current Rive Zad lacks

The 16 poses work, but each moves as one rigid board: whole-body rotation and lift, wings swinging on one pivot.

1. **No squash and stretch.** The body never squashes on landing or stretches on a jump.
2. **No anticipation.** Jumps start without a crouch.
3. **No follow-through.** Wings and feet move in the same frame as the body; nothing trails or settles.
4. **Easing is the same everywhere** (one ease-in-out). No overshoot, no snap, no spring.
5. **The face never turns.** Eyes slide, but the face, mouth and blush stay put, so he never looks to the side.
6. **Feet are glued together** and never kick one at a time.
7. **No dance**, and no entrance or exit.
8. **On the site he only loops a pose.** He doesn't react to what the user does.

## Plan, in order

### 1. Motion rules in the generator (no new art)
Shared helpers in `rive/zad/tools/add_motion.py` that every pose uses:
- **Squash and stretch** on the Body (scaleX up when scaleY goes down, volume kept): crouch 0.86 / 1.1, launch 1.12 / 0.9, land 0.9 / 1.08 then settle.
- **Anticipation**: every jump starts with a 4–6 frame crouch.
- **Follow-through**: wings and feet keyed 3–5 frames after the body, with one small overshoot before they settle.
- **Easing per move**: `elastic` for landings and pops, a fast ease-out for snaps, slow in-out only for breathing.
- **Feet split** into FootL and FootR so they kick out of step.

### 2. A turning face
Rive can fake a head turn from a front drawing (docs: rigging, "A head turn from a front drawing"): the face disc, eyes,
mouth and blush slide toward the side the eyes look; the far eye narrows; the body narrows a little (scaleX) and leans.
Used in idle look-around, peek, think and shy.

### 3. Bones for the wings and the body (Rive skinning)
Wings get a short bone chain so the feathers fan and flap instead of swinging as one piece; the body gets a soft bend for
leans and bounces. This needs mesh work on the art; done after steps 1–2 prove the feel.

### 4. Dances
Three short loops in our tone (no music required, beat-led): a happy two-step (weight shift foot to foot), a wing-flap
hop, and a little spin-and-pose. Used on big wins (lesson finished, streak, badge).

### 5. Zad on the site
- **Entrance**: pops in with overshoot; **exit**: hops out.
- **Reacts**: `correct`, `wrong` (gentle, never mocking), `tap` (giggle), `idle-long` (sleepy), with a short one-shot then
  back to idle. Implemented as triggers on the state machine next to the `pose` number.
- **Random idle variants** (blink, look around, stretch) so a long view never repeats exactly.
- **One Rive runtime for the page**, drawing only while on screen; reduced motion = a still pose.
- Placement follows Duolingo's habit: Zad sits beside the thing he talks about (a card edge, the lesson result, empty
  states), not floating in the middle.

### 6. Replace the 3D Zad sitewide
Swap `ZadRig` to the Rive Zad once the owner signs off on steps 1–2 on his phone. The 3D Zad stays for the intro film.

## Checks for every step
- Render the pose frames headless (`rive . --commands`) and look at them before shipping.
- Test page on the owner's phone: frame rate and how it feels.
- File size stays small (now 42 KB for 16 poses).
