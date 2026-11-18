const express = require('express');
const wallets = require('../services/walletService');
const { ApiError } = require('../middleware/errors');
const { UUID } = require('./validate');

function transactionsRouter(db) {
  const router = express.Router();

  // GET /transactions?limit=50 (F10)
  router.get('/', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json({ asOf: wallets.now(), transactions: wallets.listTransactions(db, req.userId, limit) });
  });

  // GET /transactions/{requestId}: result of one data-changing request (F11, N5)
  router.get('/:requestId', (req, res) => {
    if (!UUID.test(req.params.requestId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'requestId must be a UUID');
    }
    const transaction = wallets.findByRequestId(db, req.userId, req.params.requestId.toLowerCase());
    if (!transaction) {
      throw new ApiError(404, 'NOT_FOUND', 'No operation with this requestId');
    }
    res.json({ transaction });
  });

  return router;
}

module.exports = { transactionsRouter };
