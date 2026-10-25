const http = require('node:http');
const { randomBytes, createHash, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,128}$/;
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 })).toString('hex')}`;
}
async function matches(password, saved) {
  const [salt, key] = saved.split(':');
  return timingSafeEqual(await derive(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }), Buffer.from(key, 'hex'));
}
function createIdentity({ store, database = ':memory:', appOrigin = 'http://127.0.0.1:3001', allowedOrigins = [], devReset = false, deliverReset = null, clock = Date.now } = {}) {
  if (devReset && process.env.NODE_ENV === 'production') throw new Error('Development reset links are forbidden in production.');
  if (new URL(appOrigin).origin !== appOrigin) throw new Error('APP_ORIGIN must be an origin without a trailing slash or path.');
  if (process.env.NODE_ENV === 'production' && !appOrigin.startsWith('https://')) throw new Error('Production requires an HTTPS APP_ORIGIN.');
  store ||= require('./sqlite-store').createSqliteStore(database);
  const limits = new Map();
  const dummyHash = hashPassword(randomBytes(32).toString('hex'));
  async function userFor(req) {
    const token = /(?:^|;\s*)crm_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!token) return null;
    return store.sessionUser(digest(token), clock());
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, data, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
      res.end(JSON.stringify(data));
    };
    try {
      const pathname = new URL(req.url, appOrigin).pathname;
      if (req.method === 'GET' && pathname === '/api/auth/health') {
        try { await store.ping(); return send(200, { status: 'ok', storage: store.kind }); }
        catch { return send(503, { status: 'unavailable', message: 'Database connection unavailable.' }); }
      }
      if (req.method === 'GET' && pathname === '/api/auth/me') {
        const user = await userFor(req);
        return send(user ? 200 : 401, user ? { user } : { message: 'Please sign in.' });
      }
      if (req.method !== 'POST') return send(404, { message: 'Endpoint not found.' });
      if (req.headers.origin && ![appOrigin, ...allowedOrigins].includes(req.headers.origin)) return send(403, { message: 'Origin not allowed.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { message: 'Use application/json.' });
      // Bounded per-process limiter. Gateway forwards no client-supplied IP headers.
      const now = clock();
      for (const [key, value] of limits) if (value.until < now) limits.delete(key);
      const key = `${req.socket.remoteAddress}:${pathname}`;
      const count = limits.get(key) || { hits: 0, until: now + 60000 };
      limits.set(key, count);
      if (++count.hits > 20) return send(429, { message: 'Too many attempts. Try again in one minute.' });
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) return send(413, { message: 'Request too large.' });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); } catch { return send(400, { message: 'Invalid UTF-8 JSON.' }); }
      if (!body || Array.isArray(body) || typeof body !== 'object') return send(400, { message: 'Invalid request.' });
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (validEmail && ['login', 'forgot-password'].some(route => pathname === `/api/auth/${route}`)) {
        const accountKey = `${pathname}:${digest(email)}`;
        const attempts = limits.get(accountKey) || { hits: 0, until: now + 60000 };
        limits.set(accountKey, attempts);
        if (++attempts.hits > 5) return send(429, { message: 'Too many attempts for this account. Try again in one minute.' });
      }
      const password = typeof body.password === 'string' ? body.password : '';
      const passwordError = () => !strong.test(password) || password !== body.confirmPassword;
      if (pathname === '/api/auth/register') {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (name.length < 2 || name.length > 100 || typeof body.phone !== 'string' || !/^[6-9][0-9]{9}$/.test(body.phone) || !validEmail || passwordError()) return send(400, { message: 'Check name, Indian mobile number, email and matching strong passwords.' });
        const hashed = await hashPassword(password);
        try { await store.addUser({ name, phone: body.phone, email, password: hashed }); }
        catch (error) { if (error.code === 11000 || error.message.includes('UNIQUE')) return send(409, { message: 'This email is already registered. Sign in instead.' }); throw error; }
        return send(201, { message: 'Account created. You can now sign in.' });
      }
      if (pathname === '/api/auth/login') {
        if (!validEmail || !password || password.length > 128) return send(400, { message: 'Enter a valid email and password.' });
        const user = await store.findUserByEmail(email);
        const valid = await matches(password, user?.password || await dummyHash);
        if (!user || !valid || (await store.findUserById(user.id))?.password !== user.password) return send(401, { message: 'Email or password is incorrect.' });
        const token = randomBytes(32).toString('hex');
        await store.createSession(digest(token), user, now + 8 * 3600000);
        return send(200, { message: 'Signed in.' }, { 'Set-Cookie': `crm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${appOrigin.startsWith('https:') ? '; Secure' : ''}` });
      }
      if (pathname === '/api/auth/logout') {
        const token = /(?:^|;\s*)crm_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
        if (token) await store.removeSession(digest(token));
        return send(200, { message: 'Signed out.' }, { 'Set-Cookie': 'crm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      }
      if (pathname === '/api/auth/forgot-password') {
        if (!validEmail) return send(400, { message: 'Enter a valid email.' });
        if (!devReset && !deliverReset) return send(503, { message: 'Email delivery is not configured. Contact your administrator.' });
        const user = await store.findUserByEmail(email);
        let resetUrl;
        if (user) {
          const token = randomBytes(32).toString('hex');
          await store.setReset(user.id, digest(token), now + 15 * 60000);
          // URL fragment stays out of HTTP access logs and Referer headers.
          resetUrl = `${appOrigin}/reset-password#token=${token}`;
          if (deliverReset && !devReset) setImmediate(() => {
            Promise.resolve().then(() => deliverReset(email, resetUrl)).catch(() => {
              // No token, URL, email or provider response in application logs.
              console.error('Reset email delivery failed. Check mail provider configuration.');
            });
          });
        }
        return send(200, devReset ? { message: 'Local development mode: if the account exists, a reset link appears below. No email is sent.', resetUrl } : { message: 'If an account exists, a password reset link will be emailed. Check your inbox.' });
      }
      if (pathname === '/api/auth/reset-password') {
        if (passwordError() || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return send(400, { message: 'Check the reset link and matching strong passwords.' });
        const tokenHash = digest(body.token);
        const reset = await store.findReset(tokenHash, now);
        if (!reset) return send(400, { message: 'Reset link is invalid or expired. Request a new one.' });
        const hashed = await hashPassword(password);
        const claimed = await store.consumeReset(tokenHash, hashed, clock());
        if (!claimed) return send(400, { message: 'Reset link is invalid or expired.' });
        return send(200, { message: 'Password updated. Sign in with your new password.' });
      }
      return send(404, { message: 'Endpoint not found.' });
    } catch { return send(500, { message: 'Service error. Please try again.' }); }
  });
  server.on('close', () => { Promise.resolve().then(() => store.close()).catch(() => console.error('Database connection cleanup failed.')); });
  return server;
}
module.exports = { createIdentity };
