// Money travels as strings with 2 decimals ("100.00") and is stored as
// INTEGER minor units (grosz / cents), so no floating point is involved.

const AMOUNT = /^\d{1,9}(\.\d{1,2})?$/;

/** "100.5" -> 10050, invalid input -> null */
function toMinor(value) {
  if (typeof value !== 'string' || !AMOUNT.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** 10050 -> "100.50" */
function fromMinor(minor) {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** 39597 -> "3.9597" (rates are stored as INTEGER x 10 000) */
function fromE4(e4) {
  if (e4 === null || e4 === undefined) return null;
  return `${Math.floor(e4 / 10000)}.${String(e4 % 10000).padStart(4, '0')}`;
}

module.exports = { toMinor, fromMinor, fromE4 };
