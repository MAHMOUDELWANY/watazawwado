// Copy for the carousel videos (one idea per scene, PRODUCTION.md §3b). tone 0 = espresso stage, 1 = deep crimson.
// accent = the words (as written in head) that take the gold italic. Last scene carries the one CTA.
const SCENES = {
  v6: [
    { head: 'Drifted?', accent: 'Drifted?', sub: "You don't need a lecture.<br>You need a first step.", pose: 'sad' },
    { kicker: 'STEP 1', head: 'One short surah you half-know.', accent: 'half-know.', sub: 'Finish it this week, a few lines a day.', pose: 'point', tone: 1 },
    { kicker: 'STEP 2', head: 'Five minutes after one prayer.', accent: 'one', sub: 'Not every prayer. Just one.', pose: 'think', tone: 1 },
    { kicker: 'STEP 3', head: 'Fix one letter this week.', accent: 'one letter', sub: 'The one that always slips: <span class="ar">ع</span>, <span class="ar">ق</span> or <span class="ar">ح</span>', pose: 'wow', tone: 1 },
    { kicker: 'STEP 4', head: 'Ask the question you were embarrassed to ask.', accent: 'embarrassed', sub: 'Asking is part of learning.', pose: 'proud', tone: 1 },
    { kicker: 'STEP 5', head: 'Learn with someone your age.', accent: 'your age.', sub: 'Coming back is easier together.', pose: 'clap', tone: 1 },
    { stamp: true, head: 'Start where you are.', accent: 'you', sub: 'Comment ZAAD for the link', pose: 'cheer' },
  ],
  v8: [
    { head: "Why we're building Watazawwado", accent: 'Watazawwado', sub: 'It started with two stories.', pose: 'think' },
    { kicker: 'STORY 1', head: 'The teacher changed, and nobody asked them.', accent: 'nobody', sub: 'Their child started over with someone new. Again.', pose: 'sad' },
    { kicker: 'STORY 2', head: 'They never knew what happened in class.', accent: 'in class.', sub: 'Was it a good lesson? They had to ask, every time.', pose: 'sad' },
    { head: 'So we built it around the relationship.', accent: 'relationship.', sub: 'You choose the teacher. We never switch them.', pose: 'point', tone: 1 },
    { head: 'A report after every class.', accent: 'report', sub: 'And we message you first.', pose: 'proud', tone: 1 },
    { head: 'We open in small waves.', accent: 'small waves.', sub: '20 learners in the first wave, so every family gets our full attention.', pose: 'wow', tone: 1 },
    { stamp: true, head: 'Want a place in the first wave?', accent: 'first wave?', sub: 'Comment ZAAD to join the waitlist', pose: 'cheer' },
  ],
  v10: [
    { kicker: 'THE TABLET IS ON', head: 'You say "Quran time"… the room goes cold.', accent: 'cold.', pose: 'sad' },
    { kicker: 'TIP 1', head: 'Agree before the screen.', accent: 'before', sub: '"Quran first, then the tablet" is easy at 5:50. At 6:15 it\'s a fight.', pose: 'think', tone: 1 },
    { kicker: 'TIP 2', head: 'Ten minutes first. Then the screen.', accent: 'Ten minutes', sub: 'Short enough to say yes to.', pose: 'point', tone: 1 },
    { kicker: 'TIP 3', head: 'Let them choose the surah.', accent: 'choose', sub: 'A child who picks it owns it, even five nights in a row.', pose: 'love', tone: 1 },
    { stamp: true, head: 'What works in your home?', accent: 'your', sub: 'Tell us in the comments', pose: 'cheer' },
  ],
  v11: [
    { head: 'How it works with us', accent: 'with us', sub: 'Five steps. Step 3 is free.', pose: 'wave' },
    { kicker: 'STEP 1', head: 'Pack your zaad.', accent: 'zaad.', sub: 'Join the waitlist, for you or your child. It takes a minute.', pose: 'point', tone: 1 },
    { kicker: 'STEP 2', head: 'Choose your teacher.', accent: 'teacher.', sub: 'Real profiles. You meet them before the first class.', pose: 'think', tone: 1 },
    { kicker: 'STEP 3', head: 'A free 30-minute trial.', accent: 'trial.', sub: 'One real lesson, so you see how it feels.', pose: 'wow', tone: 1 },
    { kicker: 'STEP 4', head: 'A report the same day.', accent: 'same day.', sub: 'Level, goals and a plan, written by your teacher.', pose: 'proud', tone: 1 },
    { kicker: 'STEP 5', head: 'Then, every week.', accent: 'every week.', sub: '1-on-1 with the same teacher, and a report after every class.', pose: 'clap', tone: 1 },
    { stamp: true, head: 'Your first lesson is on us.', accent: 'on us.', sub: 'Link in bio', pose: 'cheer' },
  ],
};
