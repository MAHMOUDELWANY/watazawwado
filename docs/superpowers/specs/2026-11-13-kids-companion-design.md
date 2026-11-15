# Kids companion, lesson points and challenges: design draft

Status: draft from the owner brainstorm of 2026-11-12. Not approved. Not committed or pushed (owner asked to see it first).
Prototype: `/prototype/companion` (dev only), art in `docs/design/companions/`, cut-out stages in `public/prototypes/companions/`.

## Why

Children already see their progress and plan. The owner wants two more things for kids:
1. **Effort made visible**: the child sees something grow because of their own work in lessons.
2. **Healthy competition**: between siblings, friends, families and students, started by the teacher.

Kept away from Western superhero culture: the companions are **real animals from our heritage**, with no superpowers. Growth means care and steady effort.

## Scope

- **Kids only.** Teens and adults may later get a garden/trees idea (like Forest); deferred until kids results are in.
- **Separate from badges.** Badges (big milestones: a juz memorised, number of lessons) belong to the other session ("badges on the progress page"). They do **not** grow the companion.

## The companion

- Three at launch: **hoopoe, camel calf, fennec**. The child picks one. More can be added later.
- Look: premium animated-film 3D render, brand palette (crimson, teal, copper, sand, gold), no green. Concept art made by the owner (2026-11-12).
- Five stages: egg or sleeping newborn → just born → small → young → fully grown.
- Each new stage opens a **true fact card** (an ayah where the animal is mentioned, a seerah story, or a fact about the animal). The animals never speak in stories of the prophets.
- Zad stays the guide who introduces the companion.
- After the last stage, points unlock accessories (lantern, saddle bag, scarf, saddle, bell, blanket, flask, crescent, bridle, prayer rug, date basket, star badge: see `accessories.png`), so growth never "finishes".
- The companion never shrinks or dies. If the child is away it sleeps and waits.

## Points (XP)

- **After every lesson** the teacher taps what happened. Each small achievement is 1 point, with its own icon designed by us:
  - shared by all subjects: focused the whole lesson, good manners and listening, did the homework;
  - per subject: e.g. recited what was due last time (Quran).
- **Big tasks** set by the teacher, e.g. "prayed all prayers this week" confirmed by the parent: up to 10 points.
- **Teacher's own achievements**: a teacher can add achievements for a subject or a single student, choose an icon from our library and set points **within a fixed range (1 to 5)**. Saved to the teacher's account, reusable with any student.
- **Caps** per lesson and on big tasks per week, so growth stays measured and fair between teachers.
- All points are computed and stored on the server.
- **Pace**: hatching is fast (2 to 3 lessons) so the child bonds; each later stage is further away. At about 14 XP a week (two lessons), the last stage comes after roughly 9 months. Prototype thresholds: 0, 12, 70, 220, 520 XP.
- The child sees a total XP number (never goes down) and "points left until it grows".

## Challenges

- **Started by the teacher.** One week long.
- Between two siblings, two students of the same teacher, two students of different teachers, or family against family.
- **Fair scoring**: only XP earned **inside the challenge week** counts, so a newer student can beat an older one. When lesson counts differ, compare average XP per lesson. Family against family: average of the siblings.
- **Winner opens a chest**: an accessory and a small XP bonus (small, so it does not break the pace). The other side keeps all their normal points; no punishment; rematch next week.
- Between families: only first name and companion are shown; a challenge with another family needs both parents' consent.

### Chest opening (sitewide)

Owner, 2026-11-13: every chest on the site opens with the Duolingo reference's quality (`docs/design/inspiration/badges-and-rewards/chest-tap-to-open-rare-epic.mp4`), in our palette. Built as one shared component, `src/components/rewards/ChestOpen.tsx`:
- idle wobble and twinkling sparks; three taps, each a squash-and-jump with a spark burst and a filled dot ("اضغط! اضغط!", "باقي ضغطة!");
- optional rarity upgrade on the second tap: a white swoosh ring, background and chest turn from teal (نادر) to crimson (ملحمي);
- "اضغط للفتح!": anticipation shake, the lid springs open, rotating gold light rays and glow, a big spark burst, the reward rises out of the chest and floats, then title, rarity and XP with an OK button;
- reduced motion: no shakes, loops or particles. Rarity and reward come from the server; the component only plays them.

## Friends

1. **Friend code**: each child has a generated nickname (built from fixed choices, e.g. "Brave Hoopoe 42", never free text), a code and a QR next to the companion. Entering a friend's code sends a request to both parents; after both agree they are friends and can be challenged. Both teachers get a note.
2. **Through the teacher**: "I know someone here" with a name; the teacher forwards it to the admin, who finds the family and invites the parent.
3. **Same teacher for people who know each other**: at sign-up "Do you know a family with us? Enter their code"; we suggest that teacher first when they have free times. For existing friends at different teachers, the admin sees a hint; parents decide.

Safety: no search, no list of children, no chat. Interaction is challenges and fixed replies only ("MashaAllah", "Well done"). A parent can turn the whole feature off for their child.

Assumption to check: linking a child's device to the parent's account by code already exists. If not, it becomes part of this work.

## Sharing

The teacher can export an achievement or a badge as a short video/GIF (companion + achievement + first name), recorded in the browser, no outside service. It is sent to the student or the parent and can go to the community with the parent's consent (existing community consent and admin review).

## How it is made (tools)

- Display: React + Motion already in the site; Three.js / React Three Fiber are installed if a real 3D model is used later.
- Art: owner generates images from prompts (no paid image tools from Claude; no Meshy).
- The prototype uses the owner's renders cut into stages, with light "alive" motion (breathing, bounce on points, egg wobble). This already reads as premium 3D.
- A real rigged 3D model would need hand modelling in Blender. With a 4 GB graphics card and no AI 3D tool, a scripted Blender model would look far below the concept art. **My call**: launch with the rendered stages (2.5D), and treat real 3D as a later upgrade.

## Open for the owner

1. Approve this description (the parts above marked as decisions are his; pace numbers, caps, nickname format and the 2.5D call are mine).
2. Order of work with the badges session: the only link is that both appear on the child's progress area; no shared data.
3. Whether teens/adults get the garden idea, and when.

## 3D test with Meshy (2026-11-13)

- Owner subscribed to a paid Meshy plan (the free plan cannot create tasks from the CLI). Rule from now on: images and 3D are made with Meshy, never ElevenLabs.
- Hoopoe made from four views of `hoopoe-turnaround.png` with multi-image-to-3d (textured, 4K, PBR): 30 credits, task `01a1d322-0b90-7166-b820-4a0b31ad6a91`. Raw GLB was 60 MB / 1.3M triangles; optimised with gltf-transform (simplify, WebP 1024 textures, meshopt) to 650 KB at `public/prototypes/companions/3d/hoopoe.glb`. Task record and render in `docs/design/companions/meshy/`.
- Shown in `/prototype/companion` with a 2D/3D toggle (`src/prototypes/Companion3D.tsx`, React Three Fiber + drei), gentle sway, soft shadow.
- Verdict: the 3D hoopoe is clean and on-palette but flatter than the 2D renders (less feather detail, no glow, the beak reads short from the front). The 2D stages stay the better look for now; 3D is worth it later for turning/interaction.
- Not done: Meshy rigging is for humanoids, so no rig or animations were requested for the bird.
- Unity: its plugin targets the Unity Editor and game builds; a Unity WebGL build is several MB and slow on phones. Three.js already covers the site. Not recommended here.

## Interactive 3D Zad (2026-11-13)

- Owner: no Meshy model for Zad; wants game-pet-style emotes (reference `docs/design/inspiration/zad-mascot/motion-game-pet-emotes.mp4`).
- Decision (mine, owner away): build Zad in code with React Three Fiber from its approved parts, so each part moves on its own and the file stays tiny. Duolingo's owl is a 2D Rive rig; a code-built 3D Zad gives the same responsiveness in 3D. Meshy rigging only fits humanoids, so it could not move Zad's arms or eyes.
- Spike at `/prototype/zad3d` (`src/prototypes/Zad3D.tsx`, `Zad3DPrototype.tsx`): drag to turn, tap for a squash and sparks, eyes blink and follow the pointer, eight emotes with effects (wave; cheer with spark bursts; spin with a gold ring trail; love burst; dash off screen with a comet trail and a ground impact ring; dua with a light column and floating sparkles; proud with a star shower; think). Reduced motion keeps Zad still.
- No new dependencies. Glow is faked with additive sprites; real bloom would need `@react-three/postprocessing` later.

## Zad's places and the dancing hoopoe (2026-11-13, later)

Owner: nobody steers Zad, so Zad needs more moves, each one fitting the place on the site where we put him. The hoopoe is the child's own: the child unlocks its dances with XP as it grows.

**Zad** (`/prototype/zad3d`): 16 moves. Pick a place to watch its moves loop, as they would on the site:

| Place | Where | Moves |
|---|---|---|
| Home | the visitor opens the site or signs in | wave (salam bubble), bow (wing on heart, «أهلاً بيك»), point |
| Tour | showing a new student round the portal | point (gold arrow), think, wave |
| During a lesson | beside content while it loads, or while studying | read (book, eyes run right to left, pages turn, ا ق ر أ rise into «اقرأ»), think |
| Lesson done | after the last slide or a quiz | cheer, clap, proud (medal), spin |
| Booking confirmed | booking and payment success page | check (draws a gold tick), love, dash |
| No results | empty search, empty page, error | search (magnifying glass), oops (shrug, question mark, sweat drop) |
| Dua | before memorising, after finishing a surah | dua, bow |
| Away | the page is left open with no activity | sleep (Z Z Z, wakes with a start) |

**Hoopoe** (`/prototype/hoopoe3d`, `src/prototypes/Hoopoe3D.tsx`): built in code like Zad (copper and sand body, fan crest with cream bands and espresso tips, striped wings, long curved beak), so it can dance. The crest flicks up at rest like a real hoopoe's.
- Nine dances unlocked by XP, on the spec's pace: hop and crest fan (0), head bob (12), wing wave (30), twirl (70), slide (120), backflip (220), loop-the-loop flight (350), star finale (520).
- It grows through the stages (0 / 12 / 70 / 220 XP: bigger body and crest) and gains gold: gold crest tips (120), a gold khatam pendant (350), a gold aura (520).
- An unlock shows a toast, confetti, and the hoopoe plays the new dance. No music notes in the effects (stars, feathers, rays instead), given our audience.
- Prototype XP is local only; the real XP stays server-side as above. The egg stage is not modelled yet.

**Hoopoe rebuilt on the approved art (2026-11-14).** Owner: the code-built hoopoe was not close to `hoopoe-turnaround.png` and looked poor. It now uses the Meshy model made from that sheet (same task, re-downloaded free and re-optimised to 117k triangles with 2048 WebP textures, 2 MB, `public/prototypes/companions/3d/hoopoe-hq.glb`). Meshy rigs humanoids only, so `Hoopoe3D.tsx` computes seven bones and smooth skin weights from the bird's shape (root, head, crest, beak, two wings, tail) and the nine dances drive them. Growth stages scale the head up and the beak down for the chick, as in `hoopoe-growth.png`. Limits: the eyes and beak are baked into the model, so no blink and the beak does not open; wings lift and flutter but do not spread into separate feathers; the egg stage is not modelled. The code-built version is kept only in the session scratchpad.

## On the site (2026-11-15)

Owner asked for four things:
- add the egg stage;
- replace every Zad on the site with the new 3D Zad;
- put the hoopoe where it belongs, in demo mode;
- design how XP looks.

- **Egg**: `src/components/mascots/HoopoeEgg.tsx`.
  - Looks like the egg in `hoopoe-growth.png`: a sand egg in rows of crimson, teal and cream scales, on a crimson velvet cushion with a gold cord.
  - It rocks now and then. It cracks as XP nears 12, and light leaks through the cracks.
  - On hatching it shakes, the top flies off in a flash with confetti, and the chick pops out and does its first hop.
  - Stages now follow this spec: egg 0, hatched 12, small 70, growing 220, grown 520.
  - Dances unlock at 12 (two), 30, 70, 120, 220, 300, 400 and 520. Gold rewards come at 160, 350 and 520.
- **Zad everywhere**: `ZadRig` now draws the 3D Zad (`src/components/mascots/ZadLive.tsx`), loaded on demand.
  - Each old pose maps to the 3D move that fits it, played again after a short rest.
  - The canvas is bigger than the slot so effects can spill out, and it never takes clicks.
  - The SVG Zad stays as the fallback (no WebGL, or the chunk fails).
  - The first render is an empty slot, so prerendered pages hydrate cleanly.
  - Places: the welcome loader, onboarding guide, student onboarding, book shelf, travel pass, the /zaad page, the certificate page and the kid home.
- **Hoopoe on the site**: `CompanionDemo` sits on the progress page of a child learner, both the parent's view of a child and `/kid/progress`.
  - It is marked "Demo" and its points are made up and stay on the device. It shows every stage, dance and gold reward.
  - `/prototype/hoopoe3d` shows the same card.
- **XP look**: `docs/design/XP.md`, components in `src/components/xp/Xp.tsx`.
