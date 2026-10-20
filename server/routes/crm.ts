import type express from 'express';

/**
 * Super admin CRM (docs/backlog/BACKLOG.md CRM lane).
 * CRM-01: one chronological timeline per account and its children, built only from existing tables (read-only).
 * Teacher-private notes never appear: only the fact that a note was added and the family summary.
 */

type Middleware = (req: any, res: any, next: any) => any;
export interface CrmDeps {
  getClient: () => any | null;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
}

export type TimelineType = 'account' | 'intake' | 'placement' | 'trial' | 'lesson' | 'payment' | 'package' | 'chat' | 'note' | 'message';
export const TIMELINE_TYPES: TimelineType[] = ['account', 'intake', 'placement', 'trial', 'lesson', 'payment', 'package', 'chat', 'note', 'message'];

export interface TimelineEvent {
  at: string;
  type: TimelineType;
  title: { en: string; ar: string };
  detail?: string | null;
  learnerName?: string | null;
  ref?: string | null;
}

export interface TimelineInput {
  students: any[];
  leads?: any[];
  intakes?: any[];
  placements?: any[];
  bookings?: any[];
  payments?: any[];
  packages?: any[];
  chats?: any[];
  notes?: any[];
  followUps?: any[];
}

const OUTCOME: Record<string, { en: string; ar: string }> = {
  completed: { en: 'attended', ar: 'حضر' },
  no_show: { en: 'missed', ar: 'غاب' },
  cancelled: { en: 'cancelled', ar: 'اتلغت' }
};

/** Newest first. Pure: every event comes from a row passed in. */
export function buildTimeline(input: TimelineInput): TimelineEvent[] {
  const names = new Map<string, string>(input.students.map((s) => [s.id, s.name]));
  const learner = (id: string | null | undefined) => (id ? names.get(id) || null : null);
  const ev: TimelineEvent[] = [];
  const push = (e: TimelineEvent) => { if (e.at) ev.push(e); };

  for (const s of input.students) {
    push({ at: s.created_at, type: 'account', title: { en: 'Account created', ar: 'اتعمل الحساب' }, learnerName: s.name });
  }
  for (const l of input.leads || []) {
    push({ at: l.created_at, type: 'account', title: { en: 'First contact (lead)', ar: 'أول تواصل (مهتم)' }, detail: [l.source, l.status].filter(Boolean).join(' · ') || null });
  }
  for (const i of input.intakes || []) {
    push({ at: i.created_at, type: 'intake', title: { en: 'AI guide request', ar: 'طلب من المرشد الذكي' }, detail: i.status || null, learnerName: learner(i.learner_student_id) });
  }
  for (const p of input.placements || []) {
    const level = p.admin_level || p.suggested_level;
    push({ at: p.created_at, type: 'placement', title: { en: 'Placement test started', ar: 'بدأ اختبار تحديد المستوى' }, detail: p.service_id, learnerName: learner(p.learner_student_id) });
    if (p.submitted_at) push({ at: p.submitted_at, type: 'placement', title: { en: 'Placement test finished', ar: 'خلص اختبار تحديد المستوى' }, detail: level || null, learnerName: learner(p.learner_student_id) });
    if (p.reviewed_at) push({ at: p.reviewed_at, type: 'placement', title: { en: 'Placement reviewed', ar: 'اتراجع اختبار المستوى' }, detail: p.admin_level || null, learnerName: learner(p.learner_student_id) });
  }
  for (const b of input.bookings || []) {
    const isTrial = b.booking_type === 'trial';
    const type: TimelineType = isTrial ? 'trial' : 'lesson';
    const name = learner(b.student_id);
    push({
      at: b.created_at, type, ref: b.reference_code || null, learnerName: name, detail: b.service_id || null,
      title: isTrial ? { en: 'Free trial booked', ar: 'اتحجزت الحصة التجريبية' } : { en: 'Lesson booked', ar: 'اتحجزت حصة' }
    });
    const o = OUTCOME[b.status];
    if (o) {
      push({
        at: b.status === 'cancelled' ? b.updated_at || b.scheduled_start : b.scheduled_start, type, ref: b.reference_code || null, learnerName: name,
        title: isTrial ? { en: `Free trial ${o.en}`, ar: `الحصة التجريبية: ${o.ar}` } : { en: `Lesson ${o.en}`, ar: `الحصة: ${o.ar}` }
      });
    }
  }
  for (const p of input.payments || []) {
    const amount = `${Number(p.amount || 0).toFixed(2)} ${p.currency || 'USD'}`;
    push({ at: p.created_at, type: 'payment', title: { en: 'Payment started', ar: 'بدأ الدفع' }, detail: amount, learnerName: learner(p.student_id) });
    if (p.confirmed_at) push({ at: p.confirmed_at, type: 'payment', title: { en: 'Payment confirmed', ar: 'الدفع اتأكد' }, detail: amount, learnerName: learner(p.student_id) });
    if (p.status === 'refunded') push({ at: p.updated_at, type: 'payment', title: { en: 'Refunded', ar: 'اترجعت الفلوس' }, detail: amount, learnerName: learner(p.student_id) });
  }
  for (const k of input.packages || []) {
    const isCredit = k.metadata?.source === 'cancellation_credit';
    push({
      at: k.created_at, type: 'package', learnerName: learner(k.learner_student_id), detail: k.status || null,
      title: isCredit ? { en: 'Lesson credit from a cancelled lesson', ar: 'رصيد حصة من حصة ملغاة' } : { en: `${k.purchased_quantity}-lesson package`, ar: `باقة ${k.purchased_quantity} حصص` }
    });
    if (k.metadata?.refund_requested_at) push({ at: k.metadata.refund_requested_at, type: 'package', title: { en: 'Refund requested', ar: 'اتطلب استرداد' }, learnerName: learner(k.learner_student_id) });
  }
  for (const c of input.chats || []) {
    push({ at: c.created_at, type: 'chat', title: c.kind === 'teacher' ? { en: 'Chat with the teacher started', ar: 'بدأت محادثة مع المعلم' } : { en: 'Chat with the academy started', ar: 'بدأت محادثة مع الأكاديمية' } });
  }
  for (const n of input.notes || []) {
    push({ at: n.created_at, type: 'note', title: { en: 'Teacher note added', ar: 'المعلم كتب ملاحظة' }, detail: n.family_summary ? String(n.family_summary).slice(0, 200) : null, learnerName: learner(n.student_id) });
  }
  for (const f of input.followUps || []) {
    if (f.status !== 'sent') continue;
    push({ at: f.updated_at, type: 'message', title: { en: 'Trial follow-up sent', ar: 'اتبعتت رسالة المتابعة بعد التجربة' } });
  }
  return ev.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function registerCrmRoutes(app: express.Express, deps: CrmDeps) {
  const { getClient, verifyTeacherAuth, requireSuperAdmin } = deps;

  app.get('/api/dashboard/admin/students/:id/timeline', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const id = String(req.params.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Invalid student id.' });
    try {
      const { data: student } = await client.from('students').select('id, name, email, auth_user_id, lead_id, created_at').eq('id', id).maybeSingle();
      if (!student) return res.status(404).json({ error: 'Student not found.' });

      // The account's children: guardian rows that name this account's email.
      let children: any[] = [];
      if (student.email) {
        const safe = String(student.email).replace(/[\\%_]/g, (c: string) => '\\' + c);
        const { data: g } = await client.from('guardians').select('student_id').ilike('parent_email', safe);
        const childIds = [...new Set((g || []).map((r: any) => r.student_id).filter((x: string) => x && x !== id))];
        if (childIds.length) {
          const { data } = await client.from('students').select('id, name, created_at').in('id', childIds);
          children = data || [];
        }
      }
      const students = [student, ...children];
      const ids = students.map((s) => s.id);
      const authId = student.auth_user_id || null;
      const none = Promise.resolve({ data: [] });

      const [leads, intakes, placements, bookings, payments, packages, chats, notes, followUps] = await Promise.all([
        student.lead_id ? client.from('leads').select('id, status, source, created_at').eq('id', student.lead_id) : none,
        client.from('student_intakes').select('id, status, learner_student_id, created_at').or(
          [authId ? `auth_user_id.eq.${authId}` : null, `learner_student_id.in.(${ids.join(',')})`].filter(Boolean).join(',')
        ),
        client.from('placement_tests').select('id, learner_student_id, service_id, status, suggested_level, admin_level, created_at, submitted_at, reviewed_at').in('learner_student_id', ids),
        client.from('bookings').select('id, student_id, booking_type, status, service_id, reference_code, scheduled_start, created_at, updated_at').in('student_id', ids),
        client.from('payments').select('id, student_id, amount, currency, status, created_at, confirmed_at, updated_at').in('student_id', ids),
        client.from('package_entitlements').select('id, learner_student_id, purchased_quantity, status, metadata, created_at').in('learner_student_id', ids),
        authId ? client.from('chat_threads').select('id, kind, created_at').eq('owner_user_id', authId) : none,
        client.from('lesson_notes').select('id, student_id, family_summary, created_at').in('student_id', ids),
        client.from('notification_events').select('idempotency_key, status, updated_at').in('idempotency_key', ids.map((x) => `trial_followup:${x}`))
      ]);

      // A failed source leaves a gap, not a broken page; log it so the gap is visible.
      for (const [name, r] of Object.entries({ leads, intakes, placements, bookings, payments, packages, chats, notes, followUps }) as [string, any][]) {
        if (r?.error) console.warn(`[CRM timeline] ${name} query failed:`, r.error.message);
      }

      const events = buildTimeline({
        students,
        leads: leads.data || [],
        intakes: intakes.data || [],
        placements: placements.data || [],
        bookings: bookings.data || [],
        payments: payments.data || [],
        packages: packages.data || [],
        chats: chats.data || [],
        notes: notes.data || [],
        followUps: followUps.data || []
      });
      return res.json({ events, learners: students.map((s) => ({ id: s.id, name: s.name })) });
    } catch (err) {
      console.error('[CRM timeline]', err);
      return res.status(500).json({ error: 'Failed to load the timeline.' });
    }
  });
}
