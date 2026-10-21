# Mobile Currency Exchange System

NIMB2026 - Network Issues in Mobile Systems 2026/2027 - laboratory project
**Project A: Mobile Currency Exchange System** - group **L2026_13**
Supervisor: Marcin Kacprowicz

A mobile app that lets a user register, log in, fund a *simulated* PLN wallet,
view current and historical exchange rates from the National Bank of Poland (NBP)
API, buy and sell USD, EUR and GBP, and review their transaction history. The point of the
project is not the exchange itself: it is keeping the system **correct and honest
when the mobile connection is slow, interrupted, or lost**.

> All funding is **virtual**. No real money is involved and every balance in
> the app is labelled as simulated.

---

## Team

| Name | Student ID | Main responsibility |
|---|---|---|
| Cem Berk Çakır | 44463 | Mobile client (Expo): screens, offline cache, reconnection and synchronisation |
| Muhammed Huseyin Ugur | 58758 | Web service, database, authentication, NBP integration, transactions |
| Seyfettin Kerem Surupcu | 58567 | Requirements, UML/ERD diagrams, network-failure test matrix, report and presentation |

Lab 01, Lab 10 (timeout/retry touches both sides) and the final demonstration are
shared. The split is a proposal and can be changed in the implementation plan.

## Topic decision

We chose **Project A** over Project B (Smart City Parking) because:

1. **The external data source is given and simple.** The NBP API is public, needs
   no API key, and returns JSON. Project B would require inventing parking and
   location data and defining what "nearest" means.
2. **It shows the course's core problem in its purest form.** A buy request whose
   response is lost is an *uncertain outcome*: did the server execute the purchase
   or not? Everything in Labs 09-13 builds on that question.
3. **The supplied report template is written for Project A.** Project B would
   require adapting the template.

## Technology choices: one language, nothing to install but Node

| Layer | Choice | Why it is the simplest option that still meets the handbook |
|---|---|---|
| Mobile client | **Expo (React Native), JavaScript** | A real phone app. Runs on the phone through the free *Expo Go* app by scanning a QR code; no Android Studio, no emulator. |
| Web service | **Node.js + Express, JavaScript** | Same language as the client, so one skill set covers the whole project. A few small files. |
| Database | **SQLite** (`better-sqlite3`) | A single file inside the repository; no database server to install. Supports real transactions, which Lab 09 needs, and a `UNIQUE` constraint gives duplicate protection for free. |
| Authentication | Password hash (`bcrypt`) + random **session token** stored in the database | Easy to explain: "the server looks the token up". No signing or key management. |
| External data | **NBP API**, Table C (bid/ask) | Official buy/sell rates; historical rates come from the same API. |
| Diagrams | draw.io (`.drawio` files in `docs/diagrams/`) | Editable diagram files are required at M1. |
| Version control | Git + GitHub | Required by the course. |

The handbook states that the frameworks and databases it names are **examples,
not mandatory technologies** ("Design choices", handbook chapter 2). The stack above
was chosen to minimise what a small team has to learn and to make the
network-failure demonstrations reproducible on any laptop.

## Architecture

```
[Expo app] ~~ Wi-Fi / LTE ~~ [Base station] ── Internet ── [Node/Express service] ── [SQLite file]
  (cache)   UNRELIABLE                                               │
                                                                  [NBP API]
```

| Component | Responsibility | Owns (authoritative) |
|---|---|---|
| Mobile app | Screens, local cache with timestamps, list of pending `requestId`s | nothing - only copies |
| Web service | Validation, authorisation, buy/sell logic, NBP access, decides every outcome | the decision |
| SQLite database | Users, sessions, wallet balances, transactions | users, wallets, transactions |
| NBP API | Exchange rates | rates |

Rule: **the mobile app never decides an outcome; the service decides and the
database records it.** The app also never calls NBP directly; the service does
(lecture Week 06: the service shields the mobile client from external data).

Details and the request path: [docs/architecture.md](docs/architecture.md),
figure: [docs/diagrams/architecture.png](docs/diagrams/architecture.png),
editable: [docs/diagrams/architecture.drawio](docs/diagrams/architecture.drawio)

## Repository structure

```
.
├── mobile/          # Expo (React Native) client            - from Lab 06
├── server/          # Node.js + Express service + SQLite    - from Lab 05
├── docs/
│   ├── architecture.md      # components, data owners, request path
│   ├── user-journeys.md     # 2 normal + 2 interrupted journeys
│   ├── risks.md             # initial risk list
│   ├── requirements.md      # functional + non-functional requirements (Lab 02)
│   ├── network-scenarios.md # network scenario matrix with expected results (Lab 02)
│   ├── diagrams/            # architecture.png + .drawio (editable)
│   └── report/              # Word report built on the course template (M1 draft)
└── README.md
```

## Getting started

_To be completed in Lab 05-06. Planned commands:_

```
# service (creates the SQLite file on first start)
cd server
npm install
npm run dev

# mobile (prints a QR code; open it with Expo Go on the phone)
cd mobile
npm install
npx expo start
```

### Configuration (no secrets in Git)

Each component reads a local `.env` file that is **not** committed.
`.env.example` will list every variable with placeholder values:
`PORT`, `DATABASE_FILE`, `NBP_BASE_URL`, `REQUEST_TIMEOUT_MS`, `SESSION_TTL_HOURS`.
The mobile app needs only the service URL (`API_URL`).

## External data assumptions (NBP API)

- Base URL `https://api.nbp.pl/api/`, public, no API key.
- **Table C** gives bid (we buy from the user) and ask (we sell to the user) rates,
  for example `GET /exchangerates/rates/C/USD/?format=json`.
- Historical rates: `GET /exchangerates/rates/C/USD/{from}/{to}/?format=json`.
- NBP publishes on **business days only**. On weekends and holidays the last
  published table is used and its `effectiveDate` is shown to the user.
- If NBP is unreachable the service serves its last cached table with the fetch
  time; it refuses trades when that cache is older than the agreed limit.

## Network behaviour policies (confirmed in Lab 02)

Full list with IDs: [docs/requirements.md](docs/requirements.md). Scenarios that
test them: [docs/network-scenarios.md](docs/network-scenarios.md).

| Policy | Value | Requirement |
|---|---|---|
| Response time target | 9 of 10 reads within 1 s, 9 of 10 buy/sell within 2 s (demo network) | N1 |
| Request timeout | 10 s | N2 |
| Offline detection | banner within 3 s | N3 |
| Retry of reads (rates, wallet, history) | automatic, max 2 retries (after 1 s and 2 s) | N4 |
| Retry of writes (funding, buy, sell) | **never blind**: the app asks `GET /transactions/{requestId}` first and resends with the same `requestId` only if the server never received it | N5, N6 |
| Offline rule | reads from cache with "last updated" label; **funding, buy and sell blocked** (not queued) | N7, N8 |
| Synchronisation | within 5 s of reconnecting: resolve pending requests, then refresh wallet, history and rates; server data wins | N9 |
| Rate freshness for trading | trade refused if the newest NBP table is older than 7 days | N11 |
| Session token lifetime | 24 h | F2 |

## Network-failure demonstration

_To be completed in Labs 10-13._ This section will give the exact steps to
reproduce each scenario of the test matrix (no connection before a request, loss
after a buy reaches the server, timeout, slow response, retry, repeated request
with the same `requestId`, cached display while offline, reconnection and
synchronisation) and how to inspect the SQLite file to confirm the server's
authoritative state.

## Milestones

| Milestone | When | Content | Git revision | Status |
|---|---|---|---|---|
| M1 | before the 5th meeting | PDF report (Labs 1-4), editable UML + ERD, API outline, failure scenarios, repo link | _TBD_ | planned |
| M2 | after Week 8 | Working client/server prototype | _TBD_ | planned |
| M3 | after Week 13 | Network-resilient application + test matrix | _TBD_ | planned |
| M4 | Week 15 | Final system, report, user manual, presentation, live demo | _TBD_ | planned |

## Documentation

- [Architecture and request path](docs/architecture.md)
- [User journeys](docs/user-journeys.md)
- [Initial risk list](docs/risks.md)
- [Requirements](docs/requirements.md)
- [Network scenario matrix](docs/network-scenarios.md)
- [Report draft (course template)](docs/report/Project_Documentation_M1_draft.docx)
