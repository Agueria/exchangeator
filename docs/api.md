# API Outline (Lab 04)

Web service: Node.js + Express. All requests and responses are JSON.
Base URL in development: `http://<laptop-ip>:3000`.

## Conventions

| Topic | Rule |
|---|---|
| Authentication | `Authorization: Bearer <token>` on every endpoint marked "token". The token comes from `POST /auth/login` and is valid for 24 h. |
| Money | Strings with 2 decimals: `"100.00"`. Stored as INTEGER minor units in the database. |
| Rates | Strings with 4 decimals: `"3.9597"`. Stored as INTEGER x 10 000. |
| Time | ISO 8601 in UTC: `"2026-11-04T14:32:00Z"`. |
| Currencies | `PLN` (wallet base), `USD`, `EUR`, `GBP`. |
| Data-changing requests | `POST /wallet/fund`, `/transactions/buy`, `/transactions/sell` require a `requestId` (UUID created by the app). |
| Errors | Always `{ "error": { "code": "...", "message": "..." } }` with an HTTP status. |

## Endpoints

| Method and path | Token | Purpose | Requirement |
|---|---|---|---|
| `GET /health` | - | Is the service reachable? | N3, N9 |
| `POST /auth/register` | - | Create an account | F1 |
| `POST /auth/login` | - | Get a session token | F2 |
| `POST /auth/logout` | yes | Delete the session token | F3 |
| `GET /rates` | yes | Current USD, EUR, GBP bid/ask | F5, N11 |
| `GET /rates/{code}/history?days=30` | yes | Rate history of one currency | F6 |
| `GET /wallet` | yes | Balances | F9 |
| `POST /wallet/fund` | yes | Add simulated PLN | F4 |
| `POST /transactions/buy` | yes | Buy a currency with PLN | F7 |
| `POST /transactions/sell` | yes | Sell a currency for PLN | F8 |
| `GET /transactions?limit=50` | yes | Transaction history, newest first | F10 |
| `GET /transactions/{requestId}` | yes | Result of one data-changing request | F11, N5 |

### GET /health

```
200 OK
{ "status": "ok", "time": "2026-11-04T14:32:00Z" }
```

### POST /auth/register

```
Request:  { "email": "anna@example.com", "password": "secret123" }
201 Created
{ "userId": 7 }
```
Errors: `400 VALIDATION_ERROR` (email format, password shorter than 8), `409 EMAIL_TAKEN`.
Registration also creates four wallet rows (PLN, USD, EUR, GBP) with balance 0.

### POST /auth/login

```
Request:  { "email": "anna@example.com", "password": "secret123" }
200 OK
{ "token": "b1e4...9c", "expiresAt": "2026-11-05T14:32:00Z" }
```
Errors: `401 INVALID_CREDENTIALS`.

### POST /auth/logout

```
204 No Content
```
Errors: `401 UNAUTHORIZED`.

### GET /rates

```
200 OK
{
  "table": "198/C/NBP/2026",
  "effectiveDate": "2026-10-12",
  "fetchedAt": "2026-11-04T14:30:12Z",
  "stale": false,
  "rates": [
    { "code": "USD", "bid": "3.8813", "ask": "3.9597" },
    { "code": "EUR", "bid": "4.2121", "ask": "4.2971" },
    { "code": "GBP", "bid": "4.8410", "ask": "4.9388" }
  ]
}
```
`stale: true` means NBP could not be reached and the cached table is returned.
Errors: `401 UNAUTHORIZED`, `503 RATE_UNAVAILABLE` (no cached table at all).

### GET /rates/{code}/history?days=30

```
200 OK
{ "code": "USD", "points": [ { "date": "2026-10-12", "bid": "3.8813", "ask": "3.9597" } ] }
```
Errors: `400 VALIDATION_ERROR` (unknown code, days not 1-90), `503 RATE_UNAVAILABLE`.

### GET /wallet

```
200 OK
{
  "asOf": "2026-11-04T14:32:00Z",
  "simulated": true,
  "balances": [
    { "currency": "PLN", "amount": "604.03" },
    { "currency": "USD", "amount": "100.00" },
    { "currency": "EUR", "amount": "0.00" },
    { "currency": "GBP", "amount": "0.00" }
  ]
}
```

### POST /wallet/fund

```
Request:  { "requestId": "2b8f0c1e-4d7a-4f43-9a51-0c6e3f2d9b17", "amount": "1000.00" }
201 Created
{
  "replayed": false,
  "transaction": { "requestId": "2b8f0c1e-...", "type": "FUND", "currency": "PLN",
                   "amount": "1000.00", "rate": null, "pln": "1000.00",
                   "createdAt": "2026-11-04T14:20:00Z" },
  "wallet": { "asOf": "...", "balances": [ ... ] }
}
```
Errors: `400 VALIDATION_ERROR` (amount not between 1.00 and 10 000.00, missing requestId).

### POST /transactions/buy

```
Request:  { "requestId": "7f3c2a90-1b6e-4c0d-8e2f-5a9d1c3b7e11", "currency": "USD", "amount": "100.00" }
201 Created
{
  "replayed": false,
  "transaction": { "requestId": "7f3c2a90-...", "type": "BUY", "currency": "USD",
                   "amount": "100.00", "rate": "3.9597", "pln": "395.97",
                   "createdAt": "2026-11-04T14:35:00Z" },
  "wallet": { "asOf": "...", "balances": [ ... ] }
}
```
The service uses the ask rate at execution time and returns it.
Errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `409 REQUEST_ID_CONFLICT`,
`422 INSUFFICIENT_FUNDS`, `503 RATE_STALE` (newest NBP table older than 7 days).

### POST /transactions/sell

Same as buy. The user sells `amount` of `currency` at the bid rate and receives PLN.
`422 INSUFFICIENT_FUNDS` when the currency balance is too small.

### GET /transactions?limit=50

```
200 OK
{ "asOf": "2026-11-04T14:36:00Z", "transactions": [ { "requestId": "7f3c...", "type": "BUY", ... } ] }
```

### GET /transactions/{requestId}

```
200 OK
{ "transaction": { "requestId": "7f3c2a90-...", "type": "BUY", "amount": "100.00", ... } }

404 Not Found
{ "error": { "code": "NOT_FOUND", "message": "No operation with this requestId" } }
```
Only the caller's own operations are visible: another user's `requestId` also returns 404.

## Error codes

| HTTP | Code | Meaning | What the app shows |
|---|---|---|---|
| 400 | VALIDATION_ERROR | Input is wrong | The field error; no retry |
| 401 | UNAUTHORIZED / INVALID_CREDENTIALS | Missing, expired or wrong token / password | Login screen |
| 404 | NOT_FOUND | No operation with this requestId | "Not completed, try again?" |
| 409 | EMAIL_TAKEN | Email already registered | Field error |
| 409 | REQUEST_ID_CONFLICT | Same requestId sent with different content | Error; new requestId needed |
| 422 | INSUFFICIENT_FUNDS | Balance too small | "Not enough PLN" / "Not enough USD" |
| 503 | RATE_UNAVAILABLE / RATE_STALE | No usable NBP rate | "Rates unavailable, trading paused" |
| - | (no response) | Timeout or no connection | Read: cached data. Write: "Status unknown - checking" |

## Stable operation identity (duplicate protection)

1. Before sending a funding, buy or sell request, the app creates a `requestId`
   (UUID) and stores the operation on the device as pending.
2. The same `requestId` is used for every repeat of that operation.
3. The `transactions` table has `UNIQUE (user_id, request_id)`.
4. If a request arrives with a `requestId` that is already stored, the service
   does not execute it again. It returns the stored result with `200` and
   `"replayed": true`.
5. If the stored operation has different content (other currency or amount),
   the service returns `409 REQUEST_ID_CONFLICT`.

Result: a repeated request always has one effect (requirement N6, scenario S10).

## Recovery after a lost response

After a timeout the app cannot know whether the server received the request
(scenario S4) or committed it and only the response was lost (scenario S5).
It never sends the operation again blindly.

| Step | App | Service |
|---|---|---|
| 1 | No response after 10 s: status `UNKNOWN`, shows "Status unknown - checking", blocks a new buy/sell | - |
| 2 | Waits for the connection: NetInfo online and `GET /health` returns 200 | - |
| 3 | `GET /transactions/{requestId}` | Looks up `(user_id, request_id)` |
| 4a | `200`: status `CONFIRMED`, shows "Purchase completed", refreshes wallet and history | The operation had been committed (S5) |
| 4b | `404`: status `NOT_RECEIVED`, shows "Not completed, try again?" | The request never arrived (S4) |
| 5 | If the user confirms, sends the same request again **with the same requestId** | Executes it once; any further repeat is replayed |

The same lookup runs automatically for every pending operation when the app
reconnects (synchronisation, requirement N9).

## Client timeout and retry rules

| Request type | Timeout | Automatic retry |
|---|---|---|
| Reads (`GET`) | 10 s | Up to 2 retries, after 1 s and 2 s (N4) |
| Data-changing (`POST` with requestId) | 10 s | None; recovery procedure above (N5) |
| Login, register, logout | 10 s | None; the user taps again |
