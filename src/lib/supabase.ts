// -------------------------------------------------------------
// File: src/lib/supabase/client.ts
// -------------------------------------------------------------
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const oauthLogin = localStorage.getItem('oauth_login') === 'true';
const keepLoggedIn = localStorage.getItem('auth_pref_keep_logged_in') === 'true';

const supabase: SupabaseClient = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: oauthLogin ? localStorage : keepLoggedIn ? localStorage : sessionStorage
    },
    global: {
        headers: { 'x-app-name': '', 'x-site': '' }
    }
});

export type { Session };
export { supabase };
