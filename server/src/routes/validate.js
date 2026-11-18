const { ApiError } = require('../middleware/errors');
const { toMinor } = require('../money');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requestIdFrom(body) {
  const id = body && body.requestId;
  if (typeof id !== 'string' || !UUID.test(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'requestId must be a UUID created by the app');
  }
  return id.toLowerCase();
}

/** Amount as a string with up to 2 decimals, between min and max (in minor units). */
function amountFrom(body, minMinor, maxMinor) {
  const minor = toMinor(body && body.amount);
  if (minor === null) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'amount must be a number with up to 2 decimals, for example "100.00"');
  }
  if (minor < minMinor || minor > maxMinor) {
    throw new ApiError(400, 'VALIDATION_ERROR', `amount must be between ${minMinor / 100} and ${maxMinor / 100}`);
  }
  return minor;
}

module.exports = { requestIdFrom, amountFrom, UUID };
