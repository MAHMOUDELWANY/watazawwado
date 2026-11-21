import sys, json, numpy as np
from faster_whisper import WhisperModel
audio = np.fromfile(sys.argv[1], dtype=np.float32)
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, word_timestamps=True, language="en")
out = [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in segs for w in s.words]
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
print(len(out)); print(" ".join(f"{w[0]}@{w[1]}" for w in out))
