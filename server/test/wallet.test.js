const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const { openDb } = require('../src/db/db');
const { createApp } = require('../src/app');

let db;
let app;

beforeEach(() => {
  db = openDb(':memory:');
  app = createApp({ db, log: false });
});

const pln = (body) => body.balances.find((b) => b.currency === 'PLN').amount;

test('GET /health answers ok', async () => {
  const res = await request(app).get('/health').expect(200);
  assert.equal(res.body.status, 'ok');
});

test('read path: GET /wallet returns four simulated balances', async () => {
  const res = await request(app).get('/wallet').expect(200);
  assert.equal(res.body.simulated, true);
  assert.deepEqual(res.body.balances.map((b) => b.currency), ['PLN', 'USD', 'EUR', 'GBP']);
  assert.equal(pln(res.body), '0.00');
});

test('write path: POST /wallet/fund stores the transaction and the new balance', async () => {
  const requestId = crypto.randomUUID();
  const res = await request(app).post('/wallet/fund').send({ requestId, amount: '1000.50' }).expect(201);
  assert.equal(res.body.replayed, false);
  assert.equal(res.body.transaction.amount, '1000.50');
  assert.equal(pln(res.body.wallet), '1000.50');

  const row = db.prepare('SELECT balance_minor FROM wallets WHERE user_id = 1 AND currency = ?').get('PLN');
  assert.equal(row.balance_minor, 100050);
});

test('same requestId twice: one operation, second answer is replayed (N6)', async () => {
  const requestId = crypto.randomUUID();
  await request(app).post('/wallet/fund').send({ requestId, amount: '100.00' }).expect(201);
  const again = await request(app).post('/wallet/fund').send({ requestId, amount: '100.00' }).expect(200);
  assert.equal(again.body.replayed, true);
  assert.equal(pln(again.body.wallet), '100.00');
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE request_id = ?').get(requestId);
  assert.equal(n, 1);
});

test('same requestId with a different amount is a conflict', async () => {
  const requestId = crypto.randomUUID();
  await request(app).post('/wallet/fund').send({ requestId, amount: '100.00' }).expect(201);
  const res = await request(app).post('/wallet/fund').send({ requestId, amount: '200.00' }).expect(409);
  assert.equal(res.body.error.code, 'REQUEST_ID_CONFLICT');
});

test('invalid input is rejected at the service boundary with a clear error', async () => {
  const cases = [
    [{ requestId: 'abc', amount: '10.00' }, 'requestId'],
    [{ requestId: crypto.randomUUID(), amount: '-5' }, 'amount'],
    [{ requestId: crypto.randomUUID(), amount: '10.999' }, 'amount'],
    [{ requestId: crypto.randomUUID(), amount: '0.50' }, 'between'],
    [{ requestId: crypto.randomUUID(), amount: '20000.00' }, 'between'],
  ];
  for (const [body, word] of cases) {
    const res = await request(app).post('/wallet/fund').send(body).expect(400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.match(res.body.error.message, new RegExp(word));
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM transactions').get();
  assert.equal(n, 0, 'no row may be written for invalid input');
});

test('broken JSON gives a validation error, unknown route gives 404', async () => {
  await request(app).post('/wallet/fund').set('Content-Type', 'application/json').send('{bad').expect(400);
  const res = await request(app).get('/nothing-here').expect(404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('GET /transactions lists the operation and GET /transactions/{requestId} finds it', async () => {
  const requestId = crypto.randomUUID();
  await request(app).post('/wallet/fund').send({ requestId, amount: '50.00' }).expect(201);
  const list = await request(app).get('/transactions').expect(200);
  assert.equal(list.body.transactions.length, 1);
  const one = await request(app).get(`/transactions/${requestId}`).expect(200);
  assert.equal(one.body.transaction.type, 'FUND');
  await request(app).get(`/transactions/${crypto.randomUUID()}`).expect(404);
});
