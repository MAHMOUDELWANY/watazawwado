import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clipUrl, playClip } from '../src/curriculum/slides/clip';

// Voice clips on lesson pages (design §3a): our clips are files per lesson; ayat stream from a reciter.
describe('Voice clips', () => {
  it('a clip lives under its subject and lesson', () => {
    assert.equal(clipUrl('literacy-a-kids', 1, { id: 'ba', text: 'بَ', voice: 'fusha' }), '/curriculum/literacy-a-kids/audio/l01-ba.mp3');
  });

  it('an ayah streams from the reciter, never from a clone', () => {
    assert.equal(clipUrl('literacy-b-kids', 1, { id: 'fatiha-1', text: '', voice: 'reciter', quran: true, ayah: '1:1' }),
      'https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/001001.mp3');
  });

  it('missing clip file does not throw', async () => {
    const audio = { play: () => Promise.reject(new Error('404')) };
    assert.equal(await playClip(audio), 'missing');
  });

  it('a clip that plays reports it', async () => {
    assert.equal(await playClip({ play: () => Promise.resolve() }), 'played');
  });
});

describe('Voice clips: review fixes', () => {
  it('an interrupted clip (AbortError) is not reported as missing', async () => {
    const err = Object.assign(new Error('interrupted'), { name: 'AbortError' });
    assert.equal(await playClip({ play: () => Promise.reject(err) }), 'aborted');
  });
});
