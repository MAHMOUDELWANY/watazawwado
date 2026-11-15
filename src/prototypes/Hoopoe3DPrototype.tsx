import React, { useEffect } from 'react';
import { hideBootSplash } from '../lib/bootSplash';
import CompanionDemo from '../components/companion/CompanionDemo';

/** DEV-ONLY (route /prototype/hoopoe3d): the companion card on its own, the same one the child's progress page shows. */
export default function Hoopoe3DPrototype() {
  useEffect(() => { hideBootSplash(); }, []);
  return (
    <div className="min-h-[100svh] bg-background text-foreground" dir="rtl" lang="ar">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <a href="/prototype/zad3d" className="text-xs font-semibold text-[var(--copper)] underline-offset-4 hover:underline">زاد وأماكنه ←</a>
        <div className="mt-3"><CompanionDemo lang="ar" /></div>
      </main>
    </div>
  );
}
