const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const SEED = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

/**
 * Opens (and if needed creates) the SQLite database.
 * Pass ':memory:' for tests.
 */
function openDb(file) {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count === 0) {
    db.exec(SEED);
  }
  return db;
}

module.exports = { openDb };
