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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** CRM-03 suggested tags (any short text is allowed too). */
export const SUGGESTED_TAGS = ['sibling likely', 'prefers female teacher', 'time zone tricky', 'pay-later trusted'];

/** Trimmed, lower-cased, de-duplicated tags of 1-60 characters; at most 20. */
export function normalizeTags(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const out = [...new Set(input.map((t) => (typeof t === 'string' ? t.trim().toLowerCase().replace(/\s+/g, ' ') : '')).filter(Boolean))];
  if (out.length > 20 || out.some((t) => t.length > 60)) return null;
  return out;
}

export type CrmTaskSource = 'manual' | 'trial_followup' | 'quiet_learner' | 'low_balance';

/**
 * CRM-04: creates a follow-up task; with a dedupeKey, at most one ever exists for it (automatic tasks).
 * Never throws: a failed task must not fail the action that triggered it.
 */
export async function createCrmTask(
  client: any,
  t: { accountStudentId: string; title: string; dueAt: Date; source?: CrmTaskSource; createdBy?: string | null; dedupeKey?: string | null }
): Promise<boolean> {
  if (!client || !t.accountStudentId) return false;
  try {
    const row = {
      account_student_id: t.accountStudentId,
      title: t.title.slice(0, 300),
      due_at: t.dueAt.toISOString(),
      source: t.source || 'manual',
      created_by: t.createdBy || null,
      dedupe_key: t.dedupeKey || null
    };
    const { error } = t.dedupeKey
      ? await client.from('crm_tasks').upsert(row, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      : await client.from('crm_tasks').insert(row);
    if (error) console.warn('[CRM task] create failed:', error.message);
    return !error;
  } catch (err) {
    console.warn('[CRM task] create failed:', err);
    return false;
  }
}

export function registerCrmRoutes(app: express.Express, deps: CrmDeps) {
  const { getClient, verifyTeacherAuth, requireSuperAdmin } = deps;
  const guard = [verifyTeacherAuth, requireSuperAdmin];

  // ---- CRM-04 follow-up tasks
  app.get('/api/dashboard/admin/crm/tasks', ...guard, async (_req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const weekEnd = new Date(Date.now() + 8 * 24 * 3_600_000).toISOString();
    const { data: tasks, error } = await client
      .from('crm_tasks')
      .select('id, account_student_id, title, due_at, source')
      .is('done_at', null)
      .lte('due_at', weekEnd)
      .order('due_at', { ascending: true })
      .limit(200);
    if (error) return res.status(500).json({ error: 'Failed to load follow-ups.' });
    const ids = [...new Set((tasks || []).map((t: any) => t.account_student_id))];
    const [{ data: students }, { data: guardians }] = ids.length
      ? await Promise.all([
          client.from('students').select('id, name, whatsapp').in('id', ids),
          client.from('guardians').select('student_id, parent_name, parent_whatsapp').in('student_id', ids)
        ])
      : [{ data: [] }, { data: [] }];
    const byId = new Map<string, any>((students || []).map((s: any) => [s.id, s]));
    const guardianOf = new Map<string, any>((guardians || []).map((g: any) => [g.student_id, g]));
    return res.json({
      tasks: (tasks || []).map((t: any) => {
        const s = byId.get(t.account_student_id);
        const g = guardianOf.get(t.account_student_id);
        return { ...t, studentName: s?.name || null, contactName: g?.parent_name || s?.name || null, whatsapp: s?.whatsapp || g?.parent_whatsapp || null };
      })
    });
  });

  app.get('/api/dashboard/admin/students/:id/crm/tasks', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(400).json({ error: 'Invalid student id.' });
    const { data, error } = await client
      .from('crm_tasks')
      .select('id, title, due_at, done_at, source')
      .eq('account_student_id', req.params.id)
      .order('done_at', { ascending: true, nullsFirst: true })
      .order('due_at', { ascending: true })
      .limit(100);
    if (error) return res.status(500).json({ error: 'Failed to load follow-ups.' });
    return res.json({ tasks: data || [] });
  });

  app.post('/api/dashboard/admin/students/:id/crm/tasks', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(400).json({ error: 'Invalid student id.' });
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const due = new Date(String(req.body?.dueAt || ''));
    if (!title || title.length > 300) return res.status(400).json({ error: 'Write a title of 1 to 300 characters.' });
    if (Number.isNaN(due.getTime())) return res.status(400).json({ error: 'Choose a due date.' });
    const { data, error } = await client
      .from('crm_tasks')
      .insert({ account_student_id: req.params.id, title, due_at: due.toISOString(), source: 'manual', created_by: req.teacherUser?.id || null })
      .select('id, title, due_at, done_at, source')
      .single();
    if (error) return res.status(error.code === '23503' ? 404 : 500).json({ error: error.code === '23503' ? 'Student not found.' : 'Failed to save the follow-up.' });
    return res.status(201).json({ task: data });
  });

  app.patch('/api/dashboard/admin/crm/tasks/:taskId', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.taskId))) return res.status(400).json({ error: 'Invalid task id.' });
    if (typeof req.body?.done !== 'boolean') return res.status(400).json({ error: 'Send done: true or false.' });
    const { data, error } = await client
      .from('crm_tasks')
      .update({ done_at: req.body.done ? new Date().toISOString() : null })
      .eq('id', req.params.taskId)
      .select('id, done_at')
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'Failed to update the follow-up.' });
    if (!data) return res.status(404).json({ error: 'Follow-up not found.' });
    return res.json({ task: data });
  });

  // ---- CRM-03 notes and tags (super admin only; never shown to families or teachers)
  app.get('/api/dashboard/admin/students/:id/crm', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(400).json({ error: 'Invalid student id.' });
    const [notes, tags] = await Promise.all([
      client.from('crm_notes').select('id, child_student_id, body, created_at').eq('account_student_id', req.params.id).order('created_at', { ascending: false }).limit(200),
      client.from('crm_tags').select('tag').eq('account_student_id', req.params.id).order('created_at', { ascending: true })
    ]);
    if (notes.error || tags.error) return res.status(500).json({ error: 'Failed to load notes.' });
    return res.json({ notes: notes.data || [], tags: (tags.data || []).map((t: any) => t.tag), suggestedTags: SUGGESTED_TAGS });
  });

  app.post('/api/dashboard/admin/students/:id/crm/notes', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(400).json({ error: 'Invalid student id.' });
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body || body.length > 4000) return res.status(400).json({ error: 'Write a note of 1 to 4000 characters.' });
    const childId = req.body?.childId;
    if (childId != null && !UUID_RE.test(String(childId))) return res.status(400).json({ error: 'Invalid child id.' });
    const { data, error } = await client
      .from('crm_notes')
      .insert({ account_student_id: req.params.id, child_student_id: childId || null, body, author_id: req.teacherUser?.id || null })
      .select('id, child_student_id, body, created_at')
      .single();
    if (error) return res.status(error.code === '23503' ? 404 : 500).json({ error: error.code === '23503' ? 'Student not found.' : 'Failed to save the note.' });
    return res.status(201).json({ note: data });
  });

  app.delete('/api/dashboard/admin/students/:id/crm/notes/:noteId', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id)) || !UUID_RE.test(String(req.params.noteId))) return res.status(400).json({ error: 'Invalid id.' });
    const { error } = await client.from('crm_notes').delete().eq('id', req.params.noteId).eq('account_student_id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to delete the note.' });
    return res.json({ success: true });
  });

  // Replaces the family's tag set with the one sent.
  app.put('/api/dashboard/admin/students/:id/crm/tags', ...guard, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(400).json({ error: 'Invalid student id.' });
    const tags = normalizeTags(req.body?.tags);
    if (!tags) return res.status(400).json({ error: 'Send up to 20 tags of at most 60 characters.' });
    const id = req.params.id;
    const del = tags.length
      ? await client.from('crm_tags').delete().eq('account_student_id', id).not('tag', 'in', `(${tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(',')})`)
      : await client.from('crm_tags').delete().eq('account_student_id', id);
    if (del.error) return res.status(500).json({ error: 'Failed to save tags.' });
    if (tags.length) {
      const { error } = await client
        .from('crm_tags')
        .upsert(tags.map((tag) => ({ account_student_id: id, tag, created_by: req.teacherUser?.id || null })), { onConflict: 'account_student_id,tag', ignoreDuplicates: true });
      if (error) return res.status(error.code === '23503' ? 404 : 500).json({ error: error.code === '23503' ? 'Student not found.' : 'Failed to save tags.' });
    }
    return res.json({ tags });
  });

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
