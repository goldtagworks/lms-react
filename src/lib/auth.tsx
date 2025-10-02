import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { UserRole } from './nav';

type User = { id: string; name: string; email: string; role: UserRole } | null;

interface AuthContextValue {
    user: User;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (name: string, email: string, password: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'lms_auth_token';
const USER_KEY = 'lms_user_profile';

// API 엔드포인트 (Supabase 연결 전까지 로컬 스토리지 기반)
const AUTH_API = {
    login: async (email: string, password: string) => {
        // TODO: 실제 API 호출로 교체
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 임시 검증 로직 (실제 서비스에서는 서버에서 처리)
        if (!email || !password) {
            throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        if (password.length < 6) {
            throw new Error('비밀번호는 6자 이상이어야 합니다.');
        }

        // 임시 역할 할당 (실제로는 서버에서 반환)
        let role: UserRole = 'student';

        if (email.includes('admin')) role = 'admin';
        else if (email.includes('instructor') || email.includes('teacher')) role = 'instructor';

        const token = `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const user = {
            id: `user_${Date.now()}`,
            name: email.split('@')[0],
            email,
            role
        };

        return { token, user };
    },

    register: async (name: string, email: string, password: string) => {
        // TODO: 실제 API 호출로 교체
        await new Promise((resolve) => setTimeout(resolve, 700));

        if (!name || !email || !password) {
            throw new Error('모든 필드를 입력해주세요.');
        }

        if (password.length < 6) {
            throw new Error('비밀번호는 6자 이상이어야 합니다.');
        }

        // 이메일 중복 체크 (임시)
        const existingUser = localStorage.getItem(`user_${email}`);

        if (existingUser) {
            throw new Error('이미 가입된 이메일입니다.');
        }

        const token = `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const user = {
            id: `user_${Date.now()}`,
            name,
            email,
            role: 'student' as UserRole
        };

        // 임시 저장 (실제로는 서버 DB에 저장)
        localStorage.setItem(`user_${email}`, JSON.stringify(user));

        return { token, user };
    },

    verifyToken: async (token: string) => {
        // TODO: 실제 JWT 검증으로 교체
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!token || !token.startsWith('jwt_')) {
            throw new Error('Invalid token');
        }

        // 임시: localStorage에서 사용자 정보 복원
        const userString = localStorage.getItem(USER_KEY);

        if (!userString) {
            throw new Error('User not found');
        }

        return JSON.parse(userString);
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);

                if (token) {
                    const userData = await AUTH_API.verifyToken(token);

                    setUser(userData);
                }
            } catch {
                // 토큰이 유효하지 않으면 로그아웃 처리
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);

            const { token, user } = await AUTH_API.login(email, password);

            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            setUser(user);
        } catch (err) {
            const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';

            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);

            const { token, user } = await AUTH_API.register(name, email, password);

            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            setUser(user);
        } catch (err) {
            const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.';

            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setError(null);
    }, []);

    return <AuthContext.Provider value={{ user, login, logout, register, loading, error }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return ctx;
}
