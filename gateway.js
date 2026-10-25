const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.join(__dirname, 'frontend', 'dist');
const port = Number(process.env.PORT || 3001);
const docsEnabled = process.env.NODE_ENV !== 'production';
const swaggerRoot = require('swagger-ui-dist').getAbsoluteFSPath();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  const fail = (status, message) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message })); };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/openapi.json' || url.pathname === '/swagger/index.html' || url.pathname === '/api-docs' || url.pathname.startsWith('/api-docs/')) {
      if (!docsEnabled) return fail(404, 'Endpoint not found.');
      if (!['GET', 'HEAD'].includes(req.method)) return fail(405, 'Method not allowed.');
      const assets = {
        '/swagger/index.html': ['api/docs.html', 'text/html'],
        '/api-docs': ['api/docs.html', 'text/html'], '/api-docs/': ['api/docs.html', 'text/html'],
        '/api-docs/init.js': ['api/init.js', 'text/javascript'], '/api-docs/theme.css': ['api/theme.css', 'text/css'],
        '/api-docs/swagger-ui.css': [path.join(swaggerRoot, 'swagger-ui.css'), 'text/css'],
        '/api-docs/swagger-ui-bundle.js': [path.join(swaggerRoot, 'swagger-ui-bundle.js'), 'text/javascript'],
      };
      const spec = url.pathname === '/api/openapi.json';
      const asset = assets[url.pathname];
      if (!spec && !asset) return fail(404, 'File not found.');
      const content = spec ? JSON.stringify(require('./api/openapi')) : await fs.readFile(path.resolve(__dirname, asset[0]));
      res.writeHead(200, { 'Content-Type': `${spec ? 'application/json' : asset[1]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'" });
      return res.end(req.method === 'HEAD' ? undefined : content);
    }
    if (url.pathname === '/health' && req.method !== 'GET') return fail(405, 'Use GET for health checks.');
    if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
      const upstream = http.request({ hostname: '127.0.0.1', port: Number(process.env.IDENTITY_PORT || 4101), path: url.pathname === '/health' ? '/api/auth/health' : url.pathname + url.search, method: req.method, headers: { 'content-type': req.headers['content-type'] || '', cookie: req.headers.cookie || '', ...(req.headers.origin ? { origin: req.headers.origin } : {}) } }, response => {
        res.writeHead(response.statusCode, { ...response.headers, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
        response.pipe(res);
      });
      upstream.setTimeout(20000, () => upstream.destroy());
      upstream.on('error', () => { if (!res.headersSent) fail(502, 'Identity service unavailable. Restart CRM.'); else res.destroy(); });
      req.pipe(upstream);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) return fail(405, 'Method not allowed.');
    let target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(root + path.sep) && target !== root) return fail(403, 'Forbidden.');
    let content;
    try { content = await fs.readFile(target); }
    catch {
      if (path.extname(url.pathname)) return fail(404, 'File not found.');
      target = path.join(root, 'index.html'); content = await fs.readFile(target);
    }
    res.writeHead(200, { 'Content-Type': `${types[path.extname(target)] || 'application/octet-stream'}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'" });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { fail(500, 'Build frontend first: npm run build'); }
});
server.on('error', error => { console.error(`Gateway: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Frontend: http://localhost:${port}/\nSwagger: http://localhost:${port}/swagger/index.html\nMongoDB health: http://localhost:${port}/health`));
