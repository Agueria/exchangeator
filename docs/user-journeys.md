# User Journeys

## Normal journeys

### N1 - Check rates and wallet

1. User opens the app and logs in.
2. App requests the wallet and current rates from the web service.
3. Web service reads balances from the database and rates from its NBP cache.
4. App shows PLN, USD, EUR and GBP balances and current buy/sell rates with the
   NBP publication date.

### N2 - Buy currency

1. User selects USD, enters 100, and sees the quoted ask rate and PLN cost.
2. User confirms. App sends `POST /transactions/buy` with a new `requestId`.
3. Web service checks balance, applies the current rate, and records the
   transaction atomically.
4. App shows "Purchase completed", the updated wallet, and the new entry in history.

## Journeys interrupted by connectivity loss

### I1 - Lost response after buy (uncertain outcome)

1. User confirms "Buy 100 USD". The request reaches the server.
2. The server completes the transaction and sends the response.
3. The phone loses its connection (e.g. enters a lift) before the response arrives.
4. The app times out. **The user cannot know whether 100 USD was bought.**
5. If the user simply taps Buy again, the purchase could happen twice.

**Intended handling:**
- The app keeps the request as *pending* and shows "Status unknown - checking…",
  not "Failed".
- On reconnection the app asks `GET /transactions/{requestId}` instead of
  sending the purchase again.
- The server sees the `requestId` was already processed and returns the original
  result instead of buying again.

### I2 - Offline with stale rates

1. User checks rates at 09:00, then goes underground with no signal.
2. At 11:00 the user opens the app again. It shows the rates cached at 09:00.
3. The real rate may have changed (or a new NBP table may have been published).

**Intended handling:**
- The app shows cached rates and balances with a clear label:
  "Offline - last updated 09:00".
- Buy/sell is disabled while offline, so no operation is based on a stale quote.
- When the connection returns, the app refreshes rates before allowing a trade.
