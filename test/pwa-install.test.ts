import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, canOfferInstall } from '../src/lib/pwaInstall';

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  firefoxDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0',
};

test('detectPlatform names each browser family', () => {
  assert.equal(detectPlatform(UA.iphoneSafari), 'ios-safari');
  assert.equal(detectPlatform(UA.iphoneChrome), 'ios-other');
  assert.equal(detectPlatform(UA.androidChrome), 'android');
  assert.equal(detectPlatform(UA.samsung), 'samsung');
  assert.equal(detectPlatform(UA.firefoxAndroid), 'firefox-android');
  assert.equal(detectPlatform(UA.firefoxDesktop), 'firefox');
  assert.equal(detectPlatform(UA.macSafari), 'mac-safari');
  assert.equal(detectPlatform(UA.windowsEdge), 'desktop');
});

test('canOfferInstall: one-tap prompt always, the gesture where a browser allows it, nothing on desktop Firefox or once installed', () => {
  assert.equal(canOfferInstall({ installed: false, canPrompt: true, platform: 'firefox' }), true);
  assert.equal(canOfferInstall({ installed: false, canPrompt: false, platform: 'ios-other' }), true);
  assert.equal(canOfferInstall({ installed: false, canPrompt: false, platform: 'firefox-android' }), true);
  assert.equal(canOfferInstall({ installed: false, canPrompt: false, platform: 'firefox' }), false);
  assert.equal(canOfferInstall({ installed: true, canPrompt: true, platform: 'android' }), false);
});
