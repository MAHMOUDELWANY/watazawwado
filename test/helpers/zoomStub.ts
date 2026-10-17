// Hermetic Zoom for suites that test sync/worker logic, not Zoom itself.
// Forces fake credentials (so real ones in the shell are never used) and answers
// Zoom's token, list and create calls locally; every other request passes through.
process.env.ZOOM_ACCOUNT_ID = 'test-zoom-account';
process.env.ZOOM_CLIENT_ID = 'test-zoom-client';
process.env.ZOOM_CLIENT_SECRET = 'test-zoom-secret';

const passthrough = globalThis.fetch;
let nextMeetingId = 90000000000;

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  if (url.startsWith('https://zoom.us/oauth/token')) {
    return json({ access_token: 'test-zoom-token', expires_in: 3600 });
  }
  if (url.startsWith('https://api.zoom.us/v2/users/me/meetings')) {
    if ((init?.method || 'GET').toUpperCase() === 'POST') {
      const id = nextMeetingId++;
      return json({ id, join_url: `https://zoom.us/j/${id}`, start_url: `https://zoom.us/s/${id}`, password: 'test' });
    }
    return json({ meetings: [] });
  }
  if (url.includes('zoom.us')) {
    throw new Error(`zoomStub: unexpected Zoom request ${url}`);
  }
  return passthrough(input, init);
}) as typeof fetch;
