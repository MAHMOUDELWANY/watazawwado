# The Quran tab: word check (detector) and its licence

Classroom BUILD-LIST 4.4 and 4.5. Spec: `docs/superpowers/specs/2026-11-17-classroom-design.md` §9.

## What it does

A learner opens a recite homework in the Quran tab, records the assigned ayat, and taps "Check my words". A Quran-tuned
Whisper model runs **in the learner's browser** and transcribes the recording. We line the transcript up against the
expected words of the assigned ayat (the API's `text_imlaei_simple`) and flag words that are **missing**, **changed** or
**extra**. The flags show on the mushaf and in a short list. The learner can then send the recording to the teacher
(the NX-03 flow); the flags go with it to `quran_detector_runs` for the accuracy test.

The audio never leaves the device for the check. Only a recording the learner chooses to send is uploaded, exactly as
before (NX-03, deleted after 30 days).

## The model

| | |
|---|---|
| Model | `tarteel-ai/whisper-base-ar-quran` (Whisper base fine-tuned on Quran recitation by Tarteel AI) |
| Licence | **Apache-2.0** (model card on Hugging Face). Commercial use, modification and redistribution allowed, with the licence and notices kept. |
| Base model | OpenAI Whisper, **MIT** licence. |
| Browser build | `eventhorizon0/tarteel-ai-onnx-whisper-base-ar-quran` (revision `86aa2ae9`), an ONNX conversion of the model above, also tagged Apache-2.0. We keep **our own unchanged copy** (below). |
| Runtime | `@huggingface/transformers` 4.3.2 (Apache-2.0), loaded from jsDelivr only when a learner taps "Check my words". |
| Override | `VITE_QURAN_MODEL_BASE_URL` (build-time) points at another copy with the same layout; `VITE_QURAN_DETECTOR_MODEL` changes the Hugging Face fallback. |

Credit shown under the check in the Quran tab (the site has no credits page; the approved legal pages stay as they
are): "Word check uses whisper-base-ar-quran by Tarteel AI (Apache-2.0), based on OpenAI Whisper (MIT)."

## Where the files live (our copy)

- Public Supabase Storage bucket **`quran-models`** (migration `20261122000001_quran_models_bucket.sql`), folder
  `whisper-base-ar-quran/`: the configs and tokenizer, `onnx/encoder_model_quantized.onnx` +
  `onnx/decoder_model_merged_quantized.onnx` (WASM, about 231 MB) and `onnx/encoder_model.onnx` +
  `onnx/decoder_model_merged.onnx` (WebGPU, about 290 MB), plus `LICENSE.txt` (Apache-2.0), `NOTICE.txt` and
  `manifest.json`. About 525 MB of the free plan's 1 GB.
- The free plan refuses uploads over 50 MB, so files over 45 MB are stored as `<file>.part0`, `.part1`, ... and
  `manifest.json` lists each file's size and part count. The browser (`src/quran/detectorModel.ts`, `partsFetch`)
  joins the parts back into one file before transformers.js reads it; the browser caches the result.
- The browser reads `manifest.json` first. If it is missing (copy not uploaded yet) or fails, it falls back to the
  Hugging Face copy, as before. The base URL comes from `VITE_SUPABASE_URL`, so no new setting is needed.
- **Egress, the real limit:** Supabase free includes 5 GB of egress a month and a first-time check downloads about
  231 MB (WASM) or 290 MB (WebGPU), so roughly 20 first-time learners a month before the quota runs out (repeat
  checks come from the browser cache). Owner decision before many learners use it: stay on Hugging Face's free CDN for
  the download and keep our copy as the backup, or move the copy to a host without egress fees (for example our own
  Hugging Face repo or Cloudflare R2, which the same `VITE_QURAN_MODEL_BASE_URL` can point at).

## How to upload or refresh it

1. Apply `20261122000001_quran_models_bucket.sql`, then `20261122000002_quran_models_any_type.sql` (any file type).
2. From the main checkout: `npx tsx --env-file=.env scripts/quran/upload-model.ts`. It reads `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` at run time (never printed), downloads the pinned revision, checks every file against
   the hash Hugging Face lists, uploads the parts, and uploads `manifest.json` last (so a half-done run never switches
   learners to an incomplete copy).
3. To refresh to a newer conversion: change `REVISION` in the script (after checking the licence is still
   Apache-2.0) and run it again.

## Which devices run it

`src/quran/detectorModel.ts` `decideSupport`:
- WebAssembly and Web Audio are required.
- If the browser reports `navigator.deviceMemory` under 4 GB, the model is not tried.
- WebGPU is used when an adapter exists (fp32 weights, ~290 MB); otherwise WASM with the 8-bit quantized weights
  (~231 MB: the merged decoder of this conversion is not smaller when quantized), downloaded once and cached.
- Any device that fails these checks, or where loading or running fails, sees: "This device cannot check recordings.
  Send your recording to your teacher" and can still record and send (NX-03).

## Accuracy before any automatic hint (4.5)

- Each sent recording with a check result appears in the teacher's recitation inbox with "Mark the words". The teacher
  marks by ear **without seeing the detector's flags** (blind), choosing wrong word, missed, added or tajweed note.
- Super admin page `/dashboard/quran-accuracy` (API `GET /api/admin/quran/accuracy`): agreement per recording is the
  words both flagged over the words either flagged (tajweed notes are not compared; the detector is word-level), 1.0
  when both found nothing. The page shows the average and the count.
- **Automatic tajweed hints are not built and never shown.** The switch `QURAN_TAJWEED_HINTS=on` only counts once 100
  reviewed recordings average 90% or more (`accuracySummary().hintsOn`); it defaults off.

## Known limits

- The model hears words, not tajweed. Flags are a helper; the teacher decides.
- Uthmani spelling differs from plain Arabic; we compare against the API's simple spelling and accept words whose
  letters are 75% alike (`SAME_WORD` in `src/lib/quran/align.ts`), so one dropped letter is not a mistake.
- Recordings are capped at 3 minutes (NX-03), so long assignments are checked in parts.
