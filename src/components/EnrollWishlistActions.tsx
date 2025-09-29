import { Group } from '@mantine/core';
import React from 'react';
import { Heart, HeartOff, LogIn, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppButton } from './AppButton';

interface EnrollWishlistActionsProps {
    enrolled: boolean;
    wish: boolean;
    userId?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    onEnroll: () => void;
    onToggleWish: () => void;
    labels?: {
        enroll?: string; // 기본: '신청' / 상세페이지: '수강신청'
        enrolled?: string; // 기본: '수강중'
        loginRequired?: string; // 기본: '로그인'
        wishAdd?: string; // 기본: '담기'  (이전: '위시') → 표준: 찜하기
        wishRemove?: string; // 기본: '담기 취소' (이전: '위시 해제') → 표준: 찜 해제
    };
}

/**
 * 중복된 수강/찜 버튼 패턴을 최소 추상화.
 * - 비즈니스 로직 없음 (repository 호출은 상위에서 전달)
 * - 접근성/라벨 일관 유지
 */
export function EnrollWishlistActions({ enrolled, wish, userId, size = 'xs', onEnroll, onToggleWish, labels }: EnrollWishlistActionsProps) {
    const { t } = useTranslation();
    // 기존 기본 라벨 → i18n 전환 (labels prop 이 전달되면 override)
    const enrollLabel = enrolled ? labels?.enrolled || '수강중' : userId ? labels?.enroll || '신청' : labels?.loginRequired || '로그인';
    const wishLabel = wish ? labels?.wishRemove || t('terms.favoriteRemove') : labels?.wishAdd || t('terms.favoriteAdd');

    // 비로그인 상태: 비활성 버튼 대신 명확한 로그인 유도 클릭 가능한 버튼 렌더
    if (!userId) {
        return (
            <Group grow gap={8}>
                <AppButton href="/signin" label={labels?.loginRequired || '로그인'} leftSection={<LogIn size={14} />} roleName="primary" size={size} />
                <AppButton href="/signin" label={labels?.wishAdd || t('terms.favoriteAdd')} leftSection={<Heart size={14} />} roleName="add" size={size} />
            </Group>
        );
    }

    function handleEnrollClick() {
        if (enrolled) return;
        onEnroll();
    }

    function handleWishClick() {
        onToggleWish();
    }

    return (
        <Group grow gap={8}>
            <AppButton disabled={enrolled} label={enrollLabel} leftSection={<BookOpen size={14} />} roleName="primary" size={size} onClick={handleEnrollClick} />
            <AppButton aria-pressed={wish} label={wishLabel} leftSection={wish ? <HeartOff size={14} /> : <Heart size={14} />} roleName={wish ? 'edit' : 'add'} size={size} onClick={handleWishClick} />
        </Group>
    );
}

export default EnrollWishlistActions;
