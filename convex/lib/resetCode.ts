/** Six decimal digits, sampled without modulo bias using the Web Crypto API. */
export function generateResetCode(): string {
  const range = 1_000_000;
  const limit = Math.floor(2 ** 32 / range) * range;
  const random = new Uint32Array(1);

  do {
    crypto.getRandomValues(random);
  } while (random[0] >= limit);

  return (random[0] % range).toString().padStart(6, "0");
}
