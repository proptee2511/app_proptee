const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const port = Number(process.env.PORT || 3000);
const files = {
  '/': ['index.html', 'text/html'],
  '/login': ['index.html', 'text/html'],
  '/styles.css': ['styles.css', 'text/css'],
  '/app.js': ['app.js', 'text/javascript'],
};
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/auth/login') {
      if (req.method !== 'POST') return json(res, 405, { message: 'Use POST for login.' });
      if (!process.env.AUTH_API_URL) return json(res, 503, { message: 'Login API is not configured yet. Set AUTH_API_URL on the server.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) return json(res, 413, { message: 'Request too large.' });
      }
      let credentials;
      try { credentials = JSON.parse(body); } catch { return json(res, 400, { message: 'Invalid request.' }); }
      if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string' || !credentials.email.trim() || !credentials.password) {
        return json(res, 400, { message: 'Email and password are required.' });
      }
      try {
        const upstream = await fetch(process.env.AUTH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
          signal: AbortSignal.timeout(15000),
          redirect: 'error',
        });
        // Authentication/session handling is completed when the real API contract is supplied.
        if (!upstream.ok) return json(res, upstream.status >= 500 ? 502 : 401, { message: upstream.status >= 500 ? 'Login service is unavailable.' : 'Login failed. Check your email and password.' });
        return json(res, 200, { message: 'Credentials verified. Dashboard and session integration are pending.' });
      } catch { return json(res, 502, { message: 'Cannot reach the login API. Please try again.' }); }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { message: 'Method not allowed.' });
    if (!files[pathname]) return json(res, 404, { message: 'Page not found.' });
    const [file, type] = files[pathname];
    const content = await fs.readFile(path.join(__dirname, 'public', file));
    res.writeHead(200, {
      'Content-Type': `${type}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { json(res, 500, { message: 'Something went wrong.' }); }
}).listen(port, '127.0.0.1', () => console.log(`Property CRM: http://localhost:${port}/login`));
