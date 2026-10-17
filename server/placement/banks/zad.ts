import { q, bi, type SubjectBank } from '../types.js';

// Zad Essentials (أول الزاد), the curriculum's foundations subject (docs/curriculum/PLAN.md §1a):
// belief, purity, prayer and manners. Only points agreed on; no questions where the madhhabs differ.

export const zadEssentials: SubjectBank = {
  beginner: [
    q('Who created you and everything around you?', 'مين خلقك وخلق كل حاجة حواليك؟', bi(['Allah', 'The sun', 'People', 'Nobody, it came by itself'], ['الله', 'الشمس', 'الناس', 'محدش، جت لوحدها']), 'Knowing Allah|معرفة الله'),
    q('What is the name of our Prophet?', 'اسم نبينا إيه؟', bi(['Muhammad ﷺ', 'Musa', 'Nuh', 'Yunus'], ['محمد ﷺ', 'موسى عليه السلام', 'نوح عليه السلام', 'يونس عليه السلام']), 'Our Prophet|نبينا'),
    q('What do we say before we eat?', 'بنقول إيه قبل الأكل؟', ['بِسْمِ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ', 'أَسْتَغْفِرُ اللَّهَ'], 'Manners|الآداب'),
    q('What do we say when we meet a Muslim?', 'بنقول إيه لما نقابل مسلم؟', ['السَّلَامُ عَلَيْكُمْ', 'بِسْمِ اللَّهِ', 'آمِين', 'سُبْحَانَ اللَّهِ'], 'Manners|الآداب'),
    q('How many prayers does a Muslim pray every day?', 'المسلم بيصلي كام صلاة كل يوم؟', ['5', '3', '2', '10'], 'Prayer|الصلاة')
  ],
  elementary: [
    q('How many pillars of Islam are there?', 'أركان الإسلام كام ركن؟', ['5', '6', '3', '4'], 'Pillars of Islam|أركان الإسلام'),
    q('Before we pray, we must make…', 'قبل ما نصلي لازم نعمل…', bi(['Wudu', 'A nap', 'A snack', 'A phone call'], ['الوضوء', 'نوم', 'أكل', 'مكالمة']), 'Purity|الطهارة'),
    q('Which of these breaks wudu?', 'أي حاجة من دول بتنقض الوضوء؟', bi(['Going to the toilet', 'Drinking water', 'Smiling', 'Reading a book'], ['دخول الحمّام (البول أو الغائط)', 'شرب المية', 'الابتسامة', 'قراية كتاب']), 'Purity|الطهارة'),
    q('Which angel brought the Quran to the Prophet ﷺ?', 'أي ملك نزل بالقرآن على النبي ﷺ؟', bi(['Jibril', 'Mika’il', 'Israfil', 'Malik'], ['جبريل عليه السلام', 'ميكائيل عليه السلام', 'إسرافيل عليه السلام', 'مالك']), 'Belief|العقيدة'),
    q('The book Allah sent to Prophet Muhammad ﷺ is…', 'الكتاب اللي ربنا أنزله على سيدنا محمد ﷺ هو…', bi(['The Quran', 'The Tawrah', 'The Injil', 'The Zabur'], ['القرآن الكريم', 'التوراة', 'الإنجيل', 'الزبور']), 'Belief|العقيدة')
  ],
  intermediate: [
    q('What do we say to start the prayer?', 'بنبدأ الصلاة بإيه؟', ['اللَّهُ أَكْبَرُ', 'بِسْمِ اللَّهِ', 'السَّلَامُ عَلَيْكُمْ', 'آمِين'], 'Prayer|الصلاة'),
    q('Which surah do we recite in every rak‘ah?', 'أي سورة بنقرأها في كل ركعة؟', bi(['Al-Fatiha', 'Al-Ikhlas', 'An-Nas', 'Al-Kawthar'], ['الفاتحة', 'الإخلاص', 'الناس', 'الكوثر']), 'Prayer|الصلاة'),
    q('How does the prayer end?', 'الصلاة بتخلص بإيه؟', bi(['With the salam (As-salamu ‘alaykum wa rahmatullah)', 'With takbir', 'With sujud', 'With saying Amin'], ['بالتسليم (السلام عليكم ورحمة الله)', 'بالتكبير', 'بالسجود', 'بقول آمين']), 'Prayer|الصلاة'),
    q('If there is no water for wudu, we…', 'لو مفيش مية للوضوء…', bi(['Make tayammum with clean earth', 'Skip the prayer', 'Wait until tomorrow', 'Pray without purity'], ['نتيمم بالتراب الطاهر', 'نسيب الصلاة', 'نستنى لبكرة', 'نصلي من غير طهارة']), 'Purity|الطهارة'),
    q('How many pillars of Iman (faith) are there?', 'أركان الإيمان كام ركن؟', ['6', '5', '4', '7'], 'Pillars of faith|أركان الإيمان')
  ],
  advanced: [
    q('How many rak‘ahs are the five daily prayers altogether (not travelling)?', 'الصلوات الخمس مع بعض كام ركعة (لغير المسافر)؟', ['17', '15', '20', '12'], 'Prayer|الصلاة'),
    q('Which of these is an obligatory (fard) part of wudu?', 'أي واحدة من دول فرض من فروض الوضوء؟', bi(['Washing the face', 'Saying a du‘a after wudu', 'Drying with a towel', 'Using a miswak'], ['غسل الوجه', 'الدعاء بعد الوضوء', 'التنشيف بالفوطة', 'السواك']), 'Purity|الطهارة'),
    q('The verse that teaches how to make wudu is in Surat…', 'الآية اللي فيها صفة الوضوء في سورة…', bi(['Al-Ma’idah', 'Al-Fatiha', 'Al-Ikhlas', 'Yasin'], ['المائدة', 'الفاتحة', 'الإخلاص', 'يس']), 'Evidence|الدليل'),
    q('Worshipping Allah as if you see Him, knowing that He sees you, is called…', 'إنك تعبد الله كأنك تراه، وتعرف إنه شايفك، اسمه…', bi(['Ihsan', 'Islam', 'Tayammum', 'Hijrah'], ['الإحسان', 'الإسلام', 'التيمم', 'الهجرة']), 'Belief|العقيدة'),
    q('Which is a sound reason (from the mind) that the world has a Creator?', 'أي سبب عقلي صحيح يدل إن للكون خالق؟', bi(['Anything that was made needs a maker, and the world was made', 'Because the world is very big', 'Because our friends say so', 'Because it is very old'], ['كل شيء مصنوع لازم له صانع، والكون مصنوع', 'لأن الكون كبير جدًا', 'لأن أصحابنا بيقولوا كده', 'لأنه قديم جدًا']), 'Reason & evidence|العقل والدليل')
  ]
};
