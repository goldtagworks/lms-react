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
async function fetchProfile(userId: string): Promise<{ display_name: string | null; role: UserRole } | null> {
    const { data, error } = await supabase.from('profiles').select('display_name,role').eq('user_id', userId).maybeSingle();

    if (error) {
        // eslint-disable-next-line no-console
        console.warn('[auth] fetchProfile error', error);

        return null;
    }
    if (!data) return null;
    const role = (data.role as UserRole) || 'student';

    return { display_name: data.display_name, role };
}

async function ensureProfile(userId: string, email: string, name?: string): Promise<{ display_name: string | null; role: UserRole }> {
    const existing = await fetchProfile(userId);

    if (existing) return existing;
    // 기본 student로 생성
    const display_name = name || email.split('@')[0];
    const insert = { user_id: userId, display_name, role: 'student' as UserRole } as any;
    const { error } = await supabase.from('profiles').insert(insert);

    if (error) {
        // eslint-disable-next-line no-console
        console.error('[auth] ensureProfile insert failed', error);

        return { display_name, role: 'student' };
    }

    return { display_name, role: 'student' };
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

    const resolveSession = useCallback(async () => {
        setLoading(true);
        try {
            const { data: sessionRes } = await supabase.auth.getSession();
            const sessionUser = sessionRes.session?.user || null;

            if (!sessionUser) {
                setUser(null);

                return;
            }
            const profile = await fetchProfile(sessionUser.id);

            setUser(mapToAuthUser(sessionUser, profile));
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[auth] resolveSession error', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 초기 세션 로드
        resolveSession();
        // 세션 변경 구독
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const sessionUser = session?.user || null;

            if (!sessionUser) {
                setUser(null);

                return;
            }
            const profile = await fetchProfile(sessionUser.id);

            setUser(mapToAuthUser(sessionUser, profile));
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, [resolveSession]);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;
            if (!data.session?.user) throw new Error('로그인 실패: 사용자 정보를 찾을 수 없습니다.');
            const profile = await fetchProfile(data.session.user.id);

            setUser(mapToAuthUser(data.session.user, profile));
        } catch (e: any) {
            setError(e.message || '로그인에 실패했습니다.');
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) throw error;
            const sessionUser = data.user; // 이메일 확인 요구 설정일 경우 session 없을 수 있음

            if (!sessionUser) {
                // 이메일 확인 대기 상태
                setUser(null);

                return;
            }
            const profile = await ensureProfile(sessionUser.id, email, name);

            setUser(mapToAuthUser(sessionUser, profile));
        } catch (e: any) {
            setError(e.message || '회원가입에 실패했습니다.');
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;
            setUser(null);
        } catch (e: any) {
            setError(e.message || '로그아웃 실패');
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        await resolveSession();
    }, [resolveSession]);

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
