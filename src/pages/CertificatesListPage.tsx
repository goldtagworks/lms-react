import { Button, Group, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { useAuth } from '@main/lib/auth';
import { useCourses, useEnrollmentsState, issueCertificate, useCertificates } from '@main/lib/repository';
import CourseGrid from '@main/components/layout/CourseGrid';
import CertificateCard from '@main/components/CertificateCard';
import { notifications } from '@mantine/notifications';

// 임시: 수료증 파생 로직 (실제 구현 전까지)
// 이전 파생 목업 로직 제거: 실제 issueCertificate + useCertificates 사용

const CertificatesListPage = () => {
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
        courseTitle: courseMap[c.enrollment_id.split('-').slice(-1)[0]] || '수료 강의'
    }));

    const handleIssueOne = () => {
        if (!userId) return;
        const enrollment = enrollments[0];

        if (!enrollment) {
            notifications.show({ color: 'yellow', message: '수강 중인 강의가 없어 수료증을 발급할 수 없습니다.', title: '발급 불가' });

            return;
        }
        const courseId = enrollment.course_id;
        const attemptId = 'attempt-' + Date.now().toString(36); // 목업 시험 시도 ID
        const cert = issueCertificate({ enrollment_id: enrollment.id, exam_attempt_id: attemptId, user_id: userId, course_id: courseId });

        notifications.show({ color: 'teal', message: '수료증이 발급되었습니다: ' + cert.serial_no, title: '발급 완료' });
    };

    return (
        <PageContainer roleMain>
            <PageHeader
                actions={
                    userId && (
                        <Group gap="xs">
                            <Button size="xs" variant="light" onClick={handleIssueOne}>
                                수료증 발급(목업)
                            </Button>
                        </Group>
                    )
                }
                description="발급된 수료증을 모아보고 PDF로 저장하거나 검증 코드를 활용할 수 있습니다. 시험 합격 시 실제 발급 로직으로 대체됩니다."
                title="내 수료증"
            />
            {!userId && <EmptyState actionLabel="로그인" message="로그인 후 수료증을 확인할 수 있습니다." title="로그인 필요" to="/signin" />}
            {userId && certs.length === 0 && <EmptyState actionLabel="강의 둘러보기" message="합격한 시험이 아직 없어 수료증이 없습니다." title="수료증 없음" to="/courses" />}
            {userId && certs.length > 0 && (
                <CourseGrid mt="md">
                    {certs.map((c) => (
                        <CertificateCard key={c.id} courseTitle={c.courseTitle} id={c.id} issuedAt={c.issued_at} pdfPath={c.pdf_path} serialNo={c.serial_no} />
                    ))}
                </CourseGrid>
            )}
            {userId && (
                <Text c="dimmed" mt="lg" size="xs">
                    (목업) 발급 버튼은 첫 번째 수강중 강의를 기준으로 멱등 발급됩니다. 이미 동일 수강신청에 수료증이 있으면 재사용합니다.
                </Text>
            )}
        </PageContainer>
    );
};

export default CertificatesListPage;
