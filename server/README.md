# Web service

Node.js 22 + Express 4 with a SQLite database file (`better-sqlite3`).

## Start

```
cd server
npm install
npm run dev
```

On first start the service creates `data/exchange.db` from `src/db/schema.sql`
and adds the test user from `src/db/seed.sql`. The console prints the address a
phone on the same Wi-Fi can use, for example:

```
Exchangeator service on port 3000, database ./data/exchange.db
  reachable at http://192.168.1.11:3000
```

To start again from an empty database, stop the service and delete the `data` folder.

## Configuration

Optional. Copy `.env.example` to `.env` (not committed) and change the values:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port, listening on all network interfaces |
| `DATABASE_FILE` | `./data/exchange.db` | SQLite file |
| `DEV_USER_ID` | `1` | Lab 05 only: every request acts as this test user (login comes in Lab 07) |

## Tests

```
npm test
```

The tests use an in-memory database: health check, read path, write path,
repeated `requestId` (one operation only), conflicting `requestId`, invalid
input, broken JSON, transaction lookup.

## Endpoints implemented so far

| Method and path | Lab | Notes |
|---|---|---|
| `GET /health` | 05 | Is the service reachable |
| `GET /wallet` | 05 | Read path: four simulated balances |
| `POST /wallet/fund` | 05 | Write path: add 1.00 to 10 000.00 PLN, needs a `requestId` (UUID) |
| `GET /transactions` | 05 | History, newest first |
| `GET /transactions/{requestId}` | 05 | Result of one operation, 404 if it never arrived |

Full contract: [docs/api.md](../docs/api.md).

## Try it by hand (Windows PowerShell or any terminal with curl)

```
curl http://localhost:3000/wallet

curl -X POST http://localhost:3000/wallet/fund -H "Content-Type: application/json" -d "{\"requestId\":\"2b8f0c1e-4d7a-4f43-9a51-0c6e3f2d9b17\",\"amount\":\"250.00\"}"
```

Send the same POST twice: the first answer is `201`, the second is `200` with
`"replayed": true`, and the balance changes only once.

## Folder structure

```
src/
  index.js              start the service
  app.js                Express app and routes
  money.js              "100.00" <-> minor units
  db/                   schema.sql, seed.sql, db.js
  middleware/           errors, request log, devUser (temporary until Lab 07)
  routes/               health, wallet, transactions, input validation
  services/             walletService (one database transaction per change)
test/                   node --test + supertest
```
