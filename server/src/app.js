const express = require('express');
const health = require('./routes/health');
const { walletRouter } = require('./routes/wallet');
const { transactionsRouter } = require('./routes/transactions');
const { devUser } = require('./middleware/devUser');
const { requestLog } = require('./middleware/requestLog');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp({ db, log = true }) {
  const app = express();
  app.use(express.json({ limit: '20kb' }));
  if (log) app.use(requestLog);

  app.use('/health', health);

  // Everything below needs a user. Lab 05: fixed test user; Lab 07: session token.
  app.use(devUser);
  app.use('/wallet', walletRouter(db));
  app.use('/transactions', transactionsRouter(db));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
