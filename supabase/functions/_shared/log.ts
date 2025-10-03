// Structured logging utility for Edge Functions (Deno runtime)
// Usage: logEvent({ function_name: 'payments-webhook', event: 'start', request_id })

interface LogMeta { [k: string]: any }

export function logEvent(meta: LogMeta) {
  const base = {
    ts: new Date().toISOString()
  };
  try {
    console.log(JSON.stringify({ ...base, ...meta }));
  } catch {
    console.log('[log-fallback]', meta.event || 'event');
  }
}

export function genRequestId(): string {
  // Simple random; can replace with crypto.randomUUID if supported
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'req_' + Math.random().toString(36).slice(2, 10);
}
