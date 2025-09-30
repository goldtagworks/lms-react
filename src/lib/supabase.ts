// Supabase client 초기화 (단일 인스턴스)
// 주: 실제 프로젝트에서는 env 안전성/SSR 고려 필요. 여기서는 클라이언트 사이드 최소 설정.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true }
});

export type SupabaseClientType = typeof supabase;
