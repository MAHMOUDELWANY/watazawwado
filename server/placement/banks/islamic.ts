import { q, bi, type SubjectBank } from '../types.js';

// Islamic studies, Fiqh, Aqeedah and Seerah. Only points agreed on by Ahl al-Sunnah wal-Jama'ah;
// no questions on matters where the madhhabs differ.

export const islamicStudies: SubjectBank = {
  beginner: [
    q('How many pillars of Islam are there?', 'كم عدد أركان الإسلام؟', ['5', '6', '4', '7'], 'Pillars|الأركان'),
    q('The first pillar of Islam is…', 'أول ركن من أركان الإسلام…', bi(['The two testimonies of faith (Shahadah)', 'Fasting', 'Hajj', 'Zakah'], ['الشهادتان', 'الصيام', 'الحج', 'الزكاة']), 'Pillars|الأركان'),
    q('Muslims fast in the month of…', 'المسلمون يصومون شهر…', bi(['Ramadan', 'Sha‘ban', 'Muharram', 'Rajab'], ['رمضان', 'شعبان', 'المحرم', 'رجب']), 'Worship|العبادات'),
    q('The last prophet is…', 'خاتم الأنبياء هو…', bi(['Muhammad ﷺ', 'Isa (Jesus)', 'Musa (Moses)', 'Ibrahim'], ['محمد ﷺ', 'عيسى عليه السلام', 'موسى عليه السلام', 'إبراهيم عليه السلام']), 'Prophets|الأنبياء'),
    q('Muslims face which direction in prayer?', 'المسلمون يتجهون في الصلاة إلى…', bi(['The Ka‘bah in Makkah', 'Al-Aqsa', 'The Prophet’s Mosque', 'Any direction'], ['الكعبة في مكة', 'المسجد الأقصى', 'المسجد النبوي', 'أي اتجاه']), 'Worship|العبادات')
  ],
  elementary: [
    q('How many obligatory daily prayers are there?', 'كم عدد الصلوات المفروضة في اليوم؟', ['5', '3', '6', '7'], 'Prayer|الصلاة'),
    q('The holy book revealed to Prophet Muhammad ﷺ is…', 'الكتاب الذي أُنزل على النبي محمد ﷺ…', bi(['The Quran', 'The Tawrah', 'The Injil', 'The Zabur'], ['القرآن الكريم', 'التوراة', 'الإنجيل', 'الزبور']), 'Revealed books|الكتب'),
    q('Eid al-Adha comes during the season of…', 'عيد الأضحى يأتي في موسم…', bi(['Hajj', 'Ramadan', 'The Hijri new year', 'Sha‘ban'], ['الحج', 'رمضان', 'رأس السنة الهجرية', 'شعبان']), 'Islamic calendar|التقويم الإسلامي'),
    q('The night the Quran began to be revealed is…', 'الليلة اللي بدأ فيها نزول القرآن…', bi(['Laylat al-Qadr', 'The night of Isra’', 'The night of Eid', 'The middle of Sha‘ban'], ['ليلة القدر', 'ليلة الإسراء', 'ليلة العيد', 'ليلة النصف من شعبان']), 'Quran|القرآن'),
    q('Which prophet built the Ka‘bah with his son Isma‘il?', 'أي نبي رفع قواعد الكعبة مع ابنه إسماعيل؟', bi(['Ibrahim', 'Nuh', 'Musa', 'Dawud'], ['إبراهيم عليه السلام', 'نوح عليه السلام', 'موسى عليه السلام', 'داود عليه السلام']), 'Prophets|الأنبياء')
  ],
  intermediate: [
    q('The Islamic (Hijri) calendar starts from…', 'التقويم الهجري بيبدأ من…', bi(['The Hijrah to Madinah', 'The Prophet’s birth', 'The first revelation', 'The conquest of Makkah'], ['الهجرة إلى المدينة', 'مولد النبي ﷺ', 'نزول الوحي', 'فتح مكة']), 'Islamic calendar|التقويم الإسلامي'),
    q('The rate of zakah on saved money is…', 'نسبة زكاة المال المدخر…', ['2.5%', '5%', '10%', '20%'], 'Zakah|الزكاة'),
    q('Sunnah in Islamic studies means…', 'السنة في العلوم الشرعية هي…', bi(['What the Prophet ﷺ said, did or approved', 'Only the Quran', 'Scholars’ opinions', 'Local customs'], ['ما أُثر عن النبي ﷺ من قول أو فعل أو تقرير', 'القرآن فقط', 'آراء العلماء', 'العادات المحلية']), 'Sources|المصادر'),
    q('Which two books are the most authentic collections of hadith?', 'أصح كتابين في الحديث…', bi(['Sahih al-Bukhari and Sahih Muslim', 'Al-Muwatta and Musnad Ahmad', 'Sunan Abi Dawud and At-Tirmidhi', 'Riyad as-Salihin and Al-Adhkar'], ['صحيح البخاري وصحيح مسلم', 'الموطأ ومسند أحمد', 'سنن أبي داود والترمذي', 'رياض الصالحين والأذكار']), 'Hadith|الحديث'),
    q('Hajj is obligatory…', 'الحج فرض…', bi(['Once in a lifetime for those able', 'Every year', 'Twice in a lifetime', 'Only for men'], ['مرة في العمر على المستطيع', 'كل سنة', 'مرتين في العمر', 'على الرجال فقط']), 'Hajj|الحج')
  ],
  advanced: [
    q('The four main sources of Islamic rulings are…', 'مصادر التشريع الأربعة المتفق عليها…', bi(['Quran, Sunnah, Ijma‘, Qiyas', 'Quran, Sunnah, custom, reason', 'Quran only', 'Sunnah, Ijma‘, opinion, custom'], ['القرآن والسنة والإجماع والقياس', 'القرآن والسنة والعرف والعقل', 'القرآن فقط', 'السنة والإجماع والرأي والعرف']), 'Sources|المصادر'),
    q('The four well-known Sunni schools of fiqh are…', 'المذاهب الفقهية الأربعة المشهورة…', bi(['Hanafi, Maliki, Shafi‘i, Hanbali', 'Hanafi, Zahiri, Ja‘fari, Maliki', 'Shafi‘i, Awza‘i, Thawri, Hanbali', 'Maliki, Laythi, Hanafi, Tabari'], ['الحنفي والمالكي والشافعي والحنبلي', 'الحنفي والظاهري والجعفري والمالكي', 'الشافعي والأوزاعي والثوري والحنبلي', 'المالكي والليثي والحنفي والطبري']), 'Fiqh schools|المذاهب'),
    q('A "sahih" hadith is one that…', 'الحديث الصحيح هو…', bi(['Has a connected chain of trustworthy, precise narrators, without defect', 'Is narrated by one person only', 'Is famous among people', 'Is found in any book'], ['ما اتصل سنده بنقل العدل الضابط من غير شذوذ ولا علة', 'ما رواه راوٍ واحد', 'المشهور بين الناس', 'أي حديث في كتاب']), 'Hadith|الحديث'),
    q('"Ijma‘" means…', 'الإجماع هو…', bi(['Agreement of the Muslim scholars of an era on a ruling', 'A ruling by one scholar', 'A public vote', 'A local custom'], ['اتفاق مجتهدي الأمة في عصر على حكم شرعي', 'رأي عالم واحد', 'تصويت عام', 'عرف محلي']), 'Sources|المصادر'),
    q('Tafsir is the science of…', 'التفسير هو علم…', bi(['Explaining the meanings of the Quran', 'Reciting the Quran', 'Writing the Mushaf', 'Hadith chains'], ['بيان معاني القرآن الكريم', 'تلاوة القرآن', 'كتابة المصحف', 'أسانيد الحديث']), 'Quranic sciences|علوم القرآن')
  ]
};

export const fiqh: SubjectBank = {
  beginner: [
    q('Wudu (ablution) is needed before…', 'الوضوء شرط قبل…', bi(['Prayer', 'Eating', 'Sleeping', 'Walking to the mosque'], ['الصلاة', 'الأكل', 'النوم', 'المشي للمسجد']), 'Purification|الطهارة'),
    q('How many rak‘ahs is the Fajr prayer?', 'كم ركعة صلاة الفجر؟', ['2', '3', '4', '1'], 'Prayer|الصلاة'),
    q('How many rak‘ahs is the Maghrib prayer?', 'كم ركعة صلاة المغرب؟', ['3', '2', '4', '5'], 'Prayer|الصلاة'),
    q('Fasting in Ramadan is from…', 'الصيام في رمضان من…', bi(['Dawn (Fajr) to sunset', 'Sunrise to sunset', 'Midnight to noon', 'Sunrise to ‘Asr'], ['طلوع الفجر إلى غروب الشمس', 'شروق الشمس إلى غروبها', 'منتصف الليل إلى الظهر', 'الشروق إلى العصر']), 'Fasting|الصيام'),
    q('How many rak‘ahs are the Dhuhr, ‘Asr and ‘Isha prayers (each, not travelling)?', 'كم ركعة الظهر والعصر والعشاء (كل واحدة، لغير المسافر)؟', ['4', '2', '3', '5'], 'Prayer|الصلاة')
  ],
  elementary: [
    q('Tayammum (dry ablution) is allowed when…', 'التيمم يجوز لما…', bi(['There is no water or it cannot be used', 'You are in a hurry', 'The water is cold', 'You are at home'], ['يُفقد الماء أو يتعذر استعماله', 'تكون مستعجل', 'الماء بارد', 'تكون في البيت']), 'Purification|الطهارة'),
    q('Sujud as-sahw is for…', 'سجود السهو يكون…', bi(['Mistakes or forgetfulness in prayer', 'Reciting a verse of prostration', 'Thanking Allah', 'Asking for rain'], ['لجبر نقص أو سهو في الصلاة', 'عند قراءة آية سجدة', 'شكرًا لله', 'للاستسقاء']), 'Prayer|الصلاة'),
    q('Ghusl (full bath) is obligatory after…', 'الغسل واجب بعد…', bi(['Janabah', 'Eating', 'Sleeping briefly', 'Touching a book'], ['الجنابة', 'الأكل', 'النوم القليل', 'لمس كتاب']), 'Purification|الطهارة'),
    q('Zakat al-Fitr is paid…', 'زكاة الفطر بتُخرج…', bi(['Before the Eid prayer at the end of Ramadan', 'At the start of Ramadan only', 'During Hajj', 'Once every two years'], ['قبل صلاة عيد الفطر', 'أول رمضان فقط', 'في الحج', 'كل سنتين']), 'Zakah|الزكاة'),
    q('The Friday (Jumu‘ah) prayer replaces which prayer?', 'صلاة الجمعة بدل أي صلاة؟', bi(['Dhuhr', 'Fajr', '‘Asr', 'Maghrib'], ['الظهر', 'الفجر', 'العصر', 'المغرب']), 'Prayer|الصلاة')
  ],
  intermediate: [
    q('The five categories of rulings (al-ahkam at-taklifiyyah) are…', 'الأحكام التكليفية الخمسة…', bi(['Obligatory, recommended, permissible, disliked, forbidden', 'Valid, invalid, complete, incomplete, void', 'Fard, sunnah, nafl, witr, qada', 'Halal, haram, doubtful, custom, rule'], ['الواجب والمندوب والمباح والمكروه والحرام', 'الصحيح والباطل والتام والناقص والفاسد', 'الفرض والسنة والنفل والوتر والقضاء', 'الحلال والحرام والمشتبه والعرف والقاعدة']), 'Usul basics|أصول الفقه'),
    q('A traveller may shorten four-rak‘ah prayers to…', 'المسافر يجوز له يقصر الصلاة الرباعية إلى…', bi(['2 rak‘ahs', '3 rak‘ahs', '1 rak‘ah', 'He cannot shorten'], ['ركعتين', 'ثلاث ركعات', 'ركعة واحدة', 'لا يجوز القصر']), 'Prayer|الصلاة'),
    q('Someone who misses Ramadan fasts due to illness…', 'اللي فطر في رمضان بسبب مرض…', bi(['Makes them up later', 'Owes nothing', 'Must fast double', 'Must repeat the whole month'], ['يقضي الأيام بعدين', 'لا شيء عليه', 'يصوم الضعف', 'يعيد الشهر كله']), 'Fasting|الصيام'),
    q('Zakah is due on savings when they reach the nisab and…', 'الزكاة بتجب في المال لما يبلغ النصاب و…', bi(['A full lunar year passes', 'A month passes', 'You decide to pay', 'Ramadan comes'], ['يحول عليه الحول (سنة هجرية)', 'يمر شهر', 'تقرر تدفع', 'يدخل رمضان']), 'Zakah|الزكاة'),
    q('Taraweeh is a prayer…', 'صلاة التراويح…', bi(['Prayed at night in Ramadan after ‘Isha', 'Prayed before Fajr all year', 'An obligatory sixth prayer', 'Prayed only on Eid'], ['تُصلى ليلًا في رمضان بعد العشاء', 'تُصلى قبل الفجر طول السنة', 'صلاة مفروضة سادسة', 'تُصلى يوم العيد فقط']), 'Prayer|الصلاة')
  ],
  advanced: [
    q('Qiyas (analogy) means…', 'القياس هو…', bi(['Applying a text’s ruling to a new case sharing its effective cause (‘illah)', 'Following custom', 'A scholar’s personal preference', 'Agreement of scholars'], ['إلحاق فرع بأصل في حكم لعلة جامعة بينهما', 'اتباع العرف', 'رأي شخصي للعالم', 'اتفاق العلماء']), 'Usul al-fiqh|أصول الفقه'),
    q('The legal maxim "Hardship brings ease" (المشقة تجلب التيسير) explains rulings such as…', 'قاعدة "المشقة تجلب التيسير" يُبنى عليها مثلًا…', bi(['Shortening prayer while travelling', 'Zakah on gold', 'The timing of Fajr', 'The number of Eid takbirs'], ['قصر الصلاة في السفر', 'زكاة الذهب', 'وقت الفجر', 'عدد تكبيرات العيد']), 'Legal maxims|القواعد الفقهية'),
    q('"Certainty is not removed by doubt" (اليقين لا يزول بالشك) means that someone sure of having wudu who then doubts…', 'قاعدة "اليقين لا يزول بالشك": اللي متأكد إنه متوضي وبعدين شك…', bi(['Remains in wudu', 'Must make wudu again', 'Must make ghusl', 'Must make tayammum'], ['يبقى على وضوئه', 'يلزمه وضوء جديد', 'يلزمه الغسل', 'يتيمم']), 'Legal maxims|القواعد الفقهية'),
    q('If a pillar (rukn) of the prayer, such as a sajdah, is missed by mistake…', 'لو ركن من أركان الصلاة زي السجدة اتنسى…', bi(['It must still be done; sujud as-sahw alone does not replace it', 'Sujud as-sahw alone is enough', 'Nothing is needed', 'The prayer is always repeated next day'], ['لازم يُؤتى به، وسجود السهو وحده لا يُغني عنه', 'يكفي سجود السهو وحده', 'لا شيء عليه', 'يعيد الصلاة في اليوم التالي']), 'Prayer|الصلاة'),
    q('Riba (usury) in a loan is…', 'الربا في القرض…', bi(['Any agreed extra over the amount lent', 'Allowed if small', 'Allowed between friends', 'A form of charity'], ['كل زيادة مشروطة على أصل القرض', 'جائز لو قليل', 'جائز بين الأصدقاء', 'نوع من الصدقة']), 'Transactions|المعاملات')
  ]
};

export const aqeedah: SubjectBank = {
  beginner: [
    q('How many pillars of Iman (faith) are there?', 'كم عدد أركان الإيمان؟', ['6', '5', '4', '7'], 'Pillars of faith|أركان الإيمان'),
    q('"La ilaha illa Allah" means…', 'معنى "لا إله إلا الله"…', bi(['None is worthy of worship except Allah', 'Allah is great', 'Praise be to Allah', 'Allah is the most merciful'], ['لا معبود بحق إلا الله', 'الله أكبر', 'الحمد لله', 'الله أرحم الراحمين']), 'Tawhid|التوحيد'),
    q('Which angel brought the revelation to the prophets?', 'أي ملك كان ينزل بالوحي على الأنبياء؟', bi(['Jibril', 'Mika’il', 'Israfil', 'Malik'], ['جبريل عليه السلام', 'ميكائيل عليه السلام', 'إسرافيل عليه السلام', 'مالك']), 'Angels|الملائكة'),
    q('Which is NOT one of the pillars of Iman?', 'أي واحد مش من أركان الإيمان؟', bi(['Fasting Ramadan', 'Belief in the angels', 'Belief in the Last Day', 'Belief in divine decree'], ['صوم رمضان', 'الإيمان بالملائكة', 'الإيمان باليوم الآخر', 'الإيمان بالقدر']), 'Pillars of faith|أركان الإيمان'),
    q('Allah is…', 'الله سبحانه وتعالى…', bi(['One, with no partner', 'One of many gods', 'Like His creation', 'Has a child'], ['واحد لا شريك له', 'إله من آلهة كثيرة', 'يشبه خلقه', 'له ولد']), 'Tawhid|التوحيد')
  ],
  elementary: [
    q('The Tawrah was revealed to…', 'التوراة أُنزلت على…', bi(['Musa', 'Isa', 'Dawud', 'Ibrahim'], ['موسى عليه السلام', 'عيسى عليه السلام', 'داود عليه السلام', 'إبراهيم عليه السلام']), 'Revealed books|الكتب'),
    q('The Injil was revealed to…', 'الإنجيل أُنزل على…', bi(['Isa', 'Musa', 'Dawud', 'Nuh'], ['عيسى عليه السلام', 'موسى عليه السلام', 'داود عليه السلام', 'نوح عليه السلام']), 'Revealed books|الكتب'),
    q('The Zabur was given to…', 'الزبور أُوتيه…', bi(['Dawud', 'Sulayman', 'Musa', 'Yusuf'], ['داود عليه السلام', 'سليمان عليه السلام', 'موسى عليه السلام', 'يوسف عليه السلام']), 'Revealed books|الكتب'),
    q('Shirk means…', 'الشرك معناه…', bi(['Associating partners with Allah', 'Forgetting a prayer', 'Being sad', 'Making a mistake in recitation'], ['جعل شريك مع الله', 'نسيان صلاة', 'الحزن', 'الخطأ في التلاوة']), 'Tawhid|التوحيد'),
    q('The hadith that explains Islam, Iman and Ihsan is known as…', 'الحديث اللي شرح الإسلام والإيمان والإحسان اسمه…', bi(['The hadith of Jibril', 'The hadith of intentions', 'The farewell sermon', 'The hadith of the seven shaded'], ['حديث جبريل', 'حديث النية', 'خطبة الوداع', 'حديث السبعة الذين يظلهم الله']), 'Hadith of Jibril|حديث جبريل')
  ],
  intermediate: [
    q('Ihsan is…', 'الإحسان هو…', bi(['To worship Allah as if you see Him; and if you do not see Him, He sees you', 'Giving charity only', 'Praying in congregation', 'Learning Arabic'], ['أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك', 'الصدقة فقط', 'صلاة الجماعة', 'تعلم العربية']), 'Hadith of Jibril|حديث جبريل'),
    q('The "Ulul-‘Azm" (messengers of firm resolve) are…', 'أولو العزم من الرسل…', bi(['Nuh, Ibrahim, Musa, Isa and Muhammad ﷺ', 'Adam, Nuh, Hud, Salih and Lut', 'Yusuf, Ya‘qub, Ishaq, Isma‘il and Ibrahim', 'Dawud, Sulayman, Yunus, Ayyub and Zakariyya'], ['نوح وإبراهيم وموسى وعيسى ومحمد ﷺ', 'آدم ونوح وهود وصالح ولوط', 'يوسف ويعقوب وإسحاق وإسماعيل وإبراهيم', 'داود وسليمان ويونس وأيوب وزكريا']), 'Prophets|الأنبياء'),
    q('Belief in Qadar (divine decree) means…', 'الإيمان بالقدر معناه…', bi(['Allah knows, wrote, wills and creates all things, and people still choose and are accountable', 'People have no will at all', 'Allah does not know the future', 'Only good things are from Allah’s decree'], ['إن الله علم كل شيء وكتبه وشاءه وخلقه، والإنسان مختار ومسؤول عن عمله', 'إن الإنسان مجبور بلا إرادة', 'إن الله لا يعلم المستقبل', 'إن الخير فقط بقدر الله']), 'Divine decree|القدر'),
    q('Which is a sign of the Last Day mentioned in authentic texts?', 'من علامات الساعة الثابتة…', bi(['The sun rising from the west', 'The invention of cars', 'The end of a dynasty', 'A solar eclipse'], ['طلوع الشمس من مغربها', 'اختراع السيارات', 'سقوط دولة', 'كسوف الشمس']), 'Last Day|اليوم الآخر'),
    q('Prophets are protected (ma‘sum) from…', 'الأنبياء معصومون من…', bi(['Errors in conveying the message and from major sins', 'Ever being ill', 'Ever feeling sad', 'Needing food'], ['الخطأ في تبليغ الرسالة ومن الكبائر', 'المرض', 'الحزن', 'الحاجة للطعام']), 'Prophets|الأنبياء')
  ],
  advanced: [
    q('Ahl al-Sunnah affirm Allah’s names and attributes…', 'أهل السنة يثبتون أسماء الله وصفاته…', bi(['As befits His majesty, without likening Him to creation or denying them', 'Like human attributes', 'By denying all attributes', 'Only those reason can prove'], ['على ما يليق بجلاله من غير تشبيه ولا تعطيل', 'كصفات البشر', 'بنفي كل الصفات', 'ما أثبته العقل فقط']), 'Names & attributes|الأسماء والصفات'),
    q('"Laysa kamithlihi shay’" (There is nothing like Him) is from…', '"ليس كمثله شيء" آية من سورة…', bi(['Ash-Shura', 'Al-Ikhlas', 'Al-Baqarah', 'Al-Hadid'], ['الشورى', 'الإخلاص', 'البقرة', 'الحديد']), 'Names & attributes|الأسماء والصفات'),
    q('Belief in the questioning, bliss and punishment of the grave is part of belief in…', 'الإيمان بسؤال القبر ونعيمه وعذابه جزء من الإيمان بـ…', bi(['The Last Day', 'The angels only', 'The revealed books', 'Divine decree only'], ['اليوم الآخر', 'الملائكة فقط', 'الكتب', 'القدر فقط']), 'Last Day|اليوم الآخر'),
    q('A Muslim who commits a major sin (without considering it lawful)…', 'المسلم اللي ارتكب كبيرة (من غير ما يستحلها)…', bi(['Remains a Muslim, and his matter is with Allah', 'Leaves Islam', 'Is in Hell forever', 'Has no sin'], ['مسلم ناقص الإيمان وأمره إلى الله', 'يخرج من الإسلام', 'مخلد في النار', 'لا ذنب عليه']), 'Faith|الإيمان'),
    q('The intercession (shafa‘ah) on the Day of Judgement is…', 'الشفاعة يوم القيامة…', bi(['True, by Allah’s permission for whom He is pleased with', 'Not real', 'For anyone, without permission', 'Only for angels'], ['حق بإذن الله لمن يرضى عنه', 'غير ثابتة', 'لكل أحد بغير إذن', 'للملائكة فقط']), 'Last Day|اليوم الآخر')
  ]
};

export const seerah: SubjectBank = {
  beginner: [
    q('The Prophet Muhammad ﷺ was born in…', 'وُلد النبي ﷺ في…', bi(['Makkah', 'Madinah', 'Jerusalem', 'Ta’if'], ['مكة', 'المدينة', 'القدس', 'الطائف']), 'Early life|النشأة'),
    q('The Prophet’s mother was…', 'أم النبي ﷺ هي…', bi(['Aminah bint Wahb', 'Khadijah', 'Halimah', 'Fatimah'], ['آمنة بنت وهب', 'خديجة', 'حليمة السعدية', 'فاطمة']), 'Early life|النشأة'),
    q('The first wife of the Prophet ﷺ was…', 'أول زوجات النبي ﷺ…', bi(['Khadijah', '‘A’ishah', 'Hafsah', 'Sawdah'], ['خديجة رضي الله عنها', 'عائشة رضي الله عنها', 'حفصة رضي الله عنها', 'سودة رضي الله عنها']), 'Family|آل البيت'),
    q('The first revelation came in the cave of…', 'أول نزول للوحي كان في غار…', bi(['Hira’', 'Thawr', 'Uhud', 'Safa'], ['حراء', 'ثور', 'أحد', 'الصفا']), 'Revelation|الوحي'),
    q('The first word revealed was…', 'أول كلمة نزلت…', ['اقرأ', 'قل', 'الحمد', 'يا أيها'], 'Revelation|الوحي')
  ],
  elementary: [
    q('The Prophet ﷺ was born in the Year of…', 'وُلد النبي ﷺ في عام…', bi(['The Elephant', 'Sorrow', 'The Hijrah', 'Delegations'], ['الفيل', 'الحزن', 'الهجرة', 'الوفود']), 'Early life|النشأة'),
    q('His wet-nurse in the desert was…', 'مرضعته في البادية…', bi(['Halimah as-Sa‘diyyah', 'Aminah', 'Khadijah', 'Umm Salamah'], ['حليمة السعدية', 'آمنة', 'خديجة', 'أم سلمة']), 'Early life|النشأة'),
    q('Who accompanied the Prophet ﷺ on the Hijrah?', 'مين رافق النبي ﷺ في الهجرة؟', bi(['Abu Bakr', '‘Umar', '‘Ali', '‘Uthman'], ['أبو بكر الصديق', 'عمر بن الخطاب', 'علي بن أبي طالب', 'عثمان بن عفان']), 'Hijrah|الهجرة'),
    q('The first mosque built in Islam was…', 'أول مسجد بُني في الإسلام…', bi(['Quba’', 'The Prophet’s Mosque', 'Al-Aqsa', 'Al-Haram'], ['مسجد قباء', 'المسجد النبوي', 'المسجد الأقصى', 'المسجد الحرام']), 'Hijrah|الهجرة'),
    q('The Prophet’s ﷺ grandfather who cared for him was…', 'جده اللي كفله…', bi(['‘Abd al-Muttalib', 'Abu Talib', 'Hashim', 'Al-‘Abbas'], ['عبد المطلب', 'أبو طالب', 'هاشم', 'العباس']), 'Early life|النشأة')
  ],
  intermediate: [
    q('The first major battle of Islam was…', 'أول غزوة كبرى في الإسلام…', bi(['Badr', 'Uhud', 'Al-Khandaq', 'Hunayn'], ['بدر', 'أحد', 'الخندق', 'حنين']), 'Battles|الغزوات'),
    q('The Battle of Badr was in the year…', 'غزوة بدر كانت في السنة…', bi(['2 AH', '3 AH', '5 AH', '8 AH'], ['الثانية للهجرة', 'الثالثة للهجرة', 'الخامسة للهجرة', 'الثامنة للهجرة']), 'Battles|الغزوات'),
    q('The "Year of Sorrow" is when the Prophet ﷺ lost…', '"عام الحزن" هو العام اللي توفي فيه…', bi(['Khadijah and Abu Talib', 'His mother and father', '‘Abd al-Muttalib and Aminah', 'Hamzah and Ja‘far'], ['خديجة وأبو طالب', 'أمه وأبوه', 'عبد المطلب وآمنة', 'حمزة وجعفر']), 'Makkan period|العهد المكي'),
    q('The trench (Al-Khandaq) was dug on the advice of…', 'فكرة حفر الخندق كانت من…', bi(['Salman al-Farisi', 'Abu Bakr', 'Khalid ibn al-Walid', 'Bilal'], ['سلمان الفارسي', 'أبو بكر', 'خالد بن الوليد', 'بلال']), 'Battles|الغزوات'),
    q('The conquest of Makkah was in…', 'فتح مكة كان في…', bi(['8 AH', '6 AH', '10 AH', '2 AH'], ['السنة الثامنة للهجرة', 'السادسة', 'العاشرة', 'الثانية']), 'Madinan period|العهد المدني')
  ],
  advanced: [
    q('The Treaty of Hudaybiyyah was in…', 'صلح الحديبية كان في…', bi(['6 AH', '4 AH', '8 AH', '9 AH'], ['السنة السادسة للهجرة', 'الرابعة', 'الثامنة', 'التاسعة']), 'Madinan period|العهد المدني'),
    q('The Farewell Hajj was in…', 'حجة الوداع كانت في…', bi(['10 AH', '9 AH', '8 AH', '11 AH'], ['السنة العاشرة للهجرة', 'التاسعة', 'الثامنة', 'الحادية عشرة']), 'Madinan period|العهد المدني'),
    q('The first migration of Muslims (before the Hijrah to Madinah) was to…', 'أول هجرة للمسلمين (قبل الهجرة للمدينة) كانت إلى…', bi(['Abyssinia (Habashah)', 'Ta’if', 'Yemen', 'Sham'], ['الحبشة', 'الطائف', 'اليمن', 'الشام']), 'Makkan period|العهد المكي'),
    q('The pledge in which the people of Madinah promised to protect the Prophet ﷺ was…', 'البيعة اللي تعهد فيها أهل المدينة بحماية النبي ﷺ…', bi(['The second pledge of ‘Aqabah', 'The pledge of Ridwan', 'The pledge of Abu Bakr', 'The pact of Fudul'], ['بيعة العقبة الثانية', 'بيعة الرضوان', 'بيعة أبي بكر', 'حلف الفضول']), 'Hijrah|الهجرة'),
    q('The Prophet ﷺ passed away in…', 'توفي النبي ﷺ في…', bi(['11 AH, aged 63', '10 AH, aged 60', '12 AH, aged 65', '9 AH, aged 61'], ['السنة الحادية عشرة للهجرة عن 63 عامًا', 'العاشرة عن 60 عامًا', 'الثانية عشرة عن 65 عامًا', 'التاسعة عن 61 عامًا']), 'Madinan period|العهد المدني')
  ]
};
