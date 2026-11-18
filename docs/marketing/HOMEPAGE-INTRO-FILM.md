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
(`public/media/intro-film/{ar,en}.mp3`): clean pauses between lines and every word aligned. Scene starts and word
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
