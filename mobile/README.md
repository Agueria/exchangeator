# Mobile client

Expo (React Native, SDK 58), JavaScript. Runs on a phone through the **Expo Go**
app; no Android Studio is needed.

## Start

1. Start the web service first (see [server/README.md](../server/README.md)) and
   note the address it prints, for example `http://192.168.1.11:3000`.
2. Copy `.env.example` to `.env` and put that address in `EXPO_PUBLIC_API_URL`.
3. Install and start:

```
cd mobile
npm install
npx expo start
```

4. Scan the QR code with Expo Go (Android) or the camera app (iPhone).

The phone and the laptop must be on the **same Wi-Fi**. If the university
network blocks traffic between devices, use the phone's hotspot for the laptop.
On Windows, allow Node.js through the firewall for private networks when asked;
otherwise the phone cannot reach port 3000.

After changing `.env`, restart `npx expo start` so the new address is used.

## What works (Lab 06)

| Screen | Request | States shown |
|---|---|---|
| Wallet | `GET /wallet` (read) | loading, balances with the time confirmed by the server, error with "Try again", pull to refresh |
| Add PLN | `POST /wallet/fund` (write, with a `requestId`) | sending, added, input error under the field, no connection, no answer within 10 s |

- A tap only sends the request; the screen shows the result the service confirmed.
- A validation error (wrong amount) and a network problem (no connection, timeout)
  are shown differently.
- Every request is cancelled after 10 seconds (N2).
- If the answer did not arrive, a retry of the same amount reuses the same
  `requestId`, so the money cannot be added twice (N6). The full recovery flow
  ("Status unknown - checking") comes in Lab 10.

## Folder structure

```
App.js                  header, two tabs, shared wallet state
src/config.js           service address and timeout
src/api/client.js       fetch with timeout, error kinds (network, timeout, validation, server)
src/api/endpoints.js    getWallet, fundWallet
src/screens/            WalletScreen, FundScreen
src/components/         Notice (coloured message box)
```
