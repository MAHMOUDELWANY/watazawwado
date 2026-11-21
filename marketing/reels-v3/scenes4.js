// V7 v4 sample (2026-11-21). Art: Meshy image-to-image in the curriculum style (art/), cast: Teens curriculum cut-outs.
// Mouth diagram points (u,v of art/mouth): ك back of tongue at the soft palate (0.60, 0.375); ق deeper, at the uvula (0.65, 0.43).
const A = { heart: 'art/heart/image_0.png', dog: 'art/dog/image_0.png', mouth: 'art/mouth/image_0.png' };
const C = (n) => '../../public/curriculum/zad-teens/characters/' + n + '.webp';
const K = { u: 0.6, v: 0.375 }, Q = { u: 0.65, v: 0.43 };
const SCENES = {
  v7: [
    { p: [0, 0], cam: [[1, 0, 0, 0], [1.08, 0, -30, 0]], items: [
      { t: 'char', src: C('noor-surprised'), side: 'l', h: 1000, at: 0 },
      { t: 'big', text: 'One *letter…*', top: 430 },
      { t: 'img', src: A.heart, frame: 'polaroid', x: 700, y: 1080, w: 470, rot: 6, drop: 1, at: 'heart', cap: 'heart', flipTo: A.dog, flipCap: 'dog', flipAt: 'dog' }] },
    { p: [1, 2], flash: 1, cam: [[1, 0, 0, 0], [1.18, 0, -60, 0]], items: [
      { t: 'img', src: A.heart, frame: 'soft', x: 540, y: 1100, w: 1000, at: 0 },
      { t: 'ar', text: 'قَلْب', at: 'قلب', top: 360 },
      { t: 'chip', text: 'QALB  ·  HEART', at: 'heart', top: 700 }] },
    { p: [3, 4], flash: 1, cam: [[1.05, 0, 0, 0], [1.2, 0, -40, 0]], items: [
      { t: 'img', src: A.dog, frame: 'soft', x: 540, y: 1120, w: 1000, at: 0 },
      { t: 'ar', text: 'كَلْب', at: 'كلب', top: 360 },
      { t: 'chip', text: 'KALB  ·  DOG', at: 'dog', top: 700 }] },
    { p: [5, 5], bg: 1, pose: 'think', cam: [[1, 0, 0, 0], [1.06, 0, -20, 0]], items: [
      { t: 'big', text: 'Where your *tongue* hits', top: 420, size: 'm' },
      { t: 'img', src: A.heart, frame: 'polaroid', x: 320, y: 1060, w: 390, rot: -7, drop: 1, at: 'difference', cap: 'qalb' },
      { t: 'img', src: A.dog, frame: 'polaroid', x: 760, y: 1060, w: 390, rot: 7, drop: 1, at: 'tongue', cap: 'kalb' },
      { t: 'chip', text: 'TEST AT THE END', at: 'test', top: 1370 }] },
    { p: [6, 7], bg: 1, cam: [[1, 0, 0, 0], [1.05, -20, 0, 0]], items: [
      { t: 'img', id: 'm', src: A.mouth, frame: 'soft', x: 620, y: 1060, w: 900, at: 0, kb: 0.03 },
      { t: 'char', src: C('hamza-explain'), side: 'l', h: 880, edge: -150, bottom: 300, flip: 1, at: 0.1 },
      { t: 'big', text: 'The K you *know*', top: 400, size: 'm' },
      { t: 'mag', on: 'm', zoom: 2.4, points: [{ at: 'kaf', ...K, lab: 'ك' }] },
      { t: 'chip', text: 'LIGHT', at: 'light', top: 540 }] },
    { p: [8, 9], bg: 1, cam: [[1.05, -20, 0, 0], [1.22, -140, -70, 0]], items: [
      { t: 'img', id: 'm', src: A.mouth, frame: 'soft', x: 620, y: 1060, w: 900, at: 0, kb: 0 },
      { t: 'big', text: 'Further *back*', top: 400, size: 'm' },
      { t: 'mag', on: 'm', zoom: 2.4, points: [{ at: 0.05, ...K, lab: 'ك' }, { at: 'back', ...Q, lab: 'ق' }] },
      { t: 'scan', on: 'm', at: 'gargle' },
      { t: 'chip', text: 'HEAVY', at: 'heavy', top: 540 }] },
    { p: [10, 12], bg: 1, cam: [[1.1, -60, -30, 0], [1.12, -70, -40, 0]], items: [
      { t: 'img', id: 'm', src: A.mouth, frame: 'soft', x: 620, y: 1060, w: 900, at: 0, kb: 0 },
      { t: 'char', src: C('zayn-point'), side: 'r', h: 820, edge: -170, bottom: 290, at: 0.1 },
      { t: 'big', text: 'Say it with *me*', top: 400, size: 'm' },
      { t: 'mag', on: 'm', zoom: 2.4, points: [{ at: 0.1, ...K, lab: 'ك' }, { at: 'ق', ...Q, lab: 'ق' }] },
      { t: 'sub', text: 'Feel it move back?', at: 'feel', top: 540 }] },
    { p: [13, 14], flash: 1, cam: [[1, 0, 0, 0], [1.06, 0, 0, 0]], items: [
      { t: 'bars' },
      { t: 'big', text: 'Test *time*', top: 300, size: 'm' },
      { t: 'ring', x: 540, y: 560, at: 0.2, dur: 2.9 },
      { t: 'img', src: A.heart, frame: 'polaroid', x: 310, y: 1040, w: 400, rot: -6, drop: 1, at: 'heart', cap: 'heart' },
      { t: 'img', src: A.dog, frame: 'polaroid', x: 770, y: 1040, w: 400, rot: 6, drop: 1, at: 'dog', cap: 'dog' }] },
    { p: [15, 15], cam: [[1.04, 0, 0, 0], [1.1, 0, -20, 0]], items: [
      { t: 'char', src: C('noor-happy'), side: 'l', h: 900, edge: -160, at: 0 },
      { t: 'big', text: 'Your heart is *safe*', top: 380, size: 'm' },
      { t: 'img', src: A.dog, frame: 'polaroid', x: 880, y: 1260, w: 250, rot: 10, at: 0, cap: 'dog', fadeAt: 'heart' },
      { t: 'img', src: A.heart, frame: 'polaroid', x: 600, y: 980, w: 500, rot: -3, at: 0, cap: 'heart', glowAt: 'heart' },
      { t: 'stamp', text: '✓ SAFE', at: 'safe', top: 1290, rot: -10 }] },
    { p: [16, 16], pose: 'cheer', zad: 'center', cam: [[1, 0, 0, 0], [1.04, 0, 0, 0]], items: [
      { t: 'stamp', text: 'PACKED ✓', at: 0, top: 500 },
      { t: 'big', text: 'Pack your *zaad*', top: 690, size: 'm' }] },
  ],
};
