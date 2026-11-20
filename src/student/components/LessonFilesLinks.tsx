import React, { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';

export type LessonFile = { fileId: string; kind: 'pdf' | 'image'; url: string };

/** Classroom 3.3: the files the teacher sent with each lesson's report, by booking id (the server checks the learner). */
export function useLessonFiles(learnerId: string | null | undefined): Record<string, LessonFile[]> {
  const [files, setFiles] = useState<Record<string, LessonFile[]>>({});
  useEffect(() => {
    let cancelled = false;
    const q = learnerId ? `?learnerId=${encodeURIComponent(learnerId)}` : '';
    authedJson<{ files: Record<string, LessonFile[]> }>(`/api/student/lesson-files${q}`)
      .then((d) => { if (!cancelled) setFiles(d?.files || {}); })
      .catch(() => { if (!cancelled) setFiles({}); });
    return () => { cancelled = true; };
  }, [learnerId]);
  return files;
}

export function LessonFilesLinks({ files, isAr }: { files?: LessonFile[]; isAr: boolean }) {
  if (!files?.length) return null;
  return (
    <>
      {files.map((f, i) => (
        <a
          key={f.fileId}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 glass-card hover:bg-surface-subtle text-teal border border-border rounded-xl text-sm font-medium transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <FileDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{f.kind === 'pdf' ? (isAr ? `ملف الحصة ${i + 1} (PDF)` : `Lesson file ${i + 1} (PDF)`) : (isAr ? `صورة من الحصة ${i + 1}` : `Lesson picture ${i + 1}`)}</span>
        </a>
      ))}
    </>
  );
}
