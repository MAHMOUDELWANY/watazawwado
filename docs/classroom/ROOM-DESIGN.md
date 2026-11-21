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
