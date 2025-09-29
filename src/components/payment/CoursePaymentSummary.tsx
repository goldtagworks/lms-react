import React from 'react';
import { Text } from '@mantine/core';
import { Course } from '@main/types/course';

/**
 * CoursePaymentSummary
 * 결제 맥락에서 향후 쿠폰/세금(EPP) 상세를 확장할 placeholder.
 * 현재는 단순 mock 정보만 표시.
 */
export function CoursePaymentSummary({ course }: { course: Course }) {
    // TODO: 서버 EPP 응답 구조 반영 시 (할인/쿠폰/세금/통화) 여기서만 UI 확장
    return (
        <Text c="dimmed" size="sm">
            (결제 상세: 향후 쿠폰/세금 계산 UI 위치) - 코스 ID: {course.id}
        </Text>
    );
}

export default CoursePaymentSummary;
