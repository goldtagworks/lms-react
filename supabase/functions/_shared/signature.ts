// In-memory replay cache (Edge instance local). For multi-instance, use shared store.
const replayCache = new Map<string, number>();
const REPLAY_TTL_MS = 5 * 60 * 1000; // 5분

function sweepReplay() {
  const now = Date.now();
  for (const [k, v] of replayCache.entries()) {
    if (now - v > REPLAY_TTL_MS) replayCache.delete(k);
  }
}
setInterval(sweepReplay, 60_000);

// Web Crypto HMAC implementation for Deno/Edge
async function hmacSHA256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison for hex strings
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// HMAC Signature Verification (Async for Deno Web Crypto)
// X-Signature = hex(hmac_sha256(secret, `${timestamp}.${rawBody}`))
// X-Timestamp = unix seconds; abs(now - ts) <= 300

export async function verifySignature(rawBody: string, signature: string | null, timestamp: string | null, secret: string, replayKeyExtra?: string): Promise<boolean> {
  if (!signature || !timestamp) return false;
  if (!/^[0-9]+$/.test(timestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 300) return false; // 5분 이내

  try {
    const expectedHash = await hmacSHA256(secret, `${timestamp}.${rawBody}`);
    if (!safeEqualHex(expectedHash, signature)) return false;
    
    // Replay 검증
    const replayKey = `${timestamp}:${signature}:${replayKeyExtra || ''}`;
    if (replayCache.has(replayKey)) return false; // 재사용
    replayCache.set(replayKey, Date.now());
    return true;
  } catch {
    return false;
  }
}
