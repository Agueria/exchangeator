const { ApiError } = require('../middleware/errors');
const { fromMinor, fromE4 } = require('../money');

const CURRENCIES = ['PLN', 'USD', 'EUR', 'GBP'];

function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function toTransactionJson(row) {
  return {
    requestId: row.request_id,
    type: row.type,
    currency: row.currency,
    amount: fromMinor(row.amount_minor),
    rate: fromE4(row.rate_e4),
    pln: fromMinor(row.pln_minor),
    createdAt: row.created_at,
  };
}

function getWallet(db, userId) {
  const rows = db.prepare('SELECT currency, balance_minor FROM wallets WHERE user_id = ?').all(userId);
  const byCode = Object.fromEntries(rows.map((r) => [r.currency, r.balance_minor]));
  return {
    asOf: now(),
    simulated: true,
    balances: CURRENCIES.map((currency) => ({ currency, amount: fromMinor(byCode[currency] ?? 0) })),
  };
}

/**
 * Adds simulated PLN. The whole operation is one database transaction:
 * either the transaction row and the new balance are both stored, or nothing is.
 * A repeated requestId returns the first result and changes nothing (N6).
 */
function fund(db, userId, requestId, amountMinor) {
  const run = db.transaction(() => {
    const existing = db
      .prepare('SELECT * FROM transactions WHERE user_id = ? AND request_id = ?')
      .get(userId, requestId);
    if (existing) {
      if (existing.type !== 'FUND' || existing.amount_minor !== amountMinor) {
        throw new ApiError(409, 'REQUEST_ID_CONFLICT', 'This requestId was already used for a different operation');
      }
      return { replayed: true, row: existing };
    }
    const createdAt = now();
    const info = db
      .prepare(
        `INSERT INTO transactions (user_id, request_id, type, currency, amount_minor, rate_e4, pln_minor, created_at)
         VALUES (?, ?, 'FUND', 'PLN', ?, NULL, ?, ?)`
      )
      .run(userId, requestId, amountMinor, amountMinor, createdAt);
    db.prepare(
      `UPDATE wallets SET balance_minor = balance_minor + ?, updated_at = ?
       WHERE user_id = ? AND currency = 'PLN'`
    ).run(amountMinor, createdAt, userId);
    return { replayed: false, row: db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid) };
  });

  const { replayed, row } = run();
  return { replayed, transaction: toTransactionJson(row), wallet: getWallet(db, userId) };
}

function listTransactions(db, userId, limit) {
  return db
    .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?')
    .all(userId, limit)
    .map(toTransactionJson);
}

function findByRequestId(db, userId, requestId) {
  const row = db.prepare('SELECT * FROM transactions WHERE user_id = ? AND request_id = ?').get(userId, requestId);
  return row ? toTransactionJson(row) : null;
}

module.exports = { getWallet, fund, listTransactions, findByRequestId, now };
