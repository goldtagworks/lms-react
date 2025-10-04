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
    const desiredDisplayName = name || email.split('@')[0];

    // 1) 기존 프로필 조회 (역할 보존이 핵심)
    const { data: existing, error: selectError } = await supabase.from('profiles').select('display_name, role').eq('user_id', userId).single();

    if (existing && !selectError) {
        // 이름만 새로 주어진 경우에 한해 display_name 최소 업데이트 (role 은 절대 덮어쓰지 않음)
        if (name && existing.display_name !== desiredDisplayName) {
            await supabase.from('profiles').update({ display_name: desiredDisplayName }).eq('user_id', userId);

            return { display_name: desiredDisplayName, role: existing.role as UserRole };
        }

        return { display_name: existing.display_name ?? desiredDisplayName, role: existing.role as UserRole };
    }

    // 2) 없으면 새로 생성 (기본 student). 관리자 계정은 별도 수동/관리 프로세스로 승격됨.
    const { data: inserted, error: insertError } = await supabase.from('profiles').insert({ user_id: userId, display_name: desiredDisplayName, role: 'student' }).select('display_name, role').single();

    if (insertError || !inserted) {
        return { display_name: desiredDisplayName, role: 'student' };
    }

    return { display_name: inserted.display_name, role: inserted.role as UserRole };
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
            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user;

            if (!sessionUser) {
                setUser(null);

                return;
            }

            setUser(mapToAuthUser(sessionUser, null));

            ensureProfile(sessionUser.id, sessionUser.email || '')
                .then((p) => {
                    setUser(mapToAuthUser(sessionUser, p));
                })
                .catch(() => void 0);
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
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                setUser(null);
                setLoading(false);

                return;
            }

            const sessionUser = session.user;

            setUser(mapToAuthUser(sessionUser, null));
            setLoading(false);

            ensureProfile(sessionUser.id, sessionUser.email || '')
                .then((p) => {
                    setUser(mapToAuthUser(sessionUser, p));
                })
                .catch(() => void 0);
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, [loadSession]);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false); // 실패 즉시 해제
            throw error;
        }
        // 성공 시 onAuthStateChange가 loading=false 이미 처리(또는 즉시 처리)
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        setError(null);
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            throw error;
        }

        if (!data.user) {
            setError('확인 메일을 발송했습니다. 이메일 인증 후 로그인하세요.');
            setLoading(false);

            return;
        }
        // onAuthStateChange 에서 처리
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
            // onAuthStateChange 가 user/null 세팅, 여기서는 loading 즉시 해제 (이미 처리되었을 수도 있음)
            setLoading(false);
        }
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
