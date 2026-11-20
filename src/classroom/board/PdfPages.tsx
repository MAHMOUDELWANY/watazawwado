/// <reference types="vite/client" />
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { BrandSpinner } from '../../components/ui/BrandLoader';

// pdf.js and its worker load only when a PDF is opened in the room.
const loadPdf = async (url: string) => {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs.getDocument({ url });
};

/**
 * Classroom Task 8: one PDF page at a time. `page` is controlled by the room: the teacher's `onPage` sends a `pdf`
 * event, and the learner's `page` follows it (no `onPage`, no buttons). `children` (the Board, transparent) sits over
 * the page as the annotation layer.
 */
export function PdfPages({ fileUrl, page, onPage, children }: {
  fileUrl: string;
  /** 1-based page number. */
  page: number;
  onPage?: (page: number) => void;
  children?: React.ReactNode;
}) {
  const { t, isAr } = useT();
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    let task: Awaited<ReturnType<typeof loadPdf>> | null = null;
    setDoc(null);
    setFailed(false);
    loadPdf(fileUrl)
      .then((t) => { task = t; if (!live) { void t.destroy(); return null; } return t.promise; })
      .then((d) => { if (d && live) setDoc(d); }, () => { if (live) setFailed(true); });
    return () => { live = false; void task?.destroy(); };
  }, [fileUrl]);

  const count = doc?.numPages ?? 0;
  const shown = Math.min(Math.max(1, page), Math.max(1, count));

  useEffect(() => {
    if (!doc || !canvas.current || !box.current) return;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    let live = true;
    doc.getPage(shown).then((p) => {
      if (!live || !canvas.current || !box.current) return;
      const fit = box.current.clientWidth / p.getViewport({ scale: 1 }).width;
      const viewport = p.getViewport({ scale: fit * (window.devicePixelRatio || 1) });
      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      task = p.render({ canvas: canvas.current, viewport });
      task.promise.catch(() => {}); // a newer page cancels this render
    }, () => live && setFailed(true));
    return () => { live = false; task?.cancel(); };
  }, [doc, shown]);

  if (failed) return <p className="p-4 text-sm text-muted-foreground">{t('This file could not be opened.', 'الملف ده ما فتحش.')}</p>;

  // In Arabic the "next" arrow points left.
  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  return (
    <div className="flex h-full w-full flex-col">
      {/* The board on top is as tall as the page and never takes the wheel, so the page scrolls and marks (kept in page
          units) stay on the words they were drawn on. */}
      <div ref={box} className="relative min-h-0 flex-1 overflow-auto bg-surface-subtle">
        {!doc && <div className="grid h-full place-items-center"><BrandSpinner /></div>}
        <div className="relative">
          <canvas ref={canvas} className="block w-full h-auto" aria-label={t(`Page ${shown} of ${count}`, `صفحة ${shown} من ${count}`)} />
          {children && <div className="absolute inset-0">{children}</div>}
        </div>
      </div>
      {count > 0 && (
        <div className="flex items-center justify-center gap-3 border-t border-border bg-surface py-1 text-sm text-muted-foreground">
          {onPage && <Button variant="ghost" size="icon" aria-label={t('Previous page', 'الصفحة اللي فاتت')} disabled={shown <= 1} onClick={() => onPage(shown - 1)}><Prev className="h-5 w-5" /></Button>}
          <span>{t(`${shown} / ${count}`, `${shown} / ${count}`)}</span>
          {onPage && <Button variant="ghost" size="icon" aria-label={t('Next page', 'الصفحة اللي بعدها')} disabled={shown >= count} onClick={() => onPage(shown + 1)}><Next className="h-5 w-5" /></Button>}
        </div>
      )}
    </div>
  );
}
