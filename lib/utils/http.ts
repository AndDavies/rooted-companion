export function readIdempotencyKey(headers: Headers): string | null {
  return headers.get('X-Idempotency-Key') || headers.get('Idempotency-Key');
}


