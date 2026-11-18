// Lab 05: there is no login yet, so every request acts as the seeded test user.
// Lab 07 replaces this with AuthMiddleware (session token -> user id).

function devUser(req, res, next) {
  req.userId = Number(process.env.DEV_USER_ID || 1);
  next();
}

module.exports = { devUser };
