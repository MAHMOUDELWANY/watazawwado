// Curriculum lessons are data (docs/curriculum/PLAN.md §4.7). The player renders them; content never lives in components.

export type SceneId =
  // Literacy look options (plan Task 3; removed after the owner's pick)
  | 'lkA1' | 'lkA2' | 'lkB1' | 'lkB2' | 'lkC1' | 'lkC2'
  // Literacy B · Lesson 1 (all drawn in code, slides/motion/g-lb1.tsx)
  // Literacy A · Kids · Lesson 1 and Fusha · Kids · Lesson 1 (drawn in code)
  | 'lawCover' | 'lawTrain' | 'lawSign' | 'lawWorld' | 'lawRtl' | 'law28' | 'lawHands' | 'lawDots' | 'lawMarks' | 'lawSounds' | 'lawAlif' | 'lawTrue' | 'lawRead' | 'lawStamp' | 'lawNext'
  | 'lwtCover' | 'lwtCity' | 'lwtMessage' | 'lwtWorld' | 'lwtRtl' | 'lwt28' | 'lwtHands' | 'lwtDots' | 'lwtMarks' | 'lwtSounds' | 'lwtAlif' | 'lwtTrue' | 'lwtRead' | 'lwtBlock' | 'lwtNext'
  | 'lwaCover' | 'lwaMap' | 'lwaSign' | 'lwaWorld' | 'lwaRtl' | 'lwa28' | 'lwaHands' | 'lwaDots' | 'lwaMarks' | 'lwaSounds' | 'lwaAlif' | 'lwaTrue' | 'lwaRead' | 'lwaMilestone' | 'lwaNext'
  | 'la1Cover' | 'la1Note' | 'la1Guess' | 'la1Alif' | 'la1Baa' | 'la1Taa' | 'la1Thaa' | 'la1Trick' | 'la1Find' | 'la1Sort' | 'la1Word' | 'la1Mission' | 'la1Next'
  // Literacy A · Lesson 3, all three ages (slides/motion/g-la3.tsx)
  | 'la3Cover' | 'la3Note' | 'la3Guess' | 'la3Haa' | 'la3Jeem' | 'la3Khaa' | 'la3Trick' | 'la3Find' | 'la3Sort' | 'la3Word' | 'la3Mission' | 'la3Next'
  | 'lq3Cover' | 'lq3Message' | 'lq3Cups' | 'lq3Haa' | 'lq3Hooks' | 'lq3Rule' | 'lq3Find' | 'lq3Sort' | 'lq3Words' | 'lq3Mission' | 'lq3Next'
  | 'lt3Cover' | 'lt3Message' | 'lt3Cups' | 'lt3Haa' | 'lt3Hooks' | 'lt3Rule' | 'lt3Find' | 'lt3Sort' | 'lt3Words' | 'lt3Mission' | 'lt3Next'
  | 'fk1Cover' | 'fk1Game' | 'fk1Story' | 'fk1Haadha' | 'fk1Maa' | 'fk1Man' | 'fk1Words' | 'fk1Talk' | 'fk1Spot' | 'fk1Sort' | 'fk1Mission' | 'fk1Next'
  // English · Kids · Lesson 1 (drawn in code, slides/motion/g-en1.tsx)
  | 'en1Cover' | 'en1Garden' | 'en1S' | 'en1A' | 'en1T' | 'en1Blend' | 'en1Find' | 'en1Sort' | 'en1Read' | 'en1Mission' | 'en1Next'
  // Quran Reading · Lesson 1 (drawn in code, slides/motion/g-qr1.tsx)
  | 'qr1Cover' | 'qr1Seventeen' | 'qr1Moves' | 'qr1Ayah1' | 'qr1Ayah2' | 'qr1Ayah4' | 'qr1Ayah5' | 'qr1Ayah6' | 'qr1Review' | 'qr1Read' | 'qr1Mission' | 'qr1Next'
  // Tajweed · Level 1 · Lesson 1 (drawn in code, slides/motion/g-tj1.tsx)
  | 'tj1Cover' | 'tj1Qalb' | 'tj1Tarteel' | 'tj1Right' | 'tj1Stumble' | 'tj1Mistakes' | 'tj1Layers' | 'tj1Istiadha' | 'tj1Basmalah' | 'tj1Review' | 'tj1Recite' | 'tj1Mission' | 'tj1Next'
  // Literacy A · Adults · Lesson 1 (drawn in code, slides/motion/g-lt1.tsx)
  | 'lt1Cover' | 'lt1Sign' | 'lt1Guess' | 'lt1Alif' | 'lt1Baa' | 'lt1Taa' | 'lt1Thaa' | 'lt1System' | 'lt1Find' | 'lt1Review' | 'lt1Word' | 'lt1Mission' | 'lt1Next'
  // Literacy C · Reading Franco · Lesson 1 (slides/motion/g-lc1.tsx)
  | 'lc1Cover' | 'lc1Message' | 'lc1Why' | 'lc1What' | 'lc1Plain' | 'lc1Ayn' | 'lc1Ha' | 'lc1Pairs' | 'lc1Read' | 'lc1Review' | 'lc1Reply' | 'lc1Mission' | 'lc1Next'
  // Literacy C · Reading Franco · Lesson 2 (slides/motion/g-lc2.tsx)
  | 'lc2Cover' | 'lc2Message' | 'lc2Stop' | 'lc2Qaf' | 'lc2Pairs' | 'lc2El' | 'lc2Read' | 'lc2Review' | 'lc2Reply' | 'lc2Mission' | 'lc2Next'
  // Egyptian Arabic · Adults · Lesson 2 (slides/motion/g-ea2.tsx)
  | 'ea2Cover' | 'ea2Stairs' | 'ea2Listen' | 'ea2Minen' | 'ea2Countries' | 'ea2Masri' | 'ea2Endings' | 'ea2Gim' | 'ea2Polite' | 'ea2Review' | 'ea2Talk' | 'ea2Mission' | 'ea2Next'
  // Egyptian Arabic · Adults · Lesson 3 (slides/motion/g-ea3.tsx)
  | 'ea3Cover' | 'ea3Plate' | 'ea3Listen' | 'ea3DaDi' | 'ea3Ta' | 'ea3Flat' | 'ea3People' | 'ea3Recap' | 'ea3Sort' | 'ea3Talk' | 'ea3Mission' | 'ea3Next'
  // Fusha · Kids · Lesson 2 (slides/motion/g-fk2.tsx)
  | 'fk2Cover' | 'fk2Recall' | 'fk2Box' | 'fk2Story' | 'fk2Hamza' | 'fk2Yes' | 'fk2Animals' | 'fk2Shadow' | 'fk2Sort' | 'fk2Talk' | 'fk2Mission' | 'fk2Next'
  // Fusha · Kids · Lesson 3 (slides/motion/g-fk3.tsx)
  | 'fk3Cover' | 'fk3Recall' | 'fk3Park' | 'fk3Story' | 'fk3Near' | 'fk3Questions' | 'fk3Words' | 'fk3Sort' | 'fk3Talk' | 'fk3Mission' | 'fk3Next'
  // Fusha · 12+ · Lesson 2 (slides/motion/g-ft2.tsx)
  | 'ft2Cover' | 'ft2Phone' | 'ft2Dark' | 'ft2Hamza' | 'ft2Answers' | 'ft2Words' | 'ft2Torch' | 'ft2Sort' | 'ft2Chain' | 'ft2Talk' | 'ft2Mission' | 'ft2Next'
  // Fusha · 12+ · Lesson 3 (slides/motion/g-ft3.tsx)
  | 'ft3Cover' | 'ft3Roof' | 'ft3Listen' | 'ft3Far' | 'ft3Tilka' | 'ft3Grid' | 'ft3Words' | 'ft3Sort' | 'ft3Talk' | 'ft3Mission' | 'ft3Next'
  // Literacy B · Lesson 2 (slides/motion/g-lb2.tsx)
  | 'lb2Cover' | 'lb2Recall' | 'lb2Fast' | 'lb2Stand' | 'lb2Claps' | 'lb2Hadha' | 'lb2Waw' | 'lb2Yaa' | 'lb2Spot' | 'lb2Sort' | 'lb2Along' | 'lb2Mission' | 'lb2Next'
  // Literacy B · Lesson 3 (slides/motion/g-lb3.tsx)
  | 'lb3Cover' | 'lb3Recall' | 'lb3Mystery' | 'lb3Zero' | 'lb3Group' | 'lb3Asr' | 'lb3Ana' | 'lb3Spot' | 'lb3Sort' | 'lb3Along' | 'lb3Mission' | 'lb3Next'
  // Quran Reading · Lesson 2 (slides/motion/g-qr2.tsx)
  | 'qr2Cover' | 'qr2Warm' | 'qr2Shadda' | 'qr2Nas1' | 'qr2Nas4' | 'qr2Rhyme' | 'qr2Falaq1' | 'qr2Falaq4' | 'qr2Review' | 'qr2Read' | 'qr2Mission' | 'qr2Next'
  // Quran Reading · Lesson 3 (slides/motion/g-qr3.tsx)
  | 'qr3Cover' | 'qr3Warm' | 'qr3Tanween' | 'qr3Ikhlas1' | 'qr3Ikhlas3' | 'qr3Stop' | 'qr3Masad1' | 'qr3Masad4' | 'qr3Review' | 'qr3Read' | 'qr3Mission' | 'qr3Next'
  // Tajweed · Level 2 · Lesson 1 (slides/motion/g-tm1.tsx)
  | 'tm1Cover' | 'tm1Pairs' | 'tm1Listen' | 'tm1Find' | 'tm1Five' | 'tm1Jawf' | 'tm1Halq' | 'tm1Lisan' | 'tm1LipsNose' | 'tm1Fatiha' | 'tm1Sort' | 'tm1Recite' | 'tm1Mission' | 'tm1Next'
  // Tajweed · Level 2 · Lesson 2 (slides/motion/g-tm2.tsx)
  | 'tm2Cover' | 'tm2Recall' | 'tm2Floors' | 'tm2Deep' | 'tm2Mid' | 'tm2Near' | 'tm2Pattern' | 'tm2Meaning' | 'tm2Slips' | 'tm2Sort' | 'tm2Voice' | 'tm2Recite' | 'tm2Mission' | 'tm2Next'
  // Tajweed · Level 2 · Lesson 3 (slides/motion/g-tm3.tsx)
  | 'tm3Cover' | 'tm3Recall' | 'tm3Zoom' | 'tm3Qaf' | 'tm3Kaf' | 'tm3Bounce' | 'tm3Ikhlas' | 'tm3Slips' | 'tm3Sort' | 'tm3Recite' | 'tm3Mission' | 'tm3Next'
  // Tajweed · Level 3 · Lesson 1 (slides/motion/g-tr1.tsx)
  | 'tr1Cover' | 'tr1Ruler' | 'tr1Causes' | 'tr1Natural' | 'tr1Hamza' | 'tr1Sukoon' | 'tr1Small' | 'tr1Ranked' | 'tr1Evidence' | 'tr1Sort' | 'tr1Six' | 'tr1Recite' | 'tr1Mission' | 'tr1Next'
  // Tajweed · Level 3 · Lesson 2 (slides/motion/g-tr2.tsx)
  | 'tr2Cover' | 'tr2Breath' | 'tr2Know' | 'tr2Four' | 'tr2Complete' | 'tr2Good' | 'tr2Wrong' | 'tr2Start' | 'tr2Signs' | 'tr2Sort' | 'tr2Recite' | 'tr2Mission' | 'tr2Next'
  // Tajweed · Level 3 · Lesson 3 (slides/motion/g-tr3.tsx)
  | 'tr3Cover' | 'tr3Weights' | 'tr3Vowel' | 'tr3Before' | 'tr3Stop' | 'tr3Same' | 'tr3Wasl' | 'tr3Istila' | 'tr3Both' | 'tr3Sort' | 'tr3Recite' | 'tr3Mission' | 'tr3Next'
  // Fusha · Level 2 · Lesson 1, Kids (fv1) and 12+ (fw1) (slides/motion/g-fv1.tsx)
  | 'fv1Cover' | 'fv1Saturday' | 'fv1Story' | 'fv1Ending' | 'fv1You' | 'fv1Many' | 'fv1Eight' | 'fv1Verbs' | 'fv1Sort' | 'fv1Talk' | 'fv1Mission' | 'fv1Next'
  | 'fw1Cover' | 'fw1Monday' | 'fw1Story' | 'fw1One' | 'fw1Group' | 'fw1Eight' | 'fw1Verbs' | 'fw1Sort' | 'fw1Talk' | 'fw1Mission' | 'fw1Next'
  // Fusha · Level 2 · Lesson 2 (slides/motion/g-fv2.tsx): Kids fv2, 12+ fw2
  | 'fv2Cover' | 'fv2Recall' | 'fv2Monday' | 'fv2Story' | 'fv2I' | 'fv2HeShe' | 'fv2We' | 'fv2Front' | 'fv2Verbs' | 'fv2Sort' | 'fv2Talk' | 'fv2Mission' | 'fv2Next'
  | 'fw2Cover' | 'fw2Week' | 'fw2Story' | 'fw2Letters' | 'fw2One' | 'fw2Many' | 'fw2Both' | 'fw2Pairs' | 'fw2Sort' | 'fw2Talk' | 'fw2Mission' | 'fw2Next'
  // Fusha · Level 2 · Lesson 3 (slides/motion/g-fv3.tsx): Kids fv3, 12+ fw3
  | 'fv3Cover' | 'fv3Recall' | 'fv3Album' | 'fv3Story' | 'fv3Father' | 'fv3Brother' | 'fv3After' | 'fv3Kunya' | 'fv3Dhu' | 'fv3Sort' | 'fv3Talk' | 'fv3Mission' | 'fv3Next'
  | 'fw3Cover' | 'fw3Break' | 'fw3Story' | 'fw3Five' | 'fw3U' | 'fw3A' | 'fw3I' | 'fw3Jobs' | 'fw3Kunya' | 'fw3Sort' | 'fw3Talk' | 'fw3Mission' | 'fw3Next'
  // Tajweed · Lesson 2 (slides/motion/g-tj2.tsx)
  | 'tj2Cover' | 'tj2Recall' | 'tj2Five' | 'tj2Why' | 'tj2Small' | 'tj2Big' | 'tj2Biggest' | 'tj2Mistakes' | 'tj2Spot' | 'tj2Review' | 'tj2Recite' | 'tj2Mission' | 'tj2Next'
  // Tajweed · Lesson 3 (slides/motion/g-tj3.tsx)
  | 'tj3Cover' | 'tj3Recall' | 'tj3Doors' | 'tj3Throat' | 'tj3Izhar' | 'tj3Tanween' | 'tj3Why' | 'tj3Mushaf' | 'tj3Mistakes' | 'tj3Spot' | 'tj3Review' | 'tj3Recite' | 'tj3Mission' | 'tj3Next'
  // Egyptian Arabic · Adults · Lesson 1 (drawn in code, slides/motion/g-ea1.tsx)
  | 'ea1Cover' | 'ea1Book' | 'ea1Door' | 'ea1Pairs' | 'ea1Eh' | 'ea1Mona' | 'ea1Suffix' | 'ea1Hadra' | 'ea1Sorry' | 'ea1Bye' | 'ea1Review' | 'ea1Talk' | 'ea1Mission' | 'ea1Next'
  // Fusha · 12+ · Lesson 1 (drawn in code, slides/motion/g-ft1.tsx)
  | 'ft1Cover' | 'ft1Arrive' | 'ft1Listen' | 'ft1Haadhihi' | 'ft1MaaMan' | 'ft1NoIs' | 'ft1Words' | 'ft1Sort' | 'ft1Talk' | 'ft1Mission' | 'ft1Next'
  // Literacy A · Teens · Lesson 1 (drawn in code, slides/motion/g-lq1.tsx)
  | 'lq1Cover' | 'lq1Message' | 'lq1Guess' | 'lq1Alif' | 'lq1Three' | 'lq1Speed' | 'lq1Rule' | 'lq1Sort' | 'lq1Word' | 'lq1Write' | 'lq1Mission' | 'lq1Next'
  // Egyptian Arabic · Kids · Lesson 1 (drawn in code, slides/motion/g-egy.tsx)
  | 'ek1Cover' | 'ek1Door' | 'ek1Listen' | 'ek1Hello' | 'ek1Ismi' | 'ek1AkIk' | 'ek1Bye' | 'ek1Sort' | 'ek1Talk' | 'ek1Mission' | 'ek1Next'
  | 'ek2Cover' | 'ek2Question' | 'ek2Listen' | 'ek2Minen' | 'ek2Map' | 'ek2Masri' | 'ek2Sort' | 'ek2Talk' | 'ek2Mission' | 'ek2Next'
  | 'ek3Cover' | 'ek3Box' | 'ek3Listen' | 'ek3DaDi' | 'ek3Ta' | 'ek3Things' | 'ek3Sort' | 'ek3Talk' | 'ek3Mission' | 'ek3Next'
  // Egyptian Arabic · Teens · Lesson 1 (drawn in code, slides/motion/g-egy.tsx)
  | 'et1Cover' | 'et1Club' | 'et1Listen' | 'et1How' | 'et1Ending' | 'et1Hi' | 'et1Names' | 'et1Sort' | 'et1Talk' | 'et1Mission' | 'et1Next'
  | 'et2Cover' | 'et2Shirt' | 'et2Listen' | 'et2Minen' | 'et2Asl' | 'et2Nat' | 'et2Sort' | 'et2Talk' | 'et2Mission' | 'et2Next'
  | 'et3Cover' | 'et3Bag' | 'et3Listen' | 'et3DaDi' | 'et3Ta' | 'et3Stuff' | 'et3Sort' | 'et3Talk' | 'et3Mission' | 'et3Next'
  // English · General · Lesson 1 (drawn in code, slides/motion/g-eng.tsx)
  | 'eg1Cover' | 'eg1Cafe' | 'eg1Listen' | 'eg1Im' | 'eg1Youre' | 'eg1Name' | 'eg1Bye' | 'eg1Sort' | 'eg1Talk' | 'eg1Mission' | 'eg1Next'
  // English · Exams · Lesson 1 (drawn in code, slides/motion/g-eng.tsx)
  | 'ex1Cover' | 'ex1Short' | 'ex1Bands' | 'ex1Part1' | 'ex1Are' | 'ex1Length' | 'ex1Link' | 'ex1Sort' | 'ex1Timed' | 'ex1Mission' | 'ex1Next'
  // Seerah · Kids · Episode 1 (drawn in code, slides/motion/g-sk1.tsx)
  | 'sk1Cover' | 'sk1Makkah' | 'sk1Abraha' | 'sk1Scales' | 'sk1March' | 'sk1Hills' | 'sk1Kneel' | 'sk1Birds' | 'sk1Fil' | 'sk1Sort' | 'sk1Baby' | 'sk1Mission' | 'sk1Next'
  // Seerah · Teens & Adults · Episode 1 (the owner's stills + code motion)
  | 'se1Cover' | 'se1Empires' | 'se1Jahiliyyah' | 'se1Makkah' | 'se1Abraha' | 'se1Qullays' | 'se1Scales' | 'se1March' | 'se1Camp' | 'se1Walk' | 'se1Tent' | 'se1Trust' | 'se1Kneel' | 'se1Spear' | 'se1Birds' | 'se1Fil' | 'se1Aftermath' | 'se1Sort' | 'se1Cradle' | 'se1Mission' | 'se1Next'
  | 'se4Cover' | 'se4Market' | 'se4Rope' | 'se4Route' | 'se4Busra' | 'se4Cell' | 'se4Cloud' | 'se4Feast' | 'se4Door' | 'se4Scrolls' | 'se4Pass' | 'se4Lantern' | 'se4Book' | 'se4Fork' | 'se4Wallet' | 'se4Sort' | 'se4Mission' | 'se4Next' | 'sk4Cover' | 'sk4Yard' | 'sk4Road' | 'sk4Monastery' | 'sk4Cloud' | 'sk4Tree' | 'sk4Feast' | 'sk4Ask' | 'sk4Door' | 'sk4Mercy' | 'sk4Back' | 'sk4Sort' | 'sk4Mission' | 'sk4Next'
  | 'se2Cover' | 'se2Custom' | 'se2Drought' | 'se2Caravan' | 'se2Night' | 'se2Passed' | 'se2Lanes' | 'se2Doorway' | 'se2Harith' | 'se2Milk' | 'se2Donkey' | 'se2Green' | 'se2Seed' | 'se2Haze' | 'se2Hills' | 'se2Basin' | 'se2Vessel' | 'se2Sort' | 'se2Mission' | 'se2Next' | 'se3Cover' | 'se3Home' | 'se3Journey' | 'se3Palms' | 'se3Tent' | 'se3Footprints' | 'se3WayHome' | 'se3Mattress' | 'se3Wall' | 'se3Staff' | 'se3Chain' | 'se3Uncle' | 'se3Clouds' | 'se3Rain' | 'se3Duha' | 'se3Grave' | 'se3Shoulder' | 'se3Sort' | 'se3Mission' | 'se3Next' | 'sk2Cover' | 'sk2Dry' | 'sk2Trip' | 'sk2Town' | 'sk2Ask' | 'sk2Door' | 'sk2Milk' | 'sk2Race' | 'sk2Green' | 'sk2Hills' | 'sk2Basin' | 'sk2Sort' | 'sk2Mission' | 'sk2Next' | 'sk3Cover' | 'sk3Journey' | 'sk3Palms' | 'sk3Tent' | 'sk3Ask' | 'sk3Rug' | 'sk3Staff' | 'sk3Home' | 'sk3Clouds' | 'sk3Rain' | 'sk3Duha' | 'sk3Sort' | 'sk3Mission' | 'sk3Next'
  | 'lbCover' | 'lbStuck' | 'lbGuess' | 'lbBest' | 'lbMap' | 'lbCircle' | 'lbHelpers' | 'lbUthman' | 'lbSpot' | 'lbSort' | 'lbAlong' | 'lbMission' | 'lbNext'
  | 'chalkboard'
  | 'doorsHero'
  | 'jiddo'
  | 'madinah'
  | 'stranger'
  | 'sitting'
  | 'pillars'
  | 'roots'
  | 'drawing'
  | 'reveal'
  | 'doors'
  | 'backpack'
  | 'lego'
  // Lesson 2 (paintings in public/curriculum/zad-kids/l02; threeWays and castleClues are drawn in code)
  | 'threeWays'
  | 'castleClues'
  | 'window'
  | 'hand'
  | 'baby'
  | 'desert'
  | 'crash'
  | 'sky'
  | 'lock'
  | 'look'
  | 'camel'
  | 'park'
  | 'boat'
  // Lesson 3 (paintings in public/curriculum/zad-kids/l03; twoCaptains, orbits, shahada, oneHeart, starPieces and needs
  // are drawn in code)
  | 'oneSun'
  | 'twoCaptains'
  | 'sunrise'
  | 'orbits'
  | 'shahada'
  | 'oneHeart'
  | 'recite'
  | 'starPieces'
  | 'needs'
  | 'masjidNight'
  | 'dua'
  | 'football'
  // Teens Lesson 1 (anime look, docs/curriculum/style/teens.md; paintings arrive at the built-pages step)
  | 'tDoors'
  | 'tCanteen'
  | 'tWhyList'
  | 'tMadinah'
  | 'tStranger'
  | 'tSitting'
  | 'tPillars'
  | 'tTruth'
  | 'tSix'
  | 'tIhsan'
  | 'tReveal'
  | 'tFathers'
  | 'tKnowWhy'
  | 'tNight'
  | 'tNext'
  // Teens Lesson 2 (paintings in public/curriculum/zad-teens/l02; tl2Chain, tl2Expand, tl2Three, tl2Tur, tl2Yaqeen and
  // tl2First are drawn in code)
  | 'tl2Cover'
  | 'tl2Science'
  | 'tl2Chain'
  | 'tl2Expand'
  | 'tl2Three'
  | 'tl2Tur'
  | 'tl2Yaqeen'
  | 'tl2Kitchen'
  | 'tl2Fitrah'
  | 'tl2First'
  | 'tl2Pitch'
  | 'tl2Bench'
  | 'tl2Gaming'
  // Teens Lesson 3 (paintings in public/curriculum/zad-teens/l03; tl3Orbits and tl3Shahada reuse the Kids Lesson 3 scenes;
  // tl3Recall, tl3Bosses, tl3Team, tl3Hawa, tl3Ikhlas, tl3Loved and tl3Center are drawn in code)
  | 'tl3Cover'
  | 'tl3Recall'
  | 'tl3Gaming'
  | 'tl3Bosses'
  | 'tl3Team'
  | 'tl3Orbits'
  | 'tl3Shahada'
  | 'tl3Likes'
  | 'tl3Hawa'
  | 'tl3Ikhlas'
  | 'tl3Loved'
  | 'tl3Center'
  | 'tl3Prayer'
  | 'tl3Library'
  // Adults Lesson 1 (documentary look, docs/curriculum/style/adults.md; paintings and code scenes arrive at the
  // built-pages step)
  | 'a1Cover'
  | 'a1Gap'
  | 'a1Madinah'
  | 'a1Stranger'
  | 'a1Cushions'
  | 'a1Pillars'
  | 'a1Six'
  | 'a1Ihsan'
  | 'a1Hour'
  | 'a1Reveal'
  | 'a1Levels'
  | 'a1Graves'
  | 'a1Count'
  | 'a1Know'
  | 'a1See'
  | 'a1Inside'
  | 'a1Horizon'
  | 'a1Lane'
  | 'a1Monday'
  | 'a1Case'
  | 'a1Case2'
  | 'a1Case3'
  | 'a1Case4'
  | 'a1Review'
  | 'a1Notebook'
  | 'a1Next'
  // Adults Lesson 2 (motion stages drawn in code, slides/motion/g-a2.tsx)
  | 'a2Cover'
  | 'a2Recall'
  | 'a2Question'
  | 'a2Hawking'
  | 'a2Cause'
  | 'a2Began'
  | 'a2Three'
  | 'a2Nothing'
  | 'a2Itself'
  | 'a2Tur'
  | 'a2Jubayr'
  | 'a2Yaqeen'
  | 'a2Back'
  | 'a2How'
  | 'a2First'
  | 'a2Order'
  | 'a2Signs'
  | 'a2Now'
  | 'a2Case'
  | 'a2Case2'
  | 'a2Case3'
  | 'a2Case4'
  | 'a2Review'
  | 'a2Notebook'
  | 'a2Next'
  // Adults Lesson 3 (motion stages drawn in code, slides/motion/g-a3.tsx)
  | 'a3Cover'
  | 'a3Recall'
  | 'a3Question'
  | 'a3Brady'
  | 'a3Carrey'
  | 'a3Hunger'
  | 'a3Fitrah'
  | 'a3Born'
  | 'a3Noise'
  | 'a3Sea'
  | 'a3Ikrimah'
  | 'a3Feel'
  | 'a3Dank'
  | 'a3Ghina'
  | 'a3Rest'
  | 'a3Night'
  | 'a3Two'
  | 'a3Case'
  | 'a3Case2'
  | 'a3Case3'
  | 'a3Case4'
  | 'a3Review'
  | 'a3Notebook'
  | 'a3Next';

/** How a page is laid out on the slide (docs/curriculum/PLAN.md §7, slide system v2). */
export type Layout =
  /** Lesson opener: big title, Arabic subtitle, goal, hero art. */
  | 'cover'
  /** Big scene with narration lines that build one by one. */
  | 'story'
  /** Arabic evidence written large, then its meaning. */
  | 'evidence'
  /** A labelled diagram: items appear one by one around the art. */
  | 'concept'
  /** One big question with a reveal. */
  | 'question'
  /** Game checkpoint, full slide. */
  | 'game'
  /** Home mission and the Zad backpack. */
  | 'mission'
  /** Cliffhanger to the next lesson. */
  | 'next';

/** Arabic evidence shown on a page: copied unchanged from a verified source, with our own English meaning. */
export interface Evidence {
  arabic: string;
  meaning: string;
  reference: string;
}

/** The four mandatory stations of every lesson, in this order (docs/curriculum/RULES.md §1.5). */
export type Station = 'spark' | 'zad' | 'athar' | 'ahd';
export const STATIONS: Station[] = ['spark', 'zad', 'athar', 'ahd'];

/** Tadabbur stop required on every page that shows an ayah (RULES.md §1.6). */
export interface Tadabbur {
  /** Key word from the ayah, in Arabic. */
  word: string;
  root: string;
  meaning: string;
  /** "What is this ayah telling me?" phrased for the age band. */
  question: string;
  action: string;
}

export interface Vocab {
  arabic: string;
  translit: string;
  meaning: string;
}

export type Interaction =
  /** The teacher asks; the answer is revealed on tap. */
  | { kind: 'ask'; prompt: string; reveal?: string }
  /** Tap the right clues in a set. */
  | { kind: 'clues'; prompt: string; clues: { label: string; correct: boolean }[] }
  /** The learner picks one option (no right answer). */
  | { kind: 'choose'; prompt: string; options: string[] }
  /** Game checkpoint: put each card in the right bin. Results feed the teacher report (PLAN §3a.3b). */
  | { kind: 'sort'; prompt: string; look?: 'rings' | 'row'; bins: { id: string; label: string; hint: string }[]; cards: { label: string; bin: string; why?: string }[] };

/** Who speaks a clip (design §3a): the owner's ElevenLabs clones, the owner himself, or a Quran reciter. */
export type Voice = 'en' | 'eg' | 'fusha' | 'owner' | 'reciter';

/** A sound the learner can play again from the page. Fusha text is fully diacritized (owner, 2026-10-25). */
export interface Clip {
  /** Kebab-case; the file is public/curriculum/<subject>/audio/l<NN>-<id>.mp3. */
  id: string;
  text: string;
  voice: Voice;
  /** How it is said, for the ElevenLabs script ("warm", "curious"). */
  emotion?: string;
  /** An ayah: always the reciter, never a clone, streamed by surah:ayah. */
  quran?: boolean;
  ayah?: string;
}

export interface LessonPage {
  title: string;
  station: Station;
  layout: Layout;
  scene: SceneId;
  /** Big, short lines on the slide. Each one is a build step (the teacher reveals them one by one). */
  lines: string[];
  /** Labelled items on a concept slide; each is a build step after the lines. */
  items?: string[];
  evidence?: Evidence;
  tadabbur?: Tadabbur;
  vocab?: Vocab[];
  /** Sounds on this page the learner can replay (letters, words, lines, dialogues, ayat). */
  say?: Clip[];
  interaction?: Interaction;
  /** Ask the question before the items appear (a prediction), instead of after. */
  askFirst?: boolean;
  /** Adults show the ayah or hadith first and the lines after it, as what we draw from it (owner, 2026-10-23: never
   *  restate the text before it appears). Set this when the lines are the scene-setting the text needs before it. */
  contextFirst?: boolean;
  /** Read-aloud detail for the teacher: the fuller explanation behind the slide (owner, 2026-10-16). */
  explain: string[];
  /** Short tip on how to teach this page. Only the teacher sees it. */
  teacherNote?: string;
  /** Extra slide content for a 60-minute lesson; the teacher skips it in a 30-minute one (RULES.md §1.7). */
  optional?: boolean;
}

/** Arabic version of a page's teacher notes (the slide stays English). */
export interface TeacherNotesAr {
  title: string;
  explain: string[];
  note?: string;
}

export interface Lesson {
  subject: string;
  /** Age version (RULES.md §3): kids 6–11, teens 12–17, adults 18+. */
  version: 'kids' | 'teens' | 'adults';
  subjectTitle: string;
  number: number;
  title: string;
  titleAr: string;
  part: string;
  minutes: number;
  goal: string;
  outcomes: string[];
  /** Short names for the steps shown in the "In this lesson" tracker, with the page index where each starts. */
  chapters: { label: string; page: number }[];
  /** False until the owner approves the content (PLAN §3.4). Unreviewed lessons are teacher-only drafts. */
  reviewed: boolean;
  pages: LessonPage[];
  /** Arabic teacher notes, one per page, shown when the interface is Arabic. */
  teacherAr?: TeacherNotesAr[];
  /** The series opening ("meet the cast") that plays before the first lesson of a version (RULES.md §1.10). */
  opening?: SeriesOpening;
}

/** One recurring character, introduced in the series opening like the opening of an anime. */
export interface CastMember {
  id: string;
  name: string;
  nameAr: string;
  /** Shown as a chip when the story gives one. */
  age?: number;
  /** One line that makes you want to meet them. */
  line: string;
  traits: string[];
  /** Transparent character image (asset path). */
  img: string;
  /** Their colour in the opening. */
  color: string;
}

export interface SeriesOpening {
  cast: CastMember[];
  tagline: string;
  taglineAr: string;
}
