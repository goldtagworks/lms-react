import { Alert, Badge, Box, Button, Card, CopyButton, Divider, Grid, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { findCertificateById, getAttemptMeta, upsertAttemptMeta, useCertificate, useCourses } from '@main/lib/repository';
import { openCertificatePrintView } from '@main/lib/certificatePrint';
import { useEffect, useMemo } from 'react';

// (임시) 방문 시 샘플 attempt 메타 자동 주입: 실제 구현에서는 채점 완료 시 저장
function ensureSampleAttemptMeta(certId: string | undefined) {
    if (!certId) return;
    const cert = findCertificateById(certId);

    if (cert && !getAttemptMeta(cert.exam_attempt_id)) {
        // 가변 데모 점수
        const score = 92;
        const pass = 70;

        upsertAttemptMeta(cert.exam_attempt_id, { exam_title: '최종 종합 평가', pass_score: pass, passed: score >= pass, score });
    }
}

const CertificatePage = () => {
    const { id } = useParams();
    const cert = useCertificate(id);
    const courses = useCourses();

    useEffect(() => {
        ensureSampleAttemptMeta(id);
    }, [id]);

    const attemptMeta = getAttemptMeta(cert?.exam_attempt_id);
    const courseTitle = useMemo(() => {
        if (!cert) return '';
        // enrollment_id 패턴: enr-... -> course id 추출 불가(현재 스키마로 직접 매핑 없음). 데모: 전체 중 첫 번째 코스명 or placeholder.
        // 실제 구현 시 certificate -> enrollment -> course join 필요.

        return courses[0]?.title || '수료 강의';
    }, [cert, courses]);

    if (!id) {
        return (
            <PageContainer roleMain>
                <Alert color="red" title="잘못된 경로">
                    수료증 ID가 제공되지 않았습니다.
                </Alert>
            </PageContainer>
        );
    }

    if (!cert) {
        return (
            <PageContainer roleMain>
                <Alert color="yellow" title="수료증 없음">
                    해당 ID의 수료증을 찾을 수 없습니다. 목록에서 다시 시도해주세요.
                </Alert>
            </PageContainer>
        );
    }

    const passed = attemptMeta?.passed;
    const scoreText = attemptMeta?.score != null ? `${attemptMeta.score}점` : '—';
    const passScoreText = attemptMeta?.pass_score != null ? `${attemptMeta.pass_score}점` : '—';

    return (
        <PageContainer roleMain>
            <PageHeader description="데모 환경 수료증 상세입니다. 실제 서비스에서는 검증 코드 및 시험 세부 이력이 표시됩니다." title="수료증" />
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack gap="lg">
                    <Group align="flex-start" justify="space-between">
                        <div>
                            <Title order={3}>{courseTitle}</Title>
                            <Group gap="xs" mt={8}>
                                {passed != null && (
                                    <Badge color={passed ? 'teal' : 'red'} variant="light">
                                        {passed ? '합격' : '불합격'}
                                    </Badge>
                                )}
                                <Badge variant="outline">데모</Badge>
                            </Group>
                        </div>
                        <Group gap="xs">
                            <Button component={Link} size="xs" to="/my/certificates" variant="light">
                                목록으로
                            </Button>
                            <Button component={Link} size="xs" to="/my" variant="outline">
                                마이페이지
                            </Button>
                        </Group>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="xs">
                                    일련번호
                                </Text>
                                <Group gap="xs" wrap="nowrap">
                                    <Text fw={500}>{cert.serial_no}</Text>
                                    <CopyButton timeout={1500} value={cert.serial_no}>
                                        {({ copied, copy }) => (
                                            <Tooltip withArrow label={copied ? '복사됨' : '복사'}>
                                                <Button color={copied ? 'teal' : 'gray'} size="xs" variant={copied ? 'filled' : 'light'} onClick={copy}>
                                                    {copied ? '복사됨' : '복사'}
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="xs">
                                    발급일
                                </Text>
                                <Text fw={500}>{new Date(cert.issued_at).toLocaleString()}</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="xs">
                                    점수 / 합격기준
                                </Text>
                                <Text fw={500}>
                                    {scoreText} / {passScoreText}
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="xs">
                                    시험명
                                </Text>
                                <Text fw={500}>{attemptMeta?.exam_title || '—'}</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Box mt="sm">
                                <Button size="xs" variant="filled" onClick={() => openCertificatePrintView({ certificate: cert, courseTitle })}>
                                    PDF 다운로드
                                </Button>
                            </Box>
                        </Grid.Col>
                    </Grid>
                    <Alert color="gray" title="데모 안내" variant="light">
                        이 수료증 데이터는 로컬 세션 스토리지에만 저장되며 실제 검증 기능/예비 위변조 방지 요소는 포함되어 있지 않습니다.
                    </Alert>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default CertificatePage;
