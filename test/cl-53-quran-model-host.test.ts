import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { FILES, PART_BYTES, matchesHub, splitRanges } from '../scripts/quran/upload-model.js';
import { ownPath, partsFetch } from '../src/quran/detectorModel.js';

const BASE = 'https://x.supabase.co/storage/v1/object/public/quran-models/whisper-base-ar-quran';

describe('CL-53 our copy of the Quran model', () => {
  it('cuts files over the upload limit into parts under 50 MB', () => {
    assert.deepStrictEqual(splitRanges(1000), [[0, 1000]]);
    const big = splitRanges(208_492_186);
    assert.strictEqual(big.length, 5);
    assert.ok(big.every(([a, b]) => b - a <= PART_BYTES && b - a < 50 * 1024 * 1024));
    assert.deepStrictEqual([big[0][0], big[4][1]], [0, 208_492_186]);
    assert.deepStrictEqual(splitRanges(0), [[0, 0]]);
  });

  it('checks downloads against the hashes Hugging Face lists', () => {
    const bytes = Buffer.from('{"a":1}');
    const sha1 = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.ok(matchesHub(bytes, { oid: sha1 }));
    assert.ok(matchesHub(bytes, { oid: 'x', lfs: { oid: createHash('sha256').update(bytes).digest('hex') } }));
    assert.ok(!matchesHub(Buffer.from('tampered'), { oid: sha1 }));
  });

  it('copies the files the browser loads, WASM and WebGPU', () => {
    for (const f of ['config.json', 'tokenizer.json', 'preprocessor_config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx', 'onnx/encoder_model.onnx', 'onnx/decoder_model_merged.onnx']) assert.ok(FILES.includes(f), f);
  });

  it('the browser joins parts back into one file and leaves other URLs alone', async () => {
    const asked: string[] = [];
    const inner = (async (u: any) => { asked.push(String(u)); return new Response(String(u).endsWith('.part0') ? 'abc' : String(u).endsWith('.part1') ? 'de' : 'whole'); }) as typeof fetch;
    const f = partsFetch(BASE, { files: { 'onnx/big.onnx': { size: 5, parts: 2 }, 'config.json': { size: 5 } } }, inner);
    const joined = await f(`${BASE}/onnx/big.onnx`);
    assert.strictEqual(await joined.text(), 'abcde');
    assert.strictEqual(joined.headers.get('content-length'), '5');
    assert.strictEqual(await (await f(`${BASE}/config.json`)).text(), 'whole');
    assert.strictEqual(await (await f('https://huggingface.co/x/resolve/main/config.json')).text(), 'whole');
    assert.deepStrictEqual(asked, [`${BASE}/onnx/big.onnx.part0`, `${BASE}/onnx/big.onnx.part1`, `${BASE}/config.json`, 'https://huggingface.co/x/resolve/main/config.json']);
    assert.strictEqual(ownPath(`${BASE}/onnx/a.onnx?download=1`, BASE), 'onnx/a.onnx');
    assert.strictEqual(ownPath('https://elsewhere/onnx/a.onnx', BASE), null);
  });

  it('falls back to the Hugging Face copy until ours exists; the bucket is public read, the key is never printed', () => {
    const src = fs.readFileSync('src/quran/detectorModel.ts', 'utf8');
    assert.match(src, /if \(!res\.ok\) return DETECTOR_MODEL;/);
    const sql = fs.readFileSync('supabase/migrations/20261122000001_quran_models_bucket.sql', 'utf8');
    assert.match(sql, /\('quran-models', 'quran-models', true, 52428800/);
    const script = fs.readFileSync('scripts/quran/upload-model.ts', 'utf8');
    assert.doesNotMatch(script, /console\.\w+\([^)]*\bkey\b/);
    assert.ok(script.indexOf("put('manifest.json'") > script.indexOf('for (const file of FILES)'), 'manifest goes up last');
  });
});
