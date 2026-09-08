const fs = require('fs');
let content = fs.readFileSync('server/integrations/syncEngine.ts', 'utf8');

const helper = `export async function getPrimaryTeacherId(): Promise<string | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const { data: accounts } = await supabase.from('teacher_accounts').select('email').eq('is_active', true).order('created_at', { ascending: true }).limit(1);
  if (!accounts || accounts.length === 0) return null;
  const teacherEmail = accounts[0].email;
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', teacherEmail).maybeSingle();
  return profile?.id || null;
}

export async function getActiveGoogleConnection(teacherId?: string): Promise<{ accessToken: string; accountEmail: string } | null> {`;

const target = `export async function getActiveGoogleConnection(): Promise<{ accessToken: string; accountEmail: string } | null> {`;

content = content.replace(target, helper);

const queryRegex = /\.eq\('provider', 'google_calendar'\)\s*\.eq\('is_active', true\)/;
const queryReplacement = `.eq('provider', 'google_calendar')
      .eq('teacher_id', teacherId || await getPrimaryTeacherId())
      .eq('is_active', true)`;

content = content.replace(queryRegex, queryReplacement);

fs.writeFileSync('server/integrations/syncEngine.ts', content);
