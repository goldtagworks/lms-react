import { useEffect, useState } from 'react';
import { Card, Stack, Text, Title, Badge, Group, Button, Alert, Divider } from '@mantine/core';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Trophy, FileText, Home } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import useExam from '@main/hooks/useExam';
import { useCertificateByEnrollment, useIssueCertificate } from '@main/hooks/useCertificate';
import { getExamResult, type ExamGradeResult } from '@main/services/examService';

export default function ExamResultPage() {
    const { examId } = useParams();
    const location = useLocation();
    const [result, setResult] = useState<ExamGradeResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { data: exam } = useExam(examId);

    // TODO: 실제 enrollmentId 가져오기 (현재는 임시값)
    const enrollmentId = 'temp-enrollment-id';

    const { data: existingCertificate } = useCertificateByEnrollment(enrollmentId);
    const issueCertificateMutation = useIssueCertificate();

    const handleIssueCertificate = async () => {
        if (!result?.attemptId) return;

        try {
            await issueCertificateMutation.mutateAsync({
                enrollmentId,
                examAttemptId: result.attemptId
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('수료증 발급 오류:', error);
        }
    };

    useEffect(() => {
        // location.state에서 결과 데이터 가져오기 (ExamAttemptPage에서 전달)
        const stateResult = location.state?.result as ExamGradeResult;

        if (stateResult) {
            setResult(stateResult);
            setIsLoading(false);
        } else if (location.state?.attemptId) {
            // attemptId가 있으면 API에서 결과 조회
            const attemptId = location.state.attemptId as string;

            getExamResult(attemptId).then((data) => {
                setResult(data);
                setIsLoading(false);
            });
        } else {
            // 결과 데이터가 없으면 로딩 종료
            setIsLoading(false);
        }
    }, [location]);

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>결과를 확인하는 중...</Text>
            </PageContainer>
        );
    }

    if (!result || !exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="결과를 찾을 수 없습니다">
                    시험 결과를 불러올 수 없습니다.
                </Alert>
            </PageContainer>
        );
    }

    const { score, passed, totalQuestions, correctCount } = result;

    return (
        <PageContainer roleMain py={48} size="sm">
            <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="sm">
                <Stack align="center" gap="xl">
                    {/* 결과 헤더 */}
                    <Group>
                        <Trophy color={passed ? '#51cf66' : '#ff6b6b'} size={32} />
                        <Title c={passed ? 'green' : 'red'} order={1}>
                            {passed ? '합격' : '불합격'}
                        </Title>
                    </Group>

                    {/* 점수 표시 */}
                    <Stack align="center" gap="sm">
                        <Title order={2}>{score}점</Title>
                        <Text c="dimmed">합격 기준: {exam.pass_score}점</Text>
                        <Badge color={passed ? 'green' : 'red'} size="lg" variant={passed ? 'filled' : 'light'}>
                            {passed ? '축하합니다!' : '다시 도전하세요'}
                        </Badge>
                    </Stack>

                    <Divider w="100%" />

                    {/* 상세 정보 */}
                    <Stack gap="md" w="100%">
                        <Group justify="space-between">
                            <Text>시험명</Text>
                            <Text fw={500}>{exam.title}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text>총 문제 수</Text>
                            <Text fw={500}>{totalQuestions}문제</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text>정답 수</Text>
                            <Text c={passed ? 'green' : 'red'} fw={500}>
                                {correctCount}문제
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text>정답률</Text>
                            <Text fw={500}>{Math.round((correctCount / totalQuestions) * 100)}%</Text>
                        </Group>
                    </Stack>

                    <Divider w="100%" />

                    {/* 액션 버튼 */}
                    <Stack gap="md" w="100%">
                        {passed ? (
                            <>
                                {existingCertificate ? (
                                    <Button component={Link} leftSection={<FileText size={16} />} size="lg" to="/my/certificates" variant="filled">
                                        수료증 확인하기
                                    </Button>
                                ) : (
                                    <Button leftSection={<FileText size={16} />} loading={issueCertificateMutation.isPending} size="lg" variant="filled" onClick={handleIssueCertificate}>
                                        수료증 발급받기
                                    </Button>
                                )}
                                <Button component={Link} leftSection={<Home size={16} />} to="/my" variant="outline">
                                    마이페이지로
                                </Button>
                            </>
                        ) : (
                            <>
                                <Alert color="orange" title="재응시 안내">
                                    <Text size="sm">24시간 후 재응시가 가능합니다. 복습 후 다시 도전해보세요!</Text>
                                </Alert>
                                <Button component={Link} leftSection={<Home size={16} />} to="/my" variant="outline">
                                    마이페이지로
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>
            </Card>
        </PageContainer>
    );
}
