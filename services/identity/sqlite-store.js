// Legacy adapter retained for isolated regression tests. Application startup uses MongoDB.
const { DatabaseSync } = require('node:sqlite');
function createSqliteStore(database = ':memory:') {
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), expires INTEGER NOT NULL);`);
  return {
    kind: 'sqlite',
    ping() { db.prepare('SELECT 1').get(); return true; },
    addUser({ name, phone, email, password }) { db.prepare('INSERT INTO users(name,phone,email,password) VALUES(?,?,?,?)').run(name,phone,email,password); },
    findUserByEmail(email) { return db.prepare('SELECT * FROM users WHERE email=?').get(email); },
    findUserById(id) { return db.prepare('SELECT * FROM users WHERE id=?').get(id); },
    createSession(tokenHash, user, expires) {
      db.prepare('DELETE FROM sessions WHERE expires<?').run(expires - 8 * 3600000);
      db.prepare('INSERT INTO sessions SELECT ?,id,? FROM users WHERE id=? AND password=?').run(tokenHash, expires, user.id, user.password);
    },
    sessionUser(tokenHash, now) { return db.prepare('SELECT u.id,u.name,u.email,u.phone FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?').get(tokenHash, now); },
    removeSession(tokenHash) { db.prepare('DELETE FROM sessions WHERE token=?').run(tokenHash); },
    setReset(userId, tokenHash, expires) { db.prepare('INSERT OR REPLACE INTO resets VALUES(?,?,?)').run(tokenHash,userId,expires); },
    findReset(tokenHash, now) { return db.prepare('SELECT * FROM resets WHERE token=? AND expires>?').get(tokenHash,now); },
    consumeReset(tokenHash, passwordHash, now) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const reset = db.prepare('SELECT * FROM resets WHERE token=? AND expires>?').get(tokenHash,now);
        if (!reset) { db.exec('ROLLBACK'); return false; }
        db.prepare('DELETE FROM resets WHERE token=?').run(tokenHash);
        db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash,reset.user_id);
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
        db.exec('COMMIT'); return true;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); },
  };
}
module.exports = { createSqliteStore };
