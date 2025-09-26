/**
 * 사용자 프로필 및 역할 정보
 */
export const UserRole = ['admin', 'instructor', 'learner'] as const;
/**
 * 사용자 역할 타입
 */
export type UserRole = (typeof UserRole)[number];

/**
 * 사용자 프로필
 */
export interface Profile {
    /** 사용자 고유 ID (auth.users.id) */
    user_id: string;
    /** 역할(admin|instructor|learner) */
    role: UserRole;
    /** 이름 */
    full_name?: string;
    /** 한 줄 소개 */
    headline?: string;
    /** 자기소개(마크다운) */
    bio?: string;
    /** 웹사이트 URL */
    website_url?: string;
    /** 소셜 링크(jsonb) */
    social_links?: any;
    /** 언어/로케일 */
    locale?: string;
    /** 아바타 이미지 URL */
    avatar_url?: string;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}
