# Buffer queue (approved, waiting for a free slot)

The owner approved every post below on 2026-11-16 ("schedule the rest"). Buffer's free plan holds 10 scheduled
posts, so the daily task `buffer-topup` adds them in date order as slots free up. Organisation
`6af5f27405b6372653a75d65`; channels: Instagram `6af5f3e362b70b94b00b1804`, TikTok `6af5f44e62b70b94b00b1de4`,
YouTube `6af5f53962b70b94b00b2aa3`. Times are Europe/Warsaw (UTC+01:00 in Nov): Instagram and YouTube 18:00,
TikTok 20:00. All `schedulingType: automatic`, `mode: customScheduled`. Media are public on watazawwado.academy.

Shapes:
- Instagram Reel: one `video` asset, `metadata.instagram = {type: "reel", shouldShareToFeed: true}`.
- Instagram carousel: `image` assets in order (altText required), `metadata.instagram = {type: "post", shouldShareToFeed: true}`.
- YouTube Short: one `video` asset, `metadata.youtube = {title, categoryId: "27", privacy: "public", madeForKids: false, notifySubscribers: true, embeddable: true, license: "youtube", isAiGenerated: false}`.
- TikTok video: one `video` asset, `metadata.tiktok = {title}`.

When a post is created, tick it here (`[x]` plus the Buffer post id). Skip and report any post whose time has passed.

## Queue

- [x] **V4 · 2026-11-19** · video `https://watazawwado.academy/social/v4/v4.mp4`
  - [x] Buffer `6afb693f3509d4c5b881a61a` · Instagram 18:00 · "Would you hand your child to a stranger? Most parents do without meaning to: the first time they meet the teacher is the first lesson.\n\nThere's a better way, and it starts before lesson one. Wherever you book, see the teacher first.\n\n#muslimparents #quranforkids #onlinequran #islamicparenting #muslimmom"
  - [x] Buffer `6afb69413e6202be8788da29` · YouTube 18:00 · title "Would you hand your child to a stranger?" · "Most parents meet their child's Quran teacher in the first lesson. There's a better way: see the teacher first.\n\nMore: https://watazawwado.academy/?utm_source=youtube&utm_medium=social&utm_campaign=choose-the-teacher&utm_content=idV4\n\n#muslimparents #quranforkids #shorts"
  - [x] Buffer `6afcba90ea84dfa92544975b` · TikTok 20:00 · title "Would you hand your child to a stranger?" · "Would you hand your child to a stranger? Most parents do 👀 #muslimparents #quranforkids #muslimtok"
- [ ] **V5 · 2026-11-20** · video `https://watazawwado.academy/social/v5/v5.mp4` · partial: Instagram + YouTube scheduled, TikTok waiting
  - [x] Buffer `6afcba927acfe506d927432f` · Instagram 18:00 · "Your kids say 3 Arabic words every day. Do they know what they mean?\n\nBismillah, Alhamdulillah, and the one that makes the cook smile. Quick quiz at the end 👀\n\n#muslimkids #islamicparenting #learnarabic #muslimparents #arabicforkids"
  - [x] Buffer `6afcba9430e8d67e7ca1fc5b` · YouTube 18:00 · title "3 Arabic words your kids say every day" · "Bismillah, Alhamdulillah and the one that makes the cook smile. Do your kids know what they mean?\n\nMore: https://watazawwado.academy/?utm_source=youtube&utm_medium=social&utm_campaign=meal-words&utm_content=idV5\n\n#learnarabic #muslimkids #shorts"
  - TikTok 20:00 · title "3 Arabic words your kids say every day" · "Your kids say these 3 Arabic words every day. Do they know what they mean? 👀 #muslimkids #learnarabic #muslimtok"
- [ ] **V7 · 2026-11-22** · video `https://watazawwado.academy/social/v7/v7.mp4`
  - Instagram 18:00 · "One letter turns your heart… into a dog. قَلْب (heart) and كَلْب (dog) are one sound apart. Here's where ق really comes from.\n\nSave it for your next read.\n\n#tajweed #learnquran #arabicletters #quranforbeginners #learnarabic"
  - YouTube 18:00 · title "The letter that turns your heart into a dog · Fix one letter #2" · "قَلْب is heart. كَلْب is dog. One sound apart. Here's where ق comes from.\n\nMore: https://watazawwado.academy/?utm_source=youtube&utm_medium=social&utm_campaign=fix-one-letter&utm_content=idV7\n\n#tajweed #learnarabic #quran #shorts"
  - TikTok 20:00 · title "Heart or dog? One letter decides" · "One letter turns your heart into a dog 😳 Save this for your next read. #tajweed #learnarabic #quran #muslimtok"
- [ ] **V9 · 2026-11-24** · video `https://watazawwado.academy/social/v9/v9.mp4`
  - Instagram 18:00 · "Ten years serving the Prophet ﷺ, and not one \"uff\". Anas ibn Malik's words (Sahih al-Bukhari 6038), and one small swap you can try at home.\n\n#seerah #prophetmuhammad #islamicparenting #muslimfamily #hadith"
  - YouTube 18:00 · title "Ten years, and not one \"uff\"" · "Anas ibn Malik served the Prophet ﷺ for ten years and never heard \"uff\" (Sahih al-Bukhari 6038). One small swap to try at home.\n\nMore: https://watazawwado.academy/?utm_source=youtube&utm_medium=social&utm_campaign=seerah-moments&utm_content=idV9\n\n#seerah #hadith #shorts"
  - TikTok 20:00 · title "Ten years, and not one uff" · "Ten years with the Prophet ﷺ and not one \"uff\" 🤍 #seerah #hadith #muslimtok"
- [ ] **V11 · 2026-11-26** · Instagram carousel 18:00, `https://watazawwado.academy/social/v11b/slide-1.jpg` … `slide-7.jpg` · alt texts: "How it works with us, in 5 steps", "1. Pack your zaad", "2. Choose your teacher", "3. A free 30-minute trial", "4. A report the same day", "5. Then, every week", "Packed! Your first lesson is on us" · caption: "How it works with us 📌\n\n1. Pack your zaad: join the waitlist, for you or your child\n2. When your wave opens, choose your teacher from real profiles\n3. A free 30-minute trial lesson\n4. A report the same day: level, goals, plan\n5. Then every week: 1-on-1 lessons with the same teacher, a report after every class, and we message you first\n\nLink in bio.\n\n#muslimparents #quranforkids #onlinequran #learnquran"
- [ ] **V12 · 2026-11-27** · video `https://watazawwado.academy/social/v12/v12.mp4`
  - Instagram 18:00 · "You already know 3 words from the Quran. You just don't know you know them. Which one do you say most? Tell us 👇\n\n#quran #learnarabic #quranwords #muslimfamily #learnquran"
  - YouTube 18:00 · title "3 Quran words you already know" · "Salam, Sabr, Rahmah: three words you already say, straight from the Quran (36:58, 103:3, 21:107).\n\nMore: https://watazawwado.academy/?utm_source=youtube&utm_medium=social&utm_campaign=quran-words&utm_content=idV12\n\n#quran #learnarabic #shorts"
  - TikTok 20:00 · title "3 Quran words you already know" · "You already know 3 words from the Quran 😏 Which one do you say most? #quran #learnarabic #muslimtok"
- [ ] **V13 · 2026-11-28** · Instagram carousel 18:00, `https://watazawwado.academy/social/v13/slide-1.jpg` … `slide-6.jpg` · alts: "Why does the reciter stretch some sounds?", "Madd means stretch: alif, waw, ya", "Each one has a partner vowel", "How long? Two counts", "You already read it in Bismillah", "Packed! Try it out loud" · caption: "Why does the reciter stretch some sounds? It has a name: madd. Two counts, and you already read it in Bismillah.\n\nSave this for your next read.\n\n#tajweed #learnquran #quranforbeginners #madd #quran"
- [ ] **V14 · 2026-11-29** · Instagram carousel 18:00, `https://watazawwado.academy/social/v14/slide-1.jpg` … `slide-6.jpg` · alts: "Remember reading out loud in class and everyone heard the mistake?", "For a lot of us, that's where it stopped", "1. No audience", "2. Your pace", "3. A kind correction", "Packed! Someone your age who gets you" · caption: "Remember reading out loud in class, and everyone heard the mistake?\n\nOne-on-one means no audience, your pace, and a kind correction. Start where you are. Comment ZAAD.\n\n#muslimyouth #learnquran #revertmuslim #quranjourney"
- [ ] **V15 · 2026-11-30** · Instagram carousel 18:00, `https://watazawwado.academy/social/v15/slide-1.jpg` … `slide-5.jpg` · alts: "How was Quran class? Fine.", "1. What's one new word you learned today?", "2. Read me one line, the way your teacher does?", "3. What did your teacher say you did well?", "Packed! Pick one" · caption: "\"How was Quran class?\" \"Fine.\" Every week?\n\nTry one of these three questions instead. Save this for after class.\n\n#muslimparents #islamicparenting #quranforkids #muslimkids"
