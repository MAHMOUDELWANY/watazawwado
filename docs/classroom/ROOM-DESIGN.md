# Room design (owner-approved 2026-11-21)

The owner approved the interactive design canvas (claude.ai artifact "Classroom room looks", version 25) after
comparing 12 call apps on Mobbin (Discord, Meet, Slack, Skype, Teams, Whereby, Beside, inDrive, Quo, Descript,
WhatsApp, iOS 26).

Binding for the room UI:

- **Glass:** `.room-glass` (src/index.css): clear warm glass, specular top edge, blur 34px saturate 190%. Used by the
  control bar and every room sheet.
- **More menu** (`src/classroom/parts/MoreMenu.tsx`): a short main page, then pushed pages with a Back button:
  Devices (mic, speaker, camera with a gold check; switches mid-lesson), "Let's fix it" (each problem has a button that
  fixes it; the teacher's "Problem on our side? Continue on Zoom"), Keyboard shortcuts (teacher, desktop).
- **Rows:** iOS grouped lists. Tinted icon square (teal, copper, gold, brick, sand, espresso; never green), a title,
  one line under it, then a value, switch or chevron.
- **Learner:** raise hand on the bar; the other four teaching signals are one-tap circles at the top of More. Text size
  and page colour moved into More (children keep their big buttons and have no More).
- **Phone:** More is a floating bottom sheet (inset 8px, 2.6rem corners) with the bar's own controls at its top.
- **Not taken:** emoji and hearts, recording, a 9-icon grid, other apps' colours.

## Waiting room (owner-approved 2026-11-21, canvas version 28)

The owner picked look 1 ("the door") and asked for the site's own identity, not the room's night look:

- Paper by day, espresso by night (follows the site theme), `.khatam-field` + `.brand-lights` behind.
- Your camera sits in the homepage door: a `glass-2` arch frame (`.wait-door`) holding the crimson portal
  (`.wait-portal`, `#A3201F -> #4E2219`). With no picture the portal shows the khatam window and a breathing gold light.
- Title in `.text-ribbon`; "Waiting room" kicker in copper with a small gold khatam.
- A glass card of grouped readiness rows (`.wait-rows`, `.wait-tint`): camera teal, mic copper, speaker gold-deep,
  internet sand-dark; crimson tint only for a problem. Rows push Devices or the permission steps, each with Back.
- One crimson action: Join (`Button` primary). Problem pills use the light crimson tint, Try again is secondary.

