# Owner's decisions, 2026-10-26 (after reviewing the prototypes of the new subjects)

Binding for every subject beyond Zad Essentials. They override the prototypes built on 2026-10-26.

1. **One kids cast for the whole site.** Every Kids version of every subject uses the Zad Essentials Kids cast (Yusuf,
   Maryam, Jiddo, Mishmish; painted cut-outs in `public/curriculum/zad-kids/characters/`). The literacy cast (Lina, Sam)
   and the code-drawn kids are dropped. Claude asks the owner for new poses or new characters when a lesson needs them.
2. **Kids stage:** the same beige paper background as Zad Kids; motion graphics wherever there is no painting.
3. **Seerah has images** (the owner makes them from Claude's prompts). Seerah follows the owner's deck for the look and
   the way the story is told, not word for word: we tell it our way.
4. **Every subject gets a full curriculum plan before lessons**, as Zad did: parts, number of lessons, topic and outcome
   per lesson, how the course ends; agreed with the owner first.
5. **Each subject and each version has its own rules, design and narration.** Claude asks the owner per subject and
   version before building (goal, audience, story, look, lesson shape, length, voice, what to avoid). The 2026-10-26
   prototypes copied the Zad template and must be revised once these answers exist.

## Second round (same day)
6. **New poses and characters:** Claude writes complete, self-contained image prompts (the owner pastes them into a
   fresh ChatGPT chat that knows nothing of the project). New characters are welcome where a subject needs them (e.g.
   Teta and a teacher for Egyptian Kids). Serve the context: the learner must be eager, enjoying it and focused, the main
   weakness of online teaching.
7. **Praise and wording fit the audience:** courses that non-Muslims may take (Literacy A, Fusha, Egyptian, English) use
   neutral praise ("Well done!", "Excellent!"), not "Zādak Allāh". Their characters and scenes are neutral and modest:
   nothing indecent, nothing un-Islamic.
8. **English is paused:** no curriculum work on English until the owner says so.
9. **Literacy A is general literacy,** not a road to the Quran. It needs a clear roadmap the learner can see (where I
   came from, where I am going), designed for each age, not a list of blocks.
10. **Seerah:** from before the birth to the death of the Prophet ﷺ, in seasons; about 20 slides and 60 minutes per
    episode (60 minutes for every curriculum). Kids, Teens & Adults: same episodes, same order; Kids a little shorter,
    with moments that touch children. The I'tizaz and the Chronicle stay as ideas, never as labels: the learner leaves
    with identity, pride and love for the Prophet ﷺ **and his companions** (their moments are taught too). Nobody's face
    is ever shown (people from behind at most). Kids images: between childlike and cinematic. Sources: The Sealed
    Nectar, plus Ibn Hisham and others, every fact verified. Texts (ayat, hadith) wherever they serve the story. Reviews
    stay light: they measure focus and enjoyment, not exams. Stories with a known difference of opinion may stay if they
    are widely accepted and stir no controversy.

## Third round (same day)
11. **Seerah plan (46 episodes, 6 seasons) approved as it is.** Every episode ends on a cliffhanger and the episodes
    build on each other as one story; the storytelling must be the best work Claude has produced.
12. **The teacher tells the Seerah,** for every age; the screen supports. No narrator voice, no character who seems to
    be the storyteller (the teacher must never look like they are reading someone else's lines). Kids version: the Zad
    Kids cast appear (they may react, ask, or give advice), but they do not narrate.
13. **Literacy A:** goal = the learner can read anything, literally. Writing is light: the motion shows how a letter is
    written, simply, so the learner can copy it on paper with the teacher; never a core skill. Words are neutral and
    everyday (common words like مسجد are fine as part of the language). New neutral characters for Kids and Teens only;
    none for Adults. The roadmap is a real journey the learner walks after each lesson, different per age; Claude designs it.

## Fourth round (2026-10-27)
14. **The road map belongs on the curriculum page, not in the lessons.** "Road map" (decisions 9 and 13) means the page of
    a version's lessons: a designed road with every part as a stage and every lesson as a station, for every subject and
    every age (`src/curriculum/Roadmap.tsx`). Lessons do not carry a journey or map page.
15. **Images:** Kids pictures fill the whole slide like Teens & Adults; every subject and version door has its own
    banner, never an episode image.

