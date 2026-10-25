const { MongoClient } = require('mongodb');
const { randomUUID } = require('node:crypto');

async function createMongoStore({ uri = 'mongodb://127.0.0.1:27017', databaseName = 'cashflow_proptee' } = {}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) throw new Error('Use letters, numbers, underscores or hyphens in MONGODB_DB.');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, maxPoolSize: 10 });
  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    const users = db.collection('users');
    const sessions = db.collection('sessions');
    await users.createIndex({ email: 1 }, { unique: true, name: 'unique_email' });
    await users.createIndex({ 'reset.tokenHash': 1 }, { unique: true, sparse: true, name: 'unique_reset_hash' });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_sessions' });
    await sessions.createIndex({ userId: 1 }, { name: 'session_user' });
    const asUser = doc => doc && ({ ...doc, id: doc._id, password: doc.passwordHash });
    return {
      kind: 'mongodb',
      databaseName,
      async ping() { await db.command({ ping: 1 }); return true; },
      async addUser({ name, phone, email, password }) {
        await users.insertOne({ _id: randomUUID(), name, phone, email, passwordHash: password, authVersion: 0, createdAt: new Date() });
      },
      async findUserByEmail(email) { return asUser(await users.findOne({ email })); },
      async findUserById(id) { return asUser(await users.findOne({ _id: id })); },
      async createSession(tokenHash, user, expires) {
        await sessions.insertOne({ _id: tokenHash, userId: user.id, authVersion: user.authVersion, expiresAt: new Date(expires), createdAt: new Date() });
      },
      async sessionUser(tokenHash, now) {
        const session = await sessions.findOne({ _id: tokenHash, expiresAt: { $gt: new Date(now) } });
        if (!session) return null;
        // Version check invalidates all older sessions atomically with password change.
        const user = await users.findOne({ _id: session.userId, authVersion: session.authVersion }, { projection: { name: 1, email: 1, phone: 1 } });
        return user ? { id: user._id, name: user.name, email: user.email, phone: user.phone } : null;
      },
      async removeSession(tokenHash) { await sessions.deleteOne({ _id: tokenHash }); },
      async setReset(userId, tokenHash, expires) {
        await users.updateOne({ _id: userId }, { $set: { reset: { tokenHash, expiresAt: new Date(expires) } } });
      },
      async findReset(tokenHash, now) {
        return users.findOne({ 'reset.tokenHash': tokenHash, 'reset.expiresAt': { $gt: new Date(now) } }, { projection: { _id: 1 } });
      },
      async consumeReset(tokenHash, passwordHash, now) {
        // One atomic document update works on standalone MongoDB; no replica set/transaction required.
        const result = await users.updateOne(
          { 'reset.tokenHash': tokenHash, 'reset.expiresAt': { $gt: new Date(now) } },
          { $set: { passwordHash, passwordChangedAt: new Date(now) }, $inc: { authVersion: 1 }, $unset: { reset: '' } },
        );
        return result.modifiedCount === 1;
      },
      async close() { await client.close(); },
    };
  } catch (error) { await client.close(); throw error; }
}
module.exports = { createMongoStore };
