import { Group } from '@mantine/core';
import React from 'react';
import { Heart, HeartOff, LogIn, BookOpen, Play } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

import { AppButton } from './AppButton';

interface EnrollWishlistActionsProps {
    enrolled: boolean;
    wish: boolean;
    userId?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    onEnroll: () => void;
    onToggleWish: () => void;
    onStartLearning?: () => void; // 학습 시작 핸들러 추가
    labels?: {
        enroll?: string; // 기본: '신청' / 상세페이지: '수강신청'
        enrolled?: string; // 기본: '수강중'
        startLearning?: string; // 기본: '학습 시작'
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
export function EnrollWishlistActions({ enrolled, wish, userId, size = 'xs', onEnroll, onToggleWish, onStartLearning, labels }: EnrollWishlistActionsProps) {
    const { t } = useI18n();

    // 기존 기본 라벨 → i18n 전환 (labels prop 이 전달되면 override)
    let enrollLabel: string;

    if (enrolled) {
        enrollLabel = labels?.startLearning || t('enroll.startLearning', undefined, '학습 시작');
    } else if (userId) {
        enrollLabel = labels?.enroll || t('enroll.apply', undefined, '신청');
    } else {
        enrollLabel = labels?.loginRequired || t('enroll.login', undefined, '로그인');
    }

    const wishLabel = wish ? labels?.wishRemove || t('common.favorite.remove') : labels?.wishAdd || t('common.favorite.add');

    // 비로그인 상태: 비활성 버튼 대신 명확한 로그인 유도 클릭 가능한 버튼 렌더
    if (!userId) {
        return (
            <Group grow gap={8}>
                <AppButton href="/signin" label={labels?.loginRequired || t('enroll.login', undefined, '로그인')} leftSection={<LogIn size={14} />} roleName="primary" size={size} />
                <AppButton href="/signin" label={labels?.wishAdd || t('common.favorite.add')} leftSection={<Heart size={14} />} roleName="add" size={size} />
            </Group>
        );
    }

    function handleEnrollClick() {
        if (enrolled && onStartLearning) {
            onStartLearning();
        } else if (!enrolled) {
            onEnroll();
        }
    }

    function handleWishClick() {
        onToggleWish();
    }

    return (
        <Group grow gap={8}>
            <AppButton label={enrollLabel} leftSection={enrolled ? <Play size={14} /> : <BookOpen size={14} />} roleName="primary" size={size} onClick={handleEnrollClick} />
            <AppButton aria-pressed={wish} label={wishLabel} leftSection={wish ? <HeartOff size={14} /> : <Heart size={14} />} roleName={wish ? 'edit' : 'add'} size={size} onClick={handleWishClick} />
        </Group>
    );
}

export default EnrollWishlistActions;
