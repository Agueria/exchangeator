# Network Scenario Matrix (Lab 02)

Each scenario has an expected result that will be tested in Lab 13. The columns
"Observed result" and "Evidence" are added then.

`requestId` = the unique identity the app gives to every data-changing request.

| ID | Scenario | Type | What the user sees | Server state | Expected result (to test) |
|---|---|---|---|---|---|
| S1 | Normal buy of 100 USD (baseline) | Write | "Purchase completed", new balances, new history entry | One transaction committed | Exactly 1 transaction row with this `requestId`; PLN and USD balances in the app equal the database |
| S2 | No connection, user opens rates | Read | Offline banner, cached rates with "last updated" time | No request arrives | Cached rates shown with their time; no endless loading |
| S3 | No connection, user tries to buy | Write | Buy button disabled: "You are offline. Buying is available when connected." | Unchanged | No request sent, no pending item, balances unchanged |
| S4 | Connection lost after tapping Buy, request never reaches the server | Write | "Status unknown - checking"; after reconnecting: "Not completed, you can try again" | No row for this `requestId` | `GET /transactions/{requestId}` returns "not found"; one resend with the same `requestId` creates exactly 1 row |
| S5 | Server commits the buy, response is lost on the way back | Write | "Status unknown - checking"; after reconnecting: "Purchase completed" | One transaction committed | `GET /transactions/{requestId}` returns the stored transaction; no second row; app balances equal the database |
| S6 | Read takes longer than 10 s (timeout) | Read | "Request timed out"; cached data stays on screen | No change | Request cancelled at 10 s; at most 2 automatic retries, then an error with cached data |
| S7 | Buy takes longer than 10 s, server commits at 15 s | Write | At 10 s: "Status unknown - checking"; later: "Purchase completed" | One transaction committed | Final status in the app matches the database; exactly 1 row |
| S8 | Delayed response within the timeout (about 5 s) | Read / Write | Loading indicator, then the normal result | Normal | Result shown once; no duplicate request sent while waiting |
| S9 | Read fails once, then works | Read | Data appears after a short delay | No change | Data shown after the automatic retry; at most 3 attempts in total |
| S10 | Same buy sent twice with the same `requestId` (double tap or retry) | Write | One "Purchase completed" | Second request returns the first result | Exactly 1 transaction row; balance changed once |
| S11 | App closed and reopened while offline | Read | Cached rates, wallet and history with their times | Not involved | Data is still shown after restart, read from device storage |
| S12 | Reconnection after 10 min offline; meanwhile another device bought EUR | Read | "Syncing...", then the updated wallet and history | Has the other device's purchase | Within 5 s the app shows the same balances and history as the database; pending requests resolved first |
| S13 | Two devices sell the same 100 USD at the same moment (competing requests) | Write | One device: "Sale completed"; other: "Insufficient USD balance" | One sell committed, one rejected | Exactly 1 sell row; USD balance 0, never negative |
| S14 | NBP unavailable or newest table older than 7 days | Read / Write | Rates with their old date and a warning; buy/sell rejected with a message | No transaction | Trade rejected with a "rate too old" error; no row created |

## The two cases the course separates

- **S4 - the server never received the request.** Nothing happened, so the same
  request may be sent again with the same `requestId`.
- **S5 - the server committed but the response was lost.** The operation already
  happened. Sending it again must not create a second purchase; the app learns the
  result by asking about the `requestId`.

After a timeout the phone cannot tell S4 from S5. That is why it always asks the
server first (requirement N5).
