const { createIdentity } = require('./app');
const { createMongoStore } = require('./mongo-store');
const port = Number(process.env.IDENTITY_PORT || 4101);
const deliverReset = process.env.RESEND_API_KEY && process.env.MAIL_FROM ? async (email, resetUrl) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [email], subject: 'Reset your Property CRM password', text: `You requested a password reset. This link expires in 15 minutes and can only be used once:\n\n${resetUrl}\n\nIf you did not request this, ignore this message.` }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Email delivery rejected');
} : null;
async function start() {
  const store = await createMongoStore({ uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', databaseName: process.env.MONGODB_DB || 'cashflow_proptee' });
  let server;
  try {
    server = createIdentity({ store, appOrigin: process.env.APP_ORIGIN || `http://localhost:${process.env.PORT || 3001}`, allowedOrigins: process.env.NODE_ENV === 'production' ? [] : ['http://127.0.0.1:5173', 'http://localhost:5173', `http://localhost:${process.env.PORT || 3001}`, `http://127.0.0.1:${process.env.PORT || 3001}`], devReset: process.env.DEV_RESET_LINKS === 'true', deliverReset });
  } catch (error) { await store.close(); throw error; }
  server.on('error', async error => { console.error(`Identity service: ${error.code || 'startup failed'}`); await store.close(); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Identity service: http://127.0.0.1:${port} | MongoDB: ${store.databaseName}`));
}
start().catch(error => { console.error(`Identity startup failed (${error.code || error.name}). Check local MongoDB and server environment configuration.`); process.exitCode = 1; });
