-- Test data for development. Runs only when the users table is empty.
-- The password hash is a placeholder until login is implemented in Lab 07.

INSERT INTO users (id, email, password_hash, created_at)
VALUES (1, 'test@exchangeator.local', 'not-set-until-lab-07', '2026-11-18T00:00:00Z');

INSERT INTO wallets (user_id, currency, balance_minor, updated_at) VALUES
  (1, 'PLN', 0, '2026-11-18T00:00:00Z'),
  (1, 'USD', 0, '2026-11-18T00:00:00Z'),
  (1, 'EUR', 0, '2026-11-18T00:00:00Z'),
  (1, 'GBP', 0, '2026-11-18T00:00:00Z');
