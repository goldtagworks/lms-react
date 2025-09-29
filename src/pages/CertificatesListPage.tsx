import { Button, Group, Text, Card, Stack, Badge } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { useI18n } from '@main/lib/i18n';
import { useAuth } from '@main/lib/auth';
import { useState, useEffect } from 'react';
import PaginationBar from '@main/components/PaginationBar';
import { useCourses, useEnrollmentsState, issueCertificate, useCertificates } from '@main/lib/repository';
import CourseGrid from '@main/components/layout/CourseGrid';
import CertificateCard from '@main/components/CertificateCard';
import { notifications } from '@mantine/notifications';

// 임시: 수료증 파생 로직 (실제 구현 전까지)
// 이전 파생 로직 제거: 실제 issueCertificate + useCertificates 사용

const CertificatesListPage = () => {
    const { t } = useI18n();
    const { user } = useAuth();
    const userId = user?.id;
    const enrollments = useEnrollmentsState(userId);
    const courses = useCourses();
    const courseMap: Record<string, string> = {};

    courses.forEach((c) => {
        courseMap[c.id] = c.title;
    });

    const rawCerts = useCertificates(userId);
    const certs = rawCerts.map((c) => ({
        ...c,
        courseTitle: courseMap[c.enrollment_id.split('-').slice(-1)[0]] || t('certificate.title')
    }));
    const PAGE_SIZE = 12;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(certs.length / PAGE_SIZE));
    const paged = certs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleIssueOne = () => {
        if (!userId) return;
        const enrollment = enrollments[0];

        if (!enrollment) {
            notifications.show({ color: 'yellow', message: t('empty.certificateIssueBlocked'), title: t('errors.blocked') });

            return;
        }
        const courseId = enrollment.course_id;
        const attemptId = 'attempt-' + Date.now().toString(36); // 임시 시험 시도 ID
        const cert = issueCertificate({ enrollment_id: enrollment.id, exam_attempt_id: attemptId, user_id: userId, course_id: courseId });

        notifications.show({ color: 'teal', message: t('certificate.issued') + ': ' + cert.serial_no, title: t('certificate.issued') });
    };

    return (
        <PageContainer roleMain>
            <PageHeader
                actions={
                    userId && (
                        <Group gap="xs">
                            <Button size="sm" variant="light" onClick={handleIssueOne}>
                                {t('empty.issueCertificate')}
                            </Button>
                        </Group>
                    )
                }
                description={t('empty.certificatesIntro')}
                title={t('nav.myCertificates')}
            />
            <Card withBorder p="lg" radius="md" shadow="sm">
                <Stack gap="md">
                    <Group align="center" justify="space-between">
                        <Text fw={700} size="lg">
                            {t('empty.certificatesHeader')}
                        </Text>
                        {userId && certs.length > 0 && (
                            <Badge color="indigo" variant="light">
                                {certs.length}개
                            </Badge>
                        )}
                    </Group>
                    {!userId && <EmptyState actionLabel={t('common.login')} message={t('empty.certificatesLoginNeeded')} title={t('empty.loginRequired')} to="/signin" />}
                    {userId && certs.length === 0 && <EmptyState actionLabel={t('empty.exploreCourses')} message={t('empty.certificatesNone')} title={t('empty.certificatesEmpty')} to="/courses" />}
                    {userId && certs.length > 0 && (
                        <CourseGrid mt="md">
                            {paged.map((c) => (
                                <CertificateCard key={c.id} courseTitle={c.courseTitle} id={c.id} issuedAt={c.issued_at} pdfPath={c.pdf_path} serialNo={c.serial_no} />
                            ))}
                        </CourseGrid>
                    )}
                    {userId && (
                        <Text c="dimmed" mt="sm" size="sm">
                            {t('empty.certificateIssueNote')}
                        </Text>
                    )}
                    <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default CertificatesListPage;
