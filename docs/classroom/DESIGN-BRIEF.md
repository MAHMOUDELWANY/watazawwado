# Lesson room: design brief

Research and direction for every surface of the classroom (2026-11-18). The room and waiting room are built (see
"Built" at the end); the dashboard surfaces (4.6, 4.7) and the admin notes panel are separate tasks. Binding rules
still come from `RULES.md`, `docs/design-system.md` and the classroom spec
(`docs/superpowers/specs/2026-11-17-classroom-design.md`). References are filed in `docs/design/INSPIRATION.md`
under "Lesson room". We take principles from them, never their look or their colours.

## 1. The idea in one line

**A lit page in a quiet room.** When you join, the lights dim to warm espresso and the two people face each other
through an arch. The lesson page (slides, board, mushaf, PDF) is the one bright, paper-coloured thing on the stage.
Controls float on glass at the edge and stay out of the way. Nothing moves unless a person did something.

Three tests for every decision:

1. **Effortless for a 7-year-old on a parent's phone.** One obvious thing to press, words under every icon, nothing
   hidden behind hover.
2. **Calm for the teacher on a laptop for six lessons in a row.** Facts at a glance (time, line, who is watching),
   no pop-ups over the learner's face, every tool one key or one click away.
3. **Invisible for the observer.** The guardian and the super admin watch without changing the lesson. The super
   admin works (notes, moments) in a panel that never leaks into the room.

Anti-goals from the spec, restated as design rules: never look like a generic call app (no grid of grey tiles,
no default red hang-up circle), never feel like surveillance (no blinking "recording"-style badges, no "away"
counters shown to the child), never a lesson lost to a dead end (every error has a next step).

## 2. What exists today (code read 2026-11-18)

| Part | File | State |
|---|---|---|
| Room shell | `ClassroomPage.tsx` `Shell` | Full-window paper with `.khatam-field brand-lights`, same in both phases |
| Waiting room | `WaitingRoom.tsx` | Opaque `Card`, 16:9 preview, mic meter, device selects always shown, 720p notice, headset tip + recitation switch (teacher), one Join |
| Top bar | `ClassroomPage.tsx` header | Title ("Your lesson" / learner name), guardian chip (teacher), observer chips, network badge, `Timer` |
| Notices | `ClassroomPage.tsx` | Up to six at once, stacked under the top bar: fallback, reconnecting, weak link, talking-while-muted, teacher focus, learner welcome-back |
| Tiles | `parts/VideoTiles.tsx` | Dark `#1C1411` tile, teal outline when speaking, arch-tile initial when no video, caption pill with `backdrop-blur-sm` over the video |
| Layouts | `ClassroomPage.tsx` | Conversation (remote fills, self PiP bottom-end), Content (tiles in a side column on desktop, a row above on phones), Screen |
| Control bar | `parts/Toolbar.tsx` | `glass-3` pill: mic, camera, recitation (teacher), layout switch + share (teacher), reactions (learner), crimson Leave/End at the end. `overflow-x-auto` |
| Timer | `parts/Timer.tsx` | Teacher: always on, sand tint in the last 5 minutes. Learner: clock button, closed by default |
| Focus | `parts/FocusNotice.tsx` | Teacher: "Not on the lesson screen · 0:42" + "stop warning". Learner: "Welcome back" for 6 s |
| Reactions | `parts/Reactions.tsx` | Learner: menu of five. Teacher: stream bottom-start of the stage, 8 s each |
| Observer notes | `parts/ObserverNotes.tsx` | Super admin: button bottom-start, panel with textarea, manual Save |
| Fallback | `parts/FallbackNotice.tsx` | Banner in the room, block on the failure screen, "Continue on Zoom" |
| Over screens | `ClassroomPage.tsx` | `glass-2 arch-top` card: ended, closed, superseded, failed |
| Late gate | `dashboard/components/LateReasonGate.tsx` | Un-closable `Modal`, textarea (10–2000 chars), Send |
| Late reasons | `dashboard/pages/LateReasonsPage.tsx` | List of `Card`s with note, amount, Deduct (outline) and Excuse (primary) |
| Connection | `dashboard/components/TeacherConnection.tsx` | `Modal` with month input and a table per lesson |

Good bones: the role slots in the toolbar, logical properties everywhere, the teal/gold/crimson network colours
with words, the reduced-motion path in reactions and the meter, the "talking while muted" hint, the tap-to-hear
fallback for iPhone. Most of this brief is about hierarchy, the stage, phones and the observer, not a rewrite.

## 3. Shared foundations for the room

### 3.1 Stage and materials

| Layer | What | Token / class |
|---|---|---|
| Stage | Warm espresso in **both** themes, with a faint `.khatam-window` pattern at 6–8% and one soft gold light from the top (like `.door-glow`, very low) | new `.room-stage`: `--surface` dark values (#1B1816 → #110F0E gradient) |
| People | Video tiles, opaque. The remote person's main tile carries the arch | `.arch-top` radius on the tile, `--r-3` elsewhere |
| Lesson page | Paper `--surface` (light) or `#24201D` (dark), opaque, `--r-3`, `--shadow-3`. The brightest thing on screen | `ui/Card`-like, not glass |
| Controls | Floating `glass-3` bar and `glass-1` chips over the stage | existing classes |
| Notices | One `glass-3` capsule at a time (see 3.4) | existing |

Why espresso for the stage: faces read best on a dark, warm ground; a bright paper room around video causes glare
and makes the lesson page compete with the frame. Apple's HIG says the same thing for media: controls on glass float
above the content, and the content (here, faces and the lesson page) stays the hero
([HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)). The waiting room and the
over screens stay on paper (`.khatam-field brand-lights`), so entering the room is a felt change of place.

Rules:
- Glass only for controls and notices, never on a tile and never behind lesson text (HIG: no Liquid Glass in the
  content layer). At most 4 blurred surfaces at once in the room (bar, top capsule, one notice, one open menu).
- **No `backdrop-filter` on top of live video.** Captions and badges on a tile use an espresso scrim at 60%
  (`rgba(17,15,14,.6)`), which HIG's dimming guidance allows and which costs nothing per frame. Today's caption uses
  `backdrop-blur-sm` over moving video, which repaints every frame on every tile.
- `prefers-reduced-transparency` turns glass opaque (built into the classes already).

### 3.2 Identity in the room

- **Arch (mihrab):** only on the person you face. The learner sees the teacher in an arch; the teacher sees the
  learner in an arch. The self tile and the lesson page never get one. Observers see both people in two equal arches.
  The waiting-room preview is an arch too ("you stand at the door").
- **Khatam:** the connecting loader (the gold star that breathes, as in the design system's loader rule), the seal
  on the end-of-lesson card, and the stage pattern. Nowhere else, so it stays special.
- **Gold:** light, not ink. The speaking glow is a soft gold inner light along the arch (replaces the teal outline,
  because teal already means focus and selection in our system).
- **Crimson:** one thing per view. In the room that is Leave / End lesson. Mic-off stays visible but moves to a
  copper-on-sand treatment with a slash glyph and the word "Muted", so the bar does not hold two crimson things.
  (Today a muted mic and the End button are both crimson.)
- **Type:** Thmanyah Sans for every control and notice. `font-editorial` only for full-screen titles (waiting room
  heading, over screens). Amiri Quran only inside curriculum and mushaf content.
- **Zad:** in the child's waiting room and the child's end card, never during the lesson.

### 3.3 Control placement

Order from the start edge: **mic, camera, (role tools), more, gap, leave**. Mic and camera never move between roles,
so muscle memory works for everyone. Leave sits alone at the end edge, after a hairline divider. In Arabic the whole
bar mirrors (mic on the right, Leave on the left); the order in reading terms stays the same.

- Desktop: bar centred at the bottom, 12–16px above the edge, max 640px wide, 48px buttons.
- Phone: bar full width minus 12px gutters, inside the bottom safe area, in the easy thumb zone. Hoober's field
  studies found people move what they want to the middle of the screen and reach the bottom-middle most easily
  ([UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php),
  [Smashing](https://smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/)). No horizontal scroll in the
  bar ever: tools that do not fit go into **More** (a bottom sheet), the way Zoom 6.7 trimmed its toolbar to the
  essentials and moved the rest into More ([Zoom](https://www.zoom.com/en/blog/zoom-workplace-simplicity-ui-updates/)).
- Child mode (`portal === 'kid'`, or `learner_type = 'child'` once the enter response carries it): 56px buttons,
  a 0.78rem label under each icon, at most four items (mic, camera, "I need…", leave). Nothing hover-only.
- Controls never auto-hide for learners and observers. Teachers on desktop: the bar stays; only the top capsule
  dims to 60% after 4 s without pointer movement (back on move). Kids lose track of hidden controls; adults on a
  phone mostly do too.

### 3.4 One notice at a time

Today up to six notices can stack over the stage. Replace them with one notice slot under the top capsule that shows
the highest-priority live notice, and a small "+1" when another is waiting (tap to cycle):

| Priority | Notice | Who | Leaves when |
|---|---|---|---|
| 1 | Continue on Zoom (fallback) | teacher, learner | never, until they leave |
| 2 | Tap to hear (audio blocked) | anyone | after the tap |
| 3 | Reconnecting… | everyone | reconnected (then "Back" for 2 s) |
| 4 | You're talking while muted | teacher, learner | unmute or 4 s of quiet |
| 5 | Weak line (yours / theirs) | teacher, learner | line good for 10 s |
| 6 | Not on the lesson screen · 0:42 | teacher | learner back, or "stop warning" |
| 7 | Welcome back, your teacher is waiting | learner (not child observer) | 6 s |
| 8 | Raised hand (sticky reaction, see 3.6) | teacher | teacher taps "Seen" |

Notices never cover a face: on desktop the slot sits over the top margin of the stage; on phones it sits above the
control bar, inside the thumb zone, where Meet and FaceTime put transient messages.

### 3.5 Timer, network, guardian chip

- **Top capsule** (one `glass-1` capsule at the top start, replaces the loose chips): who you are with, then the
  network dot, then the clock. On phones it is one line: "Ustadha Afnan · ● · 23:10". Teacher name and subject come
  from the enter response (today the learner just sees "Your lesson"; the server would add `teacherName`,
  `subjectLabel`, `learnerType` to `RoomEntry`).
- **Timer, teacher:** remaining time in the capsule, tabular figures, with a thin gold arc under it that fills as the
  lesson goes. Last 5 minutes: the arc and text turn copper on sand, announced once politely. Over time: "+2:10" in
  copper, never crimson (being over is not an error).
- **Timer, learner:** closed by default as today. Child mode shows no numbers at all, only a small lantern that
  fills; tap shows "About 10 minutes left". Adults keep the clock button.
- **Network:** a dot plus a word only when it is not good (today's rule, kept). The dot sits in the capsule for your
  own line and on the tile caption for the other side. Detail on tap/hover: "Your video is lower to keep the sound
  clear." Never numbers to learners.
- **Guardian chip (teacher only):** in the capsule, a small shield in teal plus "Guardian watching". Appears with a
  220 ms fade, no bounce. The learner and the child phone never see it (spec §4).
- **Admin observer:** never visible to anyone in the lesson. In the admin's own capsule: "Watching quietly · not
  visible to the teacher or learner".

### 3.6 Reactions

- Learner (adult): the five reactions as a small sheet from the bar, labelled, as today.
- Learner (child): "I need…" opens a 2×3 grid of large picture tiles (Raise my hand, Say it again, Slower, I don't
  understand, I'm thinking) with Zad-style flat icons, 72px each, words under each. Duolingo's lesson: few colours,
  exaggerated simple shapes and humour lower the fear of getting it wrong
  ([Duolingo shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/)).
- Teacher: a reaction lands **on the learner's tile** (a chip on the arch's lower edge), not in the stage corner, so
  the eye never leaves the face. "Raised a hand" stays until the teacher taps "Seen" (one tap on the chip). The rest
  fade after 8 s as today.
- No emoji floods, no confetti during the lesson. Celebration belongs to the end card.

### 3.7 Motion

| Moment | Motion | Reduced motion |
|---|---|---|
| Enter the room (the one orchestrated moment) | Paper fades to espresso over `--dur-scene` (700 ms); the remote arch rises 12px and fades in; the bar slides up 8px | Cross-fade 150 ms |
| Speaking | Gold inner glow fades in 120 ms, holds 400 ms after the voice stops (today's hold), fades out 220 ms | Same, it is a state, not movement |
| Layout change (conversation ↔ content) | Shared-element move of the tiles (motion `layout`), 420 ms `--ease-out-soft`; the lesson page fades in behind | Instant swap + 150 ms fade |
| Notice in/out | 12px from the edge it lives on, spring with no bounce, 280 ms | Fade |
| Reaction chip | Fades up 8px onto the tile | Fade |
| Reconnecting | Video freezes on the last frame under a 40% espresso dim; the khatam breathes in the notice | Static star |
| Press | `scale(.97)` 120 ms | None |

Never: anything looping in the stage while people are talking (the khatam breath only lives in a "waiting" or
"connecting" state), no animation of a blurred element's size, no blur filters on entering text over video.

### 3.8 Accessibility and RTL

- Every control: 44×44 minimum (56 in child mode), visible teal focus ring, label in the accessible name, keyboard
  shortcut in `aria-keyshortcuts`.
- **Shortcuts must use `event.code` (`KeyM`, `Digit1`–`Digit3`), not `event.key`.** On an Arabic keyboard layout
  the M key types "ة", so today's `e.key === 'm'` never fires for an Arabic teacher.
- Live regions: one `role="status"` for the notice slot (polite), `role="alert"` only for the fallback and for
  "can't open camera/mic". The timer is announced once at 5 minutes and once at the end, never per second.
- Numbers inside Arabic strings (timer, "0:42", "720p") sit in a `dir="ltr"` / `unicode-bidi: isolate` span.
- Mirror only your own camera preview. Remote video, screen share, slides, the board and the pointer are never
  mirrored in RTL.
- Colour never alone: network uses a word when not good; mic off uses a slash glyph and "Muted".
- Captions on tiles: 0.78rem minimum on the 60% scrim, AA on any video.
- Tap-to-hear and every error screen are reachable by keyboard and read by a screen reader in one pass.

## 4. Surfaces

Wireframes are drawn left to right for English. Arabic mirrors the chrome; video and lesson content do not mirror.

### 4.1 Waiting room (pre-join), all roles

**References**

| Reference | Take |
|---|---|
| Google Meet join screen and its 2025 Material 3 Expressive pass ([9to5Google](https://9to5google.com/2025/06/21/google-meet-material-3-expressive/), [Workspace update](https://workspaceupdates.googleblog.com/2024/06/updated-design-for-meeting-controls-google-meet.html)) | A big self preview, mic and camera toggles **on the preview**, shapes and colours that change with state, one big Join. |
| Riverside lobby ([what changed in the studio](https://support.riverside.com/hc/en-us/articles/36653757939485-What-s-changed-in-the-studio)) | Larger preview, devices picked automatically, a manual test only if you want it; a level meter that reads as "good / loud / too loud". |
| Whereby pre-call test ([announcement](https://whereby.launchnotes.io/announcements/ann_Ig1E3Ej4Jpln5)) | Fix problems **before** the call, with a "help me fix this" path. |
| Preply classroom ([tutor guide](https://help.preply.com/en/articles/4182374-preply-classroom-features-for-tutors-a-complete-guide)) | Before joining you see **whether the other person is already in**. |
| italki classroom ([page](https://www.italki.com/en/italki-classroom)) | One setup screen for camera, mic and speaker; no download; same layout across phone and desktop. |

**Hierarchy:** 1. you, in the arch (are you visible, lit, heard?) 2. who the lesson is with and when 3. Join
4. device details only if something is wrong or you ask.

**Desktop (≥1024px)**

```
 paper, khatam field, brand lights
 ┌──────────────────────────────────────────────────────────────────────┐
 │                                                                      │
 │      ╭────────────────────╮        Quran with Ustadha Afnan          │
 │     ╱                      ╲       Today 17:00 · starts in 2 min     │
 │    │    your camera,        │      ● Your teacher is here            │
 │    │    in an arch          │                                        │
 │    │                        │      ✓ Camera ready   ✓ Sound ready    │
 │    │  [🎤] [📷]  on the     │      (headset tip + Recitation mode,   │
 │    │  preview, bottom       │       teacher only)                    │
 │    └────────────────────────┘                                        │
 │    ▁▂▃▅▃▂▁  mic level       │      [        Join the lesson        ]  │
 │                                    Change camera, mic or speaker  ›  │
 └──────────────────────────────────────────────────────────────────────┘
```

**Phone (375px)**

```
 ┌───────────────────────────┐
 │ Quran · Ustadha Afnan     │
 │ starts in 2 min           │
 │ ● Your teacher is here    │
 │  ╭───────────────────╮    │
 │ ╱                     ╲   │  preview ~55% of height, arch top
 │ │   your camera        │  │
 │ │                      │  │
 │ │   [🎤]   [📷]        │  │  toggles on the preview, 48px
 │ └──────────────────────┘  │
 │ ▁▂▃▅▃▂▁ Say salam, the     │
 │          bar should move   │
 │ ✓ Camera  ✓ Sound          │
 │ Change devices ›           │
 │ ┌───────────────────────┐ │  sticky, thumb zone
 │ │    Join the lesson    │ │
 │ └───────────────────────┘ │
 └───────────────────────────┘
```

Details:
- **Presence before joining:** the room channel is already connected in the waiting phase (`useLessonRoom` runs in
  `ClassroomPage` before `phase === 'room'`), and the other side's `session` announce arrives every 15 s. Show
  "Your teacher is here" / "Yusuf is here" from it. No server change.
- **Device pickers** go behind "Change camera, mic or speaker" (a disclosure) when both checks pass. They open by
  themselves when there is a problem.
- **Camera quality** in plain words: "Your camera looks a bit blurry. Sitting facing a window helps." instead of
  "sending 480p". The 720p record is still sent to `/precheck`.
- **Speaker test** stays ("Play a test sound"), as a quiet text button.
- **Teacher:** headset tip and the recitation switch sit together in a sand panel under the checks. The heading uses
  the learner's name and subject.
- **Child:** Zad stands beside the arch and waves once (no loop), the copy is to the child: "Ready? Your teacher can
  see you when you join." Join is 56px tall. The device disclosure is hidden; a "Need help?" link opens the same
  tips for the parent.
- **Observers:** no preview. A paper arch card: "You'll watch quietly. Your camera and mic stay off." plus, for the
  guardian, "The teacher sees that a guardian is watching. Your child doesn't." and, for the admin, "Nobody in the
  lesson can see you." One Join.

**States**

| State | Shows | Next step |
|---|---|---|
| Opening camera (<300 ms) | nothing | |
| Opening camera (>300 ms) | Arch with a breathing khatam and "Opening your camera…" | |
| Permission denied | Arch with the browser's own lock icon drawn in, two short steps for the detected browser (Chrome, Safari, Edge), **Try again** that re-asks (no reload), and "Join with sound only" if the mic was allowed | Try again / join anyway |
| No camera / camera busy | Arch with your initial (as in the room), "We can't find a camera, or another app is using it. You can join with your voice." | Join with voice |
| No devices at all | "This device can't open a camera or mic. Try another browser, or join to listen." | Join to listen |
| In-app browser (Instagram, WhatsApp) | "Open this page in Safari/Chrome to use your camera", with a copy-link button (same detection as the install guide) | Copy link |
| Too early / room closed | Handled by the gate today; same arch card style | |

### 4.2 The room, learner (adult and child, phone and desktop)

**References**

| Reference | Take |
|---|---|
| FaceTime on iPhone and Mac ([Apple: reactions on Mac](https://support.apple.com/guide/facetime/fctm7d415422/mac)) | The other person fills the screen; your own tile is small and can be dragged to any corner; few controls. |
| Google Meet mobile 2025 ([9to5Google](https://9to5google.com/2025/02/20/google-meet-controls-redesign)) | Reactions are one tap from the floating bar; the rest moves to an overflow menu on phones. |
| Cambly Kids ([tutoring on Cambly Kids](https://support.cambly.com/hc/en-us/articles/4413976520973-Part-5-Tutoring-on-Cambly-Kids), [how we teach](https://cambly.com/kids/how-we-teach)) | One tutor, one child, a shared lesson screen beside the faces; a parent within earshot; children may keep their camera off. |
| Self-view fatigue research ([Springer, 2024](https://link.springer.com/article/10.1007/s12599-024-00874-7), [Stanford via New Atlas](https://newatlas.com/telecommunications/zoom-fatigue-video-exhaustion-tips-help-stanford)) | Seeing yourself all the time adds strain. Keep the self tile small and let people hide it. |
| Duolingo illustration ([guidelines](https://design.duolingo.com/illustration)) | For kids: few colours, big simple shapes, words that are warm and short. |

**Hierarchy:** 1. the teacher's face (conversation) or the lesson page (content) 2. mic state 3. the "I need…"
button 4. everything else.

**Phone, conversation (375 × 812)**

```
 ┌───────────────────────────┐
 │ (Ustadha Afnan · ● · 🕒) │  top capsule, glass-1
 │  ╭─────────────────────╮  │
 │ ╱                       ╲ │
 │ │                        ││  teacher in an arch, object-contain
 │ │   teacher video        ││  on espresso (no crop of a held mushaf);
 │ │                        ││  double-tap = fill
 │ │                ┌────┐  ││
 │ │                │you │  ││  self PiP 96×128, drag to any corner
 │ └────────────────└────┘──┘│
 │   ( notice slot )          │  one notice, above the bar
 │ ┌───────────────────────┐ │
 │ │ 🎤  📷  ✋I need…  │ ⎋ │ │  glass-3, thumb zone, labels in child mode
 │ └───────────────────────┘ │
 └───────────────────────────┘
```

**Phone, content (teacher switched to the lesson page)**

```
 ┌───────────────────────────┐
 │ (Ustadha Afnan · ● · 🕒) │
 │ ┌───────────────────────┐ │
 │ │                       │ │  lesson page: paper, as tall as possible
 │ │  slide / board / PDF  │ │  pinch-zoom for PDF and mushaf
 │ │                       │ │
 │ │                ╭───╮  │ │  teacher as a small arch PiP (88×112)
 │ │                │ T │  │ │  over the page's end-bottom corner,
 │ └────────────────╰───╯──┘ │  drag to another corner; tap = swap
 │ ┌───────────────────────┐ │
 │ │ 🎤  📷  ✋I need…  │ ⎋ │ │
 │ └───────────────────────┘ │
 └───────────────────────────┘
```

Landscape phone: the page takes the full height, the teacher's arch sits at the end edge, the bar becomes a vertical
pill on the end edge (thumb reach in landscape is the sides).

**Desktop, content**

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ (Quran · Ustadha Afnan · ●)                                    (🕒)      │
 │ ┌──────────────────────────────────────────────────┐  ╭──────────────╮   │
 │ │                                                  │ ╱   teacher     ╲  │
 │ │            lesson page (paper)                   │ │    (arch)      │ │
 │ │                                                  │ └────────────────┘ │
 │ │                                                  │  ┌──────────────┐  │
 │ │                                                  │  │ you (small)  │  │
 │ └──────────────────────────────────────────────────┘  └──────────────┘  │
 │                ( 🎤  📷  ✋ Reactions  ⋯ │  Leave )                       │
 └──────────────────────────────────────────────────────────────────────────┘
```

Details:
- **Remote video fit:** on a portrait phone the remote tile uses `object-contain` on the espresso stage, so a mushaf
  or board the teacher holds up is not cropped. Today `object-cover` crops a 16:9 teacher into a portrait box.
  Double-tap toggles fill.
- **Self tile:** draggable, snaps to the four corners (FaceTime). "Hide my picture" in More (the other side still
  sees you). Child mode keeps it visible: children like seeing themselves, and the parent can check framing.
- **Child mode:** only four controls with labels, the "I need…" grid, no clock numbers, the welcome-back notice is
  softer ("Welcome back!"), and the end card has Zad and a short well-done. Copy speaks to the child.
- **Tap to hear:** keeps its big, centred button (it blocks the lesson, so it may be the one loud thing), but drawn
  as an arch with the teacher's initial and "Tap to hear your teacher". It is notice priority 2.

### 4.3 The room, teacher (laptop)

**References**

| Reference | Take |
|---|---|
| Zoom Workplace 6.7 ([Zoom blog](https://www.zoom.com/en/blog/zoom-workplace-simplicity-ui-updates/), [U-M notes](https://its.umich.edu/communication/videoconferencing/zoom/update/changes-zoom-desktop-app-interface-vers-670)) | Few tools in the bar, the rest in More, pinnable; settings in a side panel instead of a pop-up over the content. |
| tldraw collaboration ([docs](https://tldraw.dev/docs/collaboration), [laser pointer release](https://tldraw.dev/blog/release-notes-20230526)) | Live cursor with a name tag, a laser that fades, "follow my view". Our pointer already follows this; keep the name tag in the teacher's colour and the fade. |
| Preply classroom ([tutor guide](https://help.preply.com/en/articles/4182374-preply-classroom-features-for-tutors-a-complete-guide)) | Lesson notes written during the lesson feed the next lesson. Our report is written after; a "note for the report" field during the lesson is a later idea. |
| italki classroom ([page](https://www.italki.com/en/italki-classroom)) | Materials, board and chat in one room so the teacher never leaves it. |
| Around ([TechCrunch](https://techcrunch.com/2020/03/18/around-video-calling/)) | Faces small and framed so the work gets the space. Content first when teaching. |

**Hierarchy:** 1. the learner's face (always visible, even in content) 2. what the learner sees (the page) 3. time
left 4. who is watching, line quality 5. tools.

**Desktop, content (1440 × 900)**

```
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ (Yusuf · Quran · ● good)  (🛡 Guardian watching)          (23:10 left ▔▔▔▔▁▁) │
 │ [Lesson][Board][File]                                  ╭───────────────╮      │
 │ ┌─────────────────────────────────────────────────┐   ╱   Yusuf (arch)  ╲     │
 │ │                                                 │   │  ✋ Raised hand  │     │
 │ │       lesson page (what Yusuf sees)             │   └─────────────────┘     │
 │ │       pointer + laser                           │   ┌─────────────────┐     │
 │ │                                                 │   │ you (small)     │     │
 │ └─────────────────────────────────────────────────┘   └─────────────────┘     │
 │            ( notice slot: "Not on the lesson screen · 0:42  Stop warning" )   │
 │      ( 🎤 📷 〰Recitation │ ⧉ Conversation/Lesson/Screen │ ⇪ Share │ ⋯ │ End )   │
 └───────────────────────────────────────────────────────────────────────────────┘
```

Details:
- The learner tile is never smaller than 240px wide in content mode (today 256px column; keep). The arch sits on the
  learner, not on the teacher's own tile.
- The pane tabs (Lesson / Board / File) stay above the page, left aligned with it; "Add a PDF or picture" appears in
  the File pane's empty state as a drop zone (drag a file onto the page), not only as a link.
- **Layout switch** keeps keys 1–3 (via `event.code`). Screen share shows a thin teal frame around the stage and a
  "You're sharing · Stop" chip in the capsule; today it only says so in the content box.
- **End lesson** stays crimson and confirmed in a dialog (today's copy is good). Ending early (more than 5 minutes
  before the booked end) adds one line: "There are 12 minutes left."
- **More** holds: speaker test, device switch (side panel, Zoom-style, not a modal over the face), hide self view,
  keyboard shortcuts list.
- Phone or tablet teachers are out of scope (spec: teachers teach from a laptop), but the layout must not break:
  tablets get the desktop layout with the side column under 1024px moving to a PiP.

### 4.4 Guardian observer view

**References**

| Reference | Take |
|---|---|
| Riverside audience vs guest roles ([studio defaults](https://support.riverside.com/hc/en-us/articles/5599287381405)) | A watch-only role is a different link and a different screen, not a muted participant. |
| Outschool learner safety for parents ([help](https://support.outschool.com/en/articles/579976-learner-safety-and-privacy-for-parents)) | A cautionary reference: Outschool forbids parents watching from a second device. We allow it, so the view must make the rules plain: you can't be seen or heard, the teacher knows a guardian is there. |
| Cambly Kids ([tutoring](https://support.cambly.com/hc/en-us/articles/4413976520973-Part-5-Tutoring-on-Cambly-Kids)) | Lessons go best when the parent is near and calm. The view should reassure, not invite the parent to steer. |
| FaceTime / Meet viewing on a phone | Two faces, nothing to press but volume and leave. |

**Hierarchy:** 1. the child and the teacher together 2. the lesson page (what they are learning) 3. reassurance
("you're watching only") 4. Leave.

**Phone (most guardians watch on a phone)**

```
 ┌───────────────────────────┐
 │ (Watching · Yusuf's Quran │
 │  lesson · 🕒 23 min left) │
 │ ┌───────────┬───────────┐ │
 │ │ ╭───────╮ │ ╭───────╮ │ │  two equal arches, side by side
 │ │ │teacher│ │ │ Yusuf │ │ │  (stacked when the phone is tall
 │ │ └───────┘ │ └───────┘ │ │   and the page is collapsed)
 │ └───────────┴───────────┘ │
 │ ┌───────────────────────┐ │
 │ │ lesson page (read     │ │  same page the child sees
 │ │ only)                 │ │
 │ └───────────────────────┘ │
 │ Your camera and mic are   │
 │ off. Yusuf can't see that │
 │ you're here.              │
 │ ┌──────────────┬────────┐ │
 │ │ 🔊 volume     │ Leave │ │
 │ └──────────────┴────────┘ │
 └───────────────────────────┘
```

Desktop: the two arches on the start side, the page on the end side, same as the learner's content layout with the
child's tile added. The guardian never sees the focus warning, the network detail of the other side, or reactions
(spec: focus warning not shown to guardians). Leave is a quiet text button here (no crimson: leaving changes nothing
for the lesson).

### 4.5 Super admin observer view, with private notes

**References**

| Reference | Take |
|---|---|
| Zoom Contact Center supervisor monitoring ([Zoom library](https://library.zoom.com/business-services/zoom-contact-center/zoom-customer-experience/supervisor-experience/call-monitoring)) | Pick a live engagement from a list; Listen is one-way and silent; only one supervisor per engagement. Our "observe" is Zoom's Listen. Whisper and barge are not in our spec and stay out. |
| Dialpad call monitoring ([help](https://help.dialpad.com/docs/call-monitoring-features)) | Monitoring opens from the live list with the action right there; escalation is explicit, never accidental. |
| Honorlock session review ([blog](https://honorlock.com/blog/reviewing-proctored-exams/)) | Flags with times, a "recommended" filter for sessions that need attention, and a visit that is logged but is not itself a mark against anyone. |
| TAO multi-session monitoring ([docs](https://userguide.taotesting.com/user-documentation/latest/public/monitoring-multiple-sessions)) | A list of live sessions, open one or several, switch between them. Later: an "observe" list of live lessons on the admin dashboard. |

**Hierarchy:** 1. the lesson as it happens (both faces, the page) 2. the notes field (the admin's work) 3. live facts
(join times, lateness, line per side, focus-away count) 4. leave quietly.

**Desktop (admins mostly observe on a laptop)**

```
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ (Watching quietly · not visible to anyone in the lesson)       (🕒 23:10 left) │
 │ ┌────────────────────────────────────────────────┐ ┌────────────────────────┐ │
 │ │ ╭──────────╮  ╭──────────╮                     │ │ Private notes          │ │
 │ │ │ teacher  │  │ learner  │   two arches        │ │ ┌────────────────────┐ │ │
 │ │ └──────────┘  └──────────┘                     │ │ │ 12:04 Warm opening │ │ │
 │ │ ┌────────────────────────────────────────────┐ │ │ │ 18:30 Corrected    │ │ │
 │ │ │  lesson page (read only)                   │ │ │ │ madd gently…       │ │ │
 │ │ │                                            │ │ │ └────────────────────┘ │ │
 │ │ └────────────────────────────────────────────┘ │ │ [⏱ Mark this moment]   │ │
 │ └────────────────────────────────────────────────┘ │ Saved · 2 s ago        │ │
 │                                                    │ ─────────────────────  │ │
 │                                                    │ Teacher joined 16:58   │ │
 │                                                    │ Learner joined 17:01   │ │
 │                                                    │ Lines: T ● good L ● weak│ │
 │                                                    │ Away from screen: 1×   │ │
 │                                                    └────────────────────────┘ │
 │                         ( 🔊 volume │ Leave quietly )                          │
 └───────────────────────────────────────────────────────────────────────────────┘
```

Phone: the panel becomes a bottom sheet with a grab handle, peeking at 88px ("Private notes · Saved"), pulled up to
60% height. Faces and page stay above it.

Details:
- **Autosave** the notes (debounced 1.5 s, and on leave and `pagehide`), with "Saved · 2 s ago". Today notes are
  saved only on a button press and are lost if the admin leaves first.
- **Mark this moment** inserts the lesson clock ("18:30 ") at the cursor, so notes line up with the timeline.
- **Live facts** come from data the room already has (presence, quality events, focus events). Read only.
- The panel is a side panel on the opaque surface, not glass (it holds text being typed).
- The capsule copy says the truth plainly. No eye icon animation, no red dot.

### 4.6 Late-reason gate (teacher dashboard)

**References:** Apple's alert guidance ([HIG Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts):
one decision, plain words, no blame), the design system's OTP
card (a focused `glass-3` card over the khatam field), Whereby's "help me fix this" (pair a problem with the next
step).

Today: an un-closable modal with a textarea and a 10-character minimum. Keep it un-closable (spec), change the
feeling from "you were caught" to "tell us, so we can help".

**Desktop and phone (same card, full screen on phone)**

```
 ┌──────────────────────────────────────────────┐
 │  You joined late on Tuesday                   │  font-editorial heading
 │  ┌────────────────────────────────────────┐  │
 │  │ Quran with Yusuf · 17:00 · 8 min late  │  │  lesson card, sand
 │  └────────────────────────────────────────┘  │
 │  What happened?                              │
 │  (Power cut) (Internet) (Previous lesson ran │  quick picks, pill toggles
 │   over) (Health) (Something else)            │
 │  ┌────────────────────────────────────────┐  │
 │  │ A few words help the team understand.  │  │  textarea
 │  └────────────────────────────────────────┘  │
 │  1 more lesson after this one                │
 │  [               Send               ]        │  crimson, full width
 └──────────────────────────────────────────────┘
```

- A quick pick plus a few words is enough; "Something else" needs at least 10 characters (owner decision: today
  every reason needs 10).
- Tone: colleague voice in Egyptian Arabic in the dashboard (ACCOUNT-VOICE §3). "We" is the academy.
- Several pending: a small "1 of 3" stepper, one at a time.
- Error: "That didn't send. Your words are still here. Try again." The text never clears on failure (today it does
  not clear either; keep it).

### 4.7 Admin pages: late reasons and teacher connection

**References:** Honorlock's "needs attention" filter and flag list
([blog](https://honorlock.com/blog/reviewing-proctored-exams/)), TAO's live session list
([docs](https://userguide.taotesting.com/user-documentation/latest/public/monitoring-multiple-sessions)), Zoom 6.7's
side panel instead of pop-ups ([Zoom](https://www.zoom.com/en/blog/zoom-workplace-simplicity-ui-updates/)).

**Late reasons page**

```
 Late to lessons
 (Needs a decision · 3)  (Waiting for the teacher · 1)  (Done)        segmented filter
 ┌──────────────────────────────────────────────────────────────────┐
 │ Ustadha Afnan · 8 min late · 2nd this month                      │
 │ Quran with Yusuf · Tue 17:00 · WZ-1042                           │
 │ "Power cut. The area lost electricity for 20 minutes."           │
 │ Note ________________________________________________            │
 │ [Excuse]   Deduct… ›                                             │  Excuse = primary;
 └──────────────────────────────────────────────────────────────────┘  Deduct opens a small
                                                                       sheet: amount + note
                                                                       + "Add to payroll"
```

- Facts first (ACCOUNT-VOICE §3, super admin): who, ref, minutes, how often this month.
- Deduct is money: it opens a confirm sheet with the amount in the payroll currency and the line it will add.
- Phone: the same cards, full width, actions stacked.

**Teacher connection (modal today, side panel or page later)**

```
 Connection · Ustadha Afnan · November 2026
 18 lessons · 1 failed on the teacher side · lowest video 360p
 ┌─────────────────────────────────────────────┐
 │ Tue 17:00 · Yusuf          Teacher | Learner │
 │ lowest video               720p    | 360p    │
 │ weak / sound only (min)     0 / 0  | 4 / 1   │
 │ reconnects                  0      | 2       │
 │ ▲ Teacher connection failed                  │  copper on sand, not crimson
 └─────────────────────────────────────────────┘
```

- On phones the table becomes one card per lesson (above). On desktop the table stays, with the summary line on top
  and failed lessons sorted first.
- Words with every colour; no green for good (teal).

## 5. State catalogue (room)

| State | Learner | Teacher | Observers | Copy (EN; AR in the account voice) |
|---|---|---|---|---|
| Connecting (after Join) | Espresso stage, remote arch with a breathing khatam | same | same | "Opening the room…" |
| Waiting for the other side | Teacher's arch with initial and a soft gold light | Learner's arch with initial | Empty arch for whoever is missing | "Your teacher will be here soon." / "Waiting for Yusuf…" |
| Reconnecting | Frozen last frame, 40% dim, notice | same | same | "Reconnecting… The lesson is safe." After 20 s: "Still trying. Check your internet." |
| Back | Notice for 2 s | same | | "Back." |
| Weak line | Notice, video may drop to sound | Notice names the side | none | as today |
| Video paused (audio only) | Arch with initial and "Video paused to keep the sound clear" | same | same | as today |
| Audio blocked (iPhone) | Big arch button | same | same | "Tap to hear your teacher" |
| Superseded | Paper arch card | same | | "This lesson is open on another device." + "Use this device" |
| Closed (hard close) | Paper arch card, khatam seal | same | same | "The lesson time is over, so the room closed." |
| Ended by teacher | Paper arch card; child: Zad waves once, "Well done today!" | goes to Today and the report | "The lesson has ended." | as today |
| Failed, no fallback | Arch card, Try again | same | same | as today |
| Failed, with fallback | Arch card with "Continue on Zoom" as the main action | same | | as today |
| Permission lost mid-lesson | Notice priority 4 with "Allow again" | same | | "Your browser stopped the mic. Allow it again to be heard." |
| Device unplugged | Notice | same | | "Your headset was unplugged. Using the laptop mic." |
| No camera | Your own tile shows your initial in a plain rounded tile | same | | none needed |

## 6. Prioritized changes against the current code

Ordered by effect on a real lesson first, then on looks. Each is small enough for one task.

| # | Change | Where | Why |
|---|---|---|---|
| 1 | Shortcuts by `event.code` (`KeyM`, `Digit1`–`3`) | `ClassroomPage.tsx` keydown | M does nothing on an Arabic keyboard today |
| 2 | One notice slot with the priority table (3.4), placed above the bar on phones | `ClassroomPage.tsx` notices | Up to six notices stack over faces today |
| 3 | Admin notes autosave + "Mark this moment" + side panel / bottom sheet | `parts/ObserverNotes.tsx` | Notes are lost if the admin leaves before Save |
| 4 | Remote main tile `object-contain` on portrait phones, double-tap to fill | `parts/VideoTiles.tsx`, conversation layout | A held mushaf or board is cropped today |
| 5 | Waiting room: arch preview with toggles on it, "your teacher is here" from the channel, devices behind a disclosure, plain-language camera tip, Try again on denied, sticky Join on phones | `WaitingRoom.tsx`, `ClassroomPage.tsx` waiting phase | Fewer decisions before the lesson; the most common fix (permissions) without a reload |
| 6 | Espresso `.room-stage` with khatam pattern; enter "lights dim" moment; paper stays for waiting and over screens | `ClassroomPage.tsx` `Shell`, `index.css` | The room feels like a place, faces read better, the page is the hero |
| 7 | Arch on the remote main tile; speaking = gold inner glow instead of teal outline; captions on a 60% espresso scrim without `backdrop-blur` | `parts/VideoTiles.tsx` | Identity, colour meaning (teal = focus), per-frame blur cost on phones |
| 8 | Top capsule: teacher/learner name + subject + network + clock in one `glass-1` capsule; enter response adds `teacherName`, `subjectLabel`, `learnerType` | header, `ClassroomGate.tsx` `RoomEntry`, enter endpoints | The learner sees "Your lesson" with no name today; chips float loose |
| 9 | Toolbar: no horizontal scroll, More sheet, mic-off in copper/sand with "Muted" so only Leave/End is crimson; child mode 56px with labels | `parts/Toolbar.tsx` | Hidden tools, two crimson things, small targets for kids |
| 10 | Content layout on phones: lesson page full height with the teacher as a draggable arch PiP | `ClassroomPage.tsx` content layout | Today a row of tiles takes ~100px from the page on a 375px screen |
| 11 | Reactions land on the learner's tile; "Raised hand" stays until "Seen"; child "I need…" grid | `parts/Reactions.tsx`, stage | The teacher's eye stays on the face; a child's hand is not missed |
| 12 | Self tile drag-to-corner and "Hide my picture" | `parts/VideoTiles.tsx` | Fatigue research; the tile covers the teacher's hands today |
| 13 | Teacher timer arc + copper last 5 minutes + "+2:10" over time; child lantern | `parts/Timer.tsx` | Calm time awareness without a red countdown |
| 14 | Guardian and admin observer copy in the waiting card and capsule (who can see you) | `WaitingRoom.tsx`, header | Trust and the spec's transparency rule |
| 15 | Late gate: lesson card, quick picks, "1 of 3"; owner decides whether a quick pick alone is enough | `LateReasonGate.tsx` | Same rule, less blame, faster |
| 16 | Late reasons page: filter, "2nd this month", Deduct behind a confirm sheet | `LateReasonsPage.tsx` | Money actions confirmed, facts first |
| 17 | Connection: summary line, cards on phones, failed first, copper not crimson | `TeacherConnection.tsx` | Readable at 375px, colour rules |
| 18 | Child end card with Zad (one wave, reduced motion = still) | over screen `ended` | The one celebration of the lesson |

Before building any of these: `brainstorming` for the stage (6) and the waiting room (5), then prototype 2–3 looks of
the arch tile on the espresso stage (curriculum rule: prototype before building), check desktop and phone, light and
dark, Arabic and English.

## 7. Not taken

- Gallery grids, speaker-switching layouts, participant lists: a 1-on-1 room has two people.
- Emoji reactions and gesture effects (FaceTime fireworks, Meet emoji): fun, but noisy for Quran and loud for
  children. Our five reactions are teaching signals.
- Whisper and barge from contact-centre tools: the spec's admin observer is silent only.
- AI framing and background effects (Around, Zoom): not in Release 1; they cost CPU on the child's phone.
- Auto-hiding controls for learners: children lose them.
- Dribbble and Mobbin concept shots were skimmed. None is filed: they are concepts, not shipped rooms, and Mobbin is
  a paid library not on our plan.

## Built (2026-11-18)

Changes 1, 2, 4, 5, 6, 7, 8, 9 and 10 from section 6 are in `src/classroom/**` (commit 3dc5d1fd; the page view went in
with 3d15bfe6). Also built from the surfaces: the guardian and admin observer copy (14), the teacher timer line, copper
last 5 minutes and "+2:10" over time, the child lantern (13), the self picture that drags to any corner and "Hide my
picture" (12), reactions on the learner's tile and the child "I need..." grid (part of 11, without the sticky "Seen"),
the child end card with Zad (18), the File pane drop zone and "There are N minutes left" when ending early.

Not built yet: the teacher capsule dimming after 4 s, the sticky raised hand with "Seen", permission-lost and
unplugged-device notices (the engine's new `device` event is ready for them), landscape phone layout, the weak-line
detail on tap, swap-on-tap for the phone picture.

Server fields the room reads when present (optional on `RoomEntry` in `ClassroomGate.tsx`; without them the learner sees
"Your lesson" and the default stays adult): `teacherName: string | null`, `subjectLabel: string | null` (already in the
viewer's language), `learnerType: 'child' | 'adult' | null`.

Screenshots (`docs/classroom/shots/`, taken on a local preview with canvas video, desktop 1280-1440 px and phone 375 px):

| Surface | Files |
|---|---|
| Waiting room | `waiting-desktop-en-light.png`, `waiting-teacher-desktop-en-light.png`, `waiting-phone-ar-dark.png`, `waiting-child-phone-en-light.png`, `waiting-guardian-phone-ar-light.png`, `waiting-denied-desktop-ar-light.png` |
| Teacher | `room-teacher-conversation-ar-light.png`, `room-teacher-content-reaction-en.png`, `room-teacher-focus-notice-en.png`, `room-teacher-board-more-en.png`, `room-teacher-end-confirm-en.png` |
| Learner | `room-learner-phone-ar-dark.png`, `room-learner-phone-content-ar-dark.png`, `room-learner-reconnecting-speaking-en.png`, `room-learner-talking-muted-en.png`, `room-learner-screen-share-en.png`, `room-tap-to-hear-en.png` |
| Child | `room-child-phone-ineed-en.png`, `room-child-phone-ar-dark-lantern.png`, `over-child-ended-ar-dark.png` |
| Observers | `room-guardian-phone-ar.png`, `room-admin-observer-desktop-en-dark.png` |
| Over screens | `over-failed-en-light.png` (closed and superseded use the same card) |

