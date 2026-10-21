import type express from 'express';

/**
 * CRM-05: CSV exports for the super admin (students, leads, payments). Generated on the server, UTF-8 with a BOM so
 * Arabic opens correctly in Excel. Never includes notes columns (teacher or admin notes), tokens or secrets.
 */

type Middleware = (req: any, res: any, next: any) => any;
export interface ExportDeps { getClient: () => any; verifyTeacherAuth: Middleware; requireSuperAdmin: Middleware }

export const CSV_BOM = '﻿';
const MAX_ROWS = 5000;

/**
 * One CSV cell. Quotes when needed, and neutralises spreadsheet formulas: a value starting with = + - @ (or a tab or
 * carriage return) gets a leading apostrophe, so a name like "=HYPERLINK(...)" stays text in Excel.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  let s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: Array<{ key: string; label: string }>, rows: Array<Record<string, unknown>>): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c.key])).join(','));
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}

function send(res: any, name: string, csv: string) {
  const day = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="watazawwado-${name}-${day}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(csv);
}

export const STUDENT_COLUMNS = [
  { key: 'id', label: 'id' }, { key: 'name', label: 'name' }, { key: 'email', label: 'email' }, { key: 'whatsapp', label: 'whatsapp' },
  { key: 'learner_type', label: 'learner_type' }, { key: 'age', label: 'age' }, { key: 'gender', label: 'gender' },
  { key: 'parent_name', label: 'parent_name' }, { key: 'parent_email', label: 'parent_email' }, { key: 'parent_whatsapp', label: 'parent_whatsapp' },
  { key: 'country', label: 'country' }, { key: 'timezone', label: 'timezone' }, { key: 'learning_interest', label: 'subject' },
  { key: 'current_level', label: 'level' }, { key: 'status', label: 'status' }, { key: 'onboarding_completed', label: 'onboarding_completed' },
  { key: 'teacher', label: 'teacher' }, { key: 'heard_about', label: 'heard_about' }, { key: 'utm_source', label: 'utm_source' },
  { key: 'created_at', label: 'created_at' }
];
export const LEAD_COLUMNS = [
  { key: 'id', label: 'id' }, { key: 'name', label: 'name' }, { key: 'email', label: 'email' }, { key: 'whatsapp', label: 'whatsapp' },
  { key: 'learner_type', label: 'learner_type' }, { key: 'service_interest_id', label: 'subject' }, { key: 'goal', label: 'goal' },
  { key: 'source', label: 'source' }, { key: 'status', label: 'status' }, { key: 'created_at', label: 'created_at' }
];
export const PAYMENT_COLUMNS = [
  { key: 'id', label: 'id' }, { key: 'created_at', label: 'created_at' }, { key: 'confirmed_at', label: 'confirmed_at' }, { key: 'status', label: 'status' },
  { key: 'amount', label: 'amount' }, { key: 'currency', label: 'currency' }, { key: 'payment_method', label: 'method' },
  { key: 'payment_reference', label: 'reference' }, { key: 'booking_reference', label: 'booking_reference' },
  { key: 'student_name', label: 'student_name' }, { key: 'student_email', label: 'student_email' }
];

export function registerExportRoutes(app: express.Express, deps: ExportDeps) {
  const guard = [deps.verifyTeacherAuth, deps.requireSuperAdmin];

  app.get('/api/dashboard/admin/export/students.csv', ...guard, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { data: students, error } = await client
      .from('students')
      .select('id, name, email, whatsapp, learner_type, age, gender, country, timezone, learning_interest, current_level, status, onboarding_completed, assigned_teacher_id, heard_about, lead_source, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (error) return res.status(500).json({ error: 'Export failed.' });
    const ids = (students || []).map((s: any) => s.id);
    const teacherIds = [...new Set((students || []).map((s: any) => s.assigned_teacher_id).filter(Boolean))];
    const [{ data: guardians }, { data: profiles }] = await Promise.all([
      ids.length ? client.from('guardians').select('student_id, parent_name, parent_email, parent_whatsapp').in('student_id', ids) : Promise.resolve({ data: [] }),
      teacherIds.length ? client.from('profiles').select('id, display_name').in('id', teacherIds) : Promise.resolve({ data: [] })
    ]);
    const g = new Map((guardians || []).map((x: any) => [x.student_id, x]));
    const t = new Map((profiles || []).map((x: any) => [x.id, x.display_name]));
    const rows = (students || []).map((s: any) => {
      const p: any = g.get(s.id) || {};
      return { ...s, parent_name: p.parent_name, parent_email: p.parent_email, parent_whatsapp: p.parent_whatsapp, teacher: t.get(s.assigned_teacher_id) || '', utm_source: s.lead_source?.utm_source || '' };
    });
    return send(res, 'students', toCsv(STUDENT_COLUMNS, rows));
  });

  app.get('/api/dashboard/admin/export/leads.csv', ...guard, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { data, error } = await client
      .from('leads')
      .select('id, name, email, whatsapp, learner_type, service_interest_id, goal, source, status, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (error) return res.status(500).json({ error: 'Export failed.' });
    return send(res, 'leads', toCsv(LEAD_COLUMNS, data || []));
  });

  app.get('/api/dashboard/admin/export/payments.csv', ...guard, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { data: payments, error } = await client
      .from('payments')
      .select('id, booking_id, student_id, amount, currency, payment_method, status, payment_reference, confirmed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (error) return res.status(500).json({ error: 'Export failed.' });
    const bookingIds = [...new Set((payments || []).map((p: any) => p.booking_id).filter(Boolean))];
    const studentIds = [...new Set((payments || []).map((p: any) => p.student_id).filter(Boolean))];
    const [{ data: bookings }, { data: students }] = await Promise.all([
      bookingIds.length ? client.from('bookings').select('id, reference_code').in('id', bookingIds) : Promise.resolve({ data: [] }),
      studentIds.length ? client.from('students').select('id, name, email').in('id', studentIds) : Promise.resolve({ data: [] })
    ]);
    const b = new Map((bookings || []).map((x: any) => [x.id, x.reference_code]));
    const s = new Map((students || []).map((x: any) => [x.id, x]));
    const rows = (payments || []).map((p: any) => ({ ...p, booking_reference: b.get(p.booking_id) || '', student_name: (s.get(p.student_id) as any)?.name || '', student_email: (s.get(p.student_id) as any)?.email || '' }));
    return send(res, 'payments', toCsv(PAYMENT_COLUMNS, rows));
  });
}
