# Curriculum preview and capture tools

Used by the `curriculum-builder` skill to see every step of every slide before the owner does.

1. **Start the preview server** (Vite on port 3101): `preview_start` with the `curriculum-preview` entry in
   `.claude/launch.json` (in a worktree without `node_modules`, it runs the main checkout's Vite).
2. **Open one slide**: `http://localhost:3101/scripts/curriculum/preview/slide.html?subject=zad-adults&lesson=1&p=4&s=3`
   (`p` = page index from 0, `s` = build step; `&end` shows the end-of-lesson screen, `&ar` in Arabic; `&demo&gap=3800`
   steps forward on its own; `&player` loads the whole lesson in the real `LessonPlayer`, to test what the owner sees on
   opening a lesson: first-page motion, clicks, the toolbar).
3. **Screenshot every step** (headless Chrome, page clock under our control, 6 s of animation per shot):
   `node scripts/curriculum/shots.mjs <outDir> "subject=zad-adults&lesson=1&p=4&s=1" "…&s=2" …`
4. **Contact sheet** of a page's steps: `python scripts/curriculum/sheet.py sheet.png 3 <outDir>/*.png`, then read the
   image and check it against the bug list in the skill.
5. **Video for the owner**: `node scripts/curriculum/cast.mjs "subject=zad-adults&lesson=1&p=4&demo&gap=3800" 33 out/p4`,
   then `ffmpeg -framerate 30 -i out/p4/f%05d.jpg -vf "scale=1280:-2,format=yuv420p" -c:v libx264 -crf 20 p4.mp4`,
   join pages with ffmpeg concat, send with `SendUserFile`.

Notes (learned the hard way):
- Chrome's `--virtual-time-budget` and CDP virtual time stall on these pages; `clock.js` replaces the page's clock
  (`performance.now`, `Date`, rAF, timers) and the scripts step it. Anything that waits on a real timer inside the page
  will wait for ever: step the clock, never `setTimeout` inside an evaluated promise.
- The manual clock can leave a keyed remount's entrance or an `AnimatePresence mode="wait"` exit unfinished. If a state
  looks blank in a shot, check it in real time before "fixing" it (run the steps with real `sleep`s).
- The in-app browser pane pauses animation while it is hidden: use it for clicks and console errors, not for motion.
- Never kill every `chrome.exe`: stop only processes whose command line has `--headless` or the tool's profile folder.
- Do not run `npm install` inside a worktree; use the main checkout's `node_modules` (`../../../node_modules/.bin`).
