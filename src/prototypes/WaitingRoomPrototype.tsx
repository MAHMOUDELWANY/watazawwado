import React from 'react';
import { WaitingRoom } from '../classroom/WaitingRoom';

/** Dev-only: the waiting room without a booking. ?role=teacher, ?here=0 (the other side not in yet), ?kid=1. */
export default function WaitingRoomPrototype() {
  const q = new URLSearchParams(location.search);
  const teacher = q.get('role') === 'teacher';
  const here = q.get('here') === '0' ? null : teacher ? 'نور موجودة ومستنياك' : 'معلمك موجود';
  return (
    <div className="fixed inset-0 z-[60] khatam-field brand-lights overflow-y-auto bg-background text-foreground">
      <WaitingRoom role={teacher ? 'teacher' : 'learner'} ticket="prototype" bookingId="prototype" kid={q.get('kid') === '1'}
        onReady={() => alert('join')} info={{ title: 'الإيمان بالملائكة', when: 'النهارده 17:00 · هتبدأ بعد 2 دقيقة', here }} />
    </div>
  );
}
