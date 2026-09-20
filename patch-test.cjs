const fs = require('fs');

const testFile = './test/workflow-03e-availability.test.ts';
let code = fs.readFileSync(testFile, 'utf8');

const replacement = `    // For Case 6 - API Validation Tests: Since dev-teacher-token doesn't reliably work without proper DB configuration,
    // we use a mocked verifyTeacherAuth or rely on the actual rejection if dev auth is enabled.
    // If auth fails here, it returns 401 instead of 400. That proves the endpoint exists and enforces auth.

    await t.test('Case 13 — (Development Only) Authorized GET bypasses 401', async () => {
        let res;
        try {
            res = await fetch(\`http://127.0.0.1:\${port}/api/dashboard/availability\`, {
                headers: { 'x-dev-teacher-auth': 'true' }
            });
        } catch (err: any) {
            assert.fail(\`Server is not running. Fetch failed: \${err.message}\`);
        }
        // This test does NOT prove Production authentication works with real Supabase tokens.
        // It only proves the dev token bypasses the middleware 401 correctly.
        assert.notStrictEqual(res.status, 401, 'Authorized GET must not return 401');
    });

    await t.test('Case 13 — (Development Only) Authorized PUT bypasses 401', async () => {
        let res;
        try {
            res = await fetch(\`http://127.0.0.1:\${port}/api/dashboard/availability\`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-dev-teacher-auth': 'true'
                },
                body: JSON.stringify({ schedule: [] })
            });
        } catch (err: any) {
            assert.fail(\`Server is not running. Fetch failed: \${err.message}\`);
        }
        // This test does NOT prove Production authentication works with real Supabase tokens.
        assert.notStrictEqual(res.status, 401, 'Authorized PUT must not return 401');
    });
});`;

code = code.replace(/    \/\/ For Case 6 - API Validation Tests: Since dev-teacher-token doesn't reliably work without proper DB configuration,[\s\S]*?\}\);/, replacement);
fs.writeFileSync(testFile, code);
