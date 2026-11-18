# Lab 06 evidence - a real request from the phone

Lab 06 asks to show a real client request reaching the service and the
database, with the resulting screen and the stored state.

Screenshots in this folder:

| File | What it shows |
|---|---|
| `01-wallet.png` | Wallet screen loaded from the service |
| `02-fund-added.png` | "Added" after adding PLN from the phone |
| `03-validation-error.png` | Wrong amount: error under the field, nothing stored |
| `04-no-connection.png` | Service stopped: "No connection to the server" |
| `05-server-log.png` | Service log with the requests from the phone's address |

Stored state after the test (query on `server/data/exchange.db`):

```
SELECT currency, balance_minor FROM wallets WHERE user_id = 1;
SELECT request_id, type, amount_minor, created_at FROM transactions;
```
