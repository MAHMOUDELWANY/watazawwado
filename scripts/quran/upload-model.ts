/**
 * Copies the Quran word-check model into our own public bucket `quran-models` (docs/classroom/QURAN-DETECTOR.md).
 *
 *   npx tsx --env-file=.env scripts/quran/upload-model.ts
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (read at run time, never printed).
 * Downloads the Apache-2.0 files of the pinned revision from Hugging Face, checks each one against the hash Hugging
 * Face lists, cuts files over PART_BYTES into parts (the free plan refuses uploads over 50 MB), uploads them, and
 * uploads manifest.json LAST: the browser switches to our copy only once the manifest exists, so a half-finished run
 * never breaks the check. To refresh, change REVISION and run again.
 */
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export const SOURCE_REPO = 'eventhorizon0/tarteel-ai-onnx-whisper-base-ar-quran';
export const REVISION = '86aa2ae915f3b11c60b4c031774a7b5123477ba5';
export const BUCKET = 'quran-models';
export const FOLDER = 'whisper-base-ar-quran';
export const PART_BYTES = 45 * 1024 * 1024;
/** What transformers.js loads: the configs and tokenizer, and the ONNX files for WASM (q8) and WebGPU (fp32). */
export const FILES = [
  'added_tokens.json', 'config.json', 'generation_config.json', 'merges.txt', 'normalizer.json', 'preprocessor_config.json',
  'special_tokens_map.json', 'tokenizer.json', 'tokenizer_config.json', 'vocab.json',
  'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx', 'onnx/encoder_model.onnx', 'onnx/decoder_model_merged.onnx',
];

/** Byte ranges of the parts of a file; one range when it fits. */
export function splitRanges(size: number, partBytes = PART_BYTES): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let start = 0; start < size || out.length === 0; start += partBytes) out.push([start, Math.min(size, start + partBytes)]);
  return out;
}

/** Hugging Face lists LFS files by sha256 and small files by their git blob sha1. */
export function matchesHub(bytes: Buffer, entry: { oid: string; lfs?: { oid: string } }): boolean {
  if (entry.lfs) return createHash('sha256').update(bytes).digest('hex') === entry.lfs.oid;
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') === entry.oid;
}

const NOTICE = `whisper-base-ar-quran
Model by Tarteel AI (tarteel-ai/whisper-base-ar-quran), licensed under the Apache License 2.0.
Based on OpenAI Whisper (MIT licence).
ONNX conversion: ${SOURCE_REPO} (Apache-2.0), revision ${REVISION}.
Copied unchanged by Watazawwado Academy for the in-browser word check. Large files are stored in parts
(<file>.part0, .part1, ...) and joined in the browser; manifest.json lists them.
`;

const contentType = (p: string) => (p.endsWith('.json') ? 'application/json' : p.endsWith('.txt') ? 'text/plain' : 'application/octet-stream');

async function listHub(): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  for (const dir of ['', 'onnx']) {
    const res = await fetch(`https://huggingface.co/api/models/${SOURCE_REPO}/tree/${REVISION}${dir ? `/${dir}` : ''}`);
    if (!res.ok) throw new Error(`Hugging Face listing ${dir || '/'}: ${res.status}`);
    for (const e of await res.json() as any[]) out.set(e.path, e);
  }
  return out;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for example with --env-file=.env).');
  const storage = createClient(url, key, { auth: { persistSession: false } }).storage.from(BUCKET);
  const put = async (path: string, body: Buffer | string, type: string) => {
    const { error } = await storage.upload(`${FOLDER}/${path}`, body, { upsert: true, contentType: type });
    if (error) throw new Error(`upload ${path}: ${error.message}`);
  };

  const hub = await listHub();
  const manifest: { source: string; revision: string; files: Record<string, { size: number; parts?: number }> } = { source: SOURCE_REPO, revision: REVISION, files: {} };
  for (const file of FILES) {
    const entry = hub.get(file);
    if (!entry) throw new Error(`${file} is not in ${SOURCE_REPO}@${REVISION}`);
    const res = await fetch(`https://huggingface.co/${SOURCE_REPO}/resolve/${REVISION}/${file}`);
    if (!res.ok) throw new Error(`download ${file}: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!matchesHub(bytes, entry)) throw new Error(`${file}: the download does not match the hash Hugging Face lists`);
    const ranges = splitRanges(bytes.length);
    if (ranges.length === 1) await put(file, bytes, contentType(file));
    else for (const [i, [a, b]] of ranges.entries()) await put(`${file}.part${i}`, bytes.subarray(a, b), 'application/octet-stream');
    manifest.files[file] = ranges.length > 1 ? { size: bytes.length, parts: ranges.length } : { size: bytes.length };
    console.log(`${file}: ${(bytes.length / 1048576).toFixed(1)} MB${ranges.length > 1 ? ` in ${ranges.length} parts` : ''}`);
  }
  const licence = await fetch('https://www.apache.org/licenses/LICENSE-2.0.txt');
  if (!licence.ok) throw new Error(`Apache licence text: ${licence.status}`);
  await put('LICENSE.txt', await licence.text(), 'text/plain');
  await put('NOTICE.txt', NOTICE, 'text/plain');
  await put('manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
  console.log(`Done. The browser now loads ${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${FOLDER}/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
