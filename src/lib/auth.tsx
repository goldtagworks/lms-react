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
                setUser(JSON.parse(raw));
            } else {
                // DEV / TEST 전용 강제 역할 주입
                // 사용 방법:
                //   1) URL 파라미터: ?forceRole=admin | instructor | student
                //   2) 혹은 sessionStorage.setItem('dev_force_role','admin'); 후 새로고침
                // 실제 로그인 로직과 혼동되지 않도록 로컬 환경에서만 사용 (프로덕션 제거 대상)
                try {
                    const params = new URLSearchParams(window.location.search);
                    const forceRoleParam = params.get('forceRole');
                    const stored = sessionStorage.getItem('dev_force_role');
                    const forced = (forceRoleParam || stored) as UserRole | null;

                    if (forced && ['admin', 'instructor', 'student'].includes(forced)) {
                        const devUser: User = {
                            id: 'dev-' + forced,
                            name: forced + ' tester',
                            email: forced + '@dev.local',
                            role: forced as UserRole
                        };

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
        const fakeUser = { id: 'u-demo', name: email.split('@')[0] || '사용자', email, role: inferRoleFromEmail(email) || 'student' };

        setUser(fakeUser);
        persist(fakeUser);
    }, []);

    const register = useCallback(async (name: string, email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 400));
        const newUser = { id: 'u-' + Date.now(), name: name || email.split('@')[0] || '사용자', email, role: inferRoleFromEmail(email) || 'student' };

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
