// V7 v5 sample (2026-11-21), on the Faris rules. Absolute seconds of v7.voice.wav (word times from v7.timeline.json).
// Words: "word@start", *word* = key word (big, accent), " / " = line break, _ = space inside one token.
// Mouth points (u,v of art/mouth): ك back of tongue at the soft palate (0.60, 0.375); ق deeper, at the uvula (0.65, 0.43).
const A = { heart: 'art/heart/cut.png', dog: 'art/dog/cut.png', mouth: 'art/mouth/cut.png' };
const K = [0.6, 0.375], Q = [0.65, 0.43];
const REELS = {
  v7: {
    // 4 cuts, 5 stages: hook · the difference · the mouth · the test · the close
    cuts: [9.42, 13.9, 28.75, 35.16],
    moods: [[0, 'sand'], [3.55, 'gold'], [6.4, 'espresso'], [9.42, 'sand'], [22.3, 'crimson'], [24.2, 'sand'], [28.75, 'espresso'], [32.6, 'gold'], [35.16, 'crimson']],
    cam: [[0, 1, 0, 0, 0], [3.5, 1.06, 0, -20, 0], [9.42, 1.16, 0, -60, 0], [9.42, 1, 0, 0, 0], [13.9, 1.06, 0, -20, 0], [13.9, 1, 0, 0, 0],
      [18.3, 1.05, -20, 0, 0], [23.1, 1.24, -150, -80, 0], [24.4, 1.08, -40, -20, 0], [28.75, 1.12, -60, -30, 0], [28.75, 1, 0, 0, 0],
      [32.6, 1.05, 0, 0, 0], [35.16, 1.1, 0, -20, 0], [35.16, 1, 0, 0, 0], [36.82, 1.04, 0, 0, 0]],
    items: [
      // ── stage 1 · hook: one letter turns a heart into a dog
      { t: 'cast', s: 0.05, e: 3.5, side: 'l', h: 980, edge: -120, bottom: 240, poses: [[0, 'noor-stand'], [2.63, 'noor-surprised']] },
      { t: 'words', s: 0.23, e: 1.3, y: 380, text: 'One@0.23 *letter…*@0.55' },
      { t: 'words', s: 1.35, e: 3.45, y: 330, text: 'and@1.35 your@1.59 *heart*@1.83 / becomes@2.15 a@2.55 *dog.*@2.63' },
      { t: 'img', s: 1.8, e: 3.5, frame: 'polaroid', src: 'art/heart/image_0.png', cap: 'heart', flipAt: 2.63, flipTo: 'art/dog/image_0.png', flipCap: 'dog', x: 720, y: 1150, w: 480, h: 560, rot: 6, enter: 'drop', exit: 'zoom' },
      { t: 'img', s: 3.55, e: 9.4, id: 'hd', src: A.heart, swapTo: [6.42, A.dog], x: 540, y: 1230, w: 860, kb: 0.1 },
      { t: 'ar', s: 3.6, e: 9.4, y: 300, text: 'قَلْب', swap: [[6.46, 'كَلْب']] },
      { t: 'words', s: 4.5, e: 6.35, y: 660, size: 70, text: 'Qalb:@4.50 *heart.*@5.46' },
      { t: 'words', s: 7.44, e: 9.35, y: 660, size: 70, text: 'Kalb:@7.44 *dog.*@8.48' },
      // ── stage 2 · the difference, and a promise
      { t: 'words', s: 9.46, e: 11.95, y: 330, text: 'The@9.46 *difference*@9.62 / is@10.26 where@10.50 your@10.66 / *tongue*@10.90 hits.@11.22' },
      { t: 'words', s: 12.02, e: 13.85, y: 360, text: 'And@12.02 there\'s@12.34 a@12.54 / *test*@12.66 at@12.98 the@13.10 end.@13.22' },
      { t: 'cast', s: 9.5, side: 'r', h: 880, edge: -110, bottom: 220, poses: [[0, 'noor-think'], [12.66, 'noor-surprised']] },
      { t: 'img', s: 9.62, frame: 'polaroid', src: 'art/heart/image_0.png', cap: 'qalb', x: 300, y: 1130, w: 340, h: 400, rot: -8, enter: 'drop', float: 1 },
      { t: 'img', s: 10.9, frame: 'polaroid', src: 'art/dog/image_0.png', cap: 'kalb', x: 470, y: 1460, w: 340, h: 400, rot: 7, enter: 'drop', float: 1 },
      { t: 'zad', s: 12.66, x: 160, y: 1700, w: 190, peek: 1, poses: [[0, 'wow']] },
      // ── stage 3 · the mouth: kaf light, qaf heavy, say it with me
      { t: 'img', s: 13.9, id: 'm', src: A.mouth, x: 640, y: 1150, w: 900, kb: 0.02 },
      { t: 'cast', s: 14.0, e: 18.3, side: 'l', h: 800, edge: -110, bottom: 230, flip: 1, poses: [[0, 'hamza-explain'], [16.74, 'hamza-stand']] },
      { t: 'words', s: 13.94, e: 16.6, y: 300, size: 84, text: '*Kaf*@13.94 is@14.42 the@14.66 / *K*@14.82 you@15.14 already@15.46 know.@16.02' },
      { t: 'words', s: 16.74, e: 17.5, y: 360, text: '*Light.*@16.74' },
      { t: 'mag', s: 14.82, e: 24.1, on: 'm', points: [[14.82, ...K, 'ك'], [19.81, ...Q, 'ق']] },
      { t: 'ar', s: 17.58, e: 18.3, y: 300, text: 'كَ' },
      { t: 'words', s: 18.42, e: 20.5, y: 300, text: '*Qaf*@18.42 sits@18.85 / further@19.33 *back,*@19.81' },
      { t: 'words', s: 20.61, e: 22.25, y: 300, text: 'right@20.61 where@20.93 / you\'d@21.09 *gargle.*@21.33' },
      { t: 'scan', s: 21.33, on: 'm' },
      { t: 'words', s: 22.37, e: 23.1, y: 360, text: '*Heavy.*@22.37' },
      { t: 'ar', s: 23.2, e: 24.1, y: 300, text: 'قَ' },
      { t: 'words', s: 24.25, e: 25.3, y: 320, text: 'Say@24.25 it@24.45 with@24.57 *me.*@24.81' },
      { t: 'cast', s: 24.25, side: 'r', h: 820, edge: -170, bottom: 230, poses: [[0, 'zayn-point'], [27.45, 'zayn-think']] },
      { t: 'ar', s: 25.38, e: 27.35, y: 300, text: 'كَ', swap: [[26.58, 'قَ']] },
      { t: 'mag', s: 25.38, on: 'm', points: [[25.38, ...K, 'ك'], [26.58, ...Q, 'ق']] },
      { t: 'words', s: 27.45, y: 320, text: 'Feel@27.45 it@27.65 *move*@27.77 back?@28.01' },
      // ── stage 4 · the test
      { t: 'bars', s: 28.75, e: 32.6 },
      { t: 'words', s: 28.79, e: 29.65, y: 330, text: 'Test@28.79 *time.*@28.95' },
      { t: 'ring', s: 28.95, e: 31.55, x: 540, y: 620, dur: 2.6 },
      { t: 'img', s: 29.75, frame: 'polaroid', src: 'art/heart/image_0.png', cap: 'heart', x: 300, y: 1130, w: 400, h: 470, rot: -6, enter: 'drop', grayAt: 99, glowAt: 32.65 },
      { t: 'img', s: 30.47, frame: 'polaroid', src: 'art/dog/image_0.png', cap: 'dog', x: 780, y: 1130, w: 400, h: 470, rot: 6, enter: 'drop', grayAt: 32.65 },
      { t: 'words', s: 29.75, e: 31.5, y: 330, text: '*Heart,*@29.75 or@30.35 *dog?*@30.47' },
      { t: 'ar', s: 31.59, e: 32.6, y: 360, text: 'قَلْب' },
      { t: 'cast', s: 32.65, side: 'r', h: 820, edge: -60, bottom: 150, poses: [[0, 'noor-happy']] },
      { t: 'words', s: 32.65, e: 33.4, y: 330, text: '*Heart!*@32.65' },
      { t: 'words', s: 33.45, y: 330, text: 'Your@33.45 heart@33.69 / is@34.01 *safe.*@34.49' },
      { t: 'stamp', s: 34.49, y: 1540, rot: -9, text: '✓ SAFE' },
      // ── stage 5 · the close
      { t: 'zad', s: 35.16, x: 540, y: 1180, w: 440, poses: [[0, 'cheer']] },
      { t: 'words', s: 35.21, y: 560, text: 'Pack@35.21 your@35.32 *zaad.*@35.48' },
    ],
  },
};
