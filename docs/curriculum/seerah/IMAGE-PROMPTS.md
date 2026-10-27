# Seerah · image prompts · Episodes 1–4 (Teens & Adults, Kids)

Also: the curriculum door banners are in `docs/curriculum/BANNER-PROMPTS.md`.

For the owner: Episodes 1–3 (82 images, all on the site), Episode 4 (28 of 29 on the site) and Kids Episode 1 (10 images, new). Paste **Message 0** into a new ChatGPT chat first, then the prompts in order
(one per message, or several per message if ChatGPT accepts them). Every prompt is also complete on its own, so any of
them can be pasted alone in a fresh chat.

**Where the images go:** `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\<folder>\<file>.png`, with the folder
and the file name written above each prompt (for example `seerah\teens-ep02\milk.png`). Claude checks that folder,
converts the images to WebP and places them on the site. A missing image does not break anything: the page stays dark
or plain until it arrives.

Replaces `EP01-image-prompts.md` (same 22 file names for Episode 1, prompts rewritten to be self-contained).

**For Claude, placing them:** each archive folder maps to the site: `seerah\teens-epNN\x.png` →
`public/curriculum/seerah-teens/epNN/x.webp`, `seerah\kids-epNN\x.png` → `public/curriculum/seerah-kids/epNN/x.webp`
(`ffmpeg -i x.png -vf scale=1600:-2 -c:v libwebp -quality 82 x.webp`; Kids pictures at 1200 wide). Check each image
against Message 0 before placing it (no faces, no text, right era); ask the owner to redo any that fail, by file name.

---

## Message 0 · paste this first

> You are going to make a series of illustrations for an online Islamic academy's course on the life of the Prophet
> Muhammad (peace be upon him), told like a premium TV series. I will send one prompt per image. Follow these rules in
> every image, without exception:
>
> 1. **No faces, ever.** People appear only from behind, as small distant silhouettes, or cropped to hands, feet and
>    shadows. Never draw a prophet, an angel, or any companion of the Prophet. Never draw a baby or a small boy who could
>    be the Prophet as a child: when the story is about him, show the place, the objects or the light instead.
> 2. **No text of any kind:** no letters, no Arabic or English script, no numbers, no logos, no watermarks, no signatures.
> 3. **Historically right for 6th-century Arabia (Hejaz):** low houses of mud brick and rough stone with flat roofs and
>    palm-trunk beams, black goat-hair bedouin tents, camels, donkeys, goats, simple undyed or earth-coloured robes and
>    head cloths. The Kaaba of that time is a low, roofless cube of stacked dark grey stones, about twice a man's height,
>    partly draped in a plain dark cloth: no gold calligraphy band, no marble floor, no domes, no minarets, no clock
>    tower, no modern buildings. Makkah is a small cluster of low houses in a bare valley of dark granite mountains.
> 4. **Modest and dignified:** nothing violent or gory (no blood, no wounds, no dead bodies), nothing indecent, no idol
>    worship shown up close.
> 5. **Two looks, named in each prompt:**
>    - **LOOK T (Teens & Adults):** a cinematic historical matte painting, photorealistic, like a frame from a high-end
>      historical drama: dramatic natural light (golden hour, torchlight, moonlight or hard noon sun as the prompt says),
>      deep shadows, volumetric light and dust, rich detail, shallow depth of field, a warm amber and bronze palette with a
>      controlled accent of deep crimson (#C51F24) or teal (#0FA3B8) and soft gold highlights (#E5A93C). Landscape
>      3:2 (1536×1024). **Composition rule:** keep the main subject in the centre-right and upper half; keep the left third
>      darker and simpler and the bottom-right quiet, because text and cards are placed there.
>    - **LOOK K (Kids):** a warm painted storybook scene that sits between a children's picture book and an animated
>      family film: soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, clear
>      readable silhouettes, gentle warm light, a cream, sand and terracotta palette with touches of crimson (#C51F24),
>      teal (#0FA3B8) and gold (#E5A93C), cheerful but never silly. Landscape 3:2 (1536×1024). Keep the centre clear and
>      the edges simple: the picture is shown as a framed card with cartoon characters standing beside it.
> 6. **Every image must look different from the others** in the series: different subject, camera distance, angle,
>    time of day and main colour, as each prompt specifies. Do not reuse a composition.
> 7. Save each image with the exact file name I give, as PNG, in
>    `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\<folder>\`. If you cannot save files there, just make
>    the image and I will download it with that name.
>
> Reply "Ready" and wait for the first prompt.

---

## Teens & Adults · Episode 1 · The Year of the Elephant (folder `teens-ep01`, 22 images)

Every prompt below starts with the same line so that it works alone:
**"LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep
shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or
as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left
third darker and simpler."**

**1 · `cover`** · extreme wide · dusk · storm grey + gold
> [LOOK T line] The low, roofless stone Kaaba of that time standing alone in a barren valley ringed by black granite
> mountains, at dusk. Heavy storm clouds roll in from the right, lit gold from underneath by the last sun. On the far
> horizon a thin line of dust rises from a distant army, too far to see any soldier. A few small flat-roofed houses
> scattered around the Kaaba, lamps not yet lit. Mood: the calm before something enormous.

**2 · `empires`** · split composition · two light sources · gold vs crimson
> [LOOK T line] A split panorama of two rival empires of the 6th century facing each other across a dark strip of
> desert. Left: a marble Byzantine city with domes, colonnades and legions holding golden eagle standards, cool morning
> light. Right: the vast brick arch of Ctesiphon with Persian fire altars burning and rows of armoured cavalry, hot
> evening light. In the middle a jagged crack of dark sand runs from the foreground to the horizon. Tiny figures, epic
> scale.

**3 · `jahiliyyah`** · medium-wide · night firelight + cold moon · crimson
> [LOOK T line] A tribal desert camp at night. A large bonfire throws hard orange light; around it men in head cloths,
> seen only from behind and in silhouette, argue with raised spears. In the background, out of focus, rough stone idols
> stand as dark shapes on a rock ledge. Cold blue moonlight on the dunes beyond. Tense, lawless mood, no fighting shown.

**4 · `makkah`** · high wide · soft early morning · pale gold
> [LOOK T line] A high, quiet view of the sanctuary valley at sunrise: the low stone Kaaba at the centre-right of an
> open sandy valley, a few low mud-brick houses and tents around it, dark granite mountains all around catching the
> first pink-gold light. Thin morning haze, a few doves in the air. Very still and sacred.

**5 · `abraha`** · interior · single shaft of light · crimson banners
> [LOOK T line] Inside a Yemeni stone palace hall in Sana'a: tall carved pillars, deep red Aksumite banners hanging from
> the ceiling, an ornate raised throne of dark wood and bronze, empty, lit by one hard shaft of light from a high window.
> Armed guards stand in deep shadow along the walls, faceless and turned away. Mood: cold ambition.

**6 · `qullays`** · low angle looking up · late golden light · gold and coloured glass
> [LOOK T line] A colossal 6th-century church in Sana'a seen from a low angle: gilded domes, marble columns, walls inlaid
> with coloured stone and glass, glowing in late golden sunlight. Tiny crowds at its foot for scale. Opulent and
> imposing, built to impress.

**7 · `scales`** · still life close-up · one candle · bronze
> [LOOK T line] A still life on a dark wooden table: an old bronze balance scale. On one pan, a heavy iron soldier's
> helmet; on the other pan, one small rough clay pebble. Impossibly, the pan with the pebble hangs lower. A single candle
> lights it from the right, the background black. Symbolic, quiet, precise.

**8 · `march`** · wide, three-quarter view · hot noon dust · crimson
> [LOOK T line] A vast army in chainmail and bronze marching through a red desert canyon, armoured war elephants at the
> front, the largest one leading with a richly decorated howdah. A wall of dust rises behind them under a white-hot noon
> sun. Seen from a high ridge, the soldiers small and faceless. Overwhelming force.

**9 · `camp`** · wide night · hundreds of torches · orange on blue
> [LOOK T line] A huge war camp at night at the foot of the dark mountains outside Makkah: hundreds of torches and fires,
> rows of tents, the shapes of elephants. In the foreground, a large pen of seized camels, restless, lit by torchlight.
> Deep blue night sky full of stars above.

**10 · `evacuate`** · medium-wide from below · cool dawn · teal shadows
> [LOOK T line] Families of Makkah climbing a steep rocky mountain path at dawn, seen from behind and from below:
> bundles on their backs, goats and a few camels, children holding hands with adults. Below them the town is empty and
> silent. Cool blue-teal shadows, the first light on the peaks.

**11 · `walk`** · long lens, from behind · sunset backlight · gold
> [LOOK T line] One tall, dignified old man in a dark cloak and head cloth, seen from behind, walking alone across open
> sand toward an enormous army tent far ahead at sunset. His long shadow stretches toward the camera. Guards and banners
> around the tent are small in the distance. Courage without weapons.

**12 · `tent`** · interior · warm lamplight · bronze and crimson
> [LOOK T line] Inside a grand war tent lit by bronze oil lamps: thick carpets, cushions, a raised throne left empty.
> Two men sit on the carpet facing each other, seen only from behind and in silhouette against the lamplight, one in rich
> armour and one in a simple cloak. Heavy silence.

**13 · `storm-tree`** · wide, low angle · storm with one break of sun · gold
> [LOOK T line] A lone acacia tree on a cliff edge holding firm in a violent desert storm, sand blowing sideways, its
> roots gripping the rock. Through one break in the dark clouds a shaft of sunlight falls on the tree. Symbolic of trust
> and steadfastness.

**14 · `kneel`** · medium, eye level · harsh morning light · grey and dust
> [LOOK T line] In a narrow rocky valley (Wadi Muhassir), a giant armoured war elephant kneels in the dust and refuses
> to move. Soldiers, seen from behind, pull on ropes and push at its sides; all face the same direction, the one it
> will not go. Dust hangs in the hard morning light.

**15 · `spear`** · macro close-up · hard side light · rust
> [LOOK T line] A broken iron spear lying on cracked, dry earth, its shaft snapped in two, fine dust floating in a hard
> beam of side light. Nothing else. Shallow depth of field. Symbol of power that failed.

**16 · `birds`** · low angle up into the sky · blazing noon sun behind · black on white-gold
> [LOOK T line] A huge dark flock of small birds like swallows filling the sky over a desert valley, the blazing noon
> sun behind them turning the sky white-gold. Far below, tiny soldiers and an elephant look up. Awe, not horror.

**17 · `stones`** · close-medium · dusty shafts of light · ochre
> [LOOK T line] Small baked-clay pebbles falling like rain through dusty shafts of light. On the ground, dented bronze
> helmets and abandoned shields half-covered in sand. No people, no bodies. Eerie stillness.

**18 · `aftermath`** · extreme wide · dusk · gold and grey
> [LOOK T line] An abandoned battlefield at dusk: broken shields half-buried in sand, a toppled elephant saddle, torn
> banners on the ground. Far away in the centre-right, small and untouched, the low stone Kaaba in its valley, catching
> the last light. Quiet victory of truth.

**19 · `return`** · wide from a hillside · golden hour · warm amber
> [LOOK T line] People walking down the mountain paths back toward the Kaaba at golden hour, seen from behind and far
> away, carrying their bundles, goats following. The valley is peaceful, smoke rising from the first cooking fires.
> Relief and gratitude.

**20 · `cradle`** · interior close · dawn through a small window · soft gold
> [LOOK T line] A simple clay-walled room in Makkah at dawn: a small oil lamp burning beside an empty wooden cradle with
> a woven striped blanket folded inside. Soft gold light falls through a small square window onto the cradle. No people.
> Tender, hopeful.

**21 · `yathrib`** · medium · dusk · teal and gold
> [LOOK T line] A quiet palm grove in Yathrib at dusk: tall date palms, a low mud wall, and a single simple grave marked
> by a few stones, long shadows across the sand. No people. Grief and dignity.

**22 · `badiyah`** · wide · deep red sky · crimson
> [LOOK T line] Black goat-hair bedouin tents of the tribe of Banu Sa'd in open desert under a deep red evening sky. A
> woman in a dark robe, seen from behind, leads a thin grey donkey away from the camp toward the far mountains. A
> question hanging in the air.

---

## Teens & Adults · Episode 2 · The Desert Nurse (folder `teens-ep02`, 19 images)

Every prompt starts with the **LOOK T line** above.

**1 · `cover`** · ground-level macro to horizon · cold dawn · pale blue and gold
> [LOOK T line] Ground-level view across cracked, parched earth at dawn: a line of small donkey hoofprints and a few
> sandal prints leads from the foreground toward the distant dark mountains of Makkah on the horizon. A pale gold line
> of sunrise behind the mountains. No people. The start of a journey.

**2 · `custom`** · wide · clean morning · sky blue and sand
> [LOOK T line] An open high desert plateau in clear, fresh morning air: a single black goat-hair bedouin tent with its
> side flap lifted by the wind, a few goats grazing on sparse shrubs, endless open sky. Clean, healthy, free, the
> opposite of a crowded town.

**3 · `drought`** · medium close · harsh white noon · bleached ochre
> [LOOK T line] A year of drought: an empty, cracked leather water skin hanging from a dry tent pole, a dry well of
> stones beside it, the earth around split into deep cracks, a dead thorn bush. Harsh white noon light, bleached colours.
> No people, no animal remains.

**4 · `caravan`** · extreme wide, side view · misty morning · soft grey and rose
> [LOOK T line] A small caravan of bedouin women of Banu Sa'd setting out across the desert in early morning mist, on
> camels and donkeys, seen from far away and from the side as small silhouettes. At the very end of the line, falling
> behind, one woman on a thin, tired grey donkey and an old she-camel. Long journey ahead.

**5 · `night-cry`** · interior, low · moonlight + one ember · deep blue
> [LOOK T line] Inside a bedouin tent at night: a small cloth hammock-cradle hangs from the tent pole, gently swinging,
> a dying ember in a stone hearth, moonlight falling through the tent opening. Outside the opening, an old, thin she-camel
> tethered and standing still. A long hungry night. No people visible, no baby visible.

**6 · `passed-by`** · top-down (bird's-eye) · midday · sand and one teal accent
> [LOOK T line] A top-down view of a sandy crossroads at midday: many sets of footprints and hoofprints walk past and
> around one small spot in the centre, where a single small teal-blue woven cloth lies untouched on the sand. Everyone
> passed it by. Symbolic, graphic, minimal.

**7 · `lanes`** · eye level in a narrow lane · warm morning, striped shade · terracotta
> [LOOK T line] A narrow lane of 6th-century Makkah in the morning: low mud-brick houses with wooden doors, cloth
> awnings throwing striped shade, a few women in dark robes walking away from the camera with bundles, going door to
> door. Dust in the sunbeams.

**8 · `doorway`** · from behind, framing · warm lamplight inside, blue outside · gold vs blue
> [LOOK T line] A woman in a simple dark bedouin robe, seen from behind, standing at the threshold of a modest Makkah
> house in the late afternoon. Inside, a warm oil lamp glows; outside, cool blue shadow. Her shadow falls long into the
> room. A decision is being made. Nothing of the inside is shown except the light.

**9 · `harith`** · medium wide · dusk campfire · ember orange
> [LOOK T line] A bedouin man in a head cloth, seen from behind, sitting by a small campfire at dusk outside a tent,
> leaning on a shepherd's staff, looking toward a woman's silhouette in the tent doorway. Quiet trust between husband and
> wife.

**10 · `milk`** · still life close-up · first sunlight · white and gold
> [LOOK T line] At dawn, a wide wooden bowl filled to overflowing with fresh, frothy camel milk, a few drops running down
> its side, set on a woven mat. Behind it, out of focus, the legs and side of the old she-camel. First sunlight makes the
> milk glow. Blessing, abundance.

**11 · `donkey`** · aerial wide · late afternoon, long shadows · sand and teal sky
> [LOOK T line] An aerial view of the women's caravan crossing the desert on the way home: at the very front, far ahead
> of the others, a small grey donkey trots with a woman rider, a bright trail of dust behind it; the camels and other
> donkeys lag behind. Long late-afternoon shadows. Astonishment.

**12 · `green`** · wide · after rain, fresh light · vivid green on sand
> [LOOK T line] The valley of Banu Sa'd after rain: barren sand now covered with fresh green grass and small desert
> flowers, a flock of plump sheep and goats returning home at sunset, black tents in the distance, a soft rainbow fading.
> Life returned.

**13 · `seed`** · macro · soft side light · one green on grey
> [LOOK T line] Extreme close-up of cracked grey earth: from one crack a single bright green shoot rises, a drop of water
> on its leaf catching the light. Simple, symbolic: kindness that grows.

**14 · `haze`** · wide from a ridge · hot afternoon haze · dusty yellow
> [LOOK T line] Makkah seen from a far ridge in hot afternoon haze: the low town and the Kaaba small in the valley, a
> heavy yellowish haze hanging over it (a season of sickness). In the foreground on the ridge, a woman on a grey donkey,
> seen from behind, turning back toward the open desert.

**15 · `hills`** · extreme wide · golden hour · warm gold
> [LOOK T line] The hills of Banu Sa'd at golden hour: on a far ridge, tiny silhouettes of young shepherd boys running
> with a flock of lambs, too far away to see any detail. Big sky, long light. Childhood in the desert.

**16 · `basin`** · close-medium · light from above · gold and clear water
> [LOOK T line] A simple golden basin full of perfectly clear water resting on a smooth rock in a quiet desert hollow,
> a column of soft white light falling on it from above, tiny sparkles on the water. No people, no figures, nothing
> else. Pure, sacred, calm.

**17 · `vessel`** · macro · cool clear light · teal water
> [LOOK T line] A clear glass vessel held under a stream of fresh clear water in a rocky spring: dark sediment flows out
> of it and away, the glass becoming spotless. Cool, clean light. Symbol of a heart made pure.

**Also for Episode 2 (modern projection, same LOOK T):**

**18 · `lunch`** · modern · interior · daylight · neutral with crimson accent
> [LOOK T line, but modern day] A modern school cafeteria from behind a teenager carrying a lunch tray: most tables are
> full and lively, one student sits alone at the far end, seen from behind, an empty seat beside them. The camera looks
> over the first teen's shoulder toward that empty seat. No faces visible.

**19 · `abwa-road`** · wide · sunset · crimson and black
> [LOOK T line] A lonely road through black volcanic hills (lava fields) toward the north at sunset: a very small
> caravan of two camels far away on the road, seen from behind. The sky is deep crimson. A long journey with an
> uncertain end.

---

## Teens & Adults · Episode 3 · Three Goodbyes (folder `teens-ep03`, 19 images)

Every prompt starts with the **LOOK T line** above.

**1 · `cover`** · still life · dark room · three flames
> [LOOK T line] Three small clay oil lamps on a rough stone ledge in a dark room. The two on the right have just gone
> out, thin threads of smoke rising from them; the one on the left still burns steadily and lights the scene. Black
> background. Quiet, grieving, hopeful.

**2 · `sandals`** · close-medium · soft morning · warm cream
> [LOOK T line] The doorstep of a modest Makkah house at morning: a pair of small child's leather sandals beside a pair
> of a woman's sandals, a clay water jar, morning light across the threshold. No people. A home of a mother and her son.

**3 · `journey`** · aerial extreme wide · mid-morning · sand and long blue shadows
> [LOOK T line] A bird's-eye view of an immense desert with mountain ranges: a tiny caravan of three camels crossing it,
> leaving a thin line of tracks. The scale is overwhelming. A 500-kilometre journey north.

**4 · `palms`** · medium wide · bright midday shade · lush green and teal water
> [LOOK T line] The palm gardens of Yathrib at midday: tall date palms, irrigation channels of clear water, low mud-brick
> walls, dappled shade on the ground, a few camels resting under the trees. Green, cool and alive, different from Makkah.

**5 · `lone-tent`** · wide night · one lamp · black and amber
> [LOOK T line] A single small tent pitched alone on a dark rocky plain at night (al-Abwa), one faint lamp glowing inside,
> two camels kneeling beside it, wind blowing sand across the ground, a vast starry sky. Fragile and alone.

**6 · `footprints`** · top-down · cool early light · sand
> [LOOK T line] A top-down view of footprints in smooth sand: a woman's footprints walking beside a small child's
> footprints; the woman's prints stop; the child's prints continue on, now beside a man's larger, heavier prints and a
> camel's tracks. Graphic, minimal, heartbreaking without any people.

**7 · `way-home`** · wide, from behind · dawn backlight · rose and grey
> [LOOK T line] At dawn on a desert road, an old man with a staff, seen from behind, leads a camel south; on the camel a
> woman in a dark robe sits seen from behind, holding a small bundle of belongings. The sky is rose and grey. The way home
> after a loss.

**8 · `mattress`** · medium · morning, hard shade line · crimson rug, dark stone
> [LOOK T line] A thick embroidered mattress with a crimson and gold woven cover laid on the sand in the shade of the
> Kaaba's dark stone wall, cushions placed around it in a circle, a sharp line between shade and sun across the sand.
> No people. The seat of honour of an old chief.

**9 · `wall`** · close-up · low sun · dark stone and gold
> [LOOK T line] An extreme close-up of the corner of the ancient Kaaba's wall of stacked dark stones, low sunlight
> grazing the rough texture, a strip of plain dark cloth at the edge of the frame, a soft gold rim of light. Ancient,
> solid, sacred.

**10 · `staff`** · still life · fading lamplight · bronze to black
> [LOOK T line] An old man's wooden walking staff leaning against a whitewashed clay wall, beside it a folded cloak and
> a small oil lamp burning low, almost out. Long soft shadows. The end of a long life.

**11 · `mourners`** · extreme wide · dusk with torches · indigo and orange
> [LOOK T line] Makkah at dusk seen from a hillside: a long, slow procession of people carrying torches winds through
> the valley, small and faceless at this distance. Indigo sky, the mountains black. A whole town in mourning.

**12 · `uncle-house`** · interior courtyard · evening fire · warm orange
> [LOOK T line] The courtyard of a busy family home in Makkah in the evening: many pairs of children's sandals by the
> door, a cooking pot over a small fire, bread on a cloth, a large man's cloak hanging on a peg, warm firelight. No
> people visible. A full, loving, not wealthy household.

**13 · `clouds`** · low angle up · dark storm gathering · charcoal and teal
> [LOOK T line] Low angle from the sand near the Kaaba's wall looking up: heavy dark rain clouds gathering from every
> direction over the valley, the first fat drops of rain darkening the dry sand in the foreground. Dramatic, hopeful.

**14 · `rain`** · wide · after the storm, silver light · silver and green
> [LOOK T line] Heavy rain over the valley of Makkah: water streaming down the mountain sides and flowing through the
> sandy valley in shining channels, the first green appearing, silver light breaking through. Relief for a thirsty land.

**15 · `duha`** · wide · morning sun · warm gold mist
> [LOOK T line] Morning light (the time of ad-Duha) breaking over the mountains around Makkah, warm golden mist filling
> the valleys, long rays of sun reaching across the land. Calm, reassuring, full of mercy.

**16 · `grave-visit`** · extreme wide · early morning · pale gold and stone
> [LOOK T line] The plain of al-Abwa at early morning: a single simple grave marked with stones, and far away a group of
> riders who have dismounted beside their camels, standing still, tiny and faceless. Decades later, a son visits his
> mother. Gentle, moving.

**17 · `shoulder`** · modern · night interior · deep blue and warm lamp
> [LOOK T line, but modern day] A teenager sitting on the carpet of a quiet masjid at night, seen from behind, head
> slightly lowered; an older man's hand rests on the teen's shoulder (only the hand and sleeve visible). A warm lamp, deep
> blue shadows. Being cared for after a loss. No faces.

**18 · `bag`** · modern · street at golden hour · warm
> [LOOK T line, but modern day] Two teenagers walking home from school on a quiet suburban street at golden hour, seen
> from behind: one carries both school bags, the other walks on crutches. Long shadows. Quiet kindness.

**19 · `north`** · wide · dawn · gold and dust
> [LOOK T line] A great trading caravan leaving Makkah at dawn and heading north: dozens of loaded camels in a long line
> winding out of the valley, dust glowing in the sunrise. Near the front, a man on a camel and a small rider beside him,
> both seen from behind and far away. Adventure ahead.

---

## Kids · Episode 2 · Halimah and the Blessed Baby (folder `kids-ep02`, 11 images)

Every prompt starts with this line so that it works alone:
**"LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft
3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and
terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces (people only from behind or far away),
no prophet, angel or companion, no baby shown, no text or letters. Centre clear, edges simple."**

**1 · `cover`** · wide · sunrise · gold
> [LOOK K line] A friendly desert at sunrise: three black bedouin tents with colourful striped cloths, a small grey
> donkey with a bright red-and-teal saddle blanket standing proudly in front, a fluffy goat beside it, soft pink-gold sky.
> The beginning of an adventure.

**2 · `dry`** · medium · hot noon · faded ochre
> [LOOK K line] A dry year in the desert: a thin, sleepy camel lying down, two skinny sheep looking at an empty water
> bowl, cracked ground, a droopy little bush, a big hot sun. Sad but gentle, not scary.

**3 · `trip`** · wide side view · morning · sand and sky blue
> [LOOK K line] A line of bedouin women on camels and donkeys travelling across the desert toward faraway mountains,
> seen from the side and far away. Last in the line, a slow little grey donkey with a red-and-teal blanket, an old camel
> walking behind it.

**4 · `town`** · eye level · warm morning · terracotta
> [LOOK K line] The little town of Makkah long ago: low mud-brick houses with wooden doors, colourful cloth awnings, a
> cat on a wall, women in long robes walking away from the viewer, going from door to door.

**5 · `door`** · from behind · lamplight · gold and blue
> [LOOK K line] A woman in a long robe and head cloth, seen from behind, standing at an open wooden door; warm lamplight
> spills out of the house onto her. Above the house, the evening sky turns blue with the first star. A kind choice.

**6 · `milk`** · close · morning · white and gold
> [LOOK K line] A big wooden bowl overflowing with frothy milk, sparkles of light around it, a happy camel behind it
> with a small smile, morning sun. Magical abundance, storybook feeling.

**7 · `race`** · wide · afternoon · dust and teal sky
> [LOOK K line] The little grey donkey with its red-and-teal blanket racing ahead across the desert, ears up, a cloud of
> sparkly dust behind it; the other camels and donkeys far behind looking surprised. Funny and joyful.

**8 · `green`** · wide · golden hour · fresh green
> [LOOK K line] The desert turned green: grass and little flowers everywhere, fat fluffy sheep and goats skipping home,
> black tents with striped cloths, a soft rainbow. Joyful.

**9 · `hills`** · extreme wide · golden hour · gold
> [LOOK K line] Rolling desert hills at golden hour, tiny silhouettes of children running with little lambs on a far
> hilltop, birds in the sky. Freedom and play.

**10 · `basin`** · close-medium · soft light from above · gold and sparkling water
> [LOOK K line] A shining golden bowl of sparkling clear water on a smooth rock, soft rays of light from above, tiny
> stars of light dancing on the water. No people. Calm and special.

**11 · `road`** · wide · sunset · crimson and black hills
> [LOOK K line] A long road between dark hills at sunset, one camel far away walking north under a big crimson sky with
> the first stars. Curious and a little sad: where is it going?

---

## Kids · Episode 3 · Three Goodbyes (folder `kids-ep03`, 11 images)

Every prompt starts with the **LOOK K line** above.

**1 · `cover`** · still life · cosy dark room · three lanterns
> [LOOK K line] Three little clay lamps on a wooden shelf in a cosy room at night: two have gone out with tiny curls of
> smoke, one glows warmly and lights the room. A gentle, quiet picture.

**2 · `journey`** · map-like aerial · morning · sand and teal
> [LOOK K line] A storybook bird's-eye view of a big desert with mountains, like a living map: a tiny caravan of three
> camels walking along a dotted path from a small town in the south to a green palm oasis in the north.

**3 · `palms`** · wide · midday · green and teal
> [LOOK K line] A green oasis town of palm trees, little water channels and mud houses, camels resting in the shade,
> birds in the palms. Fresh and cool.

**4 · `tent`** · wide night · starry · navy and amber
> [LOOK K line] A small tent alone under a huge starry sky, one warm lamp glowing inside, two camels resting beside it,
> gentle wind. Quiet and a little sad, not frightening.

**5 · `rug`** · medium · morning · crimson and stone
> [LOOK K line] A soft red-and-gold rug with cushions laid in the shade next to the low stone Kaaba of long ago, pigeons
> walking nearby, morning sun. A special place to sit.

**6 · `staff`** · still life · soft lamplight · bronze
> [LOOK K line] An old wooden walking stick leaning on a clay wall next to a folded cloak and a small lamp glowing low.
> Gentle, a goodbye.

**7 · `home`** · interior courtyard · evening · warm orange
> [LOOK K line] A busy, happy family courtyard in the evening: lots of children's sandals by the door, a pot of food
> bubbling on a little fire, bread on a cloth, toys made of wood and wool, warm light. No people visible. A home full of
> love.

**8 · `clouds`** · low angle · dramatic but friendly · charcoal and teal
> [LOOK K line] Big round rain clouds gathering over the little stone Kaaba and the town of Makkah, the first raindrops
> falling, a few children's footprints in the sand. Exciting.

**9 · `rain`** · wide · silver light · green
> [LOOK K line] Rain pouring over the valley, little streams running down the hills, flowers popping up, a goat and a
> camel enjoying the rain, silver light. Joyful.

**10 · `sunrise`** · wide · morning · warm gold
> [LOOK K line] A beautiful morning sun rising over soft mountains, golden light spreading over the valley, birds flying.
> Hopeful and warm.

**11 · `caravan`** · wide · dawn · gold
> [LOOK K line] A long, exciting caravan of many loaded camels with colourful bags leaving town at dawn and heading north,
> dust glowing in the sunrise. Near the front, a man and a small rider on camels seen from behind and far away. A big trip
> begins.

---

## Redo batch · 2026-10-27 (9 images)

**Done 2026-10-27:** all 9 redos passed the check and are on the site (82 of 82). ChatGPT saved them in
`watazawwado-archive\<folder>\`, without `seerah\`; the old rejected files are still in `seerah\<folder>\`.

Claude checked all 82 images. 73 are on the site. These 9 broke a rule, so they need a new version. Paste
**Message 0** first, then these prompts. Save each one with the same file name in the same folder, replacing the old one.

| File | Why it was rejected |
|---|---|
| `teens-ep02/lunch` | Faces visible in profile; an ancient hall instead of a modern school |
| `teens-ep02/hills` | Boys on the ridge: could be read as the Prophet ﷺ as a child |
| `teens-ep03/clouds` | The modern Kaaba cover with gold calligraphy (text, and the wrong era) |
| `teens-ep03/mattress` | Gold calligraphy panels on the Kaaba |
| `teens-ep03/grave-visit` | One man sitting alone at the grave: reads as the Prophet ﷺ himself |
| `teens-ep03/north` | A small boy riding beside the man: reads as the Prophet ﷺ as a child |
| `kids-ep02/hills` | Children running: could be read as the Prophet ﷺ as a child |
| `kids-ep03/caravan` | A small rider beside the man, same problem |
| `kids-ep03/sunrise` | A Western family with uncovered hair and a church-tower village |

**`teens-ep02/hills`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. The hills of Banu Sa'd at golden hour: a flock of lambs and young goats grazing on a far ridge, a
> shepherd's wooden staff stuck upright in the ground in the foreground, a small black tent far away. **No people at
> all.** Big sky, long light, peaceful childhood landscape.

**`teens-ep02/lunch`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. **Modern day, today:** a bright modern school cafeteria with plastic trays, steel tables and large windows.
> The camera looks over the shoulder of a teenager seen fully from behind (back of the head and backpack only) toward the
> far end, where one student sits alone, also seen fully from behind, with an empty chair beside them. All other students
> are out of focus and turned away. **No face or profile visible anywhere, no historical clothing or architecture.**

**`teens-ep03/clouds`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. Low angle from the sand near the ancient Kaaba: only its rough wall of stacked dark grey stones fills the
> right edge of the frame, **with no cloth, no band, no decoration and no writing of any kind**. Heavy dark rain clouds
> gather over the valley from every direction; the first fat drops of rain darken the dry sand in the foreground. No
> people.

**`teens-ep03/mattress`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. A thick mattress with a crimson and gold woven cover laid on the sand in the shade of a rough wall of stacked
> dark grey stones (the ancient Kaaba, **bare stone only: no cloth, no band, no calligraphy, no writing**), cushions in a
> circle around it, a sharp line between shade and sun across the sand. No people.

**`teens-ep03/grave-visit`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. The plain of al-Abwa at early morning: in the foreground a single simple grave marked with a few stones, with
> **nobody near it**. Far away on the horizon, tiny and faceless, a large group of riders and camels has stopped and stands
> still. Pale gold light, a gentle and moving mood.

**`teens-ep03/north`**
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no text or letters, no logos. Main subject centre-right; left third darker and simpler. A great trading caravan leaving Makkah at dawn and heading north: dozens of loaded camels in a long line
> winding out of the valley, dust glowing in the sunrise, the riders tiny adult silhouettes seen from behind. **No child
> or small figure anywhere.** Adventure ahead.

**`kids-ep02/hills`**
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered
> cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta
> palette with touches of crimson, teal and gold, landscape 3:2. No text or letters. Rolling desert hills at golden hour
> with fluffy lambs and baby goats skipping on the hilltops, birds in the sky, a little shepherd's staff and a small
> water skin resting on a rock in front. **No people and no children at all.** Freedom and play.

**`kids-ep03/caravan`**
> LOOK K (as above). A long, exciting caravan of many loaded camels with colourful bags leaving a small desert town at
> dawn and heading north, dust glowing in the sunrise, the riders small grown-up shapes seen from behind. **No child
> anywhere.** A big trip begins.

**`kids-ep03/sunrise`**
> LOOK K (as above). A beautiful morning sun rising over soft desert mountains around a small town of low mud-brick houses
> and palm trees, golden light spreading over the valley, birds flying. **No people at all, no churches, no European
> houses.** Hopeful and warm.

**Prompt lesson for every later batch:** never put a child, a boy or a single figure in a scene about the Prophet ﷺ (his
childhood, his journeys, his own actions). Show the place, the animals, the objects or a far crowd of adults. The Kaaba
is always bare stacked stone, or with plain undyed cloth, and never has a band or writing.

---

## Teens & Adults · Episode 4 · The Monk on the Road (folder `teens-ep04`, 18 images)

Save in `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\teens-ep04\` (inside `seerah`, please). Paste Message 0 first, as before. Nobody in this episode's
pictures is a child: the boy at the centre of the story is never drawn, only the places, the cloud, the tree and the
objects around him.

**1 · `cover`** · wide · dusk · basalt grey + one warm window
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A small stone monastery of black basalt on a low hill outside the Roman town of Busra in southern Syria at dusk. One small arched window glows warm; everything else is cool blue-grey. A trade road curves past the foot of the hill and disappears into the dark. Quiet, watchful.

**2 · `market`** · wide · early dawn · dust gold + crimson cloth
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A caravan yard on the edge of 6th-century Makkah at first light: dozens of camels kneeling while adult men, seen from behind, load bales of leather, cloth and spices; crimson and indigo cloth bundles, rope coils, dust in the low sunlight. Busy and hopeful, the start of a long trade journey.

**3 · `rope`** · macro · warm morning side light · leather brown
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. Extreme close-up of a strong adult man's hands tightening a rope knot on a loaded camel saddle; the camel's woolly side and a leather water skin fill the background. Only the hands and forearms are visible. Determination.

**4 · `route`** · aerial extreme wide · midday haze · sand and teal sky
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. An aerial view of the ancient trade road running north from the Hejaz: a thin pale track threading between black lava fields and sand dunes, a long caravan as tiny dots far along it, the horizon hazy. Immense distance.

**5 · `busra`** · wide from a hill · late afternoon · black basalt and gold
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. The Roman town of Busra in the Hawran: black basalt houses, columns, a large Roman theatre and a gate, palm and olive trees, green fields around it, late golden light. Small faceless adult figures in the streets far away. A wealthy frontier town of the Byzantine empire.

**6 · `cell`** · interior · lamplight · deep brown and gold
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. Inside a monk's stone cell: a narrow window looking down on a road, a wooden stool and a simple desk with a clay oil lamp, rolled scrolls tied with cord on a shelf (closed, nothing readable), a woollen cloak on a peg. No people. Years of watching and waiting.

**7 · `cloud`** · wide · harsh noon · white sun and one cool shadow
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A blazing white noon over the desert road: a caravan of camels with adult riders seen from far away and from the side; exactly above one part of the caravan floats a single small white cloud, throwing a soft shadow on the sand while everything else burns in sunlight. Strange and quiet.

**8 · `tree`** · medium wide · afternoon · deep green shade
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A single large old tree beside the trade road in the afternoon, its broad shade pooling on the ground; several camels kneel resting at the edge of the shade, bags still on their backs. The branches lean low over one side as if bending. No people visible.

**9 · `feast`** · medium · warm evening light · bread and copper
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. In the stone courtyard of the monastery, a long cloth spread on the ground with flat breads, bowls of olives and dates, copper jugs and cups, all set and waiting for guests; warm evening light. No people. A rare welcome.

**10 · `door`** · close-medium · light spilling out · dark wood and gold
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A heavy old wooden monastery door of dark planks with iron studs, standing half open; warm light spills out across the stone threshold onto the dusty road. No people. A door that never opened, opening.

**11 · `scrolls`** · still life · candle · parchment and shadow
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A still life of old rolled parchment scrolls and a closed leather codex tied with cords, stacked on a wooden table beside a candle, deep shadow behind. Nothing is open and nothing is readable. Old knowledge kept for a long time.

**12 · `pass`** · wide · dawn · rose and stone
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A rocky mountain pass on the road to Syria at dawn: tall boulders, a few wind-bent trees and bushes, the first light turning the rocks rose and gold, the road dropping down toward a green plain. No people. Majestic and still.

**13 · `lantern`** · close-medium · night · one warm light
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. On a dark night road, an adult hand holds up an old oil lantern, its warm light falling on the stones of the path ahead and leaving everything else in darkness. Only the hand and sleeve are visible. Seeing clearly by honest light.

**14 · `book`** · still life · window light · leather and dust
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A heavy ancient leather-bound book, closed and fastened with a metal clasp, resting on a stone ledge in a beam of window light with dust floating in it. No visible writing. A truth kept inside.

**15 · `fork`** · wide · evening · split warm and cool
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A desert road at evening that forks: one branch runs north into cold blue dusk, the other turns south toward warm golden light. In the sand where it splits, the hoofprints of two camels turn south. No people. A journey cut short.

**16 · `wallet`** · modern · interior daylight · neutral with teal
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. Modern day: the counter of a small corner shop; a teenager's hand (only the hand and the sleeve of a hoodie are visible) places a lost leather wallet on the counter toward the shopkeeper, who is out of frame. Bright, honest daylight.

**17 · `phone`** · modern · dusk · cool blue and warm streetlight
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. Modern day: a lost smartphone lying on a park bench at dusk, the screen dark, a warm streetlamp just coming on, an empty path beside it. No people. A small test nobody is watching.

**18 · `fijar`** · wide · dawn · grey dust and crimson
> LOOK T: a cinematic historical matte painting, photorealistic, 6th-century Arabia and Syria, dramatic natural light, deep shadows, volumetric light and dust, warm amber and bronze palette, landscape 3:2. No faces (people only from behind or as distant silhouettes), no prophet, angel or companion, no child or small figure anywhere, no text, letters or readable script, no logos. Main subject centre-right; left third darker and simpler. A dry plain at dawn after a tribal battle: spent arrows stuck in the sand in the foreground, a torn crimson banner on a broken pole, and far away a line of adult riders leaving in the dust. No bodies, no blood. The sad cost of feuds.

---

**Episode 4 check, 2026-10-27:** 28 of 29 placed. One redo:

**`teens-ep04/wallet`** (rejected: two different pictures stitched into one frame, a man in a robe above a city and the
shop counter below)
> LOOK T: a cinematic photorealistic image, landscape 3:2, ONE single continuous scene only (no split, no collage, no
> second picture inside the frame). No faces, no text, letters or readable signs, no logos. **Modern day, today:** the
> counter of a small corner shop in a Western city; a teenager's hand, with only the hand and the sleeve of a dark hoodie
> visible, slides a lost brown leather wallet across the counter toward the shopkeeper, who is out of frame. Shelves of
> snacks softly out of focus behind, bright honest daylight from the shop window, a touch of teal in the shop's colours.
> Main subject centre-right; left third darker and simpler.

Save as `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\teens-ep04\wallet.png`, replacing the old one.

---

## Kids · Episode 4 · The Monk on the Road (folder `kids-ep04`, 11 images)

Save in `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\kids-ep04\`.

**1 · `cover`** · wide · sunset · gold and grey stone
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A friendly little stone monastery on a green hill above a town of dark stones, a pink and gold sunset sky, one warm window glowing, a winding road with a tiny caravan of camels far away.

**2 · `yard`** · wide · morning · busy and colourful
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A busy caravan yard in the morning: many kneeling camels being loaded with colourful bags and rolls of cloth, grown-ups seen from behind, dust sparkling in the sun.

**3 · `road`** · map-like aerial · morning · sand and green
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A storybook bird's-eye view like a living map: a long dotted road winding from a small desert town in the south, through mountains and sand, to a green town of dark stone houses in the north; a tiny caravan on the road.

**4 · `monastery`** · medium · afternoon · stone and garden
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A small stone monastery with an arched door that is firmly shut, a little garden with olive trees, a bench and a bird bath, the road passing in front. Quiet, a little mysterious.

**5 · `cloud`** · wide · bright noon · white and blue
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A hot sunny desert with a caravan of camels and grown-up riders seen from far away; one small fluffy cloud floats right above part of the caravan, making a cool little shadow, while the sun shines everywhere else. Magical.

**6 · `tree`** · medium · afternoon · green
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A big round friendly tree by the road with its branches leaning down to make a big pool of shade; camels resting happily under it, little birds in the branches. No people.

**7 · `feast`** · medium · evening · warm
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A long cloth spread on the ground in a stone courtyard with warm bread, dates, olives, a honey pot and copper jugs, lanterns hanging above, everything ready for guests. No people.

**8 · `door`** · close-medium · warm light · wood and gold
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A big wooden door with iron studs swinging open, warm golden light and a few sparkles pouring out onto the road. No people.

**9 · `mercy`** · wide · sunrise · gold over many lands
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A gentle sunrise whose golden light spreads over many different lands at once: a desert, green hills, a river, a snowy mountain far away and the sea, all softly lit, birds flying. No people. Peaceful and kind.

**10 · `back`** · wide · evening · warm south, cool north
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A desert road that splits in two at evening: one way goes north into blue twilight, the other goes south toward golden light; two camels' footprints turn south in the sand. No people.

**11 · `pact`** · medium · night · lamp gold and crimson
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. Centre clear, edges simple. A cosy courtyard at night with a circle of cushions around a glowing oil lamp, a big bowl of dates in the middle, and stars above. No people. A special meeting is about to happen.

---

## Kids · Episode 1 · The Elephant Who Sat Down (folder `kids-ep01`, 10 images)

Owner, 2026-10-27: the Kids episodes use paintings too, and every picture now fills the whole slide like the Teens &
Adults ones (no window). Save in `C:\Users\ahmed\OneDrive\Desktop\watazawwado-archive\seerah\kids-ep01\`.

**1 · `cover`** · wide · sunset · grey and gold
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A huge gentle-looking grey war elephant in a decorated crimson-and-gold armour blanket standing alone in a red desert valley at sunset, long shadow, dust sparkling, mountains behind. Big, impressive, not scary.

**2 · `makkah`** · wide · morning · sand and blue
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. The little town of Makkah long ago: low sandy houses and a few palm trees around the simple stone Kaaba in a valley of round brown mountains, camels arriving with travellers seen from behind and far away. Peaceful and special.

**3 · `church`** · low angle · bright day · gold and white
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A shiny, enormous church with golden domes and colourful windows in a city in Yemen, a huge empty plaza in front with nobody visiting, a few pigeons. Grand but lonely.

**4 · `march`** · wide · hot afternoon · red and dust
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. Far away, a long army of soldiers with tall spears and several big elephants marching through a red rocky canyon, a big cloud of dust behind them, everything small and seen from a high hill. Exciting, not frightening.

**5 · `hills`** · wide · morning · cool shade and warm light
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. Families of Makkah climbing up a rocky hillside path with goats and bundles, seen from behind and far away, the little town and the Kaaba below in the valley.

**6 · `kneel`** · medium · bright morning · grey and gold
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A big grey elephant sitting down stubbornly in the middle of a dusty valley, front legs folded, ears flopped, while tiny soldiers far behind it pull on ropes with no success. Funny and wonderful.

**7 · `birds`** · wide · blue sky · dark birds and gold sun
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A bright blue sky filled with flocks of little swallow-like birds, each carrying three tiny round pebbles (one in its beak and one in each foot), the sun shining behind them over a desert valley.

**8 · `stones`** · medium · soft light · ochre
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. Tiny round clay pebbles falling gently like rain over an empty desert valley, dropped shields and a fallen banner on the sand, no people at all. Calm after a storm.

**9 · `cradle`** · interior · dawn · soft gold
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A simple clay room at dawn: an empty wooden cradle with a striped woollen blanket, a soft golden light glowing gently above it, an oil lamp and a little window showing the mountains of Makkah. Peaceful and full of hope.

**10 · `nurse`** · wide · sunset · crimson and sand
> LOOK K: a warm painted storybook scene between a children's picture book and an animated family film, soft 3D-rendered cartoon shapes with painterly gouache texture, rounded friendly forms, gentle warm light, cream, sand and terracotta palette with touches of crimson, teal and gold, landscape 3:2. No faces, no child or small figure anywhere, no prophet, angel or companion, no text or letters. The Kaaba, when shown, is a low cube of bare stacked grey stones with a plain dark cloth, no gold band and no writing. Keep the left third calm and simple: the text sits there; the picture fills the whole slide. A long sandy road leading out of a little desert town into open desert at sunset, small donkey hoofprints along the road, a big crimson sky with the first star. What will happen next?

---

## Visual registry (keeps images from repeating, for the whole series)

Before writing prompts for a new episode, Claude reads this table and the rules below. A new image may not repeat a
**key subject + shot** pair that is already here, and each episode must use at least five different shot types and at
least three different times of day.

| Ep | Version | Files: key subject (shot) |
|---|---|---|
| 1 | T | cover: Kaaba in valley, storm (extreme wide) · empires: two cities split (panorama) · jahiliyyah: bonfire camp (medium) · makkah: valley at sunrise (high wide) · abraha: empty throne hall (interior) · qullays: church (low angle) · scales: balance still life (macro) · march: army in canyon (wide high) · camp: torches and camel pen (wide night) · evacuate: families on mountain path (from below) · walk: lone old man to tent (long lens, backlit) · tent: two silhouettes on carpet (interior) · storm-tree: acacia on cliff (low wide) · kneel: elephant kneeling (eye level) · spear: broken spear (macro) · birds: flock against sun (low angle up) · stones: falling pebbles (close) · aftermath: battlefield, distant Kaaba (extreme wide) · return: people descending (hillside wide) · cradle: empty cradle, window (interior close) · yathrib: grave in palm grove (medium) · badiyah: tents, red sky, woman and donkey (wide) |
| 2 | T | cover: hoofprints to horizon (ground macro) · custom: lone tent on plateau (wide) · drought: empty water skin, dry well (medium close) · caravan: women's caravan in mist (extreme wide side) · night-cry: swinging hammock, she-camel (interior low) · passed-by: crossroads of footprints, teal cloth (top-down) · lanes: Makkah lane, striped shade (eye level) · doorway: woman at threshold (from behind) · harith: man by campfire (medium) · milk: overflowing bowl (still life) · donkey: donkey ahead of caravan (aerial) · green: valley after rain (wide) · seed: green shoot in crack (macro) · haze: Makkah in haze from ridge (wide) · hills: flock on a ridge, staff in front (extreme wide) · basin: golden basin in light (close) · vessel: glass washed clean (macro) · lunch: modern cafeteria, a student alone (over the shoulder) · abwa-road: road through lava hills (wide sunset) |
| 3 | T | cover: three lamps, two out (still life) · sandals: doorstep sandals (close) · journey: tiny caravan in vast desert (aerial) · palms: Yathrib gardens (medium wide) · lone-tent: tent at al-Abwa (wide night) · footprints: prints that stop and continue (top-down) · way-home: old man leads camel (from behind, dawn) · mattress: mattress by bare stone wall (medium) · wall: Kaaba stone corner (extreme close) · staff: staff and dying lamp (still life) · mourners: torch procession (extreme wide dusk) · uncle-house: family courtyard (interior) · clouds: storm by bare stone wall (low angle) · rain: water in the valley (wide) · duha: morning over mountains (wide) · grave-visit: empty grave, riders on the horizon (extreme wide) · shoulder: hand on teen's shoulder in masjid (modern) · bag: carrying a friend's bag (modern) · north: adult caravan leaving north (wide dawn) |
| 1 | K | cover: a huge gentle-looking grey war elephant in a decor · makkah: the little town of makkah long ago: low sandy hous · church: a shiny, enormous church with golden domes and col · march: far away, a long army of soldiers with tall spears · hills: families of makkah climbing up a rocky hillside pa · kneel: a big grey elephant sitting down stubbornly in the · birds: a bright blue sky filled with flocks of little swa · stones: tiny round clay pebbles falling gently like rain o · cradle: a simple clay room at dawn: an empty wooden cradle · nurse: a long sandy road leading out of a little desert t |
| 2 | K | cover: tents and grey donkey · dry: thin camel and sheep · trip: caravan, donkey last · town: Makkah lanes · door: woman at lit door · milk: bowl and happy camel · race: donkey racing ahead · green: green desert · hills: lambs and goats, staff and water skin · basin: golden bowl of water · road: camel on road at sunset |
| 3 | K | cover: three lamps · journey: map-like caravan route · palms: oasis · tent: tent under stars · rug: rug by Kaaba · staff: stick and low lamp · home: busy courtyard · clouds: rain clouds over Kaaba · rain: rain in valley · sunrise: town at sunrise, no people · caravan: adult caravan leaving town |
| 4 | T | cover: a small stone monastery of black basalt on a low hill o · market: a caravan yard on the edge of 6th-century makkah at fir · rope: extreme close-up of a strong adult man's hands tighteni · route: an aerial view of the ancient trade road running north  · busra: the roman town of busra in the hawran · cell: inside a monk's stone cell · cloud: a blazing white noon over the desert road · tree: a single large old tree beside the trade road in the af · feast: in the stone courtyard of the monastery, a long cloth s · door: a heavy old wooden monastery door of dark planks with i · scrolls: a still life of old rolled parchment scrolls and a clos · pass: a rocky mountain pass on the road to syria at dawn · lantern: on a dark night road, an adult hand holds up an old oil · book: a heavy ancient leather-bound book, closed and fastened · fork: a desert road at evening that forks · wallet: modern day · phone: modern day · fijar: a dry plain at dawn after a tribal battle |
| 4 | K | cover: a friendly little stone monastery on a green hill above · yard: a busy caravan yard in the morning · road: a storybook bird's-eye view like a living map · monastery: a small stone monastery with an arched door that is fir · cloud: a hot sunny desert with a caravan of camels and grown-u · tree: a big round friendly tree by the road with its branches · feast: a long cloth spread on the ground in a stone courtyard  · door: a big wooden door with iron studs swinging open, warm g · mercy: a gentle sunrise whose golden light spreads over many d · back: a desert road that splits in two at evening · pact: a cosy courtyard at night with a circle of cushions aro |

**Rules for the next episodes**
- Recurring places (the Kaaba, Makkah, the desert) come back with a new angle each time: never the same distance, light
  and side twice. Recurring motifs (the lamp, footprints, the grey donkey) are allowed once more only when the story
  calls back to them, and the prompt says so.
- Rotate the dominant colour between neighbouring pages (gold, crimson, teal, night blue, green, silver).
- Each episode includes at least one modern projection image (Teens & Adults) so the learner sees themselves in it.
- Kids images never show sad or frightening details up close; grief is shown by objects (lamps, a stick, a road).
