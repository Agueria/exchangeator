const express = require('express');

const router = express.Router();

// Used by the app to check whether the service is reachable (N3, N9).
router.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') });
});

module.exports = router;
