// Scenes per reel. p = [first, last] voice piece (assemble.py order). Items appear when their key word is spoken
// (at / from / until / labelAt / flipAt = a spoken word). bg 0 = espresso, 1 = deep crimson. *word* = gold accent.
// Quran text: Uthmani + Saheeh International as verified for V12 v2 (Notion item page); hadith: Sahih al-Bukhari 6038.
const SCENES = {
  v7: [
    { p: [0, 0], pose: 'wow', zad: 'right', items: [{ t: 'big', text: 'One *letter…*' },
      { t: 'card', ar: 'قَلْب', label: 'heart', at: 0.35, flipTo: 'كَلْب', flipLabel: 'dog', flipAt: 'dog' }] },
    { p: [1, 2], pose: 'point', zad: 'right', items: [{ t: 'card', ar: 'قَلْب', label: 'qalb · heart', labelAt: 'heart', top: 760 }] },
    { p: [3, 4], pose: 'wow', zad: 'right', items: [{ t: 'card', ar: 'كَلْب', label: 'kalb · dog', labelAt: 'dog', top: 760 }] },
    { p: [5, 5], pose: 'think', zad: 'center', bg: 1, items: [{ t: 'big', text: 'Where your *tongue* hits.' }, { t: 'sub', text: '…and a test at the end', at: 'test', top: 760 }] },
    { p: [6, 7], pose: 'point', bg: 1, items: [{ t: 'kicker', text: 'ك  ·  KAF' }, { t: 'big', text: 'The K you *know.*', size: 'm' }, { t: 'svg', name: 'mouth', from: 'k', to: 'k' }, { t: 'sub', text: 'Light.', at: 'light', top: 690 }] },
    { p: [8, 9], pose: 'think', bg: 1, items: [{ t: 'kicker', text: 'ق  ·  QAF' }, { t: 'big', text: 'Further *back.*', size: 'm' }, { t: 'svg', name: 'mouth', from: 'k', to: 'q', moveAt: 'back' }, { t: 'sub', text: 'Heavy.', at: 'heavy', top: 690 }] },
    { p: [10, 12], pose: 'clap', bg: 1, items: [{ t: 'big', text: 'Say it with *me.*', size: 'm' }, { t: 'svg', name: 'mouth', bounce: ['ك', 'ق'] }, { t: 'sub', text: 'Feel it move back?', at: 'feel', top: 690 }] },
    { p: [13, 14], pose: 'wow', items: [{ t: 'kicker', text: 'TEST TIME' }, { t: 'big', text: 'Heart, or *dog?*', size: 'm' }, { t: 'pill', text: 'heart', at: 'heart', top: 900 }, { t: 'pill', text: 'dog', at: 'dog', top: 1040 }] },
    { p: [15, 15], pose: 'cheer', items: [{ t: 'big', text: 'Your heart is *safe.*', size: 'm' }, { t: 'pill', text: 'heart ✓', at: 0, winAt: 'heart', top: 900 }, { t: 'pill', text: 'dog', at: 0, top: 1040 }] },
    { p: [16, 16], pose: 'cheer', zad: 'center', items: [{ t: 'stamp', text: 'PACKED ✓', at: 0 }, { t: 'big', text: 'Pack your *zaad.*', top: 720, size: 'm' }] },
  ],
  v9: [
    { p: [0, 0], pose: 'wow', zad: 'center', beam: 1, items: [{ t: 'big', text: '*Ten* years.' }, { t: 'sub', text: 'Not one “uff”.', at: 'not', top: 640 }] },
    { p: [1, 1], pose: 'think', zad: 'center', beam: 1, items: [{ t: 'big', text: 'A boy. One man. Ten *whole* years.', size: 'm' }, { t: 'sub', text: '…and never once a sigh.', at: 'never', top: 760 }] },
    { p: [2, 2], pose: 'wow', zad: 'center', items: [{ t: 'big', text: 'Who was *he?*', until: 'first' }, { t: 'big', text: 'How many “uffs” this *week?*', from: 'how', size: 'm' }] },
    { p: [3, 3], pose: 'love', zad: 'center', items: [{ t: 'big', text: 'No *judgment.*' }] },
    { p: [4, 4], pose: 'proud', zad: 'center', bg: 1, beam: 1, items: [{ t: 'kicker', text: 'THE BOY WAS' }, { t: 'big', text: '*Anas.*' }] },
    { p: [5, 6], pose: 'dua', zad: 'right', bg: 1, beam: 1, items: [{ t: 'hadith', ar: 'خَدَمْتُ النَّبِيَّ ﷺ عَشْرَ سِنِينَ، فَمَا قَالَ لِي: أُفٍّ', arFrom: 'خَدَمْتُ', arTo: 'أُفٍّ',
      en: '“I served the Prophet ﷺ for ten years, and he never said ‘uff’ to me.”', enFrom: 'served', top: 640 }, { t: 'src', text: 'SAHIH AL-BUKHARI 6038', at: 'sahih', top: 1250 }] },
    { p: [7, 7], pose: 'love', zad: 'right', items: [{ t: 'svg', name: 'cup', tipAt: 'spill' }, { t: 'sub', text: '“Ugh…”', at: 'spill', strike: 'question', top: 820 }, { t: 'big', text: '“Are you *okay?*”', from: 'are', size: 'm' }] },
    { p: [8, 8], pose: 'think', zad: 'center', beam: 1, items: [{ t: 'big', text: 'Kids forget the spill. They remember the *sigh.*', size: 'm' }] },
    { p: [9, 9], pose: 'cheer', zad: 'center', items: [{ t: 'stamp', text: 'PACKED ✓', at: 0 }, { t: 'big', text: 'Pack your *zaad.*', top: 720, size: 'm' }] },
  ],
  v12: [
    { p: [0, 0], pose: 'wow', zad: 'center', items: [{ t: 'big', text: '*Three* words of the *Quran.*' }, { t: 'sub', text: 'You just don’t know it yet.', at: 'just', top: 760 }] },
    { p: [1, 1], pose: 'think', zad: 'center', items: [{ t: 'kicker', text: 'NUMBER 3' }, { t: 'big', text: 'In every *dua.*' }, { t: 'sub', text: 'Stay for it.', at: 'stay', top: 640 }] },
    { p: [2, 2], pose: 'love', zad: 'right', items: [{ t: 'hadith', ar: 'سَلَـٰمٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ', arFrom: 'yasin', arTo: 'lord', en: '“Peace,” a word from a Merciful Lord.', enFrom: 'yasin', top: 420 },
      { t: 'card', ar: 'سَلَام', label: 'salam · peace', at: 'salam', labelAt: 'peace', top: 960 }, { t: 'src', text: 'YA-SIN 36:58', at: 'yasin', top: 1330 }] },
    { p: [3, 3], pose: 'point', zad: 'right', items: [{ t: 'hadith', ar: 'وَتَوَاصَوْا۟ بِٱلصَّبْرِ', arFrom: 'surah', arTo: 'it', en: '“…and advised each other to patience.”', enFrom: 'alasr', top: 420 },
      { t: 'card', ar: 'صَبْر', label: 'sabr · patience', at: 'sabr', labelAt: 'patience', top: 960 }, { t: 'src', text: 'AL-ASR 103:3', at: 'surah', top: 1330 }] },
    { p: [4, 4], pose: 'dua', zad: 'right', bg: 1, beam: 1, items: [{ t: 'hadith', ar: 'وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ', arFrom: 'we', arTo: 'worlds', en: '“We have not sent you except as a mercy to the worlds.”', enFrom: 'mercy', top: 400 },
      { t: 'card', ar: 'رَحْمَة', label: 'rahmah · mercy', at: 'rahmah', labelAt: 'mercy', top: 1000 }, { t: 'src', text: 'AL-ANBIYA 21:107', at: 'we', top: 1360 }] },
    { p: [5, 5], pose: 'love', zad: 'right', items: [{ t: 'big', text: 'A friend in a *crowd.*', from: 'spotting', size: 'm' }, { t: 'svg', name: 'crowd', lightAt: 'friend' }] },
    { p: [6, 6], pose: 'cheer', items: [{ t: 'big', text: 'Which one do you say *most?*', size: 'm' }, { t: 'pill', text: 'Salam', at: 'which', top: 850 }, { t: 'pill', text: 'Sabr', at: 'say', top: 985 }, { t: 'pill', text: 'Rahmah', at: 'most', top: 1120 }, { t: 'sub', text: 'Pack your zaad.', at: 'pack', top: 1280 }] },
  ],
};
