# Requirements (Lab 02)

## Functional requirements

| ID | Function | Requirement (testable) | Priority |
|---|---|---|---|
| F1 | Registration | A user can create an account with an email and a password of at least 8 characters. An email that is already registered is rejected. | High |
| F2 | Login | A user with correct credentials receives a session token valid for 24 hours. Wrong credentials return an error and no token. | High |
| F3 | Logout | After logout the token is deleted on the server; any later request with it is rejected (401). | Medium |
| F4 | Simulated funding | A logged-in user can add virtual PLN to the wallet (1 to 10,000 PLN per operation). The screen labels the money as simulated. | High |
| F5 | Current rates | The app shows the buy (ask) and sell (bid) rates of USD, EUR and GBP from NBP Table C, with the NBP publication date and the time the app received them. | High |
| F6 | Historical rates | The user can view the rates of one currency for the last 30 days. | Medium |
| F7 | Buy currency | The user buys a foreign currency with PLN at the ask rate. PLN is debited, the currency is credited and a transaction is recorded as one operation. A purchase larger than the PLN balance is rejected. | High |
| F8 | Sell currency | The user sells a foreign currency for PLN at the bid rate, with the same rules as F7. | High |
| F9 | Wallet | The app shows the PLN, USD, EUR and GBP balances and the time they were last confirmed by the server. | High |
| F10 | Transaction history | The app lists funding, buy and sell operations, newest first, with type, currency, amount, rate, PLN value and date. | High |
| F11 | Operation status | For an operation whose response did not arrive, the app can ask the server for its result and show "completed" or "not completed". | High |

## Non-functional requirements

| ID | Name | Requirement (measurable) | Category |
|---|---|---|---|
| N1 | Response time | On the demo network, 9 of 10 reads answer within 1 s and 9 of 10 buy/sell requests within 2 s. | Performance |
| N2 | Request timeout | Every request is cancelled after 10 s. A read then shows "Request timed out"; a data-changing request shows "Status unknown - checking". | Connectivity |
| N3 | Offline detection | Within 3 s of losing the connection the app shows an offline banner. | Connectivity |
| N4 | Read retry | A failed read is retried automatically at most 2 times (after 1 s and 2 s). | Connectivity |
| N5 | Write retry | A data-changing request is never resent blindly. The app first asks `GET /transactions/{requestId}`; it resends with the same `requestId` only if the server never received it. | Connectivity |
| N6 | Duplicate protection | Every data-changing request carries a unique `requestId`. The server stores it as unique per user; a repeated request returns the first result and creates no second operation. | Consistency |
| N7 | Local cache | Rates, wallet and history are stored on the device with a timestamp and are still available after the app is restarted offline. | Cache |
| N8 | Offline actions | Offline, the user can view cached data. Funding, buy and sell are blocked with an explanation. The app never shows success without server confirmation. | Connectivity |
| N9 | Synchronisation | Within 5 s after the connection returns, the app resolves pending requests and then refreshes wallet, history and rates. Server data always replaces local data. | Synchronisation |
| N10 | Consistency | Debit, credit and transaction record are written in one database transaction. A balance can never become negative, also when two requests use the same balance at the same time. | Consistency |
| N11 | Rate freshness | Every displayed rate shows its NBP publication date. The server refuses a trade if its newest NBP table is older than 7 days. | Data quality |
| N12 | Security | Passwords are stored only as hashes. Every wallet and transaction request needs a valid token, and a user can access only their own data. No secrets are stored in Git. | Security |
| N13 | Simulated money | All balances are virtual and labelled as simulated in the interface. | Usability |

### Why these numbers

- **10 s timeout (N2):** a slow mobile link can need a few seconds, but after 10 s the user should get feedback instead of a frozen screen.
- **1 s / 2 s response time (N1):** the server and database run on a local machine, so most of the delay comes from the wireless link. Buy/sell is slower than a read because it also checks the rate and writes a transaction.
- **2 read retries (N4):** enough to survive a short drop without waiting too long; reads do not change data, so repeating them is safe.
- **7 days (N11):** NBP publishes only on business days, so a long weekend with holidays can leave a table several days old; older than a week is treated as unusable.

## Reads and data-changing operations

| Operation | Type | Needs server confirmation | Available offline |
|---|---|---|---|
| Current rates (F5), historical rates (F6) | Read | No | Yes, from cache with date |
| Wallet (F9), history (F10) | Read | No | Yes, from cache with "last updated" |
| Operation status (F11) | Read | No | No (needs the server) |
| Registration (F1), login (F2), logout (F3) | Data-changing | Yes | No |
| Funding (F4), buy (F7), sell (F8) | Data-changing | Yes, with `requestId` | **No, blocked** |

## Offline decision: block, not queue

Data-changing actions are **blocked** while offline. We do not queue them because:

1. A queued purchase would run later at a different rate than the user saw.
2. The user could close the app and forget the queued intent, then find an unexpected purchase.
3. Blocking keeps the rule simple: the app never shows a result that the server has not confirmed.

Queuing an explicit intent is listed as a possible extension in the report.
