/* i18n-ignore-start (dev-only quick navigation panel literals intentionally excluded) */
import React, { useState } from 'react';
import { Paper, Stack, Anchor, Text, Box, Badge, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';
import { t } from '@main/lib/i18n';

// 간단한 텍스트 아이콘 (외부 아이콘 패키지 제거)
function CollapseIcon({ open }: { open: boolean }) {
    return <span style={{ fontSize: 12, lineHeight: 1 }}>{open ? '▾' : '▴'}</span>;
}

/**
 * DevQuickNav
 * 개발/데모 환경에서만 노출되는 빠른 이동 패널.
 * - production 번들에서는 import.meta.env.DEV 조건으로 자동 비표시
 * - 접근성: toggle 버튼에 aria-expanded / aria-controls 제공
 * - i18n 전환 후: dev 전용라벨이므로 namespace JSON에 미등재 (프로덕션 노출 제거 전제)
 */
export function DevQuickNav() {
    const { user } = useAuth();
    const [open, setOpen] = useState(true);

    // Jest 환경 등 import.meta가 없을 수 있으므로 안전 가드
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev) return null; // dev 전용

    return (
        <Paper
            withBorder
            aria-label={t('a11y.devQuickNav')}
            p="xs"
            radius="md"
            shadow="sm"
            style={{ position: 'fixed', bottom: 16, right: 16, width: open ? 240 : 48, zIndex: 400, transition: 'width 120ms ease' }}
        >
            <Stack gap={6} id="dev-quick-nav" style={{ overflow: 'hidden' }}>
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {open && (
                        <Box>
                            <Text fw={600} mb={4} size="xs">
                                데모 빠른 이동
                            </Text>
                            <Badge color="blue" size="xs" variant="light">
                                GUIDE
                            </Badge>
                        </Box>
                    )}
                    <Tooltip withArrow label={open ? t('a11y.collapse') : t('a11y.expand')} position="left">
                        <ActionIcon aria-label={open ? t('a11y.panelCollapse') : t('a11y.panelExpand')} size="sm" variant="subtle" onClick={() => setOpen((o) => !o)}>
                            <CollapseIcon open={open} />
                        </ActionIcon>
                    </Tooltip>
                </Box>
                {open && (
                    <Stack gap={4} style={{ maxHeight: 380, overflowY: 'auto' }}>
                        <SectionLabel label="코어" />
                        <QuickLink label="홈" to="/" />
                        <QuickLink label="코스 목록" to="/courses" />
                        <QuickLink label="코스 상세 c1" to="/course/c1" />
                        <QuickLink label="공지 목록" to="/notices" />
                        <QuickLink label="공지 상세 예" to="/notices/n1" />
                        <Divider my={4} />
                        <SectionLabel label="가입/인증" />
                        <QuickLink label="회원가입" to="/signup" />
                        <QuickLink label="로그인" to="/signin" />
                        <QuickLink label="비밀번호 재설정" to="/password/reset" />
                        <QuickLink label="비밀번호 변경" to="/password/change" />
                        {!user && (
                            <Text c="dimmed" size="10px">
                                (비로그인 상태)
                            </Text>
                        )}
                        <Divider my={4} />
                        <SectionLabel label="강사" />
                        <QuickLink label="샘플 강사 프로필" to="/instructor/inst-1" />
                        <QuickLink label="강사 신청" to="/instructor/apply" />
                        <QuickLink label="내 강좌 관리" to="/instructor/courses" />
                        <QuickLink label="새 강좌 작성" to="/instructor/courses/new" />
                        <QuickLink label="강좌 c1 편집" to="/instructor/courses/c1/edit" />
                        <Divider my={4} />
                        <SectionLabel label="수강 & 결제" />
                        <QuickLink label="수강 신청 c1" to="/enroll/c1" />
                        <QuickLink label="결제 c1" to="/payment/c1" />
                        <QuickLink label="결제 성공" to="/payment/success" />
                        <QuickLink label="결제 실패" to="/payment/fail" />
                        <Divider my={4} />
                        <SectionLabel label="학습" />
                        <QuickLink label="레슨 플레이어 (enr-1/l-1)" to="/enrollments/enr-1/lessons/l-1" />
                        <QuickLink label="시험 e1" to="/exam/e1" />
                        <QuickLink label="시험 시도 e1" to="/exam/e1/attempt" />
                        <QuickLink label="시험 결과 e1" to="/exam/e1/result" />
                        <Divider my={4} />
                        <SectionLabel label="수료" />
                        <QuickLink label="내 수료증 목록" to="/my/certificates" />
                        <QuickLink label="수료증 cert-1" to="/certificate/cert-1" />
                        <Divider my={4} />
                        <SectionLabel label="마이" />
                        <QuickLink label="마이페이지" to="/my" />
                        <QuickLink label="찜한 강의" to="/my/wishlist" />
                        <Divider my={4} />
                        <SectionLabel label="관리자" />
                        <QuickLink label="대시보드" to="/admin/dashboard" />
                        <QuickLink label="사용자 관리" to="/admin/users" />
                        <QuickLink label="시험 관리" to="/admin/exams" />
                        <QuickLink label="시험 생성" to="/admin/exams/create" />
                        <QuickLink label="시험 e1 편집" to="/admin/exams/e1/edit" />
                        <QuickLink label="시험 e1 문제" to="/admin/exams/e1/questions" />
                        <QuickLink label="강사 신청 관리" to="/admin/instructors/apps" />
                        <QuickLink label="쿠폰 관리" to="/admin/coupons" />
                        <QuickLink label="카테고리 관리" to="/admin/categories" />
                        <QuickLink label="수료증 관리" to="/admin/certificates" />
                        <QuickLink label="고객지원 관리" to="/admin/support" />
                        <QuickLink label="(Admin) 강좌 c1 편집" to="/admin/courses/c1/edit" />
                        <Divider my={4} />
                        <SectionLabel label="고객지원" />
                        <QuickLink label="지원 티켓 목록" to="/support" />
                        <QuickLink label="새 지원 요청" to="/support/new" />
                        <QuickLink label="지원 티켓 s1" to="/support/s1" />
                        <Divider my={4} />
                        <SectionLabel label="기타" />
                        <QuickLink label="FAQ" to="/faq" />
                        <QuickLink label="이용약관" to="/terms" />
                        <QuickLink label="개인정보처리방침" to="/privacy" />
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <Text c="blue.6" fw={600} size="10px" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
        </Text>
    );
}

function QuickLink({ label, to }: { label: string; to: string }) {
    return (
        <Anchor component={Link} size="xs" style={{ whiteSpace: 'nowrap' }} title={to} to={to}>
            {label}
        </Anchor>
    );
}

export default DevQuickNav;
/* i18n-ignore-end */
