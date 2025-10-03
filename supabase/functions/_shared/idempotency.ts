// Simple Postgres-backed idempotency (placeholder). In production, wrap with proper error handling.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface IdempotencyReservation {
  cached: boolean;
  key_hash: string;
  result?: any;
}

// Step1: Reserve (insert empty row). If exists → cached=true
export async function reserveIdempotent(supabaseUrl: string, serviceKey: string, scope: string, key: string): Promise<IdempotencyReservation> {
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const key_hash = await sha256(scope + ':' + key);
  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('scope', scope)
    .eq('key_hash', key_hash)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    return { cached: true, key_hash, result: data.first_result };
  }
  const { error: insertErr } = await supabase.from('idempotency_keys').insert({ scope, key_hash });
  if (insertErr) throw insertErr;
  return { cached: false, key_hash };
}

// Step2: Finalize (store first_result only if null)
export async function finalizeIdempotent(supabaseUrl: string, serviceKey: string, scope: string, key_hash: string, result: any) {
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('scope', scope)
    .eq('key_hash', key_hash)
    .maybeSingle();
  if (error) throw error;
  if (data && data.first_result) return; // already set
  await supabase.from('idempotency_keys').update({ first_result: result }).eq('scope', scope).eq('key_hash', key_hash);
}

async function sha256(input: string) {
  const enc = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
}
