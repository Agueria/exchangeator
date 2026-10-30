-- Exchangeator database schema (SQLite)
-- Matches the ERD in docs/diagrams/erd.drawio.
-- Money is stored in minor units (grosz / cents) as INTEGER.
-- Exchange rates are stored as INTEGER x 10 000 (3.9597 -> 39597).
-- Dates are ISO 8601 text in UTC, e.g. 2026-11-04T14:32:00Z.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL
);

-- One row per user and currency; created with balance 0 at registration.
CREATE TABLE IF NOT EXISTS wallets (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency      TEXT    NOT NULL CHECK (currency IN ('PLN', 'USD', 'EUR', 'GBP')),
  balance_minor INTEGER NOT NULL DEFAULT 0 CHECK (balance_minor >= 0),   -- N10
  updated_at    TEXT    NOT NULL,
  PRIMARY KEY (user_id, currency)
);

-- Every funding, buy and sell. request_id is the identity the app gives to
-- each data-changing request; the UNIQUE rule makes a repeat impossible (N6).
CREATE TABLE IF NOT EXISTS transactions (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id   TEXT    NOT NULL,
  type         TEXT    NOT NULL CHECK (type IN ('FUND', 'BUY', 'SELL')),
  currency     TEXT    NOT NULL CHECK (currency IN ('PLN', 'USD', 'EUR', 'GBP')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  rate_e4      INTEGER CHECK (rate_e4 IS NULL OR rate_e4 > 0),   -- NULL for FUND
  pln_minor    INTEGER NOT NULL CHECK (pln_minor > 0),
  created_at   TEXT    NOT NULL,
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions (user_id, created_at DESC);

-- Last NBP table C values kept by the service (refreshed after 30 minutes).
-- No foreign key: the rate used by a trade is copied into transactions.rate_e4.
CREATE TABLE IF NOT EXISTS rate_cache (
  code           TEXT    PRIMARY KEY CHECK (code IN ('USD', 'EUR', 'GBP')),
  table_no       TEXT    NOT NULL,
  effective_date TEXT    NOT NULL,
  bid_e4         INTEGER NOT NULL CHECK (bid_e4 > 0),
  ask_e4         INTEGER NOT NULL CHECK (ask_e4 > 0),
  fetched_at     TEXT    NOT NULL
);
