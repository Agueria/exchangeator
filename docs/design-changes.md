# Design changes since M1

Changes between the M1 design (revision `fb7b35a`) and the implementation.
Each entry says what changed and why.

## Lab 05 - Web service and database foundation

| # | Change | Reason |
|---|---|---|
| 1 | Until login exists, every request acts as the seeded test user (`DEV_USER_ID`, middleware `devUser`). | Login and session tokens are Lab 07. The planned `AuthMiddleware` replaces `devUser` without changing the routes. |
| 2 | Express 4 instead of an unspecified Express version; Node's own `process.loadEnvFile()` reads `.env` instead of the `dotenv` package. | Stable version; one dependency less. |
| 3 | `GET /transactions` and `GET /transactions/{requestId}` were implemented already in Lab 05 (planned for Labs 09-10). | They are small read paths and make the duplicate-protection test complete. |
| 4 | A request log prints one line per request (method, path, status, time, client address). | Shows that a request from the phone reached the service (Lab 06 evidence). |
| 5 | The database uses WAL journal mode. | Readers do not block the writer; safer when the app reads while a write is running. |
| 6 | Test data: `server/src/db/seed.sql` creates one test user with four empty wallets. | Lab 05 asks for simulated or test data; the password hash is a placeholder until Lab 07. |

No change to the ERD, the tables or the API contract.

## Lab 06 - Mobile client and service communication

| # | Change | Reason |
|---|---|---|
| 7 | Navigation is a simple two-tab state in `App.js` instead of Expo Router. | Only two screens exist so far; fewer dependencies for the first version. Expo Router can be added when more screens arrive (Labs 07-09). |
| 8 | The class diagram's `ApiClient` is implemented as functions in `src/api/client.js` and `src/api/endpoints.js`. | Same responsibilities (timeout, error kinds); plain functions are simpler in React Native. |
| 9 | The funding screen already keeps the `requestId` when no answer arrived and reuses it on retry. | Cheap to add now; it is the client half of duplicate protection (N6). The full pending-operation flow is still planned for Lab 10. |
| 10 | Commas are accepted in amounts ("100,50" becomes "100.50"). | Polish keyboards use a comma as the decimal separator. |

The class diagram (`docs/diagrams/class-mobile.drawio`) and the report will be
updated with these changes for M2.
