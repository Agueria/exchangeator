const express = require('express');
const wallets = require('../services/walletService');
const { requestIdFrom, amountFrom } = require('./validate');

const FUND_MIN = 100;        // 1.00 PLN
const FUND_MAX = 1000000;    // 10 000.00 PLN (requirement F4)

function walletRouter(db) {
  const router = express.Router();

  // Read path: GET /wallet (F9)
  router.get('/', (req, res) => {
    res.json(wallets.getWallet(db, req.userId));
  });

  // Write path: POST /wallet/fund (F4). 201 = new operation, 200 = repeated requestId.
  router.post('/fund', (req, res) => {
    const requestId = requestIdFrom(req.body);
    const amountMinor = amountFrom(req.body, FUND_MIN, FUND_MAX);
    const result = wallets.fund(db, req.userId, requestId, amountMinor);
    res.status(result.replayed ? 200 : 201).json(result);
  });

  return router;
}

module.exports = { walletRouter };
