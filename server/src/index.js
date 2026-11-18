const os = require('node:os');
const { openDb } = require('./db/db');
const { createApp } = require('./app');

// Read server/.env if it exists (Node 22 built-in, no extra package needed).
try {
  process.loadEnvFile();
} catch {
  // no .env file: defaults below are used
}

const PORT = Number(process.env.PORT || 3000);
const DATABASE_FILE = process.env.DATABASE_FILE || './data/exchange.db';

const db = openDb(DATABASE_FILE);
const app = createApp({ db });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Exchangeator service on port ${PORT}, database ${DATABASE_FILE}`);
  // The phone needs one of these addresses in mobile/.env (EXPO_PUBLIC_API_URL).
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  reachable at http://${a.address}:${PORT}`);
    }
  }
});
