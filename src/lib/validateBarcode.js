// lib/validateBarcode.js
// Validates EAN-13/UPC-A check digit so we reject garbled Quagga reads
// before ever sending them to the lookup function.

export function isValidEAN13(code) {
  if (!/^\d{13}$/.test(code) && !/^\d{12}$/.test(code)) return false;

  const digits = code.padStart(13, '0').split('').map(Number);
  const checkDigit = digits.pop();

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}