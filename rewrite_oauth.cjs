const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const authUrlRegex = /app\.get\('\/api\/integrations\/google-calendar\/auth-url', verifyTeacherAuth, \(req, res\) => \{[\s\S]*?\}\);/;
const authUrlReplacement = `app.get('/api/integrations/google-calendar/auth-url', verifyTeacherAuth, (req: any, res: any) => {
  try {
    const crypto = require('crypto');
    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = \`\${teacherId}:\${nonce}\`;
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const state = \`\${Buffer.from(payload).toString('base64')}.\${signature}\`;

    res.setHeader('Set-Cookie', \`oauth_state=\${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax\${process.env.NODE_ENV === 'production' ? '; Secure' : ''}\`);
    const authUrl = generateGoogleAuthUrl(state);
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate auth url.', code: 'AUTH_URL_GENERATION_FAILED' });
  }
});`;

content = content.replace(authUrlRegex, authUrlReplacement);

const callbackRegex = /app\.get\('\/api\/integrations\/google-calendar\/callback', async \(req, res\) => \{[\s\S]*?res\.send\('<script>window\.close\(\);<\/script>Google Calendar connected successfully\. You can close this window\.'\);\n  \} catch \(error: any\) \{\n    res\.status\(500\)\.send\('OAuth callback failed\.'\);\n  \}\n\}\);/;
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
      
      // Invalidate old connections for this teacher only
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
    }

    res.send('<script>window.close();</script>Google Calendar connected successfully. You can close this window.');
  } catch (error: any) {
    res.status(500).send('OAuth callback failed.');
  }
});`;

content = content.replace(callbackRegex, callbackReplacement);

// Update disconnect route
const disconnectRegex = /app\.post\('\/api\/integrations\/google-calendar\/disconnect', verifyTeacherAuth, async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, message: 'Google Calendar disconnected\.' \}\);\n  \} catch \(error: any\) \{\n    res\.status\(500\)\.json\(\{ error: 'Failed to disconnect Google Calendar\.', code: 'DISCONNECT_FAILED' \}\);\n  \}\n\}\);/;
const disconnectReplacement = `app.post('/api/integrations/google-calendar/disconnect', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      
      await supabase
        .from('calendar_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('provider', 'google_calendar')
        .eq('teacher_id', teacherId);
    }

    res.json({ success: true, message: 'Google Calendar disconnected.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to disconnect Google Calendar.', code: 'DISCONNECT_FAILED' });
  }
});`;

content = content.replace(disconnectRegex, disconnectReplacement);

fs.writeFileSync('api/index.ts', content);
