# Lab 05 evidence - web service and database together

Run on 18.11.2026 with Node.js 22.14 on Windows.

## Startup (reproducible)

```
cd server
npm install
npm run dev
```

```
Exchangeator service on port 3000, database ./data/exchange.db
  reachable at http://192.168.1.11:3000
```

## Automated tests (`npm test`)

```
ok 1 - GET /health answers ok
ok 2 - read path: GET /wallet returns four simulated balances
ok 3 - write path: POST /wallet/fund stores the transaction and the new balance
ok 4 - same requestId twice: one operation, second answer is replayed (N6)
ok 5 - same requestId with a different amount is a conflict
ok 6 - invalid input is rejected at the service boundary with a clear error
ok 7 - broken JSON gives a validation error, unknown route gives 404
ok 8 - GET /transactions lists the operation and GET /transactions/{requestId} finds it
# tests 8
# pass 8
# fail 0
```

## Manual run: read, write, repeat, invalid input

Read path, `GET /wallet` (empty wallet of the test user):

```json
{"asOf":"2026-11-18T01:33:05Z","simulated":true,"balances":[{"currency":"PLN","amount":"0.00"},{"currency":"USD","amount":"0.00"},{"currency":"EUR","amount":"0.00"},{"currency":"GBP","amount":"0.00"}]}
```

Write path, `POST /wallet/fund` with `{"requestId":"2b8f0c1e-4d7a-4f43-9a51-0c6e3f2d9b17","amount":"250.00"}`:

```json
{"replayed":false,"transaction":{"requestId":"2b8f0c1e-4d7a-4f43-9a51-0c6e3f2d9b17","type":"FUND","currency":"PLN","amount":"250.00","rate":null,"pln":"250.00","createdAt":"2026-11-18T01:33:06Z"},"wallet":{"asOf":"2026-11-18T01:33:06Z","simulated":true,"balances":[{"currency":"PLN","amount":"250.00"},{"currency":"USD","amount":"0.00"},{"currency":"EUR","amount":"0.00"},{"currency":"GBP","amount":"0.00"}]}}
```

The same request sent again: `HTTP 200` (replayed, nothing added).

Invalid amount `"-3"`:

```json
{"error":{"code":"VALIDATION_ERROR","message":"amount must be a number with up to 2 decimals, for example \"100.00\""}}
```

## Stored state in SQLite after the run

```
wallets:      [('PLN', 25000), ('USD', 0), ('EUR', 0), ('GBP', 0)]
transactions: [('2b8f0c1e-4d7a-4f43-9a51-0c6e3f2d9b17', 'FUND', 25000)]
```

One transaction row and a balance of 250.00 PLN (25000 grosz), although the
request was sent twice.

## Service log

```
GET /wallet 200 5ms
POST /wallet/fund 201 1ms
POST /wallet/fund 200 1ms
POST /wallet/fund 400 1ms
```

Design changes since M1: [design-changes.md](../design-changes.md).
