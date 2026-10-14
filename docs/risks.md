# Initial Risk List

| ID | Risk | Example | Impact | Planned mitigation | Lab |
|---|---|---|---|---|---|
| **R1** | **Stale data** | App shows rates or balances cached hours ago while offline | User decides on wrong information | Show "last updated" time and the NBP `effectiveDate`; block trading while offline or when the quote is too old; refresh on reconnect | 11, 12 |
| **R2** | **Uncertain outcome after a lost response** | Buy request executed on the server, response lost on the wireless link | User does not know whether money moved | Keep the request as *pending*; after reconnecting ask `GET /transactions/{requestId}` instead of buying again | 10, 12 |
| R3 | Duplicate request | User taps Buy again after a timeout, or the app retries | Currency bought twice | Every write carries a `requestId`; `UNIQUE(request_id)` in the `transactions` table makes a second insert impossible; the service returns the stored result | 09, 10 |
| R4 | External source unavailable | NBP API down or slow; no new table on weekends/holidays | No current rate available | Service caches the last table with its date; refuses trades if the table is older than 7 days | 08 |
| R5 | Rate changes between quote and execution | User sees a rate, confirms 30 s later | Executed price differs from the quoted one | Server uses the rate at execution time and returns it in the response | 09 |
| R6 | Concurrent wallet updates | Two devices sell the same balance at once | Negative balance | Debit, credit and insert run in one SQLite transaction; SQLite serialises writers and the balance check happens inside the transaction | 09 |
| R7 | Expired session token | Token expires during an operation | Request rejected; user confused | Service answers 401; app shows "please log in again" and keeps the pending request | 07 |
| R8 | Partial update | Service crashes after debiting PLN but before crediting USD | Lost money | All three changes in one atomic transaction: either all or none | 09 |
| R9 | Changing network attachment | Phone switches from Wi-Fi to LTE mid-request | Connection reset, response lost | Same handling as R2; a repeat is safe because of R3 | 10 |
