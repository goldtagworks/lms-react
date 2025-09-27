import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { UserRole, inferRoleFromEmail } from './nav';

type User = { id: string; name: string; email: string; role: UserRole } | null;

interface AuthContextValue {
    user: User;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (name: string, email: string, password: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_KEY = 'demo-auth-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);

            if (raw) {
                let parsed: User = JSON.parse(raw);
                // 임시 강사 강제: goldtag 포함 시 instructor 고정

                if (parsed && (parsed.email?.startsWith('goldtag') || parsed.email?.includes('goldtag') || parsed.name?.includes('goldtag'))) {
                    parsed = { ...parsed, role: 'instructor' };
                }
                setUser(parsed);
            } else {
                // DEV / TEST 전용 강제 역할 주입 (forceRole 파라미터)
                try {
                    const params = new URLSearchParams(window.location.search);
                    const forceRoleParam = params.get('forceRole');
                    const stored = sessionStorage.getItem('dev_force_role');
                    const forced = (forceRoleParam || stored) as UserRole | null;

                    if (forced && ['admin', 'instructor', 'student'].includes(forced)) {
                        let devUser: User = { id: 'dev-' + forced, name: forced + ' tester', email: forced + '@dev.local', role: forced as UserRole };

                        if (devUser.email.includes('goldtag') || devUser.name.includes('goldtag')) devUser = { ...devUser, role: 'instructor' };
                        setUser(devUser);
                    }
                } catch {
                    // ignore
                }
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    const persist = (u: User) => {
        if (u) {
            localStorage.setItem(LS_KEY, JSON.stringify(u));
        } else {
            localStorage.removeItem(LS_KEY);
        }
    };

    const login = useCallback(async (email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 300));
        const namePart = email.split('@')[0];
        let mapped: UserRole | null = inferRoleFromEmail(email);

        if (!mapped) {
            if (namePart === 'admin') mapped = 'admin';
            else if (namePart === 'goldtag' || email.includes('goldtag')) mapped = 'instructor';
        }
        const fakeUser = { id: 'u-' + namePart, name: namePart || '사용자', email, role: mapped || 'student' };

        if (fakeUser.email.startsWith('goldtag') || fakeUser.email.includes('goldtag') || fakeUser.name.includes('goldtag')) fakeUser.role = 'instructor';
        setUser(fakeUser);
        persist(fakeUser);
    }, []);

    const register = useCallback(async (name: string, email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 400));
        const namePart = email.split('@')[0];
        let mapped: UserRole | null = inferRoleFromEmail(email);

        if (!mapped) {
            if (namePart === 'admin') mapped = 'admin';
            else if (namePart === 'goldtag' || email.includes('goldtag')) mapped = 'instructor';
        }
        let newUser = { id: 'u-' + Date.now(), name: name || namePart || '사용자', email, role: mapped || 'student' };

        if (newUser.email.startsWith('goldtag') || newUser.email.includes('goldtag') || newUser.name.includes('goldtag')) newUser = { ...newUser, role: 'instructor' };
        setUser(newUser);
        persist(newUser);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        persist(null);
    }, []);

    return <AuthContext.Provider value={{ user, login, logout, register, loading }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return ctx;
}
