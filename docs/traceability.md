# Traceability (Lab 03)

Every requirement mapped to its use case (use cases carry the same ID and name as
the requirement), the component that decides the result, and where it is shown
in the design.

## Functional requirements

The endpoint of each requirement is listed in [api.md](api.md).

| Requirement and use case | Mobile component | Service component (decides) | Data (tables) |
|---|---|---|---|
| F1 Registration | Screens (RegisterScreen), ApiClient | AuthService | users, wallets |
| F2 Login | Screens (LoginScreen), Session | AuthService | sessions |
| F3 Logout | Session | AuthService | sessions |
| F4 Simulated funding | FundScreen, PendingRequests | WalletService | transactions, wallets |
| F5 Current rates | RatesScreen, CacheStore | RateService, NbpClient | rate_cache |
| F6 Historical rates | RateHistoryScreen | RateService, NbpClient | - (from NBP) |
| F7 Buy currency | TradeScreen, PendingRequests | TransactionService | transactions, wallets |
| F8 Sell currency | TradeScreen, PendingRequests | TransactionService | transactions, wallets |
| F9 Wallet | WalletScreen, CacheStore | WalletService | wallets |
| F10 Transaction history | HistoryScreen, CacheStore | TransactionService | transactions |
| F11 Operation status (use case extends F7, F8) | PendingRequests, SyncService | TransactionService | transactions |

## Non-functional requirements

| Requirement | Responsible component | Shown in |
|---|---|---|
| N1 Response time | Web service, SQLite | Lab 13 measurements |
| N2 Request timeout (10 s) | ApiClient (timeoutMs) | Class diagram (mobile), API outline |
| N3 Offline detection (3 s) | ConnectivityMonitor, OfflineBanner | Class diagram (mobile) |
| N4 Read retry (2) | ApiClient (maxReadRetries) | Data flow: read |
| N5 Write retry only after asking | PendingRequests, SyncService | Data flow: recovery |
| N6 Duplicate protection | TransactionService, UNIQUE (user_id, request_id) | ERD, data flow: buy, recovery |
| N7 Local cache | CacheStore | Class diagram (mobile), data flow: read |
| N8 Offline actions blocked | Screens, ConnectivityMonitor | Requirements 3.3 |
| N9 Synchronisation (5 s) | SyncService | Class diagram (mobile), data flow: recovery |
| N10 Consistency | TransactionService (one DB transaction), CHECK (balance_minor >= 0) | ERD, data flow: buy |
| N11 Rate freshness (7 days) | RateService (assertFresh), FreshnessLabel | Data flow: buy |
| N12 Security | AuthMiddleware, AuthService | Class diagram (service) |
| N13 Simulated money | WalletScreen, GET /wallet (`simulated: true`) | API outline |

**Who decides the outcome:** only the web service decides whether a data-changing
action succeeded; SQLite stores the result. The mobile app shows it and keeps
copies (see `dataflow-buy`).
