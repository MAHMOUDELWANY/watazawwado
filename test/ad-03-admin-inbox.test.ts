import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { BUILT_IN_REPLIES, filterThreads, loadCustomReplies, replyLang, saveCustomReplies } from '../src/components/chat/quickReplies.js';

const t = (id: string, o: Partial<{ kind: string; ownerName: string; teacherName: string; unread: boolean; lastMessageAt: string }>) => ({
  id, kind: 'support', ownerName: null as string | null, teacherName: null as string | null, unread: false, lastMessageAt: null as string | null, ...o
});

describe('AD-03 admin inbox', () => {
  const threads = [
    t('a', { ownerName: 'Aisha', lastMessageAt: '2026-10-21T10:00:00Z' }),
    t('b', { ownerName: 'Yusuf', kind: 'lesson', teacherName: 'Ustadha Mariam', unread: true, lastMessageAt: '2026-10-20T10:00:00Z' }),
    t('c', { ownerName: 'Omar', kind: 'lesson', teacherName: 'Ustadh Ali', lastMessageAt: '2026-10-21T12:00:00Z' })
  ];

  it('puts unread first, then the newest', () => {
    assert.deepStrictEqual(filterThreads(threads, { query: '', teacher: '', kind: 'all' }).map((x) => x.id), ['b', 'c', 'a']);
  });

  it('filters by teacher, type and name', () => {
    assert.deepStrictEqual(filterThreads(threads, { query: '', teacher: 'Ustadh Ali', kind: 'all' }).map((x) => x.id), ['c']);
    assert.deepStrictEqual(filterThreads(threads, { query: '', teacher: '', kind: 'support' }).map((x) => x.id), ['a']);
    assert.deepStrictEqual(filterThreads(threads, { query: 'mariam', teacher: '', kind: 'all' }).map((x) => x.id), ['b']);
    assert.strictEqual(threads[0].id, 'a', 'the original list is not reordered');
  });

  it('ships quick replies in both languages that speak for the academy', () => {
    const ar = BUILT_IN_REPLIES.filter((r) => r.lang === 'ar');
    const en = BUILT_IN_REPLIES.filter((r) => r.lang === 'en');
    assert.ok(ar.length >= 3 && ar.length === en.length);
    for (const r of ar) assert.strictEqual(replyLang(r.text), 'ar');
    for (const r of en) assert.strictEqual(replyLang(r.text), 'en');
    assert.ok(!BUILT_IN_REPLIES.some((r) => /mahmoud|محمود/i.test(r.text)), 'no single person named');
  });

  it('keeps the admin\'s own replies, ignoring broken storage', () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
    saveCustomReplies(store, [{ id: 'c1', text: 'سنتواصل معك', label: 'x', lang: 'ar', custom: true }]);
    assert.deepStrictEqual(loadCustomReplies(store).map((r) => r.text), ['سنتواصل معك']);
    m.set('wz.quickReplies.v1', '{not json');
    assert.deepStrictEqual(loadCustomReplies(store), []);
    assert.deepStrictEqual(loadCustomReplies(null), []);
  });

  it('the family timeline link is given to the admin only', () => {
    const src = fs.readFileSync('server/routes/community.ts', 'utf8');
    assert.ok(src.includes("...(actor.role === 'admin' ? { ownerStudentId: ownerStudentId.get(t.owner_user_id) || null } : {})"));
    const panel = fs.readFileSync('src/components/chat/ChatPanel.tsx', 'utf8');
    assert.ok(panel.includes('isAdmin && active.ownerStudentId'));
    assert.ok(panel.includes('const shown = isAdmin ? filterThreads(threads, filter) : threads;'), 'families and teachers keep their order');
  });
});
