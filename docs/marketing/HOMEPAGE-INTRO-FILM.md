# Homepage intro film, and the brand film for ads

Owner, 2026-11-17: one short voiced film in the homepage hero. Owner, 2026-11-18: "the most important video we have";
it is also the film for the ad campaign. Version 2 is below (v1, six scenes on take 1, is in git history).

Rules it keeps: **no people on camera** (the film is about the academy, not one person), no price, Zad in every scene,
the owner's voice clone, a hook in the first second, a picture change every one to two seconds, two open loops
("what would you pack?" → "we know the answer"; "a teacher who knows you by name" → shown), our own ending.

Built in the page itself: `src/components/public/homepage/IntroFilm.tsx`. `?film=record` shows the film alone, full
screen, with `window.__playFilm()` to start it, for recording the ad versions.

## Voice-over (v2)

ElevenLabs, new account (connector 9872e1c5), eleven_v4, `mahmoud-fusha` kO4IhVkRM0Oyq7qfKk0l and `mahmoud-english`
qcy21eeEO3C1xHhSLn3U. Written to the v4 guide: one emotion tag before each line, ellipses for pauses, CAPS for the one
stressed word in English, Arabic fully diacritized so every ending is pronounced.

Three takes each in `marketing/intro-film/vo/{ar,en}-v2-t{1,2,3}.mp3` (~42 s). Take 1 is live
(`public/media/intro-film/{ar,en}-v2.mp3`; a new take gets a new file name, since mp3s are cached for a day): clean pauses between lines and every word aligned. Scene starts and word
cues (`STARTS`, `BEATS`, `CUES`) come from ElevenLabs Scribe forced alignment of take 1; re-measure if a take changes.

## Script and pictures

| # | Emotion | Arabic | English | Picture |
|---|---------|--------|---------|---------|
| 1 | curious, whisper | لَوْ سَافَرْتَ غَدًا... مَاذَا تَضَعُ فِي حَقِيبَتِكَ؟ | If you left tomorrow... what would you pack? | Things fly into Zad's bag one every half second, the bag bumps; a gold question mark. |
| 2 | warm, knowing smile | نَحْنُ نَعْرِفُ الجَوَابَ. | We know the answer. | Spotlight; Zad rises out of the bag. |
| 3 | proud, unhurried | زَادٌ... لَكَ، وَلِأَهْلِ بَيْتِكَ. | Zad. Provision... for you, and your family. | "زاد" in gold foil with a light sweep; four figures rise. |
| 4 | sincere, heartfelt | فِي الغُرْبَةِ، لَا يَأْتِي القُرْآنُ وَالعَرَبِيَّةُ وَحْدَهُمَا... يَحْتَاجَانِ مُعَلِّمًا، يَعْرِفُكَ بِاسْمِكَ. | Far from home, the Quran and Arabic don't come on their own... they need a teacher who knows you by name. | A night city, one window lights; a teacher card types "أهلًا يا يوسف". |
| 5 | brighter, quicker | قُرْآنٌ وَتَجْوِيدٌ... حِفْظٌ وَمُرَاجَعَةٌ... مَنْهَجُ زَادٍ... وَالعَرَبِيَّةُ، وَالإِنْجِلِيزِيَّةُ. | Quran and Tajweed... memorisation and revision... the Zad Path... Arabic, and English. | The academy's 3D medals land one by one and collect in a row. |
| 6 | reassuring, steady | مُعَلِّمٌ أَوْ مُعَلِّمَةٌ تَخْتَارُهُ أَنْتَ، يَبْقَى مَعَكَ حِصَّةً بَعْدَ حِصَّةٍ... وَلَا يَبْدَأُ مِنَ الصِّفْرِ، أَبَدًا. | A male or female teacher you choose. Who stays with you, lesson after lesson... and NEVER starts from zero. | Two arch cards, one ticked; the teacher medal rides a line of lessons; a zero is struck through. |
| 7 | delighted | وَبَعْدَ كُلِّ حِصَّةٍ، يَصِلُكَ تَقْرِيرٌ قَبْلَ أَنْ تَسْأَلَ... وَكُلُّ وَاجِبٍ تُنْجِزُهُ، تَكْسِبُ بِهِ شَارَةً جَدِيدَةً! | After every lesson, a note reaches you before you ask... and every homework you finish earns you a new badge! | A real portal screen (the teacher's note), a notification; the badges screen; a homework badge bursts out. |
| 8 | warm, inviting | الحِصَّةُ الأُولَى... عَلَيْنَا. تَعَالَ نَتَعَرَّفْ... وَابْدَأْ زَادَكَ، اليَوْمَ. | The first lesson... is on us. Come and meet us... and start your Zad, today. | Zad cheers, the "book the free first lesson" pill, the verse. |

## Hero behaviour

- Poster (painted on first load, nothing else loads): Zad waves, the hook question, "Play with sound · 40s".
- One tap plays the voice and the scenes, captions burned in, a thin progress line, pause in the corner. At the end:
  "Watch again" and "Book the free first lesson".
- 16:9 on wide screens, 4:5 on phones. Reduced motion: fades only.

## Images

Real portal screens in `public/media/portal/{ar,en}-{note,level,milestones,badges}.webp`, captured on a phone viewport
from `/student/progress?preview=active` (the portal's own sample learner, a dev-only preview) with the dev student
session. The homepage says so under the phone: "real screens, sample data". Medals are the portal's badge renders in
`public/badges/shelf`.

## Script v3 (live since 2026-11-18, 35 s)

Owner on v2: the script and the voice sound cheap. v3 trades the list of features for one feeling: what we are afraid
to lose far from home cannot go in a suitcase. One idea per line, no subject list, the verse said in full near the end.
Recorded on eleven_v4, 3 takes each (`marketing/intro-film/vo/*-v3-t{1,2,3}.mp3`); take 1 is live as `public/media/intro-film/{ar,en}-v3.mp3`, timed by Scribe alignment. As recorded, line 1 is a question: «لَوْ كَانَ لَكَ أَنْ تَحْمِلَ شَيْئًا وَاحِدًا فَقَطْ... إِلَى الغُرْبَةِ... مَاذَا تَحْمِلُ؟» / "If you could carry just ONE thing... far from home... what would it be?". Thumbnail: "Just ONE thing… what would you carry?" over the bag glowing with the answer rising out of it. Ad exports and thumbnails: `marketing/intro-film/export`.

| # | Emotion | Arabic | English |
|---|---------|--------|---------|
| 1 | hushed, intimate | كُلُّ مُسَافِرٍ... يَحْزِمُ حَقِيبَتَهُ بِعِنَايَةٍ. | Every traveller packs with care. |
| 2 | slower, reflective | لَكِنَّ أَثْقَلَ مَا نَخَافُ أَنْ نَنْسَاهُ... لَا يُوضَعُ فِي حَقِيبَةٍ. | But what we fear forgetting most... doesn't fit in a suitcase. |
| 3 | tender, a little emotional | كَلِمَاتُ اللهِ... وَلِسَانُ أَجْدَادِنَا... وَدِينٌ نُرِيدُهُ أَنْ يَبْقَى فِي أَبْنَائِنَا. | The words of Allah... the language of our grandparents... a faith we want our children to keep. |
| 4 | warm, rising | هُنَا... مُعَلِّمٌ يَعْرِفُكَ بِاسْمِكَ، يَسْمَعُكَ حَرْفًا حَرْفًا، وَلَا يَبْدَأُ مَعَكَ مِنَ الصِّفْرِ. | Here, a teacher who knows you by name. Who hears every letter... and never starts from zero. |
| 5 | bright, light | وَبَعْدَ كُلِّ حِصَّةٍ... يَصِلُكَ مَا تَعَلَّمْتَ. وَكُلُّ خُطْوَةٍ... تَصِيرُ وِسَامًا. | After every lesson, you see what you learned... and every step becomes a badge. |
| 6 | proud, steady, slow | ﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾ | "Take provision... and the best provision is mindfulness of Allah." |
| 7 | inviting, smiling | الحِصَّةُ الأُولَى عَلَيْنَا. ابْدَأْ زَادَكَ. | Your first lesson is on us. Start your Zad. |

## Version 4 (live since 2026-11-19, 40 s): a real video, not an ad

Owner on v3: it felt like an ad, the voice changed mood mid-way, and the social videos were better than the site film.
He also asked that the thumbnail be a real image that starts the video when tapped. Version 4 changes that:

- **One steady voice.** The same tag on every line: `[calm, warm, sincere, steady storytelling voice]`. Take 1 of
  each language is in the film (both takes in `marketing/intro-film/vo/*-v4-t*.mp3`).
  Timings come from Scribe word alignment.
- **A soft close, no CTA.** The last line is «فَجَهِّزْ زَادَكَ... قَبْلَ أَنْ يَفُوتَكَ الكَثِيرُ» / "So pack your Zad...
  before too much passes you by.", then an end card with Zad and our name. No "book" or "subscribe".
- **Painted pictures.** Meshy (nano-banana-pro) scenes in `marketing/intro-film/art`: airport window, suitcase leaking
  light, mushaf on a rehal, an old hand and a child's hand, a night desk in a snowy city (`s4g.png`, with the green
  taken out of the plants), a golden khatam over dunes, a bag on a golden path. Slow Ken Burns moves and dissolves,
  Zad in a corner of every scene, three portal medals on "every step becomes a badge", the verse in solid gold Amiri.
- **Rendered, not recorded.** `marketing/intro-film/render/film.html` draws any frame (`window.frame(t)`);
  `render.mjs <ar|en> <169|45> <out.mp4>` screenshots it at 25 fps and muxes the voice, so nothing drifts. `run.sh`
  renders all four. Output in `public/media/intro-film/{ar,en}-{169,45}-v4.mp4` (16:9 for wide screens, 4:5 for phones).
- **Cover image.** `render/thumb.html` + `thumb.mjs` make `public/media/intro-film/cover-{ar,en}-{169,45}.webp`: the
  open crimson suitcase with a beam of light, "Just ONE thing… what would you carry?", and Zad. The page lays its own
  play button on it; a tap swaps in the video (`preload="none"`, nothing loads before).

| # | Arabic | English | Picture |
|---|--------|---------|---------|
| 1 | لَوْ كَانَ لَكَ أَنْ تَحْمِلَ شَيْئًا وَاحِدًا فَقَطْ... إِلَى الغُرْبَةِ... مَاذَا تَحْمِلُ؟ | If you could carry just one thing... far from home... what would it be? | s0 |
| 2 | أَثْمَنُ مَا نَخَافُ أَنْ نَفْقِدَهُ... لَا تَتَّسِعُ لَهُ حَقِيبَةٌ. | The things we fear losing most... don't fit in a suitcase. | s1 |
| 3 | كَلَامُ اللهِ... وَلِسَانُ أَجْدَادِنَا... وَدِينٌ نُرِيدُهُ أَنْ يَبْقَى فِي أَبْنَائِنَا. | The words of Allah... the language of our grandparents... a faith we want our children to keep. | s2, s3 |
| 4 | هُنَا... مُعَلِّمٌ يَعْرِفُكَ بِاسْمِكَ، يَسْمَعُكَ حَرْفًا حَرْفًا... وَلَا يَبْدَأُ مَعَكَ مِنَ الصِّفْرِ. | Here, a teacher who knows you by name. Who hears every letter... and never starts from zero. | s4g |
| 5 | وَبَعْدَ كُلِّ حِصَّةٍ... تَرَى مَا تَعَلَّمْتَ، وَكُلُّ خُطْوَةٍ... تَصِيرُ وِسَامًا. | After every lesson, you see what you learned... and every step becomes a badge. | s5 + medals |
| 6 | وَتَزَوَّدُوا... فَإِنَّ خَيْرَ الزَّادِ التَّقْوَى. | "Take provision... and the best provision is mindfulness of Allah." | s6, the verse |
| 7 | فَجَهِّزْ زَادَكَ... قَبْلَ أَنْ يَفُوتَكَ الكَثِيرُ. | So pack your Zad... before too much passes you by. | thumb169, end card |

The owner watches it on the live site. Do not send him video files.
