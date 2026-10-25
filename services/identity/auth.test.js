const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createIdentity } = require('./app');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

test('registration, session protection, reset rotation, concurrent single use and logout', async t => {
  const origin = 'http://127.0.0.1:3001';
  const server = createIdentity({ appOrigin: origin, devReset: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/auth/`;
  const user = { name: 'Test User', email: 'test@example.com', phone: '9876543210', password: 'Strong!Pass123', confirmPassword: 'Strong!Pass123' };
  async function call(route, body, cookie, from = origin) {
    const response = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json', Origin: from } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], rawCookie: response.headers.get('set-cookie') };
  }
  assert.equal((await call('me')).status, 401);
  assert.equal((await call('register', { ...user, password: 'weak', confirmPassword: 'weak' })).status, 400);
  assert.equal((await call('register', { ...user, confirmPassword: 'Other!Pass123' })).status, 400);
  assert.equal((await call('register', user, undefined, 'https://attacker.example')).status, 403);
  assert.equal((await call('register', user)).status, 201);
  assert.equal((await call('register', { ...user, email: 'TEST@example.com' })).status, 409);
  assert.equal((await call('login', { email: user.email, password: 'Wrong!Pass123' })).status, 401);
  const session = await call('login', user);
  assert.equal(session.status, 200);
  assert.match(session.rawCookie, /HttpOnly; SameSite=Strict/);
  const me = await call('me', undefined, session.cookie);
  assert.equal(me.data.user.name, user.name);
  assert.equal(me.data.user.password, undefined);
  const first = await call('forgot-password', { email: user.email });
  const token = new URLSearchParams(new URL(first.data.resetUrl).hash.slice(1)).get('token');
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal((await call('reset-password', { token: '0'.repeat(64), password: 'New!Password123', confirmPassword: 'New!Password123' })).status, 400);
  const next = await call('forgot-password', { email: user.email });
  const token2 = new URLSearchParams(new URL(next.data.resetUrl).hash.slice(1)).get('token');
  assert.equal((await call('reset-password', { token, password: 'New!Password123', confirmPassword: 'New!Password123' })).status, 400);
  const body = { token: token2, password: 'New!Password123', confirmPassword: 'New!Password123' };
  const concurrent = await Promise.all([call('reset-password', body), call('reset-password', body)]);
  assert.deepEqual(concurrent.map(x => x.status).sort(), [200, 400]);
  assert.equal((await call('me', undefined, session.cookie)).status, 401);
  assert.equal((await call('login', user)).status, 401);
  const newSession = await call('login', { email: user.email, password: body.password });
  assert.equal(newSession.status, 200);
  assert.equal((await call('logout', {}, newSession.cookie)).status, 200);
  assert.equal((await call('me', undefined, newSession.cookie)).status, 401);
});

test('mail mode never exposes reset token or reveals whether an account exists', async t => {
  const delivered = [];
  const server = createIdentity({ deliverReset: async (email, url) => delivered.push({ email, url }) });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const post = async (route, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  await post('register', { name: 'Mail Test', phone: '9876543210', email: 'mail@example.com', password: 'Strong!Pass123', confirmPassword: 'Strong!Pass123' });
  const existing = await post('forgot-password', { email: 'mail@example.com' });
  const missing = await post('forgot-password', { email: 'missing@example.com' });
  assert.deepEqual(existing, missing);
  assert.equal(existing.data.resetUrl, undefined);
  assert.equal(delivered.length, 1);
  assert.ok(delivered[0].url.includes('#token='));
});

test('persisted secrets are hashed, expired tokens and sessions fail, recovery is disabled without mail', async t => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'crm-auth-test-'));
  const database = path.join(directory, 'test.sqlite');
  let now = Date.now();
  const server = createIdentity({ database, devReset: true, clock: () => now });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const inspect = new DatabaseSync(database);
  t.after(async () => { inspect.close(); await new Promise(resolve => server.close(resolve)); rmSync(directory, { recursive: true }); });
  const call = async (route, body, cookie) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/${route}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  const user = { name: 'Expiry Test', email: 'expiry@example.com', phone: '9876543210', password: 'Strong!Pass123', confirmPassword: 'Strong!Pass123' };
  assert.equal((await call('register', user)).status, 201);
  assert.notEqual(inspect.prepare('SELECT password FROM users').get().password, user.password);
  const session = await call('login', user);
  assert.notEqual(inspect.prepare('SELECT token FROM sessions').get().token, session.cookie.split('=')[1]);
  const link = await call('forgot-password', { email: user.email });
  const token = new URLSearchParams(new URL(link.data.resetUrl).hash.slice(1)).get('token');
  assert.notEqual(inspect.prepare('SELECT token FROM resets').get().token, token);
  now += 16 * 60000;
  assert.equal((await call('reset-password', { token, password: 'New!Password123', confirmPassword: 'New!Password123' })).status, 400);
  now += 8 * 3600000;
  assert.equal((await call('me', undefined, session.cookie)).status, 401);
  for (let n = 0; n < 5; n++) assert.equal((await call('login', { email: user.email, password: 'wrong' })).status, 401);
  assert.equal((await call('login', user)).status, 429);
});

test('unconfigured recovery refuses to claim an email was sent', async t => {
  const server = createIdentity(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.com' }) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).resetUrl, undefined);
});
