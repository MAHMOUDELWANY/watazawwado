const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

const callbackReplacement = `app.get('/api/integrations/google-calendar/callback', async (req: any, res: any) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code) {
      return res.status(400).send('Missing authorization code.');
    }

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const expectedState = match ? match[1] : null;

    if (!expectedState || state !== expectedState) {
      return res.status(403).send('Invalid or expired OAuth state parameter (CSRF).');
    }

    const crypto = require('crypto');
    const parts = state.split('.');
    if (parts.length !== 2) {
      return res.status(403).send('Malformed OAuth state parameter.');
    }
    const [b64Payload, signature] = parts;

    const payload = Buffer.from(b64Payload, 'base64').toString('utf8');
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).send('Invalid OAuth state signature.');
    }

    const [teacherId, nonce] = payload.split(':');
    if (!teacherId) {
      return res.status(403).send('OAuth state missing teacher identity.');
    }

    const tokenData = await exchangeGoogleCodeForTokens(code);
    
    // Store securely in DB using service role
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      
      // Invalidate old connections FOR THIS TEACHER ONLY
      await supabase
        .from('calendar_connections')
        .update({ is_active: false })
        .eq('provider', 'google_calendar')
        .eq('teacher_id', teacherId);

      // Insert new connection
      await supabase.from('calendar_connections').insert({
        teacher_id: teacherId,
        provider: 'google_calendar',
        account_email: tokenData.accountEmail || 'unknown@calendar.google.com',
        is_active: true,
        metadata: {
          access_token: encryptToken(tokenData.accessToken),
          refresh_token: tokenData.refreshToken ? encryptToken(tokenData.refreshToken) : undefined,
          expires_at: tokenData.expiresAt
        }
      });
    }`;

// use simple string replacement since regex can be finicky
const targetStart = `app.get('/api/integrations/google-calendar/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code) {
      return res.status(400).send('Missing authorization code.');
    }

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const expectedState = match ? match[1] : null;

    if (!expectedState || state !== expectedState) {
      return res.status(403).send('Invalid or expired OAuth state parameter (CSRF).');
    }

    const tokenData = await exchangeGoogleCodeForTokens(code);
    
    // Store securely in DB using service role
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      
      // Invalidate old connections
      await supabase
        .from('calendar_connections')
        .update({ is_active: false })
        .eq('provider', 'google_calendar');

      // Insert new connection
      await supabase.from('calendar_connections').insert({
        provider: 'google_calendar',
        account_email: tokenData.accountEmail || 'unknown@calendar.google.com',
        is_active: true,
        metadata: {
          access_token: encryptToken(tokenData.accessToken),
          refresh_token: tokenData.refreshToken ? encryptToken(tokenData.refreshToken) : undefined,
          expires_at: tokenData.expiresAt
        }
      });
    }`;

content = content.replace(targetStart, callbackReplacement);

fs.writeFileSync('api/index.ts', content);
