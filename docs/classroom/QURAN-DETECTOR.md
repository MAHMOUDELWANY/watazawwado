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
| Browser build we load | `eventhorizon0/tarteel-ai-onnx-whisper-base-ar-quran`, an ONNX conversion of the model above, also tagged Apache-2.0, with `onnx/*_quantized.onnx` files for transformers.js. |
| Runtime | `@huggingface/transformers` 4.3.2 (Apache-2.0), loaded from jsDelivr only when a learner taps "Check my words". |
| Override | `VITE_QURAN_DETECTOR_MODEL` (build-time) points at another Hugging Face repo with the same layout. |

Attribution to keep in our legal/credits page: "Word check uses whisper-base-ar-quran by Tarteel AI (Apache-2.0),
based on OpenAI Whisper (MIT)."

Recommended before launch (owner decision): copy the ONNX files into a Hugging Face repo we own (or our own storage)
and set `VITE_QURAN_DETECTOR_MODEL` to it, so a third party deleting or changing the conversion cannot break or alter
the check. The licence allows this.

## Which devices run it

`src/quran/detectorModel.ts` `decideSupport`:
- WebAssembly and Web Audio are required.
- If the browser reports `navigator.deviceMemory` under 4 GB, the model is not tried.
- WebGPU is used when an adapter exists (fp32 weights); otherwise WASM with the 8-bit quantized weights (~80 MB,
  downloaded once and cached by the browser).
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
