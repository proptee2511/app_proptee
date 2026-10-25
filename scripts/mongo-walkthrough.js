// Local read-only teaching view. Displays a status file, never database credentials/documents.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const folder = path.join(__dirname, '..', 'project_management');
http.createServer(async (req, res) => {
  try {
    const isStatus = req.url === '/status';
    if (!['/', '/status'].includes(req.url)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': isStatus ? 'application/json' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(await fs.readFile(path.join(folder, isStatus ? 'mongo-status.json' : 'mongo-walkthrough.html')));
  } catch { res.writeHead(503); res.end('Setup status is being prepared.'); }
}).listen(3102, '127.0.0.1', () => console.log('Setup walkthrough: http://127.0.0.1:3102'));
