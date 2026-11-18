// Prints one line per request, e.g.
// 2026-11-18T14:32:01.123Z POST /wallet/fund 201 12ms 192.168.1.23
// Useful to see that a request from the phone really reached the service.

function requestLog(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms ${req.ip}`);
  });
  next();
}

module.exports = { requestLog };
