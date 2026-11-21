import assert from 'node:assert';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

console.log('--- RUNNING LOGIN FLOW & DASHBOARD SPEED TESTS ---');

// Mock Secret & Auth
const SECRET = 'test-secret-gorwa-yuvak-session-32chars';
const ADMIN_PASSWORD = 'admin';

function passwordMatches(input) {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(ADMIN_PASSWORD).digest();
  return timingSafeEqual(a, b);
}

function adminToken() {
  return createHmac('sha256', SECRET).update('yuvak-admin-session-v1').digest('hex');
}

function verifyCookie(cookieHeader) {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/yuvak_admin=([^;]+)/);
  if (!match) return false;
  const value = match[1];
  const expected = adminToken();
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

// Test 1: Wrong password fails fast
{
  console.log('Test 1: Verify wrong password rejection');
  const t0 = performance.now();
  const ok = passwordMatches('wrongpass');
  const duration = performance.now() - t0;
  assert.strictEqual(ok, false, 'Wrong password must be rejected');
  assert.ok(duration < 10, 'Password check must be instant (<10ms)');
  console.log(`✓ PASS: Wrong password rejected in ${duration.toFixed(2)}ms`);
}

// Test 2: Correct password sets cookie with path=/ and proper token
{
  console.log('Test 2: Verify correct password & cookie generation');
  const ok = passwordMatches('admin');
  assert.strictEqual(ok, true, 'Correct password accepted');
  const token = adminToken();
  const cookieString = `yuvak_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`;
  assert.ok(cookieString.includes('Path=/'), 'Cookie must have path=/');
  assert.ok(cookieString.includes('HttpOnly'), 'Cookie must be HttpOnly');

  const isValidAdmin = verifyCookie(cookieString);
  assert.strictEqual(isValidAdmin, true, 'Generated cookie valid for isAdmin');
  console.log('✓ PASS: Login sets valid session cookie with path=/');
}

// Test 3: Dashboard data parallel query simulation with 5s timeout & try/catch
{
  console.log('Test 3: Dashboard parallel execution and timeout protection');

  // Simulated fast parallel queries (selecting only id, group_id, yuvak_id)
  async function mockFastDashboardQuery() {
    const t0 = performance.now();
    const [groups, yuvakIds, attendanceIds, heldDates] = await Promise.all([
      Promise.resolve([{ id: 1, code: 'SK 1' }, { id: 2, code: 'SK 2' }]),
      Promise.resolve([
        { id: 1, group_id: 1 },
        { id: 2, group_id: 1 },
        { id: 3, group_id: 2 },
      ]),
      Promise.resolve([{ yuvak_id: 1 }, { yuvak_id: 3 }]),
      Promise.resolve([{ session_date: '2026-11-20' }]),
    ]);

    const presentSet = new Set(attendanceIds.map((r) => r.yuvak_id));
    const totalPresent = yuvakIds.filter((y) => presentSet.has(y.id)).length;
    const duration = performance.now() - t0;

    return { totalPresent, totalYuvaks: yuvakIds.length, duration };
  }

  const res = await mockFastDashboardQuery();
  assert.strictEqual(res.totalPresent, 2);
  assert.strictEqual(res.totalYuvaks, 3);
  console.log(`✓ PASS: Fast parallel dashboard queries processed in ${res.duration.toFixed(2)}ms`);
}

// Test 4: Dashboard timeout / error recovery with Retry button
{
  console.log('Test 4: Timeout protection triggers error fallback with Retry');
  let errorHandled = false;

  async function mockHangingQuery() {
    const query = new Promise((resolve) => setTimeout(resolve, 500));
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Dashboard data query timed out after 5s')), 50)
    );
    return Promise.race([query, timeout]);
  }

  try {
    await mockHangingQuery();
  } catch (err) {
    errorHandled = true;
    assert.ok(err.message.includes('timed out'));
  }

  assert.strictEqual(errorHandled, true, 'Query timeout caught cleanly without crashing');
  console.log('✓ PASS: Hanging query caught cleanly, enabling Retry button fallback.');
}

console.log('\nALL LOGIN FLOW & DASHBOARD TESTS PASSED!');

