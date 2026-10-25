// Explicit opt-in: reset links are shown locally, never sent as email.
if (process.env.NODE_ENV === 'production') throw new Error('Local test mode is forbidden in production.');
process.env.DEV_RESET_LINKS = 'true';
console.log('LOCAL TEST MODE: reset links appear in the browser. Use test accounts only.');
require('./start');
