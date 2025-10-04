import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from './supabase';
import { UserRole } from './nav';

// Public shape consumed by UI
export type AuthUser = { id: string; name: string; email: string; role: UserRole } | null;

interface AuthContextValue {
    user: AuthUser;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------- Internal helpers ----------
async function ensureProfile(userId: string, email: string, name?: string): Promise<{ display_name: string | null; role: UserRole }> {
    const display_name = name || email.split('@')[0];

    const { data, error } = await supabase.from('profiles').upsert({ user_id: userId, display_name, role: 'student' }, { onConflict: 'user_id' }).select('display_name,role').single();

    if (error || !data) {
        return { display_name, role: 'student' };
    }

    return { display_name: data.display_name, role: data.role as UserRole };
}

function mapToAuthUser(sessionUser: any, profile: { display_name: string | null; role: UserRole } | null): AuthUser {
    if (!sessionUser) return null;

    return {
        id: sessionUser.id,
        email: sessionUser.email,
        name: profile?.display_name || sessionUser.email?.split('@')[0] || 'User',
        role: profile?.role || 'student'
    };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSession = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session?.user) {
                setUser(null);

                return;
            }

            const profile = await ensureProfile(data.session.user.id, data.session.user.email || '');

            setUser(mapToAuthUser(data.session.user, profile));
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 초기 세션 로드
        loadSession();

        // 세션 변경 구독
        const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!session?.user) {
                setUser(null);
                setLoading(false);

                return;
            }

            setLoading(true);
            try {
                const profile = await ensureProfile(session.user.id, session.user.email || '');

                setUser(mapToAuthUser(session.user, profile));
            } catch {
                setUser(mapToAuthUser(session.user, null));
            } finally {
                setLoading(false);
            }
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, [loadSession]);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            throw error;
        }
        // 성공하면 onAuthStateChange에서 자동 처리
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        setError(null);
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            throw error;
        }

        if (!data.user) {
            setError('확인 메일을 발송했습니다. 이메일 인증 후 로그인하세요.');

            return;
        }
        // 성공하면 onAuthStateChange에서 자동 처리
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;
        } catch (e: any) {
            setError(e.message || '로그아웃 실패');
        } finally {
            setLoading(false);
        }
        // onAuthStateChange에서 자동으로 user null 설정됨
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        await loadSession();
    }, [loadSession]);

    const value: AuthContextValue = {
        user,
        loading,
        error,
        login,
        logout,
        register,
        refresh
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);

    if (!ctx) throw new Error('useAuth must be used within AuthProvider');

    return ctx;
}
