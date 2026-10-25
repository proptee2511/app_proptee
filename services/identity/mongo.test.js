const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID, createHash } = require('node:crypto');
const { MongoClient } = require('mongodb');
const { createMongoStore } = require('./mongo-store');
const { createIdentity } = require('./app');

test('MongoDB persistence, validation, atomic recovery, session versioning, expiry and indexes', async t => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const databaseName = `crm_test_${randomUUID().replaceAll('-', '')}`;
  const inspect = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await inspect.connect();
  const db = inspect.db(databaseName);
  let server;
  let store;
  t.after(async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    if (store) await store.close();
    // Only the unique disposable database created by this test can be dropped.
    assert.match(databaseName, /^crm_test_[a-f0-9]{32}$/);
    await db.dropDatabase();
    await inspect.close();
  });
  store = await createMongoStore({ uri, databaseName });
  let now = Date.now();
  server = createIdentity({ store, devReset: true, clock: () => now });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/auth/`;
  const digest = value => createHash('sha256').update(value).digest('hex');
  async function call(route, body, cookie, origin = 'http://127.0.0.1:3001') {
    const response = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const user = { name: 'Mongo Test', phone: '9876543210', email: 'mongo@example.com', password: 'Strong!Pass123', confirmPassword: 'Strong!Pass123' };
  assert.equal((await call('health')).data.storage, 'mongodb');
  assert.equal((await call('me')).status, 401);
  assert.equal((await call('register', { ...user, password: 'weak', confirmPassword: 'weak' })).status, 400);
  assert.equal((await call('register', { ...user, phone: { $ne: null } })).status, 400);
  assert.equal((await call('register', user, undefined, 'https://attacker.invalid')).status, 403);
  assert.equal((await call('register', user)).status, 201);
  assert.equal((await call('register', { ...user, email: 'MONGO@example.com' })).status, 409);
  assert.equal((await call('login', { email: { $ne: null }, password: 'x' })).status, 400);
  const record = await db.collection('users').findOne({ email: user.email });
  assert.equal(record.password, undefined);
  assert.notEqual(record.passwordHash, user.password);
  assert.equal(record.authVersion, 0);
  const session = await call('login', user);
  assert.equal(session.status, 200);
  const me = await call('me', undefined, session.cookie);
  assert.deepEqual(Object.keys(me.data.user).sort(), ['email', 'id', 'name', 'phone']);
  assert.equal((await db.collection('sessions').findOne())._id, digest(session.cookie.split('=')[1]));
  const tokenFrom = result => new URLSearchParams(new URL(result.data.resetUrl).hash.slice(1)).get('token');
  const first = tokenFrom(await call('forgot-password', { email: user.email }));
  const second = tokenFrom(await call('forgot-password', { email: user.email }));
  const resetting = await db.collection('users').findOne({ email: user.email });
  assert.equal(resetting.reset.tokenHash, digest(second));
  assert.equal(resetting.reset.expiresAt.getTime(), now + 15 * 60000);
  const changed = { password: 'Changed!Pass456', confirmPassword: 'Changed!Pass456' };
  assert.equal((await call('reset-password', { ...changed, token: first })).status, 400);
  const concurrent = await Promise.all([call('reset-password', { ...changed, token: second }), call('reset-password', { ...changed, token: second })]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 400]);
  assert.equal((await call('me', undefined, session.cookie)).status, 401);
  const updated = await db.collection('users').findOne({ email: user.email });
  assert.equal(updated.authVersion, 1);
  assert.equal(updated.reset, undefined);
  // A stale login finishing after reset cannot resurrect a session.
  const staleHash = 'a'.repeat(64);
  await store.createSession(staleHash, { id: record._id, authVersion: record.authVersion }, now + 3600000);
  assert.equal(await store.sessionUser(staleHash, now), null);
  assert.equal((await call('login', user)).status, 401);
  const newSession = await call('login', { email: user.email, password: changed.password });
  assert.equal(newSession.status, 200);
  assert.equal((await call('logout', {}, newSession.cookie)).status, 200);
  assert.equal((await call('me', undefined, newSession.cookie)).status, 401);
  const expiryToken = tokenFrom(await call('forgot-password', { email: user.email }));
  now += 16 * 60000;
  assert.equal((await call('reset-password', { ...changed, token: expiryToken })).status, 400);
  const ttl = (await db.collection('sessions').indexes()).find(i => i.name === 'expire_sessions');
  assert.equal(ttl.expireAfterSeconds, 0);
  assert.equal((await db.collection('users').indexes()).some(i => i.expireAfterSeconds !== undefined), false);
  // Reopening the connection retains the account; no in-memory-only persistence.
  const reopened = await createMongoStore({ uri, databaseName });
  assert.equal((await reopened.findUserByEmail(user.email)).name, user.name);
  await reopened.close();
});
