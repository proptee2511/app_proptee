const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const children = [];
let stopping = false;
function stop() { if (stopping) return; stopping = true; for (const child of children) child.kill(); }
for (const file of ['services/identity/start.js', 'gateway.js']) {
  const child = spawn(process.execPath, [path.join(root, file)], { cwd: root, stdio: 'inherit', env: { ...process.env, APP_ORIGIN: process.env.APP_ORIGIN || `http://localhost:${process.env.PORT || 3001}` } });
  children.push(child);
  child.on('exit', code => { if (!stopping) { process.exitCode = code || 1; stop(); } });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
